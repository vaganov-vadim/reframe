import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecording } from '../../contexts/RecordingContext';
import { useSSE } from '../../hooks/useSSE';
import { InputMethod } from '../InputMethod';
import { ErrorBanner } from '../ErrorBanner';
import { AgentCard } from './AgentCard';
import { ConsensusView } from './ConsensusView';
import type { AgentEvent, BurnsAgentPayload } from '../../types/session';

type StudioPhase =
  | 'input'
  | 'recording'
  | 'review'
  | 'analyzing'
  | 'result'
  | 'followupRecording'
  | 'followupReview'
  | 'followupLoading'
  | 'done';

const DEFAULT_AGENTS: AgentEvent[] = [
  { agent: 'burns', name: 'Д-р Бёрнс', status: 'loading' },
  { agent: 'stoic', name: 'Стоик', status: 'loading' },
];

const FALLBACK_QUESTION = 'Что из этого важнее забрать с собой?';
const TEXT_PLACEHOLDER = 'Напр.: опоздал на созвон, молчат — кажется, злятся';

function burnsQuestion(events: AgentEvent[]): string {
  const burns = events.find((e) => e.agent === 'burns' && e.status === 'ok');
  const payload = burns?.payload as BurnsAgentPayload | undefined;
  const q = payload?.question?.trim();
  return q || FALLBACK_QUESTION;
}

export function StudioScreen() {
  const [phase, setPhase] = useState<StudioPhase>('input');
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [followupReviewText, setFollowupReviewText] = useState<string | null>(null);
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
    sendStudioFollowup,
    dismissError,
  } = useSSE();

  const prevListening = useRef(isListening);
  const followupQuestion = useMemo(() => burnsQuestion(agentEvents), [agentEvents]);

  // recognition.stop() is async — wait until isListening becomes false
  useEffect(() => {
    if (prevListening.current && !isListening) {
      const finalText = getFinalText() || text;
      if (phase === 'recording') {
        if (finalText) {
          setReviewText(finalText);
          setLastText(finalText);
          setLocalError(null);
          setPhase('review');
        } else {
          setLocalError('Не расслышал. Попробуем ещё раз?');
          setPhase('input');
        }
      } else if (phase === 'followupRecording') {
        if (finalText) {
          setFollowupReviewText(finalText);
          setLocalError(null);
          setPhase('followupReview');
        } else {
          setLocalError('Не расслышал. Попробуем ещё раз?');
          setPhase('result');
        }
      }
    }
    prevListening.current = isListening;
  }, [isListening, phase, getFinalText, text]);

  useEffect(() => {
    if (phase === 'analyzing' && !agentsLoading && agentEvents.some((e) => e.status !== 'loading')) {
      setPhase('result');
    }
  }, [phase, agentsLoading, agentEvents]);

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
      setFollowupReviewText(null);
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
    if (lastText && (phase === 'analyzing' || phase === 'input')) {
      void analyze(lastText);
    } else {
      setPhase('input');
    }
  }, [analyze, lastText, dismissError, clearError, phase]);

  const runFollowup = useCallback(
    async (answer: string) => {
      if (!lastText || !consensus) return;
      setPhase('followupLoading');
      setLocalError(null);
      const ok = await sendStudioFollowup({
        text: answer,
        surface: lastText,
        takeaway: consensus,
        question: followupQuestion,
      });
      setFollowupReviewText(null);
      setPhase(ok ? 'done' : 'result');
    },
    [lastText, consensus, followupQuestion, sendStudioFollowup],
  );

  const handleFollowupStart = useCallback(() => {
    clearError();
    setLocalError(null);
    setFollowupReviewText(null);
    start();
    setPhase('followupRecording');
  }, [clearError, start]);

  const handleFollowupCancel = useCallback(() => {
    cancel();
    setFollowupReviewText(null);
    setLocalError(null);
    setPhase('result');
  }, [cancel]);

  const handleSkipFollowup = useCallback(() => {
    setFollowupReviewText(null);
    setPhase('done');
  }, []);

  const handleUnderstood = useCallback(() => {
    setPhase('input');
    setReviewText(null);
    setFollowupReviewText(null);
  }, []);

  const displayEvents: AgentEvent[] =
    agentEvents.length > 0
      ? agentEvents
      : phase === 'analyzing' || phase === 'result' || phase === 'followupLoading' || phase === 'done' ||
          phase === 'followupRecording' || phase === 'followupReview'
        ? DEFAULT_AGENTS
        : [];

  const showResultPane =
    phase === 'analyzing' ||
    phase === 'result' ||
    phase === 'followupRecording' ||
    phase === 'followupReview' ||
    phase === 'followupLoading' ||
    phase === 'done';

  const showFollowupAsk =
    phase === 'result' ||
    phase === 'followupRecording' ||
    phase === 'followupReview';

  return (
    <main
      data-testid="studio-screen"
      className="studio-screen"
      style={{ padding: 'var(--space-md) 0 80px', maxWidth: 560, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-lg)', gap: 'var(--space-md)' }}>
        <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.02em' }}>
          Два взгляда
        </h1>
        <Link
          to="/"
          data-testid="back-to-diary"
          style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14, fontWeight: 500, flexShrink: 0, paddingTop: 4 }}
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
            textPlaceholder={TEXT_PLACEHOLDER}
          />
        </div>
      )}

      {showResultPane && (
        <div className="phase-enter" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <ConsensusView
            text={consensus}
            loading={consensusLoading || phase === 'analyzing' || phase === 'followupLoading'}
          />
          <div
            data-testid="studio-lenses"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {displayEvents.map((event) => (
              <AgentCard key={event.agent} event={event} />
            ))}
          </div>

          {showFollowupAsk && consensus && (
            <section
              data-testid="studio-followup"
              style={{
                marginTop: 'var(--space-md)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border)',
              }}
            >
              <p
                data-testid="studio-followup-question"
                style={{
                  margin: '0 0 var(--space-md)',
                  fontSize: 17,
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  fontFamily: 'var(--studio-display, inherit)',
                }}
              >
                {followupQuestion}
              </p>
              <InputMethod
                isSupported={isSupported}
                text={phase === 'followupRecording' ? text : ''}
                isListening={isListening && phase === 'followupRecording'}
                onStart={handleFollowupStart}
                onStop={handleStop}
                onCancel={handleFollowupCancel}
                onTextSubmit={(t) => {
                  void runFollowup(t);
                }}
                reviewText={followupReviewText}
                onReviewSubmit={() => {
                  if (followupReviewText) void runFollowup(followupReviewText);
                }}
                onRetry={() => {
                  setFollowupReviewText(null);
                  setPhase('result');
                }}
                recordingPrompt="Я слушаю..."
                textPlaceholder="Короткий ответ..."
              />
              {phase === 'result' && (
                <button
                  type="button"
                  data-testid="studio-skip-followup"
                  onClick={handleSkipFollowup}
                  style={{
                    display: 'block',
                    margin: 'var(--space-md) auto 0',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 14,
                    cursor: 'pointer',
                    minHeight: 48,
                  }}
                >
                  Пропустить
                </button>
              )}
            </section>
          )}

          {phase === 'done' && (
            <button
              type="button"
              data-testid="studio-again"
              onClick={handleUnderstood}
              style={{
                alignSelf: 'center',
                marginTop: 'var(--space-sm)',
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                padding: 'var(--space-sm) var(--space-lg)',
                cursor: 'pointer',
                fontSize: 15,
                fontWeight: 600,
                minHeight: 48,
                minWidth: 160,
              }}
            >
              Понял
            </button>
          )}
        </div>
      )}
    </main>
  );
}
