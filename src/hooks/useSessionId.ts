import { useState, useEffect } from 'react';

const SESSION_KEY = 'resumeforge-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'default-session';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useSessionId(): string {
  const [sessionId, setSessionId] = useState<string>(() => getSessionId());

  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  return sessionId;
}
