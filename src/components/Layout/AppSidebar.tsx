
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
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
import { Button } from '@/components/ui/button';

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
}

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  
  const items: SidebarItem[] = [
    { title: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
    { title: 'Equipment', href: '/equipment', icon: Package },
    { title: 'Team', href: '/team', icon: Users },
    { title: 'QR Scanner', href: '/scanner', icon: QrCode },
    { title: 'Organization', href: '/settings/organization', icon: Building, exact: true },
    { title: 'Settings', href: '/settings', icon: Settings, exact: true },
  ];

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
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-16 items-center px-4">
          {!collapsed && (
            <NavLink to="/" className="flex items-center">
              <span className="text-xl font-bold text-primary">EquipQR</span>
            </NavLink>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={isItemActive(item)}
                    tooltip={collapsed ? item.title : undefined}
                    asChild
                  >
                    <NavLink to={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button 
          variant="ghost" 
          size="icon"
          className="w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={toggleSidebar}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
