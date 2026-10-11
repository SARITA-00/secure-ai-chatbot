import type {
  AdminActivity,
  AdminConversation,
  AdminReport,
  AdminSecurityEvent,
  AdminStats,
  AdminUser,
  ApiMessage,
  ApiUser,
  ChatResponse,
  ConversationSummary,
  ReportPeriod,
  TokenResponse,
  SupportTicket,
} from "../types/api";
import { endSession, getToken } from "../utils/session";

const BASE_URL = (
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** FastAPI sends `detail` as a string, or as a list of {msg} for 422 validation errors. */
function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : "",
        )
        .filter(Boolean);
      if (messages.length) return messages.join(" ");
    }
  }
  return fallback;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
  /** Skip the Authorization header and the "session expired" redirect (login/register). */
  auth?: boolean;
  /** Use this token instead of the stored one (needed right after login, before it is stored). */
  token?: string;
};

async function request<T>(
  path: string,
  { method = "GET", body, auth = true, token }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};

  if (body !== undefined) headers["Content-Type"] = "application/json";

  const bearer = token ?? (auth ? getToken() : null);
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Check your connection and try again.",
      0,
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!response.ok) {
    // Token rejected on an authenticated call: the session is over.
    if (response.status === 401 && auth) {
      endSession();
      window.location.assign("/login");
    }

    throw new ApiError(
      extractMessage(data, `Request failed (${response.status})`),
      response.status,
    );
  }

  return data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  register: (name: string, email: string, password: string) =>
    request<ApiUser>("/auth/register", {
      method: "POST",
      body: { name, email, password },
      auth: false,
    }),

  /** Pass a token to call this right after login, before the session is stored. */
  me: (token?: string) =>
    request<ApiUser>("/auth/me", { token, auth: token === undefined }),

  sendMessage: (message: string, conversationId: number | null) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: { message, conversation_id: conversationId },
    }),

  listConversations: () => request<ConversationSummary[]>("/conversations"),

  getMessages: (conversationId: number) =>
    request<ApiMessage[]>(`/conversations/${conversationId}/messages`),

  /* ---------- admin (requires an ADMIN token) ---------- */

  adminStats: () => request<AdminStats>("/admin/stats"),

  adminUsers: () => request<AdminUser[]>("/admin/users"),

  adminSetUserActive: (userId: number, isActive: boolean) =>
    request<AdminUser>(`/admin/users/${userId}/status`, {
      method: "POST",
      body: { is_active: isActive },
    }),

  adminConversations: () =>
    request<AdminConversation[]>("/admin/conversations"),

  adminConversationMessages: (conversationId: number) =>
    request<ApiMessage[]>(`/admin/conversations/${conversationId}/messages`),

  adminSecurityEvents: () =>
    request<AdminSecurityEvent[]>("/admin/security-events"),

  adminActivity: () => request<AdminActivity[]>("/admin/activity"),

  adminReport: (period: ReportPeriod) =>
    request<AdminReport>(`/admin/reports?period=${period}`),

  /* ---------- support tickets ---------- */

  createSupportTicket: (
    subject: string,
    description: string,
    priority: "LOW" | "MEDIUM" | "HIGH",
  ) =>
    request<SupportTicket>("/support-tickets", {
      method: "POST",
      body: { subject, description, priority },
    }),

  getMySupportTickets: () =>
    request<SupportTicket[]>("/support-tickets/my"),

  getSupportTickets: () =>
    request<SupportTicket[]>("/support-tickets"),

  updateSupportTicket: (
    ticketId: number,
    updates: {
      status?: string;
      priority?: string;
      assigned_agent_id?: number;
    },
  ) =>
    request<SupportTicket>(`/support-tickets/${ticketId}`, {
      method: "PATCH",
      body: updates,
    }),
};
