import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { QT } from '../../data/questions';

export default function Exam() {
  const exam = useStore((s) => s.exam);
  const currentUser = useStore((s) => s.currentUser)!;
  const pathOf = useStore((s) => s.path);
  const setAnswer = useStore((s) => s.setAnswer);
  const setAnswerTime = useStore((s) => s.setAnswerTime);
  const setExamIndex = useStore((s) => s.setExamIndex);
  const finishExam = useStore((s) => s.finishExam);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  const [left, setLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idxRef = useRef(0);

  const q = exam ? exam.paper[exam.idx] : null;
  const limit = q ? (q.time || (exam?.defTime ?? 30)) : 30;

  useEffect(() => {
    if (!exam) return;
    idxRef.current = exam.idx;
    setLeft(limit);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          clearInterval(timerRef.current!);
          setAnswerTime(idxRef.current, limit);
          toast('Time expired for this question', 'warn');
          advance();
          return 0;
        }
        setAnswerTime(idxRef.current, limit - (l - 1));
        return l - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.idx]);

  function advance() {
    const st = useStore.getState().exam;
    if (!st) return;
    if (st.idx < st.paper.length - 1) setExamIndex(st.idx + 1);
    else submit();
  }

  function submit() {
    if (timerRef.current) clearInterval(timerRef.current);
    finishExam(currentUser.id);
    navigate('/app/participant/result');
  }

  if (!exam) return <Navigate to="/app/participant/dashboard" replace />;
  if (!q) return null;

  const answered = exam.answers.filter((a) => a.a !== null && a.a !== undefined && !(Array.isArray(a.a) && !a.a.length)).length;
  const currentAns = exam.answers[exam.idx].a;

  function pick(i: number) {
    if (q!.type === 'multi') {
      const cur = Array.isArray(currentAns) ? (currentAns as number[]).slice() : [];
      const k = cur.indexOf(i);
      if (k >= 0) cur.splice(k, 1); else cur.push(i);
      setAnswer(exam!.idx, cur);
    } else {
      setAnswer(exam!.idx, i);
    }
  }

  function navQ(d: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    const n = Math.max(0, Math.min(exam!.paper.length - 1, exam!.idx + d));
    setExamIndex(n);
  }

  let body: React.ReactNode;
  if (q.type === 'match' && q.left && q.right) {
    const val: string[] = Array.isArray(currentAns) ? (currentAns as string[]) : [];
    body = q.left.map((l, i) => (
      <div key={i} className="matchrow">
        <div className="opt" style={{ cursor: 'default', margin: 0 }}>{l}</div>
        <select className="inp" value={val[i] || ''} onChange={(e) => {
          const next = q.left!.map((_, k) => val[k] || '');
          next[i] = e.target.value;
          setAnswer(exam!.idx, next);
        }}>
          <option value="">— select —</option>
          {q.right!.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
    ));
  } else if (q.type === 'fill') {
    body = <input className="inp" placeholder="Type your answer…" autoComplete="off" value={(currentAns as string) || ''} onChange={(e) => setAnswer(exam!.idx, e.target.value)} />;
  } else {
    body = (q.dOpts || []).map((o, i) => {
      const on = q.type === 'multi' ? (Array.isArray(currentAns) && (currentAns as number[]).includes(i)) : currentAns === i;
      return (
        <div key={i} className={'opt ' + (on ? 'sel' : '')} onClick={() => pick(i)}>
          <span className="k">{q.type === 'multi' ? (on ? '✓' : '□') : 'ABCDEF'[i]}</span>
          <span>{o}</span>
        </div>
      );
    });
  }

  return (
    <div>
      <div className="examtop">
        <div>
          <b>{exam.name}</b>
          <div className="xs" style={{ color: '#94a3b8' }}>{pathOf(exam.topicId)} · {exam.mode === 'live' ? 'LIVE EXAMINATION' : 'Self assessment'}</div>
        </div>
        <div className="row grow" style={{ maxWidth: 420 }}>
          <span className="small">Q {exam.idx + 1} / {exam.paper.length}</span>
          <div className="tprog"><i style={{ width: (left / limit * 100) + '%' }} /></div>
        </div>
        <div className="row">
          <span className="xs" style={{ color: '#94a3b8' }}>Answered {answered}</span>
          <div className={'timer' + (left <= 5 ? ' crit' : left <= 10 ? ' warn' : '')}>{left}</div>
        </div>
      </div>
      <div className="qbox">
        <div className="row wrap">
          <span className="tag b">{QT[q.type]}</span>
          <span className="tag o">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
          {q.mandatory && <span className="tag r">Mandatory</span>}
          <span className="tag">{q.diff}</span>
          {q.type === 'multi' && <span className="tag p">Select all that apply</span>}
        </div>
        <div className="qtext">{q.text}</div>
        {q.img && <div className="media"><div className="ph"><div style={{ padding: 18 }}><div style={{ fontSize: 26 }}>▦</div><div className="small mt">{q.img}</div></div></div></div>}
        {body}
        <div className="spread mt2">
          <button className="btn" disabled={exam.idx === 0} onClick={() => navQ(-1)}>← Previous</button>
          <div className="row">
            <button className="btn ghost" onClick={() => { setAnswer(exam.idx, null); navQ(1); }}>Skip</button>
            {exam.idx < exam.paper.length - 1
              ? <button className="btn pri" onClick={() => navQ(1)}>Next question →</button>
              : <button className="btn ok" onClick={submit}>Submit examination ✓</button>}
          </div>
        </div>
        <div className="center mt2 small muted">No negative marking · Unanswered questions score zero · Answers are saved as you go</div>
      </div>
    </div>
  );
}
