
interface TeamManagementHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export function TeamManagementHeader({
  onRefresh,
  isLoading
}: TeamManagementHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="text-2xl font-bold mb-1">Team Management</h1>
        <p className="text-muted-foreground">
          Create and manage teams for your organization
        </p>
      </div>
    </div>
  );
}
