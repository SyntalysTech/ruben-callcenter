import { STATUS_CONFIG, type LeadStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: LeadStatus;
  showLabel?: boolean;
}

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className={"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium " + config.bgColor + " " + config.color}
    >
      {showLabel ? config.label : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function StatusDot({ status }: { status: LeadStatus }) {
  const config = STATUS_CONFIG[status];
  
  return (
    <span
      className={"inline-block w-3 h-3 rounded-full " + config.bgColor}
      title={config.label}
    />
  );
}
