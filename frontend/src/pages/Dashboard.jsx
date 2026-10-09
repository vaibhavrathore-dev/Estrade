import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import DashboardStats from "../components/DashboardStats";
import WithdrawalAlert from "../components/WithdrawalAlert";
import UpcomingEvents from "../components/UpcomingEvents";
import EventReadiness from "../components/EventReadiness";
import EventForm from "../components/EventForm";
import EventWorkspace from "../components/EventWorkspace";
import { apiRequest, authAPI, eventAPI } from "../services/api";
import "./Dashboard.css";
import "./Operations.css";

export default function Dashboard({ initialCreateEvent = false }) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(initialCreateEvent);
  const [selected, setSelected] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("");
  const load = useCallback(async () => {
    const [user, events, venues, committees, summary, certificates] = await Promise.all([
      authAPI.me(), eventAPI.list(), apiRequest("/api/v1/venues"), apiRequest("/api/v1/committees"), apiRequest("/api/v1/dashboard"), apiRequest("/api/v1/certificates")]);
    setData({user, events, venues, committees, summary, certificates});
  }, []);
  // load updates state only after API promises resolve.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(e => setMessage(e.message)); }, [load]);
  const refresh = async () => { setMessage(""); try { await load(); } catch(e) { setMessage(e.message); } };
  function openCreateEvent() {
    if (!data) {
      setMessage("Workspace data is not ready. Please retry loading your workspace before creating an event.");
      return;
    }
    setMessage("");
    setNotice("");
    setCreating(true);
  }
  async function downloadCertificate(id) {
    try {
      const blob = await apiRequest(`/api/v1/certificates/${id}/download`, {blob: true});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = `estrade-${id}.pdf`;
      link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error.message); }
  }
  const events = data?.events || [];
  const filtered = events.filter(e => !committeeFilter || e.committee_id === committeeFilter);
  const selectedEvent = filtered.find(e => e.id === selected) || filtered[0];
  const rows = filtered.filter(e => activePage !== "Overview" || (e.status === "confirmed" && new Date(e.ends_at) > new Date())).map(e => ({...e,
    day: new Date(e.starts_at).getDate(), month: new Date(e.starts_at).toLocaleString(undefined,{month:"short"}), name: e.title,
    time: new Date(e.starts_at).toLocaleString(), venue: data?.venues.find(v => v.id === e.venue_id)?.name || "Venue unavailable",
    coordinators: data?.summary.event_metrics[e.id]?.coordinators ?? "—",
    status: e.status === "confirmed" ? (new Date(e.ends_at) < new Date() ? "Completed" : new Date(e.starts_at) <= new Date() ? "Ongoing" : "Upcoming") : e.status,
    color: e.status === "confirmed" ? "green" : "blue"}));
  return <div className="estrade-dashboard">
    <Sidebar activePage={activePage} onNavigate={page => {setActivePage(page); setNotice("");}} role={data?.user.user_type} />
    <div className="dashboard-main">
      <Topbar onSearchChange={setSearchQuery} onCreateEvent={openCreateEvent} user={data?.user} pending={data?.summary.pending_withdrawals} />
      <main className="dashboard-content"><h1>Welcome back{data ? `, ${data.user.full_name}` : ""}.</h1><p>Here's what's happening with your events.</p>
        {notice && <div role="status" className="operations-message">{notice}<button onClick={() => setNotice("")}>Dismiss</button></div>}
        {message && <div role="alert" className="operations-message">{message}<button onClick={refresh}>Retry</button></div>}
        {!data && !message && <p role="status">Loading your workspace…</p>}
        {data && <><DashboardStats summary={data.summary} /><WithdrawalAlert count={data.summary.pending_withdrawals} onReview={() => setActivePage("Coordinators")} />
          {["Overview", "Events"].includes(activePage) && <div className="dashboard-overview-grid"><UpcomingEvents events={rows} title={activePage === "Overview" ? "Upcoming & Ongoing Events" : "All Events"} searchQuery={searchQuery} onViewEvent={event => {setActivePage("Events"); if(event) setSelected(event.id);}} /><EventReadiness events={events} summary={data.summary} /></div>}
          {activePage === "Certificates" && <section className="operations-panel"><h2>My certificates</h2>
            {data.certificates.length === 0 && <p>No certificates issued to your account yet.</p>}
            {data.certificates.map(c => <div className="operations-row" key={c.id}>{c.event_title} · {new Date(c.event_date).toLocaleDateString()}<button onClick={() => downloadCertificate(c.id)}>Download my certificate</button></div>)}
          </section>}
          {activePage !== "Overview" && activePage !== "Settings" && <>
            <section className="operations-panel"><h2>{activePage}</h2>
              <label>Committee<select className="operations-select" value={committeeFilter} onChange={e => {setCommitteeFilter(e.target.value);setSelected("");}}><option value="">All committees</option>{data.committees.map(c => <option key={c.id} value={c.id}>{c.name}{c.role ? ` · ${c.role} (${c.membership_status})` : ""}</option>)}</select></label>
              <label>Event<select className="operations-select" value={selectedEvent?.id || ""} onChange={e => setSelected(e.target.value)}>{filtered.length === 0 && <option value="">No visible events</option>}{filtered.map(e => <option value={e.id} key={e.id}>{e.title} · {e.status}</option>)}</select></label>
              {activePage === "Tasks" && <p>Scheduling, staffing, and withdrawal actions are available below. A separate task checklist is not implemented.</p>}
            </section>
            {selectedEvent && <EventWorkspace key={`${selectedEvent.id}-${activePage}`} event={selectedEvent} committee={data.committees.find(c => c.id === selectedEvent.committee_id)} venue={data.venues.find(v => v.id === selectedEvent.venue_id)} user={data.user} section={activePage} onChanged={refresh} />}
          </>}
          {activePage === "Settings" && <section className="operations-panel"><h2>Your account</h2><p>{data.user.full_name} · {data.user.email} · {data.user.user_type}</p><p>For security, re-authentication is required after a full page reload.</p><button onClick={() => {authAPI.setToken(null); navigate("/login");}}>Sign out</button></section>}
        </>}
      </main>
    </div>
    {creating && data && <EventForm committees={data.committees} venues={data.venues} user={data.user} onClose={notice => {setCreating(false); if (notice) setNotice(notice); if (initialCreateEvent) navigate("/dashboard", {replace:true});}} onCreated={event => {if (initialCreateEvent) navigate("/dashboard", {replace:true}); setNotice(`Event “${event.title}” created successfully.`);setCreating(false);setCommitteeFilter(event.committee_id);setSelected(event.id);setActivePage("Events");load().catch(e => setMessage(`Event saved, but the dashboard could not refresh: ${e.message}`));}} />}
  </div>;
}
