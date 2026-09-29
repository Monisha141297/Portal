import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { initials } from '../../lib/helpers';

export default function Leaderboard() {
  const { eventId } = useParams();
  const events = useStore((s) => s.events);
  const userById = useStore((s) => s.userById);
  const pathOf = useStore((s) => s.path);
  const currentUser = useStore((s) => s.currentUser)!;
  const navigate = useNavigate();

  const ev = events.find((e) => e.id === eventId)!;
  const rows = (ev.results || []).slice().sort((a, b) => b.s - a.s || a.t.localeCompare(b.t));

  return (
    <div>
      <div className="spread mb">
        <div><h2 style={{ fontSize: 20 }}>{ev.name}</h2><div className="muted small">{pathOf(ev.topic)} · {ev.date} · pass mark {ev.pass}%</div></div>
        <button className="btn" onClick={() => navigate(currentUser.role === 'participant' ? '/app/participant/dashboard' : '/app/trainer/results')}>← Back</button>
      </div>
      <div className="card">
        <div className="card-h"><h3>Ranking</h3><span className="small muted">Ranked by score, then by completion time</span></div>
        {rows.length ? rows.map((r, i) => {
          const u = userById(r.u);
          return (
            <div key={r.u} className={'lb-row ' + (r.u === currentUser.id ? 'me' : '')}>
              <div className={'rank ' + (i < 3 ? 'r' + (i + 1) : '')}>{i + 1}</div>
              <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(u.name)}</div>
              <div className="grow"><b className="small">{u.name}{r.u === currentUser.id && <span className="tag b"> You</span>}</b><div className="xs muted">{u.dept} · {u.plant}</div></div>
              <div className="right"><b>{r.s}%</b><div className="xs muted">{r.t}</div></div>
              <div>{r.s >= ev.pass ? <span className="tag g">Pass</span> : <span className="tag r">Fail</span>}</div>
            </div>
          );
        }) : <div className="empty">No results submitted yet</div>}
      </div>
    </div>
  );
}
