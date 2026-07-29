import { useState, useCallback, useRef } from 'react';
import type { ReframeResponse, DeepResponse } from '../types/session';

interface SSEState {
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
      return 'Ничего не услышал. Попробуем ещё раз?';
    case 429:
      return 'Пауза на минуту. Пока можно осмыслить результат.';
    case 500:
    case 502:
    case 504:
      return 'Не получилось. Попробуем через минуту?';
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
        let error: string;
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          error = `rate_limit:${seconds}`;
        } else {
          error = errorMessageForStatus(response.status);
        }
        console.error(`[useSSE] HTTP ${response.status} — ${error}`);
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error,
        }));
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[useSSE] No ReadableStream — response.body is null');
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: 'Что-то с соединением. Попробуем снова?',
        }));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let hasData = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const parsed = parseSSEData(line);
          if (parsed && typeof parsed === 'object' && 'error' in (parsed as Record<string, unknown>)) {
            console.warn(`[useSSE] SSE error event — ${(parsed as Record<string, string>).error}`);
            setState((prev) => ({
              ...prev,
              loading: false,
              data: null,
              error: (parsed as Record<string, string>).error,
            }));
            return;
          }
          if (parsed && typeof parsed === 'object' && 'reframing' in (parsed as Record<string, unknown>)) {
            hasData = true;
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
          : 'Ответ пришёл не до конца. Но вот что есть.',
      }));
      if (!hasData) {
        console.warn('[useSSE] Partial response — no reframing or distortions in stream');
      }
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        console.error(`[useSSE] ${error.name} — request timed out or was aborted`);
        setState((prev) => ({
          ...prev,
          loading: false,
          data: prev.data,
          error: prev.data
            ? 'Услышал не всё. Но вот что есть:'
            : 'Не получилось. Попробуем через минуту?',
        }));
      } else {
        console.error(`[useSSE] ${error.name || 'NetworkError'} — request failed`);
        setState((prev) => ({
          ...prev,
          loading: false,
          data: null,
          error: 'Кажется, нет связи. Проверим?',
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
        let error: string;
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const seconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          error = `rate_limit:${seconds}`;
        } else {
          error = errorMessageForStatus(response.status);
        }
        console.error(`[useSSE:deep] HTTP ${response.status} — ${error}`);
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error,
        }));
        throw new Error(error);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const msg = 'Streaming не поддерживается';
        console.error('[useSSE:deep] No ReadableStream — response.body is null');
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: msg,
        }));
        throw new Error(msg);
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
            const sseError = (parsed as Record<string, string>).error;
            console.warn(`[useSSE:deep] SSE error event — ${sseError}`);
            setState((prev) => ({
              ...prev,
              deepLoading: false,
              error: sseError,
            }));
            throw new Error(sseError);
          }
          if (parsed && typeof parsed === 'object' && 'levels' in (parsed as Record<string, unknown>)) {
            setState((prev) => ({ ...prev, deepData: parsed as DeepResponse }));
          }
        }
      }
      setState((prev) => ({ ...prev, deepLoading: false }));
    } catch (err: unknown) {
      const error = err as { name?: string };
      // Only handle network/timeout errors here; HTTP errors already handled above
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        const msg = 'Не получилось. Попробуем через минуту?';
        console.error(`[useSSE:deep] ${error.name} — request timed out or was aborted`);
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: msg,
        }));
        throw new Error(msg, { cause: err });
      } else if (error.name === 'TypeError') {
        const msg = 'Кажется, нет связи. Проверим?';
        console.error('[useSSE:deep] TypeError — network unavailable');
        setState((prev) => ({
          ...prev,
          deepLoading: false,
          error: msg,
        }));
        throw new Error(msg, { cause: err });
      }
      // For HTTP errors (regular Error), SSE state already set above — just propagate
      throw err;
    }
  }, []);

  return { ...state, sendText, sendDeepText, resetDeep, abort };
}
