import "./curtain-opening.css";

/** This is the post-intro hero, not a second full-screen animation. */
export default function StageShowcase() {
  return (
    <div className="hero-stage estrade-theatre-showcase" aria-label="The Estrade stage">
      <div className="estrade-theatre-showcase__arch" aria-hidden="true" />
      <div className="estrade-theatre-showcase__beam" aria-hidden="true" />
      <div className="estrade-theatre-showcase__glow" aria-hidden="true" />
      <div className="estrade-theatre-showcase__content">
        <span className="estrade-theatre-showcase__overline">THE STAGE IS SET</span>
        <div className="estrade-theatre-showcase__name">estrade<span>.</span></div>
        <p>Behind every great event.</p>
      </div>
      <div className="estrade-theatre-showcase__floor" aria-hidden="true" />
      <span className="estrade-theatre-showcase__footer">WHERE EVERY GREAT STORY BEGINS</span>
    </div>
  );
}
