
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OrganizationSelector } from "@/components/Organization/OrganizationSelector";
import { User, Building, LogOut, Shield } from "lucide-react";

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { 
    organizations, 
    selectedOrganization, 
    selectOrganization
  } = useOrganization();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleOrganizationChange = (orgId: string) => {
    selectOrganization(orgId);
  };

  // Check if current user is an organization owner for admin access
  const isOrgOwner = selectedOrganization?.role === 'owner';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Organization Selector */}
        {organizations.length > 1 && (
          <>
            <div className="px-2 py-2">
              <div className="text-sm font-medium mb-2">Organization</div>
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrganization?.id}
                onChange={handleOrganizationChange}
                showRoleBadges={true}
                className="w-full"
                maxDisplayLength={30}
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/organization")}>
            <Building className="mr-2 h-4 w-4" />
            <span>Organization</span>
          </DropdownMenuItem>
          {isOrgOwner && (
            <DropdownMenuItem onClick={() => navigate("/admin/exemptions")}>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin: Exemptions</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
