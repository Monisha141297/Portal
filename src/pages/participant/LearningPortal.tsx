import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

export default function LearningPortal() {
  const categories = useStore((s) => s.categories);
  const products = useStore((s) => s.products);
  const topics = useStore((s) => s.topics);
  const navigate = useNavigate();

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">Learning Portal</h2>
      <p className="muted small mb">Select a major category to browse products and topics. Your access rights determine what is visible.</p>
      <div className="grid g3">
        {categories.map((c) => {
          const prods = products.filter((p) => p.cat === c.id);
          const tps = topics.filter((t) => prods.some((p) => p.id === t.prod));
          return (
            <div key={c.id} className="tile" onClick={() => navigate(`/app/participant/learn/${c.id}`)}>
              <div className={'cap ' + c.cls}>{c.icon}</div>
              <div className="bd">
                <b>{c.name}</b>
                <div className="xs muted">{c.desc}</div>
                <div className="row xs muted" style={{ marginTop: 'auto' }}>
                  <span className="tag">{prods.length} products</span>
                  <span className="tag">{tps.length} topics</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
