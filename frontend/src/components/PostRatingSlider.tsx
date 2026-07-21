import { AnxietySlider } from './AnxietySlider';

interface PostRatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function PostRatingSlider({ value, onChange, disabled }: PostRatingSliderProps) {
  return (
    <div style={{ textAlign: 'center' }}>
      <h3
        style={{
          fontSize: '16px',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-sm)',
        }}
      >
        Как ты себя чувствуешь сейчас?
      </h3>
      <AnxietySlider value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
}
