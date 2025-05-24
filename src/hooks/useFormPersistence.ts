
import { useState, useEffect, useCallback } from 'react';
import { Equipment } from '@/types';

interface FormPersistenceOptions {
  key: string;
  debounceMs?: number;
  clearOnSubmit?: boolean;
}

export function useFormPersistence<T extends Record<string, any>>(
  formData: T,
  options: FormPersistenceOptions
) {
  const { key, debounceMs = 1000, clearOnSubmit = true } = options;
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load persisted data on mount
  const loadPersistedData = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(`form_draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Loaded persisted form data:', parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load persisted form data:', error);
    }
    return null;
  }, [key]);

  // Save form data to localStorage
  const saveFormData = useCallback(async (data: T) => {
    try {
      setIsAutoSaving(true);
      localStorage.setItem(`form_draft_${key}`, JSON.stringify(data));
      setLastSaved(new Date());
      console.log('Auto-saved form data');
    } catch (error) {
      console.warn('Failed to save form data:', error);
    } finally {
      setTimeout(() => setIsAutoSaving(false), 500);
    }
  }, [key]);

  // Clear persisted data
  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(`form_draft_${key}`);
    setLastSaved(null);
    console.log('Cleared persisted form data');
  }, [key]);

  // Auto-save form data when it changes (with debouncing)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData && Object.keys(formData).length > 0) {
        saveFormData(formData);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [formData, saveFormData, debounceMs]);

  // Handle form submission
  const handleFormSubmit = useCallback(() => {
    if (clearOnSubmit) {
      clearPersistedData();
    }
  }, [clearOnSubmit, clearPersistedData]);

  return {
    loadPersistedData,
    clearPersistedData,
    handleFormSubmit,
    lastSaved,
    isAutoSaving
  };
}
