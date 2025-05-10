
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Equipment, EquipmentAttribute } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { AttributesEditor } from './AttributesEditor';
import { getTeams } from '@/services/teamService';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSave: (equipment: Partial<Equipment>) => void;
  isLoading?: boolean;
}

export function EquipmentForm({ equipment, onSave, isLoading = false }: EquipmentFormProps) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<{id: string; name: string}[]>([]);
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: equipment?.name || '',
    model: equipment?.model || '',
    serial_number: equipment?.serial_number || '',
    manufacturer: equipment?.manufacturer || '',
    status: equipment?.status || 'active',
    location: equipment?.location || '',
    install_date: equipment?.install_date || '',
    warranty_expiration: equipment?.warranty_expiration || '',
    notes: equipment?.notes || '',
    team_id: equipment?.team_id || '',
    attributes: equipment?.attributes || []
  });

  useEffect(() => {
    // Fetch teams for the dropdown
    const fetchTeams = async () => {
      try {
        const fetchedTeams = await getTeams();
        setTeams(fetchedTeams.map(team => ({ id: team.id, name: team.name })));
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast.error("Error loading teams");
      }
    };
    
    fetchTeams();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributesChange = (attributes: EquipmentAttribute[]) => {
    setFormData((prev) => ({ ...prev, attributes }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name) {
      toast.error('Please enter equipment name');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{equipment ? 'Edit Equipment' : 'Add New Equipment'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Equipment Name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                placeholder="Manufacturer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Model Number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="Serial Number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="install_date">Install Date</Label>
              <Input
                id="install_date"
                name="install_date"
                type="date"
                value={formData.install_date}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="warranty_expiration">Warranty Expiration</Label>
              <Input
                id="warranty_expiration"
                name="warranty_expiration"
                type="date"
                value={formData.warranty_expiration}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Where is this equipment located"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_id">Team</Label>
              <Select 
                value={formData.team_id || ''} 
                onValueChange={(value) => handleSelectChange('team_id', value)}
              >
                <SelectTrigger id="team_id">
                  <SelectValue placeholder="Select team (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No team</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional information about this equipment"
              rows={4}
            />
          </div>
          
          {/* Custom Attributes Section */}
          <div className="pt-4 border-t">
            <AttributesEditor 
              attributes={formData.attributes || []} 
              onChange={handleAttributesChange}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : equipment ? 'Update Equipment' : 'Add Equipment'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

export default EquipmentForm;
