import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { apiRequest } from '../services/api';
import Button from './Button';

export function MyRegistrations() {
  const [rows, setRows] = useState(null), [ticket, setTicket] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { apiRequest('/api/v1/me/registrations').then(setRows).catch(e => setMessage(e.message)); }, []);
  async function showTicket(id) {
    setBusy(true); setMessage('');
    try { setTicket(await apiRequest(`/api/v1/registrations/${id}/check-in-token`)); } catch(e) { setMessage(e.message); } finally { setBusy(false); }
  }
  return <section className="operations-panel"><h2>My registrations and QR tickets</h2><p>Present your QR ticket at the event check-in desk. Attendance is confirmed by an organizer.</p>
    {message && <p role="alert">{message}</p>}{!rows && !message && <p>Loading registrations…</p>}{rows?.length === 0 && <p>No registrations yet. Choose Events to discover and register.</p>}
    {rows?.map(r => <article className="operations-row" key={r.id}><h3>{r.event_title}</h3><p>{new Date(r.starts_at).toLocaleString()} · {r.checked_in ? 'Checked in' : 'Awaiting check-in'} · {r.status}</p><Button variant="info" busy={busy} disabled={r.status !== 'registered'} onClick={() => showTicket(r.id)}>Show QR ticket</Button></article>)}
    {ticket && <div className="ticket-code"><h3>{ticket.event_title}</h3><QRCodeSVG value={ticket.token} size={240} marginSize={4} title={`Check-in ticket for ${ticket.event_title}`} /><p>Keep this ticket private.</p><Button variant="info" onClick={async () => { try { await navigator.clipboard.writeText(ticket.token); setMessage('Ticket copied for manual check-in.'); } catch { setMessage('Clipboard unavailable. Use the QR ticket.'); } }}>Copy ticket for manual check-in</Button><Button onClick={() => setTicket(null)}>Close ticket</Button></div>}
  </section>;
}

