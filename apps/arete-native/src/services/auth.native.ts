import { normalizeUser, uniqueId } from './normalize';
import type { AuthService, RegisterInput } from './types';

const endpoint = (process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '').replace(/\/$/, '');
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const recoveryUrl = process.env.EXPO_PUBLIC_APPWRITE_RECOVERY_URL || 'arete://recovery';
const verificationUrl = process.env.EXPO_PUBLIC_APPWRITE_VERIFICATION_URL || 'arete://verification';

async function request(path: string, method = 'GET', body?: unknown): Promise<any> {
  const response = await fetch(`${endpoint}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Locale': 'es',
      'X-Appwrite-Response-Format': '1.9.5',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return {};
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || 'No pudimos completar la solicitud segura.');
  return payload;
}

async function current() {
  return normalizeUser(await request('/account'));
}

export const authService: AuthService = {
  configured: Boolean(endpoint && projectId),
  current,
  async login(email, password) {
    await request('/account/sessions/email', 'POST', { email, password });
    return current();
  },
  async register(input: RegisterInput) {
    await request('/account', 'POST', {
      userId: uniqueId(), email: input.email, password: input.password, name: input.name,
    });
    await request('/account/sessions/email', 'POST', { email: input.email, password: input.password });
    await request('/account/prefs', 'PATCH', { prefs: { username: input.username } });
    await request('/account/verification', 'POST', { url: verificationUrl });
    return current();
  },
  async logout() { await request('/account/sessions/current', 'DELETE'); },
  async requestRecovery(email) { await request('/account/recovery', 'POST', { email, url: recoveryUrl }); },
  async completeRecovery(userId, secret, password) {
    await request('/account/recovery', 'PUT', { userId, secret, password });
  },
  async completeVerification(userId, secret) {
    await request('/account/verification', 'PUT', { userId, secret });
  },
};
