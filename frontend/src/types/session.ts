export interface VerticalArrowLevel {
  thought: string;
  label: string;
}

export interface Session {
  id: string;
  date: string;
  distortion: string;
  anxietyBefore: number;
  anxietyAfter: number;
  delta: number;
  reframing: string;
}

export const STORAGE_KEYS = {
  sessions: 'reframe_sessions',
  onboarding: 'reframe_onboarding',
  theme: 'reframe_theme',
} as const;
