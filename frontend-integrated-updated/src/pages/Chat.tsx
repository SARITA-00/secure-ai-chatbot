import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Menu, Plus, Send, ShieldCheck } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import { api, ApiError } from "../services/api";
import { formatTime } from "../utils/format";
import { getInitials, getUser } from "../utils/session";

import "./Chat.css";

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
  time: string;
};

const GREETING: Message = {
  id: 0,
  sender: "bot",
  text: "Hello! I'm the NovaCart AI Support Assistant. How can I help you today?",
  time: "",
};

function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();

  // /chat?c=12 opens an existing conversation (linked from History)
  const requestedId = Number(searchParams.get("c")) || null;

  const [message, setMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [conversationId, setConversationId] = useState<number | null>(
    requestedId
  );
  const [messages, setMessages] = useState<Message[]>(
    requestedId ? [] : [GREETING]
  );
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(
    requestedId !== null
  );
  const [error, setError] = useState("");

  const nextLocalId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  // The id this page already holds in memory. After the first message we put the
  // new id in the URL; the load effect must not re-fetch (and overwrite) a
  // conversation we created ourselves.
  const loadedConversationId = useRef<number | null>(null);

  const initials = getInitials(getUser()?.name);

  // Load an existing conversation when ?c= is present
  useEffect(() => {
    if (requestedId === null) return;
    if (requestedId === loadedConversationId.current) return;

    let cancelled = false;

    api
      .getMessages(requestedId)
      .then((rows) => {
        if (cancelled) return;
        loadedConversationId.current = requestedId;
        setConversationId(requestedId);
        setMessages(
          rows.map((row) => ({
            id: row.id,
            sender: row.role === "user" ? "user" : "bot",
            text: row.content,
            time: formatTime(row.created_at),
          }))
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "That conversation could not be found."
            : "Couldn't load this conversation. Please try again."
        );
        setConversationId(null);
        setMessages([GREETING]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedId]);

  // Keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || isSending) {
      return;
    }

    setError("");
    setIsSending(true);
    setMessage("");

    setMessages((previous) => [
      ...previous,
      {
        id: -nextLocalId.current++,
        sender: "user",
        text,
        time: formatTime(new Date().toISOString()),
      },
    ]);

    try {
      const result = await api.sendMessage(text, conversationId);

      // First message of a new chat: remember the id the backend created
      if (conversationId === null) {
        loadedConversationId.current = result.conversation_id;
        setConversationId(result.conversation_id);
        setSearchParams({ c: String(result.conversation_id) }, { replace: true });
      }

      setMessages((previous) => [
        ...previous,
        {
          id: -nextLocalId.current++,
          sender: "bot",
          text: result.response,
          time: formatTime(new Date().toISOString()),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestion = (text: string) => {
    setMessage(text);
  };

  const startNewChat = () => {
    loadedConversationId.current = null;
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setError("");
    setSearchParams({}, { replace: true });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="chat-page">
      <CustomerSidebar open={mobileMenuOpen} onClose={closeMobileMenu} />

      {mobileMenuOpen && (
        <div
          className="chat-mobile-overlay"
          onClick={closeMobileMenu}
        />
      )}

      <main className="chat-main">
        <div className="chat-mobile-topbar">
          <div className="chat-mobile-brand">
            <div className="chat-mobile-logo">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>
          </div>

          <button
            type="button"
            className="chat-mobile-menu-button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>

        <header className="chat-header">
          <div className="chat-header-info">
            <div className="bot-avatar">
              <Bot size={23} />
            </div>

            <div>
              <h1>NovaCart AI Assistant</h1>

              <div className="online-status">
                <span />
                Online
              </div>
            </div>
          </div>

          <div className="chat-header-actions">
            <button
              type="button"
              className="new-chat-button"
              onClick={startNewChat}
              title="Start a new conversation"
            >
              <Plus size={18} />
              <span>New Chat</span>
            </button>

            <button
              type="button"
              className="chat-menu-button"
              title="Chat options"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </header>

        <section className="messages-area">
          {isLoadingHistory ? (
            <div className="empty-chat">
              <p>Loading conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <Bot size={38} />
              </div>

              <h2>Start a new conversation</h2>

              <p>
                Ask NovaCart AI about orders, payments,
                products, returns, or other customer
                support questions.
              </p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-row ${msg.sender}`}
                >
                  {msg.sender === "bot" && (
                    <div className="message-avatar bot">
                      <Bot size={17} />
                    </div>
                  )}

                  <div className="message-content">
                    <div className="message-bubble">
                      {msg.text}
                    </div>

                    {msg.time && (
                      <span className="message-time">
                        {msg.time}
                      </span>
                    )}
                  </div>

                  {msg.sender === "user" && (
                    <div className="message-avatar user">
                      {initials}
                    </div>
                  )}
                </div>
              ))}

              {isSending && (
                <div className="message-row bot">
                  <div className="message-avatar bot">
                    <Bot size={17} />
                  </div>

                  <div className="message-content">
                    <div
                      className="message-bubble typing-indicator"
                      aria-label="NovaCart AI is typing"
                    >
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </section>

        {error && (
          <div className="chat-error" role="alert">
            {error}
          </div>
        )}

        <div className="suggestions">
          <button
            type="button"
            onClick={() =>
              handleSuggestion("Where is my order?")
            }
          >
            Where is my order?
          </button>

          <button
            type="button"
            onClick={() =>
              handleSuggestion(
                "How can I return a product?"
              )
            }
          >
            How can I return a product?
          </button>

          <button
            type="button"
            onClick={() =>
              handleSuggestion(
                "What payment methods do you accept?"
              )
            }
          >
            Payment methods
          </button>
        </div>

        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask NovaCart AI anything..."
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              type="button"
              className="send-button"
              onClick={sendMessage}
              disabled={!message.trim() || isSending}
              title="Send message"
            >
              <Send size={19} />
            </button>
          </div>

          <p className="chat-disclaimer">
            NovaCart AI can make mistakes. Please verify
            important information.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Chat;