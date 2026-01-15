import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: {
    card: 'bg-card border border-border',
    icon: 'bg-muted text-foreground',
    iconWrapper: '',
  },
  primary: {
    card: 'bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20',
    icon: 'bg-primary text-primary-foreground',
    iconWrapper: 'shadow-glow',
  },
  success: {
    card: 'bg-gradient-to-br from-success/10 to-success/5 border border-success/20',
    icon: 'bg-success text-success-foreground',
    iconWrapper: '',
  },
  warning: {
    card: 'bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20',
    icon: 'bg-warning text-warning-foreground',
    iconWrapper: '',
  },
  danger: {
    card: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border border-destructive/20',
    icon: 'bg-destructive text-destructive-foreground',
    iconWrapper: '',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'stat-card rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1',
        styles.card,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  'text-xs font-medium',
                  trend.value >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.value >= 0 ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-3', styles.icon, styles.iconWrapper)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
