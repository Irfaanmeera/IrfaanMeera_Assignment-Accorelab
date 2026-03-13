export type UserRole = 'admin' | 'sales' | 'accounts';

export interface User {
  username: string;
  role: UserRole;
}

