import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { MainState, Action, Phase } from '../types/session';
import { STORAGE_KEYS } from '../types/session';

function sessionReducer(state: MainState, action: Action): MainState {
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
      return {
        ...state,
        error: action.message,
        phase: state.phase === 'analyzing' ? 'result' : 'rating-before',
      };
    case 'DEEP_ERROR':
      return { ...state, error: action.message, phase: 'result' };
    case 'DISMISS_ERROR':
      return { ...state, error: null };
    case 'RETRY':
      return { ...state, phase: 'analyzing', error: null, retryId: state.retryId + 1 };
    case 'STORE_RESULT':
      return { ...state, data: action.data };
    case 'STORE_DEEP_RESULT':
      return { ...state, deepData: action.data };
    case 'SET_SURFACE_THOUGHT':
      return { ...state, surfaceThought: action.text };
    case 'SET_LAST_TEXT':
      return { ...state, lastText: action.text };
    case 'RESET':
      return {
        phase: 'rating-before',
        anxietyBefore: 5,
        anxietyAfter: 5,
        error: null,
        retryId: 0,
        data: null,
        deepData: null,
        surfaceThought: null,
        lastText: null,
      };
    default:
      return state;
  }
}

function createInitialState(): MainState {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.sessionState);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<MainState>;
      // Only restore if phase indicates an active session
      if (
        parsed.phase &&
        parsed.phase !== 'rating-before' &&
        parsed.phase !== 'done'
      ) {
        return {
          phase: parsed.phase as Phase,
          anxietyBefore: parsed.anxietyBefore ?? 5,
          anxietyAfter: parsed.anxietyAfter ?? 5,
          error: parsed.error ?? null,
          retryId: parsed.retryId ?? 0,
          data: parsed.data ?? null,
          deepData: parsed.deepData ?? null,
          surfaceThought: parsed.surfaceThought ?? null,
          lastText: parsed.lastText ?? null,
        };
      }
    }
  } catch {
    // Ignore parse errors — start fresh
  }
  return {
    phase: 'rating-before',
    anxietyBefore: 5,
    anxietyAfter: 5,
    error: null,
    retryId: 0,
    data: null,
    deepData: null,
    surfaceThought: null,
    lastText: null,
  };
}

const SessionContext = createContext<{
  state: MainState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, undefined, createInitialState);

  // Persist state to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.sessionState, JSON.stringify(state));
    } catch {
      // Storage full or unavailable — degrade gracefully
    }
  }, [state]);

  return (
    <SessionContext.Provider value={{ state, dispatch }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
