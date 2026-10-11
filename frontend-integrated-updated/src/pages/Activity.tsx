import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, FileText, Menu, MessageSquare, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import { api, ApiError } from "../services/api";
import type { ConversationSummary } from "../types/api";
import { formatDateTime } from "../utils/format";
import "./Activity.css";

function Activity() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    api
      .listConversations()
      .then((rows) => {
        if (!cancelled) setConversations(rows);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your activity."
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const lastActive = conversations[0]?.last_activity_at;

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="activity-page">

      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

      <header className="activity-mobile-topbar">
        <div className="activity-mobile-brand">
          <div className="activity-mobile-logo">
            <ShieldCheck size={20} />
          </div>

          <div>
            <strong>NovaCart</strong>
            <span>AI Support</span>
          </div>
        </div>

        <button
          type="button"
          className="activity-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="activity-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Close navigation menu"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <CustomerSidebar open={mobileMenuOpen} onClose={closeMobileMenu} />

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="activity-main">

        {/* PAGE HEADER */}

        <header className="activity-page-header-main">
          <div>
            <h1>Activity Log</h1>

            <p>
              Review your recent account and security activity
            </p>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <section className="activity-page-content">

          {/* =================================================
              SECURITY NOTICE
          ================================================= */}

          <div className="security-notice">

            <div className="security-notice-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <strong>
                Your account activity is protected
              </strong>

              <p>
                Security-related events are recorded to help
                protect your account and maintain system security.
              </p>
            </div>

          </div>

          {/* =================================================
              ACTIVITY SUMMARY
          ================================================= */}

          <div className="activity-summary">

            <div className="summary-card">

              <div className="summary-icon blue">
                <FileText size={20} />
              </div>

              <div>
                <span>Total Activities</span>
                <strong>{conversations.length}</strong>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon green">
                <MessageSquare size={20} />
              </div>

              <div>
                <span>Conversations</span>
                <strong>{conversations.length}</strong>
              </div>

            </div>

            <div className="summary-card">

              <div className="summary-icon orange">
                <Clock3 size={20} />
              </div>

              <div>
                <span>Last Active</span>
                <strong>
                  {lastActive ? formatDateTime(lastActive) : "—"}
                </strong>
              </div>

            </div>

          </div>

          {/* =================================================
              ACTIVITY SECTION HEADER
          ================================================= */}

          <div className="activity-list-header">

            <div>
              <h2>Recent Activity</h2>

              <p>
                Latest actions on your account
              </p>
            </div>


          </div>

          {/* =================================================
              ACTIVITY LIST
          ================================================= */}

          <div className="activity-log-card">

            {conversations.length > 0 ? (

              conversations.map((conversation) => (

                <Link
                  to={`/chat?c=${conversation.id}`}
                  className="activity-log-item"
                  key={conversation.id}
                >

                  <div className="activity-log-icon info">
                    <MessageSquare size={18} />
                  </div>

                  <div className="activity-log-details">

                    <div className="activity-log-title">

                      <strong>
                        Conversation with NovaCart AI
                      </strong>

                      <span>
                        {formatDateTime(conversation.last_activity_at)}
                      </span>

                    </div>

                    <p>
                      {conversation.title ||
                        conversation.preview ||
                        "Untitled conversation"}
                    </p>

                  </div>

                </Link>

              ))

            ) : (

              <div className="activity-empty-state">

                <FileText size={22} />

                <strong>
                  {isLoading
                    ? "Loading activity…"
                    : loadError
                      ? "Couldn't load activity"
                      : "No activity found"}
                </strong>

                <p>
                  {isLoading
                    ? "One moment."
                    : loadError ||
                      "Start a conversation and it will show up here."}
                </p>

              </div>

            )}

          </div>

          {/* =================================================
              SECURITY WARNING
          ================================================= */}

          <div className="activity-warning">

            <AlertTriangle size={18} />

            <div>

              <strong>
                See something unusual?
              </strong>

              <p>
                If you notice activity that you don't recognize,
                change your password and contact support.
              </p>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Activity;