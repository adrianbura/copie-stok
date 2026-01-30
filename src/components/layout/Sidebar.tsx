import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileSpreadsheet,
  Bell,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  Warehouse,
  Database,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserSettingsDialog } from '@/components/settings/UserSettingsDialog';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Stoc Produse', href: '/products', icon: Package },
  { name: 'Intrări', href: '/entries', icon: ArrowDownToLine },
  { name: 'Ieșiri', href: '/exits', icon: ArrowUpFromLine },
  { name: 'Rapoarte', href: '/reports', icon: FileSpreadsheet },
  { name: 'Alerte', href: '/alerts', icon: Bell },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile, signOut, isAdmin } = useAuth();
  const { pendingCount } = usePendingApprovals();

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={cn(
        'h-full transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border',
        onNavigate ? 'w-full relative' : 'fixed left-0 top-0 z-40 h-screen',
        !onNavigate && (collapsed ? 'w-20' : 'w-64')
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3" onClick={handleNavClick}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-fire shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {(!collapsed || onNavigate) && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-sidebar-foreground">PyroStock</h1>
                <p className="text-xs text-sidebar-foreground/60">Management</p>
              </div>
            )}
          </Link>
          {!onNavigate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-scale-in')} />
                {(!collapsed || onNavigate) && <span className="animate-fade-in">{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin Section - only visible to admins */}
          {isAdmin && (
            <div className="mt-4 border-t border-sidebar-border pt-4 space-y-1">
              <Link
                to="/admin/users"
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                  location.pathname === '/admin/users'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Users className={cn('h-5 w-5 flex-shrink-0', location.pathname === '/admin/users' && 'animate-scale-in')} />
                {(!collapsed || onNavigate) && (
                  <span className="animate-fade-in flex items-center gap-2">
                    Utilizatori
                    {pendingCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                        {pendingCount}
                      </Badge>
                    )}
                  </span>
                )}
                {collapsed && !onNavigate && pendingCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
              
              <Link
                to="/admin/warehouses"
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  location.pathname === '/admin/warehouses'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Warehouse className={cn('h-5 w-5 flex-shrink-0', location.pathname === '/admin/warehouses' && 'animate-scale-in')} />
                {(!collapsed || onNavigate) && <span className="animate-fade-in">Depozite</span>}
              </Link>
              
              <Link
                to="/admin/backup"
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  location.pathname === '/admin/backup'
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Database className={cn('h-5 w-5 flex-shrink-0', location.pathname === '/admin/backup' && 'animate-scale-in')} />
                {(!collapsed || onNavigate) && <span className="animate-fade-in">Backup</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User Info & Actions */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* User Info */}
          <div className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5',
            collapsed ? 'justify-center' : ''
          )}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4 w-4 text-sidebar-foreground" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'Utilizator'}
                </p>
                <p className="text-xs text-sidebar-foreground/60">
                  {isAdmin ? 'Administrator' : 'Operator'}
                </p>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <Button
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && !onNavigate && 'justify-center px-0'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {(!collapsed || onNavigate) && <span>Setări</span>}
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={() => {
              signOut();
              if (onNavigate) onNavigate();
            }}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && !onNavigate && 'justify-center px-0'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {(!collapsed || onNavigate) && <span>Deconectare</span>}
          </Button>
        </div>

        <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </aside>
  );
}
