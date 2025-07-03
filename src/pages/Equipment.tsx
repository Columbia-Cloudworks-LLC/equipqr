
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, QrCode, MapPin, Calendar, Package } from 'lucide-react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useEquipmentByOrganization } from '@/hooks/useSupabaseData';
import { usePermissions } from '@/hooks/usePermissions';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';
import { PageContainer } from '@/components/layout/PageContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/common/PageSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { ResponsiveGrid } from '@/components/common/ResponsiveGrid';

const Equipment = () => {
  const navigate = useNavigate();
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
      <PageContainer>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">
            Please select an organization to view equipment.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <LoadingState 
        title="Equipment" 
        description={currentOrganization ? `Loading equipment for ${currentOrganization.name}` : "Loading..."}
        type="cards"
        count={6}
      />
    );
  }



  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
    <PageContainer>
      <PageHeader
        title="Equipment"
        description={`Manage equipment for ${currentOrganization.name}`}
        primaryAction={canCreate ? {
          icon: Plus,
          label: "Add Equipment",
          props: { onClick: handleAddEquipment, className: "flex items-center gap-2" }
        } : undefined}
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredEquipment.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>
                    {item.manufacturer} {item.model}
                  </CardDescription>
                </div>
                <StatusBadge status={item.status} type="equipment" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Serial:</span>
                  <span className="text-muted-foreground">{item.serialNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.location}</span>
                </div>
                {item.lastMaintenance && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Last maintenance: {new Date(item.lastMaintenance).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowQRCode(item.id)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/equipment/${item.id}`)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <EmptyState
          icon={Package}
          title="No equipment found"
          description={
            searchQuery || statusFilter !== 'all' 
              ? 'No equipment matches your current filters.' 
              : `Get started by adding your first piece of equipment to ${currentOrganization.name}.`
          }
          primaryAction={(!searchQuery && statusFilter === 'all' && canCreate) ? {
            icon: Plus,
            label: "Add Equipment",
            props: { onClick: handleAddEquipment }
          } : undefined}
        />
      )}

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
    </PageContainer>
  );
};

export default Equipment;
