import type { Attempt, ExamEvent, Certificate, ExpertQuestion, Notification, AuditEntry, ProgressEntry } from '../types';

export const ATTEMPTS: Attempt[] = [
  { id: 'A1', user: 'U1', topic: 'T1', mode: 'self', date: '2026-09-10 10:24', score: 54, total: 100, pct: 54, result: 'Fail', time: '11:42', qcount: 20 },
  { id: 'A2', user: 'U1', topic: 'T1', mode: 'self', date: '2026-09-12 16:05', score: 68, total: 100, pct: 68, result: 'Fail', time: '10:18', qcount: 20 },
  { id: 'A3', user: 'U1', topic: 'T7', mode: 'self', date: '2026-09-15 09:30', score: 84, total: 100, pct: 84, result: 'Pass', time: '06:55', qcount: 12 },
];

export const EVENTS: ExamEvent[] = [
  { id: 'E1', name: 'Supergrade PPC — Product Knowledge Certification', topic: 'T1', code: '824591', type: 'Private',
    date: '2026-09-26', time: '16:00', count: 20, pass: 80, defTime: 30, status: 'Scheduled', lb: true, res: true, cert: true,
    parts: ['U1', 'U4', 'U5', 'U6', 'U7', 'U10'], joined: [], by: 'U2' },
  { id: 'E2', name: 'Plant Safety Induction — Open Assessment', topic: 'T7', code: '537104', type: 'Open',
    date: '2026-09-26', time: '11:00', count: 12, pass: 80, defTime: 25, status: 'Scheduled', lb: true, res: true, cert: true,
    parts: [], joined: [], by: 'U2' },
  { id: 'E3', name: 'Manufacturing Process — Q3 Assessment', topic: 'T2', code: '661220', type: 'Private',
    date: '2026-09-18', time: '15:00', count: 20, pass: 70, defTime: 30, status: 'Completed', lb: true, res: true, cert: true,
    parts: ['U4', 'U5', 'U6', 'U7', 'U10'], joined: ['U4', 'U5', 'U6', 'U7', 'U10'], by: 'U2',
    results: [{ u: 'U5', s: 92, t: '07:42' }, { u: 'U4', s: 88, t: '08:15' }, { u: 'U10', s: 84, t: '07:58' }, { u: 'U6', s: 66, t: '09:20' }, { u: 'U7', s: 58, t: '09:44' }] },
  { id: 'E4', name: 'Supercrete PSC — Features Refresher', topic: 'T4', code: '190833', type: 'Private',
    date: '2026-10-04', time: '10:30', count: 15, pass: 70, defTime: 30, status: 'Draft', lb: true, res: true, cert: false,
    parts: ['U4', 'U5'], joined: [], by: 'U2' },
];

export const CERTS: Certificate[] = [
  { id: 'RC-2026-0187', user: 'U5', topic: 'T2', event: 'E3', score: 92, date: '2026-09-18', status: 'Valid' },
  { id: 'RC-2026-0188', user: 'U4', topic: 'T2', event: 'E3', score: 88, date: '2026-09-18', status: 'Valid' },
  { id: 'RC-2026-0189', user: 'U10', topic: 'T2', event: 'E3', score: 84, date: '2026-09-18', status: 'Valid' },
];

export const EXPERT_QS: ExpertQuestion[] = [
  { id: 'X1', user: 'U4', topic: 'T1', q: 'For a coastal project the consultant insists on OPC 53 only. How do I justify PPC?', ai: 'PPC offers lower permeability and better chloride resistance, which is advantageous in marine exposure conditions.', note: 'The consultant wants a documented standard reference.', date: '2026-09-22 14:10', status: 'Raised', resp: '', expert: '' },
  { id: 'X2', user: 'U5', topic: 'T2', q: 'What is the acceptable free lime percentage in clinker at our plants?', ai: 'Free lime is typically controlled below 1.5%, though the exact internal limit depends on plant configuration.', note: '', date: '2026-09-20 11:35', status: 'Answered', resp: 'Our internal control limit is 1.0–1.5% free lime, verified hourly at the kiln outlet. Above 2.0% the sample is rejected and kiln parameters are corrected immediately.', expert: 'Meenakshi Iyer' },
];

export const PROGRESS: Record<string, ProgressEntry> = {
  'U1:T1': { viewed: ['S1', 'S2', 'S3', 'S4', 'S5'], done: false },
  'U1:T7': { viewed: ['S1', 'S2', 'S3'], done: true },
};

export const NOTIFS: Notification[] = [
  { id: 'N1', txt: 'Live examination "Supergrade PPC — Product Knowledge Certification" starts today at 16:00', time: '2 hrs ago', read: false },
  { id: 'N2', txt: 'New learning content published: Hardworker OPC 53 — Strength & Grade Basics', time: 'Yesterday', read: false },
  { id: 'N3', txt: 'Expert has answered your question on Manufacturing Process', time: '2 days ago', read: true },
];

export const AUDIT: AuditEntry[] = ([
  ['Login', 'Session', 'U3', '2026-09-26 09:02'],
  ['Content published', 'Learning Content', 'U2', '2026-09-25 17:41'],
  ['Examination created', 'Examination E1', 'U2', '2026-09-25 15:20'],
  ['User created', 'User U10', 'U3', '2026-09-24 10:05'],
  ['Certificate generated', 'Certificate RC-2026-0187', 'U2', '2026-09-18 16:30'],
  ['Question modified', 'Question Q12', 'U2', '2026-09-17 12:14'],
] as [string, string, string, string][]).map((a, i) => ({
  id: 'L' + i, action: a[0], entity: a[1], user: a[2], time: a[3], ip: '10.22.14.' + (30 + i),
}));
