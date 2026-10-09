import {
  CalendarDays,
  Users,
  RefreshCcw,
  Image,
  Award,
  ChartNoAxesCombined,
  Megaphone,
  ArrowUpRight
} from "lucide-react";

const features = [
  {
    id: "01",
    title: "Event Management",
    description:
      "Plan, organize, and manage every college event from one intelligent workspace.",
    icon: CalendarDays
  },
  {
    id: "02",
    title: "Smart Coordination",
    description:
      "Bring faculty, coordinators, and volunteers together with clearly assigned responsibilities.",
    icon: Users
  },
  {
    id: "03",
    title: "Volunteer Replacement",
    description:
      "Handle last-minute withdrawals with intelligent volunteer recommendations.",
    icon: RefreshCcw
  },
  {
    id: "04",
    title: "AI Media Manager",
    description:
      "Identify blurry and duplicate event photographs using computer vision.",
    icon: Image
  },
  {
    id: "05",
    title: "Digital Certificates",
    description:
      "Generate professional participation and winner certificates in PDF format.",
    icon: Award
  },
  {
    id: "06",
    title: "Event Readiness",
    description:
      "Track preparation progress, pending responsibilities, and event completion.",
    icon: ChartNoAxesCombined
  },
  {
    id: "07",
    title: "Announcements",
    description:
      "Keep your entire event team informed through centralized announcements.",
    icon: Megaphone
  }
];

function FeaturesSection() {
  return (
    <section className="features-section" id="features">

      <div className="features-header">

        <span className="features-label">
          03 / THE PLATFORM
        </span>

        <h2>
          Everything your
          <br />
          event needs.
          <br />
          <em>Nothing it doesn't.</em>
        </h2>

        <p>
          Thoughtfully designed tools that make
          campus event planning simpler,
          coordination smarter, and every
          experience more memorable.
        </p>

      </div>

      <div className="features-grid">

        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article
              className="feature-card"
              key={feature.id}
            >

              <div className="feature-card-top">

                <Icon
                  size={30}
                  strokeWidth={1.4}
                />

                <span>{feature.id}</span>

              </div>

              <div className="feature-card-content">

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

              </div>

              <ArrowUpRight
                className="feature-arrow"
                size={20}
                strokeWidth={1.5}
              />

            </article>
          );
        })}

      </div>

      <div className="features-bottom">

        <span>
          One connected platform for every stage
          of your campus event.
        </span>

      </div>

    </section>
  );
}

export default FeaturesSection;