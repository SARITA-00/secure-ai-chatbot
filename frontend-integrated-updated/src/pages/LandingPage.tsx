import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <div className="landing-card">
        <div className="landing-content">
          <div className="landing-badge">CUSTOMER SERVICE AI</div>

          <h1>Secure AI Chatbot</h1>
          <h2>for Customer Service</h2>

          <p className="landing-description">
            An intelligent and secure AI-powered chatbot designed to provide
            reliable customer support while protecting user data.
          </p>

          <div className="landing-details">
            <div className="details-section">
              <h3>Team Members</h3>

              <div className="member-row">
                <span>Deepti Komar</span>
                <span>241IT022</span>
              </div>

              <div className="member-row">
                <span>Devikashree</span>
                <span>241IT025</span>
              </div>

              <div className="member-row">
                <span>Sarita</span>
                <span>241IT071</span>
              </div>
            </div>

            <div className="details-section instructor-section">
              <h3>Course Instructor</h3>

              <p className="instructor-name">Jaidhar C.D</p>
            </div>
          </div>

          <button
            className="landing-button"
            onClick={() => navigate("/login")}
          >
            Get Started
            <span>→</span>
          </button>
        </div>

        <div className="landing-footer">
          © {new Date().getFullYear()} Secure AI Chatbot for Customer Service
        </div>
      </div>
    </div>
  );
}