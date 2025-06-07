
import { Equipment } from '@/types';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useEquipmentForm } from './Form/useEquipmentForm';
import { BasicInfoFields } from './Form/BasicInfoFields';
import { DateFields } from './Form/DateFields';
import { StatusLocationFields } from './Form/StatusLocationFields';
import { NotesField } from './Form/NotesField';
import { EnhancedTeamSelector } from './Form/TeamSelector';
import { Label } from '@/components/ui/label';
import { AttributesEditor } from './Attributes';
import { FormFooter } from './Form/FormFooter';
import { LoadingState } from './Form/LoadingState';
import { ErrorState } from './Form/ErrorState';
import { OrganizationSection } from './Form/OrganizationSection';
import { DraftRestorationAlert } from './Form/DraftRestorationAlert';
import { AutoSaveIndicator } from './Form/AutoSaveIndicator';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSave: (equipment: Partial<Equipment>) => void;
  isLoading?: boolean;
  error?: Error | unknown;
  onRetry?: () => void;
}

export function EquipmentForm({ 
  equipment, 
  onSave, 
  isLoading = false,
  error = null,
  onRetry = () => {}
}: EquipmentFormProps) {
  // If there's an error, display the error component
  if (error) {
    return <ErrorState error={error} onRetry={onRetry} />;
  }
  
  // If still loading, show loading state
  if (isLoading) {
    return <LoadingState />;
  }
  
  const {
    formData,
    teams,
    teamsLoading,
    teamsError,
    selectedTeamIsExternal,
    organizations,
    selectedOrgId,
    showDraftAlert,
    lastSaved,
    isAutoSaving,
    orgContextReady,
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleAttributesChange,
    handleAcceptDraft,
    handleRejectDraft,
    handleFormSubmit,
    validate
  } = useEquipmentForm({ initialEquipment: equipment });
  
  // Show loading while organization context is loading (for new equipment)
  if (!equipment && !orgContextReady) {
    return <LoadingState />;
  }
  
  // If we're editing, don't allow changing the organization
  const isEditing = !!equipment;
  
  // Check if selected organization is different from user's primary org
  const isExternalOrg = organizations.some(
    org => org.id === selectedOrgId && !org.is_primary
  );

  // Show warning if user has no organizations with create permissions
  if (!isEditing && organizations.length === 0 && orgContextReady) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unable to Create Equipment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You don't have permission to create equipment in any organization.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your organization administrator to request the appropriate permissions.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }
    
    // Final safety check for org_id
    if (!formData.org_id?.trim()) {
      toast.error('Organization is required. Please select an organization and try again.');
      return;
    }
    
    console.log('Form submission with validated data:', formData);
    
    // Clear persisted data on successful submission
    handleFormSubmit();
    
    onSave(formData);
  };

  // If we have team loading errors, show them
  if (teamsError) {
    // Handle the error based on its type
    const errorMessage = typeof teamsError === 'string' ? teamsError : 
                        (teamsError instanceof Error ? teamsError.message : 
                        'Unknown error loading teams');
    
    return <ErrorState error={teamsError} errorMessage={errorMessage} onRetry={onRetry} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{equipment ? 'Edit Equipment' : 'Add New Equipment'}</CardTitle>
          <AutoSaveIndicator 
            isAutoSaving={isAutoSaving} 
            lastSaved={lastSaved}
            className="text-xs"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Draft Restoration Alert */}
          {showDraftAlert && (
            <DraftRestorationAlert
              onAccept={handleAcceptDraft}
              onReject={handleRejectDraft}
              lastSaved={lastSaved || undefined}
            />
          )}

          {/* Organization Selection Section */}
          <OrganizationSection 
            organizations={organizations}
            selectedOrgId={selectedOrgId}
            isEditing={isEditing}
            isExternalOrg={isExternalOrg}
            onChange={(value) => handleSelectChange('org_id', value)}
          />

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
                showExternalTeamAlert={true}
                isLoading={teamsLoading}
              />
            </div>
          </div>
          
          {/* Notes Field */}
          <NotesField 
            notes={formData.notes || ''} 
            onChange={handleChange} 
          />
          
          {/* Custom Attributes Section - now with organization context */}
          <div className="pt-4 border-t">
            <AttributesEditor 
              attributes={formData.attributes || []} 
              onChange={handleAttributesChange}
              equipmentId={equipment?.id}
              orgId={selectedOrgId}
            />
          </div>
        </CardContent>
        
        {/* Form Footer */}
        <FormFooter isLoading={isLoading} isEditing={isEditing} />
      </Card>
    </form>
  );
}

export default EquipmentForm;
