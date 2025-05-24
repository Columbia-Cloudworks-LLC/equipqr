
import { useState, useEffect } from 'react';
import { Equipment, EquipmentAttribute } from '@/types';
import { useTeamsData } from './useTeamsData';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface UseEquipmentFormProps {
  initialEquipment?: Equipment;
}

export function useEquipmentForm({ initialEquipment }: UseEquipmentFormProps = {}) {
  const { organizations, selectedOrganization } = useOrganization();
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(
    initialEquipment?.org_id || selectedOrganization?.id
  );
  
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: initialEquipment?.name || '',
    model: initialEquipment?.model || '',
    serial_number: initialEquipment?.serial_number || '',
    manufacturer: initialEquipment?.manufacturer || '',
    status: initialEquipment?.status || 'active',
    location: initialEquipment?.location || '',
    install_date: initialEquipment?.install_date || null,
    warranty_expiration: initialEquipment?.warranty_expiration || null,
    notes: initialEquipment?.notes || '',
    team_id: initialEquipment?.team_id || '',
    org_id: initialEquipment?.org_id || selectedOrgId,
    attributes: initialEquipment?.attributes || []
  });

  // Set up form persistence - only for new equipment (not edits)
  const isEditing = !!initialEquipment?.id;
  const persistenceKey = isEditing ? `edit_${initialEquipment.id}` : 'new_equipment';
  
  const {
    loadPersistedData,
    clearPersistedData,
    handleFormSubmit,
    lastSaved,
    isAutoSaving
  } = useFormPersistence(formData, {
    key: persistenceKey,
    debounceMs: 2000, // Save every 2 seconds when typing stops
    clearOnSubmit: true
  });

  // State for draft restoration
  const [showDraftAlert, setShowDraftAlert] = useState(false);
  const [draftData, setDraftData] = useState<Partial<Equipment> | null>(null);

  // Load persisted data on mount (only for new equipment)
  useEffect(() => {
    if (!isEditing) {
      const persistedData = loadPersistedData();
      if (persistedData && Object.keys(persistedData).some(key => persistedData[key])) {
        setDraftData(persistedData);
        setShowDraftAlert(true);
      }
    }
  }, [isEditing, loadPersistedData]);

  // Handle draft restoration
  const handleAcceptDraft = () => {
    if (draftData) {
      setFormData(draftData);
      if (draftData.org_id) {
        setSelectedOrgId(draftData.org_id);
      }
    }
    setShowDraftAlert(false);
    setDraftData(null);
  };

  const handleRejectDraft = () => {
    clearPersistedData();
    setShowDraftAlert(false);
    setDraftData(null);
  };

  // Update org_id in form data when selectedOrgId changes
  useEffect(() => {
    if (selectedOrgId) {
      setFormData(prev => ({ ...prev, org_id: selectedOrgId }));
    }
  }, [selectedOrgId]);

  // Update selectedOrgId if selectedOrganization changes and we don't have an initial org
  useEffect(() => {
    if (!initialEquipment?.org_id && selectedOrganization?.id && !selectedOrgId) {
      setSelectedOrgId(selectedOrganization.id);
    }
  }, [selectedOrganization, initialEquipment, selectedOrgId]);

  // Get teams data, filtered by selected organization
  const { 
    teams: allTeams, 
    isLoading: teamsLoading, 
    error: teamsError 
  } = useTeamsData();
  
  // Filter teams by selected org
  const teams = selectedOrgId ? 
    allTeams.filter(team => team.org_id === selectedOrgId) : 
    allTeams;
  
  // Check if selected team is external
  const [selectedTeamIsExternal, setSelectedTeamIsExternal] = useState(false);
  
  useEffect(() => {
    if (formData.team_id) {
      const selectedTeam = teams.find(t => t.id === formData.team_id);
      setSelectedTeamIsExternal(Boolean(selectedTeam?.is_external));
    } else {
      setSelectedTeamIsExternal(false);
    }
  }, [formData.team_id, teams]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // Handle "none" as null for team_id
    const processedValue = name === 'team_id' && value === 'none' ? null : value;
    
    // For org_id changes, also reset team_id since teams are org-specific
    if (name === 'org_id') {
      setSelectedOrgId(value);
      setFormData((prev) => ({ 
        ...prev, 
        [name]: processedValue,
        team_id: null  // Reset team when org changes
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleDateChange = (name: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttributesChange = (attributes: EquipmentAttribute[]) => {
    setFormData((prev) => ({ ...prev, attributes }));
  };
  
  // Validation
  const validate = (): string | null => {
    if (!formData.name) {
      return 'Please enter equipment name';
    }
    
    if (!formData.org_id) {
      return 'Please select an organization';
    }
    
    return null;
  };

  return {
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
    handleChange,
    handleSelectChange,
    handleDateChange,
    handleAttributesChange,
    handleAcceptDraft,
    handleRejectDraft,
    handleFormSubmit,
    validate
  };
}
