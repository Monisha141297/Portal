import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { progressOf } from '../../lib/selectors';

export default function Category() {
  const { catId } = useParams();
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const topics = useStore((s) => s.topics);
  const slides = useStore((s) => s.slides);
  const questions = useStore((s) => s.questions);
  const currentUser = useStore((s) => s.currentUser)!;
  const progress = useStore((s) => s.progress);
  const navigate = useNavigate();
  const progOf = (uid: string, tid: string) => progressOf(progress, uid, tid, (slides[tid] || []).length);

  const cat = categories.find((c) => c.id === catId)!;
  const prods = products.filter((p) => p.cat === cat.id);

  return (
    <div>
      <div className="spread mb"><h2 style={{ fontSize: 20 }}>{cat.name}</h2><button className="btn sm" onClick={() => navigate('/app/participant/learn')}>← Back</button></div>
      <div className="grid g3">
        {prods.map((p) => {
          const tps = topics.filter((t) => t.prod === p.id && t.status === 'Published');
          const avg = tps.length ? Math.round(tps.reduce((sum, t) => sum + progOf(currentUser.id, t.id).pct, 0) / tps.length) : 0;
          return (
            <div key={p.id} className="card">
              <div className="card-h"><h3>{p.name}</h3><span className="tag b">{tps.length} topics</span></div>
              <div className="card-b">
                <div className="muted small mb">{p.desc}</div>
                <Bar pct={avg} />
                <div className="xs muted" style={{ marginTop: 4 }}>Overall progress {avg}%</div>
                <div className="mt">
                  {tps.map((t) => {
                    const pr = progOf(currentUser.id, t.id);
                    const qCount = questions.filter((q) => q.topic === t.id && q.status === 'Active').length;
                    return (
                      <div key={t.id} className="row" style={{ padding: '9px 0', borderTop: '1px solid var(--line)' }}>
                        <div className="grow">
                          <b className="small">{t.name}</b>
                          <div className="xs muted">{(slides[t.id] || []).length} slides · {qCount} questions · pass {t.pass}%</div>
                        </div>
                        {pr.pct === 100 ? <span className="tag g">✓</span> : pr.pct > 0 ? <span className="tag o">{pr.pct}%</span> : null}
                        <button className="btn sm pri" onClick={() => navigate(`/app/participant/viewer/${t.id}`)}>{pr.pct > 0 ? 'Resume' : 'Start'}</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
