import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Product, CATEGORIES } from '@/types';
import { CategoryBadge } from '@/components/ui/category-badge';

interface ProductSearchSelectProps {
  products: Product[] | undefined;
  value: string;
  onSelect: (productId: string) => void;
  placeholder?: string;
  showStock?: boolean;
  disabled?: boolean;
}

export function ProductSearchSelect({
  products,
  value,
  onSelect,
  placeholder = 'Selectează produsul',
  showStock = false,
  disabled = false,
}: ProductSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedProduct = products?.find((p) => p.id === value);

  // Filter products based on search query (matches anywhere in name or code)
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const handleSelect = (productId: string) => {
    onSelect(productId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedProduct ? (
            <span className="flex items-center gap-2 truncate">
              <span className="font-mono text-xs">{selectedProduct.code}</span>
              <span className="truncate">{selectedProduct.name}</span>
              {showStock && (
                <span className="text-muted-foreground">
                  ({selectedProduct.quantity} buc)
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Caută după nume sau cod..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery ? 'Niciun produs găsit.' : 'Nu există produse.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts.map((product) => {
                const category = CATEGORIES.find((c) => c.id === product.category);
                return (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product.id)}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === product.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-mono text-xs text-muted-foreground">
                      {product.code}
                    </span>
                    <span className="flex-1 truncate">{product.name}</span>
                    <CategoryBadge category={product.category} size="sm" />
                    {showStock && (
                      <span
                        className={cn(
                          'text-xs',
                          product.quantity <= product.min_stock
                            ? 'text-warning'
                            : 'text-muted-foreground'
                        )}
                      >
                        {product.quantity} buc
                      </span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
