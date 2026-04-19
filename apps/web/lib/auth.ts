import api from './api';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export async function login(email: string, password: string): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await api.post('/auth/login', { email, password });
  const { accessToken, user } = res.data.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
  return { user, accessToken };
}

export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ user: AuthUser; accessToken: string }> {
  const res = await api.post('/auth/register', data);
  const { accessToken, user } = res.data.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
  return { user, accessToken };
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (_) {}
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function getRoleRedirect(role: string): string {
  switch (role?.toUpperCase()) {
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return '/admin';
    case 'STAFF':
      return '/staff';
    case 'PARENT':
      return '/parent';
    case 'FINANCE':
      return '/finance';
    default:
      return '/';
  }
}
