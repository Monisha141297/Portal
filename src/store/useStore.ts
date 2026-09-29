import { create } from 'zustand';
import type { ReactNode } from 'react';
import type {
  AppUser, Category, Product, Topic, Slide, Question, Attempt, ExamEvent, Certificate,
  ExpertQuestion, AuditEntry, Notification, ProgressEntry, AiState, AiMessage, ExamState,
  AttemptMode, PreparedQuestion,
} from '../types';
import { USERS } from '../data/users';
import { CATEGORIES, PRODUCTS, TOPICS } from '../data/catalog';
import { SLIDES } from '../data/slides';
import { QUESTIONS } from '../data/questions';
import { ATTEMPTS, EVENTS, CERTS, EXPERT_QS, PROGRESS, NOTIFS, AUDIT } from '../data/history';
import { AI_KB, aiAnswer as aiAnswerRaw } from '../data/aiKb';
import { uid, nowStr, shuffle, mmss } from '../lib/helpers';
import { topicById, productOfTopic, categoryOfTopic, pathOf, activeQuestionsOf, progressKey, progressOf } from '../lib/selectors';
import { buildPaper, gradePaper } from '../lib/examEngine';

let qseq = QUESTIONS.length;

interface ToastMsg { id: string; text: string; kind?: 'ok' | 'bad' | 'warn'; }

interface StoreState {
  // ---- data ----
  users: AppUser[];
  categories: Category[];
  products: Product[];
  topics: Topic[];
  slides: Record<string, Slide[]>;
  questions: Question[];
  attempts: Attempt[];
  events: ExamEvent[];
  certs: Certificate[];
  expertQs: ExpertQuestion[];
  audit: AuditEntry[];
  notifs: Notification[];
  progress: Record<string, ProgressEntry>;
  aiKb: typeof AI_KB;

  // ---- session ----
  currentUser: AppUser | null;
  loginEmp: string;
  otpTries: number;
  ai: AiState;
  exam: ExamState | null;
  guideOpen: boolean;
  toasts: ToastMsg[];
  modal: ReactNode | null;

  // ---- UI memory (mirrors original global `S`) ----
  builderTopic: string;
  builderSlideIndex: number;
  bankTopic: string;
  bankFilters: { q: string; type: string; mand: string; diff: string };
  bankPage: number;
  analyticsTab: string;
  simJoin: string[];
  userFilters: { q: string; role: string; status: string };
  auditFilter: string;

  // ---- selectors (bound helpers) ----
  topic: (id: string) => Topic;
  productOf: (topicId: string) => Product;
  categoryOf: (topicId: string) => Category;
  path: (topicId: string) => string;
  qOf: (topicId: string) => Question[];
  userById: (id: string) => AppUser;
  progOf: (userId: string, topicId: string) => { viewed: string[]; done: boolean; pct: number; total: number };

  // ---- actions: session ----
  setLoginEmp: (v: string) => void;
  setOtpTries: (n: number) => void;
  loginAs: (id: string) => void;
  logout: () => void;
  toast: (text: string, kind?: 'ok' | 'bad' | 'warn') => void;
  dismissToast: (id: string) => void;
  openModal: (node: ReactNode) => void;
  closeModal: () => void;
  markNotifsRead: () => void;
  setGuideOpen: (v: boolean) => void;
  auditLog: (action: string, entity: string) => void;
  notify: (txt: string) => void;

  // ---- actions: learning ----
  viewSlide: (userId: string, topicId: string, slideId: string) => void;
  completeLearning: (userId: string, topicId: string) => void;

  // ---- actions: AI assistant ----
  openAI: (topicId?: string) => void;
  closeAI: () => void;
  aiSend: (topicId: string, text: string) => void;
  aiPushMessage: (msg: AiMessage) => void;
  submitExpertQuestion: (userId: string, topicId: string, question: string, aiResp: string, note: string) => void;

  // ---- actions: assessment / exam ----
  launchExam: (topicId: string, mode: AttemptMode, eventId: string | null, userId: string) => string | null;
  setAnswer: (idx: number, a: unknown) => void;
  setExamIndex: (idx: number) => void;
  setAnswerTime: (idx: number, t: number) => void;
  finishExam: (userId: string) => void;
  clearExam: () => void;
  loadPastResult: (attemptId: string) => void;

