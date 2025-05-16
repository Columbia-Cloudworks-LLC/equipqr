
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Settings, Package, Users, Home, QrCode, Building } from "lucide-react";
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
  
  // Check if a path is active (exact match or starts with for nested routes)
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className="bg-slate-800 border-r-slate-700">
      <SidebarHeader className="border-b-slate-700">
        <div className="flex items-center gap-2 px-2">
          <Package className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold text-white">equipqr</h1>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-3">
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
                    className="text-white hover:text-white hover:bg-slate-700"
                  >
                    <Link to={item.href}>
                      <SidebarMenuIcon>
                        <item.icon className="h-5 w-5" />
                      </SidebarMenuIcon>
                      <SidebarMenuText className="text-white">
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
        <SidebarGroup className="mt-2">
          <SidebarGroupLabel className="text-slate-400 mb-1">Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    tooltip={item.title}
                    active={isActive(item.href)}
                    className="text-white hover:text-white hover:bg-slate-700"
                  >
                    <Link to={item.href}>
                      <SidebarMenuIcon>
                        <item.icon className="h-5 w-5" />
                      </SidebarMenuIcon>
                      <SidebarMenuText className="text-white">
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
      
      <SidebarFooter className="border-t border-slate-700 p-3">
        <div className="text-xs text-slate-400 pl-2">
          <p>EquipQR v1.1</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
