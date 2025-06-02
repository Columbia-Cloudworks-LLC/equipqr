
import { useQuery } from '@tanstack/react-query';
import { getWorkNotes } from '@/services/workNotes/workNotesService';
import { getUserOrganizations } from '@/services/organization';
import { WorkNote } from '@/types/workNotes';

export function useWorkNotesQuery(equipmentId: string) {
  // Query for work notes
  const { 
    data: workNotes = [], 
    isLoading: notesLoading, 
    error: notesError,
    isError: isNotesError,
    refetch: refetchNotes 
  } = useQuery({
    queryKey: ['workNotes', equipmentId],
    queryFn: () => getWorkNotes(equipmentId),
    enabled: !!equipmentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: (failureCount, error) => {
      console.error('Work notes query failed:', error);
      // Only retry if it's not a permission error
      if (error?.message?.includes('permission')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Query for organizations (for filtering)
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: getUserOrganizations,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter notes by visibility
  const publicNotes = workNotes.filter((note: WorkNote) => note.is_public);
  const allNotes = workNotes; // All notes the user has permission to see

  console.log('Work notes query results:', {
    equipmentId,
    totalNotes: workNotes.length,
    publicNotes: publicNotes.length,
    isLoading: notesLoading,
    error: notesError,
    isError: isNotesError
  });

  return {
    workNotes: allNotes,
    publicNotes,
    allNotes,
    organizations,
    isLoading: notesLoading,
    error: notesError,
    isError: isNotesError,
    refetchNotes
  };
}
