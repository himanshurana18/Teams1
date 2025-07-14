import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { TeamProvider } from './contexts/TeamContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import JoinTeamForm from './components/auth/JoinTeamForm';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import Schedule from './pages/Schedule';
import EventDetail from './pages/EventDetail';
import Payment from './pages/Payment';
import Finance from './pages/Finance';
import Profile from './pages/Profile';
import Team from './pages/Team';

const Messages = () => <div className="p-6">Messages page - Coming soon!</div>;
const Tasks = () => <div className="p-6">Tasks page - Coming soon!</div>;
const Settings = () => <div className="p-6">Settings page - Coming soon!</div>;

function App() {
  return (
    <Router>
      <AuthProvider>
        <TeamProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/join" element={<JoinTeamForm />} />
            
            {/* Protected routes */}
            <Route path="/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />
            
            <Route path="/create-team" element={
              <ProtectedRoute>
                <CreateTeam />
              </ProtectedRoute>
            } />
            
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="schedule/event/:eventId" element={<EventDetail />} />
              <Route path="team" element={<Team />} />
              <Route path="messages" element={<Messages />} />
              <Route path="payment" element={<Payment />} />
              <Route path="finance" element={<Finance />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </TeamProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;