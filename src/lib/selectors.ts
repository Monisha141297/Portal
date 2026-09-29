import type { Category, Product, Topic, Question, ProgressEntry } from '../types';

export function topicById(topics: Topic[], id: string): Topic {
  return topics.find((t) => t.id === id) || { id, prod: '', name: 'Unknown', desc: '', pass: 70, defTime: 30, examCount: 0, status: 'Draft' };
}
export function productOfTopic(products: Product[], topics: Topic[], topicId: string): Product {
  const t = topicById(topics, topicId);
  return products.find((p) => p.id === t.prod) || { id: '', cat: '', name: '—', desc: '', status: 'Active' };
}
export function categoryOfTopic(categories: Category[], products: Product[], topics: Topic[], topicId: string): Category {
  const p = productOfTopic(products, topics, topicId);
  return categories.find((c) => c.id === p.cat) || { id: '', name: '—', desc: '', icon: '', cls: '', status: 'Active' };
}
export function pathOf(categories: Category[], products: Product[], topics: Topic[], topicId: string): string {
  return (
    categoryOfTopic(categories, products, topics, topicId).name +
    ' → ' +
    productOfTopic(products, topics, topicId).name +
    ' → ' +
    topicById(topics, topicId).name
  );
}
export function activeQuestionsOf(questions: Question[], topicId: string): Question[] {
  return questions.filter((q) => q.topic === topicId && q.status === 'Active');
}

export function progressKey(userId: string, topicId: string): string {
  return userId + ':' + topicId;
}
export function progressOf(progress: Record<string, ProgressEntry>, userId: string, topicId: string, slideCount: number) {
  const p = progress[progressKey(userId, topicId)] || { viewed: [], done: false };
  const total = slideCount || 1;
  return { viewed: p.viewed, done: p.done, pct: Math.round((p.viewed.length / total) * 100), total };
}

export function resultLabel(pct: number, pass: number): 'Pass' | 'Fail' {
  return pct >= pass ? 'Pass' : 'Fail';
}
