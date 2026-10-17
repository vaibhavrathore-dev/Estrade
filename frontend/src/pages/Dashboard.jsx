import Button from "../components/Button";
import CommitteeWorkspace, { MyAssignments } from "../components/CommitteeWorkspace";
import { MyRegistrations } from "../components/RegistrationWorkspace";
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
import DashboardPreviewWorkspace from "../components/DashboardPreviewWorkspace";
import { dashboardPreviewData } from "../components/dashboardPreviewData";
import { apiRequest, authAPI, eventAPI } from "../services/api";
import "./Dashboard.css";
import "./Operations.css";
import "./DashboardReimagined.css";

export default function Dashboard({ initialCreateEvent = false, previewMode = false }) {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("Overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [data, setData] = useState(null);
  const [creating, setCreating] = useState(initialCreateEvent);
  const [selected, setSelected] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("");
  const [certificateError, setCertificateError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Certificates are optional for the overview. If their endpoint is unavailable,
  // keep the event workspace visible instead of failing the entire dashboard.
  const load = useCallback(async () => {
    if (previewMode) {
      setData(dashboardPreviewData);
      setCertificateError("");
      return;
    }
    const [user, events, venues, committees, summary, certificateResult] =
      await Promise.all([
        authAPI.me(),
        eventAPI.list(),
        apiRequest("/api/v1/venues"),
        apiRequest("/api/v1/committees"),
        apiRequest("/api/v1/dashboard"),
        apiRequest("/api/v1/certificates")
          .then((items) => ({ items, error: "" }))
          .catch((error) => ({ items: [], error: error.message })),
      ]);
    setCertificateError(certificateResult.error);
    setData({
      user,
      events,
      venues,
      committees,
      summary,
      certificates: certificateResult.items,
    });
  }, [previewMode]);
  // load updates state only after API promises resolve.
  useEffect(() => {
    // The loader updates state after its API promises resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((e) => setMessage(e.message));
  }, [load]);
  const refresh = async () => {
    setMessage("");
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setRefreshing(false);
    }
  };
  function openCreateEvent() {
    if (previewMode) return;
    if (!data) {
      setMessage(
        "Workspace data is not ready. Please retry loading your workspace before creating an event.",
      );
      return;
    }
    setMessage("");
    setNotice("");
    setCreating(true);
  }
  async function downloadCertificate(id) {
    try {
      const blob = await apiRequest(`/api/v1/certificates/${id}/download`, {
        blob: true,
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estrade-${id}.pdf`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setMessage(error.message);
    }
  }
  const events = data?.events || [];
  const filtered = events.filter(
    (e) => (!committeeFilter || e.committee_id === committeeFilter) &&
      (!["Registrations", "QR Attendance", "Participation Approval", "Certificate Studio", "Coordinators", "Media"].includes(activePage) || data?.committees.some(c => c.id === e.committee_id && c.can_manage)),
  );
  const selectedEvent = filtered.find((e) => e.id === selected) || filtered[0];
  const rows = filtered
    .filter(
      (e) =>
        activePage !== "Overview" ||
        (e.status === "confirmed" && new Date(e.ends_at) > new Date()),
    )
    .map((e) => ({
      ...e,
      day: new Date(e.starts_at).getDate(),
      month: new Date(e.starts_at).toLocaleString(undefined, {
        month: "short",
      }),
      name: e.title,
      time: new Date(e.starts_at).toLocaleString(),
      venue:
        data?.venues.find((v) => v.id === e.venue_id)?.name ||
        "Venue unavailable",
      coordinators: data?.summary.event_metrics[e.id]?.coordinators ?? "—",
      status:
        e.status === "confirmed"
          ? new Date(e.ends_at) < new Date()
            ? "Completed"
            : new Date(e.starts_at) <= new Date()
              ? "Ongoing"
              : "Upcoming"
          : e.status,
      color: e.status === "confirmed" ? "green" : "blue",
    }));
  const canCreate = !previewMode && data?.committees.some((c) => c.can_manage);
  const featured = [...rows]
    .filter((e) => e.status === "Upcoming" || e.status === "Ongoing")
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];
  return (
    <div className="estrade-dashboard">
      <Sidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          setNotice("");
        }}
        role={data?.user.user_type}
        previewMode={previewMode}
        canManage={canCreate || previewMode}
      />
      <div className="dashboard-main">
        <Topbar
          canCreate={canCreate}
          onSearchChange={setSearchQuery}
          onCreateEvent={openCreateEvent}
          user={data?.user}
          pending={data?.summary.pending_withdrawals}
        />
        <main className="dashboard-content">
          {previewMode && <div className="estrade-preview-banner" role="status"><strong>DESIGN PREVIEW</strong><span>Illustrative sample data · Database connection not required · All write actions disabled</span></div>}
          <div className="command-heading estrade-command-heading">
            <div>
              <span className="eyebrow">
                ESTRADE / {data?.user.user_type?.toUpperCase() || "CAMPUS"} WORKSPACE / {activePage.toUpperCase()}
              </span>
              <h1>
                {activePage === "Overview" ? (
                  <>Your campus, <em>in motion.</em></>
                ) : (
                  <>{activePage}<em>.</em></>
                )}
              </h1>
              <p>
                {data
                  ? `${data.user.full_name} · ${activePage === "Overview" ? "Your event command center" : "Manage your campus events"}`
                  : "Opening your event command center"}
              </p>
            </div>
            <div className="estrade-heading-actions">
              {data && <span className="estrade-live-indicator"><i /> Connected workspace</span>}
              <button
                type="button"
                className="estrade-refresh-button"
                onClick={refresh}
                disabled={refreshing}
                aria-label="Refresh dashboard information"
              >
                {refreshing ? "Refreshing…" : "↻ Refresh"}
              </button>
            </div>
          </div>
          {notice && (
            <div role="status" className="operations-message">
              {notice}
              <button onClick={() => setNotice("")}>Dismiss</button>
            </div>
          )}
          {message && (
            <div role="alert" className="operations-message">
              {message}
              <button onClick={refresh}>Retry</button>
            </div>
          )}
          {!data && !message && (
            <div className="workspace-skeleton" role="status">
              <span>Loading your workspace…</span>
              <i />
              <i />
              <i />
            </div>
          )}
          {data && (
            <>
              {activePage === "Overview" && (
                <>
                  <div className="estrade-overview-intro">
                    <div>
                      <span className="eyebrow">TODAY AT A GLANCE</span>
                      <h2>Everything your event needs, in one place.</h2>
                    </div>
                    <div className="estrade-quick-actions">
                      <button type="button" onClick={() => setActivePage("Events")}>Explore events →</button>
                      {canCreate && (
                        <button type="button" className="is-primary" onClick={openCreateEvent}>
                          + Create event
                        </button>
                      )}
                    </div>
                  </div>
                  <DashboardStats summary={data.summary} />
                  <WithdrawalAlert
                    count={data.summary.pending_withdrawals}
                    onReview={() => setActivePage("Coordinators")}
                  />
                </>
              )}
              {activePage === "Coordinators" && data.summary.pending_withdrawals > 0 && (
                <WithdrawalAlert
                  count={data.summary.pending_withdrawals}
                  onReview={() => setNotice("Choose an event below to review its coordinator operations.")}
                />
              )}
              {activePage === "Overview" && (
                <section className="command-feature">
                  {featured ? (
                    <>
                      <div>
                        <span className="eyebrow">
                          NEXT ON YOUR STAGE · {featured.status}
                        </span>
                        <h2>{featured.title}</h2>
                        <p>
                          {featured.time} · {featured.venue}
                        </p>
                        <p>
                          {
                            data.committees.find(
                              (c) => c.id === featured.committee_id,
                            )?.name
                          }{" "}
                          ·{" "}
                          {featured.is_published
                            ? "Published"
                            : "Committee only"}
                        </p>
                        <button
                          className="button primary"
                          onClick={() => {
                            setActivePage("Events");
                            setSelected(featured.id);
                          }}
                        >
                          Open event workspace →
                        </button>
                      </div>
                      <div className="command-date">
                        <strong>{featured.day}</strong>
                        {featured.month}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="eyebrow">
                          EVERY GREAT EVENT STARTS SOMEWHERE
                        </span>
                        <h2>The stage is ready.</h2>
                        <p>
                          No upcoming confirmed events are visible to your
                          account yet.
                        </p>
                        <button
                          className="button primary"
                          onClick={
                            canCreate
                              ? openCreateEvent
                              : () => setActivePage("Events")
                          }
                        >
                          {canCreate
                            ? "Create your first event"
                            : "Discover available events"}{" "}
                          →
                        </button>
                        <p className="empty-orientation">
                          Discover events · Coordinate people · Preserve
                          participation
                        </p>
                      </div>
                      <div className="empty-stage" aria-hidden="true">
                        <span>e.</span>
                      </div>
                    </>
                  )}
                </section>
              )}
              {["Overview", "Events"].includes(activePage) && (
                <div className="dashboard-overview-grid">
                  <UpcomingEvents
                    events={rows}
                    title={
                      activePage === "Overview"
                        ? "Upcoming & Ongoing Events"
                        : "All Events"
                    }
                    searchQuery={searchQuery}
                    onViewEvent={(event) => {
                      setActivePage("Events");
                      if (event) setSelected(event.id);
                    }}
                  />
                  <EventReadiness events={events} summary={data.summary} />
                </div>
              )}
              {activePage === "My Registrations" && !previewMode && <MyRegistrations/>}
              {activePage === "My Assignments" && !previewMode && <MyAssignments/>}
              {activePage === "Committees" && !previewMode && <CommitteeWorkspace committees={data.committees} user={data.user} onChanged={refresh}/>}
              {activePage === "Committees" && previewMode && (
                <section className="estrade-committee-section">
                  <div className="section-title-row"><div><span className="eyebrow">CAMPUS ORGANIZATION</span><h2>Committee directory</h2></div></div>
                  {data.committees.length === 0 ? <p>No committees are visible to your account yet.</p> : (
                    <div className="estrade-committee-grid">{data.committees.map((committee) => (
                      <article className="estrade-committee-card" key={committee.id}>
                        <span className="estrade-committee-monogram" aria-hidden="true">{committee.name?.charAt(0) || "C"}</span>
                        <div><h3>{committee.name}</h3><p>{committee.role ? `${committee.role} · ${committee.membership_status || "membership"}` : "Committee"}</p></div>
                        <span className={`estrade-pill ${committee.can_manage ? "can-manage" : ""}`}>{committee.can_manage ? "Can manage" : "View only"}</span>
                      </article>
                    ))}</div>
                  )}
                </section>
              )}
              {activePage === "Certificates" && (
                <section className="operations-panel">
                  <div className="estrade-section-kicker">CERTIFICATE STUDIO</div>
                  <h2>My certificates</h2>
                  {previewMode && <p className="estrade-preview-inline">Sample preview only. Certificate downloads and issuance require a connected account.</p>}
                  {certificateError ? (
                    <div role="alert" className="operations-message">
                      Certificates could not be loaded: {certificateError}
                      <button type="button" onClick={refresh}>Retry</button>
                    </div>
                  ) : data.certificates.length === 0 ? (
                    <p>No certificates issued to your account yet.</p>
                  ) : null}
                  {data.certificates.map((c) => (
                    <div className="operations-row" key={c.id}>
                      {c.event_title} ·{" "}
                      {new Date(c.event_date).toLocaleDateString()} · Email: {c.delivery_status || "Unknown"}
                      {c.verification_code && <a href={`/verify-certificate/${c.verification_code}`} target="_blank" rel="noreferrer">Public verification</a>}
                      <Button variant="info" onClick={() => downloadCertificate(c.id)}>
                        Download my certificate
                      </Button>
                    </div>
                  ))}
                </section>
              )}
              {!["Overview", "Settings", "Certificates", "Committees", "My Registrations", "My Assignments"].includes(activePage) && (
                <>
                  <section className="operations-panel">
                    <h2>{activePage}</h2>
                    <label>
                      Committee
                      <select
                        className="operations-select"
                        value={committeeFilter}
                        onChange={(e) => {
                          setCommitteeFilter(e.target.value);
                          setSelected("");
                        }}
                      >
                        <option value="">All committees</option>
                        {data.committees.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.role
                              ? ` · ${c.role} (${c.membership_status})`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Event
                      <select
                        className="operations-select"
                        value={selectedEvent?.id || ""}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {filtered.length === 0 && (
                          <option value="">No visible events</option>
                        )}
                        {filtered.map((e) => (
                          <option value={e.id} key={e.id}>
                            {e.title} · {e.status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </section>
                  {selectedEvent && (previewMode ? (
                    <DashboardPreviewWorkspace
                      key={`${selectedEvent.id}-${activePage}`}
                      event={selectedEvent}
                      committee={data.committees.find((c) => c.id === selectedEvent.committee_id)}
                      venue={data.venues.find((v) => v.id === selectedEvent.venue_id)}
                      section={activePage}
                    />
                  ) : (
                    <EventWorkspace
                      key={`${selectedEvent.id}-${activePage}`}
                      event={selectedEvent}
                      committee={data.committees.find((c) => c.id === selectedEvent.committee_id)}
                      venue={data.venues.find((v) => v.id === selectedEvent.venue_id)}
                      user={data.user}
                      section={activePage}
                      onChanged={refresh}
                    />
                  ))}
                </>
              )}
              {activePage === "Settings" && (
                <section className="operations-panel">
                  <h2>{previewMode ? "Preview settings" : "Your account"}</h2>
                  <p>{data.user.full_name} · {data.user.email} · {data.user.user_type}</p>
                  {previewMode ? <p>Design preview is isolated from the database. Sign in to use the real workspace.</p> : <>
                    <p>For security, re-authentication is required after a full page reload.</p>
                    <button onClick={() => { authAPI.setToken(null); navigate("/login"); }}>Sign out</button>
                  </>}
                </section>
              )}
            </>
          )}
        </main>
      </div>
      {creating && data && !previewMode && (
        <EventForm
          committees={data.committees}
          venues={data.venues}
          user={data.user}
          onClose={(notice) => {
            setCreating(false);
            if (notice) setNotice(notice);
            if (initialCreateEvent) navigate("/dashboard", { replace: true });
          }}
          onCreated={(event) => {
            if (initialCreateEvent) navigate("/dashboard", { replace: true });
            setNotice(`Event “${event.title}” created successfully.`);
            setCreating(false);
            setCommitteeFilter(event.committee_id);
            setSelected(event.id);
            setActivePage("Events");
            load().catch((e) =>
              setMessage(
                `Event saved, but the dashboard could not refresh: ${e.message}`,
              ),
            );
          }}
        />
      )}
    </div>
  );
}
