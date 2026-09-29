import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import type { ExamEvent, EventStatus } from '../../types';

export function openExamEditor(id: string | null) {
  useStore.getState().openModal(<ExamEditorModal id={id} />);
}

function randomCode() { return String(Math.floor(100000 + Math.random() * 900000)); }

function ExamEditorModal({ id }: { id: string | null }) {
  const events = useStore((s) => s.events);
  const topics = useStore((s) => s.topics);
  const users = useStore((s) => s.users);
  const productOf = useStore((s) => s.productOf);
  const qOf = useStore((s) => s.qOf);
  const saveExam = useStore((s) => s.saveExam);
  const closeModal = useStore((s) => s.closeModal);
  const toast = useStore((s) => s.toast);
  const currentUser = useStore((s) => s.currentUser)!;
  const navigate = useNavigate();

  const existing = id ? events.find((e) => e.id === id) : null;
  const [name, setName] = useState(existing?.name || '');
  const [topic, setTopic] = useState(existing?.topic || 'T1');
  const [code, setCode] = useState(existing?.code || randomCode());
  const [count, setCount] = useState(existing?.count ?? 20);
  const [pass, setPass] = useState(existing?.pass ?? 80);
  const [defTime, setDefTime] = useState(existing?.defTime ?? 30);
  const [type, setType] = useState<ExamEvent['type']>(existing?.type || 'Private');
  const [date, setDate] = useState(existing?.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(existing?.time || '16:00');
  const [parts, setParts] = useState<string[]>(existing?.parts || []);
  const [lb, setLb] = useState(existing?.lb ?? true);
  const [res, setRes] = useState(existing?.res ?? true);
  const [cert, setCert] = useState(existing?.cert ?? true);

  const bank = qOf(topic);
  const mand = bank.filter((q) => q.mandatory).length;
  const invalid = mand > count;
  const participantUsers = users.filter((u) => u.role === 'participant');

  function togglePart(uid: string) {
    setParts((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  }

  function submit(status: EventStatus) {
    if (!name.trim()) { toast('Examination name is required', 'bad'); return; }
    if (mand > count) { toast(`Cannot publish: ${mand} mandatory questions exceed the configured count of ${count}`, 'bad'); return; }
    const ev = saveExam(id, {
      name, topic, code, type, date, time, count, pass, defTime, status, lb, res, cert,
      parts: type === 'Open' ? [] : parts, by: currentUser.id,
    });
    closeModal();
    toast('Examination saved (' + status + ')', 'ok');
    if (status === 'Waiting') { useStore.getState().auditLog('Examination start', 'Examination ' + ev.id); navigate(`/app/trainer/live/${ev.id}`); }
    else navigate('/app/trainer/exams');
  }

  return (
    <div className="modal wide">
      <div className="modal-h"><h3>{id ? 'Edit' : 'Create'} examination</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
      <div className="modal-b">
        <div className="row mb" style={{ gap: 18 }}>
          {['Details', 'Questions', 'Participants', 'Visibility'].map((s, i) => (
            <div key={s} className={'step ' + (i === 0 ? 'on' : 'done')}><span className="n">{i + 1}</span>{s}</div>
          ))}
        </div>
        <label className="f">Examination name <span className="req">*</span></label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Supergrade PPC — Product Knowledge Certification" />
        <div className="fieldrow mt">
          <div><label className="f">Topic</label>
            <select className="inp" value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((t) => <option key={t.id} value={t.id}>{productOf(t.id).name} → {t.name}</option>)}
            </select>
          </div>
          <div><label className="f">Event code</label><input className="inp mono" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} /></div>
        </div>
        <div className="hint">
          {invalid
            ? <span style={{ color: 'var(--bad)' }}><b>⚠ Invalid configuration:</b> this topic has {mand} mandatory questions but only {count} are configured. The examination cannot be published until this is corrected.</span>
            : <>Bank contains <b>{bank.length}</b> active questions. This paper will include <b>{mand} mandatory</b> + <b>{count - mand} randomly selected</b> questions, randomised per participant.</>}
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Number of questions</label><input className="inp" type="number" value={count} onChange={(e) => setCount(+e.target.value)} /></div>
          <div><label className="f">Pass percentage</label><input className="inp" type="number" value={pass} onChange={(e) => setPass(+e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Default time per question (seconds)</label><input className="inp" type="number" value={defTime} onChange={(e) => setDefTime(+e.target.value)} /></div>
          <div><label className="f">Examination mode</label>
            <select className="inp" value={type} onChange={(e) => setType(e.target.value as ExamEvent['type'])}>
              <option>Private</option><option>Open</option>
            </select>
          </div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Date</label><input className="inp" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="f">Start time</label><input className="inp" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
        </div>
        {type !== 'Open' && (
          <div>
            <label className="f mt">Select participants</label>
            <div className="card pad" style={{ maxHeight: 170, overflow: 'auto', background: 'var(--panel-2)' }}>
              {participantUsers.map((u) => (
                <label key={u.id} className="row small" style={{ padding: '3px 0' }}>
                  <input type="checkbox" checked={parts.includes(u.id)} onChange={() => togglePart(u.id)} /> {u.name} <span className="muted xs">{u.emp} · {u.dept} · {u.plant}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="card pad mt" style={{ background: 'var(--panel-2)' }}>
          <b className="small">Visibility &amp; certification</b>
          <label className="row small mt"><input type="checkbox" checked={lb} onChange={(e) => setLb(e.target.checked)} /> Show leaderboard to participants</label>
          <label className="row small"><input type="checkbox" checked={res} onChange={(e) => setRes(e.target.checked)} /> Publish results to participants immediately</label>
          <label className="row small"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} /> Issue a certificate to participants who pass</label>
        </div>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={closeModal}>Cancel</button>
        <button className="btn" onClick={() => submit('Draft')}>Save as draft</button>
        <button className="btn pri" onClick={() => submit('Scheduled')}>Schedule</button>
        <button className="btn ok" onClick={() => submit('Waiting')}>Start immediately →</button>
      </div>
    </div>
  );
}
