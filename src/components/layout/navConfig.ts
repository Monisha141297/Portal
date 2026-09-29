import type { Role } from '../../types';

export interface NavItem { to: string; icon: string; label: string; pillKey?: 'expert'; }
export interface NavSection { title: string; items: NavItem[]; }

export const NAV: Record<Role, NavSection[]> = {
  participant: [
    { title: 'Learning', items: [
      { to: '/app/participant/dashboard', icon: '⌂', label: 'Dashboard' },
      { to: '/app/participant/learn', icon: '▤', label: 'Learning Portal' },
      { to: '/app/participant/events', icon: '◉', label: 'Live Events' },
      { to: '/app/participant/assess', icon: '✎', label: 'Self Assessment' },
    ] },
    { title: 'My Record', items: [
      { to: '/app/participant/certs', icon: '❖', label: 'Certifications' },
      { to: '/app/participant/history', icon: '↺', label: 'History & Attempts' },
      { to: '/app/participant/expert', icon: '✆', label: 'My Questions' },
      { to: '/app/participant/profile', icon: '☺', label: 'Profile' },
    ] },
  ],
  trainer: [
    { title: 'Overview', items: [
      { to: '/app/trainer/dashboard', icon: '⌂', label: 'Dashboard' },
      { to: '/app/trainer/analytics', icon: '◫', label: 'Analytics' },
    ] },
    { title: 'Content', items: [
      { to: '/app/trainer/topics', icon: '▤', label: 'Topics & Products' },
      { to: '/app/trainer/builder', icon: '✎', label: 'Content Builder' },
      { to: '/app/trainer/bank', icon: '☰', label: 'Question Bank' },
    ] },
    { title: 'Examination', items: [
      { to: '/app/trainer/exams', icon: '◉', label: 'Examinations' },
      { to: '/app/trainer/results', icon: '◫', label: 'Results & Leaderboard' },
      { to: '/app/trainer/certs', icon: '❖', label: 'Certification' },
    ] },
    { title: 'Support', items: [
      { to: '/app/trainer/expert', icon: '✆', label: 'Expert Questions', pillKey: 'expert' },
    ] },
  ],
  admin: [
    { title: 'Overview', items: [
      { to: '/app/admin/dashboard', icon: '⌂', label: 'Dashboard' },
    ] },
    { title: 'Users', items: [
      { to: '/app/admin/users', icon: '☺', label: 'User Management' },
      { to: '/app/admin/roles', icon: '⚿', label: 'Roles & Access' },
    ] },
    { title: 'Monitoring', items: [
      { to: '/app/admin/active', icon: '◉', label: 'Active Users' },
      { to: '/app/admin/activity', icon: '◫', label: 'Daily Activity' },
      { to: '/app/admin/usage', icon: '▤', label: 'System Usage' },
      { to: '/app/admin/audit', icon: '☰', label: 'Audit Logs' },
    ] },
  ],
};

export const HOME_ROUTE: Record<Role, string> = {
  participant: '/app/participant/dashboard',
  trainer: '/app/trainer/dashboard',
  admin: '/app/admin/dashboard',
};
