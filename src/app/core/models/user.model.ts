export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  emailVerified: boolean;
  blocked: boolean;
  createdAt: string;
}