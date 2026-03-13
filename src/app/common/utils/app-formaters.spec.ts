import {formatDateTime, formatPhone} from './app-formaters';

describe('app-formaters', () => {
   describe('formatPhone', () => {
      it('formats 10-digit phone numbers', () => {
         expect(formatPhone('5551234567')).toBe('(555) 123-4567');
      });

      it('returns original value for non-10-digit numbers', () => {
         expect(formatPhone('55512')).toBe('55512');
      });

      it('returns empty string for empty input', () => {
         expect(formatPhone(undefined)).toBe('');
      });
   });

   describe('formatDateTime', () => {
      it('returns fallback text for nullish values', () => {
         expect(formatDateTime(null)).toBe('Not yet scheduled');
         expect(formatDateTime(undefined)).toBe('Not yet scheduled');
      });

      it('returns fallback text for invalid date string', () => {
         expect(formatDateTime('invalid-date')).toBe('Not yet scheduled');
      });

      it('formats valid dates with date and time', () => {
         const result = formatDateTime('2026-03-12T15:30:00.000Z');

         expect(result).toContain('Mar');
         expect(result).toContain('2026');
         expect(result).toContain('at');
      });
   });
});