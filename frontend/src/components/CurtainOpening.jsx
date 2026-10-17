import { useCallback, useEffect, useRef, useState } from "react";
import "./curtain-opening.css";

const SESSION_KEY = "estrade-grand-opening-seen-v1";

function hasSeenOpening() {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "yes";
  } catch {
    return false;
  }
}

export default function CurtainOpening() {
  const [phase, setPhase] = useState(() => (hasSeenOpening() ? "done" : "closed"));
  const [sequence, setSequence] = useState(0);
  const fallbackTimer = useRef(null);
  const startTimer = useRef(null);

  const finish = useCallback(() => {
    window.clearTimeout(startTimer.current);
    window.clearTimeout(fallbackTimer.current);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "yes");
    } catch {
      // Private browsing or restricted storage must not block navigation.
    }
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase === "done") return undefined;
    if (phase === "opening") {
      fallbackTimer.current = window.setTimeout(finish, 3000);
      return () => window.clearTimeout(fallbackTimer.current);
    }
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      // Defer state update until after the effect; avoids a forced animation.
      startTimer.current = window.setTimeout(finish, 0);
    } else {
      startTimer.current = window.setTimeout(() => setPhase("opening"), 450);
    }
    return () => {
      window.clearTimeout(startTimer.current);
      window.clearTimeout(fallbackTimer.current);
    };
  }, [phase, sequence, finish]);

  const replay = () => {
    setPhase("closed");
    setSequence((value) => value + 1);
  };

  return (
    <>
      {phase !== "done" && (
        <div className={`estrade-opening estrade-opening--${phase}`} aria-label="Estrade theatre opening">
          {/* Elegant Estrade Opening Image */}
<div
  className="estrade-opening__stage"
  aria-hidden="true"
  style={{
    backgroundImage: "url('/images/estrade-opening.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundColor: "#FAF8F3",
  }}
/>
          <div className="estrade-opening__pelmet" aria-hidden="true" />
          <div className="estrade-opening__curtain estrade-opening__curtain--left" aria-hidden="true" />
          <div
            className="estrade-opening__curtain estrade-opening__curtain--right"
            aria-hidden="true"
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && event.propertyName === "transform" && phase === "opening") finish();
            }}
          />
          <div className="estrade-opening__caption" aria-hidden="true">THE SHOW IS ABOUT TO BEGIN</div>
          <button type="button" className="estrade-opening__skip" onClick={finish}>
            Skip intro <span aria-hidden="true">↗</span>
          </button>
        </div>
      )}
      {phase === "done" && (
        <button type="button" className="estrade-opening__replay" onClick={replay}>
          <span aria-hidden="true">✦</span> Replay opening
        </button>
      )}
    </>
  );
}
