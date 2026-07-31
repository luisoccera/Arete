import type { AreteUser } from './types';

export function normalizeUser(user: any): AreteUser {
  return {
    id: String(user?.$id || ''),
    name: String(user?.name || ''),
    email: String(user?.email || ''),
    username: String(user?.prefs?.username || ''),
    verified: Boolean(user?.emailVerification),
  };
}

export function uniqueId(): string {
  return `arete_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`.slice(0, 36);
}
