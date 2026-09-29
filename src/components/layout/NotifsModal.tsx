import { useEffect } from 'react';
import { useStore } from '../../store/useStore';

export default function NotifsModal({ onClose }: { onClose: () => void }) {
  const notifs = useStore((s) => s.notifs);
  const markNotifsRead = useStore((s) => s.markNotifsRead);
  useEffect(() => { markNotifsRead(); }, [markNotifsRead]);
  return (
    <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 470 }}>
        <div className="modal-h"><h3>Notifications</h3><button className="btn ghost" onClick={onClose}>✕</button></div>
        <div className="modal-b" style={{ padding: 0 }}>
          {notifs.length ? notifs.map((n) => (
            <div key={n.id} style={{ padding: '13px 18px', borderBottom: '1px solid var(--line)' }}>
              <div>{n.txt}</div>
              <div className="xs muted mt" style={{ marginTop: 4 }}>{n.time}</div>
            </div>
          )) : <div className="empty">No notifications</div>}
        </div>
      </div>
    </div>
  );
}
