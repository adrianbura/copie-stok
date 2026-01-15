import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CATEGORIES, PyroCategory } from '@/types';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface ProductFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: PyroCategory | 'all';
  onCategoryChange: (value: PyroCategory | 'all') => void;
  onClearFilters: () => void;
}

export function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onClearFilters,
}: ProductFiltersProps) {
  const hasFilters = searchQuery !== '' || selectedCategory !== 'all';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Caută după nume, cod sau furnizor..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        value={selectedCategory}
        onValueChange={(value) => onCategoryChange(value as PyroCategory | 'all')}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Toate categoriile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate categoriile</SelectItem>
          {CATEGORIES.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <span className="flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="outline" onClick={onClearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Resetează
        </Button>
      )}
    </div>
  );
}
