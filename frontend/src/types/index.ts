export type UserRole = 
  | 'President' 
  | 'Vice President' 
  | 'Domain Head' 
  | 'Member' 
  | 'Faculty Coordinator' 
  | 'Treasurer' 
  | 'Technical Lead';

export interface Permission {
  id: number;
  name: string;
  code: string;
  module: string;
  description?: string;
}

export interface Role {
  id: number;
  name: UserRole;
  description?: string;
  is_system_role: boolean;
  permissions: Permission[];
}

export interface User {
  id: number;
  email: string;
  role: Role;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  member_id?: number;
  full_name?: string;
  avatar_url?: string;
  college_id?: string;
  domain_id?: number;
  domain_name?: string;
  role_title?: string;
}

export interface Member {
  id: number;
  user_id: number;
  college_id: string;
  full_name: string;
  name?: string;
  email: string;
  phone?: string;
  department: string;
  year_semester: string;
  domain_id?: number;
  domain_name?: string;
  role_title: string;
  status: 'Active' | 'Inactive' | 'Alumni' | 'Suspended';
  skills: string[];
  avatar_url?: string;
  bio?: string;
  github_url?: string;
  linkedin_url?: string;
  joining_date: string;
  created_at: string;
  updated_at: string;
  active_projects_count: number;
  completed_tasks_count: number;
  events_participated_count: number;
  achievements_count: number;
}

export interface Domain {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  head_id?: number;
  co_head_id?: number;
  head_name?: string;
  co_head_name?: string;
  members_count: number;
  member_count?: number;
  active_projects_count: number;
  completed_projects_count?: number;
  tasks_count: number;
  completed_tasks_count?: number;
  events_count: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  name: string;
  event_type: string;
  description: string;
  domain_id?: number;
  domain_name?: string;
  organizer_id?: number;
  organizer_name?: string;
  start_time: string;
  end_time: string;
  venue: string;
  capacity: number;
  registration_deadline?: string;
  budget: number;
  status: string;
  speakers: Array<{ name: string; org?: string; topic?: string }>;
  judges: Array<{ name: string; org?: string }>;
  coordinators: Array<{ name: string; role?: string }>;
  volunteers: Array<{ name: string }>;
  sponsors: Array<{ name: string }>;
  banner_url?: string;
  report_summary?: string;
  registered_count: number;
  attended_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  event_name?: string;
  member_id?: number;
  attendee_name: string;
  attendee_email: string;
  college_id?: string;
  status: string;
  qr_code_token: string;
  registered_at: string;
  attended: boolean;
}

export interface HackathonProblemStatement {
  id: string;
  title: string;
  domain: string;
  description: string;
}

export interface HackathonEvaluationCriteria {
  criteria: string;
  weight: number;
  max_score: number;
}

export interface HackathonPrize {
  rank: number;
  title: string;
  cash: number;
  perks?: string;
}

export interface Hackathon {
  id: number;
  title: string;
  theme: string;
  description: string;
  problem_statements: HackathonProblemStatement[];
  rules: string;
  eligibility?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  min_team_size: number;
  max_team_size: number;
  status: string;
  evaluation_criteria: HackathonEvaluationCriteria[];
  mentors: Array<{ name: string; expertise?: string }>;
  judges: Array<{ name: string; org?: string }>;
  prizes: HackathonPrize[];
  banner_url?: string;
  teams_count: number;
  submissions_count: number;
  created_at: string;
  updated_at: string;
}

export interface HackathonTeam {
  id: number;
  hackathon_id: number;
  name: string;
  team_code: string;
  leader_id: number;
  leader_name?: string;
  members_info: Array<{ name: string; role?: string; email?: string }>;
  project_name?: string;
  status: string;
  created_at: string;
  has_submission: boolean;
}

export interface HackathonSubmission {
  id: number;
  hackathon_id: number;
  team_id: number;
  team_name?: string;
  project_title: string;
  description: string;
  problem_statement_id?: string;
  repo_url?: string;
  demo_url?: string;
  video_url?: string;
  presentation_url?: string;
  scores: Array<{ judge?: string; criteria: string; score: number; max: number }>;
  total_score: number;
  rank?: number;
  winner_category?: string;
  judge_feedback?: string;
  submitted_at: string;
}

export interface Milestone {
  id: number;
  title: string;
  completed: boolean;
  due?: string;
}

