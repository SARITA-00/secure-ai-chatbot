import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!password) {
      setError("Please enter your new password.");
      return;
    }

    if (!hasMinLength) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    if (!hasUppercase) {
      setError(
        "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!hasNumber) {
      setError(
        "Password must contain at least one number."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    // Frontend demo only for now.
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 700);
  };

  return (
    <div className="reset-page">
      {/* LEFT BRAND PANEL */}
      <section className="reset-brand-panel">
        <div className="reset-brand-content">
          <div className="reset-brand-logo">
            <ShieldCheck size={28} />
          </div>

          <div className="reset-brand-name">
            <h1>NovaCart</h1>
            <span>AI Support</span>
          </div>

          <div className="reset-brand-text">
            <h2>
              Create a
              <br />
              secure password.
            </h2>

            <p>
              Protect your NovaCart account with a
              strong password and keep your support
              experience secure.
            </p>
          </div>

          <div className="reset-features">
            <div className="reset-feature">
              <div className="reset-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Strong password</strong>
                <span>
                  Use a combination of letters and numbers.
                </span>
              </div>
            </div>

            <div className="reset-feature">
              <div className="reset-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Account protection</strong>
                <span>
                  Keep your NovaCart account protected.
                </span>
              </div>
            </div>

            <div className="reset-feature">
              <div className="reset-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Secure recovery</strong>
                <span>
                  Your password recovery stays protected.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="reset-brand-footer">
          <ShieldCheck size={14} />
          <span>Protected by NovaCart Security</span>
        </div>
      </section>

      {/* RIGHT FORM PANEL */}
      <section className="reset-form-panel">
        <div className="reset-form-container">

          {/* Mobile brand */}
          <div className="mobile-reset-brand">
            <div className="mobile-reset-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>
          </div>

          {!success ? (
            <>
              <div className="reset-heading">
                <h2>Reset Password</h2>

                <p>
                  Create a new password for your
                  account.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {/* NEW PASSWORD */}
                <div className="reset-form-group">
                  <label htmlFor="new-password">
                    New password
                  </label>

                  <div className="reset-password-input">
                    <input
                      id="new-password"
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
                      placeholder="Enter your new password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword(!showPassword)
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

                {/* CONFIRM PASSWORD */}
                <div className="reset-form-group">
                  <label htmlFor="reset-confirm-password">
                    Confirm new password
                  </label>

                  <div className="reset-password-input">
                    <input
                      id="reset-confirm-password"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        setError("");
                      }}
                      placeholder="Confirm your new password"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowConfirmPassword(
                          !showConfirmPassword
                        )
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* REQUIREMENTS */}
                <div className="reset-password-requirements">
                  <p>Password should contain:</p>

                  <div
                    className={
                      hasMinLength ? "valid" : ""
                    }
                  >
                    <span>
                      {hasMinLength ? "✓" : "○"}
                    </span>
                    At least 8 characters
                  </div>

                  <div
                    className={
                      hasUppercase ? "valid" : ""
                    }
                  >
                    <span>
                      {hasUppercase ? "✓" : "○"}
                    </span>
                    One uppercase letter
                  </div>

                  <div
                    className={
                      hasNumber ? "valid" : ""
                    }
                  >
                    <span>
                      {hasNumber ? "✓" : "○"}
                    </span>
                    One number
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="reset-error">
                    {error}
                  </div>
                )}

                {/* RESET BUTTON */}
                <button
                  type="submit"
                  className="reset-button"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Resetting..."
                    : "Reset Password"}
                </button>
              </form>

              <Link
                to="/login"
                className="reset-back-login"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>

              <div className="reset-security">
                <ShieldCheck size={16} />

                <div>
                  <strong>
                    Your information is protected
                  </strong>

                  <span>
                    NovaCart keeps your account
                    recovery secure and private.
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* SUCCESS STATE */
            <div className="reset-success">
              <div className="reset-success-icon">
                <CheckCircle2 size={28} />
              </div>

              <h2>Password reset successful</h2>

              <p>
                Your password has been successfully
                updated.
              </p>

              <p className="reset-success-note">
                You can now sign in using your new
                password.
              </p>

              <button
                type="button"
                className="reset-button"
                onClick={() => navigate("/login")}
              >
                Continue to Login
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ResetPassword;