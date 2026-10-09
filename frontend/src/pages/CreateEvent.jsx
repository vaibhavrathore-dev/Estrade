import { useState } from "react";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";

import "./CreateEvent.css";

function CreateEvent() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    committee_id: "",
    venue_id: "",
    starts_at: "",
    ends_at: "",
    max_participants: "",
    status: "draft",
  });

  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const start = new Date(formData.starts_at);
    const end = new Date(formData.ends_at);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      setMessage("Please enter valid event dates.");
      return;
    }

    if (end <= start) {
      setMessage("Event end time must be after start time.");
      return;
    }

    // Prepare data according to the FastAPI EventCreate schema.
    // ISO strings include UTC timezone information.
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim() || null,

      committee_id: formData.committee_id.trim(),
      venue_id: formData.venue_id.trim(),

      starts_at: start.toISOString(),
      ends_at: end.toISOString(),

      max_participants: formData.max_participants
        ? Number(formData.max_participants)
        : null,

      status: formData.status,
    };

    // For now, preview the request.
    // We'll connect the POST API in a later step.
    setPreview(payload);
    setMessage(
      "Event data validated locally. API connection is pending."
    );
  };

  return (
    <div className="create-event-page">

      <div className="create-event-container">

        {/* BACK BUTTON */}

        <Link to="/dashboard" className="create-event-back">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* HEADER */}

        <div className="create-event-header">

          <span className="create-event-label">
            ESTRADE / EVENT MANAGEMENT
          </span>

          <h1>
            Create a
            <br />
            <em>new event.</em>
          </h1>

          <p>
            Bring your next campus event to life.
            Start by entering its essential details.
          </p>

        </div>

        {/* FORM */}

        <form
          className="create-event-form"
          onSubmit={handleSubmit}
        >

          {/* EVENT DETAILS */}

          <div className="create-event-section">

            <h2>01 / Event Information</h2>

            <div className="create-event-field">

              <label htmlFor="event-title">
                Event Title *
              </label>

              <input
                id="event-title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="AI Innovation Hackathon"
                minLength={3}
                maxLength={200}
                required
              />

            </div>

            <div className="create-event-field">

              <label htmlFor="event-description">
                Event Description
              </label>

              <textarea
                id="event-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows={4}
              />

            </div>

          </div>

          {/* COMMITTEE AND VENUE */}

          <div className="create-event-section">

            <h2>02 / Organization & Venue</h2>

            <div className="create-event-grid">

              <div className="create-event-field">

                <label htmlFor="committee-id">
                  Committee ID *
                </label>

                <input
                  id="committee-id"
                  type="text"
                  name="committee_id"
                  value={formData.committee_id}
                  onChange={handleChange}
                  placeholder="Committee UUID"
                  required
                />

              </div>

              <div className="create-event-field">

                <label htmlFor="venue-id">
                  Venue ID *
                </label>

                <input
                  id="venue-id"
                  type="text"
                  name="venue_id"
                  value={formData.venue_id}
                  onChange={handleChange}
                  placeholder="Venue UUID"
                  required
                />

              </div>

            </div>

            <p className="create-event-hint">
              Temporary fields: we'll replace these UUID inputs
              with committee and venue dropdowns when their
              backend APIs are available.
            </p>

          </div>

          {/* DATE AND TIME */}

          <div className="create-event-section">

            <h2>03 / Event Schedule</h2>

            <div className="create-event-grid">

              <div className="create-event-field">

                <label htmlFor="event-start">
                  Start Date & Time *
                </label>

                <input
                  id="event-start"
                  type="datetime-local"
                  name="starts_at"
                  value={formData.starts_at}
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="create-event-field">

                <label htmlFor="event-end">
                  End Date & Time *
                </label>

                <input
                  id="event-end"
                  type="datetime-local"
                  name="ends_at"
                  value={formData.ends_at}
                  onChange={handleChange}
                  required
                />

              </div>

            </div>

          </div>

          {/* EVENT SETTINGS */}

          <div className="create-event-section">

            <h2>04 / Event Settings</h2>

            <div className="create-event-grid">

              <div className="create-event-field">

                <label htmlFor="event-capacity">
                  Maximum Participants
                </label>

                <input
                  id="event-capacity"
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  placeholder="150"
                  min="1"
                />

              </div>

              <div className="create-event-field">

                <label htmlFor="event-status">
                  Event Status
                </label>

                <select
                  id="event-status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="confirmed">
                    Confirmed
                  </option>
                </select>

              </div>

            </div>

          </div>

          {/* FORM ACTIONS */}

          <div className="create-event-actions">

            <Link
              to="/dashboard"
              className="create-event-cancel"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="create-event-submit"
            >
              <CalendarPlus size={19} />

              Preview Event Data
            </button>

          </div>

          {message && (
            <p className="create-event-message" role="status">
              {message}
            </p>
          )}

          {preview && (
            <pre className="create-event-preview">
              {JSON.stringify(preview, null, 2)}
            </pre>
          )}

        </form>

      </div>

    </div>
  );
}

export default CreateEvent;