import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Pin, Calendar, User, Filter, AlertCircle, 
  Tag, Shield, Sparkles, Send, Bell, Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Announcement, Domain } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Card, Badge, Button, Input, Select, 
  Modal, EmptyState, LoadingState, ErrorState,
  ConfirmationDialog, Toast
} from '../components/ui';

export const AnnouncementsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<number | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<string>('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');
  const [domainId, setDomainId] = useState<number | undefined>(undefined);
  const [targetRole, setTargetRole] = useState('All');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const canCreate = hasRole(['President', 'Vice President', 'Domain Head', 'Faculty Coordinator']);
  const canManage = hasRole(['Super Admin', 'President', 'Vice President', 'Domain Head']);

  // Edit State
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'Low' | 'Normal' | 'High' | 'Urgent'>('Normal');
  const [editDomainId, setEditDomainId] = useState<number | undefined>(undefined);
  const [editTargetRole, setEditTargetRole] = useState('All');
  const [editPinned, setEditPinned] = useState(false);

  // Delete State
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const handleOpenEdit = (a: Announcement) => {
    setEditingAnnouncement(a);
    setEditTitle(a.title);
    setEditContent(a.content);
    setEditPriority(a.priority as any);
    setEditDomainId(a.domain_id || undefined);
    setEditTargetRole(a.target_role || 'All');
    setEditPinned(a.pinned);
    setShowEditModal(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement) return;
    setSubmitting(true);
    try {
      await api.announcements.update(editingAnnouncement.id, {
        title: editTitle,
        content: editContent,
        priority: editPriority,
        domain_id: editDomainId || undefined,
        target_role: editTargetRole,
        pinned: editPinned,
      });
      setShowEditModal(false);
      setEditingAnnouncement(null);
      setToast({
        type: 'success',
        title: 'Announcement Updated',
        message: 'Circular changes broadcast successfully.'
      });
      setTimeout(() => setToast(null), 4000);
      loadData();
      if (selectedAnnouncement?.id === editingAnnouncement.id) {
        setSelectedAnnouncement(null);
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update announcement'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await api.announcements.delete(announcementToDelete.id);
      setToast({
        type: 'info',
        title: 'Announcement Removed',
        message: 'The announcement was removed from the bulletin.'
      });
      setTimeout(() => setToast(null), 4000);
      setAnnouncementToDelete(null);
      if (selectedAnnouncement?.id === announcementToDelete.id) {
        setSelectedAnnouncement(null);
      }
      loadData();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete announcement'
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDomain, selectedPriority]);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [annData, domData] = await Promise.all([
        api.announcements.list({
          domain_id: selectedDomain,
          priority: selectedPriority || undefined,
        }),
        api.domains.list().catch(() => []),
      ]);
      setAnnouncements(annData);
      setDomains(domData);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      await api.announcements.create({
        title,
        content,
        priority,
        domain_id: domainId || undefined,
        target_role: targetRole,
        pinned,
      });
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('Normal');
    setDomainId(undefined);
    setTargetRole('All');
    setPinned(false);
  };

  const filteredAnnouncements = announcements.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      (a.author_name && a.author_name.toLowerCase().includes(q)) ||
      (a.domain_name && a.domain_name.toLowerCase().includes(q))
    );
  });

  const pinnedItems = filteredAnnouncements.filter((a) => a.pinned);
  const regularItems = filteredAnnouncements.filter((a) => !a.pinned);

  const getPriorityBadgeVariant = (p: string): 'rose' | 'amber' | 'blue' | 'slate' => {
    if (p === 'Urgent') return 'rose';
    if (p === 'High') return 'amber';
    if (p === 'Normal') return 'blue';
    return 'slate';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Club Announcements"
        description="Official circulars, executive orders, updates, and domain communications."
        actions={
          canCreate ? (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => setShowCreateModal(true)}
            >
              Post Announcement
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search announcements..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedDomain || ''}
              onChange={(e) => setSelectedDomain(e.target.value ? Number(e.target.value) : undefined)}
              aria-label="Filter by domain"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Domains</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              aria-label="Filter by priority"
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-600"
            >
              <option value="">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>

            {(search || selectedDomain || selectedPriority) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSearch('');
                  setSelectedDomain(undefined);
                  setSelectedPriority('');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </PageHeader>

      {loading ? (
        <LoadingState type="cards" count={6} />
      ) : error ? (
        <ErrorState onRetry={loadData} />
      ) : filteredAnnouncements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description="There are currently no active announcements matching your query or domain filter."
          actionText={canCreate ? 'Broadcast First Announcement' : undefined}
          onAction={canCreate ? () => setShowCreateModal(true) : undefined}
        />
      ) : (
        <div className="space-y-6">
          {/* Pinned Announcements */}
          {pinnedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Pin className="w-3.5 h-3.5 fill-current" />
                <span>Pinned Circulars & Executive Orders</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pinnedItems.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAnnouncement(a)}
                    className="p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20 hover:shadow-md transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="amber" size="xs">
                          PINNED
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(a.priority)} size="xs">
                          {a.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                        {canManage && (
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors"
                              title="Edit Announcement"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAnnouncementToDelete(a)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {a.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>

                    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span>{a.author_name || 'Club Executive'}</span>
                      </div>
                      {a.domain_name && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {a.domain_name}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          <div className="space-y-3">
            {pinnedItems.length > 0 && (
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>Recent Updates</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularItems.map((a) => (
                <Card
                  key={a.id}
                  hoverable
                  onClick={() => setSelectedAnnouncement(a)}
                  className="flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={getPriorityBadgeVariant(a.priority)} size="xs">
                        {a.priority} Priority
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(a.created_at).toLocaleDateString()}
                        </span>
                        {canManage && (
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEdit(a)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 transition-colors"
                              title="Edit Announcement"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setAnnouncementToDelete(a)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              title="Delete Announcement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                      {a.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {a.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate">{a.author_name || 'Executive Council'}</span>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {a.domain_name || 'Club-Wide'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <Modal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement.title}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Badge variant={getPriorityBadgeVariant(selectedAnnouncement.priority)}>
                {selectedAnnouncement.priority} Priority
              </Badge>
              {selectedAnnouncement.pinned && <Badge variant="amber">Pinned Circular</Badge>}
              <span className="text-xs text-slate-400 ml-auto">
                {new Date(selectedAnnouncement.created_at).toLocaleString()}
              </span>
            </div>

            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {selectedAnnouncement.content}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <div>
                Posted by: <strong>{selectedAnnouncement.author_name || 'Executive Council'}</strong>
              </div>
              <div>
                Target: <strong>{selectedAnnouncement.target_role || 'All Technologists'}</strong>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Broadcast Announcement"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              label="Announcement Subject"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule for TechnoHack 2026 Round 2 Submission"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Priority Level"
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High Priority' },
                  { value: 'Urgent', label: 'Urgent / Critical' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              />

              <Select
                label="Domain Scope"
                options={[
                  { value: '', label: 'Entire Club (All Domains)' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={domainId !== undefined ? domainId.toString() : ''}
                onChange={(e) => setDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Message Content
              </label>
              <textarea
                required
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full announcement circular, guidelines, or notice..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="pinCheckbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="pinCheckbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                Pin to top of bulletin board
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting} icon={Send}>
                Publish Notice
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Announcement Modal */}
      {showEditModal && editingAnnouncement && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAnnouncement(null);
          }}
          title="Edit Announcement"
          subtitle="Modify bulletin copy, scope, and priority level"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Announcement Subject"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Priority Level"
                options={[
                  { value: 'Normal', label: 'Normal' },
                  { value: 'High', label: 'High Priority' },
                  { value: 'Urgent', label: 'Urgent / Critical' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as any)}
              />

              <Select
                label="Domain Scope"
                options={[
                  { value: '', label: 'Entire Club (All Domains)' },
                  ...domains.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={editDomainId !== undefined ? editDomainId.toString() : ''}
                onChange={(e) => setEditDomainId(e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Message Content
              </label>
              <textarea
                required
                rows={4}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="editPinCheckbox"
                checked={editPinned}
                onChange={(e) => setEditPinned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="editPinCheckbox" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                Pin to top of bulletin board
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAnnouncement(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!announcementToDelete}
        title="Delete Announcement"
        message={`Are you sure you want to remove "${announcementToDelete?.title}" from the bulletin? This notice will no longer be visible to club members.`}
        confirmLabel="Delete Notice"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setAnnouncementToDelete(null)}
      />

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
    </div>
  );
};
