import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

export default function Certs() {
  const currentUser = useStore((s) => s.currentUser)!;
  const certs = useStore((s) => s.certs);
  const pathOf = useStore((s) => s.path);
  const topicOf = useStore((s) => s.topic);
  const navigate = useNavigate();
  const cs = certs.filter((c) => c.user === currentUser.id);

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">My certifications</h2>
      <p className="muted small mb">Certificates are issued automatically when you pass an official live examination with certification enabled. Self-assessment results alone do not issue a certificate.</p>
      {cs.length ? (
        <div className="grid g3">
          {cs.map((c) => (
            <div key={c.id} className="card"><div className="card-b">
              <div className="spread mb"><span className="tag g">✓ {c.status}</span><span className="xs muted mono">{c.id}</span></div>
              <b>{topicOf(c.topic).name}</b><div className="xs muted">{pathOf(c.topic)}</div>
              <div className="row mt"><span className="tag b">Score {c.score}%</span><span className="tag">Issued {c.date}</span></div>
              <button className="btn pri block mt" onClick={() => navigate(`/app/participant/certs/${c.id}`)}>View certificate</button>
            </div></div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty"><div className="big">❖</div>No certificates yet
          <div className="small mt">Pass a certification examination to earn your first certificate.</div>
          <div className="mt"><button className="btn pri sm" onClick={() => navigate('/app/participant/events')}>View live events</button></div>
        </div></div>
      )}
    </div>
  );
}
