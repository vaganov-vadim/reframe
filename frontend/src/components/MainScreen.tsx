import { useCallback, useRef, useEffect, useState } from 'react';
import { useRecording } from '../contexts/RecordingContext';
import { useSession } from '../contexts/SessionContext';
import { useSSE } from '../hooks/useSSE';
import type { ReframeResponse, DeepResponse } from '../types/session';
import { AnxietySlider } from './AnxietySlider';
import { InputMethod } from './InputMethod';
import { ResponseView } from './ResponseView';
import { VerticalArrow } from './VerticalArrow';
import { PostRatingSlider } from './PostRatingSlider';
import { DeltaDisplay } from './DeltaDisplay';
import { ErrorBanner } from './ErrorBanner';
import { TopicPrompt } from './TopicPrompt';
import { BreathingExercise } from './BreathingExercise';
import { startSession, completeSession } from '../services/sessionService';

export function MainScreen() {
  const { state, dispatch } = useSession();

  const [showBreathing, setShowBreathing] = useState(false);

  const { error: speechError } = useRecording();
  const {
    data: sseData,
    loading,
    deepData: sseDeepData,
    error: apiError,
    sendText,
    sendDeepText,
  } = useSSE();

  const deepResultRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);

  // Persist SSE results to session context when they arrive
  useEffect(() => {
    if (sseData) {
      dispatch({ type: 'STORE_RESULT', data: sseData });
    }
  }, [sseData, dispatch]);

  useEffect(() => {
    if (sseDeepData) {
      dispatch({ type: 'STORE_DEEP_RESULT', data: sseDeepData });
    }
  }, [sseDeepData, dispatch]);

  // Use persisted data (survives navigation) falling back to live SSE data
  const displayData: ReframeResponse | null = state.data || sseData;
  const displayDeepData: DeepResponse | null = state.deepData || sseDeepData;

  // Auto-scroll to Vertical Arrow when deep result appears
  useEffect(() => {
    if (state.phase === 'deep-result' && deepResultRef.current) {
      setTimeout(() => {
        deepResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [state.phase]);

  // RETRY: re-send last text when retryId changes
  useEffect(() => {
    if (state.retryId > 0 && state.lastText && !sendingRef.current) {
      sendingRef.current = true;
      sendText(state.lastText)
        .then(() => dispatch({ type: 'RESULT_RECEIVED' }))
        .catch(() => {
          dispatch({ type: 'ERROR', message: 'Не получилось. Попробуем через минуту?' });
        })
        .finally(() => { sendingRef.current = false; });
    }
  }, [state.retryId, state.lastText, sendText, dispatch]);

  const handleSave = useCallback(() => {
    const inProgress = startSession(state.anxietyBefore);
    completeSession(inProgress, state.anxietyAfter, {
      distortions: state.data?.distortions ?? [],
      reframing: state.data?.reframing ?? '',
      question: state.data?.question ?? '',
      verticalArrowLevels: state.deepData?.levels ?? undefined,
      verticalArrowReframing: state.deepData?.reframing ?? undefined,
    });
    dispatch({ type: 'SAVE' });
    setTimeout(() => {
      setShowBreathing(false);
      dispatch({ type: 'RESET' });
    }, 2000);
  }, [state.data, state.deepData, state.anxietyBefore, state.anxietyAfter, dispatch]);

  return (
    <div>
      <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0 var(--space-md)' }}>
        <h1 style={{
          fontSize: 'var(--font-size-xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          margin: 0,
        }}>
          Reframe
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          marginTop: '4px',
          letterSpacing: '0.3px',
        }}>
          голосовой КПТ-дневник
        </p>
      </div>

      <ErrorBanner
        message={state.error || speechError || apiError}
        onRetry={() => dispatch({ type: 'RETRY' })}
        onDismiss={() => dispatch({ type: 'DISMISS_ERROR' })}
      />

      {(state.phase === 'rating-before' || state.phase === 'done') && (
        <div className="phase-enter" key="idle">
          {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
          <AnxietySlider
            value={state.anxietyBefore}
            onChange={(v) => dispatch({ type: 'SET_ANXIETY_BEFORE', value: v })}
            disabled={false}
          />
          {state.anxietyBefore >= 9 && state.phase === 'rating-before' && (
            <div style={{ textAlign: 'center', padding: '0 var(--space-md) var(--space-lg)' }}>
              <button onClick={() => setShowBreathing(true)} style={{
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                borderRadius: '20px',
                padding: 'var(--space-xs) var(--space-lg)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}>
                Помощь — дыхательное упражнение
              </button>
            </div>
          )}
          {state.phase === 'rating-before' && <TopicPrompt />}
          {state.phase === 'rating-before' && (
            <InputMethod
              onSubmit={(text) => {
                dispatch({ type: 'SET_SURFACE_THOUGHT', text });
                dispatch({ type: 'SET_LAST_TEXT', text });
                dispatch({ type: 'ANALYZE' });
                sendText(text).then(() => dispatch({ type: 'RESULT_RECEIVED' }));
              }}
              recordingPrompt="Что вас тревожит?"
              textPlaceholder="Опишите, что вас тревожит..."
            />
          )}
          {state.phase === 'done' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
              <p style={{ color: 'var(--success)', fontSize: '16px' }}>
                Сессия сохранена ✓
              </p>

            </div>
          )}
        </div>
      )}

      {(state.phase === 'analyzing' || state.phase === 'result') && (
        <div className="phase-enter" key="response">
        <ResponseView data={displayData} loading={loading} />
        </div>
      )}

      {state.phase === 'result' && displayData && (
        <div className="phase-enter" key="post-result">
          <div style={{ textAlign: 'center', padding: '0 var(--space-md) var(--space-md)' }}>
            <button
              onClick={() => dispatch({ type: 'START_DEEP' })}
              style={{
                width: '100%',
                maxWidth: '320px',
                background: 'transparent',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                padding: 'var(--space-md)',
                fontSize: '15px',
                fontWeight: 500,
                cursor: 'pointer',
                borderRadius: 'var(--border-radius-sm)',
                transition: 'background 0.2s',
              }}
            >
              Копнуть глубже
            </button>
          </div>

          <PostRatingSlider
            value={state.anxietyAfter}
            onChange={(v) => dispatch({ type: 'SET_ANXIETY_AFTER', value: v })}
          />
          <DeltaDisplay
            before={state.anxietyBefore}
            after={state.anxietyAfter}
          />
          <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
            <button
              onClick={handleSave}
              style={{
                width: '100%',
                maxWidth: '320px',
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                padding: 'var(--space-md)',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Сохранить сессию
            </button>
          </div>
        </div>
      )}

      {state.phase === 'deep-recording' && (
        <div className="phase-enter" key="deep-recording">
          <InputMethod
            onSubmit={(text) => {
              if (state.surfaceThought) {
                dispatch({ type: 'DEEP_ANALYZE' });
                sendDeepText(text, state.surfaceThought)
                  .then(() => dispatch({ type: 'DEEP_RESULT_RECEIVED' }))
                  .catch((err: unknown) => {
                    const msg = err instanceof Error ? err.message : 'Не получилось. Попробуем через минуту?';
                    dispatch({ type: 'DEEP_ERROR', message: msg });
                  });
              }
            }}
            surfaceThought={state.surfaceThought ?? undefined}
            recordingPrompt="Что эта мысль говорит о вас?"
            textPlaceholder="Что эта мысль говорит о вас?"
          />
        </div>
      )}

      {state.phase === 'deep-analyzing' && (
        <div className="phase-enter" key="deep-analyzing">
        <VerticalArrow levels={null} loading={true} />
        </div>
      )}

      {state.phase === 'deep-result' && (
        <div className="phase-enter" key="deep-result">
          <ResponseView data={displayData} loading={false} />
          <div ref={deepResultRef}>
            <VerticalArrow
              levels={displayDeepData?.levels ?? null}
              reframing={displayDeepData?.reframing}
              question={displayDeepData?.question}
            />
          </div>
          <PostRatingSlider
            value={state.anxietyAfter}
            onChange={(v) => dispatch({ type: 'SET_ANXIETY_AFTER', value: v })}
          />
          <DeltaDisplay
            before={state.anxietyBefore}
            after={state.anxietyAfter}
          />
          <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
            <button
              onClick={handleSave}
              style={{
                width: '100%',
                maxWidth: '320px',
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                padding: 'var(--space-md)',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Сохранить сессию
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
