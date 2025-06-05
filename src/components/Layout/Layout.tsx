import React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

import {
  BellIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  LayoutDashboardIcon,
  ListChecks,
  LucideIcon,
  MessageSquareIcon,
  Plus,
  Settings,
  TagIcon,
  UserIcon,
  Users,
} from "lucide-react"
import { UserMenu } from '../UserMenu';
import { NotificationDropdown } from '../NotificationDropdown';
import { SidebarProvider, SidebarInset } from '@/contexts/SidebarContext';
import AppSidebar from '../AppSidebar';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PrivacyBanner } from '@/components/Privacy/PrivacyBanner';

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
