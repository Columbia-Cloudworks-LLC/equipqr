
interface TeamEmptyStateProps {
  isEmpty: boolean;
}

export function TeamEmptyState({ isEmpty }: TeamEmptyStateProps) {
  if (!isEmpty) return null;
  
  return (
    <div className="text-center p-8 border rounded-md">
      <p className="text-gray-500">No team members found</p>
    </div>
  );
}
