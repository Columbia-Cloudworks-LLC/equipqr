
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

export function EquipmentTableLoading() {
  return (
    <>
      {Array(5).fill(0).map((_, idx) => (
        <TableRow key={`loading-${idx}`} className="animate-pulse">
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-full" /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
