
import { useState, useCallback } from 'react';

export interface CustomAttribute {
  id: string;
  key: string;
  value: string;
}

export const useCustomAttributes = (initialAttributes: CustomAttribute[] = []) => {
  const [attributes, setAttributes] = useState<CustomAttribute[]>(
    initialAttributes.length > 0 ? initialAttributes : [{ id: crypto.randomUUID(), key: '', value: '' }]
  );

  const addAttribute = useCallback(() => {
    setAttributes(prev => [...prev, { id: crypto.randomUUID(), key: '', value: '' }]);
  }, []);

  const removeAttribute = useCallback((id: string) => {
    setAttributes(prev => prev.filter(attr => attr.id !== id));
  }, []);

  const updateAttribute = useCallback((id: string, field: 'key' | 'value', newValue: string) => {
    setAttributes(prev => 
      prev.map(attr => 
        attr.id === id ? { ...attr, [field]: newValue } : attr
      )
    );
  }, []);

  const validateAttributes = useCallback(() => {
    const keys = attributes.map(attr => attr.key.trim()).filter(Boolean);
    const uniqueKeys = new Set(keys);
    return keys.length === uniqueKeys.size;
  }, [attributes]);

  const getCleanAttributes = useCallback(() => {
    return attributes.filter(attr => attr.key.trim() !== '' && attr.value.trim() !== '');
  }, [attributes]);

  return {
    attributes,
    addAttribute,
    removeAttribute,
    updateAttribute,
    validateAttributes,
    getCleanAttributes,
    setAttributes
  };
};
