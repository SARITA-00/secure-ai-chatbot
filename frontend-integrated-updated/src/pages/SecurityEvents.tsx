import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import Modal from "../components/Modal";
import AdminLayout from "../layouts/AdminLayout";
import { api } from "../services/api";
import type { AdminSecurityEvent } from "../types/api";
import { formatDateTime, humanizeType } from "../utils/format";
import { useLoad } from "../utils/useLoad";
import "./SecurityEvents.css";

type SecurityEvent = {
  id: number;
  type: string;
  user: string;
  email: string;
  description: string;
  time: string;
  severity: "High" | "Medium" | "Low";
  status: "Blocked" | "Logged";
};

const STATUS_CLASS: Record<SecurityEvent["status"], string> = {
  Blocked: "blocked",
  Logged: "reviewed",
};

const toSeverity = (value: string): SecurityEvent["severity"] => {
  const upper = value.toUpperCase();
  return upper === "HIGH" ? "High" : upper === "MEDIUM" ? "Medium" : "Low";
};

const toEvent = (row: AdminSecurityEvent): SecurityEvent => ({
  id: row.id,
  type: humanizeType(row.event_type),
  user: row.user_name ?? "Unknown user",
  email: row.user_email ?? "—",
  description: row.description,
  time: formatDateTime(row.created_at),
  severity: toSeverity(row.severity),
  status: row.action_taken.toUpperCase().includes("BLOCK") ? "Blocked" : "Logged",
});

