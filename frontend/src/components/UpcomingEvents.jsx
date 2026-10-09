import { ArrowRight } from "lucide-react";

function UpcomingEvents({ searchQuery = "", onViewEvent, events = [], title = "Upcoming Events" }) {

  // Filter events using the search bar

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="upcoming-events">

      {/* SECTION HEADING */}

      <div className="section-title-row">

        <h2>{title}</h2>

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