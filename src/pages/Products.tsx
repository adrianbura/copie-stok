import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductsTable } from '@/components/products/ProductsTable';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductDialog } from '@/components/products/ProductDialog';
import { useProducts, useDeleteProduct, useWarehouseProductStats } from '@/hooks/useProducts';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { useAuth } from '@/hooks/useAuth';
import { Product, PyroCategory } from '@/types';
import { Package, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Products() {
  const { selectedWarehouse } = useWarehouseContext();
  const { data: products, isLoading } = useProducts();
  const { warehouseStock } = useWarehouseProductStats(selectedWarehouse?.id);
  const deleteProduct = useDeleteProduct();
  const { canEdit, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PyroCategory | 'all'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Use warehouse-specific stock if warehouse is selected, otherwise use global products
  const displayProducts = useMemo(() => {
    if (selectedWarehouse?.id && warehouseStock) {
      // Map warehouse_stock to product format with warehouse-specific quantities
      return warehouseStock
        .filter((ws: any) => ws.product)
        .map((ws: any) => ({
          ...ws.product,
          quantity: ws.quantity,
          min_stock: ws.min_stock,
          location: ws.location || ws.product.location,
        }));
    }
    return products || [];
  }, [selectedWarehouse, warehouseStock, products]);

  const filteredProducts = useMemo(() => {
    return displayProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.supplier || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [displayProducts, searchQuery, selectedCategory]);

  const handleClearFilters = () => { setSearchQuery(''); setSelectedCategory('all'); };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct.mutateAsync(productToDelete.id);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Stoc Produse
          </h1>
          <p className="text-muted-foreground mt-1">Gestionează inventarul de produse pirotehnice</p>
        </div>

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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Se afișează <span className="font-semibold text-foreground">{filteredProducts.length}</span> din{' '}
            <span className="font-semibold text-foreground">{displayProducts.length}</span> produse
            {selectedWarehouse && <span className="ml-1">în {selectedWarehouse.name}</span>}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <ProductsTable 
            products={filteredProducts} 
            onEdit={canEdit ? handleEditProduct : undefined}
            onDelete={isAdmin ? handleDeleteClick : undefined}
          />
        ) : (
          <Card className="py-12">
            <CardContent className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Niciun produs găsit</h3>
              <p className="text-muted-foreground mt-1">
                Încearcă să modifici criteriile de căutare sau adaugă produse din secțiunea Intrări.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ProductDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        product={editingProduct} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare ștergere</AlertDialogTitle>
            <AlertDialogDescription>
              Sigur dorești să ștergi produsul "{productToDelete?.name}"? Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulare</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
