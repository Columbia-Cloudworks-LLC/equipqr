
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

export function EquipmentTableLoading() {
  return (
    <>
      {Array(5).fill(0).map((_, idx) => (
        <TableRow key={`loading-${idx}`}>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-16" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
