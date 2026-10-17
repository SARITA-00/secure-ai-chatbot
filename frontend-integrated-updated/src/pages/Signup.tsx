
import { useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agreeTerms, setAgreeTerms] =
    useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const hasMinLength =
    password.length >= 8;

  const hasUppercase =
    /[A-Z]/.test(password);

  const hasNumber =
    /[0-9]/.test(password);


  const handleSignup = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Please enter a valid full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError("Please enter a valid email address.");
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
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError(
        "Please agree to the Terms of Service and Privacy Policy."
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.register(
        name.trim(),
        email.trim(),
        password
      );

      navigate("/login");
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
    <div className="signup-page">

      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <section className="signup-brand-panel">

        <div className="signup-brand-content">

          <div className="signup-brand-logo">
            <ShieldCheck size={28} />
          </div>

          <div className="signup-brand-name">
            <h1>NovaCart</h1>
            <span>AI Support</span>
          </div>

          <div className="signup-brand-text">

            <h2>
              Create your
              <br />
              secure account.
            </h2>

            <p>
              Join NovaCart and get intelligent,
              secure customer support whenever you
              need it.
            </p>

          </div>

          <div className="signup-features">

            <div className="signup-feature">

              <div className="signup-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Secure account</strong>
                <span>
                  Your account information stays protected.
                </span>
              </div>

            </div>


            <div className="signup-feature">

              <div className="signup-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>AI-powered assistance</strong>
                <span>
                  Get fast support from NovaCart AI.
                </span>
              </div>

            </div>


            <div className="signup-feature">

              <div className="signup-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Privacy focused</strong>
                <span>
                  Your conversations are protected.
                </span>
              </div>

            </div>

          </div>

        </div>


        <div className="signup-brand-footer">

          <ShieldCheck size={14} />

          <span>
            Protected by NovaCart Security
          </span>

        </div>

      </section>


      {/* =====================================================
          RIGHT SIGNUP PANEL
          ===================================================== */}

      <section className="signup-form-panel">

        <div className="signup-form-container">

          {/* Mobile brand */}

          <div className="mobile-signup-brand">

            <div className="mobile-signup-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>

          </div>


          {/* Heading */}

          <div className="signup-heading">

            <h2>Create account</h2>

            <p>
              Join NovaCart customer support
            </p>

          </div>


          <form onSubmit={handleSignup}>

            {/* Full Name */}

            <div className="signup-form-group">

              <label htmlFor="name">
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Enter your full name"
                autoComplete="name"
              />

            </div>


            {/* Email */}

            <div className="signup-form-group">

              <label htmlFor="signup-email">
                Email address
              </label>

              <input
                id="signup-email"
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

            <div className="signup-form-group">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="signup-password-input">

                <input
                  id="signup-password"
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
                  placeholder="Create a password"
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
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {/* Password Requirements */}

            <div className="password-requirements">

              <p>
                Password should contain:
              </p>

              <div
                className={
                  hasMinLength
                    ? "requirement valid"
                    : "requirement"
                }
              >
                <CheckCircle2 size={14} />
                <span>
                  At least 8 characters
                </span>
              </div>

              <div
                className={
                  hasUppercase
                    ? "requirement valid"
                    : "requirement"
                }
              >
                <CheckCircle2 size={14} />
                <span>
                  One uppercase letter
                </span>
              </div>

              <div
                className={
                  hasNumber
                    ? "requirement valid"
                    : "requirement"
                }
              >
                <CheckCircle2 size={14} />
                <span>
                  One number
                </span>
              </div>

            </div>


            {/* Confirm Password */}

            <div className="signup-form-group">

              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="signup-password-input">

                <input
                  id="confirm-password"
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
                  placeholder="Confirm your password"
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
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>

              </div>

            </div>


            {/* Terms */}

            <label className="signup-terms">

              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(event) => {
                  setAgreeTerms(
                    event.target.checked
                  );
                  setError("");
                }}
              />

              <span>
                I agree to the{" "}
                <strong>
                  Terms of Service
                </strong>{" "}
                and{" "}
                <strong>
                  Privacy Policy
                </strong>
                .
              </span>

            </label>


            {/* Error */}

            {error && (
              <div className="signup-error">
                {error}
              </div>
            )}


            {/* Create Account */}

            <button
              type="submit"
              className="signup-button"
              disabled={isLoading}
            >
              {isLoading
                ? "Creating account..."
                : "Create Account"}
            </button>

          </form>


          {/* Login Link */}

          <p className="signup-login-text">

            Already have an account?{" "}

            <Link to="/login">
              Sign in
            </Link>

          </p>


          {/* Security */}

          <div className="signup-security">

            <ShieldCheck size={16} />

            <div>

              <strong>
                Your account is protected
              </strong>

              <span>
                NovaCart uses security controls
                to protect your information.
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Signup;
