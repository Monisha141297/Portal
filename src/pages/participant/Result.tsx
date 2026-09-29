import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { QT } from '../../data/questions';
import { ResultTag } from '../../components/ui/Tags';
import type { PreparedQuestion } from '../../types';

function answerText(q: PreparedQuestion, a: unknown): string {
  if (q.type === 'match' && q.left) {
    return Array.isArray(a) ? q.left.map((l, k) => l + ' → ' + ((a as string[])[k] || '—')).join(' · ') : '—';
  }
  if (q.type === 'fill') return (a as string) || '—';
  if (q.type === 'multi') return Array.isArray(a) && (a as number[]).length ? (a as number[]).map((x) => q.dOpts![x]).join(' · ') : '—';
  return a != null && q.dOpts ? q.dOpts[a as number] : '—';
}
function correctText(q: PreparedQuestion): string {
  if (q.type === 'match' && q.pairs) return q.pairs.map((p) => p[0] + ' → ' + p[1]).join(' · ');
  if (q.type === 'fill') return (q.ans as string[]).join(' / ');
  return (q.dAns || []).map((x) => q.dOpts![x]).join(' · ');
}

export default function Result() {
  const exam = useStore((s) => s.exam);
  const pathOf = useStore((s) => s.path);
  const navigate = useNavigate();
  const [openRows, setOpenRows] = useState<Set<number>>(new Set());

  if (!exam || !exam.rows) return <Navigate to="/app/participant/dashboard" replace />;
  const E = exam;
  const rows = exam.rows;
  const c = rows.filter((r) => r.state === 'c').length;
  const w = rows.filter((r) => r.state === 'w').length;
  const u = rows.filter((r) => r.state === 'u').length;
  const pass = E.result === 'Pass';
  const weak: Record<string, number> = {};
  rows.filter((r) => r.state !== 'c').forEach((r) => { weak[r.q.topic] = (weak[r.q.topic] || 0) + 1; });

  function toggle(i: number) {
    setOpenRows((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }

  return (
    <div>
      <div className="card mb">
        <div className="resulthero">
          <div className="score-ring" style={{ background: `conic-gradient(${pass ? '#059669' : '#dc2626'} ${E.pct! * 3.6}deg, #e2e8f0 0)` }}>
            <div className="in" style={{ display: 'flex' }}><b>{E.pct}%</b><span className="xs muted">{E.earned} / {E.total} marks</span></div>
          </div>
          <h2 style={{ fontSize: 24 }}>{pass ? 'Congratulations — you passed' : 'Not passed this time'}</h2>
          <div className="muted small mt">{E.name} · {pathOf(E.topicId)}</div>
          <div className="row mt2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <ResultTag result={E.result!} />
            <span className="tag">Pass mark {E.pass}%</span>
            <span className="tag">Time taken {E.timeTaken}</span>
            <span className="tag">{E.paper.length} questions</span>
            {E.mode === 'live' ? <span className="tag p">Official examination</span> : <span className="tag b">Self assessment</span>}
          </div>
          {E.cert && (
            <div className="card pad mt2" style={{ maxWidth: 520, margin: '20px auto 0', background: 'var(--ok-soft)', borderColor: '#a7f3d0' }}>
              <b>❖ Certificate issued</b>
              <div className="small mt">Certificate <b className="mono">{E.cert}</b> has been generated and added to your profile.</div>
              <button className="btn ok mt" onClick={() => navigate(`/app/participant/certs/${E.cert}`)}>View certificate →</button>
            </div>
          )}
          {E.mode === 'live' && !pass && <div className="small muted mt2">A certificate is issued only on passing the official examination. You may continue to practise with unlimited self assessments.</div>}
        </div>
      </div>

      <div className="grid g4 mb">
        <div className="kpi g"><div className="lab">Correct</div><div className="val">{c}</div><div className="sub">{Math.round((c / rows.length) * 100)}% of questions</div></div>
        <div className="kpi r"><div className="lab">Incorrect</div><div className="val">{w}</div><div className="sub">0 marks each</div></div>
        <div className="kpi o"><div className="lab">Unanswered</div><div className="val">{u}</div><div className="sub">0 marks each</div></div>
        <div className="kpi b"><div className="lab">Marks achieved</div><div className="val">{E.earned}</div><div className="sub">out of {E.total}</div></div>
      </div>

      {!pass && (
        <div className="card mb" style={{ borderLeft: '3px solid var(--warn)' }}>
          <div className="card-b">
            <b>📚 Learning recommendation</b>
            <p className="small muted">Your score of {E.pct}% is below the {E.pass}% pass mark. Before your next attempt, revisit:</p>
            <ul className="small">{Object.keys(weak).map((t) => <li key={t}><b>{pathOf(t).split(' → ').pop()}</b> — {weak[t]} question(s) answered incorrectly or left unanswered</li>)}</ul>
            <div className="row mt">
              <button className="btn pri sm" onClick={() => navigate(`/app/participant/viewer/${E.topicId}`)}>Revisit learning content</button>
              <button className="btn sm" onClick={() => useStore.getState().openAI(E.topicId)}>✦ Ask the AI assistant</button>
              <button className="btn sm" onClick={() => navigate('/app/participant/assess')}>Retake assessment</button>
            </div>
            <div className="xs muted mt">There is no limit on the number of self-assessment attempts.</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-h">
          <h3>Question-wise analysis</h3>
          <div className="row"><span className="tag g">{c} correct</span><span className="tag r">{w} wrong</span><span className="tag">{u} unanswered</span></div>
        </div>
        <div className="card-b">
          {rows.map((r, i) => (
            <div key={i} className={'qa' + (openRows.has(i) ? ' open' : '')}>
              <div className="hd" onClick={() => toggle(i)}>
                <span className={'mark ' + r.state}>{r.state === 'c' ? '✓' : r.state === 'w' ? '✕' : '−'}</span>
                <div className="grow">
                  <b className="small">Q{i + 1}. {r.q.text.slice(0, 110)}{r.q.text.length > 110 ? '…' : ''}</b>
                  <div className="xs muted">{QT[r.q.type]} · {r.q.marks} mark(s) · {r.t}s taken{r.q.mandatory ? ' · mandatory' : ''}</div>
                </div>
                <b className="small">{r.earned} / {r.q.marks}</b><span className="muted">▾</span>
              </div>
              <div className="bd">
                <div className="small"><b>Your answer:</b> <span style={{ color: r.state === 'c' ? 'var(--ok)' : 'var(--bad)' }}>{answerText(r.q, r.a)}</span></div>
                {r.state !== 'c' && <div className="small mt"><b>Correct answer:</b> <span style={{ color: 'var(--ok)' }}>{correctText(r.q)}</span></div>}
                {r.q.explain && <div className="explain small mt">{r.q.explain}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="row mt2">
        {E.eventId && <button className="btn pri" onClick={() => navigate(`/app/participant/leaderboard/${E.eventId}`)}>View leaderboard →</button>}
        <button className="btn" onClick={() => navigate('/app/participant/history')}>Attempt history</button>
        <button className="btn" onClick={() => navigate('/app/participant/assess')}>Practise again</button>
        <button className="btn ghost" onClick={() => navigate('/app/participant/dashboard')}>Back to dashboard</button>
      </div>
    </div>
  );
}
