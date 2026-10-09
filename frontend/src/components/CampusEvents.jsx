import { ArrowRight, CalendarDays } from "lucide-react";

// Sample campus events
const events = [
  {
    id: 1,
    day: "09",
    month: "OCT",
    name: "BRAIN2BUILD Hackathon",
    date: "9 October 2026",
    time: "10:00 AM",
    venue: "CSE Department",
    category: "Technical",
    color: "gold"
  },
  {
    id: 2,
    day: "16",
    month: "OCT",
    name: "Cultural Fest",
    date: "16 October 2026",
    time: "5:00 PM",
    venue: "Main Auditorium",
    category: "Cultural",
    color: "blue"
  },
  {
    id: 3,
    day: "21",
    month: "OCT",
    name: "Technical Workshop",
    date: "21 October 2026",
    time: "11:00 AM",
    venue: "Innovation Lab",
    category: "Academic",
    color: "blue"
  }
];

function CampusEvents() {
  return (
    <section className="campus-events-section" id="events">

      {/* SECTION HEADER */}

      <div className="campus-events-header">

        <div className="campus-events-heading">

          <span className="campus-events-label">
            06 / CAMPUS LIFE
          </span>

          <h2>
            Coming up
            <br />
            <em>on campus.</em>
          </h2>

          <p>
            Discover events, experiences, and opportunities
            that bring our campus community together.
          </p>

        </div>

        <a href="/dashboard" className="campus-view-all">
          View all events
          <ArrowRight size={18} />
        </a>

      </div>

      {/* EVENTS GRID */}

      <div className="campus-events-grid">

        {events.map((event) => (

          <article
            className="campus-event-card"
            key={event.id}
          >

            {/* EVENT DATE */}

            <div className={`campus-event-date ${event.color}`}>

              <strong>{event.day}</strong>
              <span>{event.month}</span>

            </div>

            {/* EVENT DETAILS */}

            <div className="campus-event-info">

              <span className="campus-event-category">
                {event.category}
              </span>

              <h3>{event.name}</h3>

              <p>
                <CalendarDays size={15} />
                {event.date}
              </p>

              <p>
                {event.time} · {event.venue}
              </p>

            </div>

            {/* VIEW EVENT */}

            <a
              href="/dashboard"
              className="campus-event-link"
              aria-label={`Explore ${event.name} in dashboard`}
            >
              <ArrowRight size={20} />
            </a>

          </article>

        ))}

      </div>

      {/* BOTTOM MESSAGE */}

      <div className="campus-events-footer">

        <span>
          Every event is a new opportunity to connect,
          collaborate, and create memories.
        </span>

      </div>

    </section>
  );
}

export default CampusEvents;