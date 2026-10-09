export default function EventReadiness({ events = [], summary = {} }) {
  const event = events.find(e => e.status === "confirmed" && new Date(e.ends_at) > new Date());
  const staffed = event && (summary.event_metrics?.[event.id]?.coordinators || 0) > 0;
  const checks = event ? [{title: "Venue and schedule confirmed", completed: true}, {title: "Coordinator assigned", completed: staffed}] : [];
  const score = checks.length ? Math.round(checks.filter(c => c.completed).length / checks.length * 100) : 0;
  return <section className="event-readiness"><h2>Event Readiness</h2><h4>{event?.title || "No upcoming confirmed event"}</h4>
    <div className="readiness-score"><strong>{score}%</strong><span>Scheduling and staffing checks</span></div>
    <div className="progress-track"><div className="progress-fill" style={{width: `${score}%`}} /></div>
    <p className="progress-caption">Based on recorded scheduling and staffing only.</p>
    <div className="readiness-checklist">{checks.map(c => <div className={`checklist-item ${c.completed ? "completed" : ""}`} key={c.title}>{c.completed ? "✓" : "○"} {c.title}</div>)}</div>
  </section>;
}
