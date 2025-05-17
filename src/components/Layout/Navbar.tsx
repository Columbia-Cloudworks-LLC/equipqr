
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationDropdown } from "@/components/Notifications/NotificationDropdown";
import { useSidebar } from "@/components/ui/sidebar/sidebar-context";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Replace container class with custom padding for better alignment */}
      <div className="flex w-full items-center justify-between px-4 md:pl-8 md:pr-6 lg:pl-8 lg:pr-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Only show the sidebar trigger on mobile */}
          {isMobile && <SidebarTrigger className="lg:hidden" />}
        </div>

        <div className="flex items-center gap-2">
          {user && <NotificationDropdown />}
          
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Log out
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Log in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
