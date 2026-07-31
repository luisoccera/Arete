import { Account, Client } from 'appwrite';
import { normalizeUser, uniqueId } from './normalize';
import type { AuthService, RegisterInput } from './types';

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || '';
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';
const recoveryUrl = process.env.EXPO_PUBLIC_APPWRITE_RECOVERY_URL || '';
const verificationUrl = process.env.EXPO_PUBLIC_APPWRITE_VERIFICATION_URL || '';
const client = new Client();
if (endpoint && projectId) client.setEndpoint(endpoint).setProject(projectId);
const account = new Account(client);

export const authService: AuthService = {
  configured: Boolean(endpoint && projectId),
  async current() { return normalizeUser(await account.get()); },
  async login(email, password) {
    await account.createEmailPasswordSession({ email, password });
    return normalizeUser(await account.get());
  },
  async register(input: RegisterInput) {
    await account.create({ userId: uniqueId(), email: input.email, password: input.password, name: input.name });
    await account.createEmailPasswordSession({ email: input.email, password: input.password });
    await account.updatePrefs({ prefs: { username: input.username } });
    if (verificationUrl) await account.createVerification({ url: verificationUrl });
    return normalizeUser(await account.get());
  },
  async logout() { await account.deleteSession({ sessionId: 'current' }); },
  async requestRecovery(email) {
    await account.createRecovery({ email, url: recoveryUrl || window.location.origin });
  },
  async completeRecovery(userId, secret, password) {
    await account.updateRecovery({ userId, secret, password });
  },
  async completeVerification(userId, secret) {
    await account.updateVerification({ userId, secret });
  },
};
