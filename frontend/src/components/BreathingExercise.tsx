import { useState, useEffect, useCallback } from 'react';

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'done';

const PHASES: Array<{ phase: BreathPhase; label: string; duration: number; scale: number }> = [
  { phase: 'inhale', label: 'Вдох', duration: 4000, scale: 1.3 },
  { phase: 'hold', label: 'Задержка', duration: 4000, scale: 1.3 },
  { phase: 'exhale', label: 'Выдох', duration: 4000, scale: 0.6 },
];

const TOTAL_CYCLES = 3;
const PHASES_PER_CYCLE = PHASES.length; // 3

interface BreathingExerciseProps {
  onClose: () => void;
}

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [scale, setScale] = useState(1);
  const [phaseLabel, setPhaseLabel] = useState('Приготовьтесь...');

  const startCycle = useCallback(() => {
    setIsActive(true);
    setCycleIndex(0);
    setPhaseIndex(0);
    setScale(1);
    setPhaseLabel('Приготовьтесь...');
  }, []);

  useEffect(() => {
    if (!isActive) return;

    if (cycleIndex >= TOTAL_CYCLES) {
      setIsActive(false);
      setScale(1);
      setPhaseLabel('Готово');
      return;
    }

    const phase = PHASES[phaseIndex];
    setPhaseLabel(phase.label);
    setScale(phase.scale);

    const timer = setTimeout(() => {
      if (phaseIndex + 1 < PHASES_PER_CYCLE) {
        setPhaseIndex(phaseIndex + 1);
      } else {
        setPhaseIndex(0);
        setCycleIndex(cycleIndex + 1);
      }
    }, phase.duration);

    return () => clearTimeout(timer);
  }, [cycleIndex, phaseIndex, isActive]);

  const cyclesLeft = TOTAL_CYCLES - cycleIndex;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-md)',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 'var(--space-lg)',
          left: 'var(--space-md)',
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          fontSize: '16px',
          cursor: 'pointer',
          padding: 'var(--space-xs)',
          minHeight: 'auto',
        }}
      >
        ← Вернуться
      </button>

      <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-xl)' }}>
        Дыхательное упражнение
      </h2>

      <div
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'var(--accent)',
          opacity: 0.15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.3s ease',
          transform: `scale(${scale})`,
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'var(--accent)',
            opacity: 0.3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'var(--bg-primary)', fontSize: '16px', fontWeight: 600 }}>
              {isActive ? cyclesLeft : '✓'}
            </span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 'var(--space-xs)' }}>
        {phaseLabel}
      </p>

      {isActive && (
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Цикл {cycleIndex + 1} из {TOTAL_CYCLES}
        </p>
      )}

      {!isActive && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
          <button
            onClick={startCycle}
            style={{
              background: 'var(--accent)',
              color: 'var(--bg-primary)',
              border: 'none',
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 'var(--border-radius-sm)',
            }}
          >
            Повторить
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              padding: 'var(--space-md) var(--space-lg)',
              fontSize: '15px',
              fontWeight: 500,
              cursor: 'pointer',
              borderRadius: 'var(--border-radius-sm)',
            }}
          >
            Вернуться
          </button>
        </div>
      )}
    </div>
  );
}
