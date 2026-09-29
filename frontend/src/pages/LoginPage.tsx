import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Terminal, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Input } from '../components/ui';

export const LoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  // If already authenticated, automatically redirect away from login
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (roleEmail: string) => {
    setIsLoading(true);
    setErrorMessage('');
    setEmail(roleEmail);
    setPassword('TechnoClub@2026');
    try {
      await login(roleEmail, 'TechnoClub@2026');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || `Failed to sign in as ${roleEmail}`);
    } finally {
      setIsLoading(false);
    }
  };

  const demoRoles = [
    { label: 'President', email: 'president@technoclub.org', desc: 'Aarav Sharma' },
    { label: 'Vice President', email: 'vp@technoclub.org', desc: 'Priya Patel' },
    { label: 'AI/ML Head', email: 'aiml.head@technoclub.org', desc: 'Rohan Verma' },
    { label: 'Member', email: 'member1@technoclub.org', desc: 'Sneha Kulkarni' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-600 selection:text-white transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-600/20 mb-3">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Techno Club
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            Welcome Back 👋
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-start space-x-2 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {showForgotNotice && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
              Please contact your Faculty Coordinator or President (<code>president@technoclub.org</code>) to reset your club credentials.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="president@technoclub.org"
                icon={Mail}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotNotice(!showForgotNotice)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400"
                >
                  Forgot Password?
                </button>
              </div>

              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                loading={isLoading}
              >
                Login
              </Button>
            </div>
          </form>

          {/* Quick Evaluator Access */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Role Login (Real Auth)
              </p>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                PW: TechnoClub@2026
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoRoles.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => handleDemoLogin(r.email)}
                  className="text-xs py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-400 font-semibold transition-colors truncate text-center"
                >
                  <span className="block font-bold">{r.label}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
