import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReframeResponse } from '../types/session';
import { DistortionInfo } from './DistortionInfo';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

export function DistortionList({
  distortions,
}: {
  distortions: ReframeResponse['distortions'];
}) {
  const [selectedDistortion, setSelectedDistortion] = useState<string | null>(null);

  if (!distortions || distortions.length === 0) return null;

  return (
    <div style={{ padding: 'var(--space-md)' }}>
      {selectedDistortion && (
        <DistortionInfo
          type={selectedDistortion}
          onClose={() => setSelectedDistortion(null)}
        />
      )}
      <h3
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-md)',
          textAlign: 'center',
          letterSpacing: '0.5px',
        }}
      >
        КОГНИТИВНЫЕ ИСКАЖЕНИЯ
      </h3>
      {distortions.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 'var(--space-sm)',
            alignItems: 'start',
            marginBottom: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Column 1: Automatic thought */}
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Мысль
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontStyle: 'italic',
                lineHeight: '1.5',
              }}
            >
              &laquo;{d.thought}&raquo;
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '14px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '16px' }}>&rarr;</span>
          </div>

          {/* Column 2+3: Distortion type + reason */}
          <div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Искажение
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-sm)' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--accent)',
                }}
              >
                {d.type}
              </span>
              <button
                onClick={() => setSelectedDistortion(selectedDistortion === d.type ? null : d.type)}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '50%',
                  width: '22px',
                  height: '22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  minHeight: 'auto',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                title="Что это за искажение?"
              >
                ℹ️
              </button>
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-primary)',
                lineHeight: '1.5',
              }}
            >
              {d.why}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReframingText({ text }: { text: string }) {
  const { supported, speaking, toggle } = useSpeechSynthesis();
  if (!text) return null;

  return (
    <div
      style={{
        padding: 'var(--space-lg)',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius)',
        margin: 'var(--space-md)',
        fontSize: '15px',
        lineHeight: '1.7',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
        borderLeftWidth: '3px',
        borderLeftColor: 'var(--success)',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          left: 'var(--space-md)',
          fontSize: '28px',
          color: 'var(--success)',
          lineHeight: 1,
          opacity: 0.6,
        }}
      >
        &ldquo;
      </div>
      <div style={{ paddingTop: '8px' }}>{text}</div>
      {supported && (
        <button
          type="button"
          data-testid="listen-reframing"
          onClick={() => toggle(text)}
          style={{
            marginTop: 'var(--space-md)',
            background: 'transparent',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '8px 16px',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            minHeight: 48,
          }}
        >
          {speaking ? 'Стоп' : 'Слушать'}
        </button>
      )}
    </div>
  );
}

export function ResponseView({
  data,
  loading,
}: {
  data: ReframeResponse | null;
  loading: boolean;
}) {
  const navigate = useNavigate();

  if (loading && !data) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-xl) var(--space-md)',
          color: 'var(--text-secondary)',
          fontSize: '15px',
        }}
      >
        <div className="loading-dots">
          <div className="loading-dot" />
          <div className="loading-dot" />
          <div className="loading-dot" />
        </div>
        <p>Смотрю на ситуацию...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {data.action && (
        <div
          className="stagger-0"
          data-testid="response-action"
          style={{
            padding: 'var(--space-md)',
            margin: '0 var(--space-md) var(--space-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--accent)',
            borderLeftWidth: '3px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Что сделать сегодня
          </div>
          <div
            style={{
              fontSize: '16px',
              color: 'var(--text-primary)',
              lineHeight: '1.5',
              fontWeight: 500,
            }}
          >
            {data.action}
          </div>
        </div>
      )}

      <div className={data.action ? 'stagger-1' : 'stagger-0'}>
        <ReframingText text={data.reframing} />
      </div>

      {data.question && (
        <div
          className="stagger-2"
          style={{
            padding: 'var(--space-md)',
            margin: '0 var(--space-md) var(--space-md)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px dashed var(--accent)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Вопрос для размышления
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'var(--accent)',
              fontStyle: 'italic',
              lineHeight: '1.5',
              fontWeight: 500,
            }}
          >
            {data.question}
          </div>
        </div>
      )}

      {data.pattern && (
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            margin: '0 var(--space-md) var(--space-md)',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            lineHeight: '1.5',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-sm)',
          }}
        >
          <span style={{ opacity: 0.5 }}>Повторяющийся паттерн: </span>
          {data.pattern}
        </div>
      )}

      <div className="stagger-2">
        <DistortionList distortions={data.distortions} />
      </div>

      {data.distortions && data.distortions.length > 0 && (
        <div style={{ textAlign: 'center', padding: '0 var(--space-md) var(--space-lg)' }}>
          <button
            onClick={() => navigate('/distortions')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 'var(--space-sm)',
              minHeight: 'auto',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
          >
            Узнать больше об искажениях →
          </button>
        </div>
      )}
    </div>
  );
}
