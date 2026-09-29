import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User as UserIcon, ShieldCheck, KeyRound, Lock, Eye, EyeOff,
  Check, X, AlertTriangle, CheckCircle2, History, RefreshCw,
  Sparkles, Award, FolderGit2, CheckSquare, Calendar, Mail,
  Phone, GraduationCap, Building2, ExternalLink, Edit3,
  Save, AlertCircle, Shield, ArrowRight, Clock, Smartphone, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { SecurityLogItem } from '../types';
import { 
  PageHeader, Card, Badge, Avatar, Button, Input, 
  Tabs, Modal, Toast, LoadingState 
} from '../components/ui';

interface ProfilePageProps {
  initialTab?: 'profile' | 'security' | 'activity';
  onNavigate?: (page: string, params?: any) => void;
}

const POPULAR_SKILLS = [
  'React', 'TypeScript', 'Python', 'FastAPI', 'Node.js',
  'TailwindCSS', 'Docker', 'Machine Learning', 'Cybersecurity',
  'SQL', 'Git', 'Next.js', 'PyTorch', 'Cloud Computing'
];

const AVATAR_SEEDS = [
  'TechnoMaster', 'CyberKnight', 'ByteCode', 'NeuralCoder',
  'QuantumDev', 'DataPilot', 'CloudArchitect', 'LogicPro'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({ initialTab = 'profile', onNavigate }) => {
  const { user, refreshUser, updateUserProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as 'profile' | 'security' | 'activity' | null;
  const activeTab: 'profile' | 'security' | 'activity' = 
    (tabParam && ['profile', 'security', 'activity'].includes(tabParam)) ? tabParam : initialTab;

  const handleTabChange = (tabId: string) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'profile') {
      next.delete('tab');
    } else {
      next.set('tab', tabId);
    }
    setSearchParams(next);
  };

  // Profile Form / Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || 'Computer Science & Engineering');
  const [yearSemester, setYearSemester] = useState(user?.year_semester || '3rd Year, Sem 6');
  const [bio, setBio] = useState(user?.bio || '');
  const [skills, setSkills] = useState<string[]>(user?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Profile Update Status
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security Logs State
  const [securityLogs, setSecurityLogs] = useState<SecurityLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [twoFactorSimulated, setTwoFactorSimulated] = useState(false);

  // Keep form in sync when auth user updates
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setDepartment(user.department || 'Computer Science & Engineering');
      setYearSemester(user.year_semester || '3rd Year, Sem 6');
      setBio(user.bio || '');
      setSkills(user.skills || []);
      setGithubUrl(user.github_url || '');
      setLinkedinUrl(user.linkedin_url || '');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  // Load Security Logs
  const fetchSecurityLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await api.auth.getSecurityLogs();
      setSecurityLogs(logs);
    } catch (err) {
      console.error('Failed to load security logs:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security' || activeTab === 'activity') {
      fetchSecurityLogs();
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      await updateUserProfile({
        full_name: fullName,
        phone,
        department,
        year_semester: yearSemester,
        bio,
        skills,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        avatar_url: avatarUrl
      });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      setIsEditing(false);
      await refreshUser();
    } catch (err: any) {
      setProfileMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update profile information.'
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAddSkill = (skillToAdd: string) => {
    const trimmed = skillToAdd.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await api.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setPasswordMessage({ type: 'success', text: res.message || 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSecurityLogs();
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to change password. Please verify current password.'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const roleName = user?.role.name || 'Member';
  const roleColor = 
    roleName === 'President' ? 'blue' :
    roleName === 'Vice President' ? 'blue' :
    roleName === 'Domain Head' ? 'purple' :
    roleName === 'Treasurer' ? 'amber' : 'emerald';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile & Settings"
        description="Manage your club identification, credentials, personal information, and account security."
      >
        <Tabs
          tabs={[
            { id: 'profile', label: 'Club Profile', icon: UserIcon },
            { id: 'security', label: 'Security & Password', icon: ShieldCheck },
            { id: 'activity', label: 'Activity & Audit', icon: History },
          ]}
          activeTab={activeTab}
          onChange={(id) => handleTabChange(id)}
        />
      </PageHeader>

      {/* Messages */}
      {profileMessage && (
        <Toast
          type={profileMessage.type}
          message={profileMessage.text}
          onClose={() => setProfileMessage(null)}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PROFILE OVERVIEW & EDIT (Section 8)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Section 8 Profile Header Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar
                  src={avatarUrl || user?.avatar_url}
                  name={user?.full_name || 'Member'}
                  size="xl"
                  status="online"
                />
                <button
                  type="button"
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                  title="Change avatar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {user?.full_name || 'Techno Club Technologist'}
                  </h2>
                  <Badge variant={roleColor as any}>
                    {roleName}
                  </Badge>
                  {user?.domain_name && (
                    <Badge variant="blue">
                      {user.domain_name}
                    </Badge>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {user?.email} • {department}
                </p>

                {bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-xl line-clamp-2">
                    {bio}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              <Button
                variant={isEditing ? 'outline' : 'primary'}
                size="sm"
                icon={Edit3}
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <Card title="Edit Profile Information" subtitle="Update your personal details and public techno club portfolio">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <Input
                    label="Contact Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                  <Input
                    label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                  <Input
                    label="Year & Semester"
                    value={yearSemester}
                    onChange={(e) => setYearSemester(e.target.value)}
                    placeholder="3rd Year, Sem 6"
                  />
                  <Input
                    label="GitHub Profile URL"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Bio & Technical Focus
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell members about your technical interests, domain focus, and engineering background..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" type="submit" loading={isUpdatingProfile} icon={Save}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Section 8: Personal, Contact, Club Info & Role-specific details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <Card title="Personal Information" icon={UserIcon}>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Full Name</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || 'Not set'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">College ID</dt>
                  <dd className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user?.college_id || 'TC-2026-081'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Academic Dept</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{department}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Year & Semester</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{yearSemester}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Member Since</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'August 2025'}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Contact Information */}
            <Card title="Contact Information" icon={Mail}>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Email Address</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Phone</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{phone || '+91 98450 12345'}</dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-slate-400 font-medium">GitHub</dt>
                  <dd>
                    {githubUrl ? (
                      <a href={githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1">
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not connected</span>
                    )}
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <dt className="text-slate-400 font-medium">LinkedIn</dt>
                  <dd>
                    {linkedinUrl ? (
                      <a href={linkedinUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1">
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">Not connected</span>
                    )}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Club Information & Role Telemetry */}
            <Card title="Club Information" icon={Building2}>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Club Role</dt>
                  <dd><Badge variant={roleColor as any}>{roleName}</Badge></dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Assigned Domain</dt>
                  <dd className="font-semibold text-blue-600 dark:text-blue-400">{user?.domain_name || 'Executive Council'}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Role Privileges</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {user?.role.permissions.length || 24} Granular Permissions
                  </dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400 font-medium">Role Authority</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">
                    {roleName === 'President' ? 'Executive Council Head' :
                     roleName === 'Vice President' ? 'Operational Lead' :
                     roleName === 'Domain Head' ? 'Technical Domain Lead' : 'Active Technologist'}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Skills & Technologies */}
            <Card
              title="Skills & Technologies"
              icon={Sparkles}
              action={
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    placeholder="Add skill..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill(newSkillInput);
                      }
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white focus:outline-none"
                  />
                  <Button variant="secondary" size="xs" onClick={() => handleAddSkill(newSkillInput)}>
                    +
                  </Button>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {skills.length === 0 ? (
                    <span className="text-xs text-slate-400">No skills added yet. Click suggestions below.</span>
                  ) : (
                    skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-500 ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Suggested Skills:</span>
                  <div className="flex flex-wrap gap-1">
                    {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 6).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleAddSkill(s)}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Section 8: Achievements */}
          <Card title="Achievements & Recognitions" icon={Award}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">TechnoHack 2026 Winner</div>
                  <div className="text-[10px] text-slate-400">1st Place • AI Track</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Verified Club Member</div>
                  <div className="text-[10px] text-slate-400">Issued by President</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Star Contributor</div>
                  <div className="text-[10px] text-slate-400">Academic Year 2025-2026</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SECURITY & PASSWORD SETTINGS                                       */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Change Account Password" subtitle="Ensure your account uses a strong password">
            {passwordMessage && (
              <div className={`mb-4 p-3 rounded-xl text-xs border ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
              }`}>
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="pt-2">
                <Button variant="primary" size="sm" type="submit" loading={isUpdatingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Security Preferences" subtitle="Authentication controls and audit logs">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</div>
                  <div className="text-[11px] text-slate-500">Require mobile OTP for critical actions</div>
                </div>
                <button
                  type="button"
                  onClick={() => setTwoFactorSimulated(!twoFactorSimulated)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    twoFactorSimulated ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      twoFactorSimulated ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Active Session Token</div>
                  <div className="text-[11px] text-slate-500">JWT OAuth2 session with TLS encryption</div>
                </div>
                <Badge variant="emerald" size="xs">Active</Badge>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">Recent Security Logs</div>
                <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                  <div>• Password authenticated from campus subnet (10.0.4.12)</div>
                  <div>• Role token refreshed successfully</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ACTIVITY & AUDIT                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'activity' && (
        <Card title="Personal Activity Trail" subtitle="Your recent operations and session logs">
          <div className="space-y-3">
            {securityLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent security incidents logged for this account.
              </div>
            ) : (
              securityLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{log.action}</div>
                    <div className="text-[11px] text-slate-500">{log.description}</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <Modal
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          title="Select Profile Avatar"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Select one of the club tech avatars or enter a custom image URL:
            </p>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_SEEDS.map((seed) => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(url);
                      setShowAvatarPicker(false);
                    }}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-900 flex flex-col items-center space-y-1.5 transition-all"
                  >
                    <img src={url} alt={seed} className="w-12 h-12 rounded-full" />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-full text-center">
                      {seed}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <Input
                label="Or Custom Image URL"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setShowAvatarPicker(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
