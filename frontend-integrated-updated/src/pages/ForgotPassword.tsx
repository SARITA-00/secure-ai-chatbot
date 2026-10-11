import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

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

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSent(true);
    }, 700);
  };

  return (
    <div className="forgot-page">

      {/* =====================================================
          LEFT BRAND PANEL
          ===================================================== */}

      <section className="forgot-brand-panel">

        <div className="forgot-brand-content">

          <div className="forgot-brand-logo">
            <ShieldCheck size={28} />
          </div>

          <div className="forgot-brand-name">
            <h1>NovaCart</h1>
            <span>AI Support</span>
          </div>

          <div className="forgot-brand-text">

            <h2>
              Secure account
              <br />
              recovery.
            </h2>

            <p>
              Don't worry. We'll help you securely
              regain access to your NovaCart account.
            </p>

          </div>

          <div className="forgot-features">

            <div className="forgot-feature">

              <div className="forgot-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Secure recovery</strong>
                <span>
                  Your account recovery is protected.
                </span>
              </div>

            </div>

            <div className="forgot-feature">

              <div className="forgot-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Email verification</strong>
                <span>
                  We'll send instructions to your email.
                </span>
              </div>

            </div>

            <div className="forgot-feature">

              <div className="forgot-feature-icon">
                <CheckCircle2 size={16} />
              </div>

              <div>
                <strong>Privacy focused</strong>
                <span>
                  Your account information stays protected.
                </span>
              </div>

            </div>

          </div>

        </div>

        <div className="forgot-brand-footer">
          <ShieldCheck size={14} />
          <span>Protected by NovaCart Security</span>
        </div>

      </section>


      {/* =====================================================
          RIGHT FORM PANEL
          ===================================================== */}

      <section className="forgot-form-panel">

        <div className="forgot-form-container">

          {/* Mobile brand */}

          <div className="mobile-forgot-brand">

            <div className="mobile-forgot-icon">
              <ShieldCheck size={22} />
            </div>

            <div>
              <strong>NovaCart</strong>
              <span>AI Support</span>
            </div>

          </div>


          {/* Icon */}

          <div className="forgot-icon">
            <Mail size={25} />
          </div>


          {/* Heading */}

          <div className="forgot-heading">

            <h2>Forgot password?</h2>

            <p>
              Enter the email address associated with
              your account and we'll help you reset
              your password.
            </p>

          </div>


          {!sent ? (

            <form onSubmit={handleSubmit}>

              {/* Email */}

              <div className="forgot-form-group">

                <label htmlFor="forgot-email">
                  Email address
                </label>

                <input
                  id="forgot-email"
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


              {/* Error */}

              {error && (
                <div className="forgot-error">
                  {error}
                </div>
              )}


              {/* Button */}

              <button
                type="submit"
                className="forgot-button"
                disabled={isLoading}
              >
                {isLoading
                  ? "Sending..."
                  : "Send Reset Link"}
              </button>

            </form>

          ) : (

            /* =================================================
               SUCCESS
               ================================================= */

            <div className="forgot-success">

              <div className="forgot-success-icon">
                <CheckCircle2 size={25} />
              </div>

              <h3>
                Check your email
              </h3>

              <p>
                We've sent password reset instructions
                to:
              </p>

              <strong>
                {email}
              </strong>

              <p className="forgot-success-note">
                If you don't see the email, check your
                spam or junk folder.
              </p>

              <button
                type="button"
                className="forgot-button"
                onClick={() =>
                  navigate("/reset-password")
                }
              >
                Continue to Reset Password
              </button>

            </div>

          )}


          {/* Back to Login */}

          <Link
            to="/login"
            className="forgot-back-login"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>


          {/* Security */}

          <div className="forgot-security">

            <ShieldCheck size={16} />

            <div>

              <strong>
                Your information is protected
              </strong>

              <span>
                NovaCart keeps your account recovery
                secure and private.
              </span>

            </div>

          </div>

        </div>

      </section>

    </div>
  );
}

export default ForgotPassword;