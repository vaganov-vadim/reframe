import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecording } from '../../contexts/RecordingContext';
import { useSSE } from '../../hooks/useSSE';
import { InputMethod } from '../InputMethod';
import { ErrorBanner } from '../ErrorBanner';
import { AgentCard } from './AgentCard';
import { ConsensusView } from './ConsensusView';
import type { AgentEvent } from '../../types/session';

type StudioPhase = 'input' | 'recording' | 'review' | 'analyzing' | 'result';

const DEFAULT_AGENTS: AgentEvent[] = [
  { agent: 'burns', name: 'Д-р Бёрнс', status: 'loading' },
  { agent: 'stoic', name: 'Стоик', status: 'loading' },
];

export function StudioScreen() {
  const [phase, setPhase] = useState<StudioPhase>('input');
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [lastText, setLastText] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const {
    text,
    isListening,
    getFinalText,
    error: speechError,
    isSupported,
    start,
    stop,
    cancel,
    clearError,
  } = useRecording();
  const {
    agentsLoading,
    agentEvents,
    consensus,
    consensusLoading,
    agentsError,
    sendToAgents,
    dismissError,
  } = useSSE();

  const prevListening = useRef(isListening);

  // recognition.stop() is async — wait until isListening becomes false,
  // same pattern as MainScreen (v1).
  useEffect(() => {
    if (prevListening.current && !isListening && phase === 'recording') {
      const finalText = getFinalText() || text;
      if (finalText) {
        setReviewText(finalText);
        setLastText(finalText);
        setLocalError(null);
        setPhase('review');
      } else {
        setLocalError('Не расслышал. Попробуем ещё раз?');
        setPhase('input');
      }
    }
    prevListening.current = isListening;
  }, [isListening, phase, getFinalText, text]);

  useEffect(() => {
    if (phase === 'analyzing' && !agentsLoading && agentEvents.some((e) => e.status !== 'loading')) {
      setPhase('result');
    }
  }, [phase, agentsLoading, agentEvents]);

  // If analyze finished with zero usable events, leave loading UI.
  useEffect(() => {
    if (
      phase === 'analyzing' &&
      !agentsLoading &&
      agentEvents.length > 0 &&
      agentEvents.every((e) => e.status === 'loading') &&
      agentsError
    ) {
      setPhase('input');
    }
  }, [phase, agentsLoading, agentEvents, agentsError]);

  const handleStart = useCallback(() => {
    clearError();
    setLocalError(null);
    setReviewText(null);
    start();
    setPhase('recording');
  }, [clearError, start]);

  const handleStop = useCallback(() => {
    stop();
    // Phase stays 'recording' until isListening flips — do not read text here.
  }, [stop]);

  const handleCancel = useCallback(() => {
    cancel();
    setReviewText(null);
    setLocalError(null);
    setPhase('input');
  }, [cancel]);

  const analyze = useCallback(
    async (t: string) => {
      setLastText(t);
      setLocalError(null);
      setPhase('analyzing');
      await sendToAgents(t, ['burns', 'stoic']);
    },
    [sendToAgents],
  );

  const handleReviewSubmit = useCallback(() => {
    if (reviewText) {
      setReviewText(null);
      void analyze(reviewText);
    }
  }, [reviewText, analyze]);

  const handleTextSubmit = useCallback(
    (t: string) => {
      void analyze(t);
    },
    [analyze],
  );

  const handleRetry = useCallback(() => {
    dismissError();
    clearError();
    setLocalError(null);
    if (lastText) {
      void analyze(lastText);
    } else {
      setPhase('input');
    }
  }, [analyze, lastText, dismissError, clearError]);

  const displayEvents: AgentEvent[] =
    agentEvents.length > 0
      ? agentEvents
      : phase === 'analyzing' || phase === 'result'
        ? DEFAULT_AGENTS
        : [];

  return (
    <main data-testid="studio-screen" style={{ padding: 'var(--space-lg) var(--space-md) 80px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--font-size-heading)', color: 'var(--text-primary)' }}>Studio</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>Два взгляда на одну мысль</p>
        </div>
        <Link
          to="/"
          data-testid="back-to-diary"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
        >
          ← К дневнику
        </Link>
      </div>

      <ErrorBanner
        message={localError || agentsError || speechError}
        onRetry={handleRetry}
        onDismiss={() => {
          setLocalError(null);
          dismissError();
          clearError();
        }}
      />

      {(phase === 'input' || phase === 'recording' || phase === 'review') && (
        <div className="phase-enter">
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            Что тебя тревожит?
          </p>
          <InputMethod
            isSupported={isSupported}
            text={text}
            isListening={isListening}
            onStart={handleStart}
            onStop={handleStop}
            onCancel={handleCancel}
            onTextSubmit={handleTextSubmit}
            reviewText={reviewText}
            onReviewSubmit={handleReviewSubmit}
            onRetry={() => {
              setReviewText(null);
              setLocalError(null);
              setPhase('input');
            }}
            recordingPrompt="Я слушаю..."
            textPlaceholder="Опишите ситуацию..."
          />
        </div>
      )}

      {(phase === 'analyzing' || phase === 'result') && (
        <div className="phase-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {displayEvents.map((event) => (
              <AgentCard key={event.agent} event={event} />
            ))}
          </div>
          <ConsensusView text={consensus} loading={consensusLoading || phase === 'analyzing'} />
          {phase === 'result' && (
            <button
              type="button"
              data-testid="studio-again"
              onClick={() => {
                setPhase('input');
                setReviewText(null);
              }}
              style={{
                alignSelf: 'center',
                marginTop: 'var(--space-sm)',
                background: 'transparent',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--border-radius-sm)',
                padding: 'var(--space-sm) var(--space-lg)',
                cursor: 'pointer',
                fontSize: 14,
                minHeight: 48,
              }}
            >
              Ещё раз
            </button>
          )}
        </div>
      )}
    </main>
  );
}
