
import { useState } from 'react';
import { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AttributesEditor } from './AttributesEditor';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { useEquipmentForm } from './Form/useEquipmentForm';
import { BasicInfoFields } from './Form/BasicInfoFields';
import { DateFields } from './Form/DateFields';
import { StatusLocationFields } from './Form/StatusLocationFields';
import { NotesField } from './Form/NotesField';
import { EnhancedTeamSelector } from './Form/TeamSelector';
import { Label } from '@/components/ui/label';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSave: (equipment: Partial<Equipment>) => void;
  isLoading?: boolean;
}

export function EquipmentForm({ equipment, onSave, isLoading = false }: EquipmentFormProps) {
  const {
    formData,
    teams,
    teamsLoading,
    teamsError,
    selectedTeamIsExternal,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleAttributesChange,
    validate
  } = useEquipmentForm({ initialEquipment: equipment });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
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
            {/* Basic Info Fields */}
            <BasicInfoFields
              name={formData.name || ''}
              manufacturer={formData.manufacturer || ''}
              model={formData.model || ''}
              serialNumber={formData.serial_number || ''}
              onChange={handleChange}
            />
            
            {/* Date Fields */}
            <DateFields
              installDate={formData.install_date || ''}
              warrantyExpiration={formData.warranty_expiration || ''}
              onChange={handleDateChange}
            />
            
            {/* Status and Location Fields */}
            <StatusLocationFields
              status={formData.status || 'active'}
              location={formData.location || ''}
              onStatusChange={(value) => handleSelectChange('status', value)}
              onLocationChange={handleChange}
            />

            {/* Team Selector */}
            <div className="space-y-2">
              <Label htmlFor="team_id">Team</Label>
              <EnhancedTeamSelector 
                teams={teams} 
                value={formData.team_id || 'none'}
                onChange={(value) => handleSelectChange('team_id', value)}
              />
            </div>
          </div>
          
          {/* Notes Field */}
          <NotesField 
            notes={formData.notes || ''} 
            onChange={handleChange} 
          />
          
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
            onClick={() => window.history.back()}
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
