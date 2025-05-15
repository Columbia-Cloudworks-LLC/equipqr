
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Location</TableHead>
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
