export type AreteUser = {
  id: string;
  name: string;
  email: string;
  username: string;
  verified: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  username: string;
  password: string;
};

export interface AuthService {
  configured: boolean;
  current(): Promise<AreteUser>;
  login(email: string, password: string): Promise<AreteUser>;
  register(input: RegisterInput): Promise<AreteUser>;
  logout(): Promise<void>;
  requestRecovery(email: string): Promise<void>;
  completeRecovery(userId: string, secret: string, password: string): Promise<void>;
  completeVerification(userId: string, secret: string): Promise<void>;
}
