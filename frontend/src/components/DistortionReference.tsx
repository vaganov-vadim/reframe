import { useNavigate } from 'react-router-dom';
import { DISTORTION_DEFINITIONS } from './DistortionInfo';

const ALL_DISTORTIONS = [
  { key: 'Катастрофизация', en: 'catastrophizing' },
  { key: 'Персонализация', en: 'personalization' },
  { key: 'Чтение мыслей', en: 'mind reading' },
  { key: 'Предсказание будущего', en: 'fortune telling' },
  { key: 'Чёрно-белое мышление', en: 'black-and-white thinking' },
  { key: 'Сверхобобщение', en: 'overgeneralization' },
  { key: 'Эмоциональное обоснование', en: 'emotional reasoning' },
  { key: 'Долженствование', en: 'should statements' },
  { key: 'Навешивание ярлыков', en: 'labeling' },
  { key: 'Фильтрация', en: 'mental filter' },
];

export function DistortionReference() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '0 var(--space-md) var(--space-xl)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 'var(--space-lg)', paddingTop: 'var(--space-md)' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: 'var(--space-xs)',
            minHeight: 'auto',
            marginRight: 'var(--space-sm)',
          }}
        >
          ← Назад
        </button>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Когнитивные искажения
        </h2>
      </div>

      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-lg)' }}>
        Когнитивные искажения — систематические ошибки мышления, которые усиливают тревогу и искажают
        восприятие реальности. Методология Дэвида Бёрнса выделяет 10 основных типов.
      </p>

      {ALL_DISTORTIONS.map((d) => {
        const info = DISTORTION_DEFINITIONS[d.key];
        return (
          <div
            key={d.key}
            style={{
              marginBottom: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--accent)', margin: 0 }}>
                {d.key}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {d.en}
              </span>
            </div>
            {info && (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, margin: '0 0 var(--space-sm) 0' }}>
                  {info.definition}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  {info.example}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
