import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { openExamEditor } from './examEditor';
import type { EventStatus } from '../../types';

const GROUPS: [EventStatus, string][] = [
  ['Draft', 'Draft'], ['Scheduled', 'Scheduled'], ['Waiting', 'Waiting room'], ['Live', 'Live now'], ['Completed', 'Completed'],
];

export default function Exams() {
  const events = useStore((s) => s.events);
  const topicOf = useStore((s) => s.topic);
  const publishExam = useStore((s) => s.publishExam);
  const toast = useStore((s) => s.toast);
  const navigate = useNavigate();

  return (
    <div>
      <div className="spread mb"><h2 style={{ fontSize: 20 }}>Examinations</h2><button className="btn pri" onClick={() => openExamEditor(null)}>+ Create examination</button></div>
      {GROUPS.map(([st, lab]) => {
        const list = events.filter((e) => e.status === st);
        if (!list.length) return null;
        return (
          <div key={st} className="card mb">
            <div className="card-h"><h3>{lab}</h3><span className="tag">{list.length}</span></div>
            <div className="tbl-wrap"><table>
              <thead><tr><th>Examination</th><th>Topic</th><th>Code</th><th>Mode</th><th>Date / time</th><th className="right">Qs</th><th className="right">Pass</th><th>Participants</th><th></th></tr></thead>
              <tbody>
                {list.map((e) => (
                  <tr key={e.id}>
                    <td><b className="small">{e.name}</b>{e.cert && <span className="tag p"> ❖</span>}</td>
                    <td className="small">{topicOf(e.topic).name}</td>
                    <td className="mono small">{e.code}</td>
                    <td><span className={'tag ' + (e.type === 'Open' ? 'g' : 'b')}>{e.type}</span></td>
                    <td className="small muted">{e.date} {e.time}</td>
                    <td className="right">{e.count}</td>
                    <td className="right">{e.pass}%</td>
                    <td className="small">{e.type === 'Open' ? 'Open to all' : e.parts.length + ' invited'}{e.joined.length ? ' · ' + e.joined.length + ' joined' : ''}</td>
                    <td className="right">
                      {st === 'Completed' ? <button className="btn sm" onClick={() => navigate(`/app/trainer/results/${e.id}`)}>Results</button>
                        : st === 'Draft' ? (<>
                          <button className="btn sm" onClick={() => openExamEditor(e.id)}>Edit</button>{' '}
                          <button className="btn sm pri" onClick={() => { if (publishExam(e.id)) toast('Examination scheduled', 'ok'); else toast('Cannot publish: mandatory questions exceed the configured count', 'bad'); }}>Publish</button>
                        </>) : (<>
                          <button className="btn sm" onClick={() => openExamEditor(e.id)}>Edit</button>{' '}
                          <button className="btn sm pri" onClick={() => navigate(`/app/trainer/live/${e.id}`)}>Live control →</button>
                        </>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        );
      })}
    </div>
  );
}
