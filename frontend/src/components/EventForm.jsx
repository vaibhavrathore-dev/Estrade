import { useEffect, useRef, useState } from "react";
import { eventAPI } from "../services/api";

export default function EventForm({ committees, venues, user, onClose, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(null);
  const dialog = useRef(null);
  const errorMessage = useRef(null);
  const eligible = committees.filter(c => c.can_manage);
  const ready = eligible.length > 0 && venues.length > 0;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (dialog.current?.querySelector("input") || dialog.current?.querySelector("button"))?.focus();
    return () => {
      request.current?.abort();
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, []);
  useEffect(() => { errorMessage.current?.focus(); }, [error]);

  function close() {
    const pending = request.current !== null;
    request.current?.abort();
    onClose(pending ? "Request cancelled locally. Check Events before submitting again; the server may have saved the event." : "");
  }
  function keyboard(e) {
    if (e.key === "Escape") { e.preventDefault(); close(); }
    if (e.key !== "Tab") return;
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
    const first = controls[0], last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
  async function submit(e) {
    e.preventDefault();
    if (request.current || !ready) return;
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const start = new Date(values.starts_at), end = new Date(values.ends_at);
    const capacity = values.max_participants ? Number(values.max_participants) : null;
    const venue = venues.find(v => v.id === values.venue_id);
    if (!eligible.some(c => c.id === values.committee_id) || !venue) {
      setError("Choose an eligible committee and an active venue."); return;
    }
    if (values.title.trim().length < 3 || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      setError("Enter a title of at least 3 characters and an end time after the start time."); return;
    }
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1 || capacity > venue.capacity)) {
      setError(`Participant capacity must be a whole number between 1 and ${venue.capacity} for this venue.`); return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError("");
    try {
      const event = await eventAPI.create({...values, title: values.title.trim(), starts_at: start.toISOString(), ends_at: end.toISOString(), max_participants: capacity}, {signal: controller.signal});
      if (!controller.signal.aborted) onCreated(event);
    } catch (err) {
      if (!controller.signal.aborted) setError(err.message);
    } finally {
      request.current = null;
      setBusy(false);
    }
  }
  return <div className="operations-overlay"><section ref={dialog} className="operations-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title" onKeyDown={keyboard}>
    <div className="section-title-row operations-dialog-header"><h2 id="create-title">Create Event</h2><button type="button" onClick={close}>Close</button></div>
    {!eligible.length && <p role="status">{user?.user_type === "admin"
      ? "No eligible committees are available. Set up a committee before creating an event."
      : "Event creation requires an administrator or an approved committee head/executive. You have no eligible committees. Ask your committee administrator to approve the appropriate organizer membership. You can continue using your dashboard."}</p>}
    {eligible.length > 0 && !venues.length && <p role="status">No active venues are available. Ask an administrator to add or activate a venue before creating an event.</p>}
    {ready && <form className="operations-form" onSubmit={submit} aria-busy={busy}>
      {error && <p ref={errorMessage} tabIndex={-1} className="operations-message" role="alert">{error}</p>}
      {busy && <p role="status">Creating event… You can close this form to cancel waiting.</p>}
      <fieldset disabled={busy}>
        <label>Event name<input name="title" required minLength={3} maxLength={200} /></label>
        <label>Description<textarea name="description" /></label>
        <label>Committee<select name="committee_id" required defaultValue=""><option value="" disabled>Choose committee</option>{eligible.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Venue<select name="venue_id" required defaultValue=""><option value="" disabled>Choose venue</option>{venues.map(v => <option key={v.id} value={v.id}>{v.name} · capacity {v.capacity}</option>)}</select></label>
        <label>Starts (your local time)<input type="datetime-local" name="starts_at" required /></label>
        <label>Ends (your local time)<input type="datetime-local" name="ends_at" required /></label>
        <label>Participant capacity<input type="number" min="1" step="1" name="max_participants" /></label>
        <label>Status<select name="status"><option value="draft">Draft — does not reserve venue</option><option value="confirmed">Confirmed — reserves venue</option></select></label>
      </fieldset>
      <p>New events are private to your committee. Publish a confirmed event from its details.</p>
      <button className="create-event-button" disabled={busy} aria-busy={busy}>{busy ? "Creating…" : "Create Event"}</button>
    </form>}
  </section></div>;
}
