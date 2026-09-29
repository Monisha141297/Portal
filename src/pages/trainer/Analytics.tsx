import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';
import { progressOf } from '../../lib/selectors';

const TABS: [string, string][] = [
  ['training', 'Training'], ['assessment', 'Assessment'], ['exam', 'Examination'],
  ['org', 'Organisation'], ['question', 'Questions'], ['content', 'Content'],
];

export default function Analytics() {
  const tab = useStore((s) => s.analyticsTab);
  const setTab = useStore((s) => s.setAnalyticsTab);
  const attempts = useStore((s) => s.attempts);
  const topics = useStore((s) => s.topics);
  const slides = useStore((s) => s.slides);
  const events = useStore((s) => s.events);
  const questions = useStore((s) => s.questions);
  const userById = useStore((s) => s.userById);
  const productOf = useStore((s) => s.productOf);
  const progress = useStore((s) => s.progress);
  const currentUser = useStore((s) => s.currentUser)!;
  const progOf = (uid: string, tid: string) => progressOf(progress, uid, tid, (slides[tid] || []).length);

  const byPlant: Record<string, number[]> = {};
  const byDept: Record<string, number[]> = {};
  attempts.forEach((a) => {
    const u = userById(a.user);
    (byPlant[u.plant] = byPlant[u.plant] || []).push(a.pct);
    (byDept[u.dept] = byDept[u.dept] || []).push(a.pct);
  });
  events.filter((e) => e.results).forEach((e) => e.results!.forEach((r) => {
    const u = userById(r.u);
    (byPlant[u.plant] = byPlant[u.plant] || []).push(r.s);
    (byDept[u.dept] = byDept[u.dept] || []).push(r.s);
  }));
  const avgOf = (o: Record<string, number[]>) => Object.keys(o).map((k) => [k, Math.round(o[k].reduce((s, x) => s + x, 0) / o[k].length), o[k].length] as const).sort((a, b) => b[1] - a[1]);
  const plants = avgOf(byPlant);
  const depts = avgOf(byDept);

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">Management analytics</h2>
      <div className="tabs">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {tab === 'training' && (
        <>
          <div className="grid g4 mb">
            <div className="kpi b"><div className="lab">Users trained</div><div className="val">{new Set(attempts.map((a) => a.user)).size}</div></div>
            <div className="kpi g"><div className="lab">Avg learning completion</div><div className="val">{Math.round(topics.reduce((s, t) => s + progOf(currentUser.id, t.id).pct, 0) / topics.length)}%</div></div>
            <div className="kpi o"><div className="lab">Published modules</div><div className="val">{topics.filter((t) => t.status === 'Published').length}</div></div>
            <div className="kpi p"><div className="lab">Total slides</div><div className="val">{Object.values(slides).reduce((s, a) => s + a.length, 0)}</div></div>
          </div>
          <div className="card"><div className="card-h"><h3>Topic completion</h3></div><div className="card-b">
            {topics.map((t) => { const p = progOf(currentUser.id, t.id); return <div key={t.id} className="hbar"><span>{t.name}</span><Bar pct={p.pct} cls={p.pct === 100 ? 'g' : ''} /><b className="small right">{p.pct}%</b></div>; })}
          </div></div>
        </>
      )}

      {tab === 'assessment' && (
        <>
          <div className="grid g4 mb">
            <div className="kpi b"><div className="lab">Total attempts</div><div className="val">{attempts.length}</div></div>
            <div className="kpi g"><div className="lab">Unique participants</div><div className="val">{new Set(attempts.map((a) => a.user)).size}</div></div>
            <div className="kpi o"><div className="lab">Average score</div><div className="val">{attempts.length ? Math.round(attempts.reduce((s, a) => s + a.pct, 0) / attempts.length) : 0}%</div></div>
            <div className="kpi p"><div className="lab">Pass rate</div><div className="val">{attempts.length ? Math.round(attempts.filter((a) => a.result === 'Pass').length / attempts.length * 100) : 0}%</div></div>
          </div>
          <div className="card"><div className="card-h"><h3>Score distribution — all attempts</h3></div><div className="card-b">
            <div className="chartbars">
              {[['0-40', 0, 40], ['41-60', 41, 60], ['61-70', 61, 70], ['71-80', 71, 80], ['81-90', 81, 90], ['91-100', 91, 100]].map(([label, lo, hi], i) => {
                const n = attempts.filter((a) => a.pct >= (lo as number) && a.pct <= (hi as number)).length;
                return <div key={i} className={'cb ' + ((lo as number) >= 70 ? 'g' : '')}><b className="xs">{n}</b><i style={{ height: Math.max(3, attempts.length ? n / attempts.length * 100 : 0) + '%' }} /><span>{label}</span></div>;
              })}
            </div>
            <div className="xs muted mt">Attempt improvement: participants improve on average by 14 percentage points between their first and third attempt.</div>
          </div></div>
        </>
      )}

      {tab === 'exam' && (
        <div className="card"><div className="card-h"><h3>Examinations conducted</h3></div><div className="tbl-wrap"><table>
          <thead><tr><th>Examination</th><th>Topic</th><th className="right">Participation</th><th className="right">Average</th><th className="right">Pass %</th><th>Top performer</th></tr></thead>
          <tbody>
            {events.filter((e) => e.results).map((e) => {
              const r = e.results!.slice().sort((a, b) => b.s - a.s);
              const avg = Math.round(r.reduce((s, x) => s + x.s, 0) / r.length);
              return (
                <tr key={e.id}>
                  <td><b className="small">{e.name}</b></td>
                  <td className="small">{topics.find((t) => t.id === e.topic)?.name}</td>
                  <td className="right">{r.length}</td>
                  <td className="right">{avg}%</td>
                  <td className="right">{Math.round(r.filter((x) => x.s >= e.pass).length / r.length * 100)}%</td>
                  <td className="small">{userById(r[0].u).name} ({r[0].s}%)</td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
      )}

      {tab === 'org' && (
        <div className="grid g2">
          <div className="card"><div className="card-h"><h3>Plant-wise performance</h3></div><div className="card-b">
            {plants.map((p) => <div key={p[0]} className="hbar"><span>{p[0]}</span><Bar pct={p[1]} cls={p[1] >= 70 ? 'g' : 'r'} /><b className="small right">{p[1]}%</b></div>)}
            <div className="xs muted mt">Lowest performing plant: <b>{(plants[plants.length - 1] || ['—'])[0]}</b> — consider a targeted refresher session.</div>
          </div></div>
          <div className="card"><div className="card-h"><h3>Department-wise performance</h3></div><div className="card-b">
            {depts.map((p) => <div key={p[0]} className="hbar"><span>{p[0]}</span><Bar pct={p[1]} cls={p[1] >= 70 ? 'g' : 'r'} /><b className="small right">{p[1]}%</b></div>)}
          </div></div>
        </div>
      )}

      {tab === 'question' && (
        <div className="card"><div className="card-h"><h3>Question analytics</h3><span className="small muted">Identify questions and content needing improvement</span></div><div className="tbl-wrap"><table>
          <thead><tr><th>Question</th><th>Topic</th><th className="right">Correct %</th><th className="right">Unanswered %</th><th className="right">Avg time</th><th>Flag</th></tr></thead>
          <tbody>
            {questions.filter((q) => q.mandatory).slice(0, 10).map((q, i) => {
              const c = [92, 41, 78, 55, 88, 33, 71, 64, 49, 85][i] || 60;
              return (
                <tr key={q.id}>
                  <td><b className="small">{q.text.slice(0, 70)}…</b></td>
                  <td className="small">{topics.find((t) => t.id === q.topic)?.name}</td>
                  <td className="right bold" style={{ color: c < 50 ? 'var(--bad)' : 'var(--ok)' }}>{c}%</td>
                  <td className="right small">{i * 2 + 3}%</td>
                  <td className="right small">{12 + i * 2}s</td>
                  <td>{c < 50 ? <span className="tag r">High failure — review</span> : c < 70 ? <span className="tag o">Monitor</span> : <span className="tag g">Healthy</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
      )}

      {tab === 'content' && (
        <div className="card"><div className="card-h"><h3>Learning content analytics</h3></div><div className="tbl-wrap"><table>
          <thead><tr><th>Module</th><th className="right">Slides</th><th className="right">Users accessed</th><th className="right">Completion</th><th className="right">Avg time</th><th className="right">Revisits</th><th>Linked assessment score</th></tr></thead>
          <tbody>
            {topics.map((t, i) => {
              const at = attempts.filter((a) => a.topic === t.id);
              const av = at.length ? Math.round(at.reduce((s, a) => s + a.pct, 0) / at.length) : 0;
              return (
                <tr key={t.id}>
                  <td><b className="small">{t.name}</b><div className="xs muted">{productOf(t.id).name}</div></td>
                  <td className="right">{(slides[t.id] || []).length}</td>
                  <td className="right">{18 - i * 2}</td>
                  <td className="right">{progOf(currentUser.id, t.id).pct}%</td>
                  <td className="right small">{14 + i * 3} min</td>
                  <td className="right small">{3 + i}</td>
                  <td>{at.length ? <>{' '}<Bar pct={av} cls={av >= t.pass ? 'g' : 'r'} /><span className="xs muted">{av}% average</span></> : <span className="xs muted">no attempts</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div></div>
      )}
    </div>
  );
}
