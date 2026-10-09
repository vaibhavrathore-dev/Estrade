import {
  CalendarDays,
  UsersRound,
  ScanSearch,
  Award,
  Sparkles
} from "lucide-react";

const features = [
  {
    id: "events",
    icon: CalendarDays,
    title: "Event Management",
    subtitle: "Plan & organize"
  },
  {
    id: "team",
    icon: UsersRound,
    title: "Smart Coordination",
    subtitle: "Connect your team"
  },
  {
    id: "media",
    icon: ScanSearch,
    title: "AI Media Manager",
    subtitle: "Smarter photographs"
  },
  {
    id: "certificates",
    icon: Award,
    title: "Digital Certificates",
    subtitle: "Celebrate achievements"
  }
];

function LoginEcosystem() {
  return (
    <div
      className="login-ecosystem"
      aria-label="Estrade connects event management, team coordination, AI media management, and digital certificates."
    >

      {/* ANIMATED CONNECTIONS */}

      <svg
        className="ecosystem-connections"
        viewBox="0 0 600 360"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="ecosystem-line-gradient"
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0%" stopColor="#eac58b" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        <line x1="300" y1="180" x2="130" y2="78" />
        <line x1="300" y1="180" x2="470" y2="78" />
        <line x1="300" y1="180" x2="130" y2="282" />
        <line x1="300" y1="180" x2="470" y2="282" />

        <circle cx="130" cy="78" r="4" />
        <circle cx="470" cy="78" r="4" />
        <circle cx="130" cy="282" r="4" />
        <circle cx="470" cy="282" r="4" />
      </svg>

      {/* CENTER ESTRADE CARD */}

      <div className="ecosystem-center">

        <div className="ecosystem-center-icon">
          <Sparkles size={19} />
        </div>

        <h3>estrade<span>.</span></h3>

        <p>ONE CONNECTED WORKSPACE</p>

        <div className="ecosystem-center-status">
          <span className="ecosystem-status-dot" />
          Smart Event Platform
        </div>

      </div>

      {/* FLOATING FEATURE CARDS */}

      {features.map((feature) => {
        const Icon = feature.icon;

        return (
          <div
            key={feature.id}
            className={`ecosystem-feature ecosystem-${feature.id}`}
          >

            <div className="ecosystem-feature-icon">
              <Icon size={22} strokeWidth={1.6} />
            </div>

            <div className="ecosystem-feature-text">
              <h4>{feature.title}</h4>
              <p>{feature.subtitle}</p>
            </div>

          </div>
        );
      })}

      {/* DECORATIVE GLOW */}

      <div className="ecosystem-glow" aria-hidden="true" />

    </div>
  );
}

export default LoginEcosystem;