export default function RegistrationWorkspace({ event, user, manage, section, onChanged }) {
  const [fields, setFields] = useState([]), [rows, setRows] = useState([]), [participants, setParticipants] = useState([]), [message, setMessage] = useState(''), [busy, setBusy] = useState(false), [token, setToken] = useState(''), [deliveries, setDeliveries] = useState({});
  const video = useRef(null), scanner = useRef(null), scanning = useRef(false);
  const load = useCallback(async () => {
    setFields(await apiRequest(`/api/v1/events/${event.id}/registration-fields`));
    if (manage) {
      const [r, p] = await Promise.all([apiRequest(`/api/v1/events/${event.id}/registrations`), apiRequest(`/api/v1/events/${event.id}/participations`)]);
      setRows(r); setParticipants(p);
      const d = await Promise.all(p.filter(x => x.certificate_id).map(async x => [x.certificate_id, await apiRequest(`/api/v1/certificates/${x.certificate_id}/delivery`)]));
      setDeliveries(Object.fromEntries(d));
    }
  }, [event.id, manage]);
  // Loader only updates state after network responses resolve.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load().catch(e => setMessage(e.message)); return () => { scanning.current = false; scanner.current?.stop(); }; }, [load]);
  async function act(path, body) {
    if (busy) return;
    setBusy(true); setMessage('');
    try { const result = await apiRequest(path, {method:'POST', ...(body ? {body:JSON.stringify(body)} : {})}); await load(); await onChanged(); setMessage(result.delivery_status ? `Certificate created. Email delivery: ${result.delivery_status}. PDF remains available.` : result.participant ? `Checked in: ${result.participant} · ${result.event}` : 'Saved successfully.'); return result; }
    catch(e) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function startCamera() {
    try {
      scanning.current = true;
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(undefined, video.current, (result, _error, controls) => {
        if (result && scanning.current) { scanning.current = false; controls.stop(); setToken(result.getText()); setMessage('QR captured. Select Record attendance to validate it with the server.'); }
      });
      scanner.current = controls;
      if (!scanning.current) controls.stop();
    } catch { scanning.current = false; setMessage('Camera unavailable or permission denied. Paste a ticket below for manual check-in.'); }
  }
  const ended = event.status === 'confirmed' && new Date(event.ends_at) <= new Date();
  return <section className="operations-panel"><h3>{manage ? 'Registration → QR attendance → Participation → Certificate' : 'Register for this event'}</h3>
    {message && <p role="status" className="operations-message">{message}</p>}
    {!manage && user.user_type === 'student' && <form className="operations-form" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); const answers = fields.filter(f => (data.has(f.id) && data.get(f.id) !== '') || f.field_type === 'boolean').map(f => ({field_id:f.id, value:f.field_type === 'multiselect' ? data.getAll(f.id).filter(Boolean) : f.field_type === 'boolean' ? data.has(f.id) : f.field_type === 'number' ? Number(data.get(f.id)) : data.get(f.id)})); act(`/api/v1/events/${event.id}/registrations`, {certificate_name:data.get('certificate_name'), answers}); }}>
      <label>Name on certificate<input name="certificate_name" defaultValue={user.full_name} required minLength={2} maxLength={150}/></label>
      {fields.map(f => <label key={f.id}>{f.label}{f.required ? ' *' : ''}{['select','multiselect'].includes(f.field_type) ? <select aria-label={`${f.label}${f.required ? " *" : ""}`} name={f.id} multiple={f.field_type === 'multiselect'} required={f.required}><option value="">Choose…</option>{f.options.map(o => <option key={o}>{o}</option>)}</select> : <input name={f.id} type={({boolean:'checkbox',phone:'tel'})[f.field_type] || f.field_type} required={f.required && f.field_type !== 'boolean'} step={f.field_type === 'number' ? 'any' : undefined}/>}</label>)}
      <Button type="submit" busy={busy} disabled={!event.is_published || event.status !== 'confirmed' || new Date(event.ends_at) <= new Date()}>Register for event</Button><p>Registration requires a published, confirmed event that has not ended. Your ticket will appear in My Registrations.</p>
    </form>}
    {manage && section === 'Registrations' && <details><summary>Configure registration questions</summary><p>Add questions before opening registration. Existing participants are not asked again.</p><form className="operations-form" onSubmit={e => {e.preventDefault(); const data = new FormData(e.currentTarget); act(`/api/v1/events/${event.id}/registration-fields`, {label:data.get('label'), field_type:data.get('field_type'), required:data.has('required'), options:data.get('options').split('\n').map(x => x.trim()).filter(Boolean), position:fields.length});}}>
      <label>Question label<input name="label" required maxLength={120}/></label><label>Answer type<select name="field_type" aria-label="Answer type">{['text','number','select','multiselect','boolean','url','phone'].map(t => <option key={t}>{t}</option>)}</select></label><label>Choices (one per line for select or multiselect)<textarea name="options"/></label><label><input type="checkbox" name="required"/>Required question</label><Button type="submit" busy={busy}>Add registration question</Button></form><ul>{fields.map(f => <li key={f.id}>{f.label} · {f.field_type} · {f.required ? 'Required' : 'Optional'}</li>)}</ul></details>}
    {manage && <>{["Events", "QR Attendance"].includes(section) && <><h3>Check-in desk · {rows.filter(r => r.checked_in).length} / {rows.length} checked in</h3><video ref={video} muted playsInline/><Button variant="info" onClick={startCamera}>Scan with camera</Button><Button variant="warning" onClick={() => { scanning.current = false; scanner.current?.stop(); }}>Stop camera</Button>
      <form className="operations-form" onSubmit={e => {e.preventDefault(); act('/api/v1/check-in', {token, event_id:event.id});}}><label>Manual check-in token<textarea value={token} onChange={e => setToken(e.target.value)} required minLength={20}/></label><Button type="submit" variant="positive" busy={busy}>Record attendance</Button></form></>}
      <h3>Registrations and participation approval</h3><p>Approve participation after the event ends and QR check-in is complete. Certificate creation and email delivery have separate outcomes.</p>{rows.length === 0 && <p>No registrations yet.</p>}
      {rows.map(r => {const p = participants.find(p => p.user_id === r.user_id); return <article className="operations-row" key={r.id}><strong>{r.full_name}</strong><p>{r.checked_in ? 'Checked in' : 'Awaiting QR check-in'} · {p ? 'Participation approved' : 'Participation not yet approved'}</p>
        {!p && <Button variant="positive" busy={busy} disabled={!ended || !r.checked_in} onClick={() => act(`/api/v1/registrations/${r.id}/participation`)}>Approve participation</Button>}
        {p && !p.certificate_id && <Button busy={busy} disabled={!ended || !r.checked_in} onClick={() => act(`/api/v1/participations/${p.id}/certificates`)}>Issue certificate</Button>}
        {p?.certificate_id && <><p>Certificate issued · Email: {deliveries[p.certificate_id]?.delivery_status || 'Loading'}</p><Button variant="info" onClick={async () => {try {const blob = await apiRequest(`/api/v1/certificates/${p.certificate_id}/download`, {blob:true}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='estrade-certificate.pdf'; a.click(); setTimeout(() => URL.revokeObjectURL(url),1000);} catch(e) {setMessage(e.message);}}}>Download PDF</Button><Button variant="warning" busy={busy} disabled={deliveries[p.certificate_id]?.delivery_status === 'sent'} onClick={() => act(`/api/v1/certificates/${p.certificate_id}/email`)}>Retry email</Button></>}
      </article>;})}</>}
  </section>;
}
