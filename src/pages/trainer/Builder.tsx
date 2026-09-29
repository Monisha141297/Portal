import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { StatusTag } from '../../components/ui/Tags';
import type { SlideType } from '../../types';

const TYPE_LABEL: Record<SlideType, string> = { text: 'Text only', image: 'Text + image', video: 'Text + video' };

export default function Builder() {
  const [params, setParams] = useSearchParams();
  const topics = useStore((s) => s.topics);
  const productOf = useStore((s) => s.productOf);
  const builderTopic = useStore((s) => s.builderTopic);
  const setBuilderTopic = useStore((s) => s.setBuilderTopic);
  const builderSlideIndex = useStore((s) => s.builderSlideIndex);
  const setBuilderSlideIndex = useStore((s) => s.setBuilderSlideIndex);
  const slides = useStore((s) => s.slides);
  const questions = useStore((s) => s.questions);
  const addSlide = useStore((s) => s.addSlide);
  const updateSlide = useStore((s) => s.updateSlide);
  const duplicateSlide = useStore((s) => s.duplicateSlide);
  const deleteSlide = useStore((s) => s.deleteSlide);
  const moveSlide = useStore((s) => s.moveSlide);
  const reorderSlides = useStore((s) => s.reorderSlides);
  const publishContent = useStore((s) => s.publishContent);
  const toast = useStore((s) => s.toast);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);

  const qpTopic = params.get('t');
  useEffect(() => { if (qpTopic && qpTopic !== builderTopic) setBuilderTopic(qpTopic); }, [qpTopic]); // eslint-disable-line react-hooks/exhaustive-deps
  const t = builderTopic;

  const arr = slides[t] || [];
  const i = Math.min(builderSlideIndex, Math.max(0, arr.length - 1));
  const s = arr[i];
  const topic = topics.find((x) => x.id === t)!;
  const dragFrom = useRef<number | null>(null);
  const [, force] = useState(0);

  if (!s) return <div className="empty">No content available.</div>;

  function preview() {
    openModal(
      <div className="modal wide">
        <div className="modal-h"><h3>Preview — {topic.name}</h3><button className="btn ghost" onClick={closeModal}>✕</button></div>
        <div className="modal-b" style={{ background: 'var(--panel-2)' }}>
          {arr.map((sl, k) => (
            <div key={sl.id} className="stage mb">
              <div className="tag b mb">Slide {k + 1}</div>
              <h2>{sl.title}</h2>
              {sl.body && sl.body.split('\n').map((p, pi) => <p key={pi}>{p}</p>)}
              {sl.media && <div className="media"><div className="ph"><div className="small" style={{ padding: 16 }}>{sl.type === 'video' ? '▶ ' : '▦ '}{sl.media}</div></div></div>}
              {sl.list && <ul>{sl.list.map((x, xi) => <li key={xi}>{x}</li>)}</ul>}
              {sl.explain && <div className="explain small">{sl.explain}</div>}
              {sl.key && <div className="keypoint small">{sl.key}</div>}
            </div>
          ))}
        </div>
        <div className="modal-f"><button className="btn" onClick={closeModal}>Close preview</button></div>
      </div>
    );
  }

  return (
    <div>
      <div className="spread mb wrap">
        <div className="row wrap">
          <select className="inp" style={{ width: 'auto' }} value={t} onChange={(e) => { setBuilderTopic(e.target.value); setParams({ t: e.target.value }); }}>
            {topics.map((x) => <option key={x.id} value={x.id}>{productOf(x.id).name} → {x.name}</option>)}
          </select>
          <StatusTag status={topic.status} />
          <span className="small muted">{arr.length} slides</span>
        </div>
        <div className="row">
          <button className="btn" onClick={preview}>▷ Preview</button>
          <button className="btn" onClick={() => toast('Draft saved', 'ok')}>Save draft</button>
          <button className="btn pri" onClick={() => { publishContent(t); toast('Content published — participants can now access it', 'ok'); }}>Publish</button>
        </div>
      </div>
      <div className="builder">
        <div className="card pad" style={{ maxHeight: 620, overflow: 'auto' }}>
          <div className="spread mb"><b className="xs muted" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Slides</b><button className="btn sm" onClick={() => addSlide(t, i)}>+</button></div>
          <div>
            {arr.map((sl, k) => (
              <div
                key={sl.id}
                className={'thumb ' + (k === i ? 'on' : '')}
                draggable
                onDragStart={() => { dragFrom.current = k; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (dragFrom.current !== null && dragFrom.current !== k) { reorderSlides(t, dragFrom.current, k); toast('Slides reordered'); } dragFrom.current = null; }}
                onClick={() => setBuilderSlideIndex(k)}
              >
                <span className="no">{k + 1}</span>
                <div className="t">{sl.title || 'Untitled'}</div>
                <div className="xs muted">{TYPE_LABEL[sl.type]}</div>
                <div className="row xs" style={{ marginTop: 5, gap: 4 }}>
                  <span onClick={(e) => { e.stopPropagation(); duplicateSlide(t, k); }} style={{ cursor: 'pointer' }} title="Duplicate">⧉</span>
                  <span onClick={(e) => { e.stopPropagation(); moveSlide(t, k, -1); }} style={{ cursor: 'pointer' }} title="Move up">▲</span>
                  <span onClick={(e) => { e.stopPropagation(); moveSlide(t, k, 1); }} style={{ cursor: 'pointer' }} title="Move down">▼</span>
                  <span onClick={(e) => { e.stopPropagation(); if (deleteSlide(t, k)) toast('Slide deleted'); else toast('A module must contain at least one slide', 'bad'); }} style={{ cursor: 'pointer', color: 'var(--bad)' }} title="Delete">✕</span>
                </div>
              </div>
            ))}
          </div>
          <div className="xs muted center mt">Drag slides to reorder</div>
        </div>
        <div className="canvas">
          <div className="xs muted mb">Slide {i + 1} of {arr.length} — editing</div>
          <input className="inp" value={s.title} placeholder="Slide title"
            style={{ fontSize: 19, fontWeight: 700, border: 'none', borderBottom: '2px solid var(--line)', borderRadius: 0, paddingLeft: 0 }}
            onChange={(e) => updateSlide(t, i, { title: e.target.value })} />
          <label className="f mt2">Body text</label>
          <textarea className="inp" style={{ minHeight: 130 }} placeholder="Main content of the slide…" value={s.body || ''} onChange={(e) => updateSlide(t, i, { body: e.target.value })} />
          <label className="f mt">Bullet points (one per line)</label>
          <textarea className="inp" placeholder="Each line becomes a bullet point" value={(s.list || []).join('\n')} onChange={(e) => updateSlide(t, i, { list: e.target.value.split('\n').filter((x) => x.trim()) })} />
          {s.type !== 'text' && (
            <>
              <label className="f mt">{s.type === 'video' ? 'Video' : 'Image'} reference</label>
              <input className="inp" value={s.media || ''} placeholder="Media description / library reference" onChange={(e) => updateSlide(t, i, { media: e.target.value })} />
              <label className="f mt">Caption</label>
              <input className="inp" value={s.caption || ''} placeholder="Figure 1 — …" onChange={(e) => updateSlide(t, i, { caption: e.target.value })} />
            </>
          )}
          <label className="f mt">Explanation box</label>
          <textarea className="inp" placeholder="Additional explanation shown in a highlighted box" value={s.explain || ''} onChange={(e) => updateSlide(t, i, { explain: e.target.value })} />
          <label className="f mt">Key point box</label>
          <input className="inp" value={s.key || ''} placeholder="One-line takeaway" onChange={(e) => updateSlide(t, i, { key: e.target.value })} />
        </div>
        <div className="col">
          <div className="card pad">
            <b className="xs muted" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Slide properties</b>
            <label className="f mt">Content type</label>
            <select className="inp" value={s.type} onChange={(e) => { updateSlide(t, i, { type: e.target.value as SlideType }); force((n) => n + 1); }}>
              {(['text', 'image', 'video'] as SlideType[]).map((x) => <option key={x} value={x}>{TYPE_LABEL[x]}</option>)}
            </select>
            <div className="mt"><button className="btn sm block" onClick={() => toast('Media upload opens the company media library in the live system')}>⬆ Upload media</button></div>
            <div className="mt"><button className="btn sm block" onClick={() => addSlide(t, i)}>+ Add slide</button></div>
            <div className="mt"><button className="btn sm block" onClick={() => duplicateSlide(t, i)}>⧉ Duplicate slide</button></div>
            <div className="mt"><button className="btn sm block dan" onClick={() => { if (deleteSlide(t, i)) toast('Slide deleted'); else toast('A module must contain at least one slide', 'bad'); }}>✕ Delete slide</button></div>
          </div>
          <div className="card pad">
            <b className="xs muted" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Module settings</b>
            <div className="spread small mt"><span className="muted">Topic</span><b>{topic.name}</b></div>
            <div className="spread small"><span className="muted">Status</span><StatusTag status={topic.status} /></div>
            <div className="spread small"><span className="muted">Questions</span><b>{questions.filter((q) => q.topic === t && q.status === 'Active').length}</b></div>
            <div className="spread small"><span className="muted">Pass mark</span><b>{topic.pass}%</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
