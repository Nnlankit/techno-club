import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, 
  Terminal, UserCheck, KeyRound, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Invalid email or password. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPersona = async (roleName: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await switchDemoRole(roleName);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || `Failed to switch to ${roleName}`);
    } finally {
      setIsLoading(false);
    }
  };

  const personas = [
    { role: 'President', email: 'president@technoclub.org', desc: 'Full club executive authority, sanctions & governance', color: 'bg-indigo-600' },
    { role: 'Vice President', email: 'vp@technoclub.org', desc: 'Operations oversight, activity reviews & approvals', color: 'bg-blue-600' },
    { role: 'Domain Head', email: 'aiml.head@technoclub.org', desc: 'AI/ML domain head, project lead & task management', color: 'bg-purple-600' },
    { role: 'Member', email: 'member1@technoclub.org', desc: 'Assigned tasks, event check-in, certificates & portfolio', color: 'bg-emerald-600' },
    { role: 'Treasurer', email: 'treasurer@technoclub.org', desc: 'Budget allocations, expense disbursements & audit', color: 'bg-amber-600' },
    { role: 'Faculty Coordinator', email: 'faculty@technoclub.org', desc: 'Institutional oversight, permissions & compliance', color: 'bg-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-4 shadow-inner">
          <Terminal className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Techno Club Operations OS
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enterprise ERP & Management Platform for College Technology Clubs
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-8 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                College or Officer Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="president@technoclub.org"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* 1-Click Persona Evaluator Selector */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant 1-Click Evaluation Personas</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {personas.map((p) => (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleQuickPersona(p.role)}
                  disabled={isLoading}
                  className="p-2.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/90 text-left transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className={`w-2 h-2 rounded-full ${p.color}`} />
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                        {p.role}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {p.desc}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                    Switch →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-[11px] text-slate-500">
          Default seed credentials: <code className="text-indigo-400 font-mono">TechnoClub@2026</code>
        </div>
      </div>
    </div>
  );
};
