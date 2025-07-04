import { useState, useEffect, useMemo } from 'react';

// PHASE 2: Optimized debouncing hook with cleanup
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Optimized search hook with memoization
export function useDebouncedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  delay: number = 300
) {
  const debouncedSearchTerm = useDebounced(searchTerm, delay);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;

    const lowercaseSearch = debouncedSearchTerm.toLowerCase();
    return items.filter(item =>
      searchFields.some(field => {
        const fieldValue = item[field];
        return fieldValue && 
               String(fieldValue).toLowerCase().includes(lowercaseSearch);
      })
    );
  }, [items, debouncedSearchTerm, searchFields]);

  return {
    filteredItems,
    searchTerm: debouncedSearchTerm,
    isSearching: searchTerm !== debouncedSearchTerm
  };
}