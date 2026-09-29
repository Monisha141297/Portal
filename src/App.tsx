import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ModalHost from './components/ModalHost';
import Toasts from './components/Toasts';
import AIPanel from './components/AIPanel';
import Login from './pages/auth/Login';
import Otp from './pages/auth/Otp';

import ParticipantDashboard from './pages/participant/Dashboard';
import LearningPortal from './pages/participant/LearningPortal';
import Category from './pages/participant/Category';
import Viewer from './pages/participant/Viewer';
import Assess from './pages/participant/Assess';
import Exam from './pages/participant/Exam';
import Result from './pages/participant/Result';
import Leaderboard from './pages/participant/Leaderboard';
import Events from './pages/participant/Events';
import Wait from './pages/participant/Wait';
import History from './pages/participant/History';
import Certs from './pages/participant/Certs';
import CertView from './pages/participant/CertView';
import Profile from './pages/participant/Profile';
import Expert from './pages/participant/Expert';

import TrainerDashboard from './pages/trainer/Dashboard';
import Topics from './pages/trainer/Topics';
import Builder from './pages/trainer/Builder';
import Bank from './pages/trainer/Bank';
import Exams from './pages/trainer/Exams';
import Live from './pages/trainer/Live';
import Results from './pages/trainer/Results';
import TrainerExpert from './pages/trainer/Expert';
import TrainerCerts from './pages/trainer/Certs';
import Analytics from './pages/trainer/Analytics';

import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Roles from './pages/admin/Roles';
import Active from './pages/admin/Active';
import Activity from './pages/admin/Activity';
import Usage from './pages/admin/Usage';
import Audit from './pages/admin/Audit';

export default function App() {
  return (
    <BrowserRouter>
      <div id="app">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/otp" element={<Otp />} />

          {/* Bare full-screen routes (no sidebar/topbar) */}
          <Route path="/app/participant/exam" element={<Exam />} />
          <Route path="/app/participant/wait/:eventId" element={<Wait />} />

          <Route path="/app" element={<AppShell />}>
            <Route path="participant/dashboard" element={<ParticipantDashboard />} />
            <Route path="participant/learn" element={<LearningPortal />} />
            <Route path="participant/learn/:catId" element={<Category />} />
            <Route path="participant/viewer/:topicId" element={<Viewer />} />
            <Route path="participant/assess" element={<Assess />} />
            <Route path="participant/result" element={<Result />} />
            <Route path="participant/leaderboard/:eventId" element={<Leaderboard />} />
            <Route path="participant/events" element={<Events />} />
            <Route path="participant/history" element={<History />} />
            <Route path="participant/certs" element={<Certs />} />
            <Route path="participant/certs/:certId" element={<CertView />} />
            <Route path="participant/profile" element={<Profile />} />
            <Route path="participant/expert" element={<Expert />} />

            <Route path="trainer/dashboard" element={<TrainerDashboard />} />
            <Route path="trainer/topics" element={<Topics />} />
            <Route path="trainer/builder" element={<Builder />} />
            <Route path="trainer/bank" element={<Bank />} />
            <Route path="trainer/exams" element={<Exams />} />
            <Route path="trainer/live/:eventId" element={<Live />} />
            <Route path="trainer/results" element={<Results />} />
            <Route path="trainer/results/:eventId" element={<Results />} />
            <Route path="trainer/expert" element={<TrainerExpert />} />
            <Route path="trainer/certs" element={<TrainerCerts />} />
            <Route path="trainer/analytics" element={<Analytics />} />

            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/users" element={<Users />} />
            <Route path="admin/roles" element={<Roles />} />
            <Route path="admin/active" element={<Active />} />
            <Route path="admin/activity" element={<Activity />} />
            <Route path="admin/usage" element={<Usage />} />
            <Route path="admin/audit" element={<Audit />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
      <ModalHost />
      <Toasts />
      <AIPanel />
    </BrowserRouter>
  );
}
