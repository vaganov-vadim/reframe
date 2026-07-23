import { useState } from 'react';
import { AnxietyTooltip } from './AnxietyTooltip';

interface AnxietySliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MARKS = [1, 5, 10];

const MARK_LABELS: Record<number, string> = {
  1: 'спокойно',
  5: 'тревожно',
  10: 'предельно',
};

export function AnxietySlider({
  value,
  onChange,
  disabled = false,
}: AnxietySliderProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const fillPercent = ((value - 1) / 9) * 100;

  return (
    <div style={{ padding: 'var(--space-lg) 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
          maxWidth: '380px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {MARKS.map((m) => (
          <span
            key={m}
            style={{
              fontSize: '12px',
              fontWeight: value === m ? 600 : 400,
              color: value === m ? 'var(--accent)' : 'var(--text-secondary)',
              transition: 'color 0.2s',
            }}
          >
            {MARK_LABELS[m]}
          </span>
        ))}
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onTouchStart={() => setShowTooltip(true)}
          onTouchEnd={() => setShowTooltip(false)}
          style={{
            width: '100%',
            height: 'var(--touch-target)',
            WebkitAppearance: 'none',
            appearance: 'none',
            background: 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
          }}
        />
        {/* Custom thin track */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '3px',
            transform: 'translateY(-50%)',
            background: `linear-gradient(to right, var(--slider-fill) ${fillPercent}%, var(--slider-track) ${fillPercent}%)`,
            borderRadius: '2px',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {showTooltip && (
          <div
            style={{
              position: 'absolute',
              top: '-8px',
              left: `${fillPercent}%`,
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
            }}
          >
            <AnxietyTooltip value={value} />
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          marginTop: 'var(--space-md)',
        }}
      >
        <span
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: 'var(--accent)',
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            marginLeft: 'var(--space-xs)',
          }}
        >
          / 10
        </span>
      </div>
    </div>
  );
}
