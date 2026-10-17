import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Button from './Button';
export default function CommitteeWorkspace({ committees, user, onChanged }) {
  const [requests, setRequests] = useState({}), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { let cancelled = false; Promise.all(committees.filter(c => c.can_manage).map(async c => [c.id, await apiRequest(`/api/v1/committees/${c.id}/applications`)])).then(rows => { if (!cancelled) setRequests(Object.fromEntries(rows)); }).catch(e => setMessage(e.message)); return () => {cancelled = true;}; }, [committees]);
  async function act(path, body, method = 'POST') {
    setBusy(true); setMessage('');
    try {await apiRequest(path, {method, body:JSON.stringify(body)}); await onChanged(); setMessage('Request saved. Membership approval does not grant organizer permissions.');} catch(e) {setMessage(e.message);} finally {setBusy(false);}
  }
  return <section className="operations-panel"><h2>My committees and coordinator applications</h2>{message && <p role="status">{message}</p>}{committees.length === 0 && <p>No committees available.</p>}
    {committees.map(c => <article className="operations-row" key={c.id}><h3>{c.name}</h3><p>{c.description}</p><p>{c.role || 'Not a member'} · {c.membership_status || 'No application'}</p>
      {user.user_type === 'student' && !c.membership_status && <form className="operations-form" onSubmit={e => {e.preventDefault(); act(`/api/v1/committees/${c.id}/applications`, {reason:new FormData(e.currentTarget).get('reason')});}}><label>Why would you like to coordinate? (optional)<textarea name="reason" maxLength={2000}/></label><Button type="submit" busy={busy}>Request coordinator membership</Button></form>}
      {c.can_manage && <><h4>Application inbox</h4>{requests[c.id]?.length === 0 && <p>No applications.</p>}{requests[c.id]?.map(r => <div className="operations-row" key={r.id}><strong>{r.full_name}</strong><p>{c.name} · {r.role} · {r.status} · {new Date(r.requested_at).toLocaleString()}</p><p>{r.reason || 'No reason provided'}</p>{r.status === 'pending' && <><Button variant="positive" busy={busy} onClick={() => act(`/api/v1/committee-applications/${r.id}`, {status:'approved'}, 'PATCH')}>Approve request</Button><Button variant="danger" busy={busy} onClick={() => act(`/api/v1/committee-applications/${r.id}`, {status:'rejected'}, 'PATCH')}>Reject request</Button></>}</div>)}</>}
    </article>)}
  </section>;
}
export function MyAssignments() {
  const [rows, setRows] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {apiRequest('/api/v1/me/assignments').then(setRows).catch(e => setMessage(e.message));}, []);
  return <section className="operations-panel"><h2>My assignments</h2>{message && <p role="status">{message}</p>}{rows.length === 0 && <p>No duties assigned. Approved membership makes you eligible for an organizer to assign a duty.</p>}{rows.map(r => <article className="operations-row" key={r.id}><h3>{r.event_title}</h3><p>{r.duty} · {r.status} · Assigned by {r.assigned_by}</p><p>{new Date(r.starts_at).toLocaleString()} — {new Date(r.ends_at).toLocaleString()}</p>{r.withdrawals.map(w => <p key={w.id}>Withdrawal: {w.status} · {w.reason}</p>)}{r.status === 'active' && !r.withdrawals.some(w => w.status === 'pending') && <form className="operations-form" onSubmit={async e => {e.preventDefault(); const reason = new FormData(e.currentTarget).get('reason'); setBusy(true); try {await apiRequest(`/api/v1/assignments/${r.id}/withdrawals`, {method:'POST', body:JSON.stringify({reason})}); setRows(await apiRequest('/api/v1/me/assignments')); setMessage('Withdrawal requested. Your assignment stays active until approved.');} catch(e) {setMessage(e.message);} finally {setBusy(false);}}}><label>Withdrawal reason<input name="reason" minLength={3} maxLength={2000} required/></label><Button type="submit" variant="warning" busy={busy}>Request withdrawal</Button></form>}</article>)}</section>;
}
