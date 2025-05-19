
import { useState } from 'react';
import { Equipment } from '@/types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AttributesEditor } from './Attributes';
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
import { OrganizationSelector } from '@/components/Organization/OrganizationSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

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
    organizations,
    selectedOrgId,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleAttributesChange,
    validate
  } = useEquipmentForm({ initialEquipment: equipment });
  
  // If we're editing, don't allow changing the organization
  const isEditing = !!equipment;
  
  // Check if selected organization is different from user's primary org
  const isExternalOrg = organizations.some(
    org => org.id === selectedOrgId && !org.is_primary
  );

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
          {organizations.length > 1 && !isEditing && (
            <div className="space-y-2">
              <Label htmlFor="org_id">Organization</Label>
              <OrganizationSelector
                organizations={organizations}
                selectedOrgId={selectedOrgId}
                onChange={(value) => handleSelectChange('org_id', value)}
                className="w-full"
                disabled={isEditing}
              />
            </div>
          )}
          
          {isExternalOrg && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You are creating equipment for an external organization where you have management access.
              </AlertDescription>
            </Alert>
          )}

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
              equipmentId={equipment?.id}
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
