// Core domain types for the LearnCert platform

export type Role = 'participant' | 'trainer' | 'admin';
export type UserStatus = 'Active' | 'Inactive';

export interface AppUser {
  id: string;
  emp: string;
  name: string;
  role: Role;
  dept: string;
  plant: string;
  location: string;
  desig: string;
  mobile: string;
  status: UserStatus;
  created: string;
}

export interface Category {
  id: string;
  name: string;
  desc: string;
  icon: string;
  cls: string;
  status: string;
}

export interface Product {
  id: string;
  cat: string;
  name: string;
  desc: string;
  status: string;
}

export type TopicStatus = 'Published' | 'Draft' | 'Archived';

export interface Topic {
  id: string;
  prod: string;
  name: string;
  desc: string;
  pass: number;
  defTime: number;
  examCount: number;
  status: TopicStatus;
}

export type SlideType = 'text' | 'image' | 'video';

export interface Slide {
  id: string;
  title: string;
  type: SlideType;
  body?: string;
  media?: string;
  caption?: string;
  list?: string[];
  explain?: string;
  key?: string;
}

export type QuestionType = 'single' | 'multi' | 'tf' | 'yn' | 'fill' | 'image' | 'scenario' | 'match';

export interface MatchPair extends Array<string> {
  0: string;
  1: string;
}

export interface Question {
  id: string;
  topic: string;
  type: QuestionType;
  text: string;
  opts: string[];
  ans: (number | string)[];
  pairs?: [string, string][];
  marks: number;
  time: number | null;
  mandatory: boolean;
  status: 'Active' | 'Archived';
  by: string;
  created: string;
  diff: 'Easy' | 'Medium' | 'Hard';
  explain: string;
  img?: string;
}

export type AttemptMode = 'self' | 'live';
export type AttemptResult = 'Pass' | 'Fail';

export interface AttemptRow {
  q: Question;
  a: unknown;
  t: number;
  state: 'c' | 'w' | 'u';
  earned: number;
}

export interface ExamState {
  mode: AttemptMode;
  topicId: string;
  eventId: string | null;
  paper: PreparedQuestion[];
  idx: number;
  answers: { a: unknown; t: number }[];
  pass: number;
  defTime: number;
  total: number;
  started: number;
  elapsed: number;
  name: string;
  rows?: AttemptRow[];
  earned?: number;
  pct?: number;
  timeTaken?: string;
  result?: AttemptResult;
  cert?: string;
}

export interface PreparedQuestion extends Question {
  dOpts?: string[];
  dAns?: number[];
  left?: string[];
  right?: string[];
}

export interface Attempt {
  id: string;
  user: string;
  topic: string;
  mode: AttemptMode;
  date: string;
  score: number;
  total: number;
  pct: number;
  result: AttemptResult;
  time: string;
  qcount: number;
  detail?: ExamState;
}

export type EventStatus = 'Draft' | 'Scheduled' | 'Waiting' | 'Live' | 'Completed';
export type EventType = 'Private' | 'Open';

export interface EventResult {
  u: string;
  s: number;
  t: string;
}

export interface ExamEvent {
  id: string;
  name: string;
  topic: string;
  code: string;
  type: EventType;
  date: string;
  time: string;
  count: number;
  pass: number;
  defTime: number;
  status: EventStatus;
  lb: boolean;
  res: boolean;
  cert: boolean;
  parts: string[];
  joined: string[];
  by: string;
  results?: EventResult[];
}

export interface Certificate {
  id: string;
  user: string;
  topic: string;
  event: string;
  score: number;
  date: string;
  status: 'Valid' | 'Revoked';
}

export type ExpertStatus = 'Raised' | 'Assigned' | 'Answered' | 'Closed';

export interface ExpertQuestion {
  id: string;
  user: string;
  topic: string;
  q: string;
  ai: string;
  note: string;
  date: string;
  status: ExpertStatus;
  resp: string;
  expert: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  user: string;
  time: string;
  ip: string;
}

export interface Notification {
  id: string;
  txt: string;
  time: string;
  read: boolean;
}

export interface ProgressEntry {
  viewed: string[];
  done: boolean;
}

export interface AiMessage {
  r: 'ai' | 'me' | 'sys';
  t: string;
}

export interface AiState {
  open: boolean;
  topic: string | null;
  msgs: AiMessage[];
}
