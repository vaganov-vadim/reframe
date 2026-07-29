import { useCallback, useRef, useEffect, useState } from 'react';
import { useRecording } from '../contexts/RecordingContext';
import { useSession } from '../contexts/SessionContext';
import { useSSE } from '../hooks/useSSE';
import type { ReframeResponse, DeepResponse } from '../types/session';
import { AnxietySlider } from './AnxietySlider';
import { RecordButton } from './RecordButton';

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
  const [manualText, setManualText] = useState('');
  const [sending, setSending] = useState(false);

  const {
    text,
    isListening,
    getFinalText,
    error: speechError,
    isSupported,
    start,
    stop,
    cancel,
  } = useRecording();
  const {
    data: sseData,
    loading,
    deepData: sseDeepData,
    error: apiError,
    sendText,
    sendDeepText,
  } = useSSE();

  const deepResultRef = useRef<HTMLDivElement>(null);
  const lastSurfaceRef = useRef<string | null>(null);

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

  const handleStart = useCallback(() => {
    if (state.phase === 'recording' || state.phase === 'deep-recording') return; // already recording
    dispatch({ type: 'START_RECORDING' });
    start();
  }, [start, dispatch, state.phase]);

  const handleStop = useCallback(() => {
    stop();
    // Phase stays 'recording' until useEffect fires.
    // Do NOT read text here — recognition.stop() is async,
    // final transcript arrives after stop() returns.
  }, [stop]);

  const handleDeepStart = useCallback(() => {
    dispatch({ type: 'START_DEEP' });
    start();
  }, [start, dispatch]);

  const handleDeepStop = useCallback(() => {
    stop();
  }, [stop]);

  // When recording stops (isListening goes true → false),
  // check if we have text and should send it.
  const prevListening = useRef(isListening);

  useEffect(() => {
    // Just transitioned from listening to not-listening
    if (prevListening.current && !isListening) {
      if (state.phase === 'recording') {
        const finalText = getFinalText();
        if (finalText) {
          dispatch({ type: 'SET_SURFACE_THOUGHT', text: finalText });
          dispatch({ type: 'SET_LAST_TEXT', text: finalText });
          dispatch({ type: 'STOP_RECORDING' });
        } else {
          dispatch({ type: 'ERROR', message: 'Не расслышал. Попробуем ещё раз?' });
        }
      } else if (state.phase === 'deep-recording') {
        const deepText = getFinalText();
        if (deepText && state.surfaceThought) {
          lastSurfaceRef.current = deepText;
          dispatch({ type: 'DEEP_ANALYZE' });
          sendDeepText(deepText, state.surfaceThought)
            .then(() => dispatch({ type: 'DEEP_RESULT_RECEIVED' }))
            .catch((err: unknown) => {
              const message = err instanceof Error ? err.message : 'Не получилось. Попробуем через минуту?';
              dispatch({ type: 'DEEP_ERROR', message });
            });
        } else {
          dispatch({ type: 'DEEP_ERROR', message: 'Не расслышал. Попробуем ещё раз?' });
        }
      }
    }
    prevListening.current = isListening;
  }, [isListening, state.phase, state.surfaceThought, getFinalText, sendText, sendDeepText, dispatch]);

  // Auto-scroll to Vertical Arrow when deep result appears
  useEffect(() => {
    if (state.phase === 'deep-result' && deepResultRef.current) {
      setTimeout(() => {
        deepResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [state.phase]);

  // RETRY: re-send last text when retryId changes
  const sendingRef = useRef(false);
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

  const handleCancel = useCallback(() => {
    cancel();
    dispatch({ type: 'CANCEL_RECORDING' });
  }, [cancel, dispatch]);

  const handleDeepCancel = useCallback(() => {
    cancel();
    dispatch({ type: 'RESULT_RECEIVED' });
  }, [cancel, dispatch]);

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
    setTimeout(() => dispatch({ type: 'RESET' }), 2000);
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
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: 'var(--space-xs) var(--space-lg)',
                fontSize: '13px',
                cursor: 'pointer',
              }}>
                Помощь — дыхательное упражнение
              </button>
            </div>
          )}
          {state.phase === 'rating-before' && <TopicPrompt />}
          {isSupported ? (
            <RecordButton
              state={state.phase === 'done' ? 'idle' : 'idle'}
              onStart={handleStart}
              onStop={handleStop}
              onCancel={handleCancel}
            />
          ) : (
            <div style={{ padding: 'var(--space-md)' }}>
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Опишите, что вас тревожит..."
                maxLength={3000}
                rows={5}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  margin: '0 auto',
                  display: 'block',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: 'var(--space-md)',
                  fontSize: '15px',
                  lineHeight: 1.6,
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                }}
              />
              <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
                <button
                  onClick={() => {
                    if (!manualText.trim() || sending) return;
                    setSending(true);
                    dispatch({ type: 'SET_SURFACE_THOUGHT', text: manualText.trim() });
                    dispatch({ type: 'ANALYZE' });
                    sendText(manualText.trim())
                      .then(() => dispatch({ type: 'RESULT_RECEIVED' }))
                      .catch(() => {
                        dispatch({ type: 'ERROR', message: 'Не получилось. Попробуем через минуту?' });
                      })
                      .finally(() => setSending(false));
                  }}
                  disabled={!manualText.trim() || sending}
                  style={{
                    width: '100%',
                    maxWidth: '320px',
                    background: manualText.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: manualText.trim() ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    border: 'none',
                    padding: 'var(--space-md)',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: manualText.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Отправить
                </button>
              </div>
            </div>
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

      {state.phase === 'recording' && (
        <div className="phase-enter" key="recording">
          <RecordButton
            state="recording"
            onStart={handleStart}
            onStop={handleStop}
            onCancel={handleCancel}
          />
          <div style={{
            margin: 'var(--space-md) auto',
            padding: 'var(--space-md) var(--space-lg)',
            maxWidth: '360px',
            minHeight: '60px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '15px',
            lineHeight: '1.6',
            color: text ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center' as const,
            transition: 'color 0.3s',
          }}>
            {text || 'Я слушаю...'}
          </div>
        </div>
      )}

      {state.phase === 'review' && (
        <div className="phase-enter" key="review">
          <div style={{ padding: 'var(--space-md)' }}>
            <div style={{
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--border-radius-sm)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-md)',
              border: '1px solid var(--border)',
              fontSize: '15px',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
            }}>
              {state.lastText}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
              <button onClick={() => {
                dispatch({ type: 'ANALYZE' });
                sendText(state.lastText!).then(() => dispatch({ type: 'RESULT_RECEIVED' }));
              }} style={{
                background: 'var(--accent)',
                color: 'var(--bg-primary)',
                border: 'none',
                padding: 'var(--space-sm) var(--space-lg)',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
              }}>
                Отправить
              </button>
              <button onClick={() => {
                dispatch({ type: 'START_RECORDING' });
                start();
              }} style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
                padding: 'var(--space-sm) var(--space-lg)',
                fontSize: '14px',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer',
              }}>
                Записать заново
              </button>
            </div>
          </div>
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
              onClick={handleDeepStart}
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
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>
              Вы сказали:
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: '0 0 var(--space-lg) 0', lineHeight: 1.5 }}>
              &laquo;{state.surfaceThought ?? ''}&raquo;
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 500, margin: '0 0 var(--space-xs) 0' }}>
              Что эта мысль говорит о вас?
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Слушаю...
            </p>
          </div>
          <RecordButton
            state="recording"
            onStart={handleDeepStart}
            onStop={handleDeepStop}
            onCancel={handleDeepCancel}
          />
          <div style={{
            margin: 'var(--space-md) auto',
            padding: 'var(--space-md) var(--space-lg)',
            maxWidth: '360px',
            minHeight: '60px',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border)',
            fontSize: '15px',
            lineHeight: '1.6',
            color: text ? 'var(--text-primary)' : 'var(--text-secondary)',
            textAlign: 'center' as const,
            transition: 'color 0.3s',
          }}>
            {text || 'Я слушаю...'}
          </div>
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
