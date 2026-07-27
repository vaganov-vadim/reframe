import { useState, useCallback, useRef } from 'react';

export interface Distortion {
  type: string;
  thought: string;
  why: string;
}

export interface VerticalArrowLevel {
  thought: string;
  label: string;
}

export interface DeepResponse {
  levels: VerticalArrowLevel[];
  reframing: string;
  question?: string;
}

export interface ReframeResponse {
  distortions?: Distortion[];
  levels?: VerticalArrowLevel[];
  reframing: string;
  question: string;
  pattern?: string;
}

export interface SSEState {
  loading: boolean;
  data: ReframeResponse | null;
  error: string | null;
  deepLoading: boolean;
  deepData: DeepResponse | null;
}

const API_TIMEOUT = 10000; // 10s

/** Map HTTP status to user-facing error message per spec §7 */
function errorMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Текст не может быть пустым.';
    case 429:
      return 'Слишком много запросов. Подождите минуту.';
    case 500:
    case 502:
    case 504:
      return 'Не удалось получить ответ. Попробуйте через минуту.';
    default:
      return `Ошибка сервера: ${status}`;
  }
}

export function parseSSEData(line: string): unknown {
  if (!line.startsWith('data: ')) return null;
  const json = line.slice(6);
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useSSE() {
  const [state, setState] = useState<SSEState>({
    loading: false,
    data: null,
    error: null,
    deepLoading: false,
    deepData: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const sendText = useCallback(async (text: string) => {
    setState((prev) => ({ ...prev, loading: true, data: null, error: null }));
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.any([
          abortRef.current.signal,
          AbortSignal.timeout(API_TIMEOUT),
        ]),
      });

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: errorMessageForStatus(response.status),
        }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: 'Streaming не поддерживается',
        }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseSSEData(line);
          if (parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)) {
            setState((prev) => ({
              ...prev,
              loading: false,
              data: null,
              error: (parsed as Record<string, string>).error,
            }));
            return;
          }
          if (parsed && typeof parsed === 'object' && 'reframing' in (parsed as Record<string, unknown>)) {
            setState((prev) => ({ ...prev, data: parsed as ReframeResponse }));
          }
        }
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        data: prev.data?.reframing || prev.data?.distortions?.length
          ? prev.data
          : null,
        error: prev.data?.reframing || prev.data?.distortions?.length
          ? null
          : 'Неожиданная структура ответа.',
      }));
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          loading: false,
          data: prev.data,
          error: prev.data
            ? 'Ответ получен не полностью.'
            : 'Не удалось получить ответ. Попробуйте через минуту.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: 'Ошибка сети. Проверьте подключение.',
        }));
      }
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetDeep = useCallback(() => {
    setState((prev) => ({ ...prev, deepData: null, deepLoading: false }));
  }, []);

  const sendDeepText = useCallback(async (text: string, surface: string) => {
    setState((prev) => ({ ...prev, deepLoading: true, deepData: null, error: null }));
    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/reframe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, mode: 'deeper', surface }),
        signal: AbortSignal.any([
          abortRef.current.signal,
          AbortSignal.timeout(API_TIMEOUT),
        ]),
      });

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: errorMessageForStatus(response.status),
        }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: 'Streaming не поддерживается',
        }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseSSEData(line);
          if (parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)) {
            setState((prev) => ({
              ...prev,
              deepLoading: false,
              error: (parsed as Record<string, string>).error,
            }));
            return;
          }
          if (parsed && typeof parsed === 'object' && 'levels' in (parsed as Record<string, unknown>)) {
            setState((prev) => ({ ...prev, deepData: parsed as DeepResponse }));
          }
        }
      }
      setState((prev) => ({ ...prev, deepLoading: false }));
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: 'Не удалось получить ответ. Попробуйте через минуту.',
        }));
      } else {
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: 'Ошибка сети. Проверьте подключение.',
        }));
      }
    }
  }, []);

  return { ...state, sendText, sendDeepText, resetDeep, abort };
}
