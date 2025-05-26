
import { RoleInfoTooltip } from '@/components/ui/RoleInfoTooltip';

interface TeamListHeaderProps {
  isViewOnly?: boolean;
}

export function TeamListHeader({ isViewOnly = false }: TeamListHeaderProps) {
  return (
    <div className="bg-muted/50 px-4 py-3 border-b">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Team Members</h3>
        {!isViewOnly && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Role</span>
            <RoleInfoTooltip type="team" />
          </div>
        )}
      </div>
    </div>
  );
}
