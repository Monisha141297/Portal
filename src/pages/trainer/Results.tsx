import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { initials } from '../../lib/helpers';

export default function Results() {
  const { eventId } = useParams();
  const events = useStore((s) => s.events);
  const userById = useStore((s) => s.userById);
  const pathOf = useStore((s) => s.path);
  const qOf = useStore((s) => s.qOf);
  const navigate = useNavigate();

  const evs = events.filter((e) => e.status === 'Completed');
  const e = eventId ? events.find((x) => x.id === eventId) : evs[0];

  if (!e) return <div className="card"><div className="empty">No completed examinations yet</div></div>;

  const rows = (e.results || []).slice().sort((a, b) => b.s - a.s || a.t.localeCompare(b.t));
  const pass = rows.filter((r) => r.s >= e.pass).length;
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.s, 0) / rows.length) : 0;
  const invited = e.type === 'Open' ? 0 : e.parts.length;
  const sampleScores = [92, 78, 64, 55, 88, 41];

  return (
    <div>
      <div className="spread mb wrap">
        <div><h2 style={{ fontSize: 20 }}>{e.name}</h2><div className="muted small">{pathOf(e.topic)} · {e.date}</div></div>
        <select className="inp" style={{ width: 'auto' }} value={e.id} onChange={(ev2) => navigate(`/app/trainer/results/${ev2.target.value}`)}>
          {evs.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
        </select>
      </div>
      <div className="grid g5 mb">
        <div className="kpi b"><div className="lab">Participation</div><div className="val">{rows.length}</div><div className="sub">of {invited || rows.length} invited ({invited ? Math.round(rows.length / invited * 100) : 100}%)</div></div>
        <div className="kpi g"><div className="lab">Passed</div><div className="val">{pass}</div><div className="sub">{rows.length ? Math.round(pass / rows.length * 100) : 0}% pass rate</div></div>
        <div className="kpi r"><div className="lab">Failed</div><div className="val">{rows.length - pass}</div><div className="sub">below {e.pass}%</div></div>
        <div className="kpi o"><div className="lab">Average score</div><div className="val">{avg}%</div></div>
        <div className="kpi p"><div className="lab">Highest score</div><div className="val">{rows[0] ? rows[0].s + '%' : '—'}</div><div className="sub">{rows[0] ? userById(rows[0].u).name : ''}</div></div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-h"><h3>Leaderboard</h3><span className="small muted">Score, then completion time</span></div>
          {rows.length ? rows.map((r, i) => {
            const u = userById(r.u);
            return (
              <div key={r.u} className="lb-row">
                <div className={'rank ' + (i < 3 ? 'r' + (i + 1) : '')}>{i + 1}</div>
                <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(u.name)}</div>
                <div className="grow"><b className="small">{u.name}</b><div className="xs muted">{u.dept} · {u.plant}</div></div>
                <div className="right"><b>{r.s}%</b><div className="xs muted">{r.t}</div></div>
                {r.s >= e.pass ? <span className="tag g">Pass</span> : <span className="tag r">Fail</span>}
                {r.s >= e.pass && e.cert && <span className="tag p">❖</span>}
              </div>
            );
          }) : <div className="empty">No submissions</div>}
        </div>
        <div className="col">
          <div className="card"><div className="card-h"><h3>Score distribution</h3></div><div className="card-b">
            <div className="chartbars">
              {[['0-40', 0, 40], ['41-60', 41, 60], ['61-70', 61, 70], ['71-80', 71, 80], ['81-90', 81, 90], ['91-100', 91, 100]].map(([label, lo, hi], i) => {
                const n = rows.filter((r) => r.s >= (lo as number) && r.s <= (hi as number)).length;
                const h = rows.length ? (n / rows.length) * 100 : 0;
                return (
                  <div key={i} className={'cb ' + ((lo as number) >= e.pass ? 'g' : '')}>
                    <b className="xs">{n}</b><i style={{ height: Math.max(3, h) + '%' }} /><span>{label}</span>
                  </div>
                );
              })}
            </div>
          </div></div>
          <div className="card"><div className="card-h"><h3>Question performance</h3></div><div className="card-b">
            {qOf(e.topic).slice(0, 6).map((q, i) => {
              const c = sampleScores[i] || 60;
              return <div key={q.id} className="hbar"><span title={q.text}>Q{i + 1} · {q.text.slice(0, 22)}…</span><Bar pct={c} cls={c >= 60 ? 'g' : 'r'} /><b className="small right">{c}%</b></div>;
            })}
            <div className="xs muted mt">Percentage of participants answering correctly — use this to improve questions and learning content.</div>
          </div></div>
        </div>
      </div>
    </div>
  );
}
