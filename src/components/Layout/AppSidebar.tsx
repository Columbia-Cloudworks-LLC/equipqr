
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, Package, Users, Home, QrCode, Building, ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar/sidebar-group";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuIcon,
  SidebarMenuText,
} from "@/components/ui/sidebar/sidebar-menu";

import { useSidebar } from "@/components/ui/sidebar/sidebar-context";

// Navigation items for the sidebar
const mainNavItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Equipment",
    href: "/equipment",
    icon: Package,
  },
  {
    title: "Teams",
    href: "/team",
    icon: Users,
  },
  {
    title: "Scanner",
    href: "/scanner",
    icon: QrCode,
  },
];

const settingsNavItems = [
  {
    title: "Organization",
    href: "/settings/organization",
    icon: Building,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: Settings,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Check if a path is active (exact match or starts with for nested routes)
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="border-r-slate-700">
      <SidebarHeader className="border-b-slate-700">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {!isCollapsed && <h1 className="text-lg font-semibold text-white">equipqr</h1>}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md hover:bg-slate-700 text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 mb-1">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    active={isActive(item.href)}
                    className="text-white hover:text-white hover:bg-slate-700 h-9"
                  >
                    <Link to={item.href} className="flex items-center w-full">
                      <SidebarMenuIcon className="text-white">
                        <item.icon className="h-5 w-5" />
                      </SidebarMenuIcon>
                      <SidebarMenuText className="text-white whitespace-nowrap">
                        {item.title}
                      </SidebarMenuText>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Settings Navigation */}
        <SidebarGroup className="mt-1">
          <SidebarGroupLabel className="text-slate-400 mb-1">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    active={isActive(item.href)}
                    className="text-white hover:text-white hover:bg-slate-700 h-9"
                  >
                    <Link to={item.href} className="flex items-center w-full">
                      <SidebarMenuIcon className="text-white">
                        <item.icon className="h-5 w-5" />
                      </SidebarMenuIcon>
                      <SidebarMenuText className="text-white whitespace-nowrap">
                        {item.title}
                      </SidebarMenuText>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-3">
        <div className="text-xs text-slate-400 pl-2">
          <p>EquipQR v1.1</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
