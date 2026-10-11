import {
  Bell,
  Brain,
  Database,
  Lock,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import AdminLayout from "../layouts/AdminLayout";
import "./AdminSettings.css";

type SettingsState = {
  systemName: string;
  environment: string;
  language: string;
  aiModel: string;
  temperature: string;
  maxLength: string;
  aiEnabled: boolean;
  promptProtection: boolean;
  auditLogging: boolean;
  requireTwoFactor: boolean;
  loginProtection: boolean;
  securityAlerts: boolean;
  systemNotifications: boolean;
  dailySummary: boolean;
  conversationRetention: string;
  logRetention: string;
  maintenanceMode: boolean;
};

const DEFAULTS: SettingsState = {
  systemName: "NovaCart Chatbot",
  environment: "Development",
  language: "English",
  aiModel: "Gemini",
  temperature: "0.3",
  maxLength: "1000",
  aiEnabled: true,
  promptProtection: true,
  auditLogging: true,
  requireTwoFactor: false,
  loginProtection: true,
  securityAlerts: true,
  systemNotifications: true,
  dailySummary: false,
  conversationRetention: "90 days",
  logRetention: "1 year",
  maintenanceMode: false,
};

const STORAGE_KEY = "novacart-admin-settings";

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SettingsState>) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

type ToggleKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];

function validate(settings: SettingsState) {
  const errors: Partial<Record<"systemName" | "temperature" | "maxLength", string>> = {};
  if (!settings.systemName.trim()) errors.systemName = "System name is required.";

  const temperature = Number(settings.temperature);
  if (settings.temperature.trim() === "" || Number.isNaN(temperature) || temperature < 0 || temperature > 1) {
    errors.temperature = "Enter a value between 0 and 1.";
  }

  const maxLength = Number(settings.maxLength);
  if (!Number.isInteger(maxLength) || maxLength < 100 || maxLength > 4000) {
    errors.maxLength = "Enter a whole number between 100 and 4000.";
  }
  return errors;
}

type DangerAction = "signout" | "maintenance" | "reset" | null;

