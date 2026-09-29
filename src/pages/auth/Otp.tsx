import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { mmss } from '../../lib/helpers';
import { HOME_ROUTE } from '../../components/layout/navConfig';

export default function Otp() {
  const loginEmp = useStore((s) => s.loginEmp);
  const users = useStore((s) => s.users);
  const otpTries = useStore((s) => s.otpTries);
  const setOtpTries = useStore((s) => s.setOtpTries);
  const loginAs = useStore((s) => s.loginAs);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const u = users.find((x) => x.emp === loginEmp);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [left, setLeft] = useState(299);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (left <= 0) { setErr('OTP expired. Please request a new one.'); return; }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  if (!u) return <Navigate to="/login" replace />;

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, '').slice(-1);
    const next = digits.slice();
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) inputs.current[i + 1]?.focus();
    if (i === 5 && clean && next.every((d) => d)) verify(next);
  }
  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  }
  function fillOtp() {
    setDigits(['1', '2', '3', '4', '5', '6']);
  }
  function verify(codeArr?: string[]) {
    const code = (codeArr || digits).join('');
    if (code.length < 6) { setErr('Please enter all 6 digits.'); return; }
    if (code !== '123456') {
      const tries = otpTries + 1;
      setOtpTries(tries);
      if (tries >= 3) { toast('Too many invalid attempts. Please sign in again.', 'bad'); navigate('/login'); return; }
      setErr('Invalid OTP. ' + (3 - tries) + ' attempt(s) remaining.');
      setDigits(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
      return;
    }
    loginAs(u!.id);
    toast('Welcome, ' + u!.name.split(' ')[0] + '!', 'ok');
    navigate(HOME_ROUTE[u!.role]);
  }

  return (
    <div className="auth">
      <div className="promo">
        <div className="logo" style={{ marginBottom: 26, display: 'flex', gap: 11, alignItems: 'center' }}>
          <div className="logo-mark" style={{ width: 40, height: 40, fontSize: 15 }}>AI</div>
          <b style={{ fontSize: 16 }}>LearnCert Platform</b>
        </div>
        <h1>One-time password<br />verification</h1>
        <p>For security, OTPs expire after 5 minutes and are limited to 3 verification attempts. All login activity is recorded in the audit trail.</p>
      </div>
      <div className="authbox">
        <div className="authcard">
          <h2 style={{ fontSize: 23 }}>Enter OTP</h2>
          <p className="muted small mb">A 6-digit code was sent to <b>{u.mobile}</b> for <b>{u.name}</b>.</p>
          <div className="otpwrap">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                maxLength={1}
                inputMode="numeric"
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
              />
            ))}
          </div>
          {err && <div className="hint" style={{ color: 'var(--bad)' }}>{err}</div>}
          <div className="spread mt"><span className="small muted">Expires in <b>{mmss(Math.max(0, left))}</b></span>
            <a className="small" onClick={() => toast('A new OTP has been sent', 'ok')} style={{ cursor: 'pointer' }}>Resend OTP</a></div>
          <button className="btn pri block lg mt2" onClick={() => verify()}>Verify &amp; sign in →</button>
          <button className="btn ghost block mt" onClick={() => navigate('/login')}>← Use a different Employee ID</button>
          <div className="demo-accounts center">
            <div className="small">Prototype OTP: <b className="mono" style={{ fontSize: 15 }}>123456</b>
              <button className="btn sm" style={{ marginLeft: 8 }} onClick={fillOtp}>Auto-fill</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
