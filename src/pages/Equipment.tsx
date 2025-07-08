
import React, { useState } from 'react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useEquipmentFiltering } from '@/hooks/useEquipmentFiltering';
import { useEquipmentByOrganization } from '@/hooks/useSupabaseData';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';
import EquipmentHeader from '@/components/equipment/EquipmentHeader';
import EnhancedEquipmentFilters from '@/components/equipment/EnhancedEquipmentFilters';
import EquipmentSortHeader from '@/components/equipment/EquipmentSortHeader';
import EquipmentInsights from '@/components/equipment/EquipmentInsights';
import EquipmentGrid from '@/components/equipment/EquipmentGrid';
import EquipmentLoadingState from '@/components/equipment/EquipmentLoadingState';

const Equipment = () => {
  const { currentOrganization } = useSimpleOrganization();
  const { canCreateEquipment } = usePermissions();
  
  // Use the new enhanced filtering hook
  const {
    filters,
    sortConfig,
    showAdvancedFilters,
    filteredAndSortedEquipment,
    filterOptions,
    isLoading,
    hasActiveFilters,
    updateFilter,
    updateSort,
    clearFilters,
    applyQuickFilter,
    setShowAdvancedFilters
  } = useEquipmentFiltering();
  
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
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

  const handleEditEquipment = (equipment: any) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEquipment(null);
  };

  // Get all equipment for insights (unfiltered)
  const allEquipment = useEquipmentByOrganization().data || [];

  return (
    <div className="space-y-6">
      <EquipmentHeader
        organizationName={currentOrganization.name}
        canCreate={canCreate}
        onAddEquipment={handleAddEquipment}
      />

      <EnhancedEquipmentFilters
        filters={filters}
        showAdvancedFilters={showAdvancedFilters}
        hasActiveFilters={hasActiveFilters}
        filterOptions={filterOptions}
        onFilterChange={updateFilter}
        onToggleAdvanced={() => setShowAdvancedFilters(!showAdvancedFilters)}
        onClearFilters={clearFilters}
        onQuickFilter={applyQuickFilter}
      />

      <EquipmentInsights 
        equipment={allEquipment}
        filteredEquipment={filteredAndSortedEquipment}
      />

      <EquipmentSortHeader
        sortConfig={sortConfig}
        onSortChange={updateSort}
        resultCount={filteredAndSortedEquipment.length}
        totalCount={allEquipment.length}
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
        />
      )}
    </div>
  );
};

export default Equipment;
