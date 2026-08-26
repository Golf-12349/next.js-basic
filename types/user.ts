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

export type CurrentUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  department?: string;
};

export function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = require('react-secure-storage').default?.getItem('data') ?? require('react-secure-storage').getItem('data');
    if (!stored) return null;
    if (typeof stored === 'string') {
      return JSON.parse(stored);
    }
    if (typeof stored === 'object') {
      return stored as CurrentUser;
    }
    return null;
  } catch {
    return null;
  }
}