import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, getRelativeTime } from '../basicDateFormatter';

describe('dateFormatter', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = '2023-12-25T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Dec 25, 2023/);
    });

    it('handles invalid date', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid date');
    });
  });

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = '2023-12-25T10:30:00Z';
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/Dec 25, 2023/);
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('handles invalid date', () => {
      const result = formatDateTime('invalid-date');
      expect(result).toBe('Invalid date');
    });
  });

  describe('getRelativeTime', () => {
    it('returns "just now" for very recent dates', () => {
      const now = new Date();
      const result = getRelativeTime(now.toISOString());
      expect(result).toBe('just now');
    });

    it('returns relative time for past dates', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
      const result = getRelativeTime(pastDate.toISOString());
      expect(result).toMatch(/2 minutes ago/);
    });

    it('handles invalid date', () => {
      const result = getRelativeTime('invalid-date');
      expect(result).toBe('Invalid date');
    });
  });
});