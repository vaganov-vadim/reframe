export interface Distortion {
  type: string;
  thought: string;
  why: string;
}

export interface VerticalArrowLevel {
  thought: string;
  label: string;
}

export interface ReframeResponse {
  distortions?: Distortion[];
  levels?: VerticalArrowLevel[];
  reframing: string;
  question: string;
  pattern?: string;
}

export interface DeepResponse {
  levels: VerticalArrowLevel[];
  reframing: string;
  question?: string;
}

export interface Session {
  id: string;
  date: string;
  distortion: string; // primary distortion
  distortions?: Distortion[]; // all distortions
  anxietyBefore: number;
  anxietyAfter: number;
  delta: number;
  reframing: string;
  verticalArrowLevels?: VerticalArrowLevel[];
  verticalArrowReframing?: string;
}

export type Phase =
  | 'rating-before'
  | 'recording'
  | 'analyzing'
  | 'result'
  | 'deep-recording'
  | 'deep-analyzing'
  | 'deep-result'
  | 'rating-after'
  | 'done';

export interface MainState {
  phase: Phase;
  anxietyBefore: number;
  anxietyAfter: number;
  error: string | null;
  retryId: number;
  data: ReframeResponse | null;
  deepData: DeepResponse | null;
  surfaceThought: string | null;
  lastText: string | null;
}

export type Action =
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
  | { type: 'RESET' }
  | { type: 'STORE_RESULT'; data: ReframeResponse }
  | { type: 'STORE_DEEP_RESULT'; data: DeepResponse }
  | { type: 'SET_SURFACE_THOUGHT'; text: string }
  | { type: 'SET_LAST_TEXT'; text: string };

export const STORAGE_KEYS = {
  sessions: 'reframe_sessions',
  onboarding: 'reframe_onboarding',
  theme: 'reframe_theme',
  sessionState: 'reframe_session_state',
} as const;
