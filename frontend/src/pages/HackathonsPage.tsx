import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Award, Trophy, Users, Code2, ExternalLink, Plus, 
  CheckCircle2, Sparkles, Star, GitBranch, Video, Presentation,
  Flame, ChevronRight, UserCheck, Scale, FileText, Check,
  Edit3, Trash2, Archive
} from 'lucide-react';
import { api } from '../services/api';
import { 
  Hackathon, HackathonTeam, HackathonSubmission, 
  HackathonProblemStatement 
} from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  PageHeader, Card, Badge, Avatar, Button, Input, 
  Select, Table, Column, Tabs, Modal, EmptyState, 
  LoadingState, ErrorState, ConfirmationDialog, Toast
} from '../components/ui';

export const HackathonsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { id: paramHackId } = useParams<{ id?: string }>();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHack, setSelectedHack] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [leaderboard, setLeaderboard] = useState<HackathonSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Section 17 Tabs: Overview | Participants | Teams | Mentors | Submissions | Judges | Results
  const [activeTab, setActiveTab] = useState<
    'overview' | 'participants' | 'teams' | 'mentors' | 'submissions' | 'judges' | 'results'
  >('overview');

  // Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedSubmissionToScore, setSelectedSubmissionToScore] = useState<HackathonSubmission | null>(null);

  // Team Form
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [teammateNames, setTeammateNames] = useState('');
  const [registeringTeam, setRegisteringTeam] = useState(false);

  // Submission Form
  const [myTeamId, setMyTeamId] = useState<number | undefined>(undefined);
  const [subTitle, setSubTitle] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subProblemId, setSubProblemId] = useState('');
  const [subRepoUrl, setSubRepoUrl] = useState('');
  const [subDemoUrl, setSubDemoUrl] = useState('');
  const [subVideoUrl, setSubVideoUrl] = useState('');
  const [submittingProject, setSubmittingProject] = useState(false);

  // Judge Score Form
  const [scoreComplexity, setScoreComplexity] = useState(25);
  const [scoreInnovation, setScoreInnovation] = useState(20);
  const [scoreDemo, setScoreDemo] = useState(22);
  const [scorePresentation, setScorePresentation] = useState(18);
  const [judgeFeedback, setJudgeFeedback] = useState('');
  const [winnerCategory, setWinnerCategory] = useState('');
  const [scoring, setScoring] = useState(false);

  // Leadership check
  const canManage = hasRole(['Super Admin', 'President', 'Vice President']);

  // Create Hackathon State
  const [showCreateHackModal, setShowCreateHackModal] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createTagline, setCreateTagline] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createStartDate, setCreateStartDate] = useState('');
  const [createEndDate, setCreateEndDate] = useState('');
  const [createRegDeadline, setCreateRegDeadline] = useState('');
  const [createMinTeam, setCreateMinTeam] = useState(2);
  const [createMaxTeam, setCreateMaxTeam] = useState(4);
  const [createPrizePool, setCreatePrizePool] = useState(50000);
  const [createStatus, setCreateStatus] = useState('Upcoming');
  const [createRules, setCreateRules] = useState('');

  // Edit Hackathon State
  const [showEditHackModal, setShowEditHackModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editRegDeadline, setEditRegDeadline] = useState('');
  const [editMinTeam, setEditMinTeam] = useState(2);
  const [editMaxTeam, setEditMaxTeam] = useState(4);
  const [editPrizePool, setEditPrizePool] = useState(50000);
  const [editStatus, setEditStatus] = useState('Upcoming');
  const [editRules, setEditRules] = useState('');

  // Delete & Archive State
  const [hackToDelete, setHackToDelete] = useState<Hackathon | null>(null);
  const [hackToArchive, setHackToArchive] = useState<Hackathon | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  const fmtDate = (dStr?: string) => {
    if (!dStr) return '';
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
  };

  const handleOpenEditHackathon = () => {
    if (!selectedHack) return;
    setEditTitle(selectedHack.title);
    setEditTagline(selectedHack.tagline || '');
    setEditDescription(selectedHack.description || '');
    setEditStartDate(fmtDate(selectedHack.start_date));
    setEditEndDate(fmtDate(selectedHack.end_date));
    setEditRegDeadline(fmtDate(selectedHack.registration_deadline));
    setEditMinTeam(selectedHack.min_team_size);
    setEditMaxTeam(selectedHack.max_team_size);
    setEditPrizePool(selectedHack.prize_pool || 0);
    setEditStatus(selectedHack.status);
    setEditRules(selectedHack.rules || '');
    setShowEditHackModal(true);
  };

  const handleCreateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const now = new Date();
      const start = createStartDate ? new Date(createStartDate).toISOString() : now.toISOString();
      const end = createEndDate ? new Date(createEndDate).toISOString() : new Date(now.getTime() + 3 * 86400000).toISOString();
      const reg = createRegDeadline ? new Date(createRegDeadline).toISOString() : new Date(now.getTime() + 1 * 86400000).toISOString();

      const created = await api.hackathons.create({
        title: createTitle,
        tagline: createTagline,
        description: createDescription,
        start_date: start,
        end_date: end,
        registration_deadline: reg,
        min_team_size: Number(createMinTeam),
        max_team_size: Number(createMaxTeam),
        prize_pool: Number(createPrizePool),
        status: createStatus,
        rules: createRules,
      });

      setShowCreateHackModal(false);
      setToast({
        type: 'success',
        title: 'Hackathon Created',
        message: `"${created.title}" launched successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadHackathons();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.response?.data?.detail || 'Failed to create hackathon'
      });
    }
  };

  const handleUpdateHackathon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack) return;
    try {
      const updated = await api.hackathons.update(selectedHack.id, {
        title: editTitle,
        tagline: editTagline,
        description: editDescription,
        start_date: editStartDate ? new Date(editStartDate).toISOString() : undefined,
        end_date: editEndDate ? new Date(editEndDate).toISOString() : undefined,
        registration_deadline: editRegDeadline ? new Date(editRegDeadline).toISOString() : undefined,
        min_team_size: Number(editMinTeam),
        max_team_size: Number(editMaxTeam),
        prize_pool: Number(editPrizePool),
        status: editStatus,
        rules: editRules,
      });

      setShowEditHackModal(false);
      setSelectedHack(updated);
      setToast({
        type: 'success',
        title: 'Hackathon Updated',
        message: `"${updated.title}" updated successfully.`
      });
      setTimeout(() => setToast(null), 4000);
      loadHackathons();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.detail || 'Failed to update hackathon'
      });
    }
  };

  const handleArchiveHackathon = async () => {
    if (!hackToArchive) return;
    try {
      await api.hackathons.delete(hackToArchive.id, true);
      setToast({
        type: 'info',
        title: 'Hackathon Archived',
        message: `"${hackToArchive.title}" has been moved to archive.`
      });
      setTimeout(() => setToast(null), 4000);
      setHackToArchive(null);
      loadHackathons();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.response?.data?.detail || 'Failed to archive hackathon'
      });
    }
  };

  const handleDeleteHackathon = async () => {
    if (!hackToDelete) return;
    try {
      await api.hackathons.delete(hackToDelete.id, false);
      setToast({
        type: 'info',
        title: 'Hackathon Deleted',
        message: `"${hackToDelete.title}" was removed.`
      });
      setTimeout(() => setToast(null), 4000);
      setHackToDelete(null);
      loadHackathons();
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.response?.data?.detail || 'Failed to delete hackathon'
      });
    }
  };

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    setLoading(true);
    setError(false);
    try {
      const hacks = await api.hackathons.list();
      setHackathons(hacks);
      if (hacks.length > 0) {
        const target = paramHackId ? (hacks.find((h) => String(h.id) === paramHackId) || hacks[0]) : hacks[0];
        selectHackathon(target);
      }
    } catch (err) {
      console.error('Failed to load hackathons:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const selectHackathon = async (h: Hackathon) => {
    setSelectedHack(h);
    try {
      const [teamsData, lbData] = await Promise.all([
        api.hackathons.getTeams(h.id).catch(() => []),
        api.hackathons.getLeaderboard(h.id).catch(() => []),
      ]);
      setTeams(teamsData);
      setLeaderboard(lbData);
      if (teamsData.length > 0) {
        setMyTeamId(teamsData[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack) return;
    setRegisteringTeam(true);
    try {
      const teammates = teammateNames
        .split(',')
        .map((name) => ({ name: name.trim() }))
        .filter(Boolean);

      await api.hackathons.registerTeam(selectedHack.id, {
        name: teamName,
        leader_id: user?.member_id || 1,
        project_name: projectName,
        members_info: teammates,
      });
      setShowTeamModal(false);
      setTeamName('');
      setProjectName('');
      setTeammateNames('');
      selectHackathon(selectedHack);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Team registration failed');
    } finally {
      setRegisteringTeam(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack || !myTeamId) return;
    setSubmittingProject(true);
    try {
      await api.hackathons.submitProject(selectedHack.id, {
        team_id: myTeamId,
        project_title: subTitle,
        description: subDesc,
        problem_statement_id: subProblemId,
        repo_url: subRepoUrl,
        demo_url: subDemoUrl,
        video_url: subVideoUrl,
      });
      setShowSubmitModal(false);
      setSubTitle('');
      setSubDesc('');
      setSubRepoUrl('');
      setSubDemoUrl('');
      selectHackathon(selectedHack);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Project submission failed');
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleScoreSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack || !selectedSubmissionToScore) return;
    setScoring(true);
    try {
      const total =
        Number(scoreComplexity) +
        Number(scoreInnovation) +
        Number(scoreDemo) +
        Number(scorePresentation);

      await api.hackathons.scoreSubmission(selectedHack.id, selectedSubmissionToScore.id, {
        scores: [
          { criteria: 'Technical Complexity', score: Number(scoreComplexity), max: 30 },
          { criteria: 'Innovation & Impact', score: Number(scoreInnovation), max: 25 },
          { criteria: 'Live Execution & Demo', score: Number(scoreDemo), max: 25 },
          { criteria: 'Pitch & Presentation', score: Number(scorePresentation), max: 20 },
        ],
        total_score: total,
        winner_category: winnerCategory || undefined,
        judge_feedback: judgeFeedback,
      });
      setShowScoreModal(false);
      setSelectedSubmissionToScore(null);
      selectHackathon(selectedHack);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Scoring submission failed');
    } finally {
      setScoring(false);
    }
  };

  if (loading) return <LoadingState type="skeleton" />;
  if (error || !selectedHack) return <ErrorState onRetry={loadHackathons} />;

  return (
    <div className="space-y-6">
      {/* Hackathon Workspace Header (Section 17) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                {hackathons.length > 1 ? (
                  <select
                    value={selectedHack.id}
                    onChange={(e) => {
                      const h = hackathons.find((x) => x.id === Number(e.target.value));
                      if (h) selectHackathon(h);
                    }}
                    className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none cursor-pointer pr-4"
                  >
                    {hackathons.map((h) => (
                      <option key={h.id} value={h.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm">
                        {h.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {selectedHack.title}
                  </h1>
                )}
                <Badge status={selectedHack.status} size="xs" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(selectedHack.start_date).toLocaleDateString()} – {new Date(selectedHack.end_date).toLocaleDateString()} • {selectedHack.teams_count} Teams • {selectedHack.submissions_count} Submissions
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canManage && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowCreateHackModal(true)}
                >
                  Create Hackathon
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Edit3}
                  onClick={handleOpenEditHackathon}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Archive}
                  onClick={() => setHackToArchive(selectedHack)}
                >
                  Archive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setHackToDelete(selectedHack)}
                >
                  Delete
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={Users}
              onClick={() => setShowTeamModal(true)}
            >
              Register Team
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Code2}
              onClick={() => setShowSubmitModal(true)}
            >
              Submit Project
            </Button>
          </div>
        </div>

        {/* Section 17 Tabs: Overview | Participants | Teams | Mentors | Submissions | Judges | Results */}
        <div className="pt-2">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'participants', label: 'Participants', count: teams.reduce((acc, t) => acc + (t.members_info?.length || 0) + 1, 0) },
              { id: 'teams', label: 'Teams', count: teams.length },
              { id: 'mentors', label: 'Mentors', count: selectedHack.mentors?.length || 4 },
              { id: 'submissions', label: 'Submissions', count: selectedHack.submissions_count },
              { id: 'judges', label: 'Judges', count: selectedHack.judges?.length || 3 },
              { id: 'results', label: 'Results & Standings' },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Hackathon Problem Statements">
              <div className="space-y-3">
                {selectedHack.problem_statements?.map((ps) => (
                  <div key={ps.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{ps.title}</span>
                      <Badge variant="blue" size="xs">{ps.domain}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{ps.description}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Rules & Guidelines">
              <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                {selectedHack.rules || '1. Teams must consist of 2 to 4 registered college students.\n2. All code must be authored during the 36-hour hackathon window.\n3. Open-source libraries are permitted; proprietary campus systems require disclosure.'}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Prizes & Bounty Pool" icon={Trophy}>
              <div className="space-y-3">
                {selectedHack.prizes?.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{p.title}</div>
                      {p.perks && <div className="text-[10px] text-slate-400">{p.perks}</div>}
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{p.cash.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Eligibility & Deadline">
              <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400">Team Size</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{selectedHack.min_team_size} – {selectedHack.max_team_size} Members</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-400">Deadline</dt>
                  <dd className="font-semibold text-slate-800 dark:text-slate-200">{new Date(selectedHack.registration_deadline).toLocaleDateString()}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Participants */}
      {activeTab === 'participants' && (
        <Card title="Registered Hackers & Technologists">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {teams.flatMap(t => [
              { name: t.leader_name || 'Team Leader', role: 'Team Leader', team: t.name },
              ...(t.members_info || []).map(m => ({ name: m.name, role: m.role || 'Hacker', team: t.name }))
            ]).map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">Team: <strong>{p.team}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 3: Teams */}
      {activeTab === 'teams' && (
        <Card title="Registered Teams" subtitle={`${teams.length} teams participating`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</span>
                  <Badge variant={t.has_submission ? 'emerald' : 'amber'} size="xs">
                    {t.has_submission ? 'Submitted' : 'Building'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Project: {t.project_name || 'Developing solution'}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Leader: <strong>{t.leader_name || 'Assigned'}</strong></span>
                  <span>Code: <code className="font-mono">{t.team_code}</code></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Mentors */}
      {activeTab === 'mentors' && (
        <Card title="Assigned Industry Mentors & Domain Advisors">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {(selectedHack.mentors?.length ? selectedHack.mentors : [
              { name: 'Dr. Ramesh Nair', expertise: 'Machine Learning & AI' },
              { name: 'Siddharth Roy', expertise: 'Distributed Systems & Cloud' },
              { name: 'Ananya Deshmukh', expertise: 'Cybersecurity & Cryptography' },
              { name: 'Kavita Menon', expertise: 'Fullstack & UI/UX' },
            ]).map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-center space-y-2">
                <Avatar name={m.name} size="md" className="mx-auto" />
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{m.name}</h4>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">{m.expertise}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Submissions */}
      {activeTab === 'submissions' && (
        <Card title="Submitted Hackathon Projects" subtitle="Artifacts, repositories, and pitch decks">
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No submissions received yet. Projects are being built by teams!
              </div>
            ) : (
              leaderboard.map((sub) => (
                <div key={sub.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{sub.project_title}</span>
                      <span className="text-xs text-slate-400">• Team: {sub.team_name}</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{sub.description}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {sub.repo_url && (
                      <a href={sub.repo_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="xs" icon={GitBranch}>Code</Button>
                      </a>
                    )}
                    {sub.demo_url && (
                      <a href={sub.demo_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="xs" icon={ExternalLink}>Demo</Button>
                      </a>
                    )}
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() => {
                        setSelectedSubmissionToScore(sub);
                        setShowScoreModal(true);
                      }}
                    >
                      Judge & Score
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Tab 6: Judges */}
      {activeTab === 'judges' && (
        <Card title="Evaluation Panel & Rubric">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Honorable Judges</h4>
              <div className="space-y-2.5">
                {(selectedHack.judges?.length ? selectedHack.judges : [
                  { name: 'Prof. Alok Gupta', org: 'Department of Computing' },
                  { name: 'Megha Sharma', org: 'Engineering Director, Target' },
                  { name: 'Rajeev Varma', org: 'Chief Architect, Tech Mahindra' },
                ]).map((j, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center space-x-3">
                    <Avatar name={j.name} size="sm" />
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">{j.name}</div>
                      <div className="text-[11px] text-slate-400">{j.org}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Evaluation Rubric</h4>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between">
                  <span>Technical Complexity</span>
                  <strong className="text-blue-600">30%</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between">
                  <span>Innovation & Impact</span>
                  <strong className="text-blue-600">25%</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between">
                  <span>Live Execution & Demo</span>
                  <strong className="text-blue-600">25%</strong>
                </div>
                <div className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between">
                  <span>Pitch & Presentation</span>
                  <strong className="text-blue-600">20%</strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 7: Results & Leaderboard */}
      {activeTab === 'results' && (
        <Card title="Official Leaderboard & Winners" subtitle="Evaluated based on jury scorecards">
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Evaluation currently in progress. Final rankings will appear once all scorecards are settled.
              </div>
            ) : (
              leaderboard.map((sub, idx) => (
                <div
                  key={sub.id}
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    idx === 0
                      ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3.5">
                    <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{sub.project_title}</span>
                        {sub.winner_category && <Badge variant="amber" size="xs">{sub.winner_category}</Badge>}
                      </div>
                      <div className="text-xs text-slate-400">Team: {sub.team_name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-base text-slate-900 dark:text-white">{sub.total_score} pts</div>
                    <span className="text-[10px] text-emerald-600 font-semibold">Verified</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Register Team Modal */}
      {showTeamModal && (
        <Modal
          isOpen={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          title="Register Hackathon Team"
        >
          <form onSubmit={handleRegisterTeam} className="space-y-4">
            <Input
              label="Team Name"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Neural Ninjas"
            />
            <Input
              label="Proposed Solution Title"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Autonomous Drone Defect Detection"
            />
            <Input
              label="Teammate Names (comma separated)"
              value={teammateNames}
              onChange={(e) => setTeammateNames(e.target.value)}
              placeholder="Priya Verma, Aditya Singh, Rahul Sharma"
            />
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowTeamModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={registeringTeam}>
                Register Team
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit Project Modal */}
      {showSubmitModal && (
        <Modal
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          title="Submit Hackathon Project"
        >
          <form onSubmit={handleSubmitProject} className="space-y-4">
            <Input
              label="Project Title"
              required
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="e.g. EdgeAI: Low-latency inference platform"
            />
            <Input
              label="GitHub Repository Link"
              required
              value={subRepoUrl}
              onChange={(e) => setSubRepoUrl(e.target.value)}
              placeholder="https://github.com/..."
            />
            <Input
              label="Demo URL / Pitch Deck"
              value={subDemoUrl}
              onChange={(e) => setSubDemoUrl(e.target.value)}
              placeholder="https://..."
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Solution Description
              </label>
              <textarea
                rows={3}
                required
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
                placeholder="Explain the problem statement addressed and technical architecture..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowSubmitModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={submittingProject}>
                Submit Project
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Score Submission Modal */}
      {showScoreModal && selectedSubmissionToScore && (
        <Modal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
          title={`Score Submission • ${selectedSubmissionToScore.project_title}`}
        >
          <form onSubmit={handleScoreSubmission} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Complexity (Max 30)"
                type="number"
                min={0}
                max={30}
                required
                value={scoreComplexity}
                onChange={(e) => setScoreComplexity(Number(e.target.value))}
              />
              <Input
                label="Innovation (Max 25)"
                type="number"
                min={0}
                max={25}
                required
                value={scoreInnovation}
                onChange={(e) => setScoreInnovation(Number(e.target.value))}
              />
              <Input
                label="Demo & Execution (Max 25)"
                type="number"
                min={0}
                max={25}
                required
                value={scoreDemo}
                onChange={(e) => setScoreDemo(Number(e.target.value))}
              />
              <Input
                label="Presentation (Max 20)"
                type="number"
                min={0}
                max={20}
                required
                value={scorePresentation}
                onChange={(e) => setScorePresentation(Number(e.target.value))}
              />
            </div>

            <Input
              label="Award / Winner Category (Optional)"
              value={winnerCategory}
              onChange={(e) => setWinnerCategory(e.target.value)}
              placeholder="e.g. 1st Place Winner or Best Innovation"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jury Feedback & Critique
              </label>
              <textarea
                rows={3}
                value={judgeFeedback}
                onChange={(e) => setJudgeFeedback(e.target.value)}
                placeholder="Provide constructive feedback for the student developers..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowScoreModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={scoring}>
                Submit Scorecard
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Hackathon Modal */}
      {showCreateHackModal && (
        <Modal
          isOpen={showCreateHackModal}
          onClose={() => setShowCreateHackModal(false)}
          title="Establish New Techno Club Hackathon"
          subtitle="Configure flagship sprint event, problem themes, and bounty pools"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateHackathon} className="space-y-4">
            <Input
              label="Hackathon Title"
              required
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="e.g. TechnoHack 2026: Quantum & Web3 Edition"
            />

            <Input
              label="Tagline / Theme"
              value={createTagline}
              onChange={(e) => setCreateTagline(e.target.value)}
              placeholder="e.g. 36 Hours of Autonomous Code & Breakthrough Innovation"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={createStartDate}
                onChange={(e) => setCreateStartDate(e.target.value)}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={createEndDate}
                onChange={(e) => setCreateEndDate(e.target.value)}
              />
              <Input
                label="Registration Deadline"
                type="datetime-local"
                value={createRegDeadline}
                onChange={(e) => setCreateRegDeadline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Min Team Size"
                type="number"
                min={1}
                max={10}
                required
                value={createMinTeam}
                onChange={(e) => setCreateMinTeam(Number(e.target.value))}
              />
              <Input
                label="Max Team Size"
                type="number"
                min={1}
                max={10}
                required
                value={createMaxTeam}
                onChange={(e) => setCreateMaxTeam(Number(e.target.value))}
              />
              <Input
                label="Prize Pool (₹)"
                type="number"
                required
                value={createPrizePool}
                onChange={(e) => setCreatePrizePool(Number(e.target.value))}
              />
              <Select
                label="Initial Status"
                options={[
                  { value: 'Upcoming', label: 'Upcoming' },
                  { value: 'Registration Open', label: 'Registration Open' },
                  { value: 'Draft', label: 'Draft' },
                ]}
                value={createStatus}
                onChange={(e) => setCreateStatus(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description & Objectives
              </label>
              <textarea
                rows={3}
                required
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Highlight track details, student eligibility, technical domains involved..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rules & Code of Conduct
              </label>
              <textarea
                rows={3}
                value={createRules}
                onChange={(e) => setCreateRules(e.target.value)}
                placeholder="Rules regarding original code, libraries allowed, check-in milestones..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowCreateHackModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Launch Hackathon
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Hackathon Modal */}
      {showEditHackModal && selectedHack && (
        <Modal
          isOpen={showEditHackModal}
          onClose={() => setShowEditHackModal(false)}
          title={`Edit Hackathon: ${selectedHack.title}`}
          subtitle="Update hackathon schedule, bounty pool, rules, and lifecycle status"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateHackathon} className="space-y-4">
            <Input
              label="Hackathon Title"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            <Input
              label="Tagline / Theme"
              value={editTagline}
              onChange={(e) => setEditTagline(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Start Date & Time"
                type="datetime-local"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
              <Input
                label="End Date & Time"
                type="datetime-local"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
              <Input
                label="Registration Deadline"
                type="datetime-local"
                value={editRegDeadline}
                onChange={(e) => setEditRegDeadline(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Input
                label="Min Team Size"
                type="number"
                min={1}
                max={10}
                required
                value={editMinTeam}
                onChange={(e) => setEditMinTeam(Number(e.target.value))}
              />
              <Input
                label="Max Team Size"
                type="number"
                min={1}
                max={10}
                required
                value={editMaxTeam}
                onChange={(e) => setEditMaxTeam(Number(e.target.value))}
              />
              <Input
                label="Prize Pool (₹)"
                type="number"
                required
                value={editPrizePool}
                onChange={(e) => setEditPrizePool(Number(e.target.value))}
              />
              <Select
                label="Hackathon Status"
                options={[
                  { value: 'Draft', label: 'Draft' },
                  { value: 'Upcoming', label: 'Upcoming' },
                  { value: 'Registration Open', label: 'Registration Open' },
                  { value: 'Registration Closed', label: 'Registration Closed' },
                  { value: 'Ongoing', label: 'Ongoing' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Archived', label: 'Archived' },
                ]}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Detailed Description & Objectives
              </label>
              <textarea
                rows={3}
                required
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Rules & Code of Conduct
              </label>
              <textarea
                rows={3}
                value={editRules}
                onChange={(e) => setEditRules(e.target.value)}
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
              <Button variant="outline" size="sm" type="button" onClick={() => setShowEditHackModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!hackToArchive}
        title="Archive Hackathon"
        message={`Are you sure you want to archive "${hackToArchive?.title}"? Submissions, team code, and jury scorecards will be permanently preserved in the archives.`}
        confirmLabel="Archive Hackathon"
        onConfirm={handleArchiveHackathon}
        onCancel={() => setHackToArchive(null)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!hackToDelete}
        title="Delete Hackathon"
        message={`Are you sure you want to delete "${hackToDelete?.title}"? Hackathons with registered teams or submissions should ideally be archived rather than deleted.`}
        confirmLabel="Delete Hackathon"
        confirmVariant="danger"
        onConfirm={handleDeleteHackathon}
        onCancel={() => setHackToDelete(null)}
      />

      {/* Toast Notification */}
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
