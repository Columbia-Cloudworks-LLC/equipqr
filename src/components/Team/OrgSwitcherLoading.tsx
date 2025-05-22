
import { Loader2 } from "lucide-react";

export function OrgSwitcherLoading() {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">Switching organization...</p>
      <p className="text-sm text-muted-foreground">Please wait while we load your teams</p>
    </div>
  );
}
