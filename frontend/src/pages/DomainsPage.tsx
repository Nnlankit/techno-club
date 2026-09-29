import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Layers, Users, FolderGit2, CheckSquare, Calendar, Plus, 
  ArrowRight, ShieldCheck, Cpu, Globe, Shield, Cloud, Terminal, 
  Smartphone, Palette, Box, BookOpen, UserCheck, Search, Filter,
  Edit3, Trash2, Archive, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Domain, Member } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Avatar, Card,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

export const DomainsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const { id: paramDomainId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const hasLeadership = hasRole(['Super Admin', 'President', 'Vice President']);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected detail modal
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [domainMembers, setDomainMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Edit Domain State
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('#2563EB');
  const [editHeadId, setEditHeadId] = useState<number | undefined>(undefined);
  const [editCoHeadId, setEditCoHeadId] = useState<number | undefined>(undefined);
  const [editIsActive, setEditIsActive] = useState(true);

  // Delete Domain State
  const [domainToDelete, setDomainToDelete] = useState<Domain | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [headId, setHeadId] = useState<number | undefined>(undefined);
  const [coHeadId, setCoHeadId] = useState<number | undefined>(undefined);

  const loadDomains = async () => {
    setLoading(true);
    try {
      const data = await api.domains.list();
      setDomains(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDomainDetail = async (d: Domain) => {
    setSelectedDomain(d);
    setLoadingMembers(true);
    try {
      const members = await api.domains.getMembers(d.id);
      setDomainMembers(members);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadDomains();
    api.members.list().then(setAllMembers).catch(console.error);
  }, []);

  // Synchronize route paramDomainId with selectedDomain and its roster
  useEffect(() => {
    if (!paramDomainId) {
      setSelectedDomain(null);
      setDomainMembers([]);
      return;
    }
    const did = Number(paramDomainId);
    const existing = domains.find((d) => d.id === did);
    if (existing) {
      handleOpenDomainDetail(existing);
    } else {
      api.domains.get(did)
        .then((d) => handleOpenDomainDetail(d))
        .catch((err) => console.error('Failed to load domain by id:', err));
    }
  }, [paramDomainId, domains]);

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.domains.create({
        name,
        code: code.toUpperCase(),
        description,
        color,
        head_id: headId,
        co_head_id: coHeadId,
        is_active: true
      });
      setShowAddModal(false);
      setName('');
      setCode('');
      setDescription('');
      setHeadId(undefined);
      setCoHeadId(undefined);
      setToast({
        type: 'success',
        title: 'Domain Created',
        message: `Domain ${name} established successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadDomains();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.detail || 'Failed to create domain'
      });
    }
  };

  const handleOpenEditModal = (d: Domain) => {
    setEditingDomain(d);
    setEditName(d.name);
    setEditCode(d.code);
    setEditDescription(d.description || '');
    setEditColor(d.color || '#2563EB');
    setEditHeadId(d.head_id || undefined);
    setEditCoHeadId(d.co_head_id || undefined);
    setEditIsActive(d.is_active ?? true);
    setShowEditModal(true);
  };

  const handleUpdateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDomain) return;
    try {
      await api.domains.update(editingDomain.id, {
        name: editName,
        code: editCode.toUpperCase(),
        description: editDescription,
        color: editColor,
        head_id: editHeadId,
        co_head_id: editCoHeadId,
        is_active: editIsActive
      });
      setShowEditModal(false);
      setEditingDomain(null);
      setToast({
        type: 'success',
        title: 'Domain Updated',
        message: `${editName} domain details updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadDomains();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update domain'
      });
    }
  };

  const handleArchiveDomain = async (d: Domain) => {
    try {
      await api.domains.delete(d.id, true);
      setToast({
        type: 'info',
        title: 'Domain Archived',
        message: `${d.name} domain has been deactivated/archived.`
      });
      setTimeout(() => setToast(null), 4000);
      loadDomains();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.response?.data?.detail || 'Failed to archive domain'
      });
    }
  };

  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;
    try {
      await api.domains.delete(domainToDelete.id, false, true);
      setToast({
        type: 'info',
        title: 'Domain Deleted',
        message: `${domainToDelete.name} domain was deleted.`
      });
      setTimeout(() => setToast(null), 4000);
      setDomainToDelete(null);
      loadDomains();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete domain'
      });
    }
  };

  const getDomainIcon = (code: string) => {
    switch (code) {
      case 'AIML': return Cpu;
      case 'WEB': return Globe;
      case 'CYBER': return Shield;
      case 'CLOUD': return Cloud;
      case 'IOT': return Cpu;
      case 'CP': return Terminal;
      case 'APP': return Smartphone;
      case 'UIUX': return Palette;
      case 'BLOCKCHAIN': return Box;
      case 'RESEARCH': return BookOpen;
      default: return Layers;
    }
  };

  const filteredDomains = domains.filter((d) => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.head_name && d.head_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      <PageHeader
        title="Domains"
        description="Specialized technical verticals driving project engineering, research papers, workshops, and hackathon teams."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search domains by name, short code, domain head...'
        }}
        primaryAction={
          hasLeadership
            ? {
                label: 'Create Domain',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowAddModal(true)
              }
            : undefined
        }
      />

      {loading ? (
        <LoadingState message="Loading specialized technical domains..." />
      ) : filteredDomains.length === 0 ? (
        <EmptyState
          title="No Domains Found"
          description="No technical domains match your current search query."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDomains.map((d) => {
            const Icon = getDomainIcon(d.code);
            return (
              <Card
                key={d.id}
                onClick={() => navigate(`/domains/${d.id}`)}
                className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between group shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: d.color || '#2563EB' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                        {d.code}
                      </span>
                      {hasLeadership && (
                        <div className="flex items-center space-x-0.5 ml-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Domain"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleArchiveDomain(d)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={d.is_active ? "Archive Domain" : "Reactivate Domain"}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDomainToDelete(d)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Domain"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {d.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {d.description || 'Specialized technology domain fostering research, engineering, and student development.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-xs text-slate-500">
                    <Avatar name={d.head_name || 'Open'} size="xs" />
                    <div className="truncate">
                      <span className="text-[11px] text-slate-400">Head:</span>{' '}
                      <strong className="text-slate-800 dark:text-slate-200">
                        {d.head_name || 'Position Open'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-3.5">
                    <span className="flex items-center space-x-1" title="Members">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-700 dark:text-slate-300">{d.members_count}</strong>
                    </span>
                    <span className="flex items-center space-x-1" title="Active Projects">
                      <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-700 dark:text-slate-300">{d.active_projects_count}</strong>
                    </span>
                    <span className="flex items-center space-x-1" title="Tasks">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-700 dark:text-slate-300">{d.tasks_count}</strong>
                    </span>
                  </div>

                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center group-hover:translate-x-0.5 transition-transform text-xs">
                    <span>View Hub</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Domain Detail Modal */}
      {selectedDomain && (
        <Modal
          isOpen={!!selectedDomain}
          onClose={() => navigate('/domains')}
          title={`${selectedDomain.name} (${selectedDomain.code})`}
          subtitle="Domain Operations, Roster & Delivery Metrics"
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Avatar name={selectedDomain.head_name || 'Open'} size="md" />
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Domain Leadership</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {selectedDomain.head_name ? selectedDomain.head_name : 'Domain Head Open'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{selectedDomain.members_count}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Members</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{selectedDomain.active_projects_count}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Projects</div>
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{selectedDomain.tasks_count}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tasks</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Charter & Focus Areas
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                {selectedDomain.description || 'Specialized technology domain fostering research, engineering, and workshops.'}
              </p>
            </div>

            {/* Domain Members Roster */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Domain Member Roster ({domainMembers.length})
              </h4>
              {loadingMembers ? (
                <LoadingState message="Loading roster members..." />
              ) : domainMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No members currently registered under this domain.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {domainMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3"
                    >
                      <Avatar
                        name={m.full_name}
                        src={m.avatar_url}
                        size="sm"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.full_name}</div>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 truncate">{m.role_title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDomain(null)}
              >
                Close Hub
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Domain Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Establish New Technical Domain"
        subtitle="Expands club architecture with a new engineering focus area"
        maxWidth="md"
      >
        <form onSubmit={handleCreateDomain} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Domain Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Quantum Computing & Cryptography"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g., QUANTUM"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Accent Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Charter Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary research goals, learning roadmaps, and projects..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Establish Domain
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Domain Modal */}
      {editingDomain && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingDomain(null);
          }}
          title={`Edit Domain: ${editingDomain.name}`}
          subtitle="Modify domain leadership, charter, and display properties"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateDomain} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Domain Name
              </label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Code
                </label>
                <input
                  type="text"
                  required
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-full h-10 p-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Charter Description
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Head
                </label>
                <select
                  value={editHeadId || ''}
                  onChange={(e) => setEditHeadId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None / Open</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Domain Co-Head
                </label>
                <select
                  value={editCoHeadId || ''}
                  onChange={(e) => setEditCoHeadId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None / Open</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role_title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <label htmlFor="editIsActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Domain is Active
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingDomain(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog for Domain Deletion */}
      <ConfirmationDialog
        isOpen={!!domainToDelete}
        title="Delete Domain"
        message={`Are you sure you want to delete "${domainToDelete?.name}"? All assigned members, tasks, and projects will safely retain their records, but this domain will be permanently removed.`}
        confirmLabel="Delete Domain"
        confirmVariant="danger"
        onConfirm={handleDeleteDomain}
        onCancel={() => setDomainToDelete(null)}
      />
    </div>
  );
};
