import {
  Activity,
  BarChart3,
  ChevronRight,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Ticket,
  User,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import { api } from "../services/api";
import { formatAgo } from "../utils/format";
import { getUser } from "../utils/session";
import { useLoad } from "../utils/useLoad";
import "./AdminDashboard.css";

const num = (value: number | undefined) =>
  value === undefined ? "—" : value.toLocaleString();

const share = (part: number, whole: number) =>
  whole > 0 ? `${Math.min(100, Math.round((part / whole) * 100))}%` : "0%";

function AdminDashboard() {
  const stats = useLoad(() => api.adminStats());
  const activity = useLoad(() => api.adminActivity());

  const s = stats.data ?? undefined;
  const recent = (activity.data ?? []).slice(0, 5);
  const firstName = getUser()?.name?.split(" ")[0] ?? "Admin";
  const recentEvents = s?.security_events_last_24h ?? 0;

  return (
    <AdminLayout
      pageClass="admin-dashboard"
      title="Dashboard"
      subtitle="Monitor and manage your NovaCart chatbot."
    >
      {/* Welcome card */}
      <section className="admin-welcome-card">
        <div>
          <p className="admin-welcome-label">ADMINISTRATOR</p>
          <h2>Welcome back, {firstName}! 👋</h2>
          <p>Here's what's happening with your NovaCart chatbot today.</p>
        </div>

        <div className="admin-welcome-icon">
          <ShieldCheck size={42} />
        </div>
      </section>

      {/* System overview */}
      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>System Overview</h2>
            <p>Current system statistics</p>
          </div>
        </div>

        {stats.error && (
          <p role="alert" className="admin-load-error">
            {stats.error}
          </p>
        )}

        <div className="admin-stat-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-icon users">
              <Users size={21} />
            </div>
            <div className="admin-stat-content">
              <span>Total Users</span>
              <strong>{num(s?.total_users)}</strong>
              <small>
                {s ? `${s.active_users.toLocaleString()} active` : "Loading…"}
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon conversations">
              <MessageSquare size={21} />
            </div>
            <div className="admin-stat-content">
              <span>Conversations</span>
              <strong>{num(s?.total_conversations)}</strong>
              <small className={s && s.conversations_last_24h > 0 ? "positive" : ""}>
                {s
                  ? `${s.conversations_last_24h.toLocaleString()} in the last 24h`
                  : "Loading…"}
              </small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon sessions">
              <Activity size={21} />
            </div>
            <div className="admin-stat-content">
              <span>Active Conversations</span>
              <strong>{num(s?.active_conversations)}</strong>
              <small>Active in the last 24h</small>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon security">
              <ShieldAlert size={21} />
            </div>
            <div className="admin-stat-content">
              <span>Security Events</span>
              <strong>{num(s?.security_events_total)}</strong>
              <small className={s && s.security_events_high > 0 ? "warning" : ""}>
                {s
                  ? s.security_events_high > 0
                    ? `${s.security_events_high.toLocaleString()} high severity`
                    : "No high-severity events"
                  : "Loading…"}
              </small>
            </div>
          </div>
        </div>
      </section>

      {/* Recent activity and security overview */}
      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest system events</p>
            </div>
            <Link to="/admin/activity">
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="admin-activity-list">
            {recent.length === 0 && (
              <div className="admin-activity-item">
                <div className="admin-activity-details">
                  <strong>
                    {activity.loading
                      ? "Loading activity…"
                      : activity.error || "No activity yet"}
                  </strong>
                </div>
              </div>
            )}

            {recent.map((item) => {
              const tone =
                item.kind === "Security" || item.kind === "Warning"
                  ? "security"
                  : item.kind === "Info"
                    ? "chat"
                    : "login";
              const Icon =
                tone === "security"
                  ? ShieldAlert
                  : tone === "chat"
                    ? MessageSquare
                    : User;

              return (
                <div className="admin-activity-item" key={item.id}>
                  <div className={`admin-activity-icon ${tone}`}>
                    <Icon size={17} />
                  </div>
                  <div className="admin-activity-details">
                    <strong>{item.action}</strong>
                    <span>
                      {item.actor}
                      {item.description ? ` — ${item.description}` : ""}
                    </span>
                    <small>{formatAgo(item.created_at)}</small>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-header">
            <div>
              <h2>Security Overview</h2>
              <p>Security monitoring status</p>
            </div>
            <Link to="/admin/security">
              View Events <ChevronRight size={16} />
            </Link>
          </div>

          <div className="security-status-card">
            <div className="security-status-header">
              <div className="security-status-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <strong>
                  {recentEvents > 0 ? "Attention Needed" : "System Secure"}
                </strong>
                <span>
                  {recentEvents > 0
                    ? `${recentEvents.toLocaleString()} security event${recentEvents === 1 ? "" : "s"} in the last 24h`
                    : "No security events in the last 24h"}
                </span>
              </div>
            </div>

            <div className="security-metrics">
              <div className="security-metric">
                <div>
                  <span>Prompt Injection Attempts</span>
                  <strong>{num(s?.prompt_injection_total)}</strong>
                </div>
                <div className="security-progress">
                  <span
                    style={{
                      width: share(s?.prompt_injection_total ?? 0, s?.security_events_total ?? 0),
                    }}
                  />
                </div>
              </div>

              <div className="security-metric">
                <div>
                  <span>Unsafe AI Responses Blocked</span>
                  <strong>{num(s?.unsafe_output_total)}</strong>
                </div>
                <div className="security-progress">
                  <span
                    style={{
                      width: share(s?.unsafe_output_total ?? 0, s?.security_events_total ?? 0),
                    }}
                  />
                </div>
              </div>

              <div className="security-metric">
                <div>
                  <span>High-Severity Events</span>
                  <strong>{num(s?.security_events_high)}</strong>
                </div>
                <div className="security-progress">
                  <span
                    style={{
                      width: share(s?.security_events_high ?? 0, s?.security_events_total ?? 0),
                    }}
                  />
                </div>
              </div>
            </div>

            <Link to="/admin/security" className="admin-security-button">
              Open Security Center
            </Link>
          </div>
        </section>
      </div>

      {/* Quick actions */}
      <section className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Quick Actions</h2>
            <p>Frequently used administration tools</p>
          </div>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/users" className="admin-action-card">
            <div className="admin-action-icon users">
              <Users size={22} />
            </div>
            <div>
              <strong>Manage Users</strong>
              <span>View and manage user accounts</span>
            </div>
            <ChevronRight size={18} />
          </Link>

          <Link to="/admin/conversations" className="admin-action-card">
            <div className="admin-action-icon conversations">
              <MessageSquare size={22} />
            </div>
            <div>
              <strong>View Conversations</strong>
              <span>Monitor customer conversations</span>
            </div>
            <ChevronRight size={18} />
          </Link>

          <Link to="/admin/support-tickets" className="admin-action-card">
            <div className="admin-action-icon tickets">
              <Ticket size={22} />
            </div>
            <div>
              <strong>Support Tickets</strong>
              <span>Review and manage customer requests</span>
            </div>
            <ChevronRight size={18} />
          </Link>

          <Link to="/admin/security" className="admin-action-card">
            <div className="admin-action-icon security">
              <ShieldAlert size={22} />
            </div>
            <div>
              <strong>Security Events</strong>
              <span>Review security incidents</span>
            </div>
            <ChevronRight size={18} />
          </Link>

          <Link to="/admin/reports" className="admin-action-card">
            <div className="admin-action-icon reports">
              <BarChart3 size={22} />
            </div>
            <div>
              <strong>View Reports</strong>
              <span>Analyze system performance</span>
            </div>
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminDashboard;