  // ---- actions: events ----
  joinEvent: (eventId: string, userId: string) => void;
  leaveWait: (eventId: string, userId: string) => void;
  startLive: (eventId: string) => void;
  endExam: (eventId: string) => void;
  simulateJoin: () => void;

  // ---- actions: trainer content ----
  setBuilderTopic: (t: string) => void;
  setBuilderSlideIndex: (i: number) => void;
  saveTopic: (id: string | null, o: Omit<Topic, 'id'>) => void;
  saveProduct: (id: string | null, o: Omit<Product, 'id'>) => void;
  addSlide: (topicId: string, atIndex: number) => void;
  updateSlide: (topicId: string, index: number, patch: Partial<Slide>) => void;
  duplicateSlide: (topicId: string, index: number) => void;
  deleteSlide: (topicId: string, index: number) => boolean;
  moveSlide: (topicId: string, index: number, dir: 1 | -1) => void;
  reorderSlides: (topicId: string, from: number, to: number) => void;
  publishContent: (topicId: string) => void;

  // ---- actions: question bank ----
  setBankTopic: (t: string) => void;
  setBankFilters: (f: Partial<StoreState['bankFilters']>) => void;
  setBankPage: (p: number) => void;
  saveQuestion: (id: string | null, o: Omit<Question, 'id' | 'by' | 'created'>) => void;
  duplicateQuestion: (id: string) => void;
  toggleArchiveQuestion: (id: string) => void;

  // ---- actions: examinations (trainer) ----
  saveExam: (id: string | null, o: Omit<ExamEvent, 'id' | 'joined'>) => ExamEvent;
  publishExam: (id: string) => boolean;

  // ---- actions: expert queue ----
  answerExpert: (id: string, resp: string, expertName: string) => void;
  assignExpert: (id: string, expertName: string) => void;
  closeExpert: (id: string) => void;
  publishToKB: (id: string) => void;

  // ---- actions: certificates ----
  revokeCert: (id: string) => void;

  // ---- actions: users / admin ----
  setUserFilters: (f: Partial<StoreState['userFilters']>) => void;
  saveUser: (id: string | null, o: Omit<AppUser, 'id' | 'created'>) => string | null;
  toggleUserStatus: (id: string) => void;
  setAuditFilter: (v: string) => void;

