import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useWarehouseContext } from '@/hooks/useWarehouse';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedWarehouse, clearSelection } = useWarehouseContext();
  const navigate = useNavigate();

  const handleChangeWarehouse = () => {
    clearSelection();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border bg-sidebar flex items-center px-4 justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-sidebar-foreground"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="ml-3 text-lg font-bold text-sidebar-foreground">PyroStock</span>
          </div>
          {selectedWarehouse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChangeWarehouse}
              className="gap-1.5 text-xs text-sidebar-foreground/80 hover:text-sidebar-foreground"
            >
              <Warehouse className="h-3.5 w-3.5" />
              {selectedWarehouse.code}
            </Button>
          )}
        </header>
      )}

      {/* Mobile Sidebar Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      <main className={cn(
        'transition-all duration-300',
        isMobile ? 'pt-14' : 'pl-64'
      )}>
        {/* Warehouse indicator for desktop */}
        {!isMobile && selectedWarehouse && (
          <div className="border-b border-border bg-muted/30 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Warehouse className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Depozit activ:</span>
              <span className="font-medium">{selectedWarehouse.name}</span>
              <span className="text-xs text-muted-foreground">({selectedWarehouse.code})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleChangeWarehouse}
              className="text-xs"
            >
              Schimbă depozitul
            </Button>
          </div>
        )}
        <div className="container mx-auto p-4 md:p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
