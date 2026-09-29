import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const OTHERS = ['Karthik Subramanian', 'Priya Venkatesan', 'Rajesh Kumar', 'Deepa Nair', 'Anitha Selvam', 'Mohammed Irfan', 'Suresh Babu', 'Lakshmi Narayan'];

export default function Wait() {
  const { eventId } = useParams();
  const currentUser = useStore((s) => s.currentUser)!;
  const events = useStore((s) => s.events);
  const pathOf = useStore((s) => s.path);
  const leaveWait = useStore((s) => s.leaveWait);
  const launchExam = useStore((s) => s.launchExam);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [joinedOthers, setJoinedOthers] = useState<string[]>([]);
  const [live, setLive] = useState(false);
  const kRef = useRef(0);

  const ev = events.find((e) => e.id === eventId);

  useEffect(() => {
    const iv = setInterval(() => {
      const current = events.find((e) => e.id === eventId);
      if (!current) return;
      if (kRef.current < OTHERS.length && current.status !== 'Live' && kRef.current < 5) {
        setJoinedOthers((prev) => [...prev, OTHERS[kRef.current]]);
        kRef.current++;
      }
      if (current.status === 'Live' || kRef.current >= 5) {
        if (current.status !== 'Live') useStore.getState().startLive(eventId!);
        clearInterval(iv);
        setLive(true);
      }
    }, 1200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  if (!ev) return <Navigate to="/app/participant/events" replace />;

  function enter() {
    const err = launchExam(ev!.topic, 'live', ev!.id, currentUser.id);
    if (err) { toast(err, 'bad'); return; }
    navigate('/app/participant/exam');
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(150deg,#0f1c33,#14294b)', color: '#fff', display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        <div className="center">
          <div className="tag b" style={{ background: 'rgba(255,255,255,.14)', color: '#fff', borderColor: 'transparent' }}>Waiting room</div>
          <h1 style={{ fontSize: 28, margin: '14px 0 6px' }}>{ev.name}</h1>
          <div style={{ color: '#a9bcd6' }}>{pathOf(ev.topic)}</div>
          <div className="row" style={{ justifyContent: 'center', margin: '18px 0', flexWrap: 'wrap' }}>
            {[`Event code ${ev.code}`, `${ev.count} questions`, `${ev.defTime}s per question`, `Pass ${ev.pass}%`, ev.cert ? '❖ Certification enabled' : null]
              .filter(Boolean).map((t, i) => <span key={i} className="tag" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'transparent' }}>{t}</span>)}
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 14, padding: 20 }}>
          <div className="spread mb"><b>Participants joined</b><span className="tag" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', borderColor: 'transparent' }}>{joinedOthers.length + 1}</span></div>
          <div className="waitgrid">
            <div className="wchip" style={{ background: 'rgba(255,255,255,.14)', borderColor: 'transparent', color: '#fff' }}><span className="pulse-dot" />{currentUser.name} (you)</div>
            {joinedOthers.map((n) => <div key={n} className="wchip" style={{ background: 'rgba(255,255,255,.08)', borderColor: 'transparent', color: '#dbeafe' }}><span className="pulse-dot" />{n}</div>)}
          </div>
        </div>
        <div className="center" style={{ marginTop: 22 }}>
          {live ? (
            <>
              <div style={{ color: '#4ade80' }}><b>✓ The trainer has started the examination</b></div>
              <div style={{ marginTop: 16 }}><button className="btn ok lg" onClick={enter}>Enter examination →</button></div>
            </>
          ) : <div style={{ color: '#a9bcd6' }}>⏳ Waiting for the trainer to start the examination…</div>}
          <button className="btn ghost" style={{ color: '#93c5fd', marginTop: 10 }} onClick={() => { leaveWait(ev.id, currentUser.id); navigate('/app/participant/events'); }}>Leave waiting room</button>
        </div>
      </div>
    </div>
  );
}
