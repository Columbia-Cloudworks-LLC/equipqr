import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface FilterState {
  status: string;
  team: string;
  search: string;
  organization?: string;
}

const DEFAULT_FILTERS: FilterState = {
  status: 'all',
  team: 'all',
  search: '',
  organization: undefined
};

export function usePersistedFilters(storageKey: string = 'equipment-filters') {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize filters from URL params or sessionStorage
  const initializeFilters = useCallback((): FilterState => {
    const urlParams = new URLSearchParams(location.search);
    
    // Try URL params first
    const urlFilters: Partial<FilterState> = {};
    if (urlParams.get('status')) urlFilters.status = urlParams.get('status')!;
    if (urlParams.get('team')) urlFilters.team = urlParams.get('team')!;
    if (urlParams.get('search')) urlFilters.search = urlParams.get('search')!;
    if (urlParams.get('org')) urlFilters.organization = urlParams.get('org')!;
    
    // If we have URL params, use them
    if (Object.keys(urlFilters).length > 0) {
      return { ...DEFAULT_FILTERS, ...urlFilters };
    }
    
    // Otherwise, try sessionStorage
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsedFilters = JSON.parse(stored);
        return { ...DEFAULT_FILTERS, ...parsedFilters };
      }
    } catch (error) {
      console.warn('Failed to parse stored filters:', error);
    }
    
    return DEFAULT_FILTERS;
  }, [location.search, storageKey]);

  const [filters, setFilters] = useState<FilterState>(initializeFilters);

  // Update URL and sessionStorage when filters change
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (updatedFilters.status !== 'all') params.set('status', updatedFilters.status);
    if (updatedFilters.team !== 'all') params.set('team', updatedFilters.team);
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.organization) params.set('org', updatedFilters.organization);
    
    // Update URL without triggering navigation
    const newUrl = params.toString() ? `${location.pathname}?${params}` : location.pathname;
    navigate(newUrl, { replace: true });
    
    // Store in sessionStorage
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(updatedFilters));
    } catch (error) {
      console.warn('Failed to store filters:', error);
    }
  }, [filters, navigate, location.pathname, storageKey]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    navigate(location.pathname, { replace: true });
    try {
      sessionStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear stored filters:', error);
    }
  }, [navigate, location.pathname, storageKey]);

  return {
    filters,
    updateFilters,
    clearFilters,
    setFilterStatus: (status: string) => updateFilters({ status }),
    setFilterTeam: (team: string) => updateFilters({ team }),
    setFilterSearch: (search: string) => updateFilters({ search }),
    setFilterOrganization: (organization: string) => updateFilters({ organization })
  };
}
