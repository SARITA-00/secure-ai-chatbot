import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";
import { startSession, toUiRole } from "../utils/session";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] =
    useState<"customer" | "admin">("customer");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setIsLoading(true);

    try {
      const { access_token } = await api.login(
        email.trim(),
        password
      );

      const user = await api.me(access_token);
      const actualRole = toUiRole(user.role);

      // The "Login as" toggle must match the account's real role.
      if (actualRole !== role) {
        setError(
          actualRole === "admin"
            ? "This is an admin account. Choose “Admin” to sign in."
            : "This is a customer account. Choose “Customer” to sign in."
        );
        return;
      }

      startSession(access_token, user);
      navigate(actualRole === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <section className="login-brand-panel">

        <div className="login-brand-content">

          <div className="login-brand-logo">
            <ShieldCheck size={30} />
          </div>

          <div className="login-brand-name">
            <h1>NovaCart</h1>
            <span>AI Support</span>
          </div>

          <div className="login-brand-text">

            <h2>
              Secure support,
              <br />
              smarter conversations.
            </h2>

            <p>
              Your intelligent AI customer support
              assistant, designed with security at
              its core.
            </p>

          </div>

          <div className="login-features">

            <div className="login-feature">

              <div className="feature-icon">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>Secure conversations</strong>
                <span>
                  Your conversations stay protected.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>AI-powered support</strong>
                <span>
                  Get fast and intelligent assistance.
                </span>
              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <strong>Account protection</strong>
                <span>
                  Security is built into every interaction.
                </span>
              </div>

            </div>

          </div>

        </div>

        <div className="login-brand-footer">
          <ShieldCheck size={15} />
          <span>Protected by NovaCart Security</span>
        </div>

      </section>


      {/* =====================================================
          RIGHT LOGIN PANEL
          ===================================================== */}

      <section className="login-form-panel">

        <div className="login-form-container">

          {/* Mobile brand */}

          <div className="mobile-login-brand">

            <div className="mobile-brand-icon">
              <ShieldCheck size={24} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>

          </div>


          {/* Heading */}

          <div className="login-heading">

            <h2>Welcome back</h2>

            <p>
              Sign in to continue to your account
            </p>

          </div>


          <form onSubmit={handleLogin}>

            {/* Role */}

            <div className="role-section">

              <label>Login as</label>

              <div className="role-options">

                <button
                  type="button"
                  className={`role-option ${
                    role === "customer"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setRole("customer");
                    setError("");
                  }}
                >
                  Customer
                </button>

                <button
                  type="button"
                  className={`role-option ${
                    role === "admin"
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setRole("admin");
                    setError("");
                  }}
                >
                  Admin
                </button>

              </div>

            </div>


            {/* Email */}

            <div className="form-group">

              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
              />

            </div>


            {/* Password */}

            <div className="form-group">

              <div className="password-label">

                <label htmlFor="password">
                  Password
                </label>

                <Link to="/forgot-password">
                  Forgot password?
                </Link>

              </div>

              <div className="password-input">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* Error */}

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}


            {/* Sign In */}

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>


          {/* Signup */}

          <p className="signup-text">

            Don't have an account?{" "}

            <Link to="/signup">
              Create an account
            </Link>

          </p>


          {/* Security */}

          <div className="login-security">

            <ShieldCheck size={17} />

            <div>
              <strong>
                Secure login
              </strong>

              <span>
                Your account information is protected.
              </span>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;