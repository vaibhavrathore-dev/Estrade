import { ArrowUpRight, ArrowUp } from "lucide-react";

function Footer() {
  return (
    <footer className="estrade-footer" id="footer">

      {/* FOOTER MAIN CONTENT */}

      <div className="footer-main">

        {/* LEFT SIDE — BRAND */}

        <div className="footer-brand">

          <a href="/" className="footer-logo">
            estrade<span>.</span>
          </a>

          <p>
            Behind every great event.
            <br />
            Built for campus life.
          </p>

          <span className="footer-brand-description">
            A smarter way to plan, coordinate,
            and celebrate campus events.
          </span>

        </div>

        {/* RIGHT SIDE — NAVIGATION */}

        <div className="footer-links-container">

          {/* PLATFORM LINKS */}

          <div className="footer-link-column">

            <h4>PLATFORM</h4>

            <a href="/dashboard">
              Dashboard
              <ArrowUpRight size={14} />
            </a>

            <a href="#features">
              Features
            </a>

            <a href="#journey">
              Event Journey
            </a>

          </div>

          {/* EXPLORE LINKS */}

          <div className="footer-link-column">

            <h4>EXPLORE</h4>

            <a href="#introducing">
              About Estrade
            </a>

            <a href="#ai-media">
              AI Media Manager
            </a>

            <a href="#events">
              Campus Events
            </a>

          </div>

        </div>

      </div>

      {/* FOOTER DIVIDER */}

      <div className="footer-divider"></div>

      {/* FOOTER BOTTOM */}

      <div className="footer-bottom">

        <span>
          © 2026 Estrade. All rights reserved.
        </span>

        <span>
          Designed for campus life.
        </span>

        <a href="#" className="footer-back-top">
          Back to top
          <ArrowUp size={15} />
        </a>

      </div>

      {/* DECORATIVE ESTRADE WORDMARK */}

      <div className="footer-big-wordmark" aria-hidden="true">
        ESTRADE
      </div>

    </footer>
  );
}

export default Footer;