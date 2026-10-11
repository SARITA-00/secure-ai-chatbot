import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession, type Role } from "../utils/session";

type ProtectedRouteProps = {
  role: Role;
  children: ReactNode;
};

/**
 * Front-end route guard. This only keeps the UI tidy – real authorisation
 * must still be enforced by the backend API.
 */
function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const session = getSession();

  if (!session) return <Navigate to="/login" replace />;

  if (session.role !== role) {
    return (
      <Navigate to={session.role === "admin" ? "/admin" : "/dashboard"} replace />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
