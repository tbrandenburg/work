/**
 * Additional edge case tests for JSON formatting to improve coverage
 */

import {
  formatOutput,
  formatError,
  formatSuccess,
} from '../../../src/cli/formatter.js';

describe('JSON Formatter Edge Cases', () => {
  describe('formatOutput edge cases', () => {
    it('should handle null data', () => {
      const result = formatOutput(null, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toBeNull();
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should handle undefined data', () => {
      const result = formatOutput(undefined, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toBeUndefined();
    });

    it('should handle empty object data', () => {
      const result = formatOutput({}, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toEqual({});
    });

    it('should handle empty array data', () => {
      const result = formatOutput([], 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toEqual([]);
    });

    it('should handle complex nested data', () => {
      const complexData = {
        nested: {
          array: [1, 2, { deep: 'value' }],
          unicode: '🚀 émojis',
          special: 'quotes "and" backslashes \\',
        },
      };
      const result = formatOutput(complexData, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toEqual(complexData);
    });

    it('should handle table format fallback', () => {
      const data = { test: 'value' };
      const result = formatOutput(data, 'table');
      expect(result).toBe('[object Object]');
    });

    it('should handle meta with all possible fields', () => {
      const meta = {
        total: 100,
        timestamp: '2026-01-22T18:00:00.000Z',
        customField: 'custom value',
        nested: { field: 'value' },
      };
      const result = formatOutput('test', 'json', meta);
      const parsed = JSON.parse(result);
      expect(parsed.meta).toEqual(meta);
    });
  });

  describe('formatError edge cases', () => {
    it('should handle Error object with name', () => {
      const error = new Error('Test error');
      error.name = 'CustomError';
      const result = formatError(error, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.errors[0].code).toBe('CustomError');
      expect(parsed.errors[0].message).toBe('Test error');
    });

    it('should handle Error object without name', () => {
      const error = new Error('Test error') as any;
      error.name = undefined;
      const result = formatError(error, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.errors[0].code).toBeUndefined();
    });

    it('should handle string error', () => {
      const result = formatError('String error', 'json');
      const parsed = JSON.parse(result);
      expect(parsed.errors[0].message).toBe('String error');
      expect(parsed.errors[0].code).toBeUndefined();
    });

    it('should handle table format error', () => {
      const result = formatError('Test error', 'table');
      expect(result).toBe('Test error');
    });

    it('should handle error with meta', () => {
      const meta = { timestamp: '2026-01-22T18:00:00.000Z' };
      const result = formatError('Test error', 'json', meta);
      const parsed = JSON.parse(result);
      expect(parsed.meta).toEqual(meta);
    });
  });

  describe('formatSuccess edge cases', () => {
    it('should be alias for formatOutput', () => {
      const data = { test: 'value' };
      const meta = { timestamp: '2026-01-22T18:00:00.000Z' };
      const result1 = formatSuccess(data, 'json', meta);
      const result2 = formatOutput(data, 'json', meta);
      expect(result1).toBe(result2);
    });
  });

  describe('JSON formatting standards', () => {
    it('should use exactly 2-space indentation', () => {
      const data = { nested: { value: 'test' } };
      const result = formatOutput(data, 'json');
      const lines = result.split('\n');
      // Check that nested objects use 2-space indentation
      expect(lines[2]).toMatch(/^    "nested": {$/);
      expect(lines[3]).toMatch(/^      "value": "test"$/);
    });

    it('should always end with single newline', () => {
      const result = formatOutput('test', 'json');
      expect(result.endsWith('\n')).toBe(true);
      expect(result.endsWith('\n\n')).toBe(false);
    });

    it('should produce valid JSON for all data types', () => {
      const testCases = [
        null,
        undefined,
        true,
        false,
        0,
        -1,
        3.14,
        '',
        'string',
        [],
        {},
        [1, 2, 3],
        { a: 1, b: 'test' },
      ];

      testCases.forEach(testCase => {
        const result = formatOutput(testCase, 'json');
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });
  });
});
