import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
import Button from './Button';

export default function AdminWorkspace({ committees = [], onChanged }) {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [head, setHead] = useState('');
  const [committee, setCommittee] = useState('');
  const [executive, setExecutive] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function reloadUsers() {
    setUsers(await apiRequest('/api/v1/admin/users'));
  }
  useEffect(() => {
    let active = true;
    apiRequest('/api/v1/admin/users').then(items => { if (active) setUsers(items); })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  async function runAction(action) {
    setBusy(true); setMessage('');
    try {
      await action();
      await reloadUsers();
      await onChanged?.();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const faculty = users.filter(user => user.role === 'faculty');
  const students = users.filter(user => user.role === 'student');
  return <section className="operations-panel" aria-label="Administrator committee management">
    <span className="estrade-section-kicker">PLATFORM ADMINISTRATION</span>
    <h2>Committee administration</h2>
    <p>Only platform administrators can create committees, appoint heads, or appoint executives. Heads and executives may approve coordinator requests within their own committees.</p>
    {message && <p className="operations-message" role="status">{message}</p>}

    <h3>1. Approve a verified user as faculty</h3>
    {students.length === 0 ? <p>No eligible student accounts to promote.</p> : students.map(user =>
      <div className="operations-row" key={user.id}>
        <strong>{user.name}</strong> · {user.email}{' '}
        <Button variant="warning" disabled={busy} onClick={() => {
          if (!window.confirm(`Promote ${user.name} to faculty? This changes their platform role.`)) return;
          runAction(async () => {
            await apiRequest(`/api/v1/admin/users/${user.id}/faculty`, { method:'POST' });
            setMessage('Faculty promotion completed.');
          });
        }}>Promote to faculty</Button>
      </div>)}

    <h3>2. Create committee and appoint its head</h3>
    <form className="operations-form" onSubmit={e => { e.preventDefault(); runAction(async () => {
      await apiRequest('/api/v1/admin/committees', { method:'POST', body:JSON.stringify({name,description,head_user_id:head}) });
      setMessage('Committee created and head appointed.');
      setName(''); setDescription(''); setHead('');
    }); }}>
      <label>Committee name<input value={name} maxLength={150} minLength={3} required onChange={e => setName(e.target.value)} /></label>
      <label>Description<textarea value={description} maxLength={3000} onChange={e => setDescription(e.target.value)} /></label>
      <label>Committee head<select value={head} required onChange={e => setHead(e.target.value)}><option value="">Select verified faculty</option>
        {faculty.map(user => <option value={user.id} key={user.id}>{user.name} · {user.email}</option>)}
      </select></label>
      <Button type="submit" variant="positive" disabled={busy || faculty.length === 0}>Create committee and appoint head</Button>
    </form>

    <h3>3. Appoint an executive</h3>
    <form className="operations-form" onSubmit={e => { e.preventDefault(); runAction(async () => {
      await apiRequest(`/api/v1/admin/committees/${committee}/executives`, {method:'POST',body:JSON.stringify({user_id:executive})});
      setMessage('Executive appointed.');
      setExecutive('');
    }); }}>
      <label>Committee<select required value={committee} onChange={e => setCommittee(e.target.value)}>
        <option value="">Select committee</option>{committees.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}
      </select></label>
      <label>Executive<select required value={executive} onChange={e => setExecutive(e.target.value)}><option value="">Select verified faculty</option>
        {faculty.map(user => <option value={user.id} key={user.id}>{user.name} · {user.email}</option>)}
      </select></label>
      <Button type="submit" variant="positive" disabled={busy || !committee || !executive}>Appoint executive</Button>
    </form>
  </section>;
}
