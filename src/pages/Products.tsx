import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductFilters } from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { mockProducts } from '@/data/mockData';
import { PyroCategory, Product } from '@/types';
import { Plus, Upload, Download, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PyroCategory | 'all'>('all');

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.supplier.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              Stoc Produse
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestionează inventarul de produse pirotehnice
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button className="gap-2 gradient-fire text-white border-0 shadow-glow">
              <Plus className="h-4 w-4" />
              Produs Nou
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filtre</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onClearFilters={handleClearFilters}
            />
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Se afișează{' '}
            <span className="font-semibold text-foreground">
              {filteredProducts.length}
            </span>{' '}
            din{' '}
            <span className="font-semibold text-foreground">
              {mockProducts.length}
            </span>{' '}
            produse
          </p>
        </div>

        {/* Table */}
        {filteredProducts.length > 0 ? (
          <ProductsTable products={filteredProducts} />
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Niciun produs găsit</h3>
              <p className="text-muted-foreground mt-1">
                Încearcă să modifici criteriile de căutare sau adaugă un produs nou.
              </p>
              <Button className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Adaugă Produs
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
