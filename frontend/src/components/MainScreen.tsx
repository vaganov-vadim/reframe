import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { useRecording } from '../contexts/RecordingContext';
import { useSSE } from '../hooks/useSSE';
import { AnxietySlider } from './AnxietySlider';
import { RecordButton } from './RecordButton';
import { BrowserFallback } from './BrowserFallback';
import { ResponseView } from './ResponseView';
import { VerticalArrow } from './VerticalArrow';
import { PostRatingSlider } from './PostRatingSlider';
import { DeltaDisplay } from './DeltaDisplay';
import { ErrorBanner } from './ErrorBanner';
import { TopicPrompt } from './TopicPrompt';
import { BreathingExercise } from './BreathingExercise';
import { startSession, completeSession } from '../services/sessionService';

type Phase =
  | 'rating-before'
  | 'recording'
  | 'analyzing'
  | 'result'
  | 'deep-recording'
  | 'deep-analyzing'
  | 'deep-result'
  | 'rating-after'
  | 'done';

interface MainState {
  phase: Phase;
  anxietyBefore: number;
  anxietyAfter: number;
  error: string | null;
  retryId: number;
}

type Action =
  | { type: 'SET_ANXIETY_BEFORE'; value: number }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'ANALYZE' }
  | { type: 'RESULT_RECEIVED' }
  | { type: 'SET_ANXIETY_AFTER'; value: number }
  | { type: 'START_DEEP' }
  | { type: 'DEEP_ANALYZE' }
  | { type: 'DEEP_RESULT_RECEIVED' }
  | { type: 'SAVE' }
  | { type: 'ERROR'; message: string }
  | { type: 'DEEP_ERROR'; message: string }
  | { type: 'DISMISS_ERROR' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

function reducer(state: MainState, action: Action): MainState {
  switch (action.type) {
    case 'SET_ANXIETY_BEFORE':
      return { ...state, anxietyBefore: action.value };
    case 'START_RECORDING':
      return { ...state, phase: 'recording', error: null };
    case 'STOP_RECORDING':
      return { ...state, phase: 'analyzing' };
    case 'CANCEL_RECORDING':
      return { ...state, phase: 'rating-before', error: null };
    case 'RESULT_RECEIVED':
      return { ...state, phase: 'result' };
    case 'SET_ANXIETY_AFTER':
      return { ...state, anxietyAfter: action.value };
    case 'START_DEEP':
      return { ...state, phase: 'deep-recording' };
    case 'DEEP_ANALYZE':
      return { ...state, phase: 'deep-analyzing' };
    case 'DEEP_RESULT_RECEIVED':
      return { ...state, phase: 'deep-result' };
    case 'SAVE':
      return { ...state, phase: 'done' };
    case 'ERROR':
      return { ...state, error: action.message, phase: state.phase === 'analyzing' ? 'result' : 'rating-before' };
    case 'DEEP_ERROR':
      return { ...state, error: action.message, phase: 'result' };
    case 'DISMISS_ERROR':
      return { ...state, error: null };
    case 'RETRY':
      return { ...state, phase: 'analyzing', error: null, retryId: state.retryId + 1 };
    case 'RESET':
      return {
        phase: 'rating-before',
        anxietyBefore: 5,
        anxietyAfter: 5,
        error: null,
        retryId: 0,
      };
    default:
      return state;
  }
}

export function MainScreen() {
  const [state, dispatch] = useReducer(reducer, {
    phase: 'rating-before',
    anxietyBefore: 5,
    anxietyAfter: 5,
    error: null,
    retryId: 0,
  });

  const [showBreathing, setShowBreathing] = useState(false);

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
    data,
    loading,
    deepData,
    error: apiError,
    sendText,
    sendDeepText,
  } = useSSE();

  const surfaceThoughtRef = useRef<string | null>(null);
  const deepResultRef = useRef<HTMLDivElement>(null);
  const lastTextRef = useRef<string | null>(null);
  const lastSurfaceRef = useRef<string | null>(null);

  const handleStart = useCallback(() => {
    dispatch({ type: 'START_RECORDING' });
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    // Phase stays 'recording' until useEffect fires.
    // Do NOT read text here — recognition.stop() is async,
    // final transcript arrives after stop() returns.
  }, [stop]);

  const handleDeepStart = useCallback(() => {
    dispatch({ type: 'START_DEEP' });
    start();
  }, [start]);

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
          surfaceThoughtRef.current = finalText;
          lastTextRef.current = finalText;
          dispatch({ type: 'STOP_RECORDING' });
          sendText(finalText)
            .then(() => dispatch({ type: 'RESULT_RECEIVED' }))
            .catch(() => {
              dispatch({ type: 'ERROR', message: 'Не удалось получить ответ. Попробуйте через минуту.' });
            });
        } else {
          dispatch({ type: 'ERROR', message: 'Не удалось распознать речь. Попробуйте ещё раз.' });
        }
      } else if (state.phase === 'deep-recording') {
        const deepText = getFinalText();
        if (deepText && surfaceThoughtRef.current) {
          lastSurfaceRef.current = deepText;
          dispatch({ type: 'DEEP_ANALYZE' });
          sendDeepText(deepText, surfaceThoughtRef.current)
            .then(() => dispatch({ type: 'DEEP_RESULT_RECEIVED' }))
            .catch(() => {
              dispatch({ type: 'DEEP_ERROR', message: 'Не удалось получить ответ. Попробуйте через минуту.' });
            });
        } else {
          dispatch({ type: 'DEEP_ERROR', message: 'Не удалось распознать речь. Попробуйте ещё раз.' });
        }
      }
    }
    prevListening.current = isListening;
  }, [isListening, state.phase, getFinalText, sendText, sendDeepText]);

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
    if (state.retryId > 0 && lastTextRef.current) {
      sendText(lastTextRef.current)
        .then(() => dispatch({ type: 'RESULT_RECEIVED' }))
        .catch(() => {
          dispatch({ type: 'ERROR', message: 'Не удалось получить ответ. Попробуйте через минуту.' });
        });
    }
  }, [state.retryId]);

  const handleCancel = useCallback(() => {
    cancel();
    dispatch({ type: 'CANCEL_RECORDING' });
  }, [cancel]);

  const handleDeepCancel = useCallback(() => {
    cancel();
    dispatch({ type: 'RESULT_RECEIVED' });
  }, [cancel]);

  const handleSave = useCallback(() => {
    const inProgress = startSession(state.anxietyBefore);
    completeSession(inProgress, state.anxietyAfter, {
      distortions: data?.distortions ?? [],
      reframing: data?.reframing ?? '',
      question: data?.question ?? '',
      verticalArrowLevels: deepData?.levels ?? undefined,
      verticalArrowReframing: deepData?.reframing ?? undefined,
    });
    dispatch({ type: 'SAVE' });
    setTimeout(() => dispatch({ type: 'RESET' }), 2000);
  }, [data, deepData, state.anxietyBefore, state.anxietyAfter]);

  if (!isSupported) {
    return (
      <div>
        <BrowserFallback />
      </div>
    );
  }

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
        <>
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
          <RecordButton
            state={state.phase === 'done' ? 'idle' : 'idle'}
            onStart={handleStart}
            onStop={handleStop}
            onCancel={handleCancel}
          />
          {state.phase === 'done' && (
            <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
              <p style={{ color: 'var(--success)', fontSize: '16px' }}>
                Сессия сохранена ✓
              </p>

            </div>
          )}
        </>
      )}

      {state.phase === 'recording' && (
        <>
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
            {text || 'Говорите...'}
          </div>
        </>
      )}

      {(state.phase === 'analyzing' || state.phase === 'result') && (
        <ResponseView data={data} loading={loading} />
      )}

      {state.phase === 'result' && data && (
        <>
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
        </>
      )}

      {state.phase === 'deep-recording' && (
        <>
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md) var(--space-sm)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 var(--space-sm) 0' }}>
              Вы сказали:
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', fontStyle: 'italic', margin: '0 0 var(--space-lg) 0', lineHeight: 1.5 }}>
              «{surfaceThoughtRef.current ?? ''}»
            </p>
            <p style={{ color: 'var(--text-primary)', fontSize: '17px', fontWeight: 500, margin: '0 0 var(--space-xs) 0' }}>
              Что эта мысль говорит о вас?
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
              Скажите одно предложение.
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
            {text || 'Скажите одно предложение...'}
          </div>
        </>
      )}

      {state.phase === 'deep-analyzing' && (
        <VerticalArrow levels={null} loading={true} />
      )}

      {state.phase === 'deep-result' && (
        <>
          <ResponseView data={data} loading={false} />
          <div ref={deepResultRef}>
            <VerticalArrow
              levels={deepData?.levels ?? null}
              reframing={deepData?.reframing}
              question={deepData?.question}
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
        </>
      )}
    </div>
  );
}
