export type UserRole = 'admin' | 'user';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at?: string;
}

export interface AuthResponse {
  id: number;
  username: string;
  role: UserRole;
}
