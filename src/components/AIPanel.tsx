import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { useLocation } from 'react-router-dom';

const SUGGESTIONS = ['Explain this in simple terms', 'What is the difference between PPC and OPC?', 'Why is curing longer?', 'Give me an example'];

export default function AIPanel() {
  const currentUser = useStore((s) => s.currentUser);
  const ai = useStore((s) => s.ai);
  const closeAI = useStore((s) => s.closeAI);
  const openAI = useStore((s) => s.openAI);
  const aiSend = useStore((s) => s.aiSend);
  const aiPushMessage = useStore((s) => s.aiPushMessage);
  const pathOf = useStore((s) => s.path);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const submitExpertQuestion = useStore((s) => s.submitExpertQuestion);
  const toast = useStore((s) => s.toast);
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [ai.msgs]);

  if (!currentUser || currentUser.role !== 'participant') return null;
  if (location.pathname.includes('/exam') || location.pathname.includes('/wait')) return null;

  const t = ai.topic || 'T1';

  function send(text: string) {
    if (!text.trim()) return;
    aiSend(t, text);
    setInput('');
  }

  function askExpert(aiText: string, myQuestion: string) {
    setNote('');
    openModal(
      <div className="modal">
        <div className="modal-h"><h3>Ask an Expert</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
        <div className="modal-b">
          <p className="muted small">Your question and the AI conversation will be sent to the trainer responsible for this topic.</p>
          <div className="card pad mb" style={{ background: 'var(--panel-2)' }}>
            <div className="xs muted">Topic context</div><b className="small">{pathOf(t)}</b>
            <div className="xs muted mt">Your question</div><div className="small">{myQuestion || '(no question captured)'}</div>
            <div className="xs muted mt">AI response</div><div className="small muted">{aiText.slice(0, 260)}…</div>
          </div>
          <label className="f">Add anything the expert should know (optional)</label>
          <textarea className="inp" placeholder="e.g. the consultant wants a documented standard reference" onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="modal-f">
          <button className="btn" onClick={closeModal}>Cancel</button>
          <button className="btn pri" onClick={() => {
            submitExpertQuestion(currentUser!.id, t, myQuestion, aiText, note);
            closeModal();
            toast('Question submitted to the expert queue', 'ok');
          }}>Submit to expert →</button>
        </div>
      </div>
    );
  }

  if (!ai.open) {
    return <button className="aifab" title="Ask the AI learning assistant" onClick={() => openAI()}>✦</button>;
  }

  return (
    <div className="aipanel">
      <div className="aihead">
        <div className="spread"><b>✦ AI Learning Assistant</b><button className="btn ghost sm" style={{ color: '#fff' }} onClick={closeAI}>✕</button></div>
        <div className="aictx">Topic context: {pathOf(t)}</div>
      </div>
      <div className="aibody" ref={bodyRef}>
        {ai.msgs.map((m, i) => {
          if (m.r === 'sys') return <div key={i} className="msg sys">{m.t}</div>;
          const priorUser = (() => {
            for (let k = i - 1; k >= 0; k--) if (ai.msgs[k].r === 'me') return ai.msgs[k].t;
            return '';
          })();
          return (
            <div key={i} className={'msg ' + (m.r === 'me' ? 'me' : 'ai')}>
              {m.t}
              {m.r === 'ai' && i > 0 && (
                <div className="row" style={{ marginTop: 9, gap: 6 }}>
                  <button className="chip" onClick={() => { aiPushMessage({ r: 'sys', t: 'Marked as resolved — this improves AI resolution rate analytics.' }); toast('Thanks — feedback recorded', 'ok'); }}>👍 That helps</button>
                  <button className="chip" style={{ borderColor: '#fca5a5', color: '#b91c1c' }} onClick={() => askExpert(m.t, priorUser)}>Not satisfied — Ask an Expert</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="aifoot">
        <div className="chips">
          {SUGGESTIONS.map((c) => <button key={c} className="chip" onClick={() => send(c)}>{c}</button>)}
        </div>
        <div className="row">
          <input className="inp" placeholder="Ask about this topic…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(input); }} />
          <button className="btn pri" onClick={() => send(input)}>Send</button>
        </div>
        <div className="xs muted center" style={{ marginTop: 6 }}>Answers are restricted to approved content for the selected topic</div>
      </div>
    </div>
  );
}
