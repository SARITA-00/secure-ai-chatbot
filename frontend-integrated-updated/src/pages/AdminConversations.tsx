import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronRight,
  Clock,
  Eye,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import AdminLayout from "../layouts/AdminLayout";
import { api, ApiError } from "../services/api";
import type { AdminConversation } from "../types/api";
import { formatAgo, formatTime } from "../utils/format";
import { useLoad } from "../utils/useLoad";
import "./AdminConversations.css";

/** Derived: there is no stored status, so it comes from activity and security flags. */
type ConversationStatus = "Active" | "Idle" | "Flagged";

type TranscriptMessage = {
  from: "customer" | "assistant";
  text: string;
  time: string;
};

type Conversation = {
  id: number;
  customer: string;
  email: string;
  subject: string;
  lastMessage: string;
  time: string;
  status: ConversationStatus;
  messages: number;
};

const PAGE_SIZE = 4;
const ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;

const STATUS_CLASS: Record<ConversationStatus, string> = {
  Active: "active",
  Idle: "resolved",
  Flagged: "escalated",
};

const toConversation = (row: AdminConversation): Conversation => ({
  id: row.id,
  customer: row.customer,
  email: row.email,
  subject: row.title || "Untitled conversation",
  lastMessage: row.last_message,
  time: formatAgo(row.last_activity_at),
  status: row.flagged
    ? "Flagged"
    : Date.now() - new Date(row.last_activity_at).getTime() <= ACTIVE_WINDOW_MS
      ? "Active"
      : "Idle",
  messages: row.message_count,
});

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function AdminConversations() {
  const loaded = useLoad(() => api.adminConversations());
  const conversations = useMemo(
    () => (loaded.data ?? []).map(toConversation),
    [loaded.data],
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [transcriptState, setTranscriptState] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  // Load the full transcript whenever a conversation is opened
  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;
    setTranscriptState("loading");
    setTranscript([]);

    api
      .adminConversationMessages(selectedId)
      .then((rows) => {
        if (cancelled) return;
        setTranscript(
          rows.map((row) => ({
            from: row.role === "user" ? "customer" : "assistant",
            text: row.content,
            time: formatTime(row.created_at),
          })),
        );
        setTranscriptState("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err instanceof ApiError ? err.message : err);
        setTranscriptState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const counts = useMemo(
    () => ({
      total: conversations.length,
      active: conversations.filter((c) => c.status === "Active").length,
      idle: conversations.filter((c) => c.status === "Idle").length,
      flagged: conversations.filter((c) => c.status === "Flagged").length,
    }),
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const matchesSearch =
        conversation.customer.toLowerCase().includes(searchText) ||
        conversation.email.toLowerCase().includes(searchText) ||
        conversation.subject.toLowerCase().includes(searchText);
      const matchesStatus =
        statusFilter === "All" || conversation.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, search, statusFilter]);

  const visibleConversations = filteredConversations.slice(0, visibleCount);

  return (
    <AdminLayout
      pageClass="admin-conversations-page"
      title="Conversations"
      subtitle="Monitor customer conversations with NovaCart AI"
    >
      {/* Conversation statistics */}
      <section className="conversation-stat-grid" aria-label="Conversation statistics">
        <div className="conversation-stat-card">
          <div className="conversation-stat-icon blue">
            <MessageSquare size={21} />
          </div>
          <div>
            <span>Total Conversations</span>
            <strong>{counts.total}</strong>
          </div>
        </div>

        <div className="conversation-stat-card">
          <div className="conversation-stat-icon green">
            <Activity size={21} />
          </div>
          <div>
            <span>Active</span>
            <strong>{counts.active}</strong>
          </div>
        </div>

        <div className="conversation-stat-card">
          <div className="conversation-stat-icon purple">
            <ShieldCheck size={21} />
          </div>
          <div>
            <span>Idle</span>
            <strong>{counts.idle}</strong>
          </div>
        </div>

        <div className="conversation-stat-card">
          <div className="conversation-stat-icon orange">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>Flagged</span>
            <strong>{counts.flagged}</strong>
          </div>
        </div>
      </section>

      {/* Conversation management */}
      <section className="conversation-management-card">
        <div className="conversation-management-header">
          <div>
            <h2>Customer Conversations</h2>
            <p>Review recent conversations and support requests</p>
          </div>
        </div>

        <div className="conversation-filters">
          <label className="conversation-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search customer or conversation..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              aria-label="Search customer or conversation"
            />
          </label>

          <select
            className="conversation-filter-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            aria-label="Filter conversations by status"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Idle">Idle</option>
            <option value="Flagged">Flagged</option>
          </select>
        </div>

        <div className="conversation-admin-list">
          {visibleConversations.map((conversation) => (
            <article className="conversation-admin-item" key={conversation.id}>
              <div className="conversation-admin-avatar">
                {initials(conversation.customer)}
              </div>

              <div className="conversation-admin-info">
                <div className="conversation-admin-title">
                  <strong>{conversation.subject}</strong>
                  <span
                    className={`conversation-status ${STATUS_CLASS[conversation.status]}`}
                  >
                    {conversation.status}
                  </span>
                </div>

                <div className="conversation-admin-customer">
                  {conversation.customer}
                  {" • "}
                  {conversation.email}
                </div>

                <p>{conversation.lastMessage}</p>

                <div className="conversation-admin-meta">
                  <span>
                    <Clock size={13} />
                    {conversation.time}
                  </span>
                  <span>
                    <MessageSquare size={13} />
                    {conversation.messages} messages
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="conversation-view-button"
                title="View conversation"
                aria-label={`View conversation: ${conversation.subject}`}
                onClick={() => setSelectedId(conversation.id)}
              >
                <Eye size={17} />
                <span>View</span>
                <ChevronRight size={15} />
              </button>
            </article>
          ))}

          {filteredConversations.length === 0 && (
            <div className="conversation-empty">
              {loaded.loading
                ? "Loading conversations…"
                : loaded.error ||
                  "No conversations found. Try another search or status."}
            </div>
          )}
        </div>

        <div className="conversation-list-footer">
          <span>
            Showing {visibleConversations.length} of {filteredConversations.length}{" "}
            conversations
          </span>

          {visibleCount < filteredConversations.length && (
            <button
              type="button"
              className="conversation-pagination"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load More
            </button>
          )}
        </div>
      </section>

      {selected && (
        <Modal
          size="lg"
          title={selected.subject}
          description={`${selected.customer} • ${selected.email}`}
          onClose={() => setSelectedId(null)}
          footer={
            <button type="button" className="modal-button" onClick={() => setSelectedId(null)}>
              Close
            </button>
          }
        >
          <div className="conv-modal-status">
            <span className={`conversation-status ${STATUS_CLASS[selected.status]}`}>
              {selected.status}
            </span>
            <span>{selected.messages} messages in total</span>
          </div>

          <ol className="conv-transcript" aria-label="Conversation transcript">
            {transcript.map((message, index) => (
              <li key={index} className={`conv-bubble ${message.from}`}>
                <span className="conv-bubble-avatar" aria-hidden="true">
                  {message.from === "customer" ? <User size={14} /> : <Bot size={14} />}
                </span>
                <div>
                  <p>{message.text}</p>
                  <small>
                    {message.from === "customer" ? selected.customer : "NovaCart AI"}
                    {" · "}
                    {message.time}
                  </small>
                </div>
              </li>
            ))}
          </ol>

          {transcriptState === "loading" && <p>Loading messages…</p>}
          {transcriptState === "error" && (
            <p role="alert">Couldn't load this transcript. Please try again.</p>
          )}
        </Modal>
      )}
    </AdminLayout>
  );
}

export default AdminConversations;
