import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  Settings,
  ClipboardList,
  Box,
  Users,
  UserPlus,
  Building,
  Factory,
  LayoutDashboard,
} from "lucide-react";
import { OrganizationSwitcher } from "@/components/layout/OrganizationSwitcher";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Building2 } from 'lucide-react';
import { useCustomersFeature } from '@/hooks/useCustomersFeature';

export function AppSidebar() {
  const { isEnabled: customersEnabled } = useCustomersFeature();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      queryClient.clear();
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const navigationItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
    },
    {
      title: "Work Orders",
      icon: ClipboardList,
      path: "/work-orders",
    },
    {
      title: "Equipment",
      icon: Box,
      path: "/equipment",
    },
    {
      title: "Teams",
      icon: Users,
      path: "/teams",
    },
    ...(customersEnabled ? [{
      title: "Customers",
      icon: Building2,
      path: "/customers",
      badge: "BETA"
    }] : []),
    {
      title: "Locations",
      icon: Building,
      path: "/locations",
    },
    {
      title: "Vendors",
      icon: Factory,
      path: "/vendors",
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-64 flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-2">
          <SheetTitle>EquipQR</SheetTitle>
          <SheetDescription>
            Manage your equipment and work orders.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex-1 px-1 py-4">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.title}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-secondary hover:text-accent-foreground ${
                      isActive
                        ? "bg-secondary text-accent-foreground"
                        : "text-muted-foreground"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.title}
                  {item.badge && (
                    <span className="ml-2 text-[0.7rem] font-bold px-1.5 py-0.5 rounded-md bg-secondary text-accent-foreground">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-border px-6 py-4">
          <OrganizationSwitcher />
        </div>
        <div className="border-t border-border p-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="https://github.com/shadcn.png" alt="Shadcn" />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm line-clamp-1">
                    {currentOrganization?.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentOrganization?.plan} Plan
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetContent>
    </Sheet>
  );
}
