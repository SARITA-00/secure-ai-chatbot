import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import { useToast } from "../components/Toast";
import AdminLayout from "../layouts/AdminLayout";
import { api, ApiError } from "../services/api";
import type { AdminUser } from "../types/api";
import { formatDateTime } from "../utils/format";
import { getUser } from "../utils/session";
import { useLoad } from "../utils/useLoad";
import "./UserManagement.css";

type UserRole = "Customer" | "Agent" | "Admin";
type UserStatus = "Active" | "Suspended";

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joined: string;
  lastActive: string;
  conversations: number;
};

const PAGE_SIZE = 6;

const toRecord = (user: AdminUser): UserRecord => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role:
    user.role === "ADMIN" ? "Admin" : user.role === "AGENT" ? "Agent" : "Customer",
  status: user.is_active ? "Active" : "Suspended",
  joined: user.created_at ? formatDateTime(user.created_at) : "—",
  lastActive: user.last_activity_at
    ? formatDateTime(user.last_activity_at)
    : "No activity yet",
  conversations: user.conversation_count,
});

type ConfirmState = { kind: "status"; user: UserRecord } | null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** 1 … 4 5 6 … 20 style page list. */
function pageNumbers(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

function UserManagement() {
  const { notify } = useToast();

  const currentAdminId = getUser()?.id;
  const loaded = useLoad(() => api.adminUsers());
  const users = useMemo(
    () => (loaded.data ?? []).map(toRecord),
    [loaded.data],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);

  // Add-user form
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "Active").length,
      suspended: users.filter((u) => u.status === "Suspended").length,
      admins: users.filter((u) => u.role === "Admin").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText);
      const matchesStatus = statusFilter === "All" || user.status === statusFilter;
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

  const resetToFirstPage = () => setPage(1);

  const openAddUser = () => {
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormErrors({});
    setAddOpen(true);
  };

  const handleAddUser = async (event: FormEvent) => {
    event.preventDefault();
    const errors: { name?: string; email?: string; password?: string } = {};
    const name = formName.trim();
    const email = formEmail.trim().toLowerCase();

    if (name.length < 2) errors.name = "Enter the user's full name.";
    if (!EMAIL_PATTERN.test(email)) {
      errors.email = "Enter a valid email address.";
    } else if (users.some((user) => user.email.toLowerCase() === email)) {
      errors.email = "A user with this email already exists.";
    }
    if (formPassword.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    setFormErrors(errors);
    if (errors.name || errors.email || errors.password) return;

    setIsSaving(true);
    try {
      await api.register(name, email, formPassword);
      setAddOpen(false);
      setPage(1);
      loaded.reload();
      notify(`${name} was added as a customer.`);
    } catch (err) {
      setFormErrors({
        form:
          err instanceof ApiError
            ? err.message
            : "Couldn't create the user. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmAction = async () => {
    if (!confirm) return;
    const { user } = confirm;
    const activate = user.status === "Suspended";

    setIsSaving(true);
    try {
      const updated = await api.adminSetUserActive(user.id, activate);
      loaded.setData((current) =>
        current
          ? current.map((u) => (u.id === updated.id ? updated : u))
          : current,
      );
      notify(`${user.name} was ${activate ? "reactivated" : "suspended"}.`);
      setConfirm(null);
      setViewUser(null);
    } catch (err) {
      notify(
        err instanceof ApiError
          ? err.message
          : "Couldn't update this account. Please try again.",
      );
      setConfirm(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      pageClass="user-management-page"
      title="User Management"
      subtitle="View and manage NovaCart user accounts."
    >
      {/* Summary cards */}
      <section className="um-summary-grid" aria-label="User statistics">
        <div className="um-summary-card">
          <div className="um-summary-icon blue">
            <UserCheck size={21} />
          </div>
          <div className="um-summary-info">
            <span>Total Users</span>
            <strong>{stats.total.toLocaleString()}</strong>
          </div>
        </div>

        <div className="um-summary-card">
          <div className="um-summary-icon green">
            <UserCheck size={21} />
          </div>
          <div className="um-summary-info">
            <span>Active Users</span>
            <strong>{stats.active.toLocaleString()}</strong>
          </div>
        </div>

        <div className="um-summary-card">
          <div className="um-summary-icon orange">
            <UserX size={21} />
          </div>
          <div className="um-summary-info">
            <span>Suspended</span>
            <strong>{stats.suspended.toLocaleString()}</strong>
          </div>
        </div>

        <div className="um-summary-card">
          <div className="um-summary-icon purple">
            <ShieldCheck size={21} />
          </div>
          <div className="um-summary-info">
            <span>Administrators</span>
            <strong>{stats.admins.toLocaleString()}</strong>
          </div>
        </div>
      </section>

      {/* User management table */}
      <section className="um-management-card">
        <div className="um-card-header">
          <div>
            <h2>All Users</h2>
            <p>Manage customer and administrator accounts</p>
          </div>

          <button type="button" className="um-add-user-button" onClick={openAddUser}>
            + Add User
          </button>
        </div>

        {/* Search and filters */}
        <div className="um-filters">
          <label className="um-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetToFirstPage();
              }}
              aria-label="Search users by name or email"
            />
          </label>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              resetToFirstPage();
            }}
            className="um-filter-select"
            aria-label="Filter by role"
          >
            <option value="All">All Roles</option>
            <option value="Customer">Customer</option>
            <option value="Agent">Agent</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetToFirstPage();
            }}
            className="um-filter-select"
            aria-label="Filter by status"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        {/* Users table (stacks into cards on phones) */}
        <div className="um-table-wrapper">
          <table className="um-users-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Joined</th>
                <th scope="col">Last Active</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {visibleUsers.map((user) => {
                const isSelf = user.id === currentAdminId;
                const suspended = user.status === "Suspended";
                return (
                  <tr key={user.id}>
                    <td data-label="User">
                      <div className="um-table-user">
                        <div className="um-table-user-avatar">{initials(user.name)}</div>
                        <div className="um-user-details">
                          <strong>{user.name}</strong>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </td>

                    <td data-label="Role">
                      <span
                        className={`um-role-badge ${
                          user.role === "Admin" ? "admin" : "customer"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td data-label="Status">
                      <span
                        className={`um-status-badge ${
                          suspended ? "suspended" : "active"
                        }`}
                      >
                        <span className="um-status-dot" />
                        {user.status}
                      </span>
                    </td>

                    <td data-label="Joined">{user.joined}</td>
                    <td data-label="Last active">{user.lastActive}</td>

                    <td data-label="Actions">
                      <div className="um-table-actions">
                        <button
                          type="button"
                          className="um-table-action-button"
                          title="View user"
                          aria-label={`View ${user.name}`}
                          onClick={() => setViewUser(user)}
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          className="um-table-action-button"
                          title={
                            isSelf
                              ? "You can't change your own account"
                              : suspended
                                ? "Reactivate user"
                                : "Suspend user"
                          }
                          aria-label={`${suspended ? "Reactivate" : "Suspend"} ${user.name}`}
                          disabled={isSelf}
                          onClick={() => setConfirm({ kind: "status", user })}
                        >
                          {suspended ? <UserCheck size={16} /> : <UserX size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr className="um-empty-row">
                  <td colSpan={6} className="um-no-users">
                    {loaded.loading
                      ? "Loading users…"
                      : loaded.error ||
                        "No users found. Try changing your search or filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="um-pagination">
          <span>
            {filteredUsers.length === 0
              ? "Showing 0 users"
              : `Showing ${pageStart + 1}–${pageStart + visibleUsers.length} of ${filteredUsers.length} users`}
          </span>

          <div className="um-pagination-buttons">
            <button
              type="button"
              aria-label="Previous page"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers(currentPage, totalPages).map((item, index) =>
              item === "gap" ? (
                <span key={`gap-${index}`}>…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={item === currentPage ? "um-pagination-active" : ""}
                  aria-current={item === currentPage ? "page" : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              aria-label="Next page"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Add user */}
      {addOpen && (
        <Modal
          title="Add user"
          description="Create a new customer account."
          onClose={() => setAddOpen(false)}
          footer={
            <>
              <button type="button" className="modal-button" onClick={() => setAddOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                form="add-user-form"
                className="modal-button primary"
                disabled={isSaving}
              >
                {isSaving ? "Adding…" : "Add user"}
              </button>
            </>
          }
        >
          <form id="add-user-form" className="modal-form" onSubmit={handleAddUser} noValidate>
            <div className="modal-field">
              <label htmlFor="new-user-name">Full name</label>
              <input
                id="new-user-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                placeholder="Jane Smith"
                autoComplete="off"
                aria-invalid={Boolean(formErrors.name)}
              />
              {formErrors.name && <span className="field-error">{formErrors.name}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="new-user-email">Email address</label>
              <input
                id="new-user-email"
                type="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                placeholder="jane@example.com"
                autoComplete="off"
                aria-invalid={Boolean(formErrors.email)}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="modal-field">
              <label htmlFor="new-user-password">Temporary password</label>
              <input
                id="new-user-password"
                type="password"
                value={formPassword}
                onChange={(event) => setFormPassword(event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                aria-invalid={Boolean(formErrors.password)}
              />
              {formErrors.password && (
                <span className="field-error">{formErrors.password}</span>
              )}
            </div>

            {formErrors.form && (
              <span className="field-error" role="alert">
                {formErrors.form}
              </span>
            )}
          </form>
        </Modal>
      )}

      {/* View user */}
      {viewUser && (
        <Modal
          title={viewUser.name}
          description={viewUser.email}
          onClose={() => setViewUser(null)}
          footer={
            <button type="button" className="modal-button" onClick={() => setViewUser(null)}>
              Close
            </button>
          }
        >
          <dl className="modal-detail-list">
            <div>
              <dt>Role</dt>
              <dd>{viewUser.role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{viewUser.status}</dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{viewUser.joined}</dd>
            </div>
            <div>
              <dt>Last active</dt>
              <dd>{viewUser.lastActive}</dd>
            </div>
            <div>
              <dt>Conversations</dt>
              <dd>{viewUser.conversations}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>USR-{String(viewUser.id).padStart(4, "0")}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {/* Confirm suspend / reactivate */}
      {confirm && (
        <ConfirmDialog
          title={
            confirm.user.status === "Active"
              ? "Suspend this user?"
              : "Reactivate this user?"
          }
          message={
            confirm.user.status === "Active"
              ? `${confirm.user.name} won't be able to sign in until the account is reactivated.`
              : `${confirm.user.name} will be able to sign in again.`
          }
          confirmLabel={confirm.user.status === "Active" ? "Suspend" : "Reactivate"}
          tone={confirm.user.status === "Suspended" ? "primary" : "danger"}
          onConfirm={confirmAction}
          onCancel={() => setConfirm(null)}
        />
      )}
    </AdminLayout>
  );
}

export default UserManagement;
