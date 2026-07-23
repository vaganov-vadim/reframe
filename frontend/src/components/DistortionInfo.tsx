const DISTORTION_DEFINITIONS: Record<string, { definition: string; example: string }> = {
  'Катастрофизация': {
    definition: 'Ожидание наихудшего сценария, преувеличение негативных последствий.',
    example: '«Если я опоздаю на встречу, меня уволят, и я никогда не найду работу.»',
  },
  'Персонализация': {
    definition: 'Принятие на свой счёт событий, которые от вас не зависят, или обвинение себя в том, за что вы не отвечаете.',
    example: '«Коллега не поздоровался — значит, он на меня обижен.»',
  },
  'Чтение мыслей': {
    definition: 'Убеждённость, что вы знаете, что думают другие, без каких-либо доказательств.',
    example: '«Они смотрят на меня и думают, что я некомпетентен.»',
  },
  'Предсказание будущего': {
    definition: 'Уверенность в негативном исходе событий до того, как они произошли.',
    example: '«Я точно провалю это собеседование, даже пытаться не стоит.»',
  },
  'Чёрно-белое мышление': {
    definition: 'Восприятие ситуации только в крайностях: «всё или ничего», без оттенков.',
    example: '«Если я не сделаю это идеально, значит, я полный неудачник.»',
  },
  'Сверхобобщение': {
    definition: 'Обобщение на основе единичного случая: «всегда», «никогда», «всё», «ничего».',
    example: '«Мне отказали один раз — у меня никогда ничего не получится.»',
  },
  'Эмоциональное обоснование': {
    definition: 'Принятие эмоций за доказательство реальности: «Я так чувствую — значит, так и есть».',
    example: '«Я чувствую себя никчёмным, значит, я действительно никчёмен.»',
  },
  'Долженствование': {
    definition: 'Жёсткие требования к себе и другим через «должен», «обязан», «надо».',
    example: '«Я должен всегда быть продуктивным и никогда не ошибаться.»',
  },
  'Навешивание ярлыков': {
    definition: 'Глобальная негативная оценка себя или других на основе одного поступка.',
    example: '«Я опоздал — я безответственный человек.»',
  },
  'Фильтрация': {
    definition: 'Фокусировка исключительно на негативе, игнорирование позитивных аспектов ситуации.',
    example: '«В отзыве похвалили 9 пунктов, но я зациклился на одном критическом замечании.»',
  },
};

interface DistortionInfoProps {
  type: string;
  onClose: () => void;
}

export function DistortionInfo({ type, onClose }: DistortionInfoProps) {
  const info = DISTORTION_DEFINITIONS[type];
  if (!info) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-md)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--space-lg)',
          maxWidth: '380px',
          width: '100%',
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent)', margin: 0 }}>
            {type}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 0 0 var(--space-sm)',
              lineHeight: 1,
              minHeight: 'auto',
            }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 'var(--space-md)' }}>
          {info.definition}
        </p>
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            Пример
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
            {info.example}
          </p>
        </div>
      </div>
    </div>
  );
}

export { DISTORTION_DEFINITIONS };
