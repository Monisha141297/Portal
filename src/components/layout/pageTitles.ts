// Maps a route pathname to the breadcrumb title shown in the topbar.
// Ordered most-specific first since matching is by prefix.
const TITLES: [string, string][] = [
  ['/app/participant/dashboard', 'Dashboard'],
  ['/app/participant/learn', 'Learning Portal'],
  ['/app/participant/viewer', 'Learning Content'],
  ['/app/participant/assess', 'Self Assessment'],
  ['/app/participant/events', 'Live Events'],
  ['/app/participant/result', 'Result'],
  ['/app/participant/leaderboard', 'Leaderboard'],
  ['/app/participant/certs', 'Certifications'],
  ['/app/participant/history', 'History & Attempts'],
  ['/app/participant/expert', 'My Questions'],
  ['/app/participant/profile', 'Profile'],

  ['/app/trainer/dashboard', 'Dashboard'],
  ['/app/trainer/topics', 'Topics & Products'],
  ['/app/trainer/builder', 'Learning Content Builder'],
  ['/app/trainer/bank', 'Question Bank'],
  ['/app/trainer/exams', 'Examination Management'],
  ['/app/trainer/live', 'Live Event Control'],
  ['/app/trainer/results', 'Results & Leaderboard'],
  ['/app/trainer/expert', 'Expert Questions'],
  ['/app/trainer/certs', 'Certification'],
  ['/app/trainer/analytics', 'Analytics'],

  ['/app/admin/dashboard', 'Dashboard'],
  ['/app/admin/users', 'User Management'],
  ['/app/admin/roles', 'Roles & Access'],
  ['/app/admin/active', 'Active Users'],
  ['/app/admin/activity', 'Daily Activity'],
  ['/app/admin/usage', 'System Usage'],
  ['/app/admin/audit', 'Audit Logs'],
];

export function titleForPath(pathname: string): string {
  const hit = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + '/'));
  return hit ? hit[1] : 'LearnCert Platform';
}
