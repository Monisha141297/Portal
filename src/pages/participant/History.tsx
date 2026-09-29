import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ResultTag } from '../../components/ui/Tags';

export default function History() {
  const currentUser = useStore((s) => s.currentUser)!;
  const attempts = useStore((s) => s.attempts);
  const topicOf = useStore((s) => s.topic);
  const loadPastResult = useStore((s) => s.loadPastResult);
  const navigate = useNavigate();

  const att = attempts.filter((a) => a.user === currentUser.id).slice().reverse();
  const byTopic: Record<string, typeof att> = {};
  att.forEach((a) => { (byTopic[a.topic] = byTopic[a.topic] || []).push(a); });

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">History &amp; attempts</h2>
      <div className="grid g4 mb">
        <div className="kpi b"><div className="lab">Total attempts</div><div className="val">{att.length}</div></div>
        <div className="kpi g"><div className="lab">Passed</div><div className="val">{att.filter((a) => a.result === 'Pass').length}</div></div>
        <div className="kpi o"><div className="lab">Average score</div><div className="val">{att.length ? Math.round(att.reduce((s, a) => s + a.pct, 0) / att.length) : 0}%</div></div>
        <div className="kpi p"><div className="lab">Topics attempted</div><div className="val">{Object.keys(byTopic).length}</div></div>
      </div>
      {Object.keys(byTopic).length ? Object.keys(byTopic).map((t) => (
        <div key={t} className="card mb">
          <div className="card-h"><h3>{topicOf(t).name}</h3><span className="tag">{byTopic[t].length} attempts</span></div>
          <div className="tbl-wrap">
            <table>
              <thead><tr><th>#</th><th>Mode</th><th>Date</th><th className="right">Score</th><th className="right">%</th><th>Result</th><th>Time</th><th></th></tr></thead>
              <tbody>
                {byTopic[t].slice().reverse().map((a, i) => (
                  <tr key={a.id}>
                    <td>{i + 1}</td>
                    <td><span className={'tag ' + (a.mode === 'live' ? 'p' : '')}>{a.mode === 'live' ? 'Live exam' : 'Self'}</span></td>
                    <td className="small">{a.date}</td>
                    <td className="right">{a.score} / {a.total}</td>
                    <td className="right bold">{a.pct}%</td>
                    <td><ResultTag result={a.result} /></td>
                    <td className="small muted">{a.time}</td>
                    <td className="right">{a.detail
                      ? <button className="btn sm" onClick={() => { loadPastResult(a.id); navigate('/app/participant/result'); }}>Analysis</button>
                      : <span className="xs muted">archived</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )) : <div className="card"><div className="empty"><div className="big">↺</div>No attempts recorded yet</div></div>}
    </div>
  );
}
