import { useState } from "react";
import { Link } from "react-router-dom";

import {
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

import LoginEcosystem from "../components/LoginEcosystem";

import "./Login.css";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value
    }));

    setMessage("");
  };

  const handleSignup = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    // Connect to FastAPI authentication API later.
    setMessage("Signup API is not connected yet.");
  };

  return (
    <div className="estrade-login">

      {/* LEFT PANEL */}

      <div className="login-brand-panel">

        <Link to="/" className="login-brand-logo">
          estrade<span>.</span>
        </Link>

        <div className="login-showcase-content">

          <div className="login-showcase-label">
            THE INTELLIGENT EVENT PLATFORM
          </div>

          <h1>
            One platform.
            <br />
            <em>Every campus event.</em>
          </h1>

          <p className="login-showcase-description">
            Plan smarter. Coordinate better.
            <br />
            Make every event extraordinary.
          </p>

          <LoginEcosystem />

        </div>

        <div className="login-brand-footer">
          © 2026 Estrade
        </div>

      </div>

      {/* RIGHT PANEL */}

      <div className="login-form-panel">

        <div className="login-form-wrapper">

          <Link to="/" className="login-back-link">
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="login-heading">

            <span className="login-small-label">
              JOIN ESTRADE
            </span>

            <h2>
              Begin your
              <br />
              <em>journey.</em>
            </h2>

            <p>
              Create your account and become part of a
              smarter campus event experience.
            </p>

          </div>

          <form className="login-form" onSubmit={handleSignup}>

            {/* FULL NAME */}

            <div className="login-field">

              <label htmlFor="signup-name">
                Full Name
              </label>

              <div className="login-input-wrapper">

                <UserRound size={19} />

                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="login-field">

              <label htmlFor="signup-email">
                Email Address
              </label>

              <div className="login-input-wrapper">

                <Mail size={19} />

                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <label htmlFor="signup-password">
                Password
              </label>

              <div className="login-input-wrapper">

                <LockKeyhole size={19} />

                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  className="login-eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="login-field">

              <label htmlFor="signup-confirm">
                Confirm Password
              </label>

              <div className="login-input-wrapper">

                <LockKeyhole size={19} />

                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="login-eye-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* CREATE ACCOUNT */}

            <button type="submit" className="login-submit">
              Create Account
              <ArrowRight size={19} />
            </button>

            {message && (
              <p className="login-message" role="status">
                {message}
              </p>
            )}

          </form>

          {/* LOGIN LINK */}

          <div className="login-signup">
            <p>
              Already have an account?{" "}
              <Link to="/login">
                Sign In
              </Link>
            </p>
          </div>

        </div>

        <div className="login-form-footer">
          Behind every great event.
        </div>

      </div>

    </div>
  );
}

export default Signup;