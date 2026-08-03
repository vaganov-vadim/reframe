import { saveSession, type Session } from './storageService';

export interface LLMResponse {
  distortions: Array<{ type: string; thought: string; why: string }>;
  reframing: string;
  question: string;
  action?: string;
  verticalArrowLevels?: Array<{ thought: string; label: string }>;
  verticalArrowReframing?: string;
}

export interface InProgressSession {
  id: string;
  date: string;
  anxietyBefore: number;
}

export function startSession(anxietyBefore: number): InProgressSession {
  return {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    anxietyBefore,
  };
}

export function completeSession(
  session: InProgressSession,
  anxietyAfter: number,
  response: LLMResponse,
): void {
  const completed: Session = {
    id: session.id,
    date: session.date,
    anxietyBefore: session.anxietyBefore,
    anxietyAfter,
    delta: session.anxietyBefore - anxietyAfter,
    distortion: response.distortions[0]?.type ?? 'не определено',
    distortions: response.distortions,
    reframing: response.reframing,
    action: response.action,
    verticalArrowLevels: response.verticalArrowLevels,
    verticalArrowReframing: response.verticalArrowReframing,
  };
  saveSession(completed);
}

/** Seed text for Studio bridge: action first, else reframing. */
export function seedFromSession(session: Pick<Session, 'action' | 'reframing'>): string | null {
  const action = session.action?.trim();
  if (action) return action;
  const reframing = session.reframing?.trim();
  if (reframing) return reframing;
  return null;
}
