import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronRight,
  FileText,
  Search,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useToast } from "../components/Toast";
import AdminLayout from "../layouts/AdminLayout";
import { api } from "../services/api";
import type { AdminActivity } from "../types/api";
import { formatDateTime } from "../utils/format";
import { useLoad } from "../utils/useLoad";
import { downloadCsv } from "../utils/csv";
import "./AdminActivityLogs.css";

type ActivityLog = {
  id: string;
  actor: string;
  actorType: "Customer" | "Admin" | "System";
  action: string;
  description: string;
  timestamp: string;
  daysAgo: number;
  type: "Success" | "Security" | "Warning" | "Info";
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const toLog = (row: AdminActivity): ActivityLog => ({
  id: row.id,
  actor: row.actor,
  actorType: row.actor_type,
  action: row.action,
  description: row.description,
  timestamp: formatDateTime(row.created_at),
  daysAgo: Math.round(
    (startOfDay(new Date()) - startOfDay(new Date(row.created_at))) / 86_400_000,
  ),
  type: row.kind,
});

const RANGES = [
  { label: "Today", days: 0 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "All Time", days: Infinity },
];

function AdminActivityLogs() {
  const { notify } = useToast();
  const loaded = useLoad(() => api.adminActivity());
  const logs = useMemo(() => (loaded.data ?? []).map(toLog), [loaded.data]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [rangeLabel, setRangeLabel] = useState("Last 30 Days");

  const rangeDays = RANGES.find((range) => range.label === rangeLabel)?.days ?? 30;

  // Logs inside the selected date range (drives the summary cards).
  const rangeLogs = useMemo(
    () =>
      logs.filter((log) =>
        rangeDays === 0 ? log.daysAgo === 0 : log.daysAgo <= rangeDays,
      ),
    [logs, rangeDays],
  );

  const filteredLogs = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return rangeLogs.filter((log) => {
      const matchesSearch =
        log.actor.toLowerCase().includes(searchText) ||
        log.action.toLowerCase().includes(searchText) ||
        log.description.toLowerCase().includes(searchText);
      const matchesType = typeFilter === "All" || log.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [rangeLogs, search, typeFilter]);

  const countOf = (type: ActivityLog["type"]) =>
    rangeLogs.filter((log) => log.type === type).length;

  const getIcon = (type: ActivityLog["type"]) => {
    switch (type) {
      case "Success":
        return <CheckCircle2 size={18} />;
      case "Security":
        return <ShieldAlert size={18} />;
      case "Warning":
        return <XCircle size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  const exportLogs = () => {
    if (filteredLogs.length === 0) {
      notify("There are no logs to export for the current filters.", "info");
      return;
    }
    downloadCsv("novacart-activity-logs.csv", [
      ["ID", "Actor", "Actor Type", "Action", "Description", "Timestamp", "Type"],
      ...filteredLogs.map((log) => [
        log.id,
        log.actor,
        log.actorType,
        log.action,
        log.description,
        log.timestamp,
        log.type,
      ]),
    ]);
    notify(`Exported ${filteredLogs.length} log entries.`);
  };

  return (
    <AdminLayout
      title="Activity Logs"
      subtitle="Review the complete system audit trail"
    >
      {/* Summary cards */}
      <div className="activity-log-summary">
        <div className="activity-summary-card">
          <div className="activity-summary-icon blue">
            <Activity size={21} />
          </div>
          <div>
            <span>Total Events</span>
            <strong>{rangeLogs.length}</strong>
          </div>
        </div>

        <div className="activity-summary-card">
          <div className="activity-summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Successful</span>
            <strong>{countOf("Success")}</strong>
          </div>
        </div>

        <div className="activity-summary-card">
          <div className="activity-summary-icon orange">
            <ShieldAlert size={21} />
          </div>
          <div>
            <span>Security Events</span>
            <strong>{countOf("Security")}</strong>
          </div>
        </div>

        <div className="activity-summary-card">
          <div className="activity-summary-icon red">
            <XCircle size={21} />
          </div>
          <div>
            <span>Warnings</span>
            <strong>{countOf("Warning")}</strong>
          </div>
        </div>
      </div>

      {/* Activity log card */}
      <section className="admin-activity-log-card">
        <div className="admin-activity-log-header">
          <div>
            <h2>System Activity</h2>
            <p>All important user, admin, and security events</p>
          </div>

          <button type="button" className="export-log-button" onClick={exportLogs}>
            <FileText size={16} />
            Export Logs
          </button>
        </div>

        {/* Search and filters */}
        <div className="activity-log-filters">
          <div className="activity-log-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search activity..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search activity logs"
            />
          </div>

          <select
            className="activity-filter-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by event type"
          >
            <option value="All">All Events</option>
            <option value="Success">Success</option>
            <option value="Security">Security</option>
            <option value="Warning">Warning</option>
            <option value="Info">Information</option>
          </select>

          <label className="date-filter-button">
            <Calendar size={15} aria-hidden="true" />
            <select
              value={rangeLabel}
              onChange={(event) => setRangeLabel(event.target.value)}
              aria-label="Filter by date range"
            >
              {RANGES.map((range) => (
                <option key={range.label}>{range.label}</option>
              ))}
            </select>
          </label>
        </div>

        {/* Activity timeline */}
        <div className="admin-activity-timeline">
          {filteredLogs.map((log) => (
            <div className="admin-timeline-item" key={log.id}>
              <div className={`admin-timeline-icon ${log.type.toLowerCase()}`}>
                {getIcon(log.type)}
              </div>

              <div className="admin-timeline-content">
                <div className="admin-timeline-title">
                  <strong>{log.action}</strong>
                  <span className={`activity-type-badge ${log.type.toLowerCase()}`}>
                    {log.type}
                  </span>
                </div>

                <p>{log.description}</p>

                <div className="admin-timeline-meta">
                  <span>
                    <User size={12} />
                    {log.actor}
                  </span>
                  <span>{log.actorType}</span>
                  <span>
                    <span className="clock-icon" aria-hidden="true">
                      ◷
                    </span>
                    {log.timestamp}
                  </span>
                </div>
              </div>

              <div className="timeline-view-indicator" aria-hidden="true">
                <ChevronRight size={17} />
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="activity-log-empty">
              {loaded.loading
                ? "Loading activity logs…"
                : loaded.error ||
                  "No activity logs found. Try another search, event type or date range."}
            </div>
          )}
        </div>

        <div className="activity-log-footer">
          Showing {filteredLogs.length} of {logs.length} recent events
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminActivityLogs;
