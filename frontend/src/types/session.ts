export interface VerticalArrowLevel {
  thought: string;
  label: string;
}

export interface Session {
  id: string;
  date: string;
  distortion: string; // primary distortion
  distortions?: Array<{ type: string; thought: string; why: string }>; // all distortions
  anxietyBefore: number;
  anxietyAfter: number;
  delta: number;
  reframing: string;
  verticalArrowLevels?: Array<{ thought: string; label: string }>;
  verticalArrowReframing?: string;
}

export const STORAGE_KEYS = {
  sessions: 'reframe_sessions',
  onboarding: 'reframe_onboarding',
  theme: 'reframe_theme',
} as const;
