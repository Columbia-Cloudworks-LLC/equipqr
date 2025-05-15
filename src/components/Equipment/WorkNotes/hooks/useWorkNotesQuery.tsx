
import { useQuery } from '@tanstack/react-query';
import { getWorkNotes, WorkNote } from '@/services/workNotes';
import { useState, useEffect } from 'react';

// Organization type for filtering
export interface Organization {
  id: string;
  name: string;
  is_external?: boolean;
}

export function useWorkNotesQuery(equipmentId: string) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Fetch work notes
  const { 
    data: workNotes = [], 
    isLoading, 
    error,
    refetch: refetchNotes 
  } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId),
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching work notes:', err);
      }
    }
  });
  
  // Extract organizations from notes for filtering
  useEffect(() => {
    if (workNotes.length > 0) {
      const orgMap = new Map<string, Organization>();
      
      workNotes.forEach(note => {
        if (note.organization_id && note.organization_name) {
          orgMap.set(note.organization_id, {
            id: note.organization_id,
            name: note.organization_name,
            is_external: note.is_external_org
          });
        }
      });
      
      setOrganizations(Array.from(orgMap.values()));
    }
  }, [workNotes]);

  // Filter notes based on public/private status
  const publicNotes = workNotes.filter(note => note.is_public);
  const allNotes = workNotes;
  
  return {
    workNotes,
    publicNotes,
    allNotes,
    organizations,
    isLoading,
    error,
    refetchNotes
  };
}
