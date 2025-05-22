
import { Skeleton } from "@/components/ui/skeleton";

export function AuthLoadingState() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
