import { useState } from "react";
import LoginEcosystem from "../components/LoginEcosystem";

import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  LockKeyhole,
  CalendarDays,
  UsersRound,
  ScanSearch,
  Award
} from "lucide-react";

import { Link } from "react-router-dom";

import "./Login.css";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Backend authentication will be connected later.
    setMessage("Login authentication is not connected yet.");
  };

  return (
    <div className="estrade-login">

      {/* LEFT SIDE — ESTRADE PRODUCT SHOWCASE */}

<div className="login-brand-panel">

  {/* BRAND LOGO */}

  <Link to="/" className="login-brand-logo">
    estrade<span>.</span>
  </Link>


  {/* MAIN SHOWCASE */}

  <div className="login-showcase-content">

    <div className="login-showcase-label">
      <span className="login-live-dot"></span>
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


   {/* OUR NEW ANIMATED VISUALIZATION */}

  <LoginEcosystem />




  </div>


  {/* BRAND FOOTER */}

  <div className="login-brand-footer">

    <span>© 2026 Estrade</span>

    <span>BUILT FOR CAMPUS LIFE</span>

  </div>

</div>
      {/* RIGHT SIDE — LOGIN FORM */}

      <div className="login-form-panel">

        <div className="login-form-wrapper">

          <Link to="/" className="login-back-link">
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="login-heading">

            <span className="login-small-label">
              WELCOME TO ESTRADE
            </span>

            <h2>
              Welcome
              <br />
              <em>back.</em>
            </h2>

            <p>
              Enter your credentials to access
              your workspace.
            </p>

          </div>

          <form onSubmit={handleLogin} className="login-form">

            {/* EMAIL */}

            <div className="login-field">

              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="login-input-wrapper">

                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="login-field">

              <div className="login-password-header">

                <label htmlFor="login-password">
                  Password
                </label>

                <Link to="/forgot-password">
                  Forgot Password?
                </Link>

              </div>

              <div className="login-input-wrapper">

                <LockKeyhole size={19} />

                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="login-eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

            {/* SIGN IN BUTTON */}

            <button type="submit" className="login-submit">
              Sign In
              <ArrowRight size={19} />
            </button>

            {message && (
              <p className="login-message" role="status">
                {message}
              </p>
            )}

          </form>

          {/* SIGNUP */}

          <div className="login-signup">

            <p>
              New to Estrade?{" "}
              <Link to="/signup">
                Create an Account
              </Link>
            </p>

          </div>

        </div>

        <div className="login-form-footer">
          Designed for the people who make events happen.
        </div>

      </div>

    </div>
  );
}

export default Login;