import { RecordButton } from './RecordButton';
import { TextInput } from './TextInput';

interface InputMethodProps {
  isSupported: boolean;
  /** Voice recording state */
  text: string | null;
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  /** Text fallback */
  onTextSubmit: (text: string) => void;
  /** Review phase (voice only) */
  reviewText: string | null;
  onReviewSubmit: () => void;
  onRetry: () => void;
  /** Deep mode context */
  surfaceThought?: string;
  /** Prompts */
  recordingPrompt?: string;
  textPlaceholder?: string;
}

export function InputMethod({
  isSupported,
  text,
  isListening,
  onStart,
  onStop,
  onCancel,
  onTextSubmit,
  reviewText,
  onReviewSubmit,
  onRetry,
  surfaceThought,
  recordingPrompt = 'Я слушаю...',
  textPlaceholder = 'Опишите, что вас тревожит...',
}: InputMethodProps) {
  // TEXT INPUT MODE
  if (!isSupported) {
    return (
      <div>
        {surfaceThought && (
          <SurfaceThought text={surfaceThought} />
        )}
        <TextInput placeholder={textPlaceholder} submitLabel="Отправить" onSubmit={onTextSubmit} />
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
          Совет: для голосового ввода откройте приложение в Chrome
        </p>
      </div>
    );
  }

  // REVIEW PHASE
  if (reviewText) {
    return (
      <div>
        <div style={{ padding: 'var(--space-md)' }}>
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--space-md)', marginBottom: 'var(--space-md)',
            border: '1px solid var(--border)', fontSize: '15px', lineHeight: 1.6, color: 'var(--text-primary)',
          }}>
            {reviewText}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
            <button onClick={onReviewSubmit} style={{
              background: 'var(--accent)', color: 'var(--bg-primary)', border: 'none',
              padding: 'var(--space-sm) var(--space-lg)', fontSize: '14px', fontWeight: 600,
              borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
            }}>Отправить</button>
            <button onClick={onRetry} style={{
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
              padding: 'var(--space-sm) var(--space-lg)', fontSize: '14px',
              borderRadius: 'var(--border-radius-sm)', cursor: 'pointer',
            }}>Записать заново</button>
          </div>
        </div>
      </div>
    );
  }

  // NORMAL VOICE MODE
  return (
    <div>
      {surfaceThought && <SurfaceThought text={surfaceThought} />}
      {!isListening && (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl) 0' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 500, margin: 0 }}>
            {recordingPrompt}
          </p>
        </div>
      )}
      <RecordButton
        state={isListening ? 'recording' : 'idle'}
        onStart={onStart}
        onStop={onStop}
        onCancel={onCancel}
      />
      {isListening && (
        <div style={{
          margin: 'var(--space-md) auto', padding: 'var(--space-md) var(--space-lg)',
          maxWidth: '360px', minHeight: '60px',
          background: 'var(--bg-elevated)', borderRadius: 'var(--border-radius-sm)',
          border: '1px solid var(--border)', fontSize: '15px', lineHeight: 1.6,
          color: text ? 'var(--text-primary)' : 'var(--text-secondary)', textAlign: 'center' as const,
        }}>
          {text || recordingPrompt}
        </div>
      )}
    </div>
  );
}

function SurfaceThought({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>Вы сказали:</p>
      <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: '0 0 var(--space-lg) 0', lineHeight: 1.5 }}>
        &laquo;{text}&raquo;
      </p>
    </div>
  );
}
