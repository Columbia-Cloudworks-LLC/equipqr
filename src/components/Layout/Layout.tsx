
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarProvider
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { NotificationsProvider } from '@/contexts/NotificationsContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <NotificationsProvider>
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex h-screen w-full bg-background">
          {/* AppSidebar will now be part of the flex layout on desktop */}
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-auto p-2 md:p-4">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </NotificationsProvider>
  );
}
