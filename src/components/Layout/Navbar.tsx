
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NavbarProps {
  onToggleSidebar: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user, signOut, checkSession } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      
      // First check if we have a valid session
      const hasValidSession = await checkSession();
      console.log("Navbar: Session check before logout:", hasValidSession);
      
      if (!hasValidSession) {
        console.log("Navbar: No valid session found, clearing local state");
        // If no valid session, just show success message and let AuthContext
        // handle the cleanup in the signOut function
      }
      
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Navbar: Sign out error", error);
      toast.error("There was a problem signing out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const displayName = user?.user_metadata?.display_name || 
                      user?.email?.split('@')[0] || 
                      'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
        {!isSearchOpen && (
          <div className="hidden md:flex">
            <Link to="/" className="font-semibold text-xl">
              EquipQR
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                disabled={isLoggingOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
