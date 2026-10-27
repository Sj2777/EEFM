import React from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-blue-100',
  trend,
  trendLabel,
  className,
}: MetricCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 p-5 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && trendLabel && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && <TrendingUp size={12} className="text-emerald-500" />}
              {trend === 'down' && <TrendingDown size={12} className="text-rose-500" />}
              {trend === 'neutral' && <Minus size={12} className="text-slate-400" />}
              <span className={cn('text-xs font-medium', {
                'text-emerald-600': trend === 'up',
                'text-rose-600': trend === 'down',
                'text-slate-500': trend === 'neutral',
              })}>
                {trendLabel}
              </span>
            </div>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
interface RiskBadgeProps {
  risk: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  const base = 'inline-flex items-center font-medium rounded-full border';
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1 text-sm' };
  const colors: Record<string, string> = {
    'Lower Risk': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Moderate Risk': 'bg-blue-50 text-blue-700 border-blue-200',
    'Elevated Risk': 'bg-amber-50 text-amber-700 border-amber-200',
    'High Risk': 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <span className={cn(base, sizes[size], colors[risk] ?? 'bg-slate-50 text-slate-700 border-slate-200')}>
      {risk}
    </span>
  );
}

// ─── Repayment Badge ──────────────────────────────────────────────────────────
interface RepaymentBadgeProps { label: string }
export function RepaymentBadge({ label }: RepaymentBadgeProps) {
  const colors: Record<string, string> = {
    'Paid on Time': 'bg-emerald-50 text-emerald-700',
    'Late Payment': 'bg-amber-50 text-amber-700',
    'Default': 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full', colors[label] ?? 'bg-slate-100 text-slate-700')}>
      {label}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
interface StatusBadgeProps { label: string; variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' }
export function StatusBadge({ label, variant = 'neutral' }: StatusBadgeProps) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-700',
    info: 'bg-blue-100 text-blue-700',
    neutral: 'bg-slate-100 text-slate-600',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 text-xs font-medium rounded', variants[variant])}>
      {label}
    </span>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
interface SpinnerProps { size?: number; className?: string }
export function LoadingSpinner({ size = 20, className }: SpinnerProps) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className={cn('animate-spin', className)}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-300 mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────
interface ErrorStateProps { title?: string; message: string; retry?: () => void }
export function ErrorState({ title = 'Something went wrong', message, retry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center mb-3">
        <span className="text-rose-600 text-lg">!</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm">{message}</p>
      {retry && (
        <button onClick={retry} className="mt-3 text-xs text-blue-600 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps { className?: string; children: React.ReactNode }
export function Card({ className, children }: CardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn('px-5 py-4 border-b border-slate-100', className)}>{children}</div>;
}

export function CardTitle({ className, children }: CardProps) {
  return <h2 className={cn('text-sm font-semibold text-slate-700', className)}>{children}</h2>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

// ─── Disclaimer Banner ────────────────────────────────────────────────────────
export function DisclaimerBanner() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
      <span className="font-semibold">⚠ Prototype Notice: </span>
      AltScore is an educational prototype using synthetic data. Scores and predictions are experimental
      and have not been validated for real-world lending decisions.
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
}
export function Button({
  variant = 'primary', size = 'md', loading, leftIcon, children, className, disabled, ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-400',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoadingSpinner size={14} /> : leftIcon}
      {children}
    </button>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string; options: { value: string; label: string }[];
}
export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-700">{label}</label>}
      <select
        className={cn(
          'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400',
          error && 'border-rose-400',
          className
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string;
}
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-700">{label}</label>}
      <input
        className={cn(
          'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400',
          error && 'border-rose-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
