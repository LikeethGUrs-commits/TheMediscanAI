import { User } from "@shared/schema";

const AUTH_KEY = "healthhub_user";

export function setAuthUser(user: User) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function getAuthUser(): User | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  return getAuthUser() !== null;
}

export function requireAuth(role?: string): User | null {
  const user = getAuthUser();
  if (!user) return null;
  if (role && user.role !== role) return null;
  return user;
}
