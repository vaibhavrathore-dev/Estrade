import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, CalendarDays, Check, Images, MapPin, QrCode, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import "./theatre-story.css";

const ACTS = [
  {
    label: "THE UNSEEN WORK",
    title: "Every standing ovation",
    emphasis: "starts backstage.",
    body: "Before the first guest arrives, there are venues to book, people to coordinate, forms to collect, and a hundred details no audience ever sees.",
    coda: "Great experiences should not depend on scattered tools.",
  },
  {
    label: "THE PREPARATION",
    title: "Make space for",
    emphasis: "what matters.",
    body: "Create the event, bring your committee together, open registration, and choose a venue without scheduling conflicts. Every detail finds its place.",
    coda: "One place to turn plans into a shared performance.",
  },
  {
    label: "THE MOMENT",
    title: "When the doors open,",
    emphasis: "be ready.",
    body: "Students register, arrive with their event QR, and organizers confirm attendance. No lost sign-in sheets. Just a clear, accountable flow.",
    coda: "Every arrival becomes part of the story.",
  },
  {
    label: "THE AFTERGLOW",
    title: "The applause fades.",
    emphasis: "The impact stays.",
    body: "Verify participation, issue traceable certificates, deliver them by email, and preserve event photography after quality checks — long after the venue goes quiet.",
    coda: "Behind every great event. Beyond its final moment.",
  },
];

function SceneArt({ act }) {
  return (
    <div className={`estrade-story-art estrade-story-art--${act}`} aria-hidden="true">
      <div className="estrade-story-art__arch" />
      <div className="estrade-story-art__spotlight" />
      <div className="estrade-story-art__floor" />
      <div className="estrade-story-art__overline">THE STORY OF AN EVENT · {String(act + 1).padStart(2, "0")}/04</div>
      <div className="estrade-story-art__scene" key={act}>
        {act === 0 && (
          <div className="estrade-story-art__scattered">
            <span className="estrade-story-art__note estrade-story-art__note--a">Who has the list?</span>
            <span className="estrade-story-art__note estrade-story-art__note--b">Venue available?</span>
            <span className="estrade-story-art__note estrade-story-art__note--c">Certificate names</span>
            <span className="estrade-story-art__question">?</span>
            <span className="estrade-story-art__note estrade-story-art__note--d">What happens next?</span>
          </div>
        )}
        {act === 1 && (
          <div className="estrade-story-art__event">
            <span className="estrade-story-art__micro">EVENT WORKSPACE / ILLUSTRATION</span>
            <div className="estrade-story-art__event-title">A stage for<br /><em>every idea.</em></div>
            <div className="estrade-story-art__event-lines">
              <span><CalendarDays size={17} /> Date & time arranged <Check size={16} /></span>
              <span><MapPin size={17} /> Venue conflict-checked <Check size={16} /></span>
              <span><Users size={17} /> Committee coordinated <Check size={16} /></span>
            </div>
          </div>
        )}
        {act === 2 && (
          <div className="estrade-story-art__ticket">
            <div className="estrade-story-art__ticket-head"><span>estrade</span><span>ENTRY / 03</span></div>
            <div className="estrade-story-art__ticket-body">
              <div className="estrade-story-art__qr"><QrCode strokeWidth={1} size={91} /></div>
              <div><small>ATTENDANCE</small><strong>Here for<br />the moment.</strong><span className="estrade-story-art__verified"><Check size={13} /> Checked in</span></div>
            </div>
            <span className="estrade-story-art__ticket-foot">Illustrative check-in · not a scannable ticket</span>
          </div>
        )}
        {act === 3 && (
          <div className="estrade-story-art__legacy">
            <div className="estrade-story-art__certificate">
              <span className="estrade-story-art__cert-logo">estrade</span>
              <small>CERTIFICATE OF PARTICIPATION</small>
              <strong>Every moment<br /><em>deserves a record.</em></strong>
              <div className="estrade-story-art__cert-seal"><ShieldCheck size={19} /> VERIFIED</div>
            </div>
            <div className="estrade-story-art__photos"><Images size={23} /><span>MEMORIES PRESERVED</span></div>
          </div>
        )}
      </div>
      <div className="estrade-story-art__footer"><span>BEHIND THE CURTAIN</span><span>ESTRADE / AN EVENT STORY</span></div>
    </div>
  );
}

export default function TheatreStory() {
  const [active, setActive] = useState(0);
  const storyRef = useRef(null);

  useEffect(() => {
    const items = storyRef.current?.querySelectorAll("[data-story-act]");
    if (!items?.length || typeof IntersectionObserver === "undefined") return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        // Only the act occupying the central reading band becomes active.
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActive(Number(visible[0].target.getAttribute("data-story-act")));
        }
      },
      { rootMargin: "-24% 0px -24% 0px", threshold: [0, 0.25, 0.5, 0.75] },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="estrade-story" id="story" ref={storyRef} aria-labelledby="estrade-story-heading">
      <div className="estrade-story__intro">
        <span className="estrade-story__eyebrow">THE PERFORMANCE BEGINS <span aria-hidden="true">✦</span> A FOUR-ACT STORY</span>
        <h2 id="estrade-story-heading">The curtain opens.<br /><em>The story begins.</em></h2>
        <p>The audience sees the moment. Estrade brings together everything it takes to make that moment possible.</p>
        <div className="estrade-story__scroll-hint"><ArrowDown size={17} /> SCROLL TO FOLLOW THE STORY</div>
      </div>

      <div className="estrade-story__experience">
        <div className="estrade-story__visual">
          <div className="estrade-story__visual-inner"><SceneArt act={active} /></div>
          <div className="estrade-story__progress" aria-hidden="true">
            {ACTS.map((item, index) => (
              <span key={item.label} className={active === index ? "is-active" : ""}><i /> 0{index + 1}</span>
            ))}
          </div>
        </div>
        <div className="estrade-story__chapters">
          {ACTS.map((item, index) => (
            <article
              key={item.label}
              className={`estrade-story__chapter ${active === index ? "is-active" : ""}`}
              data-story-act={index}
            >
              <div className="estrade-story__chapter-content">
                <div className="estrade-story__rule"><span>ACT {String(index + 1).padStart(2, "0")}</span><span>{item.label}</span></div>
                <h3>{item.title}<br /><em>{item.emphasis}</em></h3>
                <p>{item.body}</p>
                <div className="estrade-story__coda">{item.coda}</div>
                <div className="estrade-story__mobile-art"><SceneArt act={index} /></div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="estrade-story__outro">
        <span className="estrade-story__eyebrow">THE NEXT ACT IS YOURS</span>
        <p>Behind every great event, <em>there's estrade.</em></p>
        <div className="estrade-story__outro-actions">
          <a href="#lifecycle">Explore the full lifecycle <ArrowRight size={18} /></a>
          <Link to="/login">Get Started <ArrowRight size={18} /></Link>
        </div>
      </div>
    </section>
  );
}
