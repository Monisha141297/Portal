import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { StatusTag } from '../../components/ui/Tags';
import { initials } from '../../lib/helpers';

export default function TrainerExpert() {
  const expertQs = useStore((s) => s.expertQs);
  const userById = useStore((s) => s.userById);
  const pathOf = useStore((s) => s.path);
  const currentUser = useStore((s) => s.currentUser)!;
  const answerExpert = useStore((s) => s.answerExpert);
  const assignExpert = useStore((s) => s.assignExpert);
  const closeExpert = useStore((s) => s.closeExpert);
  const publishToKB = useStore((s) => s.publishToKB);
  const toast = useStore((s) => s.toast);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const xs = expertQs;

  return (
    <div>
      <div className="spread mb">
        <h2 style={{ fontSize: 20 }}>Expert questions</h2>
        <div className="row">
          <span className="tag o">{xs.filter((x) => x.status === 'Raised').length} raised</span>
          <span className="tag g">{xs.filter((x) => x.status === 'Answered').length} answered</span>
        </div>
      </div>
      <p className="muted small mb">Questions escalated by participants when the AI response was not sufficient. The original AI conversation is attached for context.</p>
      {xs.length ? xs.map((x) => {
        const u = userById(x.user);
        return (
          <div key={x.id} className="card mb">
            <div className="card-h">
              <div className="row">
                <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>{initials(u.name)}</div>
                <div><b>{u.name}</b><div className="xs muted">{u.dept} · {u.plant} · {x.date}</div></div>
              </div>
              <StatusTag status={x.status} />
            </div>
            <div className="card-b">
              <div className="row wrap mb"><span className="tag b">{pathOf(x.topic)}</span></div>
              <div className="small bold">Participant question</div><p className="small">{x.q}</p>
              {x.note && <><div className="small bold">Additional note</div><p className="small muted">{x.note}</p></>}
              <div className="small bold">AI response given</div>
              <div className="small muted" style={{ background: 'var(--panel-2)', padding: 10, borderRadius: 8 }}>{x.ai}</div>
              {x.status === 'Answered' ? (
                <>
                  <div className="small bold mt">Your response</div>
                  <div className="small" style={{ background: 'var(--ok-soft)', padding: 10, borderRadius: 8, borderLeft: '3px solid var(--ok)' }}>{x.resp}</div>
                  <div className="row mt">
                    <button className="btn sm" onClick={() => { publishToKB(x.id); toast('Clarification added to the approved AI knowledge for this topic', 'ok'); }}>＋ Publish into approved knowledge</button>
                    <button className="btn sm" onClick={() => closeExpert(x.id)}>Close question</button>
                  </div>
                </>
              ) : (
                <div className="mt">
                  <label className="f">Expert response</label>
                  <textarea className="inp" placeholder="Answer the participant…" value={drafts[x.id] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [x.id]: e.target.value }))} />
                  <div className="row mt">
                    <button className="btn pri" onClick={() => {
                      const v = (drafts[x.id] || '').trim();
                      if (!v) { toast('Enter a response', 'bad'); return; }
                      answerExpert(x.id, v, currentUser.name);
                      toast('Response sent to the participant', 'ok');
                    }}>Send response &amp; mark answered</button>
                    <button className="btn" onClick={() => { assignExpert(x.id, 'Vignesh Raman'); toast('Assigned to Vignesh Raman'); }}>Assign to another expert</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }) : <div className="card"><div className="empty"><div className="big">✆</div>No expert questions</div></div>}
    </div>
  );
}
