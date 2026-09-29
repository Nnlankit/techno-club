import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Bell, Sun, Moon, LogOut, CheckCheck, 
  Terminal, Menu, ChevronDown, UserCheck, ExternalLink,
  Layers, Calendar, Award, CheckSquare, FolderGit2,
  User as UserIcon, KeyRound, History, Sparkles, FileText,
  Megaphone, Shield, X, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Notification, SearchResultItem } from '../types';
import { Avatar, Badge } from './ui';
import { getNotificationRoute, getNotificationBadgeMeta, formatTimeAgo } from '../utils/notificationUtils';

interface NavbarProps {
  onNavigate: (page: string, params?: any) => void;
  onToggleMobileSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onToggleMobileSidebar }) => {
  const { user, logout } = useAuth();
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

  // User menu state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (user) {
      api.notifications.list()
        .then(setNotifications)
        .catch(err => console.error('Error fetching notifications:', err));
    }
  }, [user]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
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
        const filtered = ['President', 'Vice President'].includes(user?.role?.name || '')
          ? res.results.filter(r => r.type !== 'Hackathon')
          : res.results;
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, user]);

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await api.notifications.markRead(n.id);
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setShowNotifDropdown(false);
    const route = getNotificationRoute(n, user?.role?.name);
    onNavigate(route);
  };

  const handleSelectSearchResult = (item: SearchResultItem) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    if (item.type === 'Member') onNavigate('members', { id: item.id });
    else if (item.type === 'Domain') onNavigate('domains', { id: item.id });
    else if (item.type === 'Event') onNavigate('events', { id: item.id });
    else if (item.type === 'Hackathon') {
      if (!['President', 'Vice President'].includes(user?.role?.name || '')) {
        onNavigate('hackathons', { id: item.id });
      }
    }
    else if (item.type === 'Project') onNavigate('projects', { id: item.id });
    else if (item.type === 'Task') onNavigate('tasks', { id: item.id });
    else if (item.type === 'Document') onNavigate('documents');
    else if (item.type === 'Announcement') onNavigate('announcements');
    else onNavigate('dashboard');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'Member': return <UserIcon className="w-3.5 h-3.5 text-blue-600" />;
      case 'Domain': return <Layers className="w-3.5 h-3.5 text-purple-600" />;
      case 'Event': return <Calendar className="w-3.5 h-3.5 text-amber-600" />;
      case 'Hackathon': return <Award className="w-3.5 h-3.5 text-rose-600" />;
      case 'Project': return <FolderGit2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Task': return <CheckSquare className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Document': return <FileText className="w-3.5 h-3.5 text-slate-600" />;
      case 'Announcement': return <Megaphone className="w-3.5 h-3.5 text-blue-600" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 gap-3">
        {/* Left: Hamburger & Brand Identifier */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => onNavigate('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-700 flex items-center justify-center text-white shadow-xs">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  TECHNO CLUB
                </span>
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.2 rounded-md bg-amber-100/80 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                  PLATFORM
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="relative flex-1 max-w-lg mx-2 sm:mx-6" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowSearchDropdown(true);
              }}
              placeholder="Search members, events, projects, hackathons, tasks..."
              className="w-full text-xs sm:text-sm pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-600/20 transition-all"
            />
            {isSearching && (
              <span className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categorized Search Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Found {searchResults.length} Results
              </div>
              <div className="p-1 space-y-0.5">
                {searchResults.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id || idx}`}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {getResultIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Nav Utilities */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Read-Only Authenticated Role Indicator */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline text-slate-400">Role:</span>
            <span className="text-amber-700 dark:text-amber-400 font-bold truncate max-w-[120px]">
              {user?.role.name || 'Member'}
            </span>
            {user?.domain_name && user.role.name !== 'President' && user.role.name !== 'Vice President' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100/80 text-amber-900 border border-amber-200/60 dark:bg-amber-950 dark:text-amber-300 font-medium hidden md:inline truncate max-w-[100px]">
                {user.domain_name}
              </span>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div
                    className="flex items-center space-x-1.5 cursor-pointer group"
                    onClick={() => {
                      setShowNotifDropdown(false);
                      onNavigate('notifications');
                    }}
                    title="Open Notifications Page"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 font-semibold flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark read</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications at this moment
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const badgeMeta = getNotificationBadgeMeta(n.type, n.priority);
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer group ${
                            n.is_read
                              ? 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                              : 'border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 hover:border-amber-400 dark:hover:border-amber-700 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              {!n.is_read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                              )}
                              <span className="font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                {n.title}
                              </span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 border ${badgeMeta.bgColor} ${badgeMeta.textColor} ${badgeMeta.borderColor}`}>
                              {badgeMeta.label}
                            </span>
                          </div>
                          <div className="text-[11px] mt-1 text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {n.message}
                          </div>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                            <span>{formatTimeAgo(n.created_at)}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-amber-700 dark:text-amber-400 font-semibold flex items-center space-x-0.5 transition-opacity">
                              <span>Open</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer link to dedicated Notifications Page */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setShowNotifDropdown(false);
                      onNavigate('notifications');
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-800/60 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold text-xs flex items-center justify-center space-x-1.5 border border-slate-200/60 dark:border-slate-800 transition-colors"
                  >
                    <span>View All Notifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Avatar
                src={user?.avatar_url}
                name={user?.full_name || user?.email || 'User'}
                size="sm"
                status="online"
              />
              <span className="hidden lg:inline text-xs font-bold text-slate-700 dark:text-slate-300 max-w-[90px] truncate">
                {user?.full_name || 'Officer'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.full_name || user?.email}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  <div className="mt-1.5">
                    <Badge variant="amber" size="xs">
                      {user?.role.name}
                    </Badge>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('profile');
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onNavigate('profile', { tab: 'security' });
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
