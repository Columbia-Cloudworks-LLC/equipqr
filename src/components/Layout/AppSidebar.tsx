
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { Package, Users, Home, Map } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { AppConfig } from "@/config/app";

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
    title: "Fleet Map",
    href: "/fleet-map",
    icon: Map,
  },
  {
    title: "Teams",
    href: "/teams",
    icon: Users,
  },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed" && !isMobile;
  
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
        <div className="flex items-center gap-2 px-2 w-full">
          <Package className="h-6 w-6 text-primary shrink-0" />
          {!isCollapsed && <h1 className="text-lg font-semibold text-white truncate">{AppConfig.name}</h1>}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="py-2 px-1">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 mb-1">
            Navigation
          </SidebarGroupLabel>
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
                    <Link to={item.href} className="flex items-center w-full">
                      <SidebarMenuIcon>
                        <item.icon className="h-5 w-5" />
                      </SidebarMenuIcon>
                      <SidebarMenuText>
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
        <div className={cn("text-xs text-slate-400 mb-6", isCollapsed ? "text-center" : "")}>
          {isCollapsed ? (
            <p className="truncate">{AppConfig.version}</p>
          ) : (
            <p>{AppConfig.name} {AppConfig.version}</p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
