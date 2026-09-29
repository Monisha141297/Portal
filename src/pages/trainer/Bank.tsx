import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { QT } from '../../data/questions';
import { StatusTag } from '../../components/ui/Tags';
import { openQuestionEditor } from './questionEditor';

const PER_PAGE = 12;

export default function Bank() {
  const [params] = useSearchParams();
  const topics = useStore((s) => s.topics);
  const productOf = useStore((s) => s.productOf);
  const questions = useStore((s) => s.questions);
  const bankTopic = useStore((s) => s.bankTopic);
  const setBankTopic = useStore((s) => s.setBankTopic);
  const bankFilters = useStore((s) => s.bankFilters);
  const setBankFilters = useStore((s) => s.setBankFilters);
  const bankPage = useStore((s) => s.bankPage);
  const setBankPage = useStore((s) => s.setBankPage);
  const duplicateQuestion = useStore((s) => s.duplicateQuestion);
  const toggleArchiveQuestion = useStore((s) => s.toggleArchiveQuestion);
  const toast = useStore((s) => s.toast);

  const qpTopic = params.get('t');
  useEffect(() => { if (qpTopic && qpTopic !== bankTopic) setBankTopic(qpTopic); }, [qpTopic]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = bankTopic;
  const f = bankFilters;
  let list = questions.filter((q) => q.topic === t);
  if (f.q) list = list.filter((q) => q.text.toLowerCase().includes(f.q.toLowerCase()));
  if (f.type) list = list.filter((q) => q.type === f.type);
  if (f.mand) list = list.filter((q) => String(q.mandatory) === f.mand);
  if (f.diff) list = list.filter((q) => q.diff === f.diff);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const page = Math.min(bankPage, pages - 1);
  const rows = list.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
  const all = questions.filter((q) => q.topic === t);

  return (
    <div>
      <div className="spread mb wrap">
        <div className="row wrap">
          <select className="inp" style={{ width: 'auto' }} value={t} onChange={(e) => setBankTopic(e.target.value)}>
            {topics.map((x) => <option key={x.id} value={x.id}>{productOf(x.id).name} → {x.name}</option>)}
          </select>
          <span className="tag b">{all.length} questions</span>
          <span className="tag r">{all.filter((q) => q.mandatory).length} mandatory</span>
          <span className="tag">Total {all.reduce((s, q) => s + q.marks, 0)} marks in bank</span>
        </div>
        <div className="row">
          <button className="btn" onClick={() => toast('Bulk import accepts CSV / Excel in the live system')}>⬆ Bulk import</button>
          <button className="btn pri" onClick={() => openQuestionEditor(null, t)}>+ Add question</button>
        </div>
      </div>
      <div className="card pad mb">
        <div className="row wrap">
          <input className="inp" style={{ maxWidth: 260 }} placeholder="Search question text…" value={f.q} onChange={(e) => setBankFilters({ q: e.target.value })} />
          <select className="inp" style={{ width: 'auto' }} value={f.type} onChange={(e) => setBankFilters({ type: e.target.value })}>
            <option value="">All types</option>
            {Object.keys(QT).map((k) => <option key={k} value={k}>{QT[k]}</option>)}
          </select>
          <select className="inp" style={{ width: 'auto' }} value={f.mand} onChange={(e) => setBankFilters({ mand: e.target.value })}>
            <option value="">Mandatory: any</option><option value="true">Mandatory only</option><option value="false">Non-mandatory</option>
          </select>
          <select className="inp" style={{ width: 'auto' }} value={f.diff} onChange={(e) => setBankFilters({ diff: e.target.value })}>
            <option value="">Any difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
          <div className="grow" /><span className="small muted">{list.length} matching</span>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap"><table>
          <thead><tr><th style={{ width: 40 }}>#</th><th>Question</th><th>Type</th><th className="right">Marks</th><th className="right">Time</th><th>Mandatory</th><th>Difficulty</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.length ? rows.map((q, k) => (
              <tr key={q.id}>
                <td className="muted small">{page * PER_PAGE + k + 1}</td>
                <td><b className="small">{q.text.slice(0, 95)}{q.text.length > 95 ? '…' : ''}</b>{q.explain && <div className="xs muted">{q.explain.slice(0, 70)}…</div>}</td>
                <td><span className="tag">{QT[q.type]}</span></td>
                <td className="right bold">{q.marks}</td>
                <td className="right small">{q.time ? q.time + 's' : <span className="muted">default</span>}</td>
                <td>{q.mandatory ? <span className="tag r">Mandatory</span> : <span className="xs muted">—</span>}</td>
                <td className="small">{q.diff}</td>
                <td><StatusTag status={q.status} /></td>
                <td className="right">
                  <button className="btn sm" onClick={() => openQuestionEditor(q.id, t)}>Edit</button>{' '}
                  <button className="btn sm" onClick={() => duplicateQuestion(q.id)}>⧉</button>{' '}
                  <button className="btn sm dan" onClick={() => toggleArchiveQuestion(q.id)}>Archive</button>
                </td>
              </tr>
            )) : <tr><td colSpan={9}><div className="empty">No questions match the filters</div></td></tr>}
          </tbody>
        </table></div>
        <div className="spread" style={{ padding: '12px 16px' }}>
          <span className="small muted">Page {page + 1} of {pages}</span>
          <div className="row">
            <button className="btn sm" disabled={page === 0} onClick={() => setBankPage(page - 1)}>← Previous</button>
            <button className="btn sm" disabled={page >= pages - 1} onClick={() => setBankPage(page + 1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
