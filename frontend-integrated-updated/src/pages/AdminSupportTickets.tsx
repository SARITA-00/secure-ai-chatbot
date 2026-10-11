import { Check, ChevronDown, RefreshCw, Search, Ticket, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { api, ApiError } from "../services/api";
import type { AdminUser, SupportTicket } from "../types/api";
import { formatAgo } from "../utils/format";
import "./AdminSupportTickets.css";

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [agents, setAgents] = useState<AdminUser[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [agentId, setAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ticketData, userData] = await Promise.all([
        api.getSupportTickets(),
        api.adminUsers(),
      ]);
      setTickets(ticketData);
      setAgents(userData.filter((user) => user.role.toUpperCase() === "AGENT" && user.is_active));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load support tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = filter === "ALL" || ticket.status === filter;
      const matchesSearch =
        !query ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        String(ticket.id).includes(query) ||
        String(ticket.user_id).includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [tickets, filter, search]);

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAgentId(ticket.assigned_agent_id ? String(ticket.assigned_agent_id) : "");
    setError("");
    setSuccess("");
  };

  const saveTicket = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const updated = await api.updateSupportTicket(selected.id, {
        status,
        priority,
        ...(agentId ? { assigned_agent_id: Number(agentId) } : {}),
      });
      setTickets((current) => current.map((ticket) => (ticket.id === updated.id ? updated : ticket)));
      setSelected(updated);
      setSuccess("Ticket updated successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update the ticket.");
    } finally {
      setSaving(false);
    }
  };

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((ticket) => ticket.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    RESOLVED: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    CLOSED: tickets.filter((ticket) => ticket.status === "CLOSED").length,
  };

  return (
    <AdminLayout
      pageClass="admin-support-tickets"
      title="Support Tickets"
      subtitle="Review and manage customer support requests."
      actions={
        <button type="button" className="ticket-refresh-button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spinning" : ""} />
          Refresh
        </button>
      }
    >
      <section className="ticket-toolbar">
        <div className="ticket-search">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tickets..."
            aria-label="Search support tickets"
          />
        </div>

        <div className="ticket-filters" role="tablist" aria-label="Ticket status filters">
          {(Object.keys(counts) as StatusFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item === "ALL" ? "All" : statusLabel[item]}
              <span>{counts[item]}</span>
            </button>
          ))}
        </div>
      </section>

      {error && <div className="ticket-alert error">{error}</div>}
      {success && <div className="ticket-alert success">{success}</div>}

      <section className="ticket-panel">
        <div className="ticket-panel-header">
          <div>
            <h2>Customer Tickets</h2>
            <p>{filtered.length} ticket{filtered.length === 1 ? "" : "s"} shown</p>
          </div>
        </div>

        {loading ? (
          <div className="ticket-empty">Loading support tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="ticket-empty">
            <Ticket size={30} />
            <strong>No tickets found</strong>
            <span>Try changing the filter or search term.</span>
          </div>
        ) : (
          <div className="ticket-table-wrap">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <div className="ticket-title-cell">
                        <strong>#{ticket.id}</strong>
                        <span>{ticket.subject}</span>
                      </div>
                    </td>
                    <td>Customer #{ticket.user_id}</td>
                    <td><span className={`ticket-badge priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td>
                    <td><span className={`ticket-badge status-${ticket.status.toLowerCase()}`}>{statusLabel[ticket.status] ?? ticket.status}</span></td>
                    <td>{formatAgo(ticket.created_at)}</td>
                    <td>
                      <button type="button" className="ticket-manage-button" onClick={() => openTicket(ticket)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="ticket-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="ticket-modal" role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
            <div className="ticket-modal-header">
              <div>
                <span>Ticket #{selected.id}</span>
                <h2 id="ticket-modal-title">{selected.subject}</h2>
              </div>
              <button type="button" className="ticket-close-button" onClick={() => setSelected(null)} aria-label="Close ticket">
                <X size={20} />
              </button>
            </div>

            <div className="ticket-modal-body">
              <div className="ticket-detail-box">
                <span>Customer</span>
                <strong>User #{selected.user_id}</strong>
              </div>
              <div className="ticket-detail-box ticket-description-box">
                <span>Description</span>
                <p>{selected.description}</p>
              </div>

              <div className="ticket-form-grid">
                <label>
                  Status
                  <div className="ticket-select-wrap">
                    <select value={status} onChange={(event) => setStatus(event.target.value)}>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>

                <label>
                  Priority
                  <div className="ticket-select-wrap">
                    <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>

                <label className="ticket-full-field">
                  Assigned Agent
                  <div className="ticket-select-wrap">
                    <select value={agentId} onChange={(event) => setAgentId(event.target.value)}>
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name} ({agent.email})</option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>
              </div>

              {success && <div className="ticket-inline-success"><Check size={16} /> {success}</div>}
              {error && <div className="ticket-inline-error">{error}</div>}
            </div>

            <div className="ticket-modal-actions">
              <button type="button" className="ticket-secondary-button" onClick={() => setSelected(null)}>
                Close
              </button>
              <button type="button" className="ticket-primary-button" onClick={() => void saveTicket()} disabled={saving}>
                {saving ? "Updating..." : "Update Ticket"}
              </button>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminSupportTickets;
