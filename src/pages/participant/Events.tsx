import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { StatusTag, ResultTag } from '../../components/ui/Tags';

export default function Events() {
  const currentUser = useStore((s) => s.currentUser)!;
  const events = useStore((s) => s.events);
  const topicOf = useStore((s) => s.topic);
  const joinEvent = useStore((s) => s.joinEvent);
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');

  const me = currentUser.id;
  const mine = events.filter((e) => e.status !== 'Draft' && (e.type === 'Open' || e.parts.includes(me)));
  const open = mine.filter((e) => e.status === 'Scheduled' || e.status === 'Live' || e.status === 'Waiting');
  const done = mine.filter((e) => e.status === 'Completed');

  function goJoin(id: string) { joinEvent(id, me); navigate(`/app/participant/wait/${id}`); }

  function joinByCode() {
    const v = code.trim();
    const e = events.find((x) => x.code === v);
    if (!e) { setErr('Invalid event code. Please check with your trainer.'); return; }
    if (e.status === 'Draft') { setErr('This examination is not yet published.'); return; }
    if (e.status === 'Completed') { setErr('This examination has already been completed.'); return; }
    if (e.type === 'Private' && !e.parts.includes(me)) { setErr('You are not on the participant list for this private examination.'); return; }
    goJoin(e.id);
  }

  return (
    <div>
      <div className="grid g2 mb">
        <div className="card"><div className="card-b">
          <b>Join with an event code</b>
          <div className="muted small mb">Your trainer will share a 6-digit code for the examination.</div>
          <div className="row">
            <input className="inp mono" placeholder="e.g. 824591" maxLength={6} style={{ fontSize: 19, letterSpacing: 4, textAlign: 'center' }}
              value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') joinByCode(); }} />
            <button className="btn pri" onClick={joinByCode}>Join →</button>
          </div>
          {err && <div className="hint" style={{ color: 'var(--bad)' }}>{err}</div>}
          <div className="xs muted mt">Prototype codes: <b className="mono">824591</b> (private, you are invited) · <b className="mono">537104</b> (open event)</div>
        </div></div>
        <div className="card"><div className="card-b">
          <b>How a live examination works</b>
          <div className="col small muted" style={{ gap: 6, marginTop: 8 }}>
            {['Join using the code, or opt in to an open event', 'Wait in the waiting room until the trainer starts', 'Answer randomised questions against a per-question timer', 'Results and leaderboard are published immediately', 'Passing an examination with certification enabled issues your certificate']
              .map((s, i) => <div key={i} className="row"><span className="rank" style={{ width: 22, height: 22, fontSize: 11 }}>{i + 1}</span><span>{s}</span></div>)}
          </div>
        </div></div>
      </div>

      <h3 className="mb" style={{ fontSize: 16 }}>Available &amp; upcoming</h3>
      {open.length ? (
        <div className="grid g2 mb">
          {open.map((e) => (
            <div key={e.id} className="card"><div className="card-b">
              <div className="spread mb"><b>{e.name}</b><StatusTag status={e.status} /></div>
              <div className="xs muted">{topicOf(e.topic).name}</div>
              <div className="row wrap mt">
                <span className={'tag ' + (e.type === 'Open' ? 'g' : 'b')}>{e.type}</span>
                <span className="tag">{e.date} {e.time}</span>
                <span className="tag">{e.count} questions</span>
                <span className="tag">Pass {e.pass}%</span>
                {e.cert && <span className="tag p">❖ Certification</span>}
              </div>
              <div className="row mt"><span className="small muted mono">Code {e.code}</span><div className="grow" /><button className="btn pri sm" onClick={() => goJoin(e.id)}>Join waiting room →</button></div>
            </div></div>
          ))}
        </div>
      ) : <div className="card mb"><div className="empty">No upcoming examinations for you</div></div>}

      <h3 className="mb" style={{ fontSize: 16 }}>Completed</h3>
      <div className="card"><div className="tbl-wrap">
        {done.length ? (
          <table>
            <thead><tr><th>Examination</th><th>Topic</th><th>Date</th><th className="right">Your score</th><th>Result</th><th></th></tr></thead>
            <tbody>
              {done.map((e) => {
                const r = (e.results || []).find((x) => x.u === me);
                return (
                  <tr key={e.id}>
                    <td><b className="small">{e.name}</b></td>
                    <td className="small">{topicOf(e.topic).name}</td>
                    <td className="small muted">{e.date}</td>
                    <td className="right bold">{r ? r.s + '%' : '—'}</td>
                    <td>{r ? <ResultTag result={r.s >= e.pass ? 'Pass' : 'Fail'} /> : <span className="tag">Did not attend</span>}</td>
                    <td className="right">{e.lb && <button className="btn sm" onClick={() => navigate(`/app/participant/leaderboard/${e.id}`)}>Leaderboard</button>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div className="empty">No completed examinations</div>}
      </div></div>
    </div>
  );
}
