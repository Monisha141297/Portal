import { useStore } from '../../store/useStore';
import { StatusTag } from '../../components/ui/Tags';

export default function Expert() {
  const currentUser = useStore((s) => s.currentUser)!;
  const expertQs = useStore((s) => s.expertQs);
  const pathOf = useStore((s) => s.path);
  const openAI = useStore((s) => s.openAI);
  const ai = useStore((s) => s.ai);

  const xs = expertQs.filter((x) => x.user === currentUser.id);

  return (
    <div>
      <div className="spread mb">
        <h2 style={{ fontSize: 20 }}>My questions to experts</h2>
        <button className="btn pri" onClick={() => openAI(ai.topic || 'T1')}>✦ Ask the AI first</button>
      </div>
      {xs.length ? xs.map((x) => (
        <div key={x.id} className="card mb">
          <div className="card-h">
            <div><b>{pathOf(x.topic).split(' → ').pop()}</b><div className="xs muted">{pathOf(x.topic)} · raised {x.date}</div></div>
            <StatusTag status={x.status} />
          </div>
          <div className="card-b">
            <div className="small bold">Your question</div><p className="small">{x.q}</p>
            {x.note && <><div className="small bold mt">Your additional note</div><p className="small muted">{x.note}</p></>}
            <div className="small bold mt">AI response you received</div>
            <div className="small muted" style={{ background: 'var(--panel-2)', padding: 10, borderRadius: 8 }}>{x.ai}</div>
            {x.resp ? (
              <>
                <div className="small bold mt">Expert response — {x.expert}</div>
                <div className="small" style={{ background: 'var(--ok-soft)', padding: 10, borderRadius: 8, borderLeft: '3px solid var(--ok)' }}>{x.resp}</div>
              </>
            ) : <div className="small muted mt">⏳ Awaiting a trainer response. You will be notified when it is answered.</div>}
          </div>
        </div>
      )) : (
        <div className="card"><div className="empty"><div className="big">✆</div>You have not raised any expert questions
          <div className="small mt">Ask the AI assistant while learning — if the answer is not sufficient, escalate it to a trainer.</div>
        </div></div>
      )}
    </div>
  );
}
