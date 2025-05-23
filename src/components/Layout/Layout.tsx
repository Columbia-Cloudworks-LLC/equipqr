
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
      <div className="flex h-screen w-full bg-background">
        {/* AppSidebar will now be part of the flex layout on desktop */}
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className={`flex-1 p-2 md:p-4 ${isMobile ? 'overflow-y-auto' : 'overflow-auto'}`}>
            {children}
          </main>
          <footer className="border-t py-2 px-4 text-xs text-center text-muted-foreground bg-background/80">
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
