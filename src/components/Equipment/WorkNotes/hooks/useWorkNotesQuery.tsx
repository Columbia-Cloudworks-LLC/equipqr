
import { useQuery } from '@tanstack/react-query';
import { getWorkNotes, WorkNote } from '@/services/workNotes';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { retry } from '@/utils/edgeFunctions/retry';

// Organization type for filtering
export interface Organization {
  id: string;
  name: string;
  is_external?: boolean;
}

export function useWorkNotesQuery(equipmentId: string) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Fetch work notes with a reasonable staleTime to avoid excessive refetching
  const { 
    data: workNotes = [], 
    isLoading, 
    error,
    refetch: refetchNotes,
    isError  // Ensure isError is extracted from the useQuery result
  } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => retry(() => getWorkNotes(equipmentId), 3),
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: 3, // Retry 3 times before considering it failed
    retryDelay: (attempt) => Math.min(attempt > 1 ? 2 ** attempt * 1000 : 1000, 30000), // Exponential backoff with a 30s max
    meta: {
      onError: (err: Error) => {
        console.error('Error fetching work notes:', err);
        toast.error('Failed to load work notes', {
          description: err.message || 'An unknown error occurred'
        });
      }
    }
  });
  
  // Extract organizations from notes for filtering
  useEffect(() => {
    if (workNotes.length > 0) {
      const orgMap = new Map<string, Organization>();
      
      workNotes.forEach(note => {
        if (note.organization_name) {
          orgMap.set(note.organization_name, {
            id: note.organization_name,
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
    isError,  // Make sure to include isError in the returned object
    refetchNotes
  };
}
