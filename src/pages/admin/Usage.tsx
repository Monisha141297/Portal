import { useStore } from '../../store/useStore';
import { Bar } from '../../components/ui/Tags';

export default function Usage() {
  const attempts = useStore((s) => s.attempts);
  const expertQs = useStore((s) => s.expertQs);
  const certs = useStore((s) => s.certs);
  const topics = useStore((s) => s.topics);

  const stats: [string, number, string][] = [
    ['Learning sessions', 184, 'This month'],
    ['Assessment attempts', attempts.length + 126, 'All modes'],
    ['Examination participation', 67, 'Across 4 events'],
    ['AI chatbot conversations', 93, 'Topic-scoped'],
    ['Expert questions', expertQs.length + 11, 'Escalated from AI'],
    ['Certificates issued', certs.length, 'Topic level'],
  ];
  const moduleUsage = [92, 74, 61, 48, 37, 22];
  const health: [string, string, string][] = [
    ['Average dashboard load', '0.8 s', 'g'], ['Answer submission latency', '120 ms', 'g'], ['Peak concurrent exam users', '31', 'g'],
    ['AI service availability', '99.2%', 'g'], ['Failed OTP attempts (24h)', '4', 'o'],
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20 }} className="mb">Application usage statistics</h2>
      <div className="grid g3 mb">
        {stats.map((r) => <div key={r[0]} className="kpi b"><div className="lab">{r[0]}</div><div className="val">{r[1]}</div><div className="sub">{r[2]}</div></div>)}
      </div>
      <div className="grid g2">
        <div className="card"><div className="card-h"><h3>Most used modules</h3></div><div className="card-b">
          {topics.slice(0, 6).map((t, i) => <div key={t.id} className="hbar"><span>{t.name}</span><Bar pct={moduleUsage[i] || 20} /><b className="small right">{moduleUsage[i] || 20}</b></div>)}
        </div></div>
        <div className="card"><div className="card-h"><h3>Platform health</h3></div><div className="card-b">
          {health.map((r) => <div key={r[0]} className="spread small" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}><span className="muted">{r[0]}</span><span className={'tag ' + r[2]}>{r[1]}</span></div>)}
        </div></div>
      </div>
    </div>
  );
}
