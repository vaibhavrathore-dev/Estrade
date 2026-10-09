import { ArrowRight, ArrowDown, Sparkles } from "lucide-react";

import FeaturesSection from "../components/FeaturesSection";
import AIMediaShowcase from "../components/AIMediaShowcase";
import HowItWorks from "../components/HowItWorks";
import CampusEvents from "../components/CampusEvents";
import FinalCTA from "../components/FinalCTA";
import Footer from "../components/Footer";
import TeamSection from "../components/TeamSection";


import "./Home.css";
function Home() {
  return (
    <div className="landing-page">

      {/* =========================
          NAVIGATION BAR
      ========================= */}

      <header className="landing-navbar">

        <a href="/" className="landing-logo">
          estrade
        </a>

        <nav className="landing-nav-links">
          <a href="#home" className="active">Home</a>
          <a href="#features">Features</a>
          <a href="#journey">How It Works</a>
          <a href="#events">Events</a>
          <a href="#about">About</a>
        </nav>

        <div className="landing-nav-actions">

          <a href="/login" className="landing-login">
            Log In
          </a>

          <a href="/dashboard" className="landing-nav-cta">
            Get Started <ArrowRight size={16} />
          </a>

        </div>

      </header>

      {/* =========================
          HERO SECTION
      ========================= */}

      <section className="landing-hero" id="home">

        {/* LEFT SIDE */}

        <div className="landing-hero-content">

          <div className="landing-eyebrow">
            <span className="eyebrow-line"></span>
            FOR THE PEOPLE BEHIND CAMPUS LIFE
          </div>

          <h1>
            Behind every
            <br />
            <em>great event.</em>
          </h1>

          <p className="landing-hero-description">
            Every extraordinary campus experience begins
            with thoughtful planning.

            <br /><br />

            Meet Estrade — the intelligent workspace
            bringing people, planning, and possibilities
            together.
          </p>

          <div className="landing-hero-buttons">

            <a href="/dashboard" className="landing-primary-button">
              Get Started
              <ArrowRight size={19} />
            </a>

            <a href="#features" className="landing-secondary-button">
              Explore Estrade
              <ArrowRight size={18} />
            </a>

          </div>

          <div className="landing-hero-note">
            <Sparkles size={16} />
            One campus. One workspace. Endless possibilities.
          </div>

        </div>

        {/* RIGHT SIDE — SPOTLIGHT */}

        <div className="landing-hero-visual">

          <div className="spotlight-scene">

            {/* Light falling from above */}

            <div className="spotlight-source"></div>

            <div className="spotlight-beam"></div>

            <div className="spotlight-glow"></div>

            {/* Floating brand display */}

            <div className="spotlight-logo-container">

              <div className="spotlight-small-label">
                INTRODUCING
              </div>

              <div className="spotlight-brand">
                estrade
              </div>

              <div className="spotlight-tagline">
                Behind every great event.
              </div>

            </div>

            <div className="spotlight-floor"></div>

            <div className="spotlight-caption">
              A NEW STAGE FOR CAMPUS LIFE
            </div>

          </div>

        </div>

        {/* SCROLL INDICATOR */}

        <a href="#challenge" className="landing-scroll-indicator">

          <span>SCROLL TO DISCOVER</span>

          <ArrowDown size={17} />

        </a>

      </section>

      {/* =========================
          THE CHALLENGE — PREVIEW
      ========================= */}

      <section className="landing-challenge" id="challenge">

        <div className="landing-section-label">
          01 / THE CHALLENGE
        </div>

        <div className="landing-challenge-content">

          <h2>
            Great events deserve
            <br />
            <em>better coordination.</em>
          </h2>

          <p>
            Behind every unforgettable college event is
            a team managing countless responsibilities.

            Estrade makes bringing it all together simpler.
          </p>

        </div>

      </section>
      {/* =========================
    INTRODUCING ESTRADE
========================= */}

<section className="introducing-section" id="introducing">

  <div className="introducing-header">

    <span className="introducing-label">
      02 / INTRODUCING ESTRADE
    </span>

    <h2>
      One platform.
      <br />
      <em>Every possibility.</em>
    </h2>

    <p>
      From planning to execution, Estrade brings
      every part of campus event management into
      one intelligent workspace.
    </p>

  </div>

  {/* DASHBOARD SHOWCASE */}

  <div className="introducing-showcase">

    <div className="dashboard-image-frame">

      <img
        src="/images/dashboard.png"
        alt="Estrade Faculty Dashboard"
        className="landing-dashboard-image"
      />

    </div>

  </div>

  {/* DASHBOARD BUTTON */}

  <div className="introducing-footer">

    <span>
      Designed for the people who make events happen.
    </span>

    <a href="/dashboard" className="introducing-button">
      Explore Dashboard
      <ArrowRight size={18} />
    </a>

  </div>

</section>
{/* =========================
    PREMIUM FEATURES SECTION
========================= */}

<FeaturesSection />
{/* AI MEDIA MANAGER SHOWCASE */}

<AIMediaShowcase />
{/* =====================================
    HOW ESTRADE WORKS
===================================== */}

<HowItWorks />
{/* UPCOMING CAMPUS EVENTS */}

<CampusEvents />
{/* CINEMATIC FINAL CTA */}

<FinalCTA />
{/* PROFESSIONAL ESTRADE FOOTER */}

{/* ABOUT US — MEET THE DEVELOPERS */}
<TeamSection />

<Footer />

    </div>
    
  );
}

export default Home;