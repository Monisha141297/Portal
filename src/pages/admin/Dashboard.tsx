import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { initials } from '../../lib/helpers';
import { SESSIONS } from './sessions';
import { openUserEditor } from './userEditor';

export default function AdminDashboard() {
  const users = useStore((s) => s.users);
  const audit = useStore((s) => s.audit);
  const attempts = useStore((s) => s.attempts);
  const expertQs = useStore((s) => s.expertQs);
  const userById = useStore((s) => s.userById);
  const navigate = useNavigate();

  const usageRows: [string, number][] = [
    ['Learning sessions', 184],
    ['Assessment attempts', attempts.length + 126],
    ['Examination participation', 67],
    ['AI chatbot conversations', 93],
    ['Expert questions', expertQs.length + 11],
  ];

  return (
    <div>
      <div className="spread mb">
        <div><h2 style={{ fontSize: 21 }}>System administration</h2><div className="muted small">User and system administration only — content is managed by trainers</div></div>
        <button className="btn pri" onClick={() => openUserEditor(null)}>+ Create user</button>
      </div>
      <div className="grid g5 mb">
        <div className="kpi b"><div className="lab">Total users</div><div className="val">{users.length}</div></div>
        <div className="kpi g"><div className="lab">Active</div><div className="val">{users.filter((u) => u.status === 'Active').length}</div></div>
        <div className="kpi r"><div className="lab">Inactive</div><div className="val">{users.filter((u) => u.status === 'Inactive').length}</div></div>
        <div className="kpi p"><div className="lab">Trainers</div><div className="val">{users.filter((u) => u.role === 'trainer').length}</div></div>
        <div className="kpi o"><div className="lab">Logged in now</div><div className="val">{SESSIONS.length}</div><div className="sub">live sessions</div></div>
      </div>
      <div className="grid g2">
        <div className="card"><div className="card-h"><h3>Daily active users</h3><a className="small" onClick={() => navigate('/app/admin/activity')} style={{ cursor: 'pointer' }}>Details →</a></div>
          <div className="card-b"><div className="chartbars">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
              const v = [42, 55, 61, 48, 67, 23][i];
              return <div key={d} className="cb"><b className="xs">{v}</b><i style={{ height: (v / 70 * 100) + '%' }} /><span>{d}</span></div>;
            })}
          </div></div>
        </div>
        <div className="card"><div className="card-h"><h3>Currently logged in</h3><span className="tag g">{SESSIONS.length} online</span></div>
          <div className="card-b">
            {SESSIONS.map((s) => {
              const u = userById(s.u);
              return (
                <div key={s.u} className="row" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}>
                  <span className="pulse-dot" /><div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(u.name)}</div>
                  <div className="grow"><b className="small">{u.name}</b><div className="xs muted">{u.role} · {s.dev}</div></div>
                  <span className="xs muted">since {s.since}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card"><div className="card-h"><h3>Usage analytics</h3><a className="small" onClick={() => navigate('/app/admin/usage')} style={{ cursor: 'pointer' }}>All →</a></div>
          <div className="card-b">
            {usageRows.map((r) => <div key={r[0]} className="spread small" style={{ padding: '7px 0', borderBottom: '1px solid var(--line)' }}><span className="muted">{r[0]}</span><b>{r[1]}</b></div>)}
          </div>
        </div>
        <div className="card"><div className="card-h"><h3>Recent activity</h3><a className="small" onClick={() => navigate('/app/admin/audit')} style={{ cursor: 'pointer' }}>Audit log →</a></div>
          <div className="card-b">
            {audit.slice(0, 6).map((a) => (
              <div key={a.id} className="small" style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <b>{a.action}</b> — {a.entity}
                <div className="xs muted">{userById(a.user).name || a.user} · {a.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
