import { Notification } from '../types';

/**
 * Determine the destination route when a user clicks a notification.
 * Prioritizes entity_type & entity_id, then notification type, then keyword heuristic.
 */
export const getNotificationRoute = (n: Notification, userRole?: string): string => {
  const isPresOrVp = ['President', 'Vice President'].includes(userRole || '');
  const entityType = (n.entity_type || '').toLowerCase();
  const notifType = (n.type || '').toLowerCase();
  const text = `${n.title} ${n.message}`.toLowerCase();

  // 1. Direct entity_type matching
  if (entityType === 'event') return n.entity_id ? `/events/${n.entity_id}` : '/events';
  if (entityType === 'hackathon') return isPresOrVp ? '/events' : (n.entity_id ? `/hackathons/${n.entity_id}` : '/hackathons');
  if (entityType === 'project') return n.entity_id ? `/projects/${n.entity_id}` : '/projects';
  if (entityType === 'task') return n.entity_id ? `/tasks/${n.entity_id}` : '/tasks';
  if (entityType === 'meeting') return '/meetings';
  if (entityType === 'announcement') return '/announcements';
  if (entityType === 'approval' || entityType === 'proposal') return n.entity_id ? `/approvals/${n.entity_id}` : '/approvals';
  if (entityType === 'certificate') return '/certificates';
  if (entityType === 'achievement') return '/achievements';
  if (entityType === 'resource') return '/resources';
  if (entityType === 'sponsor') return '/sponsors';
  if (entityType === 'document') return '/documents';
  if (entityType === 'domain') return n.entity_id ? `/domains/${n.entity_id}` : '/domains';
  if (entityType === 'member' || entityType === 'user') return n.entity_id ? `/members/${n.entity_id}` : '/members';

  // 2. Notification Type matching
  if (notifType.includes('event')) return '/events';
  if (notifType.includes('hackathon')) return isPresOrVp ? '/events' : '/hackathons';
  if (notifType.includes('task')) return '/tasks';
  if (notifType.includes('project')) return '/projects';
  if (notifType.includes('meeting')) return '/meetings';
  if (notifType.includes('announcement') || notifType.includes('broadcast')) return '/announcements';
  if (notifType.includes('approval') || notifType.includes('proposal') || notifType.includes('budget')) return '/approvals';
  if (notifType.includes('certificate')) return '/certificates';
  if (notifType.includes('achievement')) return '/achievements';
  if (notifType.includes('resource') || notifType.includes('equipment')) return '/resources';
  if (notifType.includes('sponsor')) return '/sponsors';
  if (notifType.includes('document')) return '/documents';
  if (notifType.includes('member')) return '/members';

  // 3. Fallback: Keyword search in Title & Message
  if (text.includes('hackathon')) return isPresOrVp ? '/events' : '/hackathons';
  if (text.includes('workshop') || text.includes('webinar') || text.includes('event')) return '/events';
  if (text.includes('task') || text.includes('ticket') || text.includes('assigned to you') || text.includes('subtask')) return '/tasks';
  if (text.includes('project') || text.includes('repository')) return '/projects';
  if (text.includes('meeting') || text.includes('agenda') || text.includes('call')) return '/meetings';
  if (text.includes('announcement') || text.includes('broadcast') || text.includes('notice')) return '/announcements';
  if (text.includes('approval') || text.includes('budget proposal') || text.includes('request pending')) return '/approvals';
  if (text.includes('certificate') || text.includes('credential')) return '/certificates';
  if (text.includes('achievement') || text.includes('accolade') || text.includes('hall of fame')) return '/achievements';
  if (text.includes('resource') || text.includes('hardware kit') || text.includes('inventory')) return '/resources';
  if (text.includes('sponsor') || text.includes('partner') || text.includes('mou')) return '/sponsors';
  if (text.includes('document') || text.includes('proposal file') || text.includes('minutes')) return '/documents';
  if (text.includes('domain')) return '/domains';
  if (text.includes('member') || text.includes('profile')) return '/members';

  return '/dashboard';
};

/**
 * Return human-readable tag and styling colors for a notification type
 */
export const getNotificationBadgeMeta = (type: string, priority: string = 'Normal') => {
  const t = type.toLowerCase();
  if (priority.toLowerCase() === 'urgent') {
    return {
      label: 'Urgent',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      textColor: 'text-rose-700 dark:text-rose-400',
      borderColor: 'border-rose-200 dark:border-rose-900/60'
    };
  }
  if (t.includes('task')) {
    return {
      label: 'Task',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-900/60'
    };
  }
  if (t.includes('event')) {
    return {
      label: 'Event',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      textColor: 'text-amber-800 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-900/60'
    };
  }
  if (t.includes('approval')) {
    return {
      label: 'Approval',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-900/60'
    };
  }
  if (t.includes('announcement')) {
    return {
      label: 'Broadcast',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      textColor: 'text-purple-700 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-900/60'
    };
  }
  if (t.includes('meeting')) {
    return {
      label: 'Meeting',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/40',
      textColor: 'text-cyan-700 dark:text-cyan-400',
      borderColor: 'border-cyan-200 dark:border-cyan-900/60'
    };
  }
  return {
    label: type || 'System',
    bgColor: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-700'
  };
};

/**
 * Format timestamp into friendly relative time
 */
export const formatTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 0 || diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};
