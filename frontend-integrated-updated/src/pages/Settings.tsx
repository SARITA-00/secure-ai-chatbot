
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  Lock,
  Menu,
  MessageSquare,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import CustomerSidebar from "../components/CustomerSidebar";
import { api } from "../services/api";
import { getInitials, getUser } from "../utils/session";
import "./Settings.css";

type SettingsData = {
  language: string;
  theme: string;
  emailNotifications: boolean;
  securityAlerts: boolean;
  chatNotifications: boolean;
  suggestedQuestions: boolean;
  chatHistory: boolean;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
};

const defaultSettings: SettingsData = {
  language: "English",
  theme: "Light",
  emailNotifications: true,
  securityAlerts: true,
  chatNotifications: true,
  suggestedQuestions: true,
  chatHistory: true,
  twoFactorEnabled: false,
  loginAlerts: true,
};

function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const storedSettings = localStorage.getItem("novacart-settings");

    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };

  const handleSaveSettings = () => {
    localStorage.setItem("novacart-settings", JSON.stringify(settings));
    setSaved(true);

    window.setTimeout(() => setSaved(false), 2500);
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordError("");
    setPasswordSuccess("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (passwordSaving) return;

    setShowPasswordModal(false);
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    setPasswordSaving(true);

    try {
      const result = await api.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordSuccess(result.message || "Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError(
        error instanceof Error
          ? error.message
          : "Unable to change your password. Please try again."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleTwoFactorToggle = () => {
    // This updates the local preference only. It does not enable
    // server-side two-factor authentication.
    updateSetting("twoFactorEnabled", !settings.twoFactorEnabled);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="settings-page">
      <header className="settings-mobile-topbar">
        <div className="settings-mobile-brand">
          <div className="settings-mobile-logo">
            <ShieldCheck size={20} />
          </div>
          <div>
            <strong>NovaCart</strong>
            <span>AI Support</span>
          </div>
        </div>

        <button
          type="button"
          className="settings-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {mobileMenuOpen && (
        <button
          type="button"
          className="settings-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Close navigation menu"
        />
      )}

      <CustomerSidebar open={mobileMenuOpen} onClose={closeMobileMenu} />

      <main className="settings-main">
        <header className="settings-page-header">
          <div>
            <h1>Settings</h1>
            <p>Manage your account and preferences</p>
          </div>

          <Link to="/profile" className="settings-user-profile">
            <div className="settings-avatar">
              {getInitials(getUser()?.name)}
            </div>
            <div className="settings-user-info">
              <strong>{getUser()?.name}</strong>
              <span>Customer</span>
            </div>
          </Link>
        </header>

        <div className="settings-content">
          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <User size={21} />
              </div>
              <div>
                <h2>Account Preferences</h2>
                <p>Manage your basic account preferences</p>
              </div>
            </div>

            <div className="settings-row">
              <div>
                <strong>Language</strong>
                <span>Select your preferred language</span>
              </div>
              <select
                className="settings-select"
                value={settings.language}
                onChange={(event) =>
                  updateSetting("language", event.target.value)
                }
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Kannada</option>
              </select>
            </div>

            <div className="settings-row">
              <div>
                <strong>Theme</strong>
                <span>Choose how NovaCart looks</span>
              </div>
              <select
                className="settings-select"
                value={settings.theme}
                onChange={(event) =>
                  updateSetting("theme", event.target.value)
                }
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System Default</option>
              </select>
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <Bell size={21} />
              </div>
              <div>
                <h2>Notification Preferences</h2>
                <p>Control how you receive notifications</p>
              </div>
            </div>

            {([
              ["emailNotifications", "Email Notifications", "Receive important account updates by email"],
              ["securityAlerts", "Security Alerts", "Receive alerts about suspicious activity"],
              ["chatNotifications", "Chat Notifications", "Get notifications about your conversations"],
            ] as const).map(([key, title, description]) => (
              <div className="settings-row" key={key}>
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(event) =>
                      updateSetting(key, event.target.checked)
                    }
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            ))}
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <MessageSquare size={21} />
              </div>
              <div>
                <h2>Chat Preferences</h2>
                <p>Customize your AI support experience</p>
              </div>
            </div>

            {([
              ["suggestedQuestions", "Suggested Questions", "Show suggested questions in new conversations"],
              ["chatHistory", "Chat History", "Save conversations to your history"],
            ] as const).map(([key, title, description]) => (
              <div className="settings-row" key={key}>
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <label className="settings-toggle">
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(event) =>
                      updateSetting(key, event.target.checked)
                    }
                  />
                  <span className="settings-toggle-slider" />
                </label>
              </div>
            ))}
          </section>

          <section className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-icon">
                <Lock size={21} />
              </div>
              <div>
                <h2>Security</h2>
                <p>Manage your account security</p>
              </div>
            </div>

            <div className="settings-security-row">
              <div>
                <strong>Password</strong>
                <span>Change your account password securely</span>
              </div>
              <button
                type="button"
                className="settings-secondary-button"
                onClick={openPasswordModal}
              >
                Change Password
              </button>
            </div>

            <div className="settings-security-row">
              <div>
                <strong>Two-Factor Authentication</strong>
                <span>
                  This preference is local only; server-side 2FA is not
                  configured by this page.
                </span>
              </div>
              <button
                type="button"
                className="settings-secondary-button"
                onClick={handleTwoFactorToggle}
              >
                {settings.twoFactorEnabled ? "Disable" : "Enable"}
              </button>
            </div>

            <div className="settings-security-row">
              <div>
                <strong>Login Alerts</strong>
                <span>Get notified when your account is accessed</span>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={settings.loginAlerts}
                  onChange={(event) =>
                    updateSetting("loginAlerts", event.target.checked)
                  }
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>
          </section>

          <div className="settings-actions">
            <button
              type="button"
              className="settings-save-button"
              onClick={handleSaveSettings}
            >
              <Check size={18} />
              {saved ? "Changes Saved" : "Save Changes"}
            </button>
          </div>

          <div className="settings-security-notice">
            <ShieldCheck size={20} />
            <div>
              <strong>Your account is protected</strong>
              <p>
                NovaCart monitors security events and helps protect your
                account from unauthorized access.
              </p>
            </div>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <div
          className="settings-password-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePasswordModal();
            }
          }}
        >
          <div className="settings-password-modal">
            <div className="settings-password-modal-header">
              <div>
                <h2>Change Password</h2>
                <p>Update your account password</p>
              </div>
              <button
                type="button"
                className="settings-password-modal-close"
                onClick={closePasswordModal}
                disabled={passwordSaving}
                aria-label="Close password dialog"
              >
                <X size={19} />
              </button>
            </div>

            {([
              ["currentPassword", "Current Password", showCurrentPassword, setShowCurrentPassword, "Enter current password"],
              ["newPassword", "New Password", showNewPassword, setShowNewPassword, "Enter new password"],
              ["confirmPassword", "Confirm New Password", showConfirmPassword, setShowConfirmPassword, "Confirm new password"],
            ] as const).map(([key, label, visible, setVisible, placeholder]) => (
              <div className="settings-modal-password-field" key={key}>
                <label htmlFor={`password-${key}`}>{label}</label>
                <div className="settings-modal-password-input">
                  <input
                    id={`password-${key}`}
                    type={visible ? "text" : "password"}
                    value={passwordForm[key]}
                    onChange={(event) =>
                      setPasswordForm((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                    placeholder={placeholder}
                    disabled={passwordSaving}
                    autoComplete={
                      key === "currentPassword"
                        ? "current-password"
                        : "new-password"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    disabled={passwordSaving}
                    aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                  >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {key === "newPassword" && <small>Minimum 8 characters</small>}
              </div>
            ))}

            {passwordError && (
              <div className="settings-password-message error" role="alert">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="settings-password-message success" role="status">
                {passwordSuccess}
              </div>
            )}

            <div className="settings-password-modal-actions">
              <button
                type="button"
                className="settings-cancel-button"
                onClick={closePasswordModal}
                disabled={passwordSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="settings-save-button"
                onClick={handleChangePassword}
                disabled={passwordSaving}
              >
                {passwordSaving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
