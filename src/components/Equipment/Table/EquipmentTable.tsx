
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Equipment } from '@/types';
import { EquipmentTableRow } from './EquipmentTableRow';
import { EquipmentTableLoading } from './EquipmentTableLoading';

interface EquipmentTableProps {
  equipment: Equipment[];
  isLoading: boolean;
}

export function EquipmentTable({ equipment, isLoading }: EquipmentTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="hidden sm:table-cell">Model</TableHead>
            <TableHead className="hidden md:table-cell">Serial Number</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="hidden sm:table-cell">Team</TableHead>
            <TableHead className="hidden lg:table-cell">Organization</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <EquipmentTableLoading />
          ) : equipment.length > 0 ? (
            equipment.map((item) => (
              <EquipmentTableRow key={item.id} equipment={item} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                No equipment found matching the current filters
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