function SecurityEvents() {
  const loaded = useLoad(() => api.adminSecurityEvents());
  const events = useMemo(
    () => (loaded.data ?? []).map(toEvent),
    [loaded.data],
  );
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;

  const highCount = events.filter((event) => event.severity === "High").length;
  const mediumCount = events.filter(
    (event) => event.severity === "Medium",
  ).length;
  const blockedCount = events.filter(
    (event) => event.status === "Blocked",
  ).length;

  const filteredEvents = events.filter((event) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      event.user.toLowerCase().includes(searchText) ||
      event.email.toLowerCase().includes(searchText) ||
      event.type.toLowerCase().includes(searchText) ||
      event.description.toLowerCase().includes(searchText);

    const matchesSeverity =
      severityFilter === "All" || event.severity === severityFilter;

    const matchesStatus =
      statusFilter === "All" || event.status === statusFilter;

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getEventIcon = (type: SecurityEvent["type"]) => {
    switch (type) {
      case "Prompt Injection":
        return <ShieldAlert size={18} />;
      case "Unsafe Llm Output":
        return <AlertTriangle size={18} />;
      case "Failed Login":
        return <XCircle size={18} />;
      default:
        return <Activity size={18} />;
    }
  };

  return (
    <AdminLayout
      pageClass="security-events-page"
      title="Security Events"
      subtitle="Monitor and review security-related events"
    >
      <section className="security-overview-banner">
        <div className="security-overview-left">
          <div className="security-overview-icon">
            <ShieldCheck size={26} />
          </div>
          <div className="security-overview-copy">
            <strong>Security Monitoring Active</strong>
            <p>
              NovaCart is actively monitoring authentication, AI interactions,
              and access-control events.
            </p>
          </div>
        </div>
        <span className="security-active-badge">
          <span />
          Monitoring
        </span>
      </section>

      <section className="security-event-summary" aria-label="Security summary">
        <div className="security-event-card">
          <div className="security-event-card-icon red">
            <ShieldAlert size={21} />
          </div>
          <div className="security-summary-copy">
            <span>High Severity</span>
            <strong>{highCount}</strong>
            <small>Requires attention</small>
          </div>
        </div>

        <div className="security-event-card">
          <div className="security-event-card-icon orange">
            <AlertTriangle size={21} />
          </div>
          <div className="security-summary-copy">
            <span>Medium Severity</span>
            <strong>{mediumCount}</strong>
            <small>Being monitored</small>
          </div>
        </div>

        <div className="security-event-card">
          <div className="security-event-card-icon blue">
            <Activity size={21} />
          </div>
          <div className="security-summary-copy">
            <span>Total Events</span>
            <strong>{events.length}</strong>
            <small>Last 24 hours</small>
          </div>
        </div>

        <div className="security-event-card">
          <div className="security-event-card-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div className="security-summary-copy">
            <span>Blocked</span>
            <strong>{blockedCount}</strong>
            <small>Threats prevented</small>
          </div>
        </div>
      </section>

      <section className="security-events-card">
        <div className="security-events-header">
          <div>
            <h2>Security Event Log</h2>
            <p>Review detected threats and security incidents</p>
          </div>
          <span className="security-event-count">
            {filteredEvents.length} shown
          </span>
        </div>

        <div className="security-event-filters">
          <label className="security-event-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search security events..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search security events"
            />
            {search && (
              <button
                type="button"
                className="security-clear-search"
                aria-label="Clear search"
                onClick={() => setSearch("")}
              >
                <X size={15} />
              </button>
            )}
          </label>

          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
            className="security-filter-select"
            aria-label="Filter by severity"
          >
            <option value="All">All Severity</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="security-filter-select"
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Blocked">Blocked</option>
            <option value="Logged">Logged</option>
          </select>
        </div>

        <div className="security-events-list">
          {filteredEvents.map((event) => (
            <article className="security-event-row" key={event.id}>
              <div
                className={`security-event-icon ${event.severity.toLowerCase()}`}
              >
                {getEventIcon(event.type)}
              </div>

              <div className="security-event-details">
                <div className="security-event-title">
                  <strong>{event.type}</strong>
                  <span
                    className={`severity-badge ${event.severity.toLowerCase()}`}
                  >
                    {event.severity}
                  </span>
                  <span
                    className={`event-status-badge ${STATUS_CLASS[event.status]}`}
                  >
                    {event.status}
                  </span>
                </div>

                <p>{event.description}</p>

                <div className="security-event-meta">
                  <span>
                    <User size={12} />
                    {event.user}
                  </span>
                  <span>{event.email}</span>
                  <span>
                    <Clock size={12} />
                    {event.time}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="security-view-button"
                onClick={() => setSelectedId(event.id)}
                aria-label={`View details for ${event.type}`}
              >
                <span>View</span>
                <ChevronRight size={15} />
              </button>
            </article>
          ))}

          {filteredEvents.length === 0 && (
            <div className="security-empty">
              <ShieldCheck size={30} />
              <strong>
                {loaded.loading
                  ? "Loading security events…"
                  : loaded.error
                    ? "Couldn't load security events"
                    : "No security events found"}
              </strong>
              <p>
                {loaded.loading
                  ? "One moment."
                  : loaded.error ||
                    "Try changing your search or filter selections."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSeverityFilter("All");
                  setStatusFilter("All");
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="security-events-footer">
          Showing {filteredEvents.length} of {events.length} events
        </div>
      </section>

      {selectedEvent && (
        <Modal
          title={selectedEvent.type}
          description={selectedEvent.description}
          onClose={() => setSelectedId(null)}
          footer={
            <button
              type="button"
              className="modal-button"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          }
        >
          <div className="security-modal-badges" style={{ marginBottom: 18 }}>
            <span
              className={`severity-badge ${selectedEvent.severity.toLowerCase()}`}
            >
              {selectedEvent.severity} severity
            </span>{" "}
            <span
              className={`event-status-badge ${STATUS_CLASS[selectedEvent.status]}`}
            >
              {selectedEvent.status}
            </span>
          </div>

          <dl className="modal-detail-list">
            <div>
              <dt>Event ID</dt>
              <dd>SEC-{String(selectedEvent.id).padStart(4, "0")}</dd>
            </div>
            <div>
              <dt>User</dt>
              <dd>{selectedEvent.user}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selectedEvent.email}</dd>
            </div>
            <div>
              <dt>Time detected</dt>
              <dd>{selectedEvent.time}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </AdminLayout>
  );
}

export default SecurityEvents;
