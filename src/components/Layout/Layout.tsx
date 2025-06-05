
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PrivacyBanner } from '@/components/Privacy/PrivacyBanner';
import { useSidebar } from '@/components/ui/sidebar/sidebar-context';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar/sidebar-context';
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar/sidebar-components';
import { SidebarTrigger } from '@/components/ui/sidebar/sidebar-trigger';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Simple UserMenu component
function UserMenu() {
  return (
    <Button variant="ghost" size="icon">
      <User className="h-5 w-5" />
    </Button>
  );
}

// Simple NotificationDropdown component
function NotificationDropdown() {
  return (
    <Button variant="ghost" size="icon">
      <Bell className="h-5 w-5" />
    </Button>
  );
}

// Simple AppSidebar component
function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-3 py-2">
          <h2 className="text-lg font-semibold">EquipQR</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <div className="px-3 py-2">
          <p className="text-sm text-muted-foreground">Navigation</p>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">Footer</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto flex items-center space-x-4">
              <NotificationDropdown />
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 p-4">
            {children}
          </main>
        </SidebarInset>
      </div>
      <PrivacyBanner />
    </SidebarProvider>
  );
}
