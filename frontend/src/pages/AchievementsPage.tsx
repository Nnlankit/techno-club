import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Star, Medal, Sparkles, Plus, 
  ExternalLink, Calendar, Search, Filter, ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Achievement, Member } from '../types';
import { Modal } from '../components/Modal';
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

  useEffect(() => {
    loadData();
  }, []);

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

  const filteredAchievements = achievements.filter(ach => {
    const matchCat = selectedCategory === 'All' || ach.category === selectedCategory;
    const matchSearch = ach.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ach.member_name && ach.member_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ach.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const featuredList = achievements.filter(a => a.is_featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Hall of Fame & Member Accolades</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              {achievements.length} Honors
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            National hackathon titles, inter-college coding medals, open source deployments, and leadership awards.
          </p>
        </div>
        {hasRole(['President', 'Vice President', 'Domain Head']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Award Accolade</span>
          </button>
        )}
      </div>

      {/* Featured Spotlight Carousel / Banner */}
      {featuredList.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border border-amber-300/40 dark:border-amber-800/50 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
              Featured Hall of Fame Spotlights
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredList.slice(0, 3).map((feat) => (
              <div
                key={feat.id}
                className="p-4 bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/60 rounded-xl shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {feat.category}
                  </span>
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {feat.title}
                </div>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {feat.member_name}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipient, competition..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Achievements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            Loading honors ledger...
          </div>
        ) : filteredAchievements.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 text-xs">
            No achievements recorded in this category.
          </div>
        ) : (
          filteredAchievements.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.category}
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                    <Medal className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {item.title}
                </h3>

                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {item.member_name}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                <span className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.achievement_date}</span>
                </span>

                {item.proof_url && (
                  <a
                    href={item.proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                  >
                    <span>Verification</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Award Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record Milestone / Award Accolade"
      >
        <form onSubmit={handleCreateAchievement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Recipient Member *
            </label>
            <select
              required
              value={memberId || ''}
              onChange={(e) => setMemberId(Number(e.target.value))}
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">Select Club Member...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.name} ({m.college_id}) - {m.domain_name || 'General Member'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Achievement Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 1st Place - Smart India Hackathon 2025"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Achievement
              </label>
              <input
                type="date"
                required
                value={achievementDate}
                onChange={(e) => setAchievementDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Highlights
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Awarded $2,000 cash prize for autonomous drone swarm navigation system."
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Proof URL / Certificate / Press Link
            </label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://sih.gov.in/winners/2025"
              className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="featureCheck"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="featureCheck" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Pin to Hall of Fame Featured Spotlight banner
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              Record Honor
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
