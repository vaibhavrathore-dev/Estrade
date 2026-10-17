import { useState } from "react";
const chapters = [
  ["01", "Prepare", "A place for the plan. A role for every person."],
  ["02", "Bring to life", "People, venues, and responsibilities in sync."],
  ["03", "Remember", "Verified participation. Moments worth keeping."],
];
export default function LoginEcosystem() {
  const [active, setActive] = useState(0);
  return (
    <div className="auth-lifecycle">
      <div className="auth-stage-art" aria-hidden="true">
        <span>e.</span>
        <i />
        <b />
      </div>
      <div className="auth-chapters">
        {chapters.map(([n, title], i) => (
          <button
            key={n}
            onClick={() => setActive(i)}
            aria-pressed={active === i}
          >
            <small>{n}</small>
            {title}
          </button>
        ))}
      </div>
      <p role="status">{chapters[active][2]}</p>
      <span className="auth-caption">
        FROM THE FIRST IDEA TO THE FINAL APPLAUSE
      </span>
    </div>
  );
}
