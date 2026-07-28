import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechRecognitionResult {
  text: string | null;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  cancel: () => void;
  getFinalText: () => string | null;
}

export function sanitizeText(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 3000) return trimmed.slice(0, 3000);
  return trimmed;
}

const RECORDING_TIMEOUT = 3 * 60 * 1000; // 3 minutes

// Browser-prefixed SpeechRecognition constructor type
type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionAPI(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  return ctor as SpeechRecognitionCtor | undefined;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscript = useRef('');

  const SpeechRecognitionAPI = getSpeechRecognitionAPI();
  const isSupported = SpeechRecognitionAPI !== undefined;

  const start = useCallback(() => {
    if (!isSupported || !SpeechRecognitionAPI) return;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;
    finalTranscript.current = '';
    setText(null);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setError('Не расслышал. Попробуем ещё раз?');
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
    // Note: onend handler sets isListening=false AFTER onresult delivers text
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setText(null);
    finalTranscript.current = '';
    setIsListening(false);
    setError(null);
  }, []);

  const getFinalText = useCallback((): string | null => {
    return sanitizeText(finalTranscript.current);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      // Do NOT abort — recording should survive tab switches.
      // Cleanup happens explicitly via cancel().
    };
  }, []);

  return { text, isListening, error, isSupported, start, stop, cancel, getFinalText };
}
