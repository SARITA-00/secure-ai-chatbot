/** Shapes returned by the FastAPI backend. */

export type ApiRole = "CUSTOMER" | "AGENT" | "ADMIN";

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: ApiRole;
  is_active: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export type ChatResponse = {
  conversation_id: number;
  response: string;
};

export type ConversationSummary = {
  id: number;
  title: string | null;
  preview: string;
  created_at: string;
  last_activity_at: string;
};

export type ApiMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

/* ---------------- Admin ---------------- */

export type AdminStats = {
  total_users: number;
  active_users: number;
  suspended_users: number;
  admin_users: number;
  total_conversations: number;
  conversations_last_24h: number;
  active_conversations: number;
  total_messages: number;
  security_events_total: number;
  security_events_high: number;
  security_events_last_24h: number;
  prompt_injection_total: number;
  unsafe_output_total: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string | null;
  last_activity_at: string | null;
  conversation_count: number;
};

export type AdminConversation = {
  id: number;
  user_id: number;
  customer: string;
  email: string;
  title: string | null;
  last_message: string;
  created_at: string;
  last_activity_at: string;
  message_count: number;
  flagged: boolean;
};

export type AdminSecurityEvent = {
  id: number;
  event_type: string;
  severity: string;
  description: string;
  action_taken: string;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  conversation_id: number | null;
  created_at: string;
};

export type AdminActivity = {
  id: string;
  actor: string;
  actor_type: "Customer" | "Admin" | "System";
  action: string;
  description: string;
  kind: "Success" | "Security" | "Warning" | "Info";
  created_at: string;
};

export type ReportPeriod = "today" | "7d" | "30d" | "90d" | "year";

export type AdminReport = {
  period: ReportPeriod;
  new_users: number | null;
  new_users_delta: number | null;
  conversations: number;
  conversations_delta: number | null;
  messages: number;
  security_events: number;
  bars: Array<{ label: string; value: number }>;
  active_pct: number;
  idle_pct: number;
  flagged_pct: number;
  prompt_injection: number;
  unsafe_output: number;
  other_security: number;
};

export type SupportTicket = {
  id: number;
  user_id: number;
  assigned_agent_id: number | null;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  created_at: string;
  updated_at: string;
};
