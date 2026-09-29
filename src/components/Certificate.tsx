import type { AppUser, Certificate as Cert } from '../types';
import { useStore } from '../store/useStore';

export default function Certificate({ cert, user }: { cert: Cert; user: AppUser }) {
  const pathOf = useStore((s) => s.path);
  const events = useStore((s) => s.events);
  const ev = events.find((e) => e.id === cert.event);
  return (
    <div className="cert">
      <div className="row" style={{ justifyContent: 'center', gap: 10, marginBottom: 18 }}>
        <div className="logo-mark" style={{ background: '#0f1c33' }}>RC</div>
        <b style={{ letterSpacing: 2 }}>THE RAMCO CEMENTS LIMITED</b>
      </div>
      <div className="ttl">Certificate of Completion</div>
      <div className="small muted mt">This is to certify that</div>
      <div className="name">{user.name}</div>
      <div className="small muted">Employee ID {user.emp} · {user.dept} · {user.plant}</div>
      <div className="mt2" style={{ marginTop: 18 }}>has successfully completed the product knowledge examination for</div>
      <div style={{ fontSize: 21, fontWeight: 700, margin: '8px 0', color: '#0f1c33' }}>{pathOf(cert.topic)}</div>
      <div className="small">with a score of <b>{cert.score}%</b> against a pass requirement of <b>{ev ? ev.pass : 70}%</b></div>
      <div className="seal">CERTIFIED<br />{String(cert.date).slice(0, 4)}</div>
      <div className="meta">
        <div><b>{cert.id}</b><br />Certificate ID</div>
        <div><b>{cert.date}</b><br />Date of issue</div>
        <div><b>Meenakshi Iyer</b><br />Authorised Trainer</div>
        <div><b>Digitally verified</b><br />LearnCert Platform</div>
      </div>
    </div>
  );
}
