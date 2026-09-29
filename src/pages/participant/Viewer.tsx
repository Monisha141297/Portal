import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { progressOf } from '../../lib/selectors';

export default function Viewer() {
  const { topicId } = useParams();
  const t = topicId!;
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser)!;
  const slides = useStore((s) => s.slides[t] || []);
  const topic = useStore((s) => s.topic)(t);
  const categoryOf = useStore((s) => s.categoryOf);
  const productOf = useStore((s) => s.productOf);
  const pathOf = useStore((s) => s.path);
  const progress = useStore((s) => s.progress);
  const viewSlide = useStore((s) => s.viewSlide);
  const completeLearning = useStore((s) => s.completeLearning);
  const openAI = useStore((s) => s.openAI);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);

  const prog = progressOf(progress, currentUser.id, t, slides.length);
  const initialIdx = (() => {
    const qp = params.get('i');
    if (qp != null) return Math.max(0, Math.min(slides.length - 1, +qp));
    const firstUnseen = slides.findIndex((sl) => !prog.viewed.includes(sl.id));
    return firstUnseen < 0 ? 0 : firstUnseen;
  })();
  const [idx, setIdx] = useState(initialIdx);

  useEffect(() => { setIdx(initialIdx); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [t]);

  const slide = slides[idx];

  useEffect(() => {
    if (slide) viewSlide(currentUser.id, t, slide.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, slide?.id]);

  useEffect(() => { openAI(t); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [t]);

  if (!slide) return <div className="empty">No content available.</div>;

  function goto(i: number) {
    setIdx(i);
    setParams({ i: String(i) });
  }

  function finish() {
    completeLearning(currentUser.id, t);
    openModal(
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-b center" style={{ padding: 30 }}>
          <div style={{ fontSize: 40 }}>🎓</div>
          <h3 className="mt">Learning module completed</h3>
          <p className="muted small mt">You have completed <b>{topic.name}</b>. Test your understanding with a self assessment — you can retake it as many times as you like.</p>
          <div className="row mt2" style={{ justifyContent: 'center' }}>
            <button className="btn" onClick={() => { closeModal(); navigate('/app/participant/learn'); }}>Back to portal</button>
            <button className="btn pri" onClick={() => { closeModal(); navigate('/app/participant/assess', { state: { startTopic: t } }); }}>Take self assessment →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="spread mb">
        <div>
          <h2 style={{ fontSize: 20 }}>{topic.name}</h2>
          <div className="muted small">{pathOf(t)}</div>
        </div>
        <div className="row">
          <button className="btn sm" onClick={() => openAI(t)}>✦ Ask AI</button>
          <button className="btn sm pri" onClick={() => navigate('/app/participant/assess', { state: { startTopic: t } })}>Take self assessment →</button>
        </div>
      </div>
      <div className="card pad mb">
        <div className="spread mb"><b className="small">Learning progress</b><span className="small muted">{prog.viewed.length} / {prog.total} slides · {prog.pct}%</span></div>
        <Bar pct={prog.pct} cls={prog.pct === 100 ? 'g' : ''} />
      </div>
      <div className="viewer">
        <div className="card pad slidelist">
          <div className="xs bold muted mb" style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>Slides</div>
          {slides.map((sl, k) => (
            <div key={sl.id} className={'it ' + (k === idx ? 'on' : '') + ' ' + (prog.viewed.includes(sl.id) ? 'done' : '')} onClick={() => goto(k)}>
              <span className="n">{prog.viewed.includes(sl.id) ? '✓' : k + 1}</span>
              <span>{sl.title}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="stage">
            <div className="row mb">
              <span className="tag b">Slide {idx + 1} of {slides.length}</span>
              <span className="tag">{({ text: 'Text', image: 'Image', video: 'Video' } as Record<string, string>)[slide.type] || 'Text'}</span>
            </div>
            <h2>{slide.title}</h2>
            {slide.body && slide.body.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            {slide.media && (
              slide.type === 'video' ? (
                <div className="media video">
                  <div className="ph" onClick={() => useStore.getState().toast('Video playback — media is served from the company media library in the live system')}>
                    <div><div className="play">▶</div><div className="small mt">{slide.media}</div></div>
                  </div>
                  <div className="cp">{slide.caption || ''}</div>
                </div>
              ) : (
                <div className="media">
                  <div className="ph"><div style={{ padding: 20 }}><div style={{ fontSize: 26, marginBottom: 8 }}>▦</div><div className="small">{slide.media}</div></div></div>
                  <div className="cp">{slide.caption || ''}</div>
                </div>
              )
            )}
            {slide.list && <ul>{slide.list.map((x, i) => <li key={i}>{x}</li>)}</ul>}
            {slide.explain && <div className="explain"><b>Explanation · </b>{slide.explain}</div>}
            {slide.key && <div className="keypoint"><b>Key point · </b>{slide.key}</div>}
          </div>
          <div className="spread mt">
            <button className="btn" disabled={idx === 0} onClick={() => goto(idx - 1)}>← Previous</button>
            <div className="row">
              <span className="small muted">Time on slide is tracked</span>
              {idx < slides.length - 1
                ? <button className="btn pri" onClick={() => goto(idx + 1)}>Next slide →</button>
                : <button className="btn ok" onClick={finish}>✓ Complete learning</button>}
            </div>
          </div>
        </div>
      </div>
      <div className="xs muted" style={{ display: 'none' }}>{categoryOf(t).name}{productOf(t).name}</div>
    </div>
  );
}
