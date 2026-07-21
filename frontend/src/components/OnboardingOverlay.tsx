import { useState } from 'react';

const STORAGE_KEY = 'reframe_onboarding';

function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function markOnboardingSeen(): void {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function OnboardingOverlay() {
  const [visible, setVisible] = useState(!hasSeenOnboarding());

  if (!visible) return null;

  const handleDismiss = () => {
    markOnboardingSeen();
    setVisible(false);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(28, 25, 23, 0.95)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--space-lg)',
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--border-radius)',
        padding: 'var(--space-lg)',
        maxWidth: '360px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid var(--border)',
      }}>
        <h1 style={{
          fontSize: 'var(--font-size-heading)',
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-lg)',
        }}>
          Добро пожаловать в Reframe
        </h1>

        <div style={{ textAlign: 'left', marginBottom: 'var(--space-lg)' }}>
          <Step icon="🎤" text="Расскажите, что вас тревожит — просто говорите" />
          <Step icon="🧠" text="Приложение проанализирует мысли через призму КПТ" />
          <Step icon="🪞" text="Получите новый, нейтральный взгляд на ситуацию" />
          <Step icon="📊" text="Оцените тревогу до и после — отслеживайте прогресс" />
        </div>

        <div style={{
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--border-radius)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-lg)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
        }}>
          🔒 Все ваши записи остаются только на этом устройстве.
          Мы не храним и не передаём ваши данные.
        </div>

        <button
          onClick={handleDismiss}
          style={{
            width: '100%',
            background: 'var(--accent)',
            color: 'var(--bg-primary)',
            border: 'none',
            padding: 'var(--space-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            borderRadius: 'var(--border-radius)',
          }}
        >
          Понятно
        </button>
      </div>
    </div>
  );
}

function Step({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 'var(--space-md)',
      marginBottom: 'var(--space-md)',
    }}>
      <span style={{ fontSize: '20px', minWidth: '28px' }}>{icon}</span>
      <span style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{text}</span>
    </div>
  );
}
