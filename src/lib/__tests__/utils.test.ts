import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'end')).toBe('base end');
    });

    it('should merge Tailwind classes correctly', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2'); // Later class should override
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('should handle object inputs', () => {
      expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
    });
  });
});