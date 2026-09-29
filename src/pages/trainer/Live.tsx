import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { initials } from '../../lib/helpers';
import { openExamEditor } from './examEditor';

export default function Live() {
  const { eventId } = useParams();
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const userById = useStore((s) => s.userById);
  const pathOf = useStore((s) => s.path);
  const qOf = useStore((s) => s.qOf);
  const simJoin = useStore((s) => s.simJoin);
  const simulateJoin = useStore((s) => s.simulateJoin);
  const startLive = useStore((s) => s.startLive);
  const endExam = useStore((s) => s.endExam);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const e = events.find((x) => x.id === eventId);
  if (!e) return <Navigate to="/app/trainer/exams" replace />;

  const invited = e.type === 'Open' ? users.filter((u) => u.role === 'participant') : e.parts.map(userById);
  const joinedUsers = e.joined.map(userById);

  return (
    <div>
      <div className="spread mb wrap">
        <div><h2 style={{ fontSize: 20 }}>{e.name}</h2><div className="muted small">{pathOf(e.topic)}</div></div>
        <div className="row"><span className={'tag ' + (e.status === 'Live' ? 'r' : 'o')}>{e.status}</span><button className="btn" onClick={() => navigate('/app/trainer/exams')}>← Back</button></div>
      </div>
      <div className="grid g4 mb">
        <div className="card pad center" style={{ background: '#0f1c33', color: '#fff', borderColor: 'transparent' }}>
          <div className="xs" style={{ color: '#93c5fd', letterSpacing: '.12em' }}>EVENT CODE</div>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 6 }} className="mono">{e.code}</div>
          <div className="xs" style={{ color: '#93c5fd' }}>Share this with participants</div>
        </div>
        <div className="kpi b"><div className="lab">Joined</div><div className="val">{joinedUsers.length + simJoin.length}</div><div className="sub">of {invited.length} {e.type === 'Open' ? 'eligible' : 'invited'}</div></div>
        <div className="kpi o"><div className="lab">Questions</div><div className="val">{e.count}</div><div className="sub">{qOf(e.topic).filter((q) => q.mandatory).length} mandatory + random</div></div>
        <div className="kpi p"><div className="lab">Pass mark</div><div className="val">{e.pass}%</div><div className="sub">{e.cert ? 'Certificate enabled' : 'No certificate'}</div></div>
      </div>
      <div className="grid g2">
        <div className="card">
          <div className="card-h"><h3>Waiting room</h3><span className={'tag ' + (e.status === 'Live' ? 'r' : 'o')}>{e.status === 'Live' ? 'Examination running' : 'Waiting for trainer'}</span></div>
          <div className="card-b">
            <div className="waitgrid">
              {joinedUsers.concat(simJoin.map((n) => ({ name: n } as typeof joinedUsers[number]))).map((u, i) => (
                <div key={i} className="wchip"><span className="pulse-dot" />{u.name}</div>
              ))}
              {joinedUsers.length + simJoin.length === 0 && <div className="muted small">No participants have joined yet.</div>}
            </div>
            <div className="row mt2">
              {e.status === 'Live' ? (
                <>
                  <button className="btn dan" onClick={() => { endExam(e.id); toast('Examination ended — results calculated', 'ok'); navigate(`/app/trainer/results/${e.id}`); }}>■ End examination</button>
                  <span className="small muted">Participants are answering now</span>
                </>
              ) : (
                <>
                  <button className="btn ok lg" onClick={() => { startLive(e.id); toast('Examination started — participants can now begin', 'ok'); }}>▶ Start examination</button>
                  <button className="btn" onClick={simulateJoin}>+ Simulate a participant joining</button>
                </>
              )}
            </div>
            <div className="xs muted mt">The examination begins only when you start it. Participants see a live waiting room until then.</div>
          </div>
        </div>
        <div className="col">
          <div className="card"><div className="card-h"><h3>Configuration</h3><button className="btn sm" onClick={() => openExamEditor(e.id)}>Edit</button></div>
            <div className="card-b">
              {[['Mode', e.type], ['Scheduled', e.date + ' ' + e.time], ['Time per question', e.defTime + 's'],
                ['Leaderboard', e.lb ? 'Visible to participants' : 'Hidden'], ['Results', e.res ? 'Published immediately' : 'Held back'],
                ['Certification', e.cert ? 'Issued on pass' : 'Not enabled']].map((r) => (
                <div key={r[0]} className="spread small" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}><span className="muted">{r[0]}</span><b>{r[1]}</b></div>
              ))}
            </div>
          </div>
          <div className="card"><div className="card-h"><h3>Invited participants</h3><span className="tag">{invited.length}</span></div>
            <div className="card-b" style={{ maxHeight: 230, overflow: 'auto' }}>
              {invited.map((u) => (
                <div key={u.id} className="row small" style={{ padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                  <div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(u.name)}</div>
                  <div className="grow"><b>{u.name}</b><div className="xs muted">{u.dept} · {u.plant}</div></div>
                  {e.joined.includes(u.id) ? <span className="tag g">Joined</span> : <span className="tag">Not joined</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
