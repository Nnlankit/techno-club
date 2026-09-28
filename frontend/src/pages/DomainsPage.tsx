import React, { useState, useEffect } from 'react';
import { 
  Layers, Users, FolderGit2, CheckSquare, Calendar, Plus, 
  ArrowRight, ShieldCheck, Cpu, Globe, Shield, Cloud, Terminal, 
  Smartphone, Palette, Box, BookOpen, UserCheck
} from 'lucide-react';
import { api } from '../services/api';
import { Domain, Member } from '../types';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const DomainsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [domainMembers, setDomainMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366F1');

  useEffect(() => {
    loadDomains();
  }, []);

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

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.domains.create({
        name,
        code: code.toUpperCase(),
        description,
        color,
        is_active: true
      });
      setShowAddModal(false);
      setName('');
      setCode('');
      setDescription('');
      loadDomains();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create domain');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Specialized Technical Domains</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {domains.length} Active Hubs
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Core verticals driving technical specialization, research papers, project delivery, and workshops.
          </p>
        </div>

        {hasRole(['President', 'Vice President']) && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Domain</span>
          </button>
        )}
      </div>

      {/* Grid of Domains */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
            <p>Loading domain hubs...</p>
          </div>
        ) : (
          domains.map((d) => {
            const Icon = getDomainIcon(d.code);
            return (
              <div
                key={d.id}
                onClick={() => handleOpenDomainDetail(d)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-indigo-500/50 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: d.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {d.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {d.description || 'Specialized technology domain fostering research, engineering, and workshops.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500">
                    <span className="text-[11px] text-slate-400">Domain Head:</span>{' '}
                    <strong className="text-slate-700 dark:text-slate-200">{d.head_name || 'To Be Assigned'}</strong>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <strong>{d.members_count}</strong>
                    </span>
                    <span className="flex items-center">
                      <FolderGit2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <strong>{d.active_projects_count}</strong>
                    </span>
                    <span className="flex items-center">
                      <CheckSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <strong>{d.tasks_count}</strong>
                    </span>
                  </div>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                    <span>Hub</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Domain Detail Modal */}
      {selectedDomain && (
        <Modal
          isOpen={!!selectedDomain}
          onClose={() => setSelectedDomain(null)}
          title={`${selectedDomain.name} (${selectedDomain.code})`}
          subtitle="Domain Operations, Roster & Projects"
          maxWidth="3xl"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Domain Leadership</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedDomain.head_name ? `Lead: ${selectedDomain.head_name}` : 'Head: Position Open'}
                </p>
              </div>
              <div className="flex items-center space-x-4 text-center">
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Charter & Focus Areas</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedDomain.description}
              </p>
            </div>

            {/* Domain Members Roster */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Domain Roster ({domainMembers.length})</h4>
              {loadingMembers ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading roster...</div>
              ) : domainMembers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  No members currently registered under this domain.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {domainMembers.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3"
                    >
                      <img
                        src={m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.full_name}`}
                        alt={m.full_name}
                        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.full_name}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400 truncate">{m.role_title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              placeholder="e.g., Quantum Computing"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Badge Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-500">{color}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description & Charter
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Focus areas, research topics, target competencies..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              Establish Domain
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
