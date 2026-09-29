import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { QT } from '../../data/questions';
import type { Question, QuestionType } from '../../types';

export function openQuestionEditor(id: string | null, defaultTopic: string) {
  useStore.getState().openModal(<QuestionEditorModal id={id} defaultTopic={defaultTopic} />);
}

export function QuestionEditorModal({ id, defaultTopic }: { id: string | null; defaultTopic: string }) {
  const questions = useStore((s) => s.questions);
  const topics = useStore((s) => s.topics);
  const productOf = useStore((s) => s.productOf);
  const saveQuestion = useStore((s) => s.saveQuestion);
  const closeModal = useStore((s) => s.closeModal);
  const toast = useStore((s) => s.toast);

  const existing = id ? questions.find((q) => q.id === id) : null;
  const [topic, setTopic] = useState(existing?.topic || defaultTopic);
  const [type, setType] = useState<QuestionType>(existing?.type || 'single');
  const [text, setText] = useState(existing?.text || '');
  const [opts, setOpts] = useState<string[]>(existing?.opts?.length ? existing.opts : ['', '', '', '']);
  const [correct, setCorrect] = useState<number[]>((existing?.ans as number[]) || []);
  const [marks, setMarks] = useState(existing?.marks ?? 1);
  const [time, setTime] = useState<string>(existing?.time ? String(existing.time) : '');
  const [mandatory, setMandatory] = useState(existing?.mandatory ?? false);
  const [diff, setDiff] = useState<Question['diff']>(existing?.diff || 'Medium');
  const [status, setStatus] = useState<Question['status']>(existing?.status || 'Active');
  const [explain, setExplain] = useState(existing?.explain || '');

  function toggleAns(i: number) {
    if (type === 'multi') {
      setCorrect((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
    } else {
      setCorrect([i]);
    }
  }

  function submit() {
    const trimmedText = text.trim();
    if (!trimmedText) { toast('Question text is required', 'bad'); return; }
    const cleanOpts = opts.map((o) => o.trim()).filter((x) => x !== '');
    if (type !== 'fill' && !correct.length) { toast('Select at least one correct answer', 'bad'); return; }
    saveQuestion(id, {
      topic, type, text: trimmedText, opts: cleanOpts,
      ans: type === 'fill' ? cleanOpts.map((x) => x.toLowerCase()) : correct,
      marks: marks || 1, time: time ? +time : null, mandatory, diff, status, explain,
    });
    closeModal();
    toast('Question saved', 'ok');
  }

  return (
    <div className="modal wide">
      <div className="modal-h"><h3>{id ? 'Edit' : 'New'} question</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
      <div className="modal-b">
        <div className="fieldrow">
          <div><label className="f">Topic</label>
            <select className="inp" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => <option key={t.id} value={t.id}>{productOf(t.id).name} → {t.name}</option>)}
            </select>
          </div>
          <div><label className="f">Question type</label>
            <select className="inp" value={type} onChange={(e) => { setType(e.target.value as QuestionType); setCorrect([]); useStore.getState().toast('Change the type, then re-enter the options below'); }}>
              {Object.keys(QT).map((k) => <option key={k} value={k}>{QT[k]}</option>)}
            </select>
          </div>
        </div>
        <label className="f mt">Question text <span className="req">*</span></label>
        <textarea className="inp" placeholder="Enter the question…" value={text} onChange={(e) => setText(e.target.value)} />
        <label className="f mt">Answer options — tick the correct answer(s)</label>
        <div>
          {opts.map((o, i) => (
            <div key={i} className="row mb">
              <input type={type === 'multi' ? 'checkbox' : 'radio'} checked={correct.includes(i)} onChange={() => toggleAns(i)} style={{ width: 18, height: 18 }} />
              <input className="inp" value={o} placeholder={'Option ' + (i + 1)} onChange={(e) => { const next = opts.slice(); next[i] = e.target.value; setOpts(next); }} />
            </div>
          ))}
        </div>
        <div className="hint">For Fill in the Blank, enter accepted answers in the option fields and tick none. For Match the Following, use the pairs editor in the live system.</div>
        <div className="fieldrow mt">
          <div><label className="f">Marks / weightage</label><input className="inp" type="number" min={1} value={marks} onChange={(e) => setMarks(+e.target.value)} /></div>
          <div><label className="f">Individual time limit (seconds)</label><input className="inp" type="number" value={time} placeholder="Leave blank to use the topic default" onChange={(e) => setTime(e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Difficulty</label>
            <select className="inp" value={diff} onChange={(e) => setDiff(e.target.value as Question['diff'])}>
              <option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
          <div><label className="f">Status</label>
            <select className="inp" value={status} onChange={(e) => setStatus(e.target.value as Question['status'])}>
              <option>Active</option><option>Archived</option>
            </select>
          </div>
        </div>
        <label className="f mt"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /> Mandatory — always included in every generated paper</label>
        <label className="f mt">Explanation shown after the assessment</label>
        <textarea className="inp" value={explain} onChange={(e) => setExplain(e.target.value)} />
      </div>
      <div className="modal-f"><button className="btn" onClick={closeModal}>Cancel</button><button className="btn pri" onClick={submit}>Save question</button></div>
    </div>
  );
}
