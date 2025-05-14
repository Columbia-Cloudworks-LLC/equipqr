
import { useState, useEffect } from 'react';
import { Equipment, EquipmentAttribute } from '@/types';
import { useTeamsData } from './useTeamsData';

interface UseEquipmentFormProps {
  initialEquipment?: Equipment;
}

export function useEquipmentForm({ initialEquipment }: UseEquipmentFormProps = {}) {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    name: initialEquipment?.name || '',
    model: initialEquipment?.model || '',
    serial_number: initialEquipment?.serial_number || '',
    manufacturer: initialEquipment?.manufacturer || '',
    status: initialEquipment?.status || 'active',
    location: initialEquipment?.location || '',
    install_date: initialEquipment?.install_date || '',
    warranty_expiration: initialEquipment?.warranty_expiration || '',
    notes: initialEquipment?.notes || '',
    team_id: initialEquipment?.team_id || '',
    attributes: initialEquipment?.attributes || []
  });

  // Get teams data
  const { teams, isLoading: teamsLoading, error: teamsError } = useTeamsData();
  
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
    setFormData((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleAttributesChange = (attributes: EquipmentAttribute[]) => {
    setFormData((prev) => ({ ...prev, attributes }));
  };
  
  // Validation
  const validate = (): string | null => {
    if (!formData.name) {
      return 'Please enter equipment name';
    }
    return null;
  };

  return {
    formData,
    teams,
    teamsLoading,
    teamsError,
    selectedTeamIsExternal,
    handleChange,
    handleSelectChange,
    handleAttributesChange,
    validate
  };
}
