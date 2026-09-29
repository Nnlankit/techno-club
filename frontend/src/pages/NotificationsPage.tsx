import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, CheckCheck, CheckCircle2, Clock, Calendar, 
  CheckSquare, Megaphone, Trophy, FileText, AlertTriangle, 
  Trash2, Filter, Search, ArrowRight, Eye, EyeOff, Layers, ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { Notification } from '../types';
import { 
  PageHeader, Card, Button, Badge, EmptyState, LoadingState, 
  ConfirmationDialog, Toast 
} from '../components/ui';
import { getNotificationRoute, getNotificationBadgeMeta } from '../utils/notificationUtils';
import { useAuth } from '../context/AuthContext';

interface NotificationsPageProps {
  onNavigate?: (page: string, params?: any) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unread' | 'Read'>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<Notification | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setToast({ message: 'Failed to load notifications', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setToast({ message: 'All notifications marked as read', type: 'success' });
    } catch (err: any) {
      setToast({ message: 'Failed to mark all as read', type: 'error' });
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, n: Notification) => {
    e.stopPropagation();
    try {
      if (n.is_read) {
        await api.notifications.markUnread(n.id);
        setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: false } : item));
        setToast({ message: 'Marked as unread', type: 'info' });
      } else {
        await api.notifications.markRead(n.id);
        setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item));
        setToast({ message: 'Marked as read', type: 'success' });
      }
    } catch (err: any) {
      setToast({ message: 'Failed to update notification', type: 'error' });
    }
  };

  const handleDeleteNotification = async () => {
    if (!notifToDelete) return;
    try {
      await api.notifications.delete(notifToDelete.id);
      setNotifications((prev) => prev.filter((item) => item.id !== notifToDelete.id));
      setShowClearDialog(false);
      setNotifToDelete(null);
      setToast({ message: 'Notification removed', type: 'success' });
    } catch (err: any) {
      setToast({ message: 'Failed to delete notification', type: 'error' });
    }
  };

  const handleClearAllRead = async () => {
    try {
      await api.notifications.clearAll(true);
      setNotifications((prev) => prev.filter((item) => !item.is_read));
      setToast({ message: 'Cleared all read notifications', type: 'success' });
    } catch (err: any) {
      setToast({ message: 'Failed to clear read notifications', type: 'error' });
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    // 1. Mark as read in background if unread
    if (!n.is_read) {
      try {
        await api.notifications.markRead(n.id);
        setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item));
      } catch (e) {
        console.error('Failed to mark read on click:', e);
      }
    }

    // 2. Redirect to destination route
    const route = getNotificationRoute(n, user?.role?.name);
    if (onNavigate) {
      const pageId = route.replace(/^\//, '').split('/')[0];
      const secondPart = route.replace(/^\//, '').split('/')[1];
      if (secondPart) {
        onNavigate(pageId, { id: secondPart });
      } else {
        onNavigate(pageId);
      }
    } else {
      navigate(route);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    // Read status filter
    if (statusFilter === 'Unread' && n.is_read) return false;
    if (statusFilter === 'Read' && !n.is_read) return false;

    // Type filter
    if (typeFilter !== 'All') {
      const t = (n.type || '').toLowerCase();
      if (!t.includes(typeFilter.toLowerCase())) return false;
    }

    // Priority filter
    if (priorityFilter !== 'All') {
      if ((n.priority || 'Normal').toLowerCase() !== priorityFilter.toLowerCase()) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchMsg = n.message.toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    return true;
  });

  // KPI counts
  const totalCount = notifications.length;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const urgentCount = notifications.filter((n) => (n.priority || '').toLowerCase() === 'urgent' && !n.is_read).length;
  const taskCount = notifications.filter((n) => (n.type || '').toLowerCase().includes('task')).length;

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('task')) return <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    if (t.includes('event')) return <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
    if (t.includes('hackathon')) return <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    if (t.includes('approval') || t.includes('proposal')) return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
    if (t.includes('meeting')) return <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
    if (t.includes('announcement')) return <Megaphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
    if (t.includes('certificate')) return <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
    return <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400" />;
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Notifications"
        description="Real-time alerts, project task updates, event registrations, leadership approvals, and announcements."
        searchProps={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: 'Search notifications by keyword, action, or subject...'
        }}
        filterProps={{
          filters: [
            {
              key: 'status',
              label: 'Read Status',
              value: statusFilter,
              onChange: setStatusFilter as any,
              options: [
                { label: 'All Notifications', value: 'All' },
                { label: 'Unread Only', value: 'Unread' },
                { label: 'Read Only', value: 'Read' },
              ]
            },
            {
              key: 'type',
              label: 'Category',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { label: 'All Categories', value: 'All' },
                { label: 'Tasks', value: 'Task' },
                { label: 'Events', value: 'Event' },
                { label: 'Approvals', value: 'Approval' },
                { label: 'Meetings', value: 'Meeting' },
                { label: 'Broadcasts', value: 'Announcement' },
                { label: 'System', value: 'System' },
              ]
            },
            {
              key: 'priority',
              label: 'Priority',
              value: priorityFilter,
              onChange: setPriorityFilter,
              options: [
                { label: 'All Priorities', value: 'All' },
                { label: 'Urgent', value: 'Urgent' },
                { label: 'High', value: 'High' },
                { label: 'Normal', value: 'Normal' },
              ]
            }
          ]
        }}
        primaryAction={
          unreadCount > 0
            ? {
                label: 'Mark All as Read',
                icon: <CheckCheck className="w-4 h-4" />,
                onClick: handleMarkAllRead
              }
            : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Logged across all domains & modules
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Unread Notifications</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
              {unreadCount}
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-2">
            {unreadCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Pending your attention and action
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Urgent Action Items</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {urgentCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Approvals or critical task deadlines
          </p>
        </Card>

        <Card className="p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Tasks & Milestones</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {taskCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Assignments and subtask handoffs
          </p>
        </Card>
      </div>

      {/* Control Bar: Fast Filter Chips & Bulk Clear */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {(['All', 'Unread', 'Read'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st}
              {st === 'Unread' && unreadCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 text-[10px] rounded-full bg-amber-600 text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {notifications.some((n) => n.is_read) && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleClearAllRead}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Clear Read Notifications
            </Button>
          )}
        </div>
      </div>

      {/* Notification Cards List */}
      {loading ? (
        <LoadingState message="Fetching live notification updates..." />
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          title="No Notifications Found"
          description={
            searchQuery || statusFilter !== 'All' || typeFilter !== 'All'
              ? 'No notifications match your current filter criteria. Try resetting filters.'
              : 'You have zero notifications right now. Everything is caught up!'
          }
          action={
            searchQuery || statusFilter !== 'All' || typeFilter !== 'All'
              ? {
                  label: 'Clear Filters',
                  onClick: () => {
                    setStatusFilter('All');
                    setTypeFilter('All');
                    setPriorityFilter('All');
                    setSearchQuery('');
                  }
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => {
            const badgeMeta = getNotificationBadgeMeta(n.type, n.priority);
            const destination = getNotificationRoute(n);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(n);
                  }
                }}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left ${
                  n.is_read
                    ? 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-white dark:hover:bg-slate-900'
                    : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 hover:border-amber-500 hover:bg-amber-50/70 dark:hover:bg-amber-950/30 shadow-xs'
                }`}
              >
                {/* Left: Type Icon + Title + Message */}
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 border ${badgeMeta.borderColor} ${badgeMeta.bgColor}`}>
                    {getTypeIcon(n.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`text-sm font-bold truncate ${
                        n.is_read ? 'text-slate-900 dark:text-white' : 'text-amber-950 dark:text-amber-100 font-black'
                      }`}>
                        {n.title}
                      </h4>

                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0 animate-pulse" />
                      )}

                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeMeta.borderColor} ${badgeMeta.bgColor} ${badgeMeta.textColor}`}>
                        {badgeMeta.label}
                      </span>

                      {n.priority && n.priority.toLowerCase() === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Urgent
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                      <span>{formatRelativeTime(n.created_at)}</span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">
                        Target: {destination}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls & Navigation Indicator */}
                <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleToggleRead(e, n)}
                      title={n.is_read ? 'Mark as unread' : 'Mark as read'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {n.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotifToDelete(n);
                        setShowClearDialog(true);
                      }}
                      title="Delete notification"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="inline-flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 group-hover:translate-x-1 transition-transform pl-2">
                    <span className="hidden md:inline mr-1">View</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showClearDialog}
        title="Delete Notification"
        message={`Are you sure you want to remove notification "${notifToDelete?.title}"?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDeleteNotification}
        onCancel={() => {
          setShowClearDialog(false);
          setNotifToDelete(null);
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
