interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: string;
  location: string;
  lastMaintenance?: string;
  image_url?: string;
}

export const getStatusColor = (status: string): string => {
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

export const filterEquipment = (
  equipment: Equipment[],
  searchQuery: string,
  statusFilter: string
): Equipment[] => {
  return equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
};