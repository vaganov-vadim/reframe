import { useState } from 'react';
import {
  getReminderPrefs,
  setReminderPrefs,
  requestReminderPermission,
  type ReminderPrefs,
} from '../services/reminderService';

function timeValue(prefs: ReminderPrefs): string {
  return `${String(prefs.hour).padStart(2, '0')}:${String(prefs.minute).padStart(2, '0')}`;
}

export function ReminderSettings() {
  const [prefs, setPrefs] = useState<ReminderPrefs>(() => getReminderPrefs());
  const [hint, setHint] = useState<string | null>(null);

  const persist = (next: ReminderPrefs) => {
    setReminderPrefs(next);
    setPrefs(next);
  };

  const onToggle = async () => {
    if (!prefs.enabled) {
      const permission = await requestReminderPermission();
      if (permission === 'unsupported') {
        setHint('Этот браузер не умеет уведомления — включи, когда откроешь в Chrome.');
        return;
      }
      if (permission === 'denied') {
        setHint('Разреши уведомления в настройках браузера, чтобы включить напоминание.');
        return;
      }
      setHint('Напомним при следующем открытии приложения после этого времени.');
      persist({ ...prefs, enabled: true });
      return;
    }
    setHint(null);
    persist({ ...prefs, enabled: false });
  };

  const onTimeChange = (value: string) => {
    const [h, m] = value.split(':').map((x) => Number(x));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return;
    persist({ ...prefs, hour: h, minute: m });
  };

  return (
    <section
      data-testid="reminder-settings"
      style={{
        marginTop: 'var(--space-lg)',
        padding: 'var(--space-md)',
        borderRadius: 'var(--border-radius)',
        border: '1px solid var(--border)',
        background: 'var(--bg-elevated)',
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 'var(--space-sm)',
          fontWeight: 600,
        }}
      >
        Напоминание
      </div>
      <p
        style={{
          margin: '0 0 var(--space-md)',
          fontSize: 14,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
        }}
      >
        Мягкий сигнал при открытии приложения после выбранного времени. Не будильник в фоне.
        Время — по часам на устройстве.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="reminder-toggle"
          onClick={() => void onToggle()}
          style={{
            minHeight: 48,
            padding: '8px 16px',
            background: prefs.enabled ? 'var(--accent)' : 'transparent',
            color: prefs.enabled ? 'var(--bg-primary)' : 'var(--accent)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {prefs.enabled ? 'Выключить' : 'Включить'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary)' }}>
          Время
          <input
            type="time"
            data-testid="reminder-time"
            value={timeValue(prefs)}
            disabled={!prefs.enabled}
            onChange={(e) => onTimeChange(e.target.value)}
            style={{
              minHeight: 48,
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 14,
            }}
          />
        </label>
      </div>
      {hint && (
        <p
          data-testid="reminder-hint"
          style={{ margin: 'var(--space-md) 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}
        >
          {hint}
        </p>
      )}
    </section>
  );
}
