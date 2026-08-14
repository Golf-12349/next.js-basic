export type UserRole = 'Admin' | 'Staff';

export type User = {
  id: string;
  name: string;
  role: UserRole;
};