import type { ApiUser } from "../types/api";

/** UI roles. The backend has CUSTOMER / AGENT / ADMIN; the UI only has two areas. */
export type Role = "customer" | "admin";

const TOKEN_KEY = "novacart-token";
const USER_KEY = "novacart-user";

export function toUiRole(apiRole: ApiUser["role"]): Role {
  return apiRole === "ADMIN" ? "admin" : "customer";
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getUser(): ApiUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

/** True when the JWT's `exp` claim is in the past (or the token is unreadable). */
function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function getSession(): { role: Role; user: ApiUser } | null {
  const token = getToken();
  const user = getUser();

  if (!token || !user) return null;

  if (isExpired(token)) {
    endSession();
    return null;
  }

  return { role: toUiRole(user.role), user };
}

export function startSession(token: string, user: ApiUser): void {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Replace the stored user (e.g. after re-fetching /auth/me). Keeps the token. */
export function updateStoredUser(user: ApiUser): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function endSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function getInitials(name: string | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
