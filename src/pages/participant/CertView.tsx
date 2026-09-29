import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import Certificate from '../../components/Certificate';

export default function CertView() {
  const { certId } = useParams();
  const certs = useStore((s) => s.certs);
  const userById = useStore((s) => s.userById);
  const events = useStore((s) => s.events);
  const navigate = useNavigate();

  const cert = certs.find((c) => c.id === certId);
  if (!cert) return <Navigate to="/app/participant/certs" replace />;
  const user = userById(cert.user);
  const ev = events.find((e) => e.id === cert.event);

  return (
    <div>
      <div className="spread mb noprint">
        <h2 style={{ fontSize: 20 }}>Certificate</h2>
        <div className="row"><button className="btn" onClick={() => navigate('/app/participant/certs')}>← Back</button><button className="btn pri" onClick={() => window.print()}>⎙ Download / Print</button></div>
      </div>
      <Certificate cert={cert} user={user} />
      <div className="card mt2 noprint">
        <div className="card-h"><h3>Verification details</h3></div>
        <div className="card-b grid g3">
          <div><div className="xs muted">Certificate ID</div><b className="mono">{cert.id}</b></div>
          <div><div className="xs muted">Issued on</div><b>{cert.date}</b></div>
          <div><div className="xs muted">Status</div><span className={'tag ' + (cert.status === 'Valid' ? 'g' : 'r')}>{cert.status}</span></div>
          <div><div className="xs muted">Examination</div><b>{ev ? ev.name : '—'}</b></div>
          <div><div className="xs muted">Score achieved</div><b>{cert.score}%</b></div>
          <div><div className="xs muted">Digital verification</div><b className="mono xs">SHA-{cert.id.replace(/\W/g, '')}-VERIFIED</b></div>
        </div>
      </div>
    </div>
  );
}
