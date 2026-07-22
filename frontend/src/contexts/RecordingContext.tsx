import { createContext, useContext, type ReactNode } from 'react';
import { useSpeechRecognition, type SpeechRecognitionResult } from '../hooks/useSpeechRecognition';

const RecordingContext = createContext<SpeechRecognitionResult | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const speech = useSpeechRecognition();
  return (
    <RecordingContext.Provider value={speech}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording(): SpeechRecognitionResult {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error('useRecording must be used within RecordingProvider');
  return ctx;
}
