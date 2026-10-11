import {
  BarChart3,
  Download,
  MessageSquare,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "../components/Toast";
import AdminLayout from "../layouts/AdminLayout";
import { api } from "../services/api";
import type { ReportPeriod } from "../types/api";
import { downloadCsv } from "../utils/csv";
import { useLoad } from "../utils/useLoad";
import "./AdminReports.css";

const PERIODS: Array<{ key: ReportPeriod; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "year", label: "This Year" },
];

const fmt = (n: number) => n.toLocaleString("en-US");

function Trend({ delta }: { delta: number | null }) {
  if (delta === null) return <small>No earlier data to compare</small>;
  const up = delta >= 0;
  return (
    <small className={up ? "" : "report-trend-down"}>
      {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
      {Math.abs(delta)}% {up ? "increase" : "decrease"}
    </small>
  );
}

function AdminReports() {
  const { notify } = useToast();
  const [periodKey, setPeriodKey] = useState<ReportPeriod>("30d");
  const periodLabel =
    PERIODS.find((period) => period.key === periodKey)?.label ?? "";

  const loaded = useLoad(() => api.adminReport(periodKey), [periodKey]);
  const data = loaded.data;

  const bars = data?.bars ?? [];

  // Chart scale: four equal gridline steps.
  const maxBar = Math.max(1, ...bars.map((bar) => bar.value));
  const unit = maxBar <= 20 ? 1 : 5;
  const step = Math.max(1, Math.ceil(maxBar / 4 / unit) * unit);
  const axisMax = step * 4;
  const ticks = [4, 3, 2, 1, 0].map((n) => n * step);

  const idlePct = data?.idle_pct ?? 0;
  const activePct = data?.active_pct ?? 0;
  const idleDeg = (idlePct / 100) * 360;
  const activeDeg = idleDeg + (activePct / 100) * 360;
  const donut = data && data.conversations > 0
    ? `conic-gradient(var(--primary) 0deg ${idleDeg}deg, #f59e0b ${idleDeg}deg ${activeDeg}deg, #ef4444 ${activeDeg}deg 360deg)`
    : "#e5e7eb";

  const exportReport = () => {
    if (!data) return;
    downloadCsv(`novacart-report-${periodKey}.csv`, [
      ["Section", "Metric", "Value"],
      ["Overview", "Period", periodLabel],
      ["Overview", "New users", data.new_users ?? "n/a"],
      ["Overview", "Conversations", data.conversations],
      ["Overview", "Messages", data.messages],
      ["Overview", "Security events", data.security_events],
      ...data.bars.map((bar) => ["Conversation volume", bar.label, bar.value]),
      ["Conversation status", "Idle", `${data.idle_pct}%`],
      ["Conversation status", "Active", `${data.active_pct}%`],
      ["Conversation status", "Flagged", `${data.flagged_pct}%`],
      ["Security", "Prompt injection", data.prompt_injection],
      ["Security", "Unsafe AI responses", data.unsafe_output],
      ["Security", "Other", data.other_security],
    ]);
    notify(`Report for "${periodLabel}" exported.`);
  };

  return (
    <AdminLayout
      title="Reports"
      subtitle="Monitor system performance and activity"
    >
      {/* Toolbar */}
      <section className="reports-toolbar">
        <div>
          <h2>System Reports</h2>
          <p>View usage and security statistics</p>
        </div>

        <div className="reports-toolbar-actions">
          <select
            value={periodKey}
            onChange={(event) => setPeriodKey(event.target.value as ReportPeriod)}
            className="report-period-select"
            aria-label="Report period"
          >
            {PERIODS.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="export-report-button"
            onClick={exportReport}
            disabled={!data}
          >
            <Download size={16} />
            Export Report
          </button>
        </div>
      </section>

      {loaded.error && (
        <p role="alert" style={{ color: "#b91c1c", margin: "0 0 12px" }}>
          {loaded.error}
        </p>
      )}

      {/* Performance overview */}
      <section className="report-section">
        <div className="report-section-header">
          <h2>Performance Overview</h2>
          <p>
            {loaded.loading
              ? "Loading…"
              : `System activity for ${periodLabel.toLowerCase()}`}
          </p>
        </div>

        <div className="report-stat-grid">
          <div className="report-stat-card">
            <div className="report-stat-icon blue">
              <UserPlus size={21} />
            </div>
            <div>
              <span>New Users</span>
              <strong>{data?.new_users == null ? "—" : fmt(data.new_users)}</strong>
              {data?.new_users == null ? (
                <small>Sign-up dates aren't tracked</small>
              ) : (
                <Trend delta={data.new_users_delta} />
              )}
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon purple">
              <MessageSquare size={21} />
            </div>
            <div>
              <span>Conversations</span>
              <strong>{data ? fmt(data.conversations) : "—"}</strong>
              <Trend delta={data?.conversations_delta ?? null} />
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon green">
              <BarChart3 size={21} />
            </div>
            <div>
              <span>Messages</span>
              <strong>{data ? fmt(data.messages) : "—"}</strong>
              <small>In conversations started this period</small>
            </div>
          </div>

          <div className="report-stat-card">
            <div className="report-stat-icon orange">
              <ShieldAlert size={21} />
            </div>
            <div>
              <span>Security Events</span>
              <strong>{data ? fmt(data.security_events) : "—"}</strong>
              <small>Requires monitoring</small>
            </div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="reports-chart-grid">
        <section className="report-card">
          <div className="report-card-header">
            <div>
              <h2>Conversation Volume</h2>
              <p>New conversations over time</p>
            </div>
            <MessageSquare size={20} />
          </div>

          <div className="user-growth-chart">
            <div className="growth-y-axis" aria-hidden="true">
              {ticks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>

            <div className="growth-chart-area">
              {[100, 75, 50, 25].map((bottom) => (
                <div
                  key={bottom}
                  className="growth-grid-line"
                  style={{ bottom: `${bottom}%` }}
                />
              ))}

              <div
                className="growth-bars"
                role="img"
                aria-label={`New conversations by period, ${periodLabel}`}
              >
                {bars.map((bar) => (
                  <div className="growth-bar-column" key={bar.label}>
                    <div
                      className="growth-bar"
                      style={{ height: `${(bar.value / axisMax) * 100}%` }}
                      title={`${bar.label}: ${bar.value}`}
                    />
                    <span>{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="report-card">
          <div className="report-card-header">
            <div>
              <h2>Conversation Status</h2>
              <p>Idle, active and flagged conversations</p>
            </div>
            <MessageSquare size={20} />
          </div>

          <div className="conversation-report-content">
            <div className="conversation-donut" style={{ background: donut }}>
              <div className="donut-center">
                <strong>{data ? fmt(data.conversations) : "—"}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="conversation-legend">
              <div className="legend-row">
                <span className="legend-color resolved" />
                <span>Idle</span>
                <strong>{idlePct}%</strong>
              </div>
              <div className="legend-row">
                <span className="legend-color active" />
                <span>Active</span>
                <strong>{activePct}%</strong>
              </div>
              <div className="legend-row">
                <span className="legend-color escalated" />
                <span>Flagged</span>
                <strong>{data?.flagged_pct ?? 0}%</strong>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Security report */}
      <section className="report-card security-report">
        <div className="report-card-header">
          <div>
            <h2>Security Report</h2>
            <p>Security events detected during {periodLabel.toLowerCase()}</p>
          </div>
          <ShieldAlert size={20} />
        </div>

        <div className="security-report-grid">
          <div className="security-report-item">
            <span>Prompt Injection</span>
            <strong>{data?.prompt_injection ?? 0}</strong>
          </div>
          <div className="security-report-item">
            <span>Unsafe AI Responses</span>
            <strong>{data?.unsafe_output ?? 0}</strong>
          </div>
          <div className="security-report-item">
            <span>Other Events</span>
            <strong>{data?.other_security ?? 0}</strong>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminReports;
