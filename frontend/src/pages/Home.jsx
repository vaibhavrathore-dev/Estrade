import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowDown,
  ArrowUpRight,
  Menu,
  X,
  Check,
  ShieldCheck,
  QrCode,
} from "lucide-react";
import TeamSection from "../components/TeamSection";
import CurtainOpening from "../components/CurtainOpening";
import StageShowcase from "../components/StageShowcase";
import TheatreStory from "../components/TheatreStory";
const steps = [
  [
    "Discover",
    "Find your next belonging.",
    "Explore published campus events in your authenticated workspace. A new idea, a new community, a new reason to show up.",
  ],
  [
    "Register",
    "A place for every participant.",
    "Explore event details, register with event-specific fields, and receive a signed QR ticket for check-in.",
  ],
  [
    "Organize",
    "Great things take a team.",
    "Bring approved committee members together. Assign responsibilities, review withdrawals, and preserve the history behind every handover.",
  ],
  [
    "Schedule",
    "Make room for possibility.",
    "Choose an available venue and confirm the time. Conflicting confirmed bookings are rejected so your plans have a reliable foundation.",
  ],
  [
    "Execute",
    "Be present for the moment.",
    "Use signed QR tickets and organizer check-in to record attendance and prevent duplicate scans.",
  ],
  [
    "Verify",
    "Give participation its proof.",
    "After a confirmed event ends, organizers verify participation and issue unique certificates with restricted downloads and public verification.",
  ],
  [
    "Preserve",
    "Let the moment live on.",
    "Filter blurry, dark, and duplicate event photos, sanitize metadata, and preserve accepted media in organized Google Drive folders.",
  ],
];
export default function Home() {
  const [menu, setMenu] = useState(false);
  const [step, setStep] = useState(0);
  const [media, setMedia] = useState("Accepted");
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
  return (
    <div className="cinema-home">
      <CurtainOpening />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="cinema-nav">
        <Link className="wordmark" to="/">
          estrade<span>®</span>
        </Link>
        <button
          className="mobile-menu"
          aria-label={menu ? "Close navigation" : "Open navigation"}
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          id="main-nav"
          className={menu ? "is-open" : ""}
          aria-label="Main navigation"
          onKeyDown={(e) => {
            if (e.key === "Escape") setMenu(false);
          }}
        >
          {["Product", "Lifecycle", "Features", "Events"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={() => setMenu(false)}
            >
              {item}
            </a>
          ))}
          <Link to="/login">Login</Link>
          <Link className="button primary" to="/login">
            Get Started <ArrowUpRight size={17} />
          </Link>
        </nav>
      </header>
      <main id="main">
        <section className="cinema-hero" id="product">
          <div className="hero-copy">
            <span className="eyebrow">
              <i /> THE LIGHT BEHIND CAMPUS LIFE
            </span>
            <h1>
              Behind every
              <br />
              <em>great event.</em>
            </h1>
            <p>
              One intelligent platform for everything behind campus events —
              from discovery and planning to verified participation and lasting
              memories.
            </p>
            <div className="hero-actions">
              <Link className="button primary" to="/login">
                Set the stage <ArrowUpRight size={18} />
              </Link>
              <Link className="text-link" to="/dashboard-preview">
  View Dashboard <ArrowRight size={18} />
</Link>
              <a className="text-link" href="#lifecycle">
                Explore the journey <ArrowRight size={18} />
              </a>
            </div>
            <div className="hero-footnote">
              <span>FOR THE PEOPLE</span>
              <span>who make it all happen.</span>
            </div>
          </div>
          <StageShowcase />
          <div className="hero-ledger">
            <span className="ledger-label">
              A CONNECTED EXPERIENCE
              <br />
              <small>Illustrative workflow · not live data</small>
            </span>
            {[
              "Upcoming event",
              "Venue confirmed",
              "Participant checked in",
              "Certificate verified",
              "Media processed",
            ].map((text, i) => (
              <div key={text}>
                <span className="ledger-number">0{i + 1}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
          <a className="scroll-note" href="#challenge">
            THERE’S MORE BEHIND THE MOMENT <ArrowDown size={16} />
          </a>
        </section>
        <TheatreStory />
        <section
          className="editorial-section challenge"
          id="challenge"
          data-reveal
        >
          <span className="eyebrow">01 / BRING IT ALL TOGETHER</span>
          <div className="section-heading">
            <h2>
              Great events shouldn’t depend on <em>scattered tools.</em>
            </h2>
            <p>
              The event is one experience.
              <br />
              The work behind it should be, too.
            </p>
          </div>
          <div className="scattered-tools">
            {[
              "Google Forms",
              "Messaging groups",
              "Spreadsheets",
              "Manual attendance",
              "Certificate creation",
              "Scattered photos",
            ].map((text, i) => (
              <span key={text}>
                <small>0{i + 1}</small>
                {text}
              </span>
            ))}
          </div>
          <div className="unified-line">
            <span>Less chasing. More creating.</span>
            <strong>One shared stage.</strong>
            <span className="wordmark">estrade</span>
          </div>
        </section>
        <section
          className="editorial-section lifecycle"
          id="lifecycle"
          data-reveal
        >
          <span className="eyebrow">
            02 / FROM FIRST IDEA TO FINAL APPLAUSE
          </span>
          <div className="section-heading">
            <h2>
              Every step.
              <br />
              <em>One continuous story.</em>
            </h2>
            <p>
              Explore the event lifecycle.
              <br />
              Built around people, held together by purpose.
            </p>
          </div>
          <div className="lifecycle-layout">
            <div
              className="lifecycle-nav"
              role="tablist"
              aria-label="Event lifecycle"
            >
              {steps.map(([title], i) => (
                <button
                  key={title}
                  id={`step-${i}`}
                  role="tab"
                  aria-selected={step === i}
                  aria-controls={`story-${i}`}
                  tabIndex={step === i ? 0 : -1}
                  onClick={() => setStep(i)}
                  onKeyDown={(e) => {
                    if (
                      [
                        "ArrowDown",
                        "ArrowUp",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                      ].includes(e.key)
                    ) {
                      e.preventDefault();
                      const n =
                        e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? 6
                            : (i +
                                (["ArrowDown", "ArrowRight"].includes(e.key)
                                  ? 1
                                  : 6)) %
                              7;
                      setStep(n);
                      document.getElementById(`step-${n}`).focus();
                    }
                  }}
                >
                  <span>0{i + 1}</span>
                  {title}
                  <ArrowUpRight size={20} />
                </button>
              ))}
            </div>
            <div
              className="lifecycle-story"
              id={`story-${step}`}
              role="tabpanel"
              aria-labelledby={`step-${step}`}
              tabIndex={0}
            >
              <div className="story-orbit" aria-hidden="true">
                <span>0{step + 1}</span>
              </div>
              <div key={step} className="story-copy">
                <span className="eyebrow">
                  {steps[step][0]} / THE EVENT LIFECYCLE
                </span>
                <h3>{steps[step][1]}</h3>
                <p>{steps[step][2]}</p>
                <Link className="text-link" to="/dashboard">
                  Enter your workspace <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="editorial-section" id="features" data-reveal>
          <span className="eyebrow">03 / QUIETLY POWERFUL</span>
          <div className="section-heading">
            <h2>
              Everything behind
              <br />
              <em>the extraordinary.</em>
            </h2>
            <p>
              Thoughtful tools for the work
              <br />
              that rarely gets the spotlight.
            </p>
          </div>
          <div className="capability-grid">
            <article className="capability feature-large">
              <span className="eyebrow">01 — PLAN WITH CONFIDENCE</span>
              <h3>
                A time. A place.
                <br />
                No crossed wires.
              </h3>
              <p>
                Clash-free venue scheduling, with real protection against
                overlapping confirmed events.
              </p>
              <div
                className="schedule-preview"
                aria-label="Illustrative schedule"
              >
                <div>
                  VENUE SCHEDULE <span>ILLUSTRATION</span>
                </div>
                <div className="schedule-hours">
                  <span>09:00</span>
                  <span>12:00</span>
                  <span>15:00</span>
                </div>
                <div className="schedule-slot">
                  Confirmed booking <Check size={16} />
                </div>
                <div className="schedule-slot secondary">
                  A clear space for what’s next
                </div>
              </div>
            </article>
            <article className="capability">
              <span className="eyebrow">02 — PEOPLE, IN SYNC</span>
              <h3>
                Committee
                <br />
                coordination.
              </h3>
              <p>
                Clear assignments. Considered handovers. A shared view of who is
                doing what.
              </p>
              <div className="coordination-lines">
                <span>
                  Organize <i />
                </span>
                <span>
                  Assign <i />
                </span>
                <span>
                  Coordinate <i />
                </span>
              </div>
            </article>
            <article className="capability">
              <span className="eyebrow">03 — FIND YOUR PEOPLE</span>
              <h3>
                Campus event
                <br />
                discovery.
              </h3>
              <p>
                Published events, meaningful details, and a place to discover
                what’s happening.
              </p>
              <Link className="text-link" to="/dashboard">
                Discover events <ArrowUpRight size={18} />
              </Link>
            </article>
            <article className="capability feature-wide">
              <ShieldCheck size={32} strokeWidth={1} />
              <div>
                <h3>Participation with proof.</h3>
                <p>
                  Organizer verification and unique e-certificates. Signed QR
                  check-in and dynamic registration are planned extensions.
                </p>
              </div>
              <span className="feature-seal">
                VERIFIED
                <br />
                BY PEOPLE
              </span>
            </article>
          </div>
        </section>
        <section className="editorial-section certificate-section" data-reveal>
          <div>
            <span className="eyebrow">04 / MORE THAN A MOMENT</span>
            <h2>
              Effort deserves
              <br />
              <em>recognition.</em>
            </h2>
            <p>
              Proof that you were part of something. Issued after an event ends,
              with organizer-approved participation and a unique, verifiable
              identity.
            </p>
            <ol className="certificate-steps">
              {[
                "Attended",
                "Organizer verified",
                "Certificate issued",
                "Secure download",
                "Public verification",
              ].map((t) => (
                <li key={t}>
                  <Check size={16} />
                  {t}
                </li>
              ))}
            </ol>
            <p className="honest-note">
              Gmail delivery and QR-linked delivery are planned. Preview is
              illustrative; issued PDFs use the existing certificate engine.
            </p>
          </div>
          <div className="certificate-paper">
            <span className="certificate-watermark" aria-hidden="true">
              e
            </span>
            <div className="certificate-top">
              <span className="wordmark">estrade.</span>
              <span>ILLUSTRATIVE PREVIEW</span>
            </div>
            <div className="certificate-rule" />
            <span className="eyebrow">A RECORD OF CONTRIBUTION</span>
            <h3>
              Certificate
              <br />
              <em>of participation</em>
            </h3>
            <p>Presented in recognition of</p>
            <div className="recipient">Your name, your moment.</div>
            <p>For showing up, taking part, and making a difference.</p>
            <div className="certificate-bottom">
              <span>
                Organizer approved
                <br />
                <strong>ESTRADE · SAMPLE ID</strong>
              </span>
              <span className="qr-preview">
                <QrCode size={44} strokeWidth={1.2} />
                QR verification concept
              </span>
            </div>
          </div>
        </section>
        <section
          className="editorial-section media-section"
          id="ai-media"
          data-reveal
        >
          <span className="eyebrow">05 / KEEP WHAT MATTERS</span>
          <div className="section-heading">
            <h2>
              The moments stay.
              <br />
              <em>The noise doesn’t.</em>
            </h2>
            <p>
              OpenCV sharpness checks and perceptual hashes help identify blurry
              or duplicate photographs. Human judgment has the final word.
            </p>
          </div>
          <div className="media-demo">
            <div className="media-contact-sheet" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  className={`contact-photo photo-${i} ${media === "Review" ? "photo-blur" : ""}`}
                  key={i}
                >
                  <div className="photo-stage" />
                  <span>FRAME 0{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="media-console">
              <span className="eyebrow">ANALYSIS WORKFLOW / ILLUSTRATION</span>
              <h3>A considered edit.</h3>
              <div
                className="media-tabs"
                aria-label="Example processing states"
              >
                {["Accepted", "Review", "Rejected"].map((t) => (
                  <button
                    aria-pressed={media === t}
                    onClick={() => setMedia(t)}
                    key={t}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p>
                {media === "Accepted"
                  ? "Clear, distinct frames are recommended for keeping."
                  : media === "Review"
                    ? "Uncertain quality deserves a closer look by your team."
                    : "Blurred or duplicate frames are flagged with a reason."}
              </p>
              <div className="processing-line">
                Original images → Analysis → Recommendation
              </div>
              <p className="honest-note">
                Decoded, sanitized processing. Google Drive preservation and
                Geotagged / Standard folders are planned; no neural model is
                claimed.
              </p>
            </div>
          </div>
        </section>
        <section
          className="editorial-section campus-discovery"
          id="events"
          data-reveal
        >
          <span className="eyebrow">06 / YOUR CAMPUS IS CALLING</span>
          <h2>
            Be part of
            <br />
            <em>what happens next.</em>
          </h2>
          <p>
            Sign in to discover the events available to your account.
            <br />
            Real people. Shared experiences. Your next chapter.
          </p>
          <Link className="button primary" to="/dashboard">
            Explore campus events <ArrowUpRight size={18} />
          </Link>
          <span className="discovery-ring" aria-hidden="true" />
        </section>
        <TeamSection />
        <section className="closing-stage" data-reveal>
          <span className="eyebrow">THE STAGE IS YOURS</span>
          <h2>
            Give every event
            <br />
            <em>a better stage.</em>
          </h2>
          <Link className="button primary" to="/login">
            Start with Estrade <ArrowUpRight size={18} />
          </Link>
          <span className="closing-wordmark" aria-hidden="true">
            estrade.
          </span>
        </section>
      </main>
      <footer className="cinema-footer">
        <Link to="/" className="wordmark">
          estrade.
        </Link>
        <p>Behind every great event.</p>
        <a href="#about">
          The people behind Estrade <ArrowUpRight size={16} />
        </a>
        <span>© 2026 Estrade</span>
        <a href="#main">Back to the light ↑</a>
      </footer>
    </div>
  );
}
