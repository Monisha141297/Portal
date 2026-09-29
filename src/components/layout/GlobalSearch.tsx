import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

interface Result { kind: string; title: string; sub: string; go: () => void; }

export default function GlobalSearch() {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const topics = useStore((s) => s.topics);
  const products = useStore((s) => s.products);
  const events = useStore((s) => s.events);
  const questions = useStore((s) => s.questions);
  const certs = useStore((s) => s.certs);
  const pathOf = useStore((s) => s.path);
  const topicOf = useStore((s) => s.topic);

  if (!currentUser) return null;
  const isParticipant = currentUser.role === 'participant';

  let results: Result[] = [];
  if (q.length >= 2) {
    const needle = q.toLowerCase();
    topics.forEach((t) => {
      if ((t.name + ' ' + t.desc).toLowerCase().includes(needle)) {
        results.push({ kind: 'Topic', title: t.name, sub: pathOf(t.id), go: () => navigate(isParticipant ? `/app/participant/viewer/${t.id}` : `/app/trainer/builder?t=${t.id}`) });
      }
    });
    products.forEach((p) => {
      if (p.name.toLowerCase().includes(needle)) {
        results.push({ kind: 'Product', title: p.name, sub: p.desc, go: () => navigate(isParticipant ? '/app/participant/learn' : '/app/trainer/topics') });
      }
    });
    events.forEach((e) => {
      if ((e.name + ' ' + e.code).toLowerCase().includes(needle)) {
        results.push({ kind: 'Examination', title: e.name, sub: 'Code ' + e.code + ' · ' + e.status, go: () => navigate(isParticipant ? '/app/participant/events' : '/app/trainer/exams') });
      }
    });
    if (!isParticipant) {
      questions.filter((x) => x.text.toLowerCase().includes(needle)).slice(0, 5).forEach((x) => {
        results.push({ kind: 'Question', title: x.text.slice(0, 70) + '…', sub: topicOf(x.topic).name, go: () => navigate(`/app/trainer/bank?t=${x.topic}`) });
      });
    }
    certs.forEach((c) => {
      if (c.id.toLowerCase().includes(needle)) {
        results.push({ kind: 'Certificate', title: c.id, sub: topicOf(c.topic).name, go: () => navigate(isParticipant ? `/app/participant/certs/${c.id}` : '/app/trainer/certs') });
      }
    });
    results = results.slice(0, 8);
  }

  return (
    <div className="searchbox">
      <span className="si">⌕</span>
      <input
        placeholder="Search topics, products, questions…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 200)}
      />
      {focused && q.length >= 2 && (
        <div className="searchres">
          {results.length ? results.map((r, i) => (
            <div key={i} onClick={() => { r.go(); setQ(''); }}>
              <span className="tag" style={{ marginRight: 6 }}>{r.kind}</span>
              <b>{r.title}</b>
              <div className="xs muted">{r.sub}</div>
            </div>
          )) : <div className="muted small" style={{ padding: 12 }}>No results. Search respects your access rights.</div>}
        </div>
      )}
    </div>
  );
}
