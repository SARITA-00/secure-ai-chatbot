import {
  Activity,
  BarChart3,
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Ticket,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { api } from "../services/api";
import { formatAgo, humanizeType } from "../utils/format";
import { endSession, getInitials, getUser } from "../utils/session";
import "./AdminLayout.css";

type AdminLayoutProps = {
  title: string;
  subtitle?: string;
  /** Page-level buttons shown in the header (e.g. Save, Export). */
  actions?: ReactNode;
  /** Root class some page stylesheets are scoped under. */
  pageClass?: string;
  children: ReactNode;
};

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/admin/users", label: "User Management", icon: Users },
      {
        to: "/admin/conversations",
        label: "Conversations",
        icon: MessageSquare,
      },
      {
        to: "/admin/support-tickets",
        label: "Support Tickets",
        icon: Ticket,
      },
    ],
  },
  {
    label: "Security & Reports",
    items: [
      { to: "/admin/security", label: "Security Events", icon: ShieldAlert },
      { to: "/admin/activity", label: "Activity Logs", icon: Activity },
      { to: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Preferences",
    items: [{ to: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

type Notice = {
  id: number;
  title: string;
  detail: string;
  time: string;
  to: string;
  tone: "danger" | "warning" | "info";
};

function AdminLayout({
  title,
  subtitle,
  actions,
  pageClass = "",
  children,
}: AdminLayoutProps) {
  // Overlays remember the route they were opened on, so navigating away
  // closes them without needing an effect.
  const location = useLocation();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const [noticesPath, setNoticesPath] = useState<string | null>(null);
  const menuOpen = menuPath === location.pathname;
  const noticesOpen = noticesPath === location.pathname;
  const setMenuOpen = useCallback(
    (open: boolean) => setMenuPath(open ? location.pathname : null),
    [location.pathname],
  );
  const setNoticesOpen = useCallback(
    (open: boolean | ((current: boolean) => boolean)) =>
      setNoticesPath((current) => {
        const next =
          typeof open === "function"
            ? open(current === location.pathname)
            : open;
        return next ? location.pathname : null;
      }),
    [location.pathname],
  );
  const admin = getUser();
  const adminName = admin?.name ?? "Admin";
  const adminInitials = getInitials(admin?.name);

  // Notifications = the latest security events from the backend.
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    api
      .adminSecurityEvents()
      .then((events) => {
        if (cancelled) return;
        const latest = events.slice(0, 5).map<Notice>((event) => ({
          id: event.id,
          title: humanizeType(event.event_type),
          detail: event.user_name
            ? `${event.description} (${event.user_name})`
            : event.description,
          time: formatAgo(event.created_at),
          to: "/admin/security",
          tone:
            event.severity.toUpperCase() === "HIGH"
              ? "danger"
              : event.severity.toUpperCase() === "MEDIUM"
                ? "warning"
                : "info",
        }));
        setNotices(latest);
        setUnread(latest.map((notice) => notice.id));
      })
      .catch(() => {
        /* notifications are optional; the bell just stays empty */
      });

    return () => {
      cancelled = true;
    };
  }, []);
  const noticesRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), [setMenuOpen]);

  // Browser tab title.
  useEffect(() => {
    document.title = `${title} · NovaCart Admin`;
  }, [title]);

  // Lock page scroll while the mobile drawer is open; Esc closes overlays.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (noticesOpen) setNoticesOpen(false);
      if (menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, noticesOpen, setMenuOpen, setNoticesOpen]);

  // Click outside closes the notifications popover.
  useEffect(() => {
    if (!noticesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!noticesRef.current?.contains(event.target as Node)) {
        setNoticesOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [noticesOpen, setNoticesOpen]);

  // If the window grows past the drawer breakpoint, reset the drawer.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 901px)");
    const onChange = () => query.matches && setMenuOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [setMenuOpen]);

  return (
    <div className="al-shell">
      <a href="#admin-main-content" className="al-skip-link">
        Skip to content
      </a>

      <aside
        id="admin-navigation"
        className={`al-sidebar ${menuOpen ? "open" : ""}`}
        aria-label="Admin navigation"
      >
        <div className="al-brand">
          <div className="al-brand-logo">
            <ShieldCheck size={24} />
          </div>
          <div className="al-brand-text">
            <strong>NovaCart</strong>
            <span>Admin Panel</span>
          </div>
          <button
            type="button"
            className="al-drawer-close"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="al-nav">
          {NAV_GROUPS.map((group) => (
            <div className="al-nav-group" key={group.label}>
              <p className="al-nav-title">{group.label}</p>
              {group.items.map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={"end" in rest ? rest.end : false}
                  className={({ isActive }) =>
                    `al-nav-item ${isActive ? "active" : ""}`
                  }
                >
                  <Icon size={19} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="al-sidebar-bottom">
          <div className="al-sidebar-user">
            <div className="al-avatar-sm">{adminInitials}</div>
            <div>
              <strong>{adminName}</strong>
              <span>Administrator</span>
            </div>
          </div>
          <Link to="/login" className="al-logout" onClick={endSession}>
            <LogOut size={19} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="al-overlay"
          onClick={closeMenu}
          aria-label="Close navigation menu"
        />
      )}

      <div className="al-main">
        {/* Phone / tablet top bar */}
        <header className="al-topbar">
          <Link to="/admin" className="al-topbar-brand">
            <span className="al-topbar-logo">
              <ShieldCheck size={20} />
            </span>
            <span>
              <strong>NovaCart</strong>
              <small>Admin Panel</small>
            </span>
          </Link>

          <button
            ref={menuButtonRef}
            type="button"
            className="al-icon-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* Page header */}
        <header className="al-header">
          <div className="al-header-title">
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <div className="al-header-right">
            {actions && <div className="al-header-actions">{actions}</div>}

            <div className="al-notices" ref={noticesRef}>
              <button
                type="button"
                className="al-icon-button"
                aria-label={`Notifications${
                  unread.length ? `, ${unread.length} unread` : ""
                }`}
                aria-expanded={noticesOpen}
                aria-haspopup="true"
                onClick={() => setNoticesOpen((open) => !open)}
              >
                <Bell size={20} />
                {unread.length > 0 && <span className="al-notice-dot" />}
              </button>

              {noticesOpen && (
                <div className="al-notice-panel">
                  <div className="al-notice-head">
                    <strong>Notifications</strong>
                    <button
                      type="button"
                      onClick={() => setUnread([])}
                      disabled={unread.length === 0}
                    >
                      Mark all read
                    </button>
                  </div>

                  <ul>
                    {notices.length === 0 && (
                      <li>
                        <span className="al-notice-copy">
                          <strong>No notifications</strong>
                          <span>Security events will appear here.</span>
                        </span>
                      </li>
                    )}

                    {notices.map((notice) => (
                      <li key={notice.id}>
                        <Link
                          to={notice.to}
                          className={unread.includes(notice.id) ? "unread" : ""}
                          onClick={() =>
                            setUnread((ids) =>
                              ids.filter((id) => id !== notice.id),
                            )
                          }
                        >
                          <span className={`al-notice-icon ${notice.tone}`}>
                            <Bell size={14} />
                          </span>
                          <span className="al-notice-copy">
                            <strong>{notice.title}</strong>
                            <span>{notice.detail}</span>
                            <small>{notice.time}</small>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="al-profile">
              <div className="al-avatar">{adminInitials}</div>
              <div className="al-profile-text">
                <strong>{adminName}</strong>
                <span>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        <main
          id="admin-main-content"
          className={`al-content ${pageClass}`.trim()}
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
