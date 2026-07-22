import { useState } from 'react';

const STORAGE_KEY = 'reframe_onboarding';

function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function markOnboardingSeen(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

const STEPS = [
  {
    title: 'Добро пожаловать в\u00A0Reframe',
    body: 'Приватный дневник для работы с тревожными мыслями через когнитивно-поведенческую терапию.',
  },
  {
    title: 'Расскажите, что вас тревожит',
    body: 'Просто говорите — приложение слушает и анализирует ваши мысли.',
  },
  {
    title: 'Взгляните иначе',
    body: 'Reframe покажет когнитивные искажения и поможет найти новый, нейтральный взгляд.',
  },
  {
    title: 'Всё остаётся на устройстве',
    body: 'Ваши записи не покидают это устройство. Никаких серверов, никакой телеметрии.',
  },
];

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(!hasSeenOnboarding());
  const [step, setStep] = useState(0);

  if (!visible) return null;

  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      markOnboardingSeen();
      setVisible(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  const current = STEPS[step];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-xl)',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '320px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-lg)',
            lineHeight: '1.3',
          }}
        >
          {current.title}
        </h1>
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
          }}
        >
          {current.body}
        </p>
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {STEPS.map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background:
                i === step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      <button
        onClick={handleNext}
        style={{
          width: '100%',
          maxWidth: '320px',
          background: 'var(--accent)',
          color: 'var(--bg-primary)',
          border: 'none',
          padding: 'var(--space-md)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          borderRadius: 'var(--border-radius)',
          cursor: 'pointer',
        }}
      >
        {isLast ? 'Начать' : 'Далее'}
      </button>
    </div>
  );
}
