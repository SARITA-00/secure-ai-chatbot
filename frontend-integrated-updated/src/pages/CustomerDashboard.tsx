import { Bell, Bot, Clock3, FileText, Menu, MessageSquare, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import { api } from "../services/api";
import type { ConversationSummary } from "../types/api";
import { formatDateTime } from "../utils/format";
import { getInitials, getUser } from "../utils/session";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recent, setRecent] = useState<ConversationSummary[]>([]);
  const [recentState, setRecentState] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const user = getUser();

  useEffect(() => {
    let cancelled = false;

    api
      .listConversations()
      .then((rows) => {
        if (cancelled) return;
        setRecent(rows.slice(0, 3));
        setRecentState("ready");
      })
      .catch(() => {
        if (!cancelled) setRecentState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="customer-dashboard">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <CustomerSidebar open={mobileMenuOpen} onClose={closeMobileMenu} />


      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="customer-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Close menu"
        />
      )}


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="customer-main">

        {/* ===================================================
            MOBILE TOP BAR
        ==================================================== */}

        <header className="customer-mobile-topbar">

          <div className="customer-mobile-brand">

            <div className="customer-mobile-logo">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>

          </div>


          <button
            type="button"
            className="customer-mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

        </header>


        {/* ===================================================
            DESKTOP / PAGE HEADER
        ==================================================== */}

        <header className="customer-header">

          <div>
            <h1>Dashboard</h1>
            <p>Your NovaCart support center</p>
          </div>


          <div className="customer-header-actions">

            <button
              type="button"
              className="customer-notification-button"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="customer-notification-dot" />
            </button>


            <Link
              to="/profile"
              className="customer-user-profile"
            >

              <div className="customer-avatar">
                {getInitials(user?.name)}
              </div>

              <div className="customer-user-info">
                <strong>{user?.name}</strong>
                <span>Customer</span>
              </div>

            </Link>

          </div>

        </header>


        {/* ===================================================
            CONTENT
        ==================================================== */}

        <section className="customer-content">

          {/* =================================================
              WELCOME
          ================================================== */}

          <div className="customer-welcome-card">

            <div className="customer-welcome-content">

              <span className="customer-welcome-label">
                CUSTOMER SUPPORT
              </span>

              <h2>
                How can we help you today?
              </h2>

              <p>
                Ask our AI assistant about orders,
                payments, products, returns, and more.
              </p>

              <Link
                to="/chat"
                className="customer-primary-button"
              >
                <MessageSquare size={18} />
                Start a Conversation
              </Link>

            </div>


            <div className="customer-welcome-icon">
              <Bot size={70} />
            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS HEADER
          ================================================== */}

          <div className="customer-section-header">

            <div>
              <h2>Quick Actions</h2>
              <span>Get help faster</span>
            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================== */}

          <div className="customer-quick-actions">

            <Link
              to="/chat"
              className="customer-action-card"
            >

              <div className="customer-action-icon">
                <MessageSquare size={22} />
              </div>

              <div>
                <strong>Ask AI Assistant</strong>
                <p>Get instant answers</p>
              </div>

            </Link>


            <Link
              to="/history"
              className="customer-action-card"
            >

              <div className="customer-action-icon">
                <FileText size={22} />
              </div>

              <div>
                <strong>View Conversations</strong>
                <p>See your previous chats</p>
              </div>

            </Link>


            <Link
              to="/activity"
              className="customer-action-card"
            >

              <div className="customer-action-icon">
                <Clock3 size={22} />
              </div>

              <div>
                <strong>Activity Log</strong>
                <p>Review account activity</p>
              </div>

            </Link>

          </div>


          {/* =================================================
              RECENT ACTIVITY HEADER
          ================================================== */}

          <div className="customer-section-header">

            <div>
              <h2>Recent Activity</h2>
            </div>

            <Link to="/activity">
              View all
            </Link>

          </div>


          {/* =================================================
              RECENT ACTIVITY
          ================================================== */}

          <div className="customer-activity-card">

            {recentState !== "ready" || recent.length === 0 ? (

              <div className="customer-activity-item">

                <div className="customer-activity-details">

                  <strong>
                    {recentState === "loading"
                      ? "Loading recent activity…"
                      : recentState === "error"
                        ? "Couldn't load recent activity"
                        : "No activity yet"}
                  </strong>

                  <span>
                    {recentState === "ready"
                      ? "Start a conversation and it will show up here."
                      : "Please try again in a moment."}
                  </span>

                </div>

              </div>

            ) : (

              recent.map((conversation) => (

                <Link
                  to={`/chat?c=${conversation.id}`}
                  className="customer-activity-item"
                  key={conversation.id}
                >

                  <div className="customer-activity-symbol">
                    <MessageSquare size={17} />
                  </div>

                  <div className="customer-activity-details">

                    <strong>
                      {conversation.title ||
                        conversation.preview ||
                        "Untitled conversation"}
                    </strong>

                    <span>
                      {formatDateTime(conversation.last_activity_at)}
                    </span>

                  </div>

                </Link>

              ))

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default CustomerDashboard;