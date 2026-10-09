import { ArrowRight, Sparkles } from "lucide-react";

function FinalCTA() {
  return (
    <section className="final-cta-section" id="get-started">

      {/* DECORATIVE SPOTLIGHT */}

      <div className="final-cta-glow"></div>

      {/* SECTION CONTENT */}

      <div className="final-cta-content">

        {/* SMALL LABEL */}

        <div className="final-cta-label">
          <Sparkles size={17} strokeWidth={1.5} />

          <span>
            YOUR NEXT GREAT EVENT STARTS HERE
          </span>
        </div>

        {/* MAIN HEADING */}

        <h2>
          Great events don't
          <br />
          <em>happen by accident.</em>
        </h2>

        {/* DESCRIPTION */}

        <p>
          They happen when people, planning,
          and technology work together.

          <br />

          Make your next campus event extraordinary
          with Estrade.
        </p>

        {/* CTA BUTTON */}

        <a href="/dashboard" className="final-cta-button">

          Start With Estrade

          <ArrowRight size={19} strokeWidth={1.7} />

        </a>

      </div>

      {/* DECORATIVE BRAND */}

      <div className="final-cta-brand">
        estrade
      </div>

      {/* BOTTOM TEXT */}

      <div className="final-cta-bottom">

        <span>
          BEHIND EVERY GREAT EVENT.
        </span>

        <span>
          BUILT FOR CAMPUS LIFE.
        </span>

      </div>

    </section>
  );
}

export default FinalCTA;