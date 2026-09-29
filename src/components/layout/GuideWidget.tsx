import { useStore } from '../../store/useStore';

const STEPS: Record<string, string[]> = {
  participant: [
    'Open <b>Learning Portal</b> → Cement → Supergrade PPC → Product Overview',
    'Read the slides; progress is tracked automatically',
    'Click the purple <b>AI</b> bubble, ask a question, then try <b>Ask an Expert</b>',
    'Run a <b>Self Assessment</b> — unlimited retakes, question-wise analysis',
    'Go to <b>Live Events</b>, join with code <b>824591</b>, wait, then take the exam',
    'Score ≥ 80% to have a certificate issued automatically',
  ],
  trainer: [
    '<b>Content Builder</b> — add, duplicate, reorder and publish slides',
    '<b>Question Bank</b> — 250 questions on Supergrade PPC; filter, edit, mark mandatory',
    '<b>Examinations</b> → Create: try setting mandatory &gt; question count to see validation',
    'Open a scheduled exam → <b>Live Control</b> → watch the waiting room → Start',
    '<b>Expert Questions</b> — answer the pending escalation from a participant',
  ],
  admin: [
    '<b>User Management</b> — create a user, assign a role, deactivate someone',
    '<b>Active Users</b> and <b>Daily Activity</b> — live session monitoring',
    '<b>Audit Logs</b> — every action taken in this session is recorded here',
  ],
};

export default function GuideWidget() {
  const currentUser = useStore((s) => s.currentUser);
  const guideOpen = useStore((s) => s.guideOpen);
  const setGuideOpen = useStore((s) => s.setGuideOpen);
  if (!currentUser) return null;
  if (!guideOpen) {
    return (
      <div className="guide">
        {/* <button className="guidebtn" onClick={() => setGuideOpen(true)}>? How to test</button> */}
      </div>
    );
  }
  return (
    <div className="guide">
      <div className="gb">
        <div className="spread">
          <b>How to test this prototype</b>
          <button className="btn sm ghost" style={{ color: '#93c5fd' }} onClick={() => setGuideOpen(false)}>✕</button>
        </div>
        <div style={{ marginTop: 6, color: '#93c5fd' }}>Role: {currentUser.role}</div>
        <ol>{STEPS[currentUser.role].map((s, i) => <li key={i} dangerouslySetInnerHTML={{ __html: s }} />)}</ol>
        <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 8, color: '#93c5fd' }}>
          Data is in-memory — refresh the page to reset everything.
        </div>
      </div>
    </div>
  );
}