function AdminSettings() {
  const { notify } = useToast();
  const [saved, setSaved] = useState<SettingsState>(loadSettings);
  const [draft, setDraft] = useState<SettingsState>(saved);
  const [danger, setDanger] = useState<DangerAction>(null);

  const errors = useMemo(() => validate(draft), [draft]);
  const hasErrors = Object.keys(errors).length > 0;
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  // Warn before leaving the page with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const set = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const persist = (next: SettingsState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable – keep the in-memory copy */
    }
    setSaved(next);
    setDraft(next);
  };

  const save = () => {
    if (hasErrors || !dirty) return;
    persist({
      ...draft,
      systemName: draft.systemName.trim(),
      temperature: String(Number(draft.temperature)),
      maxLength: String(Number(draft.maxLength)),
    });
    notify("Settings saved.");
  };

  const discard = () => {
    setDraft(saved);
    notify("Unsaved changes discarded.", "info");
  };

  const confirmDanger = () => {
    if (danger === "signout") {
      notify("All other admin sessions will be signed out once the backend is connected.", "info");
    } else if (danger === "maintenance") {
      // Maintenance mode applies immediately and must not save other pending edits.
      const next = { ...saved, maintenanceMode: !saved.maintenanceMode };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable – keep the in-memory copy */
      }
      setSaved(next);
      setDraft((current) => ({ ...current, maintenanceMode: next.maintenanceMode }));
      notify(next.maintenanceMode ? "Maintenance mode enabled." : "Maintenance mode disabled.");
    } else if (danger === "reset") {
      persist(DEFAULTS);
      notify("Settings restored to their defaults.");
    }
    setDanger(null);
  };

  const toggle = (key: ToggleKey, label: string) => (
    <label className="admin-toggle-row">
      <input
        type="checkbox"
        role="switch"
        checked={draft[key]}
        onChange={(event) => set(key, event.target.checked)}
        aria-label={label}
      />
      <span className="admin-toggle" />
    </label>
  );

  const switchRow = (key: ToggleKey, title: string, description: string) => (
    <div className="admin-security-setting">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {toggle(key, title)}
    </div>
  );

  return (
    <AdminLayout
      title="Admin Settings"
      subtitle="Manage system, AI, security, and notification preferences."
      actions={
        <>
          {dirty && (
            <button type="button" className="al-secondary-button" onClick={discard}>
              Discard
            </button>
          )}
          <button
            type="button"
            className="admin-save-button"
            onClick={save}
            disabled={!dirty || hasErrors}
          >
            <Save size={18} />
            Save Changes
          </button>
        </>
      }
    >
      {draft.maintenanceMode && (
        <div className="admin-maintenance-banner" role="status">
          <strong>Maintenance mode is on.</strong> Customers see a maintenance message instead of the chatbot.
        </div>
      )}

      {dirty && (
        <div className="admin-unsaved-banner" role="status">
          You have unsaved changes.
        </div>
      )}

      {/* General */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <div className="admin-settings-section-icon general">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h2>General Settings</h2>
            <p>Configure basic system preferences.</p>
          </div>
        </div>

        <div className="admin-settings-grid">
          <div className="admin-setting-field">
            <label htmlFor="set-name">System Name</label>
            <input
              id="set-name"
              type="text"
              value={draft.systemName}
              onChange={(event) => set("systemName", event.target.value)}
              aria-invalid={Boolean(errors.systemName)}
            />
            {errors.systemName && <small className="admin-field-error">{errors.systemName}</small>}
          </div>

          <div className="admin-setting-field">
            <label htmlFor="set-env">Environment</label>
            <select id="set-env" value={draft.environment} onChange={(event) => set("environment", event.target.value)}>
              <option>Development</option>
              <option>Testing</option>
              <option>Production</option>
            </select>
          </div>

          <div className="admin-setting-field">
            <label htmlFor="set-lang">Default Language</label>
            <select id="set-lang" value={draft.language} onChange={(event) => set("language", event.target.value)}>
              <option>English</option>
              <option>Kannada</option>
              <option>Hindi</option>
            </select>
          </div>

          <div className="admin-setting-field">
            <span className="admin-field-label">System Status</span>
            <div className="admin-status-input">
              <span className="admin-status-dot" />
              {draft.maintenanceMode ? "Maintenance" : "Operational"}
            </div>
          </div>
        </div>
      </section>

      {/* AI */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <div className="admin-settings-section-icon ai">
            <Brain size={20} />
          </div>
          <div>
            <h2>AI Configuration</h2>
            <p>Configure the chatbot's AI behavior.</p>
          </div>
        </div>

        <div className="admin-settings-grid">
          <div className="admin-setting-field">
            <label htmlFor="set-model">AI Model</label>
            <select id="set-model" value={draft.aiModel} onChange={(event) => set("aiModel", event.target.value)}>
              <option>Gemini</option>
              <option>GPT</option>
              <option>Local LLM</option>
            </select>
          </div>

          <div className="admin-setting-field">
            <label htmlFor="set-temp">Response Temperature</label>
            <input
              id="set-temp"
              type="number"
              inputMode="decimal"
              min="0"
              max="1"
              step="0.1"
              value={draft.temperature}
              onChange={(event) => set("temperature", event.target.value)}
              aria-invalid={Boolean(errors.temperature)}
            />
            {errors.temperature ? (
              <small className="admin-field-error">{errors.temperature}</small>
            ) : (
              <small>Lower values produce more consistent responses.</small>
            )}
          </div>

          <div className="admin-setting-field">
            <label htmlFor="set-max">Maximum Response Length</label>
            <input
              id="set-max"
              type="number"
              inputMode="numeric"
              min="100"
              max="4000"
              value={draft.maxLength}
              onChange={(event) => set("maxLength", event.target.value)}
              aria-invalid={Boolean(errors.maxLength)}
            />
            {errors.maxLength && <small className="admin-field-error">{errors.maxLength}</small>}
          </div>

          <div className="admin-setting-field">
            <span className="admin-field-label">AI Status</span>
            <label className="admin-toggle-row">
              <input
                type="checkbox"
                role="switch"
                checked={draft.aiEnabled}
                onChange={(event) => set("aiEnabled", event.target.checked)}
              />
              <span className="admin-toggle" />
              <span>{draft.aiEnabled ? "AI chatbot enabled" : "AI chatbot disabled"}</span>
            </label>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <div className="admin-settings-section-icon security">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2>Security Settings</h2>
            <p>Control authentication and security protections.</p>
          </div>
        </div>

        <div className="admin-security-settings">
          {switchRow("promptProtection", "Prompt Injection Protection", "Detect and block malicious prompt-injection attempts.")}
          {switchRow("auditLogging", "Audit Logging", "Record security and administrative events.")}
          {switchRow("requireTwoFactor", "Require Two-Factor Authentication", "Require administrators to use an additional authentication factor.")}
          {switchRow("loginProtection", "Login Attempt Protection", "Temporarily block accounts after repeated failed login attempts.")}
        </div>

        <div className="admin-security-note">
          <Lock size={18} />
          <span>
            Security settings shown here are frontend controls only. They will be connected to the backend security module later.
          </span>
        </div>
      </section>

      {/* Notifications */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <div className="admin-settings-section-icon notification">
            <Bell size={20} />
          </div>
          <div>
            <h2>Notification Settings</h2>
            <p>Choose which events administrators should receive.</p>
          </div>
        </div>

        <div className="admin-security-settings">
          {switchRow("securityAlerts", "Security Alerts", "Receive alerts for critical security events.")}
          {switchRow("systemNotifications", "System Notifications", "Receive important system status notifications.")}
          {switchRow("dailySummary", "Daily Activity Summary", "Receive a summary of important daily activities.")}
        </div>
      </section>

      {/* Data */}
      <section className="admin-settings-card">
        <div className="admin-settings-card-header">
          <div className="admin-settings-section-icon data">
            <Database size={20} />
          </div>
          <div>
            <h2>Data & Retention</h2>
            <p>Control how long system data is stored.</p>
          </div>
        </div>

        <div className="admin-settings-grid">
          <div className="admin-setting-field">
            <label htmlFor="set-conv-ret">Conversation Retention</label>
            <select id="set-conv-ret" value={draft.conversationRetention} onChange={(event) => set("conversationRetention", event.target.value)}>
              <option>30 days</option>
              <option>60 days</option>
              <option>90 days</option>
              <option>1 year</option>
            </select>
          </div>

          <div className="admin-setting-field">
            <label htmlFor="set-log-ret">Activity Log Retention</label>
            <select id="set-log-ret" value={draft.logRetention} onChange={(event) => set("logRetention", event.target.value)}>
              <option>30 days</option>
              <option>90 days</option>
              <option>1 year</option>
              <option>2 years</option>
            </select>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="admin-danger-zone">
        <div>
          <h2>Danger Zone</h2>
          <p>These actions can affect the entire administration system.</p>
        </div>

        <div className="admin-danger-actions">
          <button type="button" className="admin-danger-button" onClick={() => setDanger("signout")}>
            Sign Out All Admins
          </button>
          <button type="button" className="admin-danger-button" onClick={() => setDanger("maintenance")}>
            {saved.maintenanceMode ? "Disable Maintenance Mode" : "Enable Maintenance Mode"}
          </button>
          <button type="button" className="admin-danger-button" onClick={() => setDanger("reset")}>
            <RotateCcw size={15} />
            Reset to Defaults
          </button>
        </div>
      </section>

      <div className="admin-settings-footer">
        <p>NovaCart Chatbot Admin Panel • Frontend configuration</p>
      </div>

      {danger && (
        <ConfirmDialog
          title={
            danger === "signout"
              ? "Sign out all admins?"
              : danger === "reset"
                ? "Reset all settings?"
                : saved.maintenanceMode
                  ? "Disable maintenance mode?"
                  : "Enable maintenance mode?"
          }
          message={
            danger === "signout"
              ? "Every other administrator will be signed out and will need to log in again."
              : danger === "reset"
                ? "All settings on this page will return to their default values. Your unsaved edits will be lost."
                : saved.maintenanceMode
                  ? "Customers will be able to use the chatbot again."
                  : "Customers will not be able to use the chatbot until maintenance mode is turned off."
          }
          confirmLabel={
            danger === "signout"
              ? "Sign out all"
              : danger === "reset"
                ? "Reset settings"
                : saved.maintenanceMode
                  ? "Disable"
                  : "Enable"
          }
          tone={danger === "maintenance" && saved.maintenanceMode ? "primary" : "danger"}
          onConfirm={confirmDanger}
          onCancel={() => setDanger(null)}
        />
      )}
    </AdminLayout>
  );
}

export default AdminSettings;
