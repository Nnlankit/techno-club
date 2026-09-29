import axios from 'axios';
import type {
  User, Member, Domain, Event, EventRegistration,
  Hackathon, HackathonTeam, HackathonSubmission,
  Project, Task, TaskComment, Activity, ApprovalProposal,
  Meeting, Resource, Budget, Expense, Sponsor,
  Certificate, Achievement, Announcement, Notification,
  Document, AuditLog, CalendarItem, DashboardStats,
  MemberDashboardStats, DomainDashboardStats, SearchResultItem,
  PasswordChangePayload, ProfileUpdatePayload, SecurityLogItem,
  ReportsToOption, CreateMemberPayload
} from '../types';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('techno_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only dispatch unauthorized event when server explicitly returns 401 on authenticated requests
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/json-login')
    ) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const res = await apiClient.post('/auth/json-login', { email, password });
      return res.data;
    },
    getMe: async (): Promise<User> => {
      const res = await apiClient.get('/auth/me');
      return res.data;
    },
    updateProfile: async (data: ProfileUpdatePayload): Promise<User> => {
      const res = await apiClient.put('/auth/profile', data);
      return res.data;
    },
    changePassword: async (data: PasswordChangePayload): Promise<{ success: boolean; message: string }> => {
      const res = await apiClient.post('/auth/change-password', data);
      return res.data;
    },
    getSecurityLogs: async (): Promise<SecurityLogItem[]> => {
      const res = await apiClient.get('/auth/security-logs');
      return res.data;
    },
    switchDemoRole: async (roleName: string) => {
      const res = await apiClient.post(`/auth/demo-switch/${encodeURIComponent(roleName)}`);
      return res.data;
    }
  },

  // Users
  users: {
    list: async (): Promise<User[]> => {
      const res = await apiClient.get('/users/');
      return res.data;
    },
    updateRole: async (userId: number, roleId: number): Promise<User> => {
      const res = await apiClient.put(`/users/${userId}/role?role_id=${roleId}`);
      return res.data;
    },
    getAllowedRoles: async (): Promise<string[]> => {
      const res = await apiClient.get('/users/allowed-roles');
      return res.data;
    },
    getReportsToOptions: async (role: string, domainId?: number): Promise<ReportsToOption[]> => {
      const res = await apiClient.get('/users/reports-to-options', {
        params: { role, domain_id: domainId }
      });
      return res.data;
    },
    create: async (data: CreateMemberPayload): Promise<Member> => {
      const res = await apiClient.post('/users/', data);
      return res.data;
    }
  },

  // Members
  members: {
    list: async (params?: { domain_id?: number; status?: string; department?: string; search?: string }): Promise<Member[]> => {
      const res = await apiClient.get('/members/', { params });
      return res.data;
    },
    get: async (id: number): Promise<Member> => {
      const res = await apiClient.get(`/members/${id}`);
      return res.data;
    },
    create: async (data: Partial<Member> & { password?: string }): Promise<Member> => {
      const res = await apiClient.post('/members/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Member>): Promise<Member> => {
      const res = await apiClient.put(`/members/${id}`, data);
      return res.data;
    },
    delete: async (id: number) => {
      const res = await apiClient.delete(`/members/${id}`);
      return res.data;
    }
  },

  // Domains
  domains: {
    list: async (): Promise<Domain[]> => {
      const res = await apiClient.get('/domains/');
      return res.data;
    },
    get: async (id: number): Promise<Domain> => {
      const res = await apiClient.get(`/domains/${id}`);
      return res.data;
    },
    getMembers: async (id: number): Promise<Member[]> => {
      const res = await apiClient.get(`/domains/${id}/members`);
      return res.data;
    },
    create: async (data: Partial<Domain>): Promise<Domain> => {
      const res = await apiClient.post('/domains/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Domain>): Promise<Domain> => {
      const res = await apiClient.put(`/domains/${id}`, data);
      return res.data;
    },
    delete: async (id: number, archive = true, force = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/domains/${id}`, { params: { archive, force } });
      return res.data;
    }
  },

  // Events
  events: {
    list: async (params?: { domain_id?: number; event_type?: string; status?: string; search?: string; upcoming_only?: boolean }): Promise<Event[]> => {
      const res = await apiClient.get('/events/', { params });
      return res.data;
    },
    get: async (id: number): Promise<Event> => {
      const res = await apiClient.get(`/events/${id}`);
      return res.data;
    },
    create: async (data: Partial<Event>): Promise<Event> => {
      const res = await apiClient.post('/events/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Event>): Promise<Event> => {
      const res = await apiClient.put(`/events/${id}`, data);
      return res.data;
    },
    duplicate: async (id: number): Promise<Event> => {
      const res = await apiClient.post(`/events/${id}/duplicate`);
      return res.data;
    },
    delete: async (id: number, archive = false, force = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/events/${id}`, { params: { archive, force } });
      return res.data;
    },
    register: async (eventId: number, data: { member_id?: number; guest_name?: string; guest_email?: string; guest_college_id?: string; guest_phone?: string }): Promise<EventRegistration> => {
      const res = await apiClient.post(`/events/${eventId}/register`, data);
      return res.data;
    },
    getRegistrations: async (eventId: number): Promise<EventRegistration[]> => {
      const res = await apiClient.get(`/events/${eventId}/registrations`);
      return res.data;
    },
    scanAttendance: async (eventId: number, qrToken: string, notes?: string) => {
      const res = await apiClient.post(`/events/${eventId}/attendance/scan`, {
        event_id: eventId,
        qr_code_token: qrToken,
        notes
      });
      return res.data;
    },
    manualAttendance: async (eventId: number, memberId?: number, registrationId?: number, notes?: string) => {
      const res = await apiClient.post(`/events/${eventId}/attendance/manual`, {
        event_id: eventId,
        member_id: memberId,
        registration_id: registrationId,
        notes
      });
      return res.data;
    }
  },

  // Hackathons
  hackathons: {
    list: async (): Promise<Hackathon[]> => {
      const res = await apiClient.get('/hackathons/');
      return res.data;
    },
    get: async (id: number): Promise<Hackathon> => {
      const res = await apiClient.get(`/hackathons/${id}`);
      return res.data;
    },
    create: async (data: Partial<Hackathon>): Promise<Hackathon> => {
      const res = await apiClient.post('/hackathons/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Hackathon>): Promise<Hackathon> => {
      const res = await apiClient.put(`/hackathons/${id}`, data);
      return res.data;
    },
    delete: async (id: number, archive = false, force = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/hackathons/${id}`, { params: { archive, force } });
      return res.data;
    },
    registerTeam: async (hackathonId: number, data: { name: string; leader_id: number; members_info?: any[]; project_name?: string }): Promise<HackathonTeam> => {
      const res = await apiClient.post(`/hackathons/${hackathonId}/teams`, { ...data, hackathon_id: hackathonId });
      return res.data;
    },
    getTeams: async (hackathonId: number): Promise<HackathonTeam[]> => {
      const res = await apiClient.get(`/hackathons/${hackathonId}/teams`);
      return res.data;
    },
    submitProject: async (hackathonId: number, data: { team_id: number; project_title: string; description: string; problem_statement_id?: string; repo_url?: string; demo_url?: string; video_url?: string; presentation_url?: string }): Promise<HackathonSubmission> => {
      const res = await apiClient.post(`/hackathons/${hackathonId}/submissions`, { ...data, hackathon_id: hackathonId });
      return res.data;
    },
    scoreSubmission: async (hackathonId: number, submissionId: number, data: { scores: any[]; total_score: number; rank?: number; winner_category?: string; judge_feedback?: string }): Promise<HackathonSubmission> => {
      const res = await apiClient.post(`/hackathons/${hackathonId}/submissions/${submissionId}/score`, data);
      return res.data;
    },
    getLeaderboard: async (hackathonId: number): Promise<HackathonSubmission[]> => {
      const res = await apiClient.get(`/hackathons/${hackathonId}/leaderboard`);
      return res.data;
    }
  },

  // Projects
  projects: {
    list: async (params?: { domain_id?: number; status?: string; lead_id?: number; search?: string }): Promise<Project[]> => {
      const res = await apiClient.get('/projects/', { params });
      return res.data;
    },
    get: async (id: number): Promise<Project> => {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data;
    },
    create: async (data: Partial<Project> & { team_member_ids?: number[] }): Promise<Project> => {
      const res = await apiClient.post('/projects/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Project>): Promise<Project> => {
      const res = await apiClient.put(`/projects/${id}`, data);
      return res.data;
    },
    addMember: async (projectId: number, memberId: number, roleInProject?: string): Promise<Project> => {
      const res = await apiClient.post(`/projects/${projectId}/members`, {
        member_id: memberId,
        role_in_project: roleInProject || 'Contributor'
      });
      return res.data;
    },
    removeMember: async (projectId: number, memberId: number): Promise<Project> => {
      const res = await apiClient.delete(`/projects/${projectId}/members/${memberId}`);
      return res.data;
    },
    delete: async (projectId: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/projects/${projectId}`);
      return res.data;
    }
  },

  // Tasks
  tasks: {
    list: async (params?: { project_id?: number; domain_id?: number; assignee_id?: number; status?: string; priority?: string; search?: string }): Promise<Task[]> => {
      const res = await apiClient.get('/tasks/', { params });
      return res.data;
    },
    get: async (id: number): Promise<Task> => {
      const res = await apiClient.get(`/tasks/${id}`);
      return res.data;
    },
    create: async (data: Partial<Task>): Promise<Task> => {
      const res = await apiClient.post('/tasks/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Task>): Promise<Task> => {
      const res = await apiClient.put(`/tasks/${id}`, data);
      return res.data;
    },
    delete: async (id: number, archive = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/tasks/${id}`, { params: { archive } });
      return res.data;
    },
    addComment: async (taskId: number, comment: string): Promise<TaskComment> => {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, { comment });
      return res.data;
    }
  },

  // Activities
  activities: {
    list: async (params?: { activity_type?: string; domain_id?: number; status?: string }): Promise<Activity[]> => {
      const res = await apiClient.get('/activities/', { params });
      return res.data;
    },
    create: async (data: Partial<Activity>): Promise<Activity> => {
      const res = await apiClient.post('/activities/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Activity>): Promise<Activity> => {
      const res = await apiClient.put(`/activities/${id}`, data);
      return res.data;
    },
    delete: async (id: number, archive = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/activities/${id}`, { params: { archive } });
      return res.data;
    }
  },

  // Approvals
  approvals: {
    list: async (params?: { status?: string; stage?: string; proposal_type?: string }): Promise<ApprovalProposal[]> => {
      const res = await apiClient.get('/approvals/', { params });
      return res.data;
    },
    get: async (id: number): Promise<ApprovalProposal> => {
      const res = await apiClient.get(`/approvals/${id}`);
      return res.data;
    },
    submit: async (data: Partial<ApprovalProposal>): Promise<ApprovalProposal> => {
      const res = await apiClient.post('/approvals/', data);
      return res.data;
    },
    executeAction: async (id: number, action: 'Approve' | 'Reject' | 'Request Revision', comments?: string): Promise<ApprovalProposal> => {
      const res = await apiClient.post(`/approvals/${id}/action`, { action, comments });
      return res.data;
    }
  },

  // Meetings
  meetings: {
    list: async (): Promise<Meeting[]> => {
      const res = await apiClient.get('/meetings/');
      return res.data;
    },
    get: async (id: number): Promise<Meeting> => {
      const res = await apiClient.get(`/meetings/${id}`);
      return res.data;
    },
    schedule: async (data: Partial<Meeting>): Promise<Meeting> => {
      const res = await apiClient.post('/meetings/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Meeting>): Promise<Meeting> => {
      const res = await apiClient.put(`/meetings/${id}`, data);
      return res.data;
    },
    delete: async (id: number, archive = false): Promise<{ message: string; archived?: boolean }> => {
      const res = await apiClient.delete(`/meetings/${id}`, { params: { archive } });
      return res.data;
    }
  },

  // Resources
  resources: {
    list: async (params?: { category?: string; resource_type?: string; status?: string }): Promise<Resource[]> => {
      const res = await apiClient.get('/resources/', { params });
      return res.data;
    },
    add: async (data: Partial<Resource>): Promise<Resource> => {
      const res = await apiClient.post('/resources/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Resource>): Promise<Resource> => {
      const res = await apiClient.put(`/resources/${id}`, data);
      return res.data;
    },
    assign: async (data: { resource_id: number; member_id: number; project_id?: number; return_due_date: string }): Promise<Resource> => {
      const res = await apiClient.post('/resources/assign', data);
      return res.data;
    },
    returnResource: async (id: number): Promise<Resource> => {
      const res = await apiClient.post(`/resources/${id}/return`);
      return res.data;
    },
    delete: async (id: number, force = false): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/resources/${id}`, { params: { force } });
      return res.data;
    }
  },

  // Finance
  finance: {
    getBudgets: async (): Promise<Budget[]> => {
      const res = await apiClient.get('/finance/budgets');
      return res.data;
    },
    createBudget: async (data: Partial<Budget>): Promise<Budget> => {
      const res = await apiClient.post('/finance/budgets', data);
      return res.data;
    },
    getExpenses: async (params?: { event_id?: number; status?: string }): Promise<Expense[]> => {
      const res = await apiClient.get('/finance/expenses', { params });
      return res.data;
    },
    recordExpense: async (data: Partial<Expense>): Promise<Expense> => {
      const res = await apiClient.post('/finance/expenses', data);
      return res.data;
    },
    updateExpenseStatus: async (expenseId: number, status: string, notes?: string): Promise<Expense> => {
      const res = await apiClient.put(`/finance/expenses/${expenseId}/status`, { status, notes });
      return res.data;
    }
  },

  // Sponsors
  sponsors: {
    list: async (params?: { stage?: string; tier?: string }): Promise<Sponsor[]> => {
      const res = await apiClient.get('/sponsors/', { params });
      return res.data;
    },
    create: async (data: Partial<Sponsor>): Promise<Sponsor> => {
      const res = await apiClient.post('/sponsors/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Sponsor>): Promise<Sponsor> => {
      const res = await apiClient.put(`/sponsors/${id}`, data);
      return res.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/sponsors/${id}`);
      return res.data;
    }
  },

  // Certificates
  certificates: {
    list: async (params?: { recipient_email?: string; event_id?: number; certificate_type?: string }): Promise<Certificate[]> => {
      const res = await apiClient.get('/certificates/', { params });
      return res.data;
    },
    issue: async (data: { title: string; certificate_type: string; recipient_name: string; recipient_email: string; recipient_member_id?: number; event_id?: number; hackathon_id?: number; metadata_info?: any }): Promise<Certificate> => {
      const res = await apiClient.post('/certificates/issue', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Certificate>): Promise<Certificate> => {
      const res = await apiClient.put(`/certificates/${id}`, data);
      return res.data;
    },
    revoke: async (id: number, reason?: string): Promise<Certificate> => {
      const res = await apiClient.post(`/certificates/${id}/revoke`, null, { params: { reason } });
      return res.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/certificates/${id}`);
      return res.data;
    },
    verify: async (codeOrId: string) => {
      const res = await apiClient.get(`/certificates/verify/${encodeURIComponent(codeOrId)}`);
      return res.data;
    }
  },

  // Achievements
  achievements: {
    list: async (params?: { member_id?: number; category?: string; is_featured?: boolean }): Promise<Achievement[]> => {
      const res = await apiClient.get('/achievements/', { params });
      return res.data;
    },
    create: async (data: Partial<Achievement>): Promise<Achievement> => {
      const res = await apiClient.post('/achievements/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Achievement>): Promise<Achievement> => {
      const res = await apiClient.put(`/achievements/${id}`, data);
      return res.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/achievements/${id}`);
      return res.data;
    }
  },

  // Announcements
  announcements: {
    list: async (params?: { domain_id?: number; priority?: string }): Promise<Announcement[]> => {
      const res = await apiClient.get('/announcements/', { params });
      return res.data;
    },
    create: async (data: Partial<Announcement>): Promise<Announcement> => {
      const res = await apiClient.post('/announcements/', data);
      return res.data;
    },
    update: async (id: number, data: Partial<Announcement>): Promise<Announcement> => {
      const res = await apiClient.put(`/announcements/${id}`, data);
      return res.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/announcements/${id}`);
      return res.data;
    }
  },

  // Notifications
  notifications: {
    list: async (params?: { is_read?: boolean; type?: string; search?: string }): Promise<Notification[]> => {
      const res = await apiClient.get('/notifications/', { params });
      return res.data;
    },
    markRead: async (id: number): Promise<Notification> => {
      const res = await apiClient.put(`/notifications/${id}/read`);
      return res.data;
    },
    markUnread: async (id: number): Promise<Notification> => {
      const res = await apiClient.put(`/notifications/${id}/unread`);
      return res.data;
    },
    markAllRead: async () => {
      const res = await apiClient.put('/notifications/read-all');
      return res.data;
    },
    delete: async (id: number) => {
      const res = await apiClient.delete(`/notifications/${id}`);
      return res.data;
    },
    clearAll: async (onlyRead: boolean = false) => {
      const res = await apiClient.delete('/notifications/clear-all', { params: { only_read: onlyRead } });
      return res.data;
    }
  },

  // Documents
  documents: {
    list: async (params?: { category?: string; domain_id?: number; event_id?: number; project_id?: number }): Promise<Document[]> => {
      const res = await apiClient.get('/documents/', { params });
      return res.data;
    },
    upload: async (formData: FormData): Promise<Document> => {
      const res = await apiClient.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    },
    update: async (id: number, data: Partial<Document>): Promise<Document> => {
      const res = await apiClient.put(`/documents/${id}`, data);
      return res.data;
    },
    delete: async (id: number): Promise<{ message: string }> => {
      const res = await apiClient.delete(`/documents/${id}`);
      return res.data;
    }
  },

  // Calendar
  calendar: {
    getUnified: async (params?: { domain_id?: number; month?: number; year?: number }): Promise<CalendarItem[]> => {
      const res = await apiClient.get('/calendar/', { params });
      return res.data;
    }
  },

  // Reports & Analytics
  reports: {
    getExecutive: async (): Promise<DashboardStats> => {
      const res = await apiClient.get('/reports/executive');
      return res.data;
    },
    getMemberDashboard: async (): Promise<MemberDashboardStats> => {
      const res = await apiClient.get('/reports/member-dashboard');
      return res.data;
    },
    getDomainDashboard: async (domainId?: number): Promise<DomainDashboardStats> => {
      const res = await apiClient.get('/reports/domain-dashboard', { params: domainId ? { domain_id: domainId } : {} });
      return res.data;
    },
    exportCsvUrl: (entity: string) => {
      const token = localStorage.getItem('techno_token');
      return `${API_BASE_URL}/reports/export-csv?entity=${entity}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
    }
  },

  // File & Upload URL helper
  getFileUrl: (filePath?: string): string => {
    if (!filePath) return '';
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
    const base = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
    return `${base}${cleanPath}`;
  },

  // Audit Logs
  audit: {
    list: async (params?: { entity?: string; action?: string; limit?: number }): Promise<AuditLog[]> => {
      const res = await apiClient.get('/audit/', { params });
      return res.data;
    }
  },

  // Global Search
  search: {
    query: async (searchTerm: string): Promise<{ query: string; total_results: number; results: SearchResultItem[] }> => {
      const res = await apiClient.get('/search/', { params: { q: searchTerm } });
      return res.data;
    }
  }
};
