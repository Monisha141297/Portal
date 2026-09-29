import type { Question, PreparedQuestion, AttemptRow } from '../types';
import { shuffle } from './helpers';

export function buildPaper(bank: Question[], count: number): { paper: PreparedQuestion[]; mandatory: number; pool: number } | { error: string } {
  const mand = bank.filter((q) => q.mandatory);
  if (mand.length > count) {
    return { error: `This topic has ${mand.length} mandatory questions but the examination is configured for only ${count} questions. The trainer must correct the configuration.` };
  }
  const pool = shuffle(bank.filter((q) => !q.mandatory)).slice(0, count - mand.length);
  return { paper: shuffle(mand.concat(pool)).map(prepQ), mandatory: mand.length, pool: bank.length };
}

export function prepQ(q: Question): PreparedQuestion {
  const o: PreparedQuestion = { ...q };
  if (q.type === 'match' && q.pairs) {
    o.right = shuffle(q.pairs.map((p) => p[1]));
    o.left = q.pairs.map((p) => p[0]);
    return o;
  }
  if (q.opts && q.opts.length) {
    const fixed = q.type === 'tf' || q.type === 'yn';
    const order = fixed ? q.opts.map((_, i) => i) : shuffle(q.opts.map((_, i) => i));
    o.dOpts = order.map((i) => q.opts[i]);
    o.dAns = order
      .map((orig, pos) => ((q.ans as number[]).indexOf(orig) >= 0 ? pos : -1))
      .filter((x) => x >= 0);
  }
  return o;
}

export function gradeQ(q: PreparedQuestion, a: unknown): { state: 'c' | 'w' | 'u'; earned: number } {
  if (a === null || a === undefined || (Array.isArray(a) && !a.filter(Boolean).length) || a === '') return { state: 'u', earned: 0 };
  if (q.type === 'match' && q.pairs && q.left) {
    const arr = a as string[];
    const ok = q.left.every((l, i) => arr[i] === (q.pairs!.find((p) => p[0] === l) || [])[1]);
    return { state: ok ? 'c' : 'w', earned: ok ? q.marks : 0 };
  }
  if (q.type === 'fill') {
    const v = String(a).trim().toLowerCase();
    const ok = (q.ans as string[]).some((x) => v === String(x).toLowerCase() || v.includes(String(x).toLowerCase()));
    return { state: ok ? 'c' : 'w', earned: ok ? q.marks : 0 };
  }
  if (q.type === 'multi') {
    const sel = ((a as number[]) || []).slice().sort().join(',');
    const cor = (q.dAns || []).slice().sort().join(',');
    return { state: sel === cor ? 'c' : 'w', earned: sel === cor ? q.marks : 0 };
  }
  const ok = (q.dAns || []).indexOf(a as number) >= 0;
  return { state: ok ? 'c' : 'w', earned: ok ? q.marks : 0 };
}

export function gradePaper(paper: PreparedQuestion[], answers: { a: unknown; t: number }[]): { rows: AttemptRow[]; earned: number } {
  let earned = 0;
  const rows = paper.map((q, i) => {
    const g = gradeQ(q, answers[i].a);
    earned += g.earned;
    return { q, a: answers[i].a, t: answers[i].t, state: g.state, earned: g.earned };
  });
  return { rows, earned };
}
