import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  Users, Search, Plus, Download, Mail, Phone, 
  Award, FolderGit2, CheckSquare, Calendar, ExternalLink, 
  Trash2, ShieldCheck, Edit3, Eye, EyeOff, CheckCircle2, 
  AlertCircle, ChevronDown, ChevronUp, UserCheck, Sparkles, Building2
} from 'lucide-react';
import { api } from '../services/api';
import { Member, Domain, ReportsToOption, CreateMemberPayload } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Table, Column, Badge, Avatar, Button, 
  Input, Select, Pagination, Modal, Drawer, Toast, EmptyState, 
  LoadingState, ErrorState, ConfirmationDialog 
} from '../components/ui';

export const MembersPage: React.FC = () => {
  const { hasRole, user } = useAuth();
  const { id: paramMemberId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [members, setMembers] = useState<Member[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters stored in URL Query Parameters (preserved on Back/Forward navigation)
  const search = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(search);
  const selectedDomain = searchParams.get('domain') ? Number(searchParams.get('domain')) : undefined;
  const selectedStatus = searchParams.get('status') || '';
  const selectedDept = searchParams.get('dept') || '';

  // Keep searchInput in sync when query param changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Sorting
  const [sortKey, setSortKey] = useState<string>('full_name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination from URL
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
  const pageSize = 10;

  // Selected Member Modal & Delete Dialog
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  // Permissions: Only Super Admin, President, Vice President can add members
  const canAddMember = hasRole(['Super Admin', 'President', 'Vice President']);
  const canDeleteMember = hasRole(['Super Admin', 'President', 'Vice President']);

  // Add Member Drawer & Form States
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowedRoles, setAllowedRoles] = useState<string[]>([]);
  const [reportsToOptions, setReportsToOptions] = useState<ReportsToOption[]>([]);
  const [loadingReportsTo, setLoadingReportsTo] = useState(false);
  const [reportsToSearch, setReportsToSearch] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('Member');
  const [formDesignation, setFormDesignation] = useState('');
  const [formDomainId, setFormDomainId] = useState<number | undefined>(undefined);
  const [formReportsToId, setFormReportsToId] = useState<number | undefined>(undefined);
  const [formCollegeId, setFormCollegeId] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDept, setFormDept] = useState('Computer Science & Engineering');
  const [formYear, setFormYear] = useState('1st Year');
  const [formSemester, setFormSemester] = useState('1st Sem');
  const [formSkills, setFormSkills] = useState('');
  const [formJoiningDate, setFormJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formAvatarUrl, setFormAvatarUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formGithubUrl, setFormGithubUrl] = useState('');
  const [formLinkedinUrl, setFormLinkedinUrl] = useState('');

  // Validation Errors
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    role?: string;
    domainId?: string;
    reportsTo?: string;
    general?: string;
  }>({});

  // Toast notification
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  // Edit Member Drawer States
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editCollegeId, setEditCollegeId] = useState('');
  const [editDept, setEditDept] = useState('Computer Science & Engineering');
  const [editYearSemester, setEditYearSemester] = useState('1st Year / 1st Sem');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editRole, setEditRole] = useState('Member');
  const [editDesignation, setEditDesignation] = useState('');
  const [editSkills, setEditSkills] = useState('');
  const [editStatus, setEditStatus] = useState<Member['status']>('Active');
  const [editReportsToId, setEditReportsToId] = useState<number | undefined>(undefined);
  const [editReportsToSearch, setEditReportsToSearch] = useState('');
  const [editErrors, setEditErrors] = useState<{ fullName?: string; general?: string }>({});

  const updateFilters = (updates: { q?: string; domain?: number | null; status?: string | null; dept?: string | null; page?: number }) => {
    const next = new URLSearchParams(searchParams);
    if (updates.q !== undefined) {
      if (updates.q) next.set('q', updates.q); else next.delete('q');
    }
    if (updates.domain !== undefined) {
      if (updates.domain) next.set('domain', String(updates.domain)); else next.delete('domain');
    }
    if (updates.status !== undefined) {
      if (updates.status) next.set('status', updates.status); else next.delete('status');
    }
    if (updates.dept !== undefined) {
      if (updates.dept) next.set('dept', updates.dept); else next.delete('dept');
    }
    if (updates.page !== undefined) {
      if (updates.page > 1) next.set('page', String(updates.page)); else next.delete('page');
    }
    setSearchParams(next);
  };

  useEffect(() => {
    loadData();
  }, [selectedDomain, selectedStatus, selectedDept, search]);

  // Synchronize route paramMemberId with selectedMember
  useEffect(() => {
    if (!paramMemberId) {
      setSelectedMember(null);
      return;
    }
    const mid = Number(paramMemberId);
    const found = members.find((m) => m.id === mid);
    if (found) {
      setSelectedMember(found);
    } else {
      api.members.get(mid)
        .then((m) => setSelectedMember(m))
        .catch((err) => console.error('Failed to load member by id:', err));
    }
  }, [paramMemberId, members]);

  const applyFallbackRoles = () => {
    const currentUserRole = user?.role?.name;
    let fallback: string[] = [];
    if (currentUserRole === 'Super Admin' || user?.is_superuser) {
      fallback = ['Super Admin', 'President', 'Vice President', 'Domain Head', 'Member'];
    } else if (currentUserRole === 'President') {
      fallback = ['Vice President', 'Domain Head', 'Member'];
    } else if (currentUserRole === 'Vice President') {
      fallback = ['Domain Head', 'Member'];
    }
    setAllowedRoles(fallback);
    if (fallback.length > 0 && !fallback.includes(formRole)) {
      setFormRole(fallback.includes('Member') ? 'Member' : fallback[0]);
    }
  };

  // Load allowed roles when opening Drawer
  const handleOpenAddDrawer = async () => {
    resetDrawerForm();
    setShowAddDrawer(true);
    try {
      const roles = await api.users.getAllowedRoles();
      const safeRoles = Array.isArray(roles) && roles.length > 0 ? roles : [];
      if (safeRoles.length > 0) {
        setAllowedRoles(safeRoles);
        const defaultRole = safeRoles.includes('Member') ? 'Member' : safeRoles[0];
        setFormRole(defaultRole);
      } else {
        applyFallbackRoles();
      }
    } catch (err) {
      console.error('Failed to load allowed roles:', err);
      applyFallbackRoles();
    }
  };

  // Fetch Reports To options dynamically based on selected role and domain
  useEffect(() => {
    if (!showAddDrawer || !formRole) return;

    let isMounted = true;
    const fetchReportsTo = async () => {
      setLoadingReportsTo(true);
      try {
        const rawOptions = await api.users.getReportsToOptions(formRole, formDomainId);
        const options: ReportsToOption[] = (Array.isArray(rawOptions) ? rawOptions : []).map((o: any) => ({
          ...o,
          id: o.id,
          name: o.name || o.full_name || 'Supervisor',
          full_name: o.full_name || o.name || 'Supervisor',
          role: o.role || 'Leadership',
          domain_name: o.domain_name || null,
        }));
        if (isMounted) {
          setReportsToOptions(options);
          // If current selection is not in new options, pick the first one by default
          if (options.length > 0) {
            if (!options.some((o) => o.id === formReportsToId)) {
              setFormReportsToId(options[0].id);
            }
          } else {
            setFormReportsToId(undefined);
          }
        }
      } catch (err) {
        console.error('Failed to load reports-to options:', err);
        if (isMounted) {
          setReportsToOptions([]);
          setFormReportsToId(undefined);
        }
      } finally {
        if (isMounted) setLoadingReportsTo(false);
      }
    };

    fetchReportsTo();
    return () => {
      isMounted = false;
    };
  }, [showAddDrawer, formRole, formDomainId]);

  const resetDrawerForm = () => {
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole('Member');
    setFormDesignation('');
    setFormDomainId(undefined);
    setFormReportsToId(undefined);
    setFormCollegeId('');
    setFormPhone('');
    setFormDept('Computer Science & Engineering');
    setFormYear('1st Year');
    setFormSemester('1st Sem');
    setFormSkills('');
    setFormJoiningDate(new Date().toISOString().split('T')[0]);
    setFormAvatarUrl('');
    setFormBio('');
    setFormGithubUrl('');
    setFormLinkedinUrl('');
    setFormErrors({});
    setShowOptionalDetails(false);
    setShowPassword(false);
    setReportsToSearch('');
  };

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [membersData, domainsData] = await Promise.all([
        api.members.list({
          domain_id: selectedDomain,
          status: selectedStatus || undefined,
          department: selectedDept || undefined,
          search: search || undefined,
        }),
        api.domains.list().catch(() => []),
      ]);
      setMembers(membersData);
      setDomains(domainsData);
    } catch (err) {
      console.error('Failed to load members:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput, page: 1 });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formFullName.trim()) {
      errors.fullName = 'Full Name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formEmail.trim()) {
      errors.email = 'Email Address is required.';
    } else if (!emailRegex.test(formEmail.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!formPassword) {
      errors.password = 'Password is required.';
    } else if (formPassword.length < 8) {
      errors.password = 'Password must contain at least 8 characters.';
    }

    if (!formRole) {
      errors.role = 'Role is required.';
    }

    if (['Member', 'Domain Head'].includes(formRole) && !formDomainId) {
      errors.domainId = 'Department / Domain is required for this role.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsArray = formSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CreateMemberPayload = {
        full_name: formFullName.trim(),
        email: formEmail.trim().toLowerCase(),
        password: formPassword,
        role: formRole,
        designation: formDesignation.trim() || undefined,
        department: formDept || undefined,
        domain_id: formDomainId,
        reports_to_id: formReportsToId,
        college_id: formCollegeId.trim() || undefined,
        phone: formPhone.trim() || undefined,
        year: formYear,
        semester: formSemester,
        year_semester: `${formYear} / ${formSemester}`,
        skills: skillsArray,
        joining_date: formJoiningDate || undefined,
        avatar_url: formAvatarUrl.trim() || undefined,
        bio: formBio.trim() || undefined,
        github_url: formGithubUrl.trim() || undefined,
        linkedin_url: formLinkedinUrl.trim() || undefined,
        status: 'Active',
      };

      const newMember = await api.users.create(payload);

      // Close drawer, show success toast, refresh list
      setShowAddDrawer(false);
      resetDrawerForm();
      await loadData();

      setToast({
        type: 'success',
        title: 'Member Added',
        message: `${newMember.full_name} was added successfully as ${formRole}.`,
      });

      // Auto dismiss toast after 5 seconds
      setTimeout(() => {
        setToast((current) => (current?.message.includes(newMember.full_name) ? null : current));
      }, 5000);

    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to create user. Please check your inputs.';
      const lowerDetail = typeof detail === 'string' ? detail.toLowerCase() : '';

      if (lowerDetail.includes('email') && (lowerDetail.includes('exists') || lowerDetail.includes('already'))) {
        setFormErrors({ email: detail });
      } else if (lowerDetail.includes('password') && lowerDetail.includes('8')) {
        setFormErrors({ password: detail });
      } else if (lowerDetail.includes('domain')) {
        setFormErrors({ domainId: detail });
      } else {
        setFormErrors({ general: detail });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await api.members.delete(memberToDelete.id);
      setToast({
        type: 'info',
        title: 'Member Removed',
        message: `${memberToDelete.full_name} has been removed from the club directory.`,
      });
      setTimeout(() => setToast(null), 4000);
      setMemberToDelete(null);
      loadData();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Action Failed',
        message: err.response?.data?.detail || 'Failed to remove member',
      });
    }
  };

  const handleOpenEditDrawer = async (m: Member) => {
    if (user?.role?.name === 'Vice President' && (m.role_name === 'Super Admin' || m.role_name === 'President')) {
      setToast({
        type: 'warning',
        title: 'Access Restricted',
        message: `Vice President is not authorized to edit ${m.role_name} profiles.`
      });
      return;
    }
    setEditingMember(m);
    setEditFullName(m.full_name || '');
    setEditEmail(m.email || '');
    setEditPhone(m.phone || '');
    setEditAvatarUrl(m.avatar_url || '');
    setEditCollegeId(m.college_id || '');
    setEditDept(m.department || 'Computer Science & Engineering');
    setEditYearSemester(m.year_semester || '1st Year / 1st Sem');
    setEditDomainId(m.domain_id || undefined);
    setEditRole(m.role_name || m.role_title || 'Member');
    setEditDesignation(m.role_title || '');
    setEditSkills(Array.isArray(m.skills) ? m.skills.join(', ') : (m.skills || ''));
    setEditStatus(m.status || 'Active');
    setEditReportsToId(m.reports_to_id || undefined);
    setEditReportsToSearch('');
    setEditErrors({});

    try {
      const roles = await api.users.getAllowedRoles();
      setAllowedRoles(roles);
      const targetRole = m.role_name || 'Member';
      const repOptions = await api.users.getReportsToOptions(targetRole, m.domain_id || undefined);
      setReportsToOptions(repOptions);
    } catch (e) {
      console.error(e);
    }

    setShowEditDrawer(true);
  };

  const handleSaveMemberEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editFullName.trim()) {
      setEditErrors({ fullName: 'Full Name is required.' });
      return;
    }

    setIsEditSubmitting(true);
    try {
      const skillsArray = editSkills.split(',').map((s) => s.trim()).filter(Boolean);
      await api.members.update(editingMember.id, {
        full_name: editFullName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        avatar_url: editAvatarUrl.trim() || undefined,
        college_id: editCollegeId.trim() || undefined,
        department: editDept,
        year_semester: editYearSemester,
        domain_id: editDomainId,
        role: editRole,
        designation: editDesignation.trim() || editRole,
        skills: skillsArray,
        status: editStatus,
        reports_to_id: editReportsToId
      });

      setToast({
        type: 'success',
        title: 'Member Updated',
        message: `${editFullName} was updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      setShowEditDrawer(false);
      setEditingMember(null);
      loadData();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update member profile.';
      setEditErrors({ general: detail });
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleMemberStatus = async (m: Member) => {
    if (user?.role?.name === 'Vice President' && (m.role_name === 'Super Admin' || m.role_name === 'President')) {
      setToast({
        type: 'warning',
        title: 'Access Restricted',
        message: `Vice President cannot alter status of ${m.role_name} accounts.`
      });
      return;
    }
    const newStatus: Member['status'] = m.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      await api.members.update(m.id, { status: newStatus });
      setToast({
        type: 'info',
        title: 'Status Updated',
        message: `${m.full_name} account status changed to ${newStatus}.`
      });
      setTimeout(() => setToast(null), 4000);
      loadData();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update member status.'
      });
    }
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Filtered & Sorted Data
  const sortedMembers = [...members].sort((a: any, b: any) => {
    let aVal = a[sortKey] || '';
    let bVal = b[sortKey] || '';
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedMembers.length / pageSize) || 1;
  const paginatedMembers = sortedMembers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Table Columns
  const columns: Column<Member>[] = [
    {
      key: 'full_name',
      header: 'Member',
      sortable: true,
      render: (m) => (
        <div className="flex items-center space-x-3">
          <Avatar src={m.avatar_url} name={m.full_name} size="sm" />
          <div className="min-w-0">
            <div className="font-bold text-slate-900 dark:text-white truncate">
              {m.full_name}
            </div>
            <div className="text-xs text-slate-400 font-mono truncate">
              {m.college_id} • {m.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'domain_name',
      header: 'Domain',
      sortable: true,
      render: (m) => (
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {m.domain_name || 'General / Core'}
        </span>
      ),
    },
    {
      key: 'role_title',
      header: 'Role',
      sortable: true,
      render: (m) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
          {m.role_name || m.role_title || 'Member'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (m) => <Badge status={m.status} size="xs" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (m) => {
        const isRestrictedForVP = user?.role?.name === 'Vice President' && (m.role_name === 'Super Admin' || m.role_name === 'President');
        return (
          <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="xs"
              icon={Eye}
              onClick={() => navigate(`/members/${m.id}${location.search || ''}`)}
              title="View member profile"
            >
              View
            </Button>
            {canAddMember && !isRestrictedForVP && (
              <Button
                variant="outline"
                size="xs"
                icon={Edit3}
                onClick={() => handleOpenEditDrawer(m)}
                title="Edit member profile"
              >
                Edit
              </Button>
            )}
            {canAddMember && !isRestrictedForVP && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleToggleMemberStatus(m)}
                className={m.status === 'Active' ? 'text-amber-700 hover:text-amber-800 dark:text-amber-400 font-medium' : 'text-emerald-600 hover:text-emerald-700 font-medium'}
                title={m.status === 'Active' ? 'Deactivate member account' : 'Activate member account'}
              >
                {m.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
            {canDeleteMember && !isRestrictedForVP && m.role_name !== 'Super Admin' && (
              <button
                onClick={() => setMemberToDelete(m)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete member"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Filtered reports to list for the search input
  const filteredReportsToOptions = (reportsToOptions || []).filter((opt) => {
    if (!opt) return false;
    const name = String(opt.full_name || opt.name || '').toLowerCase();
    const role = String(opt.role || '').toLowerCase();
    const domain = String(opt.domain_name || '').toLowerCase();
    const term = String(reportsToSearch || '').trim().toLowerCase();
    if (!term) return true;
    return name.includes(term) || role.includes(term) || domain.includes(term);
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Page Header (Requirement 1: Members [124 Total], Subtitle, + Add Member button) */}
      <PageHeader
        title="Members"
        badge={
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F5EFE6] dark:bg-amber-950/40 text-[#855C22] dark:text-amber-400 border border-[#E8E1D5] dark:border-amber-900/50">
            [{members.length} Total]
          </span>
        }
        description="Manage club members, domain heads, and leadership roles."
        actions={
          <div className="flex items-center space-x-2">
            <a href={api.reports.exportCsvUrl('members')} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon={Download}>
                Export CSV
              </Button>
            </a>
            {canAddMember && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={handleOpenAddDrawer}
                className="shadow-sm hover:shadow"
              >
                + Add Member
              </Button>
            )}
          </div>
        }
      >
        {/* Search and Filters Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search members..."
                className="w-full text-xs sm:text-sm pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500"
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDomain || ''}
              onChange={(e) => updateFilters({ domain: e.target.value ? Number(e.target.value) : null, page: 1 })}
              aria-label="Filter by Domain"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500"
            >
              <option value="">Domain: All</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => updateFilters({ status: e.target.value || null, page: 1 })}
              aria-label="Filter by Status"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-amber-600 dark:focus:border-amber-500"
            >
              <option value="">Status: All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Alumni">Alumni</option>
              <option value="Suspended">Suspended</option>
            </select>

            {(search || selectedDomain || selectedStatus || selectedDept) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearchInput('');
                  updateFilters({ q: '', domain: null, status: null, dept: null, page: 1 });
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      {/* Modern Table */}
      {loading ? (
        <LoadingState type="table" count={5} />
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="No club members matched your search or active domain filters."
          actionText={canAddMember ? "+ Add First Member" : undefined}
          onAction={canAddMember ? handleOpenAddDrawer : undefined}
        />
      ) : (
        <div className="space-y-4">
          <Table<Member>
            columns={columns}
            data={paginatedMembers}
            keyExtractor={(m) => m.id}
            sortKey={sortKey}
            sortDirection={sortDir}
            onSort={handleSort}
            onRowClick={(m) => navigate(`/members/${m.id}${location.search || ''}`)}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedMembers.length}
            pageSize={pageSize}
            onPageChange={(page) => updateFilters({ page })}
          />
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <Modal
          isOpen={!!selectedMember}
          onClose={() => navigate(`/members${location.search || ''}`)}
          title={selectedMember.full_name}
          subtitle={`${selectedMember.college_id} • ${selectedMember.department}`}
        >
          <div className="space-y-5">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-[#FAF7F2] dark:bg-slate-800/50 border border-[#E8E1D5] dark:border-slate-800">
              <Avatar src={selectedMember.avatar_url} name={selectedMember.full_name} size="lg" />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedMember.full_name}
                  </h3>
                  <Badge status={selectedMember.status} size="xs" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Domain: <strong>{selectedMember.domain_name || 'Core Leadership'}</strong> • Role: <strong>{selectedMember.role_name || selectedMember.role_title}</strong>
                </p>
                {selectedMember.reports_to_name && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 inline-block" />
                    Reports to: {selectedMember.reports_to_name} ({selectedMember.reports_to_role || 'Supervisor'})
                  </p>
                )}
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {selectedMember.email} • {selectedMember.phone || 'No phone'}
                </p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400">Projects</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedMember.active_projects_count}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tasks</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedMember.completed_tasks_count}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400">Events</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedMember.events_participated_count}
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-[10px] uppercase font-bold text-slate-400">Awards</span>
                <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedMember.achievements_count}
                </div>
              </div>
            </div>

            {/* Skills */}
            {selectedMember.skills && selectedMember.skills.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Technical Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg text-xs font-medium bg-[#F5EFE6] dark:bg-amber-950/40 text-[#855C22] dark:text-amber-400 border border-[#E8E1D5] dark:border-amber-900/50"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Right-Side Drawer (Requirements 2, 3, 4, 5, 6, 7, 8, 9, 11, 13) */}
      <Drawer
        isOpen={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        title="Add Member"
        subtitle="Create a new member account for Techno Club."
        position="right"
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col h-full space-y-5 pb-6">
          {/* General Error Banner */}
          {formErrors.general && (
            <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                {formErrors.general}
              </div>
            </div>
          )}

          {/* Section 1: Core Credentials & Account */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Account Information
            </h3>

            {/* Full Name */}
            <div>
              <Input
                label="Full Name *"
                placeholder="e.g. Rahul Mehta"
                value={formFullName}
                onChange={(e) => {
                  setFormFullName(e.target.value);
                  if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: undefined }));
                }}
                error={formErrors.fullName}
              />
            </div>

            {/* Email Address */}
            <div>
              <Input
                label="Email Address *"
                type="email"
                placeholder="e.g. rahul.mehta@technoclub.org"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  if (formErrors.email) setFormErrors((p) => ({ ...p, email: undefined }));
                }}
                error={formErrors.email}
              />
            </div>

            {/* Password */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <span className="text-[10px] text-slate-400">Min. 8 characters</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formPassword}
                  onChange={(e) => {
                    setFormPassword(e.target.value);
                    if (formErrors.password) setFormErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={`w-full text-xs sm:text-sm rounded-xl border transition-all duration-150 py-2.5 pl-3.5 pr-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none ${
                    formErrors.password
                      ? 'border-rose-300 dark:border-rose-800 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{formErrors.password}</p>
              )}
            </div>
          </div>

          {/* Section 2: Role & Organizational Assignment */}
          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Role & Hierarchy
            </h3>

            {/* Role Dropdown (Permission filtered) */}
            <Select
              label="Role *"
              value={formRole}
              onChange={(e) => {
                const nextRole = e.target.value;
                setFormRole(nextRole);
                if (formErrors.role) setFormErrors((p) => ({ ...p, role: undefined }));
              }}
              options={
                allowedRoles.length > 0
                  ? allowedRoles.map((r) => ({ value: r, label: r }))
                  : [{ value: 'Member', label: 'Member' }]
              }
              error={formErrors.role}
              helperText={`Allowed creation roles based on your permissions.`}
            />

            {/* Designation / Role Title */}
            <div>
              <Input
                label="Designation / Custom Title"
                placeholder={formRole === 'Domain Head' ? 'e.g. AI/ML Domain Head' : 'e.g. Frontend Developer, Core Lead'}
                value={formDesignation}
                onChange={(e) => setFormDesignation(e.target.value)}
                helperText="Optional specific role title inside the club"
              />
            </div>

            {/* Department / Domain Selection (Required for Member & Domain Head) */}
            {['Member', 'Domain Head'].includes(formRole) ? (
              <Select
                label="Department / Domain *"
                value={formDomainId !== undefined ? String(formDomainId) : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setFormDomainId(val);
                  if (formErrors.domainId) setFormErrors((p) => ({ ...p, domainId: undefined }));
                }}
                options={[
                  { value: '', label: '-- Select Domain --' },
                  ...(Array.isArray(domains) ? domains : []).map((d) => ({ value: String(d.id), label: d.name })),
                ]}
                error={formErrors.domainId}
                helperText="Select the assigned technical domain."
              />
            ) : (
              <Select
                label="Department / Domain (Optional)"
                value={formDomainId !== undefined ? String(formDomainId) : ''}
                onChange={(e) => setFormDomainId(e.target.value ? Number(e.target.value) : undefined)}
                options={[
                  { value: '', label: 'General / Executive Leadership (All Domains)' },
                  ...(Array.isArray(domains) ? domains : []).map((d) => ({ value: String(d.id), label: d.name })),
                ]}
                helperText="Domain assignment is optional for executive leadership."
              />
            )}

            {/* Reports To (Searchable / Role Hierarchy Aware) */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reports To {['Member', 'Domain Head'].includes(formRole) && <span className="text-amber-600">*</span>}
                </label>
                {loadingReportsTo && (
                  <span className="text-[10px] text-amber-600 animate-pulse">Loading hierarchy...</span>
                )}
              </div>

              {formRole === 'Super Admin' ? (
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500">
                  None (Highest Organizational Authority)
                </div>
              ) : (
                <div className="space-y-2">
                  {reportsToOptions.length > 4 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={reportsToSearch}
                        onChange={(e) => setReportsToSearch(e.target.value)}
                        placeholder="Search supervisor by name or role..."
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-800 pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  )}

                  <select
                    value={formReportsToId !== undefined ? String(formReportsToId) : ''}
                    onChange={(e) => setFormReportsToId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  >
                    {filteredReportsToOptions.length === 0 ? (
                      <option value="">No matching supervisor found</option>
                    ) : (
                      filteredReportsToOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.full_name || opt.name || 'Supervisor'} — {opt.role || 'Member'} {opt.domain_name ? `(${opt.domain_name})` : ''}
                        </option>
                      ))
                    )}
                  </select>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formRole === 'Member' && 'Members report directly to their Domain Head.'}
                    {formRole === 'Domain Head' && 'Domain Heads report directly to the Vice President or President.'}
                    {formRole === 'Vice President' && 'Vice President reports directly to the President.'}
                    {formRole === 'President' && 'President reports to Super Admin / Faculty Council.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Collapsible Optional Details (College ID, Year, Sem, Phone, Skills) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="flex items-center justify-between w-full py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <span>Academic & Profile Details (Optional)</span>
              {showOptionalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOptionalDetails && (
              <div className="space-y-4 pt-3 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="College Registration ID"
                    placeholder="e.g. TC-2026-1089 (auto if blank)"
                    value={formCollegeId}
                    onChange={(e) => setFormCollegeId(e.target.value)}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>

                <Select
                  label="Academic Department"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                  options={[
                    { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering' },
                    { value: 'Information Technology', label: 'Information Technology' },
                    { value: 'Electronics & Communication', label: 'Electronics & Communication' },
                    { value: 'Electrical & Electronics', label: 'Electrical & Electronics' },
                    { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Academic Year"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    options={[
                      { value: '1st Year', label: '1st Year' },
                      { value: '2nd Year', label: '2nd Year' },
                      { value: '3rd Year', label: '3rd Year' },
                      { value: '4th Year', label: '4th Year' },
                    ]}
                  />
                  <Select
                    label="Semester"
                    value={formSemester}
                    onChange={(e) => setFormSemester(e.target.value)}
                    options={[
                      { value: '1st Sem', label: '1st Sem' },
                      { value: '2nd Sem', label: '2nd Sem' },
                      { value: '3rd Sem', label: '3rd Sem' },
                      { value: '4th Sem', label: '4th Sem' },
                      { value: '5th Sem', label: '5th Sem' },
                      { value: '6th Sem', label: '6th Sem' },
                      { value: '7th Sem', label: '7th Sem' },
                      { value: '8th Sem', label: '8th Sem' },
                    ]}
                  />
                </div>

                <Input
                  label="Technical Skills (Comma separated)"
                  placeholder="e.g. Python, Docker, React, PyTorch, Figma"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                />

                <Input
                  label="Joining Date"
                  type="date"
                  value={formJoiningDate}
                  onChange={(e) => setFormJoiningDate(e.target.value)}
                />

                <Input
                  label="Profile Photo URL"
                  placeholder="https://images.unsplash.com/... or DiceBear"
                  value={formAvatarUrl}
                  onChange={(e) => setFormAvatarUrl(e.target.value)}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="GitHub Profile URL"
                    placeholder="https://github.com/username"
                    value={formGithubUrl}
                    onChange={(e) => setFormGithubUrl(e.target.value)}
                  />
                  <Input
                    label="LinkedIn Profile URL"
                    placeholder="https://linkedin.com/in/username"
                    value={formLinkedinUrl}
                    onChange={(e) => setFormLinkedinUrl(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Short Bio / Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Brief intro, interests, or background..."
                    className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Drawer Actions Footer (Requirement 8: [ Cancel ] [ Create User ] in Sand/Brown Theme) */}
          <div className="pt-4 border-t border-[#E8E1D5] dark:border-slate-800 flex items-center justify-end gap-3 mt-auto">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setShowAddDrawer(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isSubmitting}
              className="bg-amber-700 hover:bg-amber-800 text-white font-medium px-5"
            >
              Create User
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Edit Member Drawer */}
      <Drawer
        isOpen={showEditDrawer}
        onClose={() => {
          setShowEditDrawer(false);
          setEditingMember(null);
        }}
        title="Edit Member"
        subtitle="Modify profile, role permissions, domain assignment, and status."
        position="right"
        size="lg"
      >
        <form onSubmit={handleSaveMemberEdit} className="flex flex-col h-full space-y-5 pb-6">
          {editErrors.general && (
            <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
                {editErrors.general}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Personal Information
            </h3>

            <Input
              label="Full Name *"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              error={editErrors.fullName}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
              <Input
                label="Phone Number"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="College ID"
                value={editCollegeId}
                onChange={(e) => setEditCollegeId(e.target.value)}
              />
              <Input
                label="Profile Photo URL"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Role & Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Role"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                options={
                  allowedRoles.length > 0
                    ? allowedRoles.map((r) => ({ value: r, label: r }))
                    : [{ value: editRole, label: editRole }]
                }
              />
              <Select
                label="Account Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as Member['status'])}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Deactivated', label: 'Deactivated' },
                  { value: 'Alumni', label: 'Alumni' },
                ]}
              />
            </div>

            <Input
              label="Designation / Custom Title"
              value={editDesignation}
              onChange={(e) => setEditDesignation(e.target.value)}
            />

            {['Member', 'Domain Head', 'Technical Lead'].includes(editRole) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Department / Domain
                </label>
                <select
                  value={editDomainId || ''}
                  onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                >
                  <option value="">Select domain...</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editRole !== 'Super Admin' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Reports To (Supervisor)
                </label>
                <select
                  value={editReportsToId !== undefined ? String(editReportsToId) : ''}
                  onChange={(e) => setEditReportsToId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 px-3.5 text-slate-900 dark:text-white focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
                >
                  <option value="">None / Direct</option>
                  {reportsToOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.full_name || opt.name} — {opt.role} {opt.domain_name ? `(${opt.domain_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Academic & Skills
            </h3>

            <Select
              label="Academic Department"
              value={editDept}
              onChange={(e) => setEditDept(e.target.value)}
              options={[
                { value: 'Computer Science & Engineering', label: 'Computer Science & Engineering' },
                { value: 'Information Technology', label: 'Information Technology' },
                { value: 'Electronics & Communication', label: 'Electronics & Communication' },
                { value: 'Electrical & Electronics', label: 'Electrical & Electronics' },
                { value: 'Mechanical Engineering', label: 'Mechanical Engineering' },
              ]}
            />

            <Input
              label="Year & Semester"
              value={editYearSemester}
              onChange={(e) => setEditYearSemester(e.target.value)}
              placeholder="e.g. 3rd Year / 5th Sem"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Technical Skills (Comma separated)
              </label>
              <input
                type="text"
                value={editSkills}
                onChange={(e) => setEditSkills(e.target.value)}
                placeholder="Python, React, Machine Learning, UI/UX"
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#E8E1D5] dark:border-slate-800 flex items-center justify-end gap-3 mt-auto">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setShowEditDrawer(false);
                setEditingMember(null);
              }}
              disabled={isEditSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isEditSubmitting}
              className="bg-amber-700 hover:bg-amber-800 text-white font-medium px-5"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Drawer>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        isOpen={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDeleteMember}
        title="Remove Club Member"
        message={`Are you sure you want to remove ${memberToDelete?.full_name} from the Techno Club directory? All active task and project assignments will be archived.`}
        confirmText="Remove Member"
        variant="danger"
      />
    </div>
  );
};
