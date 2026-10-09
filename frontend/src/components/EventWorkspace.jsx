import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api";
export default function EventWorkspace({ event, committee, venue, user, section, onChanged }) {
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [media, setMedia] = useState([]);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState([]);
  const manage = committee?.can_manage;
  const load = useCallback(async () => {
    const [staff, participation] = await Promise.all([
      apiRequest(`/api/v1/events/${event.id}/assignments`), apiRequest(`/api/v1/events/${event.id}/participations`)]);
    setAssignments(staff); setParticipants(participation);
    if (manage) {
      const [roster, slots, history] = await Promise.all([
        apiRequest(`/api/v1/committees/${event.committee_id}/members`),
        apiRequest(`/api/v1/committees/${event.committee_id}/availability`),
        apiRequest(`/api/v1/events/${event.id}/media`)]);
      setMembers(roster); setAvailability(slots); setMedia(history);
    }
  }, [event.id, event.committee_id, manage]);
  // load updates state only after API promises resolve.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(e => setMessage(e.message)); }, [load]);
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews]);
  async function action(path, body, method = "POST") {
    setBusy(true); setMessage("");
    try {
      const data = await apiRequest(path, {method, ...(body ? {body: JSON.stringify(body)} : {})});
      await load(); await onChanged(); setMessage("Saved successfully."); return data;
    } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function download(id) {
    try {
      const blob = await apiRequest(`/api/v1/certificates/${id}/download`, {blob: true});
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url;
      link.download = `estrade-${id}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setMessage(error.message); }
  }
  async function analyze(e) {
    e.preventDefault(); setBusy(true); setMessage(""); setResult(null);
    const form = new FormData(e.currentTarget); const files = form.getAll("files");
    if (files.length > 12 || files.some(f => f.size > 8 * 1024 * 1024) || files.reduce((s,f) => s+f.size,0) > 32 * 1024 * 1024) {
      setMessage("Limits: 12 images, 8 MiB each, 32 MiB total."); setBusy(false); return;
    }
    setPreviews(files.map(file => URL.createObjectURL(file)));
    try { setResult(await apiRequest(`/api/v1/events/${event.id}/media/analyze`, {method: "POST", body: form})); await load(); await onChanged(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  const showStaff = ["Overview", "Events", "Coordinators", "Tasks"].includes(section);
  const showCertificates = ["Events", "Certificates"].includes(section);
  return <section className="operations-panel">
    <h2>{event.title}</h2><p>{committee?.name} · {venue?.name} · {event.status} · {event.is_published ? "Published" : "Committee only"}</p>
    <p>{new Date(event.starts_at).toLocaleString()} — {new Date(event.ends_at).toLocaleString()}</p>
    <p>{event.description}</p><p>Capacity: {event.max_participants ?? "Not specified"}</p>
    {message && <p role="status" className="operations-message">{message}</p>}
    {manage && section === "Events" && <div>
      <button disabled={busy || event.status !== "confirmed"} onClick={() => action(`/api/v1/events/${event.id}/publication`, {is_published: !event.is_published}, "PATCH")}>{event.is_published ? "Make private" : "Publish event"}</button>
      <button disabled={busy || event.status === "cancelled"} onClick={() => action(`/api/v1/events/${event.id}/cancel`)}>Cancel event</button>
    </div>}
    {showStaff && <><h3>Coordinators and withdrawal history</h3>
      {assignments.length === 0 && <p>No visible assignments.</p>}
      {assignments.map(a => <div className="operations-row" key={a.id}><strong>{a.full_name}</strong> · {a.duty} · {a.status}
        {a.user_id === user.id && a.status === "active" && !a.withdrawals.some(w => w.status === "pending") && <form className="operations-form" onSubmit={e => {e.preventDefault(); action(`/api/v1/assignments/${a.id}/withdrawals`, {reason: new FormData(e.currentTarget).get("reason")});}}>
          <label>Withdrawal reason<input name="reason" minLength={3} maxLength={2000} required /></label><button disabled={busy}>Request withdrawal</button></form>}
        {a.withdrawals.map(w => <p key={w.id}>{w.reason} — {w.status} {manage && w.status === "pending" && <>
          <button disabled={busy} onClick={() => action(`/api/v1/withdrawals/${w.id}`, {status: "approved"}, "PATCH")}>Approve</button>
          <button disabled={busy} onClick={() => action(`/api/v1/withdrawals/${w.id}`, {status: "rejected"}, "PATCH")}>Reject</button></>}</p>)}
      </div>)}
      {manage && <><h3>Committee members</h3>{members.map(m => <p key={m.id}>{m.full_name} · {m.role} · {m.verification_status}</p>)}<h3>Assign coordinator / replacement</h3><form className="operations-form" onSubmit={e => {e.preventDefault(); action(`/api/v1/events/${event.id}/assignments`, Object.fromEntries(new FormData(e.currentTarget)));}}>
        <label>Approved member<select name="user_id" required defaultValue=""><option value="" disabled>Select member</option>{members.filter(m => m.verification_status === "approved").map(m => <option key={m.id} value={m.id}>{m.full_name} · {m.role}</option>)}</select></label>
        <label>Duty<input name="duty" minLength={2} maxLength={150} required /></label><button disabled={busy || event.status === "cancelled"}>Assign</button>
      </form><h3>Committee availability</h3>{availability.length === 0 && <p>No active assignments.</p>}{availability.map((a, i) => <p key={i}>{members.find(m => m.id === a.user_id)?.full_name || "Member"} · {a.event_title} · {new Date(a.starts_at).toLocaleString()} — {new Date(a.ends_at).toLocaleString()}</p>)}</>}
    </>}
    {section === "Media" && <><h3>AI Media Manager</h3><p>OpenCV sharpness and perceptual hash analysis. Recommendations require human review.</p>
      {manage ? <form className="operations-form" onSubmit={analyze}><label>Event images (up to 12)<input name="files" type="file" accept="image/jpeg,image/png,image/webp" multiple required /></label>
        <p>8 MiB per file, 32 MiB per batch, 12 megapixels per image.</p><button disabled={busy}>{busy ? "Analyzing…" : "Analyze images"}</button></form> : <p>Only an authorized organizer can upload event media.</p>}
      {result && <><p>{result.notice}</p><p>Accepted: {result.summary.accepted} · Review: {result.summary.review} · Rejected: {result.summary.rejected}</p>
        {result.images.map((r,i) => <div className="operations-row operations-result" key={i}><img src={previews[r.upload_index]} alt={`Preview ${i+1}`} /><div><strong>{r.filename}: {r.classification}</strong><p>Sharpness {r.blur_score} · Quality {r.quality_score}/100</p><p>{r.reasons.join(", ") || "Good sharpness"}</p></div></div>)}</>}
      <h3>Analysis history</h3>{media.map(m => <p key={m.id}>{new Date(m.created_at).toLocaleString()} · {m.result.summary.total_images} images · {m.result.summary.accepted} accepted, {m.result.summary.review} review, {m.result.summary.rejected} rejected</p>)}
    </>}
    {showCertificates && <><h3>Verified participation and certificates</h3>
      {manage && <form className="operations-form" onSubmit={e => {e.preventDefault(); action(`/api/v1/events/${event.id}/participations`, Object.fromEntries(new FormData(e.currentTarget)));}}>
        <p>After the event ends, confirm participation using attendance or result evidence.</p>
        <label>Participant account email<input name="email" type="email" required /></label><label>Verification evidence<textarea name="evidence" minLength={5} maxLength={2000} required /></label><button disabled={busy}>Confirm participation</button>
      </form>}
      {participants.length === 0 && <p>No verified participation records available.</p>}
      {participants.map(p => <div className="operations-row" key={p.id}>{p.full_name} · Verified
        {p.certificate_id ? <button onClick={() => download(p.certificate_id)}>Download certificate</button> : manage && <button disabled={busy} onClick={() => action(`/api/v1/participations/${p.id}/certificates`)}>Issue certificate</button>}
      </div>)}
    </>}
  </section>;
}
