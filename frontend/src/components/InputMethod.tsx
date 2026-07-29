import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecording } from '../contexts/RecordingContext';
import { RecordButton } from './RecordButton';
import { TextInput } from './TextInput';

interface InputMethodProps {
  onSubmit: (text: string) => void;
  /** Optional: original surface thought (shown in deep mode above input) */
  surfaceThought?: string;
  /** Prompt text shown during recording */
  recordingPrompt?: string;
  /** Placeholder for text input */
  textPlaceholder?: string;
}

export function InputMethod({
  onSubmit,
  surfaceThought,
  recordingPrompt = 'Я слушаю...',
  textPlaceholder = 'Опишите, что вас тревожит...',
}: InputMethodProps) {
  const {
    text,
    isListening,
    isSupported,
    getFinalText,
    start,
    stop,
    cancel,
  } = useRecording();

  const [phase, setPhase] = useState<'idle' | 'recording' | 'review'>('idle');

  const handleStart = useCallback(() => {
    setPhase('recording');
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleCancel = useCallback(() => {
    cancel();
    setPhase('idle');
  }, [cancel]);

  // When recording stops (isListening goes true → false)
  const prevListening = useRef(isListening);
  useEffect(() => {
    if (prevListening.current && !isListening && phase === 'recording') {
      const finalText = getFinalText();
      if (finalText) {
        setPhase('review');
      } else {
        setPhase('idle');
      }
    }
    prevListening.current = isListening;
  }, [isListening, phase, getFinalText]);

  const handleReviewSubmit = useCallback(() => {
    const finalText = getFinalText();
    if (finalText) {
      setPhase('idle');
      onSubmit(finalText);
    }
  }, [getFinalText, onSubmit]);

  const handleRetry = useCallback(() => {
    start();
    setPhase('recording');
  }, [start]);

  // TEXT INPUT MODE
  if (!isSupported) {
    return (
      <div>
        {surfaceThought && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>
              Вы сказали:
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: '0 0 var(--space-lg) 0', lineHeight: 1.5 }}>
              &laquo;{surfaceThought}&raquo;
            </p>
          </div>
        )}
        <TextInput
          placeholder={textPlaceholder}
          submitLabel="Отправить"
          onSubmit={onSubmit}
        />
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
          Совет: для голосового ввода откройте приложение в Chrome
        </p>
      </div>
    );
  }

  // VOICE INPUT MODE
  return (
    <div>
      {/* Idle: show record button */}
      {phase === 'idle' && (
        <>
          {surfaceThought && (
            <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>
                Вы сказали:
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: '0 0 var(--space-lg) 0', lineHeight: 1.5 }}>
                &laquo;{surfaceThought}&raquo;
              </p>
            </div>
          )}
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 500, margin: '0 0 var(--space-md) 0' }}>
              {recordingPrompt}
            </p>
          </div>
          <RecordButton state="idle" onStart={handleStart} onStop={handleStop} onCancel={handleCancel} />
        </>
      )}

      {/* Recording */}
      {phase === 'recording' && (
        <>
          {surfaceThought && (
            <div style={{ textAlign: 'center', padding: 'var(--space-md) var(--space-md) 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>
                Вы сказали:
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                &laquo;{surfaceThought}&raquo;
              </p>
            </div>
          )}
          <RecordButton state="recording" onStart={handleStart} onStop={handleStop} onCancel={handleCancel} />
          <div style={{
            margin: 'var(--space-md) auto',
            padding: 'var(--space-md) var(--space-lg)',
            maxWidth: '360px',
            minHeight: '60px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '15px',
            lineHeight: '1.6',
            color: text ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center' as const,
          }}>
            {text || recordingPrompt}
          </div>
        </>
      )}

      {/* Review */}
      {phase === 'review' && (
        <div style={{ padding: 'var(--space-md)' }}>
          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            border: '1px solid var(--border)',
            fontSize: '15px',
            lineHeight: 1.6,
            color: 'var(--text-primary)',
          }}>
            {text}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            <button onClick={handleReviewSubmit} style={{
              background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none',
              padding: 'var(--space-sm) var(--space-lg)', fontSize: '14px', fontWeight: 600,
              borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
            }}>Отправить</button>
            <button onClick={handleRetry} style={{
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
              padding: 'var(--space-sm) var(--space-lg)', fontSize: '14px',
              borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
            }}>Записать заново</button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
            Проверьте текст перед отправкой
          </p>
        </div>
      )}
    </div>
  );
}
