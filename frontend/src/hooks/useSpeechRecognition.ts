import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechRecognitionResult {
  text: string | null;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  cancel: () => void;
}

export function sanitizeText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 3000) return trimmed.slice(0, 3000);
  return trimmed;
}

const RECORDING_TIMEOUT = 3 * 60 * 1000; // 3 minutes

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscript = useRef('');

  const SpeechRecognitionAPI =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition // eslint-disable-line @typescript-eslint/no-explicit-any
      : undefined;

  const isSupported = typeof SpeechRecognitionAPI !== 'undefined';

  const start = useCallback(() => {
    if (!isSupported || !SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;
    finalTranscript.current = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SpeechRecognitionEvent not in TS DOM types
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript.current += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setText(sanitizeText(finalTranscript.current + interim));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SpeechRecognitionErrorEvent not in TS DOM types
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setError('Не удалось распознать речь. Попробуйте ещё раз.');
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setError(null);

    timeoutRef.current = setTimeout(() => {
      recognition.stop();
    }, RECORDING_TIMEOUT);
  }, [isSupported, SpeechRecognitionAPI]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsListening(false);
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setText(null);
    finalTranscript.current = '';
    setIsListening(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return { text, isListening, error, isSupported, start, stop, cancel };
}
