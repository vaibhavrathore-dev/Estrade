import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../services/api';
export default function VerifyCertificate() {
  const {code} = useParams(); const [record, setRecord] = useState(null), [error, setError] = useState('');
  useEffect(() => {apiRequest(`/api/v1/certificate-verification/${encodeURIComponent(code)}`).then(setRecord).catch(e => setError(e.message));}, [code]);
  return <main style={{maxWidth:700,margin:'60px auto',padding:24}}><Link to="/">estrade.</Link><h1>Certificate verification</h1>{error ? <p role="alert">{error}</p> : record ? <><h2>Valid certificate</h2><p>{record.verification_code}</p><p>{record.certificate_type} · Issued {new Date(record.issued_at).toLocaleDateString()}</p><p>Personal details are withheld from public verification.</p></> : <p role="status">Checking certificate…</p>}</main>;
}
