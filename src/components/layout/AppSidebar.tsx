
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Home, 
  Package, 
  ClipboardList, 
  Users, 
  Map, 
  Building,
  QrCode,
  CreditCard,
  Settings,
  FileText,
  ChevronUp,
  LogOut,
  User
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import OrganizationSwitcher from "@/components/organization/OrganizationSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import Icon from "@/components/ui/Icon";

const mainNavigation = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Equipment", url: "/equipment", icon: Package },
  { title: "Work Orders", url: "/work-orders", icon: ClipboardList },
  { title: "Teams", url: "/teams", icon: Users },
  { title: "Fleet Map", url: "/fleet-map", icon: Map },
];

const managementNavigation = [
  { title: "Organization", url: "/organization", icon: Building },
  { title: "QR Scanner", url: "/scanner", icon: QrCode },
  { title: "Billing", url: "/billing", icon: CreditCard },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { currentUser } = useUser();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-3 sm:p-4">
        <div className="flex items-center gap-2 px-1 sm:px-2 py-1 sm:py-2">
          <Icon size="sm" className="sm:w-6 sm:h-6" />
          <span className="font-semibold text-base sm:text-lg">EquipQR</span>
        </div>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent className="px-2 sm:px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-sm"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className="text-sm"
                  >
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 sm:p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <User className="size-3 sm:size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-xs sm:text-sm leading-tight min-w-0">
                    <span className="truncate font-semibold">
                      {currentUser?.name || 'User'}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentUser?.email || ''}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-3 sm:size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
