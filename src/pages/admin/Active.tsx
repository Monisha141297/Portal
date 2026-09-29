import { useStore } from '../../store/useStore';
import { initials } from '../../lib/helpers';
import { SESSIONS } from './sessions';

export default function Active() {
  const userById = useStore((s) => s.userById);
  const toast = useStore((s) => s.toast);

  return (
    <div>
      <div className="spread mb"><h2 style={{ fontSize: 20 }}>Currently logged-in users</h2><span className="tag g">{SESSIONS.length} live sessions</span></div>
      <div className="card"><div className="tbl-wrap"><table>
        <thead><tr><th>User</th><th>Role</th><th>Department</th><th>Logged in since</th><th>Device</th><th>IP address</th><th></th></tr></thead>
        <tbody>
          {SESSIONS.map((s) => {
            const u = userById(s.u);
            return (
              <tr key={s.u}>
                <td><div className="row"><span className="pulse-dot" /><div className="avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{initials(u.name)}</div><b className="small">{u.name}</b></div></td>
                <td><span className={'tag ' + (u.role === 'admin' ? 'r' : u.role === 'trainer' ? 'p' : 'b')}>{u.role}</span></td>
                <td className="small">{u.dept}</td>
                <td className="small">{s.since}</td>
                <td className="small muted">{s.dev}</td>
                <td className="mono small">{s.ip}</td>
                <td className="right"><button className="btn sm dan" onClick={() => toast('Session terminated for ' + u.name, 'warn')}>End session</button></td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </div>
  );
}
