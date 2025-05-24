
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
          <main className="flex-1 p-4 md:p-6 min-h-0">
            {children}
          </main>
          <footer className="border-t py-3 px-4 text-xs text-center text-muted-foreground bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0 mt-auto">
            <div className="flex justify-center gap-4 mb-1">
              <Link to="/terms" className="hover:text-primary hover:underline transition-colors">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-primary hover:underline transition-colors">Privacy Policy</Link>
            </div>
            <div>
              © {new Date().getFullYear()} Columbia Cloudworks LLC. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
