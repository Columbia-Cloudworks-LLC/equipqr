
import React, { useState } from 'react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useEquipmentByOrganization } from '@/hooks/useSupabaseData';
import { usePermissions } from '@/hooks/usePermissions';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';
import EquipmentHeader from '@/components/equipment/EquipmentHeader';
import EquipmentFilters from '@/components/equipment/EquipmentFilters';
import EquipmentGrid from '@/components/equipment/EquipmentGrid';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';
import { filterEquipment } from '@/utils/equipmentHelpers';

const Equipment = () => {
  const { currentOrganization, isLoading: orgLoading } = useSimpleOrganization();
  const { data: equipment = [], isLoading: equipmentLoading } = useEquipmentByOrganization();
  const { canCreateEquipment } = usePermissions();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const isLoading = orgLoading || equipmentLoading;
  const canCreate = canCreateEquipment();

  if (!currentOrganization) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">
            Please select an organization to view equipment.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <EquipmentLoadingState />;
  }

  const filteredEquipment = filterEquipment(equipment, searchQuery, statusFilter);

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  return (
    <div className="space-y-6">
      <EquipmentHeader
        organizationName={currentOrganization.name}
        canCreate={canCreate}
        onAddEquipment={handleAddEquipment}
      />

      <EquipmentFilters
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      <EquipmentGrid
        equipment={filteredEquipment}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        organizationName={currentOrganization.name}
        canCreate={canCreate}
        onShowQRCode={setShowQRCode}
        onAddEquipment={handleAddEquipment}
      />

      {/* Equipment Form Modal */}
      <EquipmentForm 
        open={showForm} 
        onClose={handleCloseForm}
        equipment={editingEquipment}
      />

      {/* QR Code Modal */}
      {showQRCode && (
        <QRCodeDisplay
          equipmentId={showQRCode}
          open={!!showQRCode}
          onClose={() => setShowQRCode(null)}
        />
      )}
    </div>
  );
};

export default Equipment;
