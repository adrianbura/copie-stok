import { cn } from '@/lib/utils';
import { PyroCategory, CATEGORIES } from '@/types';

interface CategoryBadgeProps {
  category: PyroCategory;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

const categoryStyles: Record<PyroCategory, { bg: string; text: string; border: string }> = {
  'F1': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/30',
  },
  'F2': {
    bg: 'bg-sky-500/10',
    text: 'text-sky-600',
    border: 'border-sky-500/30',
  },
  'F3': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/30',
  },
  'F4': {
    bg: 'bg-red-500/10',
    text: 'text-red-600',
    border: 'border-red-500/30',
  },
  'T1': {
    bg: 'bg-violet-500/10',
    text: 'text-violet-600',
    border: 'border-violet-500/30',
  },
  'T2': {
    bg: 'bg-pink-500/10',
    text: 'text-pink-600',
    border: 'border-pink-500/30',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function CategoryBadge({ category, size = 'md', showDescription = false }: CategoryBadgeProps) {
  const categoryInfo = CATEGORIES.find((c) => c.id === category);
  const styles = categoryStyles[category];

  if (!categoryInfo || !styles) return null;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-semibold border',
          styles.bg,
          styles.text,
          styles.border,
          sizeStyles[size]
        )}
      >
        <span>{categoryInfo.icon}</span>
        <span>Cat. {category}</span>
      </span>
      {showDescription && (
        <span className="text-sm text-muted-foreground">{categoryInfo.description}</span>
      )}
    </div>
  );
}