import { Link } from "react-router-dom";
import { getSession } from "../utils/session";

function NotFound() {
  const session = getSession();
  const home = session?.role === "admin" ? "/admin" : session ? "/dashboard" : "/login";

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        background: "var(--bg-main)",
        color: "var(--text-primary)",
      }}
    >
      <div>
        <p style={{ margin: 0, color: "var(--primary)", fontWeight: 700, fontSize: 14 }}>404</p>
        <h1 style={{ margin: "8px 0", fontSize: 28 }}>Page not found</h1>
        <p style={{ margin: "0 0 20px", color: "var(--text-secondary)" }}>
          The page you're looking for doesn't exist or has moved.
        </p>
        <Link
          to={home}
          style={{
            display: "inline-block",
            padding: "11px 20px",
            borderRadius: 10,
            background: "var(--primary)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}

export default NotFound;
