
import React, { useState } from 'react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useEquipmentFiltering } from '@/hooks/useEquipmentFiltering';
import type { EquipmentRecord } from '@/types/equipment';

import EquipmentForm from '@/components/equipment/EquipmentForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';
import EquipmentHeader from '@/components/equipment/EquipmentHeader';
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters';
import EquipmentSortHeader from '@/components/equipment/EquipmentSortHeader';
import EquipmentGrid from '@/components/equipment/EquipmentGrid';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';

const Equipment = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { canCreateEquipment } = usePermissions();
  
  // Use the new enhanced filtering hook with explicit organization ID
  const {
    filters,
    sortConfig,
    showAdvancedFilters,
    filteredAndSortedEquipment,
    filterOptions,
    isLoading,
    hasActiveFilters,
    equipment,
    updateFilter,
    updateSort,
    clearFilters,
    applyQuickFilter,
    setShowAdvancedFilters
  } = useEquipmentFiltering(currentOrganization?.id);
  
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentRecord | null>(null);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);

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

  const handleAddEquipment = () => {
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEditEquipment = (equipment: EquipmentRecord) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  // Equipment data comes from the filtering hook

  return (
    <div className="space-y-6">
      <EquipmentHeader
        organizationName={currentOrganization.name}
        canCreate={canCreate}
        onAddEquipment={handleAddEquipment}
      />

      <EquipmentFilters
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        onQuickFilter={applyQuickFilter}
        filterOptions={filterOptions}
        hasActiveFilters={hasActiveFilters}
      />

      <EquipmentSortHeader
        sortConfig={sortConfig}
        onSortChange={updateSort}
        resultCount={filteredAndSortedEquipment.length}
        totalCount={equipment.length}
      />

      <EquipmentGrid
        equipment={filteredAndSortedEquipment}
        searchQuery={filters.search}
        statusFilter={filters.status}
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
          equipmentName={equipment.find(eq => eq.id === showQRCode)?.name}
        />
      )}
    </div>
  );
};

export default Equipment;
