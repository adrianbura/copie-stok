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
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { UserSettingsDialog } from '@/components/settings/UserSettingsDialog';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Stoc Produse', href: '/products', icon: Package },
  { name: 'Intrări', href: '/entries', icon: ArrowDownToLine },
  { name: 'Ieșiri', href: '/exits', icon: ArrowUpFromLine },
  { name: 'Rapoarte', href: '/reports', icon: FileSpreadsheet },
  { name: 'Alerte', href: '/alerts', icon: Bell },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { profile, signOut, isAdmin } = useAuth();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-fire shadow-glow">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in">
                <h1 className="text-lg font-bold text-sidebar-foreground">PyroStock</h1>
                <p className="text-xs text-sidebar-foreground/60">Management</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-glow'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'animate-scale-in')} />
                {!collapsed && <span className="animate-fade-in">{item.name}</span>}
              </Link>
            );
          })}
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
              collapsed && 'justify-center px-0'
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Setări</span>}
          </Button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            onClick={signOut}
            className={cn(
              'w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Deconectare</span>}
          </Button>
        </div>

        <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </aside>
  );
}
