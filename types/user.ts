export type UserRole = 'SuperAdmin' | 'Admin' | 'User';

export type UserStatus = 'active' | 'inactive';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  joinDate: string;
  lastActive?: string;
};