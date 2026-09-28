import React, { useState } from 'react';
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
import { AttendancePage } from './pages/AttendancePage';
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

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>(null);
  const [isPublicVerifyMode, setIsPublicVerifyMode] = useState(false);

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'verify-public') {
      setIsPublicVerifyMode(true);
      return;
    }
    setIsPublicVerifyMode(false);
    setCurrentPage(page);
    setPageParams(params || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Booting Techno Club Management OS...</span>
      </div>
    );
  }

  // Standalone public certificate verification mode
  if (isPublicVerifyMode) {
    return <VerifyCertificatePage onBackToApp={() => setIsPublicVerifyMode(false)} />;
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Render main operating system view
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'members':
        return <MembersPage />;
      case 'domains':
        return <DomainsPage />;
      case 'events':
        return <EventsPage />;
      case 'hackathons':
        return <HackathonsPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'tasks':
        return <TasksPage />;
      case 'activities':
        return <ActivitiesPage />;
      case 'approvals':
        return <ApprovalsPage />;
      case 'attendance':
        return <AttendancePage />;
      case 'meetings':
        return <MeetingsPage />;
      case 'certificates':
        return <CertificatesPage />;
      case 'achievements':
        return <AchievementsPage />;
      case 'resources':
        return <ResourcesPage />;
      case 'finance':
        return <FinancePage />;
      case 'sponsors':
        return <SponsorsPage />;
      case 'documents':
        return <DocumentsPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'reports':
        return <ReportsPage />;
      case 'audit':
        return <AuditLogsPage />;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar onNavigate={handleNavigate} />

      {/* App Body: Left Sidebar + Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
