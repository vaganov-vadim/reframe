import { useReducer, useCallback } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSSE } from '../hooks/useSSE';
import { AnxietySlider } from './AnxietySlider';
import { RecordButton } from './RecordButton';
import { BrowserFallback } from './BrowserFallback';
import { ResponseView } from './ResponseView';
import { PostRatingSlider } from './PostRatingSlider';
import { DeltaDisplay } from './DeltaDisplay';
import { ErrorBanner } from './ErrorBanner';
import { startSession, completeSession } from '../services/sessionService';

type Phase =
  | 'rating-before'
  | 'recording'
  | 'analyzing'
  | 'result'
  | 'rating-after'
  | 'done';

interface MainState {
  phase: Phase;
  anxietyBefore: number;
  anxietyAfter: number;
  error: string | null;
}

type Action =
  | { type: 'SET_ANXIETY_BEFORE'; value: number }
  | { type: 'START_RECORDING' }
  | { type: 'STOP_RECORDING' }
  | { type: 'CANCEL_RECORDING' }
  | { type: 'ANALYZE' }
  | { type: 'RESULT_RECEIVED' }
  | { type: 'SET_ANXIETY_AFTER'; value: number }
  | { type: 'SAVE' }
  | { type: 'ERROR'; message: string }
  | { type: 'DISMISS_ERROR' }
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
    case 'SAVE':
      return { ...state, phase: 'done' };
    case 'ERROR':
      return { ...state, error: action.message, phase: 'rating-before' };
    case 'DISMISS_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return {
        phase: 'rating-before',
        anxietyBefore: 5,
        anxietyAfter: 5,
        error: null,
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
  });

  const {
    getFinalText,
    error: speechError,
    isSupported,
    start,
    stop,
    cancel,
  } = useSpeechRecognition();
  const { data, loading, error: apiError, sendText } = useSSE();

  const handleStart = useCallback(() => {
    dispatch({ type: 'START_RECORDING' });
    start();
  }, [start]);

  const handleStop = useCallback(() => {
    stop();
    dispatch({ type: 'STOP_RECORDING' });
    const finalText = getFinalText();
    if (finalText) {
      dispatch({ type: 'ANALYZE' });
      sendText(finalText).then(() => dispatch({ type: 'RESULT_RECEIVED' }));
    }
  }, [stop, getFinalText, sendText]);

  const handleCancel = useCallback(() => {
    cancel();
    dispatch({ type: 'CANCEL_RECORDING' });
  }, [cancel]);

  const handleSave = useCallback(() => {
    const inProgress = startSession(state.anxietyBefore);
    completeSession(inProgress, state.anxietyAfter, {
      distortions: data?.distortions ?? [],
      reframing: data?.reframing ?? '',
      question: data?.question ?? '',
    });
    dispatch({ type: 'SAVE' });
  }, [data, state.anxietyBefore, state.anxietyAfter]);

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
        onRetry={() => dispatch({ type: 'RESET' })}
        onDismiss={() => dispatch({ type: 'DISMISS_ERROR' })}
      />

      {(state.phase === 'rating-before' || state.phase === 'done') && (
        <>
          <AnxietySlider
            value={state.anxietyBefore}
            onChange={(v) => dispatch({ type: 'SET_ANXIETY_BEFORE', value: v })}
            disabled={state.phase === 'done'}
          />
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
              <button
                onClick={() => dispatch({ type: 'RESET' })}
                style={{
                  marginTop: 'var(--space-md)',
                  background: 'var(--accent)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  padding: 'var(--space-sm) var(--space-lg)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Новая сессия
              </button>
            </div>
          )}
        </>
      )}

      {state.phase === 'recording' && (
        <RecordButton
          state="recording"
          onStart={handleStart}
          onStop={handleStop}
          onCancel={handleCancel}
        />
      )}

      {(state.phase === 'analyzing' || state.phase === 'result') && (
        <ResponseView data={data} loading={loading} />
      )}

      {state.phase === 'result' && data && (
        <>
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
