import React, { useState, useEffect } from 'react';
import { 
  Award, Trophy, Users, Code2, ExternalLink, Plus, 
  CheckCircle2, Sparkles, Star, GitBranch, Video, Presentation,
  Flame, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { 
  Hackathon, HackathonTeam, HackathonSubmission, 
  HackathonProblemStatement 
} from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';

export const HackathonsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [selectedHack, setSelectedHack] = useState<Hackathon | null>(null);
  const [teams, setTeams] = useState<HackathonTeam[]>([]);
  const [leaderboard, setLeaderboard] = useState<HackathonSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'problems' | 'teams' | 'submissions' | 'leaderboard'>('problems');

  // Modals
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedSubmissionToScore, setSelectedSubmissionToScore] = useState<HackathonSubmission | null>(null);

  // Team Form
  const [teamName, setTeamName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [teammateNames, setTeammateNames] = useState('');

  // Submission Form
  const [myTeamId, setMyTeamId] = useState<number | undefined>(undefined);
  const [subTitle, setSubTitle] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subProblemId, setSubProblemId] = useState('');
  const [subRepoUrl, setSubRepoUrl] = useState('');
  const [subDemoUrl, setSubDemoUrl] = useState('');
  const [subVideoUrl, setSubVideoUrl] = useState('');

  // Judge Score Form
  const [scoreComplexity, setScoreComplexity] = useState(25);
  const [scoreInnovation, setScoreInnovation] = useState(20);
  const [scoreDemo, setScoreDemo] = useState(22);
  const [scorePresentation, setScorePresentation] = useState(18);
  const [judgeFeedback, setJudgeFeedback] = useState('');
  const [winnerCategory, setWinnerCategory] = useState('');

  useEffect(() => {
    loadHackathons();
  }, []);

  const loadHackathons = async () => {
    setLoading(true);
    try {
      const hacks = await api.hackathons.list();
      setHackathons(hacks);
      if (hacks.length > 0) {
        selectHackathon(hacks[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectHackathon = async (h: Hackathon) => {
    setSelectedHack(h);
    try {
      const [teamsData, lbData] = await Promise.all([
        api.hackathons.getTeams(h.id),
        api.hackathons.getLeaderboard(h.id)
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
    try {
      const teammates = teammateNames.split(',').map(name => ({ name: name.trim() })).filter(Boolean);
      await api.hackathons.registerTeam(selectedHack.id, {
        name: teamName,
        leader_id: user?.member_id || 1,
        project_name: projectName,
        members_info: teammates
      });
      setShowTeamModal(false);
      setTeamName('');
      setProjectName('');
      setTeammateNames('');
      selectHackathon(selectedHack);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Team registration failed');
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack || !myTeamId) return;
    try {
      await api.hackathons.submitProject(selectedHack.id, {
        team_id: myTeamId,
        project_title: subTitle,
        description: subDesc,
        problem_statement_id: subProblemId,
        repo_url: subRepoUrl,
        demo_url: subDemoUrl,
        video_url: subVideoUrl
      });
      setShowSubmitModal(false);
      selectHackathon(selectedHack);
      setActiveTab('leaderboard');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Project submission failed');
    }
  };

  const handleScoreSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHack || !selectedSubmissionToScore) return;
    const total = scoreComplexity + scoreInnovation + scoreDemo + scorePresentation;
    const scores = [
      { criteria: 'Technical Complexity', score: scoreComplexity, max: 30 },
      { criteria: 'Innovation', score: scoreInnovation, max: 25 },
      { criteria: 'Working Demo', score: scoreDemo, max: 25 },
      { criteria: 'Presentation', score: scorePresentation, max: 20 },
    ];
    try {
      await api.hackathons.scoreSubmission(selectedHack.id, selectedSubmissionToScore.id, {
        scores,
        total_score: total,
        rank: 1,
        winner_category: winnerCategory || undefined,
        judge_feedback: judgeFeedback
      });
      setShowScoreModal(false);
      selectHackathon(selectedHack);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Scoring failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-8 overflow-hidden shadow-xl border border-indigo-800">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md">
              Flagship Hackathon Engine
            </span>
            {selectedHack && <StatusBadge status={selectedHack.status} />}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            {selectedHack?.title || 'TechnoHacks 2026: National Hackathon'}
          </h1>
          <p className="mt-2 text-indigo-200 text-sm leading-relaxed">
            Theme: <strong className="text-white">{selectedHack?.theme}</strong> • 36-hour sprint creating production-ready autonomous agents, decentralized apps, and smart telemetry.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowTeamModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-900 shadow-lg hover:bg-indigo-50 transition-colors flex items-center space-x-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Register Team</span>
            </button>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/40 hover:bg-indigo-500/60 border border-white/20 text-white transition-colors flex items-center space-x-1.5"
            >
              <Code2 className="w-4 h-4" />
              <span>Submit Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex items-center space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('problems')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'problems'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Problem Statements ({selectedHack?.problem_statements.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Teams ({teams.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'leaderboard'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Live Leaderboard & Winners</span>
        </button>
      </div>

      {/* TAB 1: Problem Statements */}
      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {selectedHack?.problem_statements.map((ps) => (
            <div
              key={ps.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {ps.id}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {ps.domain}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {ps.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  {ps.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Open for all teams</span>
                <button
                  onClick={() => {
                    setSubProblemId(ps.id);
                    setShowSubmitModal(true);
                  }}
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Solve Statement
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Registered Teams */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Teams Roster</h3>
            <button
              onClick={() => setShowTeamModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
            >
              + Register Team
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3">Team Name</th>
                <th className="p-3">Join Code</th>
                <th className="p-3">Team Lead</th>
                <th className="p-3">Members</th>
                <th className="p-3">Submission Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teams.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{t.name}</td>
                  <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{t.team_code}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{t.leader_name || 'Leader'}</td>
                  <td className="p-3 text-slate-500">
                    {t.members_info?.map((m: any, idx: number) => m.name).join(', ') || 'Lead only'}
                  </td>
                  <td className="p-3">
                    <StatusBadge status={t.has_submission ? 'Submitted' : 'Registered'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Leaderboard & Winners */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Evaluated Submissions Leaderboard</h3>
                <p className="text-[11px] text-slate-400">Ranked by weighted jury marks across complexity, innovation, working demo, and presentation</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No submissions evaluated yet. Submissions open until the deadline.
                </div>
              ) : (
                leaderboard.map((sub, idx) => (
                  <div key={sub.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950 shadow-amber-500/20'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-900'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">{sub.project_title}</h4>
                            {sub.winner_category && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center space-x-1">
                                <Trophy className="w-3 h-3 mr-1 text-amber-600" />
                                {sub.winner_category}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                            Team: {sub.team_name} • Problem Statement: {sub.problem_statement_id || 'General'}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            {sub.description}
                          </p>

                          {/* Demo & Repo links */}
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {sub.repo_url && (
                              <a
                                href={sub.repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg"
                              >
                                <GitBranch className="w-3.5 h-3.5 mr-1" />
                                Repository
                              </a>
                            )}
                            {sub.demo_url && (
                              <a
                                href={sub.demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-xs text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg"
                              >
                                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                Live Demo
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Score summary & Evaluate button */}
                      <div className="text-right shrink-0">
                        <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {sub.total_score}
                          <span className="text-xs text-slate-400 font-normal"> / 100</span>
                        </div>
                        {hasRole(['President', 'Vice President', 'Domain Head', 'Faculty Coordinator']) && (
                          <button
                            onClick={() => {
                              setSelectedSubmissionToScore(sub);
                              setShowScoreModal(true);
                            }}
                            className="mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                          >
                            Judge Scoring
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Judge feedback */}
                    {sub.judge_feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        <strong>Jury Feedback:</strong> {sub.judge_feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Team Registration */}
      <Modal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title="Form & Register Hackathon Team"
        subtitle="Generates unique team code for members to join"
        maxWidth="md"
      >
        <form onSubmit={handleRegisterTeam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., CodeWarriors"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Concept / Title
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Autonomous Disaster Response Mesh"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Teammate Names (comma separated)
            </label>
            <input
              type="text"
              value={teammateNames}
              onChange={(e) => setTeammateNames(e.target.value)}
              placeholder="e.g., Sneha Kulkarni, Devansh Gupta"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowTeamModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Register Team
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Project Submission */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Hackathon Project"
        subtitle="Deliver your repo, live demo, and presentation for evaluation"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Project Title
            </label>
            <input
              type="text"
              required
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              placeholder="e.g., NeuralPulse: Edge Diagnostics Copilot"
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Submitting Team
              </label>
              <select
                value={myTeamId}
                onChange={(e) => setMyTeamId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Problem Statement ID
              </label>
              <input
                type="text"
                value={subProblemId}
                onChange={(e) => setSubProblemId(e.target.value)}
                placeholder="e.g., PS-02"
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Executive Abstract & Architecture
            </label>
            <textarea
              rows={3}
              required
              value={subDesc}
              onChange={(e) => setSubDesc(e.target.value)}
              placeholder="Summarize key features, tech stack used, and how it solves the problem..."
              className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                required
                value={subRepoUrl}
                onChange={(e) => setSubRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Live Demo URL
              </label>
              <input
                type="url"
                value={subDemoUrl}
                onChange={(e) => setSubDemoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Submit Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Judge Evaluation Scoring */}
      {showScoreModal && selectedSubmissionToScore && (
        <Modal
          isOpen={showScoreModal}
          onClose={() => setShowScoreModal(false)}
          title={`Judge Scoring: ${selectedSubmissionToScore.project_title}`}
          subtitle={`Team: ${selectedSubmissionToScore.team_name}`}
          maxWidth="md"
        >
          <form onSubmit={handleScoreSubmission} className="space-y-4">
            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Technical Complexity (max 30)</span>
                  <span className="font-bold text-indigo-600">{scoreComplexity}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={scoreComplexity}
                  onChange={(e) => setScoreComplexity(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Innovation & Originality (max 25)</span>
                  <span className="font-bold text-indigo-600">{scoreInnovation}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={scoreInnovation}
                  onChange={(e) => setScoreInnovation(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Working Execution & Demo (max 25)</span>
                  <span className="font-bold text-indigo-600">{scoreDemo}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={scoreDemo}
                  onChange={(e) => setScoreDemo(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Presentation & UI/UX (max 20)</span>
                  <span className="font-bold text-indigo-600">{scorePresentation}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={scorePresentation}
                  onChange={(e) => setScorePresentation(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
                <span>Calculated Total:</span>
                <span className="text-indigo-600">{scoreComplexity + scoreInnovation + scoreDemo + scorePresentation} / 100</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Designate Winner Award (Optional)
              </label>
              <select
                value={winnerCategory}
                onChange={(e) => setWinnerCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">No award designation</option>
                <option value="1st Place - Grand Winner">1st Place - Grand Winner</option>
                <option value="1st Runner Up">1st Runner Up</option>
                <option value="2nd Runner Up">2nd Runner Up</option>
                <option value="Best AI & Machine Learning Solution">Best AI & Machine Learning Solution</option>
                <option value="Best UI/UX Polish">Best UI/UX Polish</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jury Feedback & Critique
              </label>
              <textarea
                rows={2}
                value={judgeFeedback}
                onChange={(e) => setJudgeFeedback(e.target.value)}
                placeholder="Positive feedback or areas of optimization..."
                className="w-full px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowScoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Evaluation
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