export interface ProjectMember {
  id: number;
  member_id: number;
  member_name: string;
  member_email: string;
  role_in_project: string;
  avatar_url?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  objective?: string;
  domain_id?: number;
  domain_name?: string;
  secondary_domains: string[];
  project_lead_id: number;
  lead_name?: string;
  start_date: string;
  target_date: string;
  completed_date?: string;
  status: string;
  priority: string;
  milestones: Milestone[];
  repository_url?: string;
  demo_url?: string;
  documentation_url?: string;
  final_report?: string;
  members: ProjectMember[];
  total_tasks_count: number;
  completed_tasks_count: number;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  author_id: number;
  author_name: string;
  author_avatar?: string;
  comment: string;
  created_at: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  project_id?: number;
  domain_id?: number;
  project_name?: string;
  domain_name?: string;
  assignee_id?: number;
  assignee_name?: string;
  creator_name?: string;
  due_date?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Todo' | 'In Progress' | 'Review' | 'Completed' | 'Blocked';
  subtasks: Subtask[];
  attachments: Array<any>;
  dependencies: number[];
  estimated_hours: number;
  actual_hours: number;
  comments_count: number;
  comments: TaskComment[];
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  title: string;
  activity_type: string;
  description: string;
  domain_id?: number;
  domain_name?: string;
  coordinator_id?: number;
  coordinator_name?: string;
  start_date: string;
  end_date: string;
  venue?: string;
  status: string;
  budget: number;
  participants_count: number;
  outcomes?: string;
  documentation?: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalProposal {
  id: number;
  title: string;
  proposal_type: string;
  entity_type?: string;
  entity_id?: number;
  proposer_id: number;
  proposer_name?: string;
  current_stage: string;
  status: string;
  priority: string;
  description: string;
  requested_budget: number;
  remarks?: string;
  history: Array<{
    stage: string;
    reviewer_name: string;
    reviewer_role: string;
    action: string;
    timestamp: string;
    comments?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  meeting_type: string;
  domain_id?: number;
  domain_name?: string;
  organizer_id?: number;
  organizer_name?: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string;
  meeting_link?: string;
  agenda: string;
  minutes_of_meeting?: string;
  decisions?: string;
  action_items: Array<{ item: string; assignee?: string; due?: string }>;
  attendee_ids: number[];
  status: string;
  created_at: string;
}

export interface Resource {
  id: number;
  name: string;
  category: 'Physical' | 'Digital';
  resource_type: string;
  identifier: string;
  quantity: number;
  available_quantity: number;
  status: 'Available' | 'Assigned' | 'Under Maintenance' | 'Lost/Damaged';
  location: string;
  assigned_to_id?: number;
  assigned_to_name?: string;
  specifications: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface Budget {
  id: number;
  title: string;
  fiscal_year: string;
  domain_id?: number;
  event_id?: number;
  total_allocated: number;
  total_spent: number;
  remaining_budget: number;
  status: string;
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  budget_id?: number;
  event_id?: number;
  event_name?: string;
  domain_id?: number;
  title: string;
  category: string;
  amount: number;
  receipt_url?: string;
  incurred_by_id?: number;
  incurred_by_name?: string;
  status: string;
  approved_by_id?: number;
  notes?: string;
  date_incurred: string;
}

export interface Sponsor {
  id: number;
  company_name: string;
  contact_person: string;
  email: string;
  phone?: string;
  website?: string;
  tier: string;
  stage: 'Prospect' | 'Contacted' | 'Proposal Sent' | 'Negotiation' | 'Confirmed' | 'Completed';
  amount: number;
  event_id?: number;
  event_name?: string;
  benefits?: string;
  mou_signed: boolean;
  payment_status: string;
  notes?: string;
  created_at: string;
}

export interface Certificate {
  id: number;
  certificate_id: string;
  verification_code: string;
  title: string;
  certificate_type: string;
  recipient_name: string;
  recipient_email: string;
  event_id?: number;
  event_name?: string;
  hackathon_id?: number;
  issue_date: string;
  file_url?: string;
  status: string;
  metadata_info: Record<string, any>;
}

export interface Achievement {
  id: number;
  member_id: number;
  member_name?: string;
  title: string;
  category: string;
  description: string;
  event_id?: number;
  badge_icon: string;
  achievement_date: string;
  proof_url?: string;
  is_featured: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id?: number;
  author_name?: string;
  domain_id?: number;
  domain_name?: string;
  target_role: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  pinned: boolean;
  expires_at?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  priority: string;
  created_at: string;
}

export interface Document {
  id: number;
  title: string;
  category: string;
  domain_id?: number;
  domain_name?: string;
  event_id?: number;
  event_name?: string;
  project_id?: number;
  project_name?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  uploaded_by_name?: string;
  is_public: boolean;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_email: string;
  role: string;
  action: string;
  entity: string;
  entity_id?: number;
  description: string;
  diff_json: Record<string, any>;
  ip_address?: string;
  timestamp: string;
}

export interface CalendarItem {
  id: string;
  raw_id: number;
  title: string;
  category: string;
  type_badge: string;
  start: string;
  end: string;
  venue: string;
  color: string;
  status: string;
  domain_name?: string;
}

export interface DashboardStats {
  total_members: number;
  active_members: number;
  total_domains: number;
  active_projects: number;
  completed_projects: number;
  upcoming_events: number;
  ongoing_events: number;
  completed_events: number;
  active_hackathons: number;
  pending_approvals: number;
  pending_tasks: number;
  completed_tasks: number;
  total_allocated_budget: number;
  total_spent_budget: number;
  confirmed_sponsorship: number;
  domain_distribution: Array<{ id: number; name: string; code: string; color: string; members: number; projects: number }>;
  events_by_type: Array<{ type: string; count: number }>;
  task_status_distribution: Array<{ status: string; count: number }>;
  recent_activities: Array<{ id: number; title: string; type: string; status: string; date: string }>;
  upcoming_deadlines: Array<{ id: number; title: string; due_date: string; priority: string; assignee: string }>;
  recent_announcements: Array<{ id: number; title: string; priority: string; created_at: string }>;
}

export interface MemberDashboardStats {
  assigned_tasks_count: number;
  completed_tasks_count: number;
  pending_tasks_count: number;
  my_projects_count: number;
  events_registered_count: number;
  events_attended_count: number;
  achievements_count: number;
  certificates_count: number;
  unread_notifications_count: number;
  my_tasks: Array<{ id: number; title: string; status: string; priority: string; due_date?: string; project_name?: string }>;
  my_projects: Array<{ id: number; name: string; status: string; priority: string; role: string; target_date: string }>;
  upcoming_events: Array<{ id: number; name: string; event_type: string; start_time: string; venue: string }>;
  recent_achievements: Array<{ id: number; title: string; category: string; badge_icon: string }>;
}

export interface SearchResultItem {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  badge?: string;
  url: string;
}
