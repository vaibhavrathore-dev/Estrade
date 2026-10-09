import {
  CalendarPlus,
  UsersRound,
  ClipboardCheck,
  Award
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Your Event",
    description:
      "Set event details, schedules, venues, and responsibilities in one place.",
    icon: CalendarPlus
  },
  {
    number: "02",
    title: "Coordinate Your Team",
    description:
      "Assign faculty coordinators, volunteers, and individual responsibilities.",
    icon: UsersRound
  },
  {
    number: "03",
    title: "Track & Adapt",
    description:
      "Monitor event readiness, manage tasks, and handle unexpected withdrawals.",
    icon: ClipboardCheck
  },
  {
    number: "04",
    title: "Celebrate & Automate",
    description:
      "Analyze event photographs, generate certificates, and preserve event records.",
    icon: Award
  }
];

function HowItWorks() {
  return (
    <section className="how-it-works" id="journey">

      {/* SECTION HEADER */}

      <div className="how-header">

        <span className="how-label">
          05 / HOW IT WORKS
        </span>

        <h2>
          From idea to execution.
          <br />
          <em>All in one place.</em>
        </h2>

        <p>
          Every great event follows a journey.
          Estrade makes every step simpler,
          smarter, and more connected.
        </p>

      </div>

      {/* TIMELINE */}

      <div className="how-timeline">

        {steps.map((step) => {

          const Icon = step.icon;

          return (
            <article
              className="how-step"
              key={step.number}
            >

              <div className="how-step-number">
                {step.number}
              </div>

              <div className="how-step-content">

                <Icon
                  size={28}
                  strokeWidth={1.4}
                />

                <h3>{step.title}</h3>

                <p>{step.description}</p>

              </div>

            </article>
          );

        })}

      </div>

      {/* BOTTOM MESSAGE */}

      <div className="how-bottom">

        <p>
          From the first idea to the final applause.
          <br />
          <em>Estrade is with you at every step.</em>
        </p>

      </div>

    </section>
  );
}

export default HowItWorks;