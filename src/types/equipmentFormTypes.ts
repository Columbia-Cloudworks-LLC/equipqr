// Equipment form specific types
export interface CustomAttributeData {
  [key: string]: string | number | boolean | null;
}

export interface LocationData {
  latitude?: number;
  longitude?: number;
  address?: string;
  building?: string;
  floor?: string;
  room?: string;
  coordinates?: [number, number];
}

export interface EquipmentFormEquipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  installation_date: string;
  warranty_expiration?: string;
  last_maintenance?: string;
  notes: string;
  custom_attributes?: CustomAttributeData;
  image_url?: string;
  last_known_location?: LocationData;
  team_id?: string;
}