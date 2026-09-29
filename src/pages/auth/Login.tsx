import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

const DEMO_IDS = ['U1', 'U2', 'U3', 'U4'];

export default function Login() {
  const [empId, setEmpId] = useState('');
  const [err, setErr] = useState('');
  const users = useStore((s) => s.users);
  const setLoginEmp = useStore((s) => s.setLoginEmp);
  const setOtpTries = useStore((s) => s.setOtpTries);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  function sendOtp() {
    const v = empId.trim().toUpperCase();
    const u = users.find((x) => x.emp === v);
    if (!u) { setErr('Employee ID not found. Please check and try again.'); return; }
    if (u.status !== 'Active') { setErr('This account is deactivated. Contact the system administrator.'); return; }
    setLoginEmp(v);
    setOtpTries(0);
    toast('OTP sent to registered mobile ' + u.mobile, 'ok');
    navigate('/otp');
  }

  return (
    <div className="auth">
      <div className="promo">
        <div className="logo" style={{ marginBottom: 26, display: 'flex', gap: 11, alignItems: 'center' }}>
          <div className="logo-mark" style={{ width: 40, height: 40, fontSize: 15 }}>AI</div>
          <b style={{ fontSize: 16 }}>LearnCert Platform</b>
        </div>
        <h1>Product learning,<br />assessment &amp; certification</h1>
        <p>A unified AI-enabled platform for product knowledge, self-assessment, live examination, expert support and digital certification.</p>
        <div className="journey">
          {['Learn', 'Understand', 'Practice', 'Ask AI', 'Ask Expert', 'Assess', 'Certify', 'Analyze'].map((s) => <span key={s}>{s}</span>)}
        </div>
        <div className="feat">
          <div><span>▤</span><div><b style={{ color: '#fff' }}>Slide-based learning</b> — authored by trainers, tracked per participant</div></div>
          <div><span>✦</span><div><b style={{ color: '#fff' }}>Topic-aware AI assistant</b> — answers only from approved content, escalates to experts</div></div>
          <div><span>◉</span><div><b style={{ color: '#fff' }}>Live Kahoot-style examinations</b> — waiting room, randomised questions, live leaderboard</div></div>
          <div><span>❖</span><div><b style={{ color: '#fff' }}>Automatic certification</b> — issued on passing the official examination</div></div>
        </div>
      </div>
      <div className="authbox">
        <div className="authcard">
          <h2 style={{ fontSize: 23 }}>Sign in</h2>
          <p className="muted small mb">Authenticate with your Employee ID. A one-time password will be sent to your registered company mobile number.</p>
          <label className="f">Employee ID <span className="req">*</span></label>
          <input
            className="inp mono"
            placeholder="EMP1001"
            autoComplete="off"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendOtp(); }}
          />
          {err && <div className="hint" style={{ color: 'var(--bad)' }}>{err}</div>}
          <button className="btn pri block lg mt2" onClick={sendOtp}>Send OTP →</button>
          <div className="demo-accounts">
            <div className="xs bold muted" style={{ textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Prototype accounts — click to fill</div>
            {users.filter((u) => DEMO_IDS.includes(u.id)).map((u) => (
              <div key={u.id} className="da" onClick={() => setEmpId(u.emp)}>
                <div><b>{u.name}</b> <span className="muted">· {u.desig}</span></div>
                <span className={'tag ' + (u.role === 'admin' ? 'r' : u.role === 'trainer' ? 'p' : 'b')}>{u.role}</span>
              </div>
            ))}
          </div>
          <div className="xs muted center mt2">Protected by role-based access control · All activity is audit logged</div>
        </div>
      </div>
    </div>
  );
}
