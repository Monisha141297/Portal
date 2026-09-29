import { useStore } from '../../store/useStore';
import { StatusTag } from '../../components/ui/Tags';
import { initials } from '../../lib/helpers';
import { openUserEditor } from './userEditor';

export default function Users() {
  const users = useStore((s) => s.users);
  const f = useStore((s) => s.userFilters);
  const setUserFilters = useStore((s) => s.setUserFilters);
  const toggleUserStatus = useStore((s) => s.toggleUserStatus);
  const toast = useStore((s) => s.toast);

  let list = users;
  if (f.q) list = list.filter((u) => (u.name + u.emp + u.dept + u.plant).toLowerCase().includes(f.q.toLowerCase()));
  if (f.role) list = list.filter((u) => u.role === f.role);
  if (f.status) list = list.filter((u) => u.status === f.status);

  return (
    <div>
      <div className="spread mb">
        <h2 style={{ fontSize: 20 }}>User management</h2>
        <div className="row">
          <button className="btn" onClick={() => toast('Bulk user import from the HR master file')}>⬆ Import from HR master</button>
          <button className="btn pri" onClick={() => openUserEditor(null)}>+ Create user</button>
        </div>
      </div>
      <div className="card pad mb">
        <div className="row wrap">
          <input className="inp" style={{ maxWidth: 250 }} placeholder="Search name, employee ID, plant…" value={f.q} onChange={(e) => setUserFilters({ q: e.target.value })} />
          <select className="inp" style={{ width: 'auto' }} value={f.role} onChange={(e) => setUserFilters({ role: e.target.value })}>
            <option value="">All roles</option><option>admin</option><option>trainer</option><option>participant</option>
          </select>
          <select className="inp" style={{ width: 'auto' }} value={f.status} onChange={(e) => setUserFilters({ status: e.target.value })}>
            <option value="">Any status</option><option>Active</option><option>Inactive</option>
          </select>
          <div className="grow" /><span className="small muted">{list.length} of {users.length} users</span>
        </div>
      </div>
      <div className="card"><div className="tbl-wrap"><table>
        <thead><tr><th>Employee</th><th>Employee ID</th><th>Role</th><th>Department</th><th>Plant</th><th>Status</th><th>Created</th><th></th></tr></thead>
        <tbody>
          {list.map((u) => (
            <tr key={u.id}>
              <td><div className="row"><div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(u.name)}</div><div><b className="small">{u.name}</b><div className="xs muted">{u.desig}</div></div></div></td>
              <td className="mono small">{u.emp}</td>
              <td><span className={'tag ' + (u.role === 'admin' ? 'r' : u.role === 'trainer' ? 'p' : 'b')}>{u.role}</span></td>
              <td className="small">{u.dept}</td>
              <td className="small">{u.plant}</td>
              <td><StatusTag status={u.status} /></td>
              <td className="small muted">{u.created}</td>
              <td className="right">
                <button className="btn sm" onClick={() => openUserEditor(u.id)}>Edit</button>{' '}
                <button className={'btn sm ' + (u.status === 'Active' ? 'dan' : '')} onClick={() => toggleUserStatus(u.id)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </div>
  );
}
