import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Sun, Moon, LogOut, CheckCheck, 
  Terminal, ShieldCheck, ChevronDown, UserCheck, ExternalLink,
  Layers, Calendar, Award, CheckSquare, FolderGit2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Notification, SearchResultItem } from '../types';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Persona switcher state
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const personaRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (user) {
      api.notifications.list()
        .then(setNotifications)
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [user]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search.query(searchQuery);
        setSearchResults(res.results);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    // Map URL / type to navigate
    if (item.type === 'Member') onNavigate('members', { id: item.id });
    else if (item.type === 'Domain') onNavigate('domains', { id: item.id });
    else if (item.type === 'Event') onNavigate('events', { id: item.id });
    else if (item.type === 'Hackathon') onNavigate('hackathons', { id: item.id });
    else if (item.type === 'Project') onNavigate('projects', { id: item.id });
    else if (item.type === 'Task') onNavigate('tasks', { id: item.id });
    else if (item.type === 'Document') onNavigate('documents');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const demoPersonas = [
    { name: 'President', email: 'president@technoclub.org', role: 'President', desc: 'Full Club Leadership & Approvals' },
    { name: 'Vice President', email: 'vp@technoclub.org', role: 'Vice President', desc: 'Operational Oversight & Events' },
    { name: 'Domain Head', email: 'aiml.head@technoclub.org', role: 'Domain Head (AI/ML)', desc: 'Domain Projects & Tasks' },
    { name: 'Member', email: 'member1@technoclub.org', role: 'Member', desc: 'Assigned Tasks & Registrations' },
    { name: 'Treasurer', email: 'treasurer@technoclub.org', role: 'Treasurer', desc: 'Finances, Budgets & Expenses' },
    { name: 'Faculty Coordinator', email: 'faculty@technoclub.org', role: 'Faculty Coordinator', desc: 'Governance & Institutional Oversight' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Brand identifier */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
                TECHNO CLUB
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                OS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Operations & Management System</p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-md mx-8" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setShowSearchDropdown(true); }}
              placeholder="Search members, domains, events, hackathons, tasks, docs... (Ctrl+K)"
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-indigo-500 dark:focus:border-indigo-500 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {isSearching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
                Searching...
              </span>
            )}
          </div>

          {/* Search Dropdown Results */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-xs text-slate-500">
                <span>Search results ({searchResults.length})</span>
                <span>ESC to close</span>
              </div>
              <div className="p-1">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id}-${idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                        {item.type === 'Member' && <UserCheck className="w-4 h-4" />}
                        {item.type === 'Domain' && <Layers className="w-4 h-4" />}
                        {item.type === 'Event' && <Calendar className="w-4 h-4" />}
                        {item.type === 'Hackathon' && <Award className="w-4 h-4" />}
                        {item.type === 'Project' && <FolderGit2 className="w-4 h-4" />}
                        {item.type === 'Task' && <CheckSquare className="w-4 h-4" />}
                        {item.type === 'Document' && <ExternalLink className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Cluster */}
        <div className="flex items-center space-x-3">
          {/* Quick Demo Persona Switcher */}
          <div className="relative" ref={personaRef}>
            <button
              onClick={() => setShowPersonaMenu(!showPersonaMenu)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors shadow-sm"
              title="Test the platform as different roles"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Persona: <strong>{user?.role.name || 'Select'}</strong></span>
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Role-Based Persona Switcher</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Switch role in 1 click to test RBAC & custom dashboards</p>
                </div>
                <div className="mt-1 space-y-1">
                  {demoPersonas.map((p) => {
                    const isCurrent = user?.role.name === p.name || (p.name === 'Domain Head' && user?.role.name.includes('Domain Head'));
                    return (
                      <button
                        key={p.name}
                        onClick={async () => {
                          setShowPersonaMenu(false);
                          await switchDemoRole(p.name);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className={`text-[10px] ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {p.desc}
                          </div>
                        </div>
                        {isCurrent && <CheckCheck className="w-4 h-4 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Center */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                          !n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User profile capsule & Logout */}
          <div className="flex items-center pl-2 space-x-3 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <img
                src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.full_name || 'User'}`}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 object-cover"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.full_name || user?.email.split('@')[0]}
                </p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                  {user?.role_title || user?.role.name}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
