import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { progressOf } from '../../lib/selectors';

export default function Assess() {
  const topics = useStore((s) => s.topics);
  const attempts = useStore((s) => s.attempts);
  const currentUser = useStore((s) => s.currentUser)!;
  const progress = useStore((s) => s.progress);
  const slidesMap = useStore((s) => s.slides);
  const progOf = (uid: string, tid: string) => progressOf(progress, uid, tid, (slidesMap[tid] || []).length);
  const pathOf = useStore((s) => s.path);
  const qOf = useStore((s) => s.qOf);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const launchExam = useStore((s) => s.launchExam);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  function start(topicId: string) {
    const tp = topics.find((t) => t.id === topicId)!;
    const bank = qOf(topicId);
    const mand = bank.filter((q) => q.mandatory).length;
    const att = attempts.filter((a) => a.user === currentUser.id && a.topic === topicId);
    openModal(
      <div className="modal">
        <div className="modal-h"><h3>Self Assessment — {tp.name}</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
        <div className="modal-b">
          <div className="muted small mb">{pathOf(topicId)}</div>
          <div className="grid g2 mb">
            <div className="kpi b"><div className="lab">Questions</div><div className="val">{tp.examCount}</div><div className="sub">{mand} mandatory + {tp.examCount - mand} random from {bank.length}</div></div>
            <div className="kpi o"><div className="lab">Time per question</div><div className="val">{tp.defTime}s</div><div className="sub">Some questions override this</div></div>
            <div className="kpi g"><div className="lab">Pass mark</div><div className="val">{tp.pass}%</div><div className="sub">No negative marking</div></div>
            <div className="kpi p"><div className="lab">Your attempts</div><div className="val">{att.length}</div><div className="sub">Unlimited retakes allowed</div></div>
          </div>
          <div className="card pad" style={{ background: 'var(--panel-2)' }}>
            <b className="small">Rules</b>
            <ul className="small muted" style={{ margin: '7px 0 0', paddingLeft: 18 }}>
              <li>Questions and answer options are randomised for every attempt</li>
              <li>Each question has its own countdown; when it expires the paper moves on automatically</li>
              <li>Correct answer = configured marks · Wrong or unanswered = 0 marks</li>
              <li>Your result and question-wise analysis are shown immediately</li>
            </ul>
          </div>
        </div>
        <div className="modal-f">
          <button className="btn" onClick={closeModal}>Cancel</button>
          <button className="btn pri" onClick={() => {
            closeModal();
            const err = launchExam(topicId, 'self', null, currentUser.id);
            if (err) { toast(err, 'bad'); return; }
            navigate('/app/participant/exam');
          }}>Start assessment →</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">Self Assessment</h2>
      <p className="muted small mb">Unlimited attempts. Questions are randomly drawn from the topic question bank, mandatory questions are always included, and every attempt is recorded.</p>
      <div className="grid g3">
        {topics.filter((t) => t.status === 'Published').map((t) => {
          const att = attempts.filter((a) => a.user === currentUser.id && a.topic === t.id);
          const best = att.length ? Math.max(...att.map((a) => a.pct)) : null;
          const pr = progOf(currentUser.id, t.id);
          return (
            <div key={t.id} className="card">
              <div className="card-b">
                <div className="spread"><b>{t.name}</b>{best != null && <span className={'tag ' + (best >= t.pass ? 'g' : 'o')}>Best {best}%</span>}</div>
                <div className="xs muted mb">{pathOf(t.id)}</div>
                <div className="row xs muted mb"><span className="tag">{t.examCount} questions</span><span className="tag">Pass {t.pass}%</span><span className="tag">{t.defTime}s / question</span></div>
                <div className="xs muted">Learning progress</div>
                <Bar pct={pr.pct} cls={pr.pct === 100 ? 'g' : ''} />
                <div className="row mt">
                  <button className="btn sm" onClick={() => navigate(`/app/participant/viewer/${t.id}`)}>Learn</button>
                  <button className="btn sm pri grow" style={{ justifyContent: 'center' }} onClick={() => start(t.id)}>Start assessment</button>
                </div>
                {att.length > 0 && <div className="xs muted mt" style={{ marginTop: 8 }}>{att.length} previous attempt(s) · <a onClick={() => navigate('/app/participant/history')} style={{ cursor: 'pointer' }}>view history</a></div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
