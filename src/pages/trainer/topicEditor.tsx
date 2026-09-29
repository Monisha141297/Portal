import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Topic, TopicStatus } from '../../types';

export function openTopicEditor(id: string | null) {
  useStore.getState().openModal(<TopicEditorModal id={id} />);
}
export function openProductEditor(id: string | null) {
  useStore.getState().openModal(<ProductEditorModal id={id} />);
}

function TopicEditorModal({ id }: { id: string | null }) {
  const topics = useStore((s) => s.topics);
  const products = useStore((s) => s.products);
  const saveTopic = useStore((s) => s.saveTopic);
  const closeModal = useStore((s) => s.closeModal);
  const toast = useStore((s) => s.toast);

  const categories = useStore((s) => s.categories);
  const existing = id ? topics.find((t) => t.id === id) : null;
  const [prod, setProd] = useState(existing?.prod || products[0]?.id || '');
  const [name, setName] = useState(existing?.name || '');
  const [desc, setDesc] = useState(existing?.desc || '');
  const [pass, setPass] = useState(existing?.pass ?? 70);
  const [defTime, setDefTime] = useState(existing?.defTime ?? 30);
  const [examCount, setExamCount] = useState(existing?.examCount ?? 20);
  const [status, setStatus] = useState<TopicStatus>(existing?.status || 'Draft');

  function submit() {
    if (!name.trim()) { toast('Topic name is required', 'bad'); return; }
    saveTopic(id, { prod, name, desc, pass, defTime, examCount, status } as Omit<Topic, 'id'>);
    closeModal();
    toast('Topic saved', 'ok');
  }

  return (
    <div className="modal">
      <div className="modal-h"><h3>{id ? 'Edit' : 'New'} topic (sub-category)</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
      <div className="modal-b">
        <label className="f">Product <span className="req">*</span></label>
        <select className="inp" value={prod} onChange={(e) => setProd(e.target.value)}>
          {products.map((p) => <option key={p.id} value={p.id}>{categories.find((c) => c.id === p.cat)?.name} → {p.name}</option>)}
        </select>
        <label className="f mt">Topic name <span className="req">*</span></label>
        <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Product Overview" />
        <label className="f mt">Description</label>
        <textarea className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} />
        <div className="fieldrow mt">
          <div><label className="f">Pass percentage</label><input className="inp" type="number" value={pass} min={1} max={100} onChange={(e) => setPass(+e.target.value)} /></div>
          <div><label className="f">Default question time (seconds)</label><input className="inp" type="number" value={defTime} onChange={(e) => setDefTime(+e.target.value)} /></div>
        </div>
        <div className="fieldrow mt">
          <div><label className="f">Questions per assessment</label><input className="inp" type="number" value={examCount} onChange={(e) => setExamCount(+e.target.value)} /></div>
          <div><label className="f">Status</label>
            <select className="inp" value={status} onChange={(e) => setStatus(e.target.value as TopicStatus)}>
              <option>Draft</option><option>Published</option><option>Archived</option>
            </select>
          </div>
        </div>
      </div>
      <div className="modal-f"><button className="btn" onClick={closeModal}>Cancel</button><button className="btn pri" onClick={submit}>Save topic</button></div>
    </div>
  );
}

function ProductEditorModal({ id }: { id: string | null }) {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const saveProduct = useStore((s) => s.saveProduct);
  const closeModal = useStore((s) => s.closeModal);
  const toast = useStore((s) => s.toast);

  const existing = id ? products.find((p) => p.id === id) : null;
  const [cat, setCat] = useState(existing?.cat || categories[0]?.id || '');
  const [name, setName] = useState(existing?.name || '');
  const [desc, setDesc] = useState(existing?.desc || '');

  function submit() {
    if (!name.trim()) { toast('Product name is required', 'bad'); return; }
    saveProduct(id, { cat, name, desc, status: 'Active' });
    closeModal();
    toast('Product saved', 'ok');
  }

  return (
    <div className="modal" style={{ maxWidth: 520 }}>
      <div className="modal-h"><h3>{id ? 'Edit' : 'New'} product</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
      <div className="modal-b">
        <label className="f">Category</label>
        <select className="inp" value={cat} onChange={(e) => setCat(e.target.value)}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="f mt">Product name</label><input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="f mt">Description</label><input className="inp" value={desc} onChange={(e) => setDesc(e.target.value)} />
      </div>
      <div className="modal-f"><button className="btn" onClick={closeModal}>Cancel</button><button className="btn pri" onClick={submit}>Save</button></div>
    </div>
  );
}
