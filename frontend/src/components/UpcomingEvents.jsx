import { ArrowRight } from "lucide-react";

function UpcomingEvents({ searchQuery = "", onViewEvent }) {

  const events = [
    {
      id: 1,
      day: "09",
      month: "OCT",
      name: "BRAIN2BUILD Hackathon",
      time: "10:00 AM",
      venue: "CSE Department",
      coordinators: 6,
      status: "Needs attention",
      color: "yellow",
    },
    {
      id: 2,
      day: "16",
      month: "OCT",
      name: "Cultural Fest",
      time: "5:00 PM",
      venue: "Main Auditorium",
      coordinators: 5,
      status: "On track",
      color: "green",
    },
    {
      id: 3,
      day: "21",
      month: "OCT",
      name: "Technical Workshop",
      time: "11:00 AM",
      venue: "Innovation Lab",
      coordinators: 4,
      status: "Planning",
      color: "blue",
    },
  ];

  // Filter events using the search bar

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="upcoming-events">

      {/* SECTION HEADING */}

      <div className="section-title-row">

        <h2>Upcoming Events</h2>

        <button
          type="button"
          className="view-all-events"
          onClick={() => onViewEvent?.(null)}
        >
          View all events
          <ArrowRight size={16} />
        </button>

      </div>

      {/* EVENT LIST */}

      <div className="events-list">

        {filteredEvents.map((event) => (

          <div className="event-row" key={event.id}>

            {/* EVENT DATE */}

            <div className="event-date-box">

              <strong>{event.day}</strong>

              <span>{event.month}</span>

            </div>

            {/* EVENT INFORMATION */}

            <div className="event-information">

              <h4>{event.name}</h4>

              <p>
                {event.time} · {event.venue}
              </p>

            </div>

            {/* COORDINATORS */}

            <div className="event-coordinators">

              {event.coordinators} coordinators

            </div>

            {/* EVENT STATUS */}

            <div className="event-status">

              <span
                className={`status-dot ${event.color}`}
              ></span>

              <span>{event.status}</span>

            </div>

            {/* VIEW DETAILS */}

            <button
              type="button"
              className="event-details"
              onClick={() => onViewEvent?.(event)}
            >
              View Details

              <ArrowRight size={16} />

            </button>

          </div>

        ))}

        {/* NO MATCHING EVENTS */}

        {filteredEvents.length === 0 && (

          <p className="no-events">
            No matching events found.
          </p>

        )}

      </div>

    </section>
  );
}

export default UpcomingEvents;