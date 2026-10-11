import { useEffect, useState } from "react";
import { Menu, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import { api, ApiError } from "../services/api";
import { formatDay, formatTime } from "../utils/format";
import "./History.css";

type Conversation = {
  id: number;
  title: string;
  preview: string;
  date: string;
  time: string;
};

function History() {
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .listConversations()
      .then((rows) => {
        if (cancelled) return;
        setConversations(
          rows.map((row) => ({
            id: row.id,
            title: row.title || "Untitled conversation",
            preview: row.preview,
            date: formatDay(row.last_activity_at),
            time: formatTime(row.last_activity_at),
          }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your conversations."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredConversations = conversations.filter(
    (conversation) =>
      conversation.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conversation.preview
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="history-page">

      {/* ================= MOBILE TOP BAR ================= */}

      <header className="history-mobile-topbar">

        <div className="history-mobile-brand">
          <ShieldCheck size={20} />
          <span>NovaCart</span>
        </div>

        <button
          type="button"
          className="history-mobile-menu-button"
          aria-label="Open navigation menu"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu size={22} />
        </button>

      </header>


      {/* ================= MOBILE OVERLAY ================= */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="history-mobile-overlay"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
        />
      )}


      {/* ================= SIDEBAR ================= */}

      <CustomerSidebar open={mobileMenuOpen} onClose={closeMobileMenu} />


      {/* ================= MAIN ================= */}

      <main className="history-main">

        {/* ================= HEADER ================= */}

        <header className="history-header">

          <div>
            <h1>Conversation History</h1>

            <p>
              View and manage your previous conversations
            </p>
          </div>


          <Link
            to="/chat"
            className="history-new-chat"
          >
            <MessageSquare size={17} />
            New Chat
          </Link>

        </header>


        {/* ================= CONTENT ================= */}

        <section className="history-content">

          {/* ================= SEARCH ================= */}

          <div className="history-toolbar">

            <div className="history-search">

              <Search size={18} />

              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
              />

            </div>


            <span className="conversation-count">

              {filteredConversations.length}{" "}

              {filteredConversations.length === 1
                ? "conversation"
                : "conversations"}

            </span>

          </div>


          {/* ================= CONVERSATION LIST ================= */}

          <div className="conversation-list">

            {filteredConversations.length > 0 ? (

              filteredConversations.map((conversation) => (

                <div
                  className="conversation-card clickable"
                  key={conversation.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/chat?c=${conversation.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/chat?c=${conversation.id}`);
                    }
                  }}
                >

                  <div className="conversation-icon">
                    <MessageSquare size={20} />
                  </div>


                  <div className="conversation-info">

                    <div className="conversation-title-row">

                      <h3>
                        {conversation.title}
                      </h3>

                      <span>
                        {conversation.date} ·{" "}
                        {conversation.time}
                      </span>

                    </div>


                    <p>
                      {conversation.preview}
                    </p>

                  </div>

                </div>

              ))

            ) : (

              <div className="history-empty-state">

                <div className="history-empty-icon">
                  <Search size={22} />
                </div>

                <h3>
                  {isLoading
                    ? "Loading conversations…"
                    : loadError
                      ? "Couldn't load conversations"
                      : conversations.length === 0
                        ? "No conversations yet"
                        : "No conversations found"}
                </h3>

                <p>
                  {isLoading
                    ? "One moment."
                    : loadError
                      ? loadError
                      : conversations.length === 0
                        ? "Start a new chat and it will show up here."
                        : "Try a different search term."}
                </p>

              </div>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default History;