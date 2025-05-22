
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface OrganizationAlertProps {
  orgName: string;
  orgRole: string;
}

export function OrganizationAlert({ orgName, orgRole }: OrganizationAlertProps) {
  return (
    <Alert className="bg-blue-50 border-blue-200">
      <Info className="h-4 w-4" />
      <AlertTitle>External Organization</AlertTitle>
      <AlertDescription>
        You are managing teams in {orgName} where you have {orgRole} access.
      </AlertDescription>
    </Alert>
  );
}