  // ---- misc UI state setters ----
  setAnalyticsTab: (t: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  users: USERS.slice(),
  categories: CATEGORIES.slice(),
  products: PRODUCTS.slice(),
  topics: TOPICS.slice(),
  slides: { ...SLIDES },
  questions: QUESTIONS.slice(),
  attempts: ATTEMPTS.slice(),
  events: EVENTS.slice(),
  certs: CERTS.slice(),
  expertQs: EXPERT_QS.slice(),
  audit: AUDIT.slice(),
  notifs: NOTIFS.slice(),
  progress: { ...PROGRESS },
  aiKb: AI_KB,

  currentUser: null,
  loginEmp: '',
  otpTries: 0,
  ai: { open: false, topic: null, msgs: [] },
  exam: null,
  guideOpen: false,
  toasts: [],
  modal: null,

  builderTopic: 'T1',
  builderSlideIndex: 0,
  bankTopic: 'T1',
  bankFilters: { q: '', type: '', mand: '', diff: '' },
  bankPage: 0,
  analyticsTab: 'training',
  simJoin: [],
  userFilters: { q: '', role: '', status: '' },
  auditFilter: '',

  topic: (id) => topicById(get().topics, id),
  productOf: (topicId) => productOfTopic(get().products, get().topics, topicId),
  categoryOf: (topicId) => categoryOfTopic(get().categories, get().products, get().topics, topicId),
  path: (topicId) => pathOf(get().categories, get().products, get().topics, topicId),
  qOf: (topicId) => activeQuestionsOf(get().questions, topicId),
  userById: (id) => get().users.find((u) => u.id === id) || { id, emp: '—', name: 'Unknown', role: 'participant', dept: '—', plant: '—', location: '—', desig: '—', mobile: '—', status: 'Active', created: '' },
  progOf: (userId, topicId) => progressOf(get().progress, userId, topicId, (get().slides[topicId] || []).length),

  setLoginEmp: (v) => set({ loginEmp: v }),
  setOtpTries: (n) => set({ otpTries: n }),
  loginAs: (id) => {
    const u = get().users.find((x) => x.id === id) || null;
    set({ currentUser: u, ai: { open: false, topic: null, msgs: [] } });
    if (u) get().auditLog('Login', 'Session');
  },
  logout: () => {
    get().auditLog('Logout', 'Session');
    set({ currentUser: null, ai: { open: false, topic: null, msgs: [] } });
  },
  toast: (text, kind) => {
    const id = uid('TO');
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openModal: (node) => set({ modal: node }),
  closeModal: () => set({ modal: null }),
  markNotifsRead: () => set((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })),
  setGuideOpen: (v) => set({ guideOpen: v }),
  auditLog: (action, entity) => {
    const user = get().currentUser;
    set((s) => ({
      audit: [{ id: uid('L'), action, entity, user: user ? user.id : '—', time: nowStr(), ip: '10.22.14.' + (10 + Math.floor(Math.random() * 90)) }, ...s.audit],
    }));
  },
  notify: (txt) => set((s) => ({ notifs: [{ id: uid('N'), txt, time: 'Just now', read: false }, ...s.notifs] })),

  viewSlide: (userId, topicId, slideId) => {
    set((s) => {
      const key = progressKey(userId, topicId);
      const existing = s.progress[key] || { viewed: [], done: false };
      if (existing.viewed.includes(slideId)) return {};
      const viewed = [...existing.viewed, slideId];
      const total = (s.slides[topicId] || []).length;
      return { progress: { ...s.progress, [key]: { viewed, done: viewed.length >= total } } };
    });
  },
  completeLearning: (userId, topicId) => {
    set((s) => {
      const key = progressKey(userId, topicId);
      const allIds = (s.slides[topicId] || []).map((sl) => sl.id);
      return { progress: { ...s.progress, [key]: { viewed: allIds, done: true } } };
    });
    get().auditLog('Learning completed', 'Topic ' + topicId);
  },

  openAI: (topicId) => set((s) => {
    const t = topicId || s.ai.topic || 'T1';
    const msgs = s.ai.msgs.length
      ? s.ai.msgs
      : [{ r: 'ai' as const, t: 'Hello ' + (s.currentUser ? s.currentUser.name.split(' ')[0] : '') + '. I am your learning assistant for this topic. I answer using the approved learning content only — ask me anything about ' + get().topic(t).name + '.' }];
    return { ai: { open: true, topic: t, msgs } };
  }),
  closeAI: () => set((s) => ({ ai: { ...s.ai, open: false } })),
  aiPushMessage: (msg) => set((s) => ({ ai: { ...s.ai, msgs: [...s.ai.msgs, msg] } })),
  aiSend: (topicId, text) => {
    const v = text.trim();
    if (!v) return;
    get().aiPushMessage({ r: 'me', t: v });
    setTimeout(() => {
      const s = get();
      const tp = s.topic(topicId);
      const firstTitles = (s.slides[topicId] || []).map((sl) => sl.title);
      const a = aiAnswerRaw(tp.name, s.path(topicId), firstTitles, topicId, v);
      get().aiPushMessage({ r: 'ai', t: a.text });
      get().auditLog('AI question asked', 'Topic ' + topicId);
    }, 700);
  },
  submitExpertQuestion: (userId, topicId, question, aiResp, note) => {
    set((s) => ({
      expertQs: [{ id: uid('X'), user: userId, topic: topicId, q: question || '(question from AI conversation)', ai: aiResp, note, date: nowStr(), status: 'Raised', resp: '', expert: '' }, ...s.expertQs],
    }));
    get().auditLog('Expert question raised', 'Topic ' + topicId);
    get().aiPushMessage({ r: 'sys', t: 'Your question has been escalated to a trainer. You will be notified when it is answered.' });
  },

  launchExam: (topicId, mode, eventId, userId) => {
    const s = get();
    const ev = eventId ? s.events.find((e) => e.id === eventId) || null : null;
    const tp = s.topic(topicId);
    const count = ev ? ev.count : tp.examCount;
    const bank = s.qOf(topicId);
    const built = buildPaper(bank, count);
    if ('error' in built) return built.error;
    const exam: ExamState = {
      mode, topicId, eventId, paper: built.paper, idx: 0,
      answers: built.paper.map(() => ({ a: null, t: 0 })),
      pass: ev ? ev.pass : tp.pass,
      defTime: ev ? ev.defTime : tp.defTime,
      total: built.paper.reduce((sum, q) => sum + q.marks, 0),
      started: Date.now(), elapsed: 0,
      name: ev ? ev.name : tp.name + ' — Self Assessment',
    };
    set({ exam });
    get().auditLog(mode === 'live' ? 'Examination started' : 'Self assessment started', 'Topic ' + topicId);
    void userId;
    return null;
  },
  setAnswer: (idx, a) => set((s) => {
    if (!s.exam) return {};
    const answers = s.exam.answers.slice();
    answers[idx] = { ...answers[idx], a };
    return { exam: { ...s.exam, answers } };
  }),
  setAnswerTime: (idx, t) => set((s) => {
    if (!s.exam) return {};
    const answers = s.exam.answers.slice();
    answers[idx] = { ...answers[idx], t };
    return { exam: { ...s.exam, answers } };
  }),
  setExamIndex: (idx) => set((s) => (s.exam ? { exam: { ...s.exam, idx } } : {})),
  finishExam: (userId) => {
    const s = get();
    const E = s.exam;
    if (!E) return;
    const { rows, earned } = gradePaper(E.paper, E.answers);
    const pct = Math.round((earned / E.total) * 100);
    const secs = Math.round((Date.now() - E.started) / 1000);
    const result = pct >= E.pass ? 'Pass' as const : 'Fail' as const;
    const timeTaken = mmss(secs);
    let certId: string | undefined;
    const updated: ExamState = { ...E, rows, earned, pct, timeTaken, result };

    set((st) => ({
      attempts: [...st.attempts, { id: uid('A'), user: userId, topic: E.topicId, mode: E.mode, date: nowStr(), score: earned, total: E.total, pct, result, time: timeTaken, qcount: E.paper.length, detail: updated }],
    }));
    get().auditLog(E.mode === 'live' ? 'Examination completed' : 'Self assessment completed', 'Topic ' + E.topicId + ' — ' + pct + '%');

    if (E.mode === 'live' && result === 'Pass' && E.eventId) {
      const ev = get().events.find((e) => e.id === E.eventId);
      if (ev && ev.cert && !get().certs.some((c) => c.user === userId && c.topic === E.topicId && c.event === ev.id)) {
        certId = 'RC-2026-' + String(190 + get().certs.length).padStart(4, '0');
        set((st) => ({ certs: [...st.certs, { id: certId!, user: userId, topic: E.topicId, event: ev.id, score: pct, date: new Date().toISOString().slice(0, 10), status: 'Valid' }] }));
        get().auditLog('Certificate generated', 'Certificate ' + certId);
        get().notify('Certificate ' + certId + ' issued for ' + get().topic(E.topicId).name);
        updated.cert = certId;
      }
      if (ev) {
        set((st) => ({
          events: st.events.map((e) => e.id === ev.id
            ? { ...e, status: 'Completed', results: (e.results || []).filter((r) => r.u !== userId).concat([{ u: userId, s: pct, t: timeTaken }]) }
            : e),
        }));
      }
      get().notify('Your result for "' + E.name + '" is available: ' + pct + '% — ' + result);
    }
    set({ exam: updated });
  },
  clearExam: () => set({ exam: null }),
  loadPastResult: (attemptId) => {
    const a = get().attempts.find((x) => x.id === attemptId);
    if (a && a.detail) set({ exam: a.detail });
  },

  joinEvent: (eventId, userId) => {
    set((s) => ({
      events: s.events.map((e) => {
        if (e.id !== eventId) return e;
        const joined = e.joined.includes(userId) ? e.joined : [...e.joined, userId];
        return { ...e, joined, status: e.status === 'Scheduled' ? 'Waiting' : e.status };
      }),
    }));
    get().auditLog('Joined waiting room', 'Examination ' + eventId);
  },
  leaveWait: (eventId, userId) => {
    set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, joined: e.joined.filter((u) => u !== userId) } : e)) }));
  },
  startLive: (eventId) => {
    set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, status: 'Live' } : e)) }));
    get().auditLog('Examination start', 'Examination ' + eventId);
    const ev = get().events.find((e) => e.id === eventId);
    if (ev) get().notify('Examination "' + ev.name + '" has started');
  },
  endExam: (eventId) => {
    set((s) => ({ events: s.events.map((e) => (e.id === eventId ? { ...e, status: 'Completed' } : e)) }));
    get().auditLog('Examination completion', 'Examination ' + eventId);
  },
  simulateJoin: () => {
    const pool = ['Suresh Babu', 'Lakshmi Narayan', 'Vimal Chandran', 'Divya Ramesh', 'Naveen Kumar', 'Shalini Prasad'];
    set((s) => (s.simJoin.length >= pool.length ? {} : { simJoin: [...s.simJoin, pool[s.simJoin.length]] }));
  },

  setBuilderTopic: (t) => set({ builderTopic: t, builderSlideIndex: 0 }),
  setBuilderSlideIndex: (i) => set({ builderSlideIndex: i }),
  saveTopic: (id, o) => {
    if (id) {
      set((s) => ({ topics: s.topics.map((t) => (t.id === id ? { ...t, ...o } : t)) }));
      get().auditLog('Content modified', 'Topic ' + id);
    } else {
      const nid = uid('T');
      set((s) => ({
        topics: [...s.topics, { id: nid, ...o }],
        slides: { ...s.slides, [nid]: [{ id: 'S1', title: 'New slide', type: 'text', body: 'Start writing your content here.' }] },
      }));
      get().auditLog('Content creation', 'Topic ' + nid);
    }
  },
  saveProduct: (id, o) => {
    if (id) {
      set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...o } : p)) }));
    } else {
      set((s) => ({ products: [...s.products, { id: uid('P'), ...o }] }));
    }
    get().auditLog('Content ' + (id ? 'modified' : 'creation'), 'Product');
  },
  addSlide: (topicId, atIndex) => {
    set((s) => {
      const arr = (s.slides[topicId] || []).slice();
      arr.splice(atIndex + 1, 0, { id: uid('S'), title: 'New slide', type: 'text', body: '' });
      return { slides: { ...s.slides, [topicId]: arr }, builderSlideIndex: atIndex + 1 };
    });
    get().auditLog('Content creation', 'Slide');
  },
  updateSlide: (topicId, index, patch) => {
    set((s) => {
      const arr = (s.slides[topicId] || []).slice();
      if (!arr[index]) return {};
      arr[index] = { ...arr[index], ...patch };
      return { slides: { ...s.slides, [topicId]: arr } };
    });
  },
  duplicateSlide: (topicId, index) => {
    set((s) => {
      const arr = (s.slides[topicId] || []).slice();
      const copy = { ...arr[index], id: uid('S'), title: arr[index].title + ' (copy)' };
      arr.splice(index + 1, 0, copy);
      return { slides: { ...s.slides, [topicId]: arr }, builderSlideIndex: index + 1 };
    });
  },
  deleteSlide: (topicId, index) => {
    const arr = get().slides[topicId] || [];
    if (arr.length <= 1) return false;
    set((s) => {
      const a = (s.slides[topicId] || []).slice();
      a.splice(index, 1);
      return { slides: { ...s.slides, [topicId]: a }, builderSlideIndex: Math.max(0, index - 1) };
    });
    get().auditLog('Content modified', 'Slide deleted');
    return true;
  },
  moveSlide: (topicId, index, dir) => {
    set((s) => {
      const arr = (s.slides[topicId] || []).slice();
      const n = index + dir;
      if (n < 0 || n >= arr.length) return {};
      [arr[index], arr[n]] = [arr[n], arr[index]];
      return { slides: { ...s.slides, [topicId]: arr }, builderSlideIndex: n };
    });
  },
  reorderSlides: (topicId, from, to) => {
    set((s) => {
      const arr = (s.slides[topicId] || []).slice();
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return { slides: { ...s.slides, [topicId]: arr }, builderSlideIndex: to };
    });
    get().auditLog('Content modified', 'Slide order');
  },
  publishContent: (topicId) => {
    set((s) => ({ topics: s.topics.map((t) => (t.id === topicId ? { ...t, status: 'Published' } : t)) }));
    get().auditLog('Content publication', 'Topic ' + topicId);
    get().notify('New learning content published: ' + get().topic(topicId).name);
  },

  setBankTopic: (t) => set({ bankTopic: t, bankPage: 0 }),
  setBankFilters: (f) => set((s) => ({ bankFilters: { ...s.bankFilters, ...f }, bankPage: 0 })),
  setBankPage: (p) => set({ bankPage: p }),
  saveQuestion: (id, o) => {
    if (id) {
      set((s) => ({ questions: s.questions.map((q) => (q.id === id ? { ...q, ...o } : q)) }));
      get().auditLog('Question modified', 'Question ' + id);
    } else {
      qseq++;
      const nid = 'Q' + qseq;
      const user = get().currentUser;
      set((s) => ({ questions: [...s.questions, { id: nid, by: user ? user.name : '—', created: new Date().toISOString().slice(0, 10), ...o }] }));
      get().auditLog('Question creation', 'Question');
    }
  },
  duplicateQuestion: (id) => {
    const q = get().questions.find((x) => x.id === id);
    if (!q) return;
    qseq++;
    const copy = { ...q, id: 'Q' + qseq, text: q.text + ' (copy)', mandatory: false };
    set((s) => ({ questions: [...s.questions, copy] }));
  },
  toggleArchiveQuestion: (id) => {
    set((s) => ({ questions: s.questions.map((q) => (q.id === id ? { ...q, status: q.status === 'Active' ? 'Archived' : 'Active' } : q)) }));
    get().auditLog('Question modified', 'Question ' + id);
  },

  saveExam: (id, o) => {
    let ev: ExamEvent;
    if (id) {
      set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...o } : e)) }));
      ev = get().events.find((e) => e.id === id)!;
      get().auditLog('Examination modified', 'Examination ' + id);
    } else {
      const nid = uid('E');
      ev = { id: nid, joined: [], ...o };
      set((s) => ({ events: [...s.events, ev] }));
      get().auditLog('Examination creation', 'Examination ' + nid);
    }
    if (o.status !== 'Draft') get().notify('New examination: ' + o.name + ' on ' + o.date + ' at ' + o.time);
    return ev;
  },
  publishExam: (id) => {
    const e = get().events.find((x) => x.id === id);
    if (!e) return false;
    const mand = get().qOf(e.topic).filter((q) => q.mandatory).length;
    if (mand > e.count) return false;
    set((s) => ({ events: s.events.map((x) => (x.id === id ? { ...x, status: 'Scheduled' } : x)) }));
    get().auditLog('Examination modified', 'Examination ' + id);
    get().notify('New examination: ' + e.name);
    return true;
  },

  answerExpert: (id, resp, expertName) => {
    set((s) => ({ expertQs: s.expertQs.map((x) => (x.id === id ? { ...x, resp, status: 'Answered', expert: expertName } : x)) }));
    get().auditLog('Expert response', 'Expert question ' + id);
    const x = get().expertQs.find((q) => q.id === id);
    if (x) get().notify('An expert has answered your question on ' + get().topic(x.topic).name);
  },
  assignExpert: (id, expertName) => {
    set((s) => ({ expertQs: s.expertQs.map((x) => (x.id === id ? { ...x, status: 'Assigned', expert: expertName } : x)) }));
  },
  closeExpert: (id) => {
    set((s) => ({ expertQs: s.expertQs.map((x) => (x.id === id ? { ...x, status: 'Closed' } : x)) }));
  },
  publishToKB: (id) => {
    const x = get().expertQs.find((q) => q.id === id);
    if (!x) return;
    const keys = x.q.toLowerCase().split(/\s+/).filter((w) => w.length > 5).slice(0, 4);
    const entry: [string[], string] = [keys, x.resp + '\n\n(Expert clarification published by ' + x.expert + ')'];
    (AI_KB[x.topic] = AI_KB[x.topic] || []).unshift(entry);
  },

  revokeCert: (id) => {
    set((s) => ({ certs: s.certs.map((c) => (c.id === id ? { ...c, status: c.status === 'Valid' ? 'Revoked' : 'Valid' } : c)) }));
    get().auditLog('Certificate status changed', 'Certificate ' + id);
  },

  setUserFilters: (f) => set((s) => ({ userFilters: { ...s.userFilters, ...f } })),
  saveUser: (id, o) => {
    if (id) {
      set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...o } : u)) }));
      get().auditLog('User modified', 'User ' + id);
      return null;
    }
    if (get().users.some((u) => u.emp === o.emp)) return 'dup';
    const nid = uid('U');
    set((s) => ({ users: [...s.users, { id: nid, created: new Date().toISOString().slice(0, 10), ...o }] }));
    get().auditLog('User creation', 'User ' + nid);
    return null;
  },
  toggleUserStatus: (id) => {
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u)) }));
    get().auditLog('Role/access change', 'User ' + id);
  },
  setAuditFilter: (v) => set({ auditFilter: v }),
  setAnalyticsTab: (t) => set({ analyticsTab: t }),
}));

export function shuffleArr<T>(a: T[]) { return shuffle(a); }
export type { PreparedQuestion };
