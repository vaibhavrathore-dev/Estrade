import { useState } from "react";

import {
  Search,
  Bell,
  Plus,
  ChevronDown
} from "lucide-react";

function Topbar({ onSearchChange, onCreateEvent }) {

  const [showNotifications, setShowNotifications] = useState(false);

  const [search, setSearch] = useState("");

  const handleSearch = (event) => {
    const value = event.target.value;

    setSearch(value);

    onSearchChange?.(value);
  };

  return (
    <header className="dashboard-topbar">

      {/* SEARCH BAR */}

      <div className="dashboard-search">

        <Search size={19} strokeWidth={1.7} />

        <input
          type="text"
          placeholder="Search events, tasks or people"
          value={search}
          onChange={handleSearch}
        />

      </div>


      {/* RIGHT SIDE ACTIONS */}

      <div className="dashboard-top-actions">

        {/* NOTIFICATIONS */}

        <div className="notification-wrapper">

          <button
            type="button"
            className="notification-button"
            aria-label="Notifications"
            onClick={() =>
              setShowNotifications(!showNotifications)
            }
          >

            <Bell size={21} strokeWidth={1.7} />

            <span className="notification-dot"></span>

          </button>


          {/* ANNOUNCEMENTS */}

          {showNotifications && (

            <div className="notification-panel">

              <h3>Announcements</h3>

              <p>
                BRAIN2BUILD Hackathon starts tomorrow.
              </p>

              <p>
                A coordinator withdrawal requires attention.
              </p>

              <p>
                Faculty meeting scheduled for event preparation.
              </p>

            </div>

          )}

        </div>


        {/* FACULTY PROFILE */}

        <div className="faculty-profile">

          <span className="faculty-avatar">
            PS
          </span>

          <span className="faculty-name">
            Faculty
          </span>

          <ChevronDown size={16} />

        </div>


        {/* CREATE EVENT BUTTON */}

        <button
          type="button"
          className="create-event-button"
          onClick={() => onCreateEvent?.()}
        >

          <Plus size={20} strokeWidth={1.7} />

          <span>Create Event</span>

        </button>

      </div>

    </header>
  );
}

export default Topbar;