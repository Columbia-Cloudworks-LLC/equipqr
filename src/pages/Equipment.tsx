
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, QrCode, MapPin, Calendar } from 'lucide-react';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import QRCodeDisplay from '@/components/equipment/QRCodeDisplay';

const Equipment = () => {
  const [showForm, setShowForm] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock equipment data - will be replaced with real data
  const equipment = [
    {
      id: '1',
      name: 'Forklift FL-001',
      manufacturer: 'Toyota',
      model: 'FG25',
      serialNumber: 'TY2023FL001',
      status: 'active',
      location: 'Warehouse A',
      installationDate: '2023-01-15',
      warrantyExpiration: '2026-01-15',
      lastMaintenance: '2024-05-15',
      notes: 'Recently serviced, good condition'
    },
    {
      id: '2',
      name: 'Generator GN-045',
      manufacturer: 'Caterpillar',
      model: 'C18',
      serialNumber: 'CAT2023GN045',
      status: 'maintenance',
      location: 'Maintenance Bay 2',
      installationDate: '2022-08-20',
      warrantyExpiration: '2025-08-20',
      lastMaintenance: '2024-05-20',
      notes: 'Scheduled for preventive maintenance'
    },
    {
      id: '3',
      name: 'Excavator EX-102',
      manufacturer: 'John Deere',
      model: '320E',
      serialNumber: 'JD2024EX102',
      status: 'active',
      location: 'Construction Site B',
      installationDate: '2024-03-10',
      warrantyExpiration: '2027-03-10',
      lastMaintenance: '2024-05-10',
      notes: 'New equipment, excellent condition'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">Manage your fleet equipment and assets</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

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
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
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
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Last maintenance: {new Date(item.lastMaintenance).toLocaleDateString()}
                  </span>
                </div>
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
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' 
                ? 'No equipment matches your current filters.' 
                : 'Get started by adding your first piece of equipment.'}
            </p>
            {(!searchQuery && statusFilter === 'all') && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Equipment Form Modal */}
      <EquipmentForm 
        open={showForm} 
        onClose={() => setShowForm(false)} 
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
