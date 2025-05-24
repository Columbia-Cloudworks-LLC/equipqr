
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarProvider
} from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Navbar } from './Navbar';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex w-full min-h-screen bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-h-screen">
          <Navbar />
          <main className="flex-1 p-2 md:p-4 overflow-auto">
            {children}
          </main>
          <footer className="border-t py-2 px-4 text-xs text-center text-muted-foreground bg-background/80 flex-shrink-0">
            <div className="flex justify-center gap-4">
              <Link to="/terms" className="hover:text-primary hover:underline">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
            </div>
            <div className="mt-1">
              © {new Date().getFullYear()} Columbia Cloudworks LLC. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
