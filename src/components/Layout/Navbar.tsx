
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationDropdown } from "@/components/Notifications/NotificationDropdown";

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          <SidebarTrigger className="lg:hidden" />
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
