import { useStore } from '../../store/useStore';
import { StatusTag } from '../../components/ui/Tags';
import Certificate from '../../components/Certificate';

export default function TrainerCerts() {
  const certs = useStore((s) => s.certs);
  const userById = useStore((s) => s.userById);
  const topicOf = useStore((s) => s.topic);
  const events = useStore((s) => s.events);
  const revokeCert = useStore((s) => s.revokeCert);
  const toast = useStore((s) => s.toast);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);

  function view(id: string) {
    const c = certs.find((x) => x.id === id)!;
    const u = userById(c.user);
    openModal(
      <div className="modal wide">
        <div className="modal-h"><h3>Certificate {id}</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
        <div className="modal-b"><Certificate cert={c} user={u} /></div>
        <div className="modal-f"><button className="btn" onClick={closeModal}>Close</button><button className="btn pri" onClick={() => window.print()}>⎙ Print</button></div>
      </div>
    );
  }

  return (
    <div>
      <div className="spread mb"><h2 style={{ fontSize: 20 }}>Certification</h2><span className="tag g">{certs.length} issued</span></div>
      <p className="muted small mb">Certificates are generated automatically when a participant passes an official examination that has certification enabled. Self-assessment results do not issue certificates.</p>
      <div className="card"><div className="tbl-wrap"><table>
        <thead><tr><th>Certificate ID</th><th>Participant</th><th>Topic</th><th>Examination</th><th className="right">Score</th><th>Issued</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {certs.length ? certs.map((c) => {
            const u = userById(c.user);
            const ev = events.find((e) => e.id === c.event);
            return (
              <tr key={c.id}>
                <td className="mono small">{c.id}</td>
                <td><b className="small">{u.name}</b><div className="xs muted">{u.dept} · {u.plant}</div></td>
                <td className="small">{topicOf(c.topic).name}</td>
                <td className="small muted">{ev ? ev.name : '—'}</td>
                <td className="right bold">{c.score}%</td>
                <td className="small">{c.date}</td>
                <td><StatusTag status={c.status} /></td>
                <td className="right"><button className="btn sm" onClick={() => view(c.id)}>View</button>{' '}
                  <button className="btn sm dan" onClick={() => { revokeCert(c.id); toast('Certificate updated'); }}>Revoke</button></td>
              </tr>
            );
          }) : <tr><td colSpan={8}><div className="empty">No certificates issued yet</div></td></tr>}
        </tbody>
      </table></div></div>
    </div>
  );
}
