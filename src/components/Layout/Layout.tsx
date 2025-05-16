
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarProvider
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto p-3 md:p-5">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
