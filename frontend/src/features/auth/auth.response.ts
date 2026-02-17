// frontend/src/features/auth/auth.response.ts
import { AuthUser } from './auth.types';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: AuthUser;
    profile: AuthUser;
    session?: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      user: {
        id: string;
        email: string;
      };
    };
  };
}
