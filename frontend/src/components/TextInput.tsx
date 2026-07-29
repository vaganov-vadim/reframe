import { useState } from 'react';

interface TextInputProps {
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function TextInput({ placeholder, submitLabel, onSubmit, disabled }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={3000}
        rows={5}
        style={{
          width: '100%',
          maxWidth: '380px',
          margin: '0 auto',
          display: 'block',
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--border-radius-sm)',
          padding: 'var(--space-md)',
          fontSize: '15px',
          lineHeight: 1.6,
          fontFamily: 'inherit',
          resize: 'vertical',
          outline: 'none',
        }}
      />
      <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
        <button
          onClick={handleSubmit}
          disabled={disabled || !text.trim()}
          style={{
            width: '100%',
            maxWidth: '320px',
            background: text.trim() && !disabled ? 'var(--accent)' : 'var(--bg-elevated)',
            color: text.trim() && !disabled ? 'var(--bg-primary)' : 'var(--text-secondary)',
            border: 'none',
            padding: 'var(--space-md)',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: 'var(--border-radius-sm)',
            cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed',
          }}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
