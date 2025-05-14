
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  QrCode, 
  ChevronRight, 
  ChevronLeft,
  Building
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  // Add exact prop to determine if path should be exact match
  exact?: boolean;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const handleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const items: SidebarItem[] = [
    { title: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
    { title: 'Equipment', href: '/equipment', icon: Package },
    { title: 'Team', href: '/team', icon: Users },
    { title: 'QR Scanner', href: '/scanner', icon: QrCode },
    { title: 'Organization', href: '/settings/organization', icon: Building, exact: true },
    { title: 'Settings', href: '/settings', icon: Settings, exact: true },
  ];

  if (!isOpen) {
    return null;
  }

  // Custom isActive function to handle exact path matching
  const isItemActive = (item: SidebarItem): boolean => {
    if (item.exact) {
      return location.pathname === item.href;
    }
    // For non-exact items, check if the path starts with the href
    // but make sure it's not matching organization when on settings and vice versa
    if (item.href === '/settings' && location.pathname.startsWith('/settings/organization')) {
      return false;
    }
    return location.pathname.startsWith(item.href);
  };

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <NavLink to="/" className="flex items-center">
            <span className="text-xl font-bold text-primary">EquipQR</span>
          </NavLink>
        )}
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {items.map((item, index) => (
            <NavLink
              key={index}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isItemActive(item) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'transparent',
                  collapsed ? 'justify-center px-0' : ''
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          ))}
        </nav>
      </ScrollArea>
      <div className="border-t border-sidebar-border p-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={handleCollapse}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;

