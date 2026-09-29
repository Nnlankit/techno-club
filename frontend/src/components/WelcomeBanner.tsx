import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface WelcomeBannerProps {
  /** Optional domain name override if already resolved */
  domainName?: string;
  /** Optional custom quote override */
  quote?: string;
  /** Optional additional CSS classes */
  className?: string;
}

const TECHNO_CLUB_QUOTES: readonly string[] = [
  'Build. Learn. Innovate. Together.',
  'Turning ideas into technology.',
  'Learn today. Build tomorrow.',
  'Create. Collaborate. Innovate.',
  'Technology starts with an idea.',
  'Think. Build. Lead.',
  'Where students build the future.',
];

const DEFAULT_ROLE_QUOTES: Record<string, string> = {
  President: 'Build. Learn. Innovate. Together.',
  'Vice President': 'Create. Collaborate. Innovate.',
  'Domain Head': 'Turning ideas into technology.',
  'Technical Lead': 'Turning ideas into technology.',
  Member: 'Think. Build. Lead.',
  Treasurer: 'Learn today. Build tomorrow.',
  'Faculty Coordinator': 'Where students build the future.',
};

/**
 * Determine time-based greeting according to user local time:
 * - Before 12 PM: Good Morning
 * - 12 PM – 5 PM: Good Afternoon
 * - After 5 PM: Good Evening
 */
function getTimeGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

/**
 * Extract clean display first name from full name or email
 */
function getFirstName(fullName?: string, email?: string): string {
  if (fullName && fullName.trim().length > 0) {
    const trimmed = fullName.trim();
    // Special handling for academic titles like Dr. K. Ramanathan -> Dr. Ramanathan
    if (/^dr\./i.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      return parts.length > 2 ? `${parts[0]} ${parts[parts.length - 1]}` : trimmed;
    }
    return trimmed.split(/\s+/)[0];
  }
  if (email) {
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  return 'Member';
}

/**
 * Generate role-aware subtitle according to specifications:
 * - President: Welcome back, President.
 * - Vice President: Welcome back, Vice President.
 * - Domain Head: Welcome back, {Domain Name} Domain Head.
 * - Member: Welcome back to the Techno Club.
 * - Custom / future roles: Welcome back, {role}.
 */
function getRoleSubtitle(roleName: string, domainName?: string): string {
  const trimmedRole = roleName?.trim() || 'Member';

  // Format domain if provided
  let formattedDomain = domainName?.trim() || '';
  if (formattedDomain.toLowerCase() === 'ai & machine learning') {
    formattedDomain = 'AI/ML';
  } else if (formattedDomain) {
    // Strip trailing ' Domain' case-insensitively
    formattedDomain = formattedDomain.replace(/\s+domain$/i, '').trim();
  }

  // Member role
  if (trimmedRole.toLowerCase() === 'member') {
    return 'Welcome back to the Techno Club.';
  }

  // Domain Head role
  if (trimmedRole.toLowerCase() === 'domain head') {
    return formattedDomain
      ? `Welcome back, ${formattedDomain} Domain Head.`
      : 'Welcome back, Domain Head.';
  }

  // Technical Lead role
  if (trimmedRole.toLowerCase() === 'technical lead') {
    return formattedDomain
      ? `Welcome back, ${formattedDomain} Technical Lead.`
      : 'Welcome back, Technical Lead.';
  }

  // Any other role (President, Vice President, Treasurer, Faculty Coordinator, custom future roles)
  return `Welcome back, ${trimmedRole}.`;
}

/**
 * Get appropriate Techno Club quote for role or general rotation
 */
function getTechnoClubQuote(roleName?: string): string {
  if (roleName && DEFAULT_ROLE_QUOTES[roleName]) {
    return DEFAULT_ROLE_QUOTES[roleName];
  }
  const day = new Date().getDate();
  return TECHNO_CLUB_QUOTES[day % TECHNO_CLUB_QUOTES.length];
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  domainName,
  quote: customQuote,
  className = '',
}) => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState<string>(getTimeGreeting);

  useEffect(() => {
    const update = () => setGreeting(getTimeGreeting());
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  const roleName = user?.role?.name || 'Member';
  const effectiveDomain = domainName || user?.domain_name;
  const firstName = getFirstName(user?.full_name, user?.email);
  const roleSubtitle = getRoleSubtitle(roleName, effectiveDomain);
  const quote = customQuote || getTechnoClubQuote(roleName);

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 dark:border-slate-800/80 bg-gradient-to-r from-amber-50/70 via-[#FAF7F2] to-orange-50/40 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-amber-950/20 p-5 sm:p-6 shadow-xs ${className}`}
    >
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {greeting}, {firstName}! <span className="inline-block select-none">👋</span>
      </h1>
      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
        {roleSubtitle}
      </p>
      <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-400 font-medium italic mt-3">
        "{quote}"
      </p>
    </div>
  );
};
