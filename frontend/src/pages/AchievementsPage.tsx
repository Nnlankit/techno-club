import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Star, Medal, Sparkles, Plus, 
  ExternalLink, Calendar, Search, Filter, ShieldCheck,
  Edit3, Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { Achievement, Member } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card, Avatar,
  ConfirmationDialog, Toast
} from '../components/ui';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Hackathon Winner',
  'Competition Award',
  'Research Publication',
  'Project Deployment',
  'Leadership & Mentorship',
  'Community Service'
];

export const AchievementsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Award Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberId, setMemberId] = useState<number | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Hackathon Winner');
  const [description, setDescription] = useState('');
  const [badgeIcon, setBadgeIcon] = useState('Trophy');
  const [achievementDate, setAchievementDate] = useState(new Date().toISOString().split('T')[0]);
  const [proofUrl, setProofUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(true);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [editMemberId, setEditMemberId] = useState<number | undefined>(undefined);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('Hackathon Winner');
  const [editDescription, setEditDescription] = useState('');
  const [editBadgeIcon, setBadgeIconEdit] = useState('Trophy');
  const [editAchievementDate, setEditAchievementDate] = useState(new Date().toISOString().split('T')[0]);
  const [editProofUrl, setEditProofUrl] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(true);

  // Delete State
  const [achievementToDelete, setAchievementToDelete] = useState<Achievement | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [achData, memData] = await Promise.all([
        api.achievements.list(),
        api.members.list()
      ]);
      setAchievements(achData);
      setMembers(memData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      alert('Please select a member to award');
      return;
    }

    try {
      await api.achievements.create({
        member_id: memberId,
        title,
        category,
        description,
        badge_icon: badgeIcon,
        achievement_date: achievementDate,
        proof_url: proofUrl,
        is_featured: isFeatured
      });
      setShowAddModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to award achievement');
    }
  };

  const resetForm = () => {
    setMemberId(undefined);
    setTitle('');
    setCategory('Hackathon Winner');
    setDescription('');
    setBadgeIcon('Trophy');
    setAchievementDate(new Date().toISOString().split('T')[0]);
    setProofUrl('');
    setIsFeatured(true);
  };

  const handleOpenEdit = (ach: Achievement) => {
    setEditingAchievement(ach);
    setEditMemberId(ach.member_id);
    setEditTitle(ach.title);
    setEditCategory(ach.category);
    setEditDescription(ach.description || '');
    setBadgeIconEdit(ach.badge_icon || 'Trophy');
    setEditAchievementDate(ach.achievement_date ? new Date(ach.achievement_date).toISOString().split('T')[0] : '');
    setEditProofUrl(ach.proof_url || '');
    setEditIsFeatured(ach.is_featured);
    setShowEditModal(true);
  };

  const handleUpdateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAchievement || !editMemberId) return;
    try {
      await api.achievements.update(editingAchievement.id, {
        member_id: editMemberId,
        title: editTitle,
        category: editCategory,
        description: editDescription,
        badge_icon: editBadgeIcon,
        achievement_date: editAchievementDate,
        proof_url: editProofUrl,
        is_featured: editIsFeatured,
      });
      setShowEditModal(false);
      setEditingAchievement(null);
      setToast({ message: `Accolade "${editTitle}" updated successfully`, type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to update accolade', type: 'error' });
    }
  };

  const handleDeleteAchievement = async () => {
    if (!achievementToDelete) return;
    try {
      await api.achievements.delete(achievementToDelete.id);
      setShowDeleteDialog(false);
      setToast({ message: `Accolade "${achievementToDelete.title}" removed successfully`, type: 'success' });
      setAchievementToDelete(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.response?.data?.detail || 'Failed to delete accolade', type: 'error' });
    }
  };

  const filteredAchievements = achievements.filter(ach => {
    const matchCat = selectedCategory === 'All' || ach.category === selectedCategory;
    const matchSearch = ach.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ach.member_name && ach.member_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ach.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredList = achievements.filter(a => a.is_featured);
  const canAward = hasRole(['President', 'Vice President', 'Domain Head']);

  return (
    <div className="space-y-6">
      {/* Section 9 Page Header */}
      <PageHeader
        title="Achievements"
        description="National hackathon titles, inter-college coding medals, open source deployments, and student accolades."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search honors by recipient, competition title...'
        }}
        filterProps={{
          filters: [
            {
              key: 'category',
              label: 'Category',
              value: selectedCategory,
              onChange: setSelectedCategory,
              options: CATEGORIES.map(c => ({ label: c, value: c }))
            }
          ]
        }}
        primaryAction={
          canAward
            ? {
                label: 'Award Accolade',
                icon: <Plus className="w-4 h-4" />,
                onClick: () => setShowAddModal(true)
              }
            : undefined
        }
      />

      {/* Featured Spotlight Section */}
      {featuredList.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-amber-500/10 border border-blue-200/50 dark:border-blue-900/50 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Featured Hall of Fame Spotlights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredList.slice(0, 3).map((feat) => (
              <Card
                key={feat.id}
                className="p-4 bg-white/95 dark:bg-slate-900/95 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    {feat.category}
                  </span>
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {feat.description}
                </p>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Avatar name={feat.member_name || 'Member'} size="xs" />
                    <strong className="text-slate-800 dark:text-slate-200">{feat.member_name}</strong>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400 text-[11px] font-mono mr-1">
                      {new Date(feat.achievement_date).toLocaleDateString()}
                    </span>
                    {canAward && (
                      <div className="flex items-center space-x-0.5">
                        <button
                          onClick={() => handleOpenEdit(feat)}
                          title="Edit Accolade"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setAchievementToDelete(feat);
                            setShowDeleteDialog(true);
                          }}
                          title="Delete Accolade"
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <LoadingState message="Loading member honors and hall of fame..." />
      ) : filteredAchievements.length === 0 ? (
        <EmptyState
          title="No Accolades Found"
          description="No awards match your search. Add a new achievement to recognize outstanding student contributions."
          action={
            canAward
              ? {
                  label: 'Award Accolade',
                  icon: <Plus className="w-4 h-4" />,
                  onClick: () => setShowAddModal(true)
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAchievements.map((ach) => (
            <Card
              key={ach.id}
              className="p-5 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all flex flex-col justify-between shadow-xs space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                    {ach.category}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {ach.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {ach.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <Avatar name={ach.member_name || 'Member'} size="xs" />
                    <strong className="text-slate-800 dark:text-slate-200">{ach.member_name}</strong>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(ach.achievement_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {ach.proof_url ? (
                  <a
                    href={ach.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    <span>View Evidence</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                ) : <div />}

                {canAward && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(ach)}
                      title="Edit Accolade"
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setAchievementToDelete(ach);
                        setShowDeleteDialog(true);
                      }}
                      title="Delete Accolade"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Award Accolade Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Bestow Club Accolade / Honor"
        subtitle="Recognizes member technical excellence, hackathon wins, or major releases"
        maxWidth="md"
      >
        <form onSubmit={handleCreateAchievement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Member
            </label>
            <select
              required
              value={memberId || ''}
              onChange={(e) => setMemberId(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select recipient member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.full_name} ({m.domain_name || 'Member'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Honor Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 1st Place - Smart India Hackathon 2026"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date Awarded
              </label>
              <input
                type="date"
                required
                value={achievementDate}
                onChange={(e) => setAchievementDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Achievement Summary
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project delivered, competition scale, prize money, or contribution scope..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proof / Press Release / Repository Link (Optional)
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Pin as Featured Hall of Fame Spotlight</span>
            </label>
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
              Bestow Honor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Accolade Modal */}
      {editingAchievement && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingAchievement(null);
          }}
          title={`Edit Accolade: ${editingAchievement.title}`}
          subtitle="Update recipient, achievement details, date, or spotlight status"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateAchievement} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Member
              </label>
              <select
                required
                value={editMemberId || ''}
                onChange={(e) => setEditMemberId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select recipient member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.full_name} ({m.domain_name || 'Member'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Honor Title
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date Awarded
                </label>
                <input
                  type="date"
                  required
                  value={editAchievementDate}
                  onChange={(e) => setEditAchievementDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Achievement Summary
              </label>
              <textarea
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Proof / Press Release / Repository Link (Optional)
              </label>
              <input
                type="url"
                value={editProofUrl}
                onChange={(e) => setEditProofUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsFeatured}
                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Pin as Featured Hall of Fame Spotlight</span>
              </label>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAchievement(null);
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Accolade"
        message={`Are you sure you want to delete accolade "${achievementToDelete?.title}" for ${achievementToDelete?.member_name}? This action cannot be undone.`}
        confirmLabel="Delete Accolade"
        confirmVariant="danger"
        onConfirm={handleDeleteAchievement}
        onCancel={() => {
          setShowDeleteDialog(false);
          setAchievementToDelete(null);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
