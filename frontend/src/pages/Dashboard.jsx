import { useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardStats from "../components/DashboardStats";
import WithdrawalAlert from "../components/WithdrawalAlert";
import UpcomingEvents from "../components/UpcomingEvents";
import EventReadiness from "../components/EventReadiness";
import { Link } from "react-router-dom";

import "./Dashboard.css";

function Dashboard() {

  const [activePage, setActivePage] = useState("Overview");

  const [searchQuery, setSearchQuery] = useState("");

  const [message, setMessage] = useState("");

  // CREATE EVENT FUNCTION

  const handleCreateEvent = () => {
    setMessage("Create Event functionality coming soon!");
  };

  // VOLUNTEER REPLACEMENT FUNCTION

  const handleReviewReplacement = () => {
    setMessage("Volunteer replacement suggestions are coming next!");
  };

  return (

    <div className="estrade-dashboard">

      {/* LEFT SIDEBAR */}

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
      />

      {/* MAIN DASHBOARD AREA */}

      <div className="dashboard-main">

        {/* TOP NAVIGATION BAR */}

        <Topbar
          onSearchChange={setSearchQuery}
          onCreateEvent={handleCreateEvent}
        />

        {/* DASHBOARD CONTENT */}

        <main className="dashboard-content">

          {/* WELCOME SECTION */}

          <h1>Welcome back, Professor.</h1>

          <p>
            Here's what's happening with your events.
          </p>

          {/* DASHBOARD STATISTICS */}

          <DashboardStats />

          {/* COORDINATOR WITHDRAWAL ALERT */}

          <WithdrawalAlert
            onReview={handleReviewReplacement}
          />
          {/* UPCOMING EVENTS + EVENT READINESS */}

<div className="dashboard-overview-grid">

  {/* LEFT SIDE - UPCOMING EVENTS */}

  <UpcomingEvents
    searchQuery={searchQuery}
    onViewEvent={(event) => {
      if (event === null) {
        setActivePage("Events");
        setMessage("Opening all college events...");
      } else {
        setMessage(`Viewing details for ${event.name}`);
      }
    }}
  />

  {/* RIGHT SIDE - EVENT READINESS */}

  <EventReadiness />

</div>

          {/* CREATE EVENT / REPLACEMENT MESSAGE */}

          {message && (
            <div className="dashboard-placeholder">
              {message}
            </div>
          )}

          {/* SEARCH RESULT */}

          {searchQuery && (
            <div className="dashboard-placeholder">
              Searching for: {searchQuery}
            </div>
          )}

          {/* SELECTED PAGE */}

          {activePage !== "Overview" && (
            <div className="dashboard-placeholder">
              {activePage} page — Coming Soon
            </div>
          )}

        </main>

      </div>

    </div>

  );
}

export default Dashboard;