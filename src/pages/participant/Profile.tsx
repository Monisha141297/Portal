import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { initials } from '../../lib/helpers';
import { progressOf } from '../../lib/selectors';

export default function Profile() {
  const u = useStore((s) => s.currentUser)!;
  const attempts = useStore((s) => s.attempts);
  const certs = useStore((s) => s.certs);
  const topics = useStore((s) => s.topics);
  const expertQs = useStore((s) => s.expertQs);
  const progress = useStore((s) => s.progress);
  const slidesMap = useStore((s) => s.slides);
  const progOf = (uid: string, tid: string) => progressOf(progress, uid, tid, (slidesMap[tid] || []).length);

  const att = attempts.filter((a) => a.user === u.id);
  const cs = certs.filter((c) => c.user === u.id);
  const rows: [string, string][] = [
    ['Employee ID', u.emp], ['Role', u.role], ['Department', u.dept], ['Plant', u.plant],
    ['Location', u.location], ['Registered mobile', u.mobile], ['Account status', u.status], ['Member since', u.created],
  ];
  const inProgress = topics.filter((t) => progOf(u.id, t.id).pct > 0);

  return (
    <div className="grid g2">
      <div className="card"><div className="card-h"><h3>Profile</h3></div><div className="card-b">
        <div className="row mb"><div className="avatar" style={{ width: 58, height: 58, fontSize: 19 }}>{initials(u.name)}</div><div><h3>{u.name}</h3><div className="muted small">{u.desig}</div></div></div>
        {rows.map((r) => (
          <div key={r[0]} className="spread" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <span className="small muted">{r[0]}</span><b className="small">{r[1]}</b>
          </div>
        ))}
      </div></div>
      <div className="col">
        <div className="card"><div className="card-h"><h3>Learning summary</h3></div><div className="card-b">
          {inProgress.length ? inProgress.map((t) => {
            const p = progOf(u.id, t.id);
            return (
              <div key={t.id} className="mb">
                <div className="spread small"><span>{t.name}</span><b>{p.pct}%</b></div>
                <Bar pct={p.pct} cls={p.pct === 100 ? 'g' : ''} />
              </div>
            );
          }) : <div className="muted small">No learning activity yet.</div>}
        </div></div>
        <div className="card"><div className="card-h"><h3>Achievements</h3></div><div className="card-b grid g3">
          <div className="center"><div style={{ fontSize: 26 }}>✎</div><b>{att.length}</b><div className="xs muted">Attempts</div></div>
          <div className="center"><div style={{ fontSize: 26 }}>❖</div><b>{cs.length}</b><div className="xs muted">Certificates</div></div>
          <div className="center"><div style={{ fontSize: 26 }}>✦</div><b>{expertQs.filter((x) => x.user === u.id).length}</b><div className="xs muted">Expert questions</div></div>
        </div></div>
      </div>
    </div>
  );
}
