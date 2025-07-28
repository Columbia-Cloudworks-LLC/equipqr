
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
  User,
  HelpCircle
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { isLightColor } from "@/lib/utils";
import OrganizationSwitcher from "@/components/organization/OrganizationSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { useSimpleOrganization } from "@/contexts/SimpleOrganizationContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebar } from "@/components/ui/sidebar";
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
  const { currentOrganization } = useSimpleOrganization();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Get organization branding
  const orgBackgroundColor = currentOrganization?.backgroundColor;
  const hasCustomBranding = orgBackgroundColor && orgBackgroundColor !== '#ffffff';
  const isLightBrand = hasCustomBranding ? isLightColor(orgBackgroundColor) : true;

  // Dynamic styles for branded sidebar
  const sidebarStyle = hasCustomBranding ? {
    backgroundColor: orgBackgroundColor,
  } : {};

  const textColorClass = hasCustomBranding 
    ? (isLightBrand ? 'text-gray-900' : 'text-white')
    : '';

  const mutedTextColorClass = hasCustomBranding 
    ? (isLightBrand ? 'text-gray-600' : 'text-gray-300')
    : '';

  const hoverBackgroundClass = hasCustomBranding
    ? (isLightBrand ? 'hover:bg-black/10' : 'hover:bg-white/20')
    : '';

  const activeBackgroundClass = hasCustomBranding
    ? (isLightBrand ? 'bg-black/15' : 'bg-white/25')
    : '';

  return (
    <Sidebar variant="inset">
      <div 
        className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
        style={sidebarStyle}
      >
        <SidebarHeader className="p-3 sm:p-4">
          <div className={cn("flex items-center gap-2 px-1 sm:px-2 py-1 sm:py-2", textColorClass)}>
            <Icon size="sm" className="sm:w-6 sm:h-6" />
            <span className="font-semibold text-base sm:text-lg">EquipQR</span>
          </div>
          <OrganizationSwitcher />
        </SidebarHeader>
        
        <SidebarContent className="px-2 sm:px-3">
          <SidebarGroup>
            <SidebarGroupLabel className={cn("text-xs", mutedTextColorClass)}>
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavigation.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={cn(
                          "text-sm transition-colors",
                          textColorClass,
                          hasCustomBranding ? '' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          hoverBackgroundClass,
                          isActive && hasCustomBranding ? activeBackgroundClass : '',
                          isActive && hasCustomBranding ? 'font-medium' : '',
                          isActive && !hasCustomBranding ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : ''
                        )}
                      >
                        <Link to={item.url} onClick={handleNavClick}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          
          <SidebarGroup>
            <SidebarGroupLabel className={cn("text-xs", mutedTextColorClass)}>
              Management
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementNavigation.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild
                        className={cn(
                          "text-sm transition-colors",
                          textColorClass,
                          hasCustomBranding ? '' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                          hoverBackgroundClass,
                          isActive && hasCustomBranding ? activeBackgroundClass : '',
                          isActive && hasCustomBranding ? 'font-medium' : '',
                          isActive && !hasCustomBranding ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : ''
                        )}
                      >
                        <Link to={item.url} onClick={handleNavClick}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
                    className={cn(
                      "transition-colors",
                      textColorClass,
                      hasCustomBranding ? '' : 'data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground',
                      hasCustomBranding && isLightBrand ? 'data-[state=open]:bg-black/10' : '',
                      hasCustomBranding && !isLightBrand ? 'data-[state=open]:bg-white/20' : ''
                    )}
                  >
                    <div className={cn(
                      "flex aspect-square size-6 sm:size-8 items-center justify-center rounded-lg",
                      hasCustomBranding 
                        ? (isLightBrand ? 'bg-black/20 text-gray-900' : 'bg-white/20 text-white')
                        : 'bg-sidebar-primary text-sidebar-primary-foreground'
                    )}>
                      <User className="size-3 sm:size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-xs sm:text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold">
                        {currentUser?.name || 'User'}
                      </span>
                      <span className={cn(
                        "truncate text-xs",
                        hasCustomBranding ? mutedTextColorClass : 'text-muted-foreground'
                      )}>
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
                  <DropdownMenuItem asChild>
                    <Link to="/support" onClick={handleNavClick} className="text-sm cursor-pointer">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Support
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-sm">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  );
};

export default AppSidebar;
