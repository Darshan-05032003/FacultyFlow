import { cn } from '../../lib/utils';

// ======================================================
// StatusBadge
// ======================================================
interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Activity statuses
  PLANNED: { label: 'Planned', className: 'badge-planned' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-in-progress' },
  COMPLETED: { label: 'Completed', className: 'badge-completed' },
  CANCELLED: { label: 'Cancelled', className: 'badge-cancelled' },
  // Workload statuses
  LOW: { label: 'Low', className: 'status-low' },
  NORMAL: { label: 'Normal', className: 'status-normal' },
  HIGH: { label: 'High', className: 'status-high' },
  OVERLOADED: { label: 'Overloaded', className: 'status-overloaded' },
  // Variance statuses
  OVERLOAD: { label: 'Overloaded', className: 'status-overloaded' },
  UNDERLOADED: { label: 'Underloaded', className: 'status-low' },
  PENDING: { label: 'Pending', className: 'badge-planned' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, className: 'badge-planned' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  );
}

// ======================================================
// PriorityBadge
// ======================================================
interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const PRIORITY_MAP: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: 'Critical', className: 'badge-critical' },
  HIGH: { label: 'High', className: 'badge-high' },
  MEDIUM: { label: 'Medium', className: 'badge-medium' },
  LOW: { label: 'Low', className: 'badge-low' },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = PRIORITY_MAP[priority] || { label: priority, className: 'badge-low' };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', config.className, className)}>
      {config.label}
    </span>
  );
}

// ======================================================
// MetricCard
// ======================================================
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function MetricCard({ title, value, subtitle, icon, iconBg = 'bg-blue-100', trend, className }: MetricCardProps) {
  return (
    <div className={cn('metric-card', className)}>
      <div className={cn('metric-icon', iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-none">{value}</p>
        {trend && (
          <p className={cn('text-xs font-medium mt-1 flex items-center gap-1', trend.positive !== false ? 'text-green-600' : 'text-red-600')}>
            <span>{trend.positive !== false ? '↑' : '↓'}</span>
            {trend.value}
          </p>
        )}
        {subtitle && !trend && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

// ======================================================
// SectionCard
// ======================================================
interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, children, className, headerRight, noPadding }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-card', className)}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            {title && <h3 className="section-title">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}

// ======================================================
// PageHeader
// ======================================================
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

// ======================================================
// LoadingState
// ======================================================
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" 
           style={{ borderWidth: '3px' }} />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

// ======================================================
// ErrorState
// ======================================================
export function ErrorState({ message = 'An error occurred. Please try again.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3 text-red-600">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="text-sm text-center max-w-sm">{message}</p>
    </div>
  );
}

// ======================================================
// EmptyState
// ======================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-3 text-center">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
          {icon}
        </div>
      )}
      <div>
        <p className="font-semibold text-gray-700">{title}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ======================================================
// FilterBar
// ======================================================
interface FilterField {
  label: string;
  children: React.ReactNode;
  className?: string;
}

interface FilterBarProps {
  fields: FilterField[];
  onApply: () => void;
  applyLabel?: string;
  isLoading?: boolean;
}

export function FilterBar({ fields, onApply, applyLabel = 'Apply Filters', isLoading }: FilterBarProps) {
  return (
    <div className="filter-bar mb-6">
      {fields.map((field, idx) => (
        <div key={idx} className={cn('flex flex-col gap-1', field.className || 'min-w-[160px]')}>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{field.label}</label>
          {field.children}
        </div>
      ))}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider opacity-0">Apply</label>
        <button onClick={onApply} disabled={isLoading} className="btn-primary whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          {applyLabel}
        </button>
      </div>
    </div>
  );
}
