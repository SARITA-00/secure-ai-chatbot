import { useEffect, useState } from "react";
import { Bell, Check, Eye, EyeOff, Lock, Menu, MessageSquare, ShieldCheck, User, X } from "lucide-react";
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

const applyTheme = (theme: string) => {
  const root = document.documentElement;

  if (theme === "Dark") {
    root.setAttribute("data-theme", "dark");
    root.style.colorScheme = "dark";
    return;
  }

  if (theme === "System Default") {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
    root.style.colorScheme = prefersDark ? "dark" : "light";
    return;
  }

  root.setAttribute("data-theme", "light");
  root.style.colorScheme = "light";
};

function Settings() {
  const [settings, setSettings] =
    useState<SettingsData>(defaultSettings);

  const [saved, setSaved] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ================= PASSWORD STATE ================= */

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  /* ================= LOAD SETTINGS ================= */

  useEffect(() => {
    const storedSettings =
      localStorage.getItem("novacart-settings");

    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);

        const nextSettings = {
          ...defaultSettings,
          ...parsedSettings,
        };

        setSettings(nextSettings);
        applyTheme(nextSettings.theme);
      } catch {
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
      }
    } else {
      applyTheme(defaultSettings.theme);
    }
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  /* ================= UPDATE SETTING ================= */

  const updateSetting = <K extends keyof SettingsData>(
    key: K,
    value: SettingsData[K]
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
  };

  /* ================= SAVE SETTINGS ================= */

  const handleSaveSettings = () => {
    localStorage.setItem(
      "novacart-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  /* ================= PASSWORD ================= */

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
      setPasswordError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (
      passwordForm.currentPassword ===
      passwordForm.newPassword
    ) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      await api.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordSuccess(
        "Your password has been changed successfully."
      );

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to change your password."
      );
    }
  };

  /* ================= TWO FACTOR ================= */

  const handleTwoFactorToggle = () => {
    const newValue = !settings.twoFactorEnabled;

    updateSetting("twoFactorEnabled", newValue);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="settings-page">

      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}

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

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="settings-mobile-overlay"
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

      <main className="settings-main">

        {/* HEADER */}

        <header className="settings-page-header">

          <div>
            <h1>Settings</h1>

            <p>
              Manage your account and preferences
            </p>
          </div>

          <Link
            to="/profile"
            className="settings-user-profile"
          >
            <div className="settings-avatar">
              {getInitials(getUser()?.name)}
            </div>

            <div className="settings-user-info">
              <strong>{getUser()?.name}</strong>
              <span>Customer</span>
            </div>
          </Link>

        </header>

        {/* SETTINGS CONTENT */}

        <div className="settings-content">

          {/* =================================================
              ACCOUNT PREFERENCES
          ================================================= */}

          <section className="settings-card">

            <div className="settings-card-header">

              <div className="settings-card-icon">
                <User size={21} />
              </div>

              <div>
                <h2>Account Preferences</h2>

                <p>
                  Manage your basic account preferences
                </p>
              </div>

            </div>

            {/* LANGUAGE */}

            <div className="settings-row">

              <div>
                <strong>Language</strong>

                <span>
                  Select your preferred language
                </span>
              </div>

              <select
                className="settings-select"
                value={settings.language}
                onChange={(event) =>
                  updateSetting(
                    "language",
                    event.target.value
                  )
                }
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Kannada</option>
              </select>

            </div>

            {/* THEME */}

            <div className="settings-row">

              <div>
                <strong>Theme</strong>

                <span>
                  Choose how NovaCart looks
                </span>
              </div>

              <select
                className="settings-select"
                value={settings.theme}
                onChange={(event) => {
                  const theme = event.target.value;

                  updateSetting("theme", theme);

                  const currentSettings = {
                    ...settings,
                    theme,
                  };

                  localStorage.setItem(
                    "novacart-settings",
                    JSON.stringify(currentSettings)
                  );

                  applyTheme(theme);
                }}
              >
                <option>Light</option>
                <option>Dark</option>
                <option>System Default</option>
              </select>

            </div>

          </section>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <section className="settings-card">

            <div className="settings-card-header">

              <div className="settings-card-icon">
                <Bell size={21} />
              </div>

              <div>
                <h2>
                  Notification Preferences
                </h2>

                <p>
                  Control how you receive notifications
                </p>
              </div>

            </div>

            {/* EMAIL */}

            <div className="settings-row">

              <div>
                <strong>
                  Email Notifications
                </strong>

                <span>
                  Receive important account updates by email
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.emailNotifications
                  }
                  onChange={(event) =>
                    updateSetting(
                      "emailNotifications",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

            {/* SECURITY */}

            <div className="settings-row">

              <div>
                <strong>
                  Security Alerts
                </strong>

                <span>
                  Receive alerts about suspicious activity
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.securityAlerts
                  }
                  onChange={(event) =>
                    updateSetting(
                      "securityAlerts",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

            {/* CHAT */}

            <div className="settings-row">

              <div>
                <strong>
                  Chat Notifications
                </strong>

                <span>
                  Get notifications about your conversations
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.chatNotifications
                  }
                  onChange={(event) =>
                    updateSetting(
                      "chatNotifications",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

          </section>

          {/* =================================================
              CHAT PREFERENCES
          ================================================= */}

          <section className="settings-card">

            <div className="settings-card-header">

              <div className="settings-card-icon">
                <MessageSquare size={21} />
              </div>

              <div>
                <h2>Chat Preferences</h2>

                <p>
                  Customize your AI support experience
                </p>
              </div>

            </div>

            {/* SUGGESTED QUESTIONS */}

            <div className="settings-row">

              <div>
                <strong>
                  Suggested Questions
                </strong>

                <span>
                  Show suggested questions in new conversations
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.suggestedQuestions
                  }
                  onChange={(event) =>
                    updateSetting(
                      "suggestedQuestions",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

            {/* CHAT HISTORY */}

            <div className="settings-row">

              <div>
                <strong>
                  Chat History
                </strong>

                <span>
                  Save conversations to your history
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.chatHistory
                  }
                  onChange={(event) =>
                    updateSetting(
                      "chatHistory",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

          </section>

          {/* =================================================
              SECURITY
          ================================================= */}

          <section className="settings-card">

            <div className="settings-card-header">

              <div className="settings-card-icon">
                <Lock size={21} />
              </div>

              <div>
                <h2>Security</h2>

                <p>
                  Manage your account security
                </p>
              </div>

            </div>

            {/* PASSWORD */}

            <div className="settings-security-row">

              <div>
                <strong>Password</strong>

                <span>
                  Last changed 7 days ago
                </span>
              </div>

              <button
                type="button"
                className="settings-secondary-button"
                onClick={openPasswordModal}
              >
                Change Password
              </button>

            </div>

            {/* TWO FACTOR */}

            <div className="settings-security-row">

              <div>
                <strong>
                  Two-Factor Authentication
                </strong>

                <span>
                  Add an extra layer of protection to your account
                </span>
              </div>

              <button
                type="button"
                className="settings-secondary-button"
                onClick={handleTwoFactorToggle}
              >
                {settings.twoFactorEnabled
                  ? "Disable"
                  : "Enable"}
              </button>

            </div>

            {/* LOGIN ALERTS */}

            <div className="settings-security-row">

              <div>
                <strong>
                  Login Alerts
                </strong>

                <span>
                  Get notified when your account is accessed
                </span>
              </div>

              <label className="settings-toggle">

                <input
                  type="checkbox"
                  checked={
                    settings.loginAlerts
                  }
                  onChange={(event) =>
                    updateSetting(
                      "loginAlerts",
                      event.target.checked
                    )
                  }
                />

                <span className="settings-toggle-slider" />

              </label>

            </div>

          </section>

          {/* =================================================
              SAVE
          ================================================= */}

          <div className="settings-actions">

            <button
              type="button"
              className="settings-save-button"
              onClick={handleSaveSettings}
            >
              <Check size={18} />

              {saved
                ? "Changes Saved"
                : "Save Changes"}
            </button>

          </div>

          {/* =================================================
              SECURITY NOTICE
          ================================================= */}

          <div className="settings-security-notice">

            <ShieldCheck size={20} />

            <div>

              <strong>
                Your account is protected
              </strong>

              <p>
                NovaCart monitors security events and helps
                protect your account from unauthorized access.
              </p>

            </div>

          </div>

        </div>
      </main>

      {/* =====================================================
          PASSWORD MODAL
      ===================================================== */}

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

                <p>
                  Update your account password
                </p>
              </div>

              <button
                type="button"
                className="settings-password-modal-close"
                onClick={closePasswordModal}
                aria-label="Close password dialog"
              >
                <X size={19} />
              </button>

            </div>

            {/* CURRENT PASSWORD */}

            <div className="settings-modal-password-field">

              <label>
                Current Password
              </label>

              <div className="settings-modal-password-input">

                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.currentPassword
                  }
                  onChange={(event) =>
                    setPasswordForm({
                      ...passwordForm,
                      currentPassword:
                        event.target.value,
                    })
                  }
                  placeholder="Enter current password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      !showCurrentPassword
                    )
                  }
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* NEW PASSWORD */}

            <div className="settings-modal-password-field">

              <label>
                New Password
              </label>

              <div className="settings-modal-password-input">

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.newPassword
                  }
                  onChange={(event) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword:
                        event.target.value,
                    })
                  }
                  placeholder="Enter new password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                  aria-label={
                    showNewPassword
                      ? "Hide new password"
                      : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

              <small>
                Minimum 8 characters
              </small>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="settings-modal-password-field">

              <label>
                Confirm New Password
              </label>

              <div className="settings-modal-password-input">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    passwordForm.confirmPassword
                  }
                  onChange={(event) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword:
                        event.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>

            {/* ERROR */}

            {passwordError && (

              <div className="settings-password-message error">
                {passwordError}
              </div>

            )}

            {/* SUCCESS */}

            {passwordSuccess && (

              <div className="settings-password-message success">
                {passwordSuccess}
              </div>

            )}

            {/* ACTIONS */}

            <div className="settings-password-modal-actions">

              <button
                type="button"
                className="settings-cancel-button"
                onClick={closePasswordModal}
              >
                Cancel
              </button>

              <button
                type="button"
                className="settings-save-button"
                onClick={handleChangePassword}
              >
                Change Password
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Settings;
