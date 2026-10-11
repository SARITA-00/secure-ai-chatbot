import {
  Clock3,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  Settings,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { endSession } from "../utils/session";
import "./CustomerSidebar.css";

type CustomerSidebarProps = {
  /** Drawer state on phones / small tablets. Ignored on desktop. */
  open: boolean;
  onClose: () => void;
};

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: Home },
      { to: "/chat", label: "New Chat", icon: MessageSquare },
      { to: "/history", label: "Conversation History", icon: Clock3 },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/activity", label: "Activity Log", icon: FileText },
      { to: "/profile", label: "My Profile", icon: User },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

/** The one customer sidebar, used by every customer page. */
function CustomerSidebar({ open, onClose }: CustomerSidebarProps) {
  // Esc closes the drawer; page scroll is locked while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `cs-nav-item ${isActive ? "active" : ""}`;

  return (
    <aside
      className={`cs-sidebar ${open ? "open" : ""}`}
      aria-label="Main navigation"
    >
      <div className="cs-brand">
        <div className="cs-brand-logo">
          <ShieldCheck size={24} />
        </div>

        <div className="cs-brand-text">
          <strong>NovaCart</strong>
          <span>AI Support</span>
        </div>

        <button
          type="button"
          className="cs-drawer-close"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="cs-nav">
        {NAV_GROUPS.map((group) => (
          <div className="cs-nav-group" key={group.label}>
            <p className="cs-nav-title">{group.label}</p>
            {group.items.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={itemClass} onClick={onClose}>
                <Icon size={19} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="cs-sidebar-bottom">
        <NavLink to="/help-support" className={itemClass} onClick={onClose}>
          <HelpCircle size={19} />
          <span>Help & Support</span>
        </NavLink>

        <Link
          to="/login"
          className="cs-nav-item cs-logout"
          onClick={() => {
            endSession();
            onClose();
          }}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}

export default CustomerSidebar;
