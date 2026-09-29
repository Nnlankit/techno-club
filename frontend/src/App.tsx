import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { DomainsPage } from './pages/DomainsPage';
import { EventsPage } from './pages/EventsPage';
import { HackathonsPage } from './pages/HackathonsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TasksPage } from './pages/TasksPage';
import { ActivitiesPage } from './pages/ActivitiesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { MeetingsPage } from './pages/MeetingsPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { FinancePage } from './pages/FinancePage';
import { SponsorsPage } from './pages/SponsorsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { VerifyCertificatePage } from './pages/VerifyCertificatePage';
import { ProfilePage } from './pages/ProfilePage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { NotificationsPage } from './pages/NotificationsPage';

import { ShieldAlert } from 'lucide-react';
import { Button } from './components/ui';
import { ErrorBoundary } from './components/ErrorBoundary';

const ProtectedShell: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authentication loading state (prevents premature redirect on startup/refresh)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Loading Techno Club Management Platform...</span>
      </div>
    );
  }

  // Not authenticated -> redirect to login preserving intent via state
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const handleNavigate = (page: string, params?: any) => {
    let cleanPage = page.startsWith('/') ? page.slice(1) : page;
    let target = `/${cleanPage}`;
    if (cleanPage === 'verify-public' || cleanPage === 'verify-certificate') {
      target = '/verify-public';
    } else if (params?.id) {
      target = `/${cleanPage}/${params.id}`;
    } else if (params?.tab) {
      target = `/${cleanPage}?tab=${params.tab}`;
    }
    navigate(target);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derive current page ID from pathname for active sidebar highlighting
  const segments = location.pathname.replace(/^\//, '').split('/');
  let currentPage = segments[0] || 'dashboard';
  if (['president', 'vp', 'member', 'treasurer', 'faculty', 'domain'].includes(currentPage)) {
    if (segments[1] === 'dashboard') currentPage = 'dashboard';
  }

  const userRole = user.role.name || 'Member';

  const renderAccessDenied = (moduleName: string) => (
    <div className="p-8 max-w-md mx-auto text-center space-y-4 my-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center mx-auto">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        Your role (<strong>{userRole}</strong>) does not have authorization to view the <strong>{moduleName}</strong> module.
      </p>
      <Button variant="primary" size="sm" onClick={() => handleNavigate('dashboard')}>
        Return to Workspace
      </Button>
    </div>
  );

  return (
    <div className="h-screen w-screen min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex antialiased selection:bg-amber-600 selection:text-white">
      {/* Sidebar extending top-to-bottom of viewport */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Column: Top Navigation + Full-Width Content Area */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Navbar
          onNavigate={handleNavigate}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-8 min-w-0">
          <ErrorBoundary>
            <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/president/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/vp/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/member/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/treasurer/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/faculty/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />
            <Route path="/domain/dashboard" element={<DashboardPage onNavigate={handleNavigate} />} />

            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MembersPage />} />

            <Route path="/domains" element={<DomainsPage />} />
            <Route path="/domains/:id" element={<DomainsPage />} />

            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventsPage />} />

            <Route
              path="/hackathons"
              element={
                ['President', 'Vice President'].includes(userRole)
                  ? renderAccessDenied('Hackathons')
                  : <HackathonsPage />
              }
            />
            <Route
              path="/hackathons/:id"
              element={
                ['President', 'Vice President'].includes(userRole)
                  ? renderAccessDenied('Hackathons')
                  : <HackathonsPage />
              }
            />

            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectsPage />} />
            <Route path="/projects/:id/:subTab" element={<ProjectsPage />} />
            <Route path="/projects/:id/:subTab/:taskId" element={<ProjectsPage />} />

            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/:id" element={<TasksPage />} />

            <Route path="/activities" element={<ActivitiesPage />} />

            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/approvals/:id" element={<ApprovalsPage />} />

            <Route path="/attendance" element={<Navigate to="/dashboard" replace />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/certificates" element={<CertificatesPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />

            <Route
              path="/finance"
              element={
                !user.is_superuser && ['Member', 'Domain Head', 'Technical Lead', 'Vice President'].includes(userRole)
                  ? renderAccessDenied('Finance & Budget Ledger')
                  : <FinancePage />
              }
            />

            <Route
              path="/sponsors"
              element={
                !user.is_superuser && ['Member', 'Domain Head', 'Technical Lead'].includes(userRole)
                  ? renderAccessDenied('Sponsorships & Partners')
                  : <SponsorsPage />
              }
            />

            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/reports" element={<ReportsPage />} />

            <Route
              path="/audit"
              element={
                !user.is_superuser && ['Member', 'Domain Head', 'Technical Lead', 'Vice President'].includes(userRole)
                  ? renderAccessDenied('Audit Trail & Compliance Logs')
                  : <AuditLogsPage />
              }
            />

            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/notifications" element={<NotificationsPage onNavigate={handleNavigate} />} />
            <Route path="/profile" element={<ProfilePage onNavigate={handleNavigate} />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-public" element={<VerifyCertificatePage onBackToApp={() => navigate('/dashboard')} />} />
      <Route path="/verify-certificate" element={<VerifyCertificatePage onBackToApp={() => navigate('/dashboard')} />} />
      <Route path="/*" element={<ProtectedShell />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppRoutes />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
