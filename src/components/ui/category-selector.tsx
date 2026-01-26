import { PyroCategory, CATEGORIES } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CategoryBadge } from '@/components/ui/category-badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface CategorySelectorProps {
  category: PyroCategory;
  onCategoryChange: (category: PyroCategory) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function CategorySelector({ category, onCategoryChange, size = 'sm' }: CategorySelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (newCategory: PyroCategory) => {
    onCategoryChange(newCategory);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className="cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
        >
          <CategoryBadge category={category} size={size} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 z-50 bg-popover" align="start">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground px-2 pb-1 border-b border-border mb-1">
            Selectează categoria
          </p>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleSelect(cat.id)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left w-full",
                "hover:bg-accent hover:text-accent-foreground",
                category === cat.id && "bg-accent"
              )}
            >
              <span>{cat.icon}</span>
              <span className="font-medium">{cat.id}</span>
              <span className="text-xs text-muted-foreground">- {cat.description}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
