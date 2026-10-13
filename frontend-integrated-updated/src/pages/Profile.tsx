import { useEffect, useState } from "react";
import { Mail, Menu, Pencil, ShieldCheck, User, X } from "lucide-react";
import CustomerSidebar from "../components/CustomerSidebar";
import { api } from "../services/api";
import type { ApiUser } from "../types/api";
import { getInitials, getUser, updateStoredUser } from "../utils/session";
import "./Profile.css";

function Profile() {
  const [profile, setProfile] = useState<ApiUser | null>(getUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then((fresh) => {
        if (cancelled) return;

        updateStoredUser(fresh);
        setProfile(fresh);
      })
      .catch(() => {
        /* keep showing stored copy */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const openEditProfile = () => {
    setEditName(profile?.name ?? "");
    setEditEmail(profile?.email ?? "");
    setMessage("");
    setError("");
    setEditOpen(true);
  };

  const closeEditProfile = () => {
    if (saving) return;

    setEditOpen(false);
    setMessage("");
    setError("");
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = editName.trim();
    const email = editEmail.trim();

    if (!name) {
      setError("Full name is required.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await api.updateProfile({
        name,
        email,
      });

      updateStoredUser(updatedUser);
      setProfile(updatedUser);

      setMessage("Profile updated successfully.");

      setTimeout(() => {
        setEditOpen(false);
        setMessage("");
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.name ?? "";
  const email = profile?.email ?? "";

  const roleLabel =
    profile?.role === "ADMIN"
      ? "Administrator"
      : profile?.role === "AGENT"
        ? "Support Agent"
        : "Customer";

  return (
    <div className="profile-page">
      {/* MOBILE TOP BAR */}

      <header className="profile-mobile-topbar">
        <div className="profile-mobile-brand">
          <div className="profile-mobile-logo">
            <ShieldCheck size={20} />
          </div>

          <div>
            <strong>NovaCart</strong>
            <span>AI Support</span>
          </div>
        </div>

        <button
          type="button"
          className="profile-mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {mobileMenuOpen && (
        <button
          type="button"
          className="profile-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Close navigation menu"
        />
      )}

      <CustomerSidebar
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
      />

      <main className="profile-main">
        <header className="profile-page-header">
          <div>
            <h1>My Profile</h1>
            <p>Your account information</p>
          </div>
        </header>

        <section className="profile-content">
          {/* OVERVIEW */}

          <div className="profile-overview-card">
            <div className="profile-avatar">
              {getInitials(name)}
            </div>

            <div className="profile-overview-info">
              <h2>{name}</h2>
              <p>{email}</p>

              <span className="profile-member-badge">
                {roleLabel} Account
              </span>
            </div>

            <button
              type="button"
              className="profile-edit-button"
              onClick={() => {
                alert("EDIT PROFILE BUTTON WORKS");
                openEditProfile();
              }}
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          </div>

          {/* PERSONAL INFORMATION */}

          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Personal Information</h2>
                <p>Details stored on your account</p>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <User size={17} />
                </div>

                <div>
                  <span className="profile-info-label">
                    Full Name
                  </span>

                  <strong>{name}</strong>
                </div>
              </div>

              <div className="profile-info-item">
                <div className="profile-info-icon">
                  <Mail size={17} />
                </div>

                <div>
                  <span className="profile-info-label">
                    Email Address
                  </span>

                  <strong>{email}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* ACCOUNT SECURITY */}

          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Account Security</h2>
                <p>Manage your password and account security</p>
              </div>
            </div>

            <div className="profile-security-list">
              <div className="profile-security-item">
                <div className="profile-security-icon">
                  <ShieldCheck size={19} />
                </div>

                <div className="profile-security-info">
                  <strong>Password</strong>
                  <span>
                    Manage your password from account security settings.
                  </span>
                </div>

                <button
                  type="button"
                  className="profile-outline-button"
                  onClick={() => {
                    window.location.href = "/settings";
                  }}
                >
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* ACCOUNT STATUS */}

          <section className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>Account Status</h2>
                <p>Current state of your account</p>
              </div>
            </div>

            <div className="profile-login-grid">
              <div className="profile-login-item">
                <span className="profile-info-label">
                  Account Status
                </span>

                <div className="profile-status-row">
                  <span className="profile-status-dot" />

                  <strong>
                    {profile?.is_active ? "Active" : "Inactive"}
                  </strong>
                </div>
              </div>

              <div className="profile-login-item">
                <span className="profile-info-label">
                  Account Type
                </span>

                <strong>{roleLabel}</strong>
              </div>
            </div>
          </section>
        </section>
      </main>

      {/* EDIT PROFILE MODAL */}

      {editOpen && (
        <div
          className="profile-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditProfile();
            }
          }}
        >
          <div className="profile-modal">
            <div className="profile-modal-header">
              <div>
                <h2>Edit Profile</h2>
                <p>Update your account information</p>
              </div>

              <button
                type="button"
                className="profile-modal-close"
                onClick={closeEditProfile}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveProfile}>
              <div className="profile-form-field">
                <label htmlFor="profile-name">
                  Full Name
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(event) =>
                    setEditName(event.target.value)
                  }
                  disabled={saving}
                  autoFocus
                />
              </div>

              <div className="profile-form-field">
                <label htmlFor="profile-email">
                  Email Address
                </label>

                <input
                  id="profile-email"
                  type="email"
                  value={editEmail}
                  onChange={(event) =>
                    setEditEmail(event.target.value)
                  }
                  disabled={saving}
                />
              </div>

              {error && (
                <div className="profile-form-error">
                  {error}
                </div>
              )}

              {message && (
                <div className="profile-form-success">
                  {message}
                </div>
              )}

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-modal-cancel"
                  onClick={closeEditProfile}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="profile-modal-save"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
