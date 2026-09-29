import { useStore } from '../../store/useStore';

export default function Audit() {
  const audit = useStore((s) => s.audit);
  const userById = useStore((s) => s.userById);
  const filter = useStore((s) => s.auditFilter);
  const setAuditFilter = useStore((s) => s.setAuditFilter);
  const toast = useStore((s) => s.toast);

  const list = filter ? audit.filter((a) => (a.action + a.entity).toLowerCase().includes(filter.toLowerCase())) : audit;

  return (
    <div>
      <div className="spread mb"><h2 style={{ fontSize: 20 }}>Audit trail</h2><button className="btn" onClick={() => toast('Audit log exported to CSV', 'ok')}>⬇ Export</button></div>
      <p className="muted small mb">Every significant action is recorded: logins, user and access changes, content creation and publication, question changes, examination lifecycle events, result publication, certificate generation and expert responses.</p>
      <div className="card pad mb"><input className="inp" style={{ maxWidth: 320 }} placeholder="Filter by action or entity…" value={filter} onChange={(e) => setAuditFilter(e.target.value)} /></div>
      <div className="card"><div className="tbl-wrap"><table>
        <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Entity</th><th>IP address</th></tr></thead>
        <tbody>
          {list.slice(0, 60).map((a) => {
            const u = userById(a.user);
            return (
              <tr key={a.id}>
                <td className="small mono">{a.time}</td>
                <td className="small"><b>{u.name || a.user}</b><div className="xs muted">{u.role || ''}</div></td>
                <td><span className="tag">{a.action}</span></td>
                <td className="small">{a.entity}</td>
                <td className="mono small muted">{a.ip}</td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </div>
  );
}
