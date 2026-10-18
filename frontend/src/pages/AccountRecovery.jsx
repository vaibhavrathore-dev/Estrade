import { useState } from 'react';
import ThemeToggle from '../components/ThemeToggle';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import './Login.css';
export default function AccountRecovery({ verification = false }) {
  const location = useLocation(), navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || ''), [code, setCode] = useState(''), [password, setPassword] = useState(''), [confirmation, setConfirmation] = useState(''), [resetToken, setResetToken] = useState(''), [step, setStep] = useState(verification ? 'code' : 'email'), [message, setMessage] = useState(location.state?.message || ''), [busy, setBusy] = useState(false), [show, setShow] = useState(false), [nextSend, setNextSend] = useState(0);
  async function submit(e, resend = false) {
    e.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      if (resend || step === 'email') {
        if (Date.now() < nextSend) throw new Error('Please wait 60 seconds between code requests.');
        const data = await apiRequest(`/api/v1/auth/${verification ? 'verification/resend' : 'password/forgot'}`, {method:'POST', body:JSON.stringify({email})});
        setNextSend(Date.now()+60000); setMessage(data.message); setStep('code');
      } else if (step === 'code') {
        const data = await apiRequest(`/api/v1/auth/${verification ? 'verification/verify' : 'password/verify'}`, {method:'POST', body:JSON.stringify({email, code})});
        if (verification) navigate('/login', {replace:true, state:{message:data.message}});
        else { setResetToken(data.reset_token); setStep('password'); }
      } else {
        if (password !== confirmation) throw new Error('Passwords do not match.');
        const data = await apiRequest('/api/v1/auth/password/reset', {method:'POST', body:JSON.stringify({email, reset_token:resetToken, password})});
        navigate('/login', {replace:true, state:{message:data.message}});
      }
    } catch(e) {setMessage(e.message);} finally {setBusy(false);}
  }
  return <div className="estrade-login"><div className="login-form-panel"><div className="login-form-wrapper"><div className="auth-toolbar"><Link className="login-brand-logo" to="/">estrade.</Link><ThemeToggle /></div><h1>{verification ? 'Verify your email' : 'Recover your account'}</h1><p>{step === 'email' ? 'Step 1 of 3 · Request a code' : step === 'code' ? 'Enter the six-digit email code. It expires after 10 minutes.' : 'Step 3 of 3 · Choose a new password'}</p>
    <form className="login-form" onSubmit={submit}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" disabled={step === 'password'}/></label>
      {step === 'code' && <label>Six-digit code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value)} required autoComplete="one-time-code"/></label>}
      {step === 'password' && <><label>New password (at least 12 characters)<input type={show ? 'text' : 'password'} minLength={12} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password"/></label><label>Confirm password<input type={show ? 'text' : 'password'} value={confirmation} onChange={e => setConfirmation(e.target.value)} required autoComplete="new-password"/></label><button type="button" onClick={() => setShow(!show)}>{show ? 'Hide passwords' : 'Show passwords'}</button></>}
      <button className="login-submit" disabled={busy}>{busy ? 'Processing…' : step === 'email' ? 'Send recovery code' : step === 'code' ? 'Verify code' : 'Update password'}</button>
      {step === 'code' && <button type="button" disabled={busy} onClick={e => submit(e, true)}>Resend code</button>}
    </form>{message && <p className="login-message" role="status">{message}</p>}<p><Link to="/login">Return to sign in</Link></p></div></div></div>;
}
