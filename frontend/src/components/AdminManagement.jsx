import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function AdminManagement({ venues, committees, onChanged }) {
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [selected, setSelected] = useState("");
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [rosterError, setRosterError] = useState("");
  const [rosterVersion, setRosterVersion] = useState(0);

  useEffect(() => {
    if (!selected) return;
    let current = true;
    apiRequest(`/api/v1/committees/${selected}/members`)
      .then((rows) => { if (current) { setMembers(rows); setRosterError(""); } })
      .catch((err) => { if (current) setRosterError(err.message); });
    return () => { current = false; };
  }, [selected, rosterVersion]);

  async function run(action, success) {
    setFeedback("");
    setBusy(true);
    try {
      await action();
      await onChanged();
      setRosterVersion((value) => value + 1);
      setFeedback(success);
      return true;
    } catch (error) {
      setFeedback(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function addVenue(event) {
    event.preventDefault();
    const saved = await run(
      () => apiRequest("/api/v1/venues", {
        method: "POST", body: JSON.stringify({ name, capacity: Number(capacity) }),
      }),
      `Venue “${name.trim()}” created successfully.`,
    );
    if (saved) { setName(""); setCapacity(""); }
  }

  async function toggleCommittee(committee) {
    const restoring = !committee.is_active;
    if (!restoring && !window.confirm(`Archive “${committee.name}”? Existing events and certificates will remain available, but new event creation will be blocked.`)) return;
    await run(
      () => apiRequest(`/api/v1/committees/${committee.id}${restoring ? "/restore" : ""}`, {
        method: restoring ? "POST" : "DELETE",
      }),
      restoring ? "Committee restored." : "Committee archived; its event history was retained.",
    );
  }

  async function removeMember(member) {
    const committee = committees.find((item) => item.id === selected);
    if (!window.confirm(`Remove ${member.full_name} from ${committee?.name || "this committee"}? This will not delete their Estrade account or event history.`)) return;
    await run(
      () => apiRequest(`/api/v1/committees/${selected}/members/${member.id}`, { method: "DELETE" }),
      `${member.full_name} was removed from the committee.`,
    );
  }

  return <section className="operations-panel estrade-admin-management">
    <span className="eyebrow">ADMINISTRATION</span>
    <h2>Campus administration</h2>
    <p>Only administrator accounts can change venue and committee records.</p>
    {feedback && <p role="status" className="operations-message">{feedback}</p>}
    <div className="estrade-admin-grid">
      <div>
        <h3>Add a venue</h3>
        <form className="operations-form" onSubmit={addVenue}>
          <label>Venue name<input required minLength={2} maxLength={150} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Seminar Hall B" /></label>
          <label>Seating capacity<input required type="number" min={1} max={100000} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></label>
          <button disabled={busy} type="submit">{busy ? "Saving…" : "+ Add venue"}</button>
        </form>
        <h3>Active venues</h3>
        {venues.length ? venues.map((venue) => <p className="operations-row" key={venue.id}>{venue.name} · Capacity {venue.capacity}</p>) : <p>No active venues.</p>}
      </div>
      <div>
        <h3>Committee management</h3>
        {committees.map((committee) => <div className="operations-row" key={committee.id}>
          <strong>{committee.name}</strong> · {committee.is_active ? "Active" : "Archived"}
          <div><button type="button" disabled={busy} onClick={() => toggleCommittee(committee)}>{committee.is_active ? "Archive committee" : "Restore committee"}</button>
          <button type="button" disabled={busy} onClick={() => setSelected(committee.id)}>Manage members</button></div>
        </div>)}
        {!committees.length && <p>No committees available.</p>}
        {selected && <div className="estrade-admin-roster">
          <h3>Members · {committees.find((c) => c.id === selected)?.name}</h3>
          {rosterError && <p role="alert">{rosterError}</p>}
          {!rosterError && !members.length && <p>No members in this committee.</p>}
          {members.map((member) => <div key={member.id} className="operations-row">
            <strong>{member.full_name}</strong> · {member.role} · {member.verification_status}
            <button type="button" disabled={busy} onClick={() => removeMember(member)}>Remove member</button>
          </div>)}
        </div>}
      </div>
    </div>
  </section>;
}
