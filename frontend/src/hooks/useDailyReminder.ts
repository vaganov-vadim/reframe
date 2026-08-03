import { useEffect } from 'react';
import { maybeNotifyReminder } from '../services/reminderService';

/** Soft daily nudge when the app is opened / becomes visible after preferred time. */
export function useDailyReminder() {
  useEffect(() => {
    const check = () => {
      try {
        maybeNotifyReminder();
      } catch {
        // Notification failures must not break the app
      }
    };
    check();
    const onVis = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
}
