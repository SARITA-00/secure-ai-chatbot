import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  ChevronDown,
  Mail,
  Menu,
  MessageCircle,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { useRef, useState } from "react";

import { Link } from "react-router-dom";

import CustomerSidebar from "../components/CustomerSidebar";
import { api } from "../services/api";

import "./HelpSupport.css";

function HelpSupport() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [contactOpen, setContactOpen] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactDescription, setContactDescription] = useState("");
  const [contactPriority, setContactPriority] = useState("MEDIUM");
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  const faqSectionRef = useRef<HTMLElement | null>(null);

  const faqs = [
    {
      question: "How do I start a conversation?",
      answer:
        "Go to New Chat from the sidebar or click Start a Conversation from your dashboard. You can then type your question and send it to the NovaCart AI Support Assistant.",
    },
    {
      question: "Can I view my previous conversations?",
      answer:
        "Yes. Open Conversation History from the sidebar to view your previous support conversations.",
    },
    {
      question: "How do I change my password?",
      answer:
        "Open Settings and go to the Security section. Select Change Password to update your account password.",
    },
    {
      question: "How can I report suspicious activity?",
      answer:
        "Open Activity Log and review your recent account activity. If you notice something unusual, contact NovaCart support immediately.",
    },
    {
      question: "Is my conversation data secure?",
      answer:
        "NovaCart uses authentication, authorization, security controls, and AI guardrails to help protect conversations and account information.",
    },
  ];

  const filteredFaqs = faqs.filter((faq) =>
    `${faq.question} ${faq.answer}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleBrowseGuides = () => {
    faqSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleContactSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!contactSubject.trim() || !contactDescription.trim()) {
      setContactMessage("Please enter both a subject and description.");
      return;
    }

    try {
      setContactSubmitting(true);
      setContactMessage("");

      await api.createSupportTicket({
        subject: contactSubject.trim(),
        description: contactDescription.trim(),
        priority: contactPriority,
      });

      setContactMessage(
        "Your support request has been submitted successfully."
      );

      setContactSubject("");
      setContactDescription("");
      setContactPriority("MEDIUM");

      setTimeout(() => {
        setContactOpen(false);
        setContactMessage("");
      }, 1500);
    } catch (error) {
      console.error("Failed to create support ticket:", error);

      setContactMessage(
        "Unable to submit your request. Please try again."
      );
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="help-page">
      {/* ================================
          SIDEBAR
      ================================= */}

      <CustomerSidebar
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {mobileMenuOpen && (
        <div
          className="help-mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      {/* ================================
          MAIN
      ================================= */}

      <main className="help-main">
        {/* Mobile top bar */}

        <div className="help-mobile-topbar">
          <div className="help-mobile-brand">
            <div className="help-mobile-logo">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>
          </div>

          <button
            type="button"
            className="help-mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Header */}

        <header className="help-header">
          <div>
            <h1>Help & Support</h1>

            <p>Find answers and get help with NovaCart</p>
          </div>

          <div className="help-user-profile">
            <div className="help-avatar">JD</div>

            <div className="help-user-info">
              <strong>John Doe</strong>
              <span>Customer</span>
            </div>
          </div>
        </header>

        <div className="help-content">
          {/* ================================
              SEARCH
          ================================= */}

          <section className="help-search-card">
            <div className="help-search-icon">
              <Search size={24} />
            </div>

            <h2>How can we help?</h2>

            <p>
              Search our help resources or browse the
              frequently asked questions below.
            </p>

            <div className="help-search">
              <Search size={19} />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setOpenFaq(null);
                }}
                placeholder="Search for help..."
              />
            </div>
          </section>

          {/* ================================
              SUPPORT OPTIONS
          ================================= */}

          <section className="help-section">
            <div className="help-section-heading">
              <h2>Support Options</h2>

              <p>
                Choose the option that best matches your needs.
              </p>
            </div>

            <div className="support-options">
              {/* AI SUPPORT */}

              <div className="support-card">
                <div className="support-card-icon">
                  <MessageCircle size={23} />
                </div>

                <div className="support-card-content">
                  <h3>Chat with AI Support</h3>

                  <p>
                    Get instant answers to common questions
                    using the NovaCart AI Support Assistant.
                  </p>

                  <Link
                    to="/chat"
                    className="support-link"
                  >
                    Start a Chat
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              {/* HELP CENTER */}

              <div className="support-card">
                <div className="support-card-icon">
                  <BookOpen size={23} />
                </div>

                <div className="support-card-content">
                  <h3>Help Center</h3>

                  <p>
                    Browse guides and useful information
                    about using NovaCart.
                  </p>

                  <button
                    type="button"
                    className="support-link"
                    onClick={handleBrowseGuides}
                  >
                    Browse Guides
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* CONTACT SUPPORT */}

              <div className="support-card">
                <div className="support-card-icon">
                  <Mail size={23} />
                </div>

                <div className="support-card-content">
                  <h3>Contact Support</h3>

                  <p>
                    Need additional help? Contact our
                    customer support team.
                  </p>

                  <button
                    type="button"
                    className="support-link"
                    onClick={() => {
                      setContactOpen(true);
                      setContactMessage("");
                    }}
                  >
                    Contact Us
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ================================
              FAQ
          ================================= */}

          <section
            className="help-section"
            ref={faqSectionRef}
          >
            <div className="help-section-heading">
              <h2>Frequently Asked Questions</h2>

              <p>
                Quick answers to common questions.
              </p>
            </div>

            <div className="faq-card">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, index) => (
                  <div
                    className={`faq-item ${
                      openFaq === index ? "open" : ""
                    }`}
                    key={faq.question}
                  >
                    <button
                      type="button"
                      className="faq-question"
                      onClick={() => toggleFaq(index)}
                    >
                      <span>{faq.question}</span>

                      <ChevronDown
                        size={19}
                        className="faq-chevron"
                      />
                    </button>

                    {openFaq === index && (
                      <div className="faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="faq-empty">
                  <Search size={22} />

                  <h3>No matching questions</h3>

                  <p>
                    Try searching with a different keyword.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ================================
              SECURITY NOTICE
          ================================= */}

          <section className="help-security-card">
            <div className="help-security-icon">
              <AlertCircle size={22} />
            </div>

            <div>
              <h3>Notice something suspicious?</h3>

              <p>
                If you notice an unfamiliar login,
                unexpected account activity, or anything
                unusual, review your Activity Log and
                contact support.
              </p>

              <Link
                to="/activity"
                className="security-help-link"
              >
                View Activity Log
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* ================================
          CONTACT SUPPORT MODAL
      ================================= */}

      {contactOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
          onClick={() => {
            if (!contactSubmitting) {
              setContactOpen(false);
              setContactMessage("");
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.2)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    color: "#111827",
                  }}
                >
                  Contact Support
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  Tell us what you need help with.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!contactSubmitting) {
                    setContactOpen(false);
                    setContactMessage("");
                  }
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#64748b",
                }}
                aria-label="Close contact form"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleContactSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Subject
                </label>

                <input
                  type="text"
                  value={contactSubject}
                  onChange={(event) =>
                    setContactSubject(event.target.value)
                  }
                  placeholder="What do you need help with?"
                  disabled={contactSubmitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px",
                    border: "1px solid #d8dee9",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Priority
                </label>

                <select
                  value={contactPriority}
                  onChange={(event) =>
                    setContactPriority(event.target.value)
                  }
                  disabled={contactSubmitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px",
                    border: "1px solid #d8dee9",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "#ffffff",
                  }}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontWeight: 600,
                    color: "#1e293b",
                  }}
                >
                  Description
                </label>

                <textarea
                  value={contactDescription}
                  onChange={(event) =>
                    setContactDescription(event.target.value)
                  }
                  placeholder="Describe your issue..."
                  rows={5}
                  disabled={contactSubmitting}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px",
                    border: "1px solid #d8dee9",
                    borderRadius: "8px",
                    fontSize: "14px",
                    resize: "vertical",
                  }}
                />
              </div>

              {contactMessage && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "11px 12px",
                    borderRadius: "8px",
                    background: contactMessage.includes(
                      "successfully"
                    )
                      ? "#ecfdf5"
                      : "#fef2f2",
                    color: contactMessage.includes(
                      "successfully"
                    )
                      ? "#047857"
                      : "#b91c1c",
                    fontSize: "14px",
                  }}
                >
                  {contactMessage}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (!contactSubmitting) {
                      setContactOpen(false);
                      setContactMessage("");
                    }
                  }}
                  disabled={contactSubmitting}
                  style={{
                    padding: "10px 18px",
                    border: "1px solid #d8dee9",
                    borderRadius: "8px",
                    background: "#ffffff",
                    cursor: contactSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#d85d88",
                    color: "#ffffff",
                    fontWeight: 600,
                    cursor: contactSubmitting
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {contactSubmitting
                    ? "Submitting..."
                    : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HelpSupport;
