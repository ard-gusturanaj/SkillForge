import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  User as UserIcon, 
  Bell, 
  LogOut,
  Menu,
  X,
  Zap
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGetNotifications } from '@workspace/api-client-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  active?: boolean;
  onClick?: () => void;
}

function SidebarItem({ icon: Icon, label, href, badge, active, onClick }: SidebarItemProps) {
  return (
    <Link href={href} className={cn(
      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-primary/10 text-primary font-medium" 
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
    )} onClick={onClick}>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5 transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
        <span>{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch notifications to get unread count
  const { data: notifications } = useGetNotifications({
    query: {
      queryKey: ['notifications'],
      enabled: !!user
    }
  });
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Briefcase, label: 'Projects', href: '/projects' },
    { icon: Users, label: 'Developers', href: '/developers' },
    { icon: UserIcon, label: 'My Profile', href: '/profile' },
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: unreadCount },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-background flex w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground tracking-tight">
              Skill<span className="text-primary">Forge</span>
            </span>
          </Link>
          <button className="lg:hidden text-muted-foreground" onClick={() => setIsMobileOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href))}
              onClick={() => setIsMobileOpen(false)}
            />
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
            <Avatar>
              <AvatarImage src={user.avatarUrl || ''} />
              <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-display font-bold">SkillForge</span>
          </div>
          <button 
            className="p-2 -mr-2 text-foreground"
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
