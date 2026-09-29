import React from 'react';
import { Badge } from './ui/Badge';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return <Badge status={status} className={className} />;
};
