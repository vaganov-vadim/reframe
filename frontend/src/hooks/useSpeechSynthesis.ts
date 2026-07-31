import { useCallback, useEffect, useState } from 'react';

function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Browser TTS for reframing text. No cloud keys.
 */
export function useSpeechSynthesis() {
  const [supported] = useState(canSpeak);
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (!canSpeak()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!canSpeak() || !text.trim()) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ru-RU';
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(u);
    },
    [],
  );

  const toggle = useCallback(
    (text: string) => {
      if (speaking) {
        stop();
      } else {
        speak(text);
      }
    },
    [speaking, speak, stop],
  );

  useEffect(() => () => stop(), [stop]);

  return { supported, speaking, speak, stop, toggle };
}
