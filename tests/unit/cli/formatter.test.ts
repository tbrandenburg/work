/**
 * Unit tests for CLI formatter functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatOutput,
  formatError,
  formatSuccess,
} from '../../../src/cli/formatter.js';
import { ResponseFormat } from '../../../src/types/response.js';

describe('CLI Formatter', () => {
  describe('formatOutput', () => {
    it('should format data as JSON with meta', () => {
      const data = { message: 'test' };
      const meta = { timestamp: '2023-01-01T00:00:00Z' };

      const result = formatOutput(data, 'json', meta);

      expect(result).toBe(`{
  "data": {
    "message": "test"
  },
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z"
  }
}\n`);
    });

    it('should format data as JSON without meta', () => {
      const data = { count: 5 };

      const result = formatOutput(data, 'json');

      expect(result).toBe(`{
  "data": {
    "count": 5
  }
}\n`);
    });

    it('should format simple data as JSON', () => {
      const data = 'simple string';

      const result = formatOutput(data, 'json');

      expect(result).toBe(`{
  "data": "simple string"
}\n`);
    });

    it('should format array data as JSON', () => {
      const data = [1, 2, 3];

      const result = formatOutput(data, 'json');

      expect(result).toBe(`{
  "data": [
    1,
    2,
    3
  ]
}\n`);
    });

    it('should format data as table (string conversion)', () => {
      const data = { message: 'test' };

      const result = formatOutput(data, 'table');

      expect(result).toBe('[object Object]');
    });

    it('should format string data as table', () => {
      const data = 'test message';

      const result = formatOutput(data, 'table');

      expect(result).toBe('test message');
    });

    it('should format number data as table', () => {
      const data = 42;

      const result = formatOutput(data, 'table');

      expect(result).toBe('42');
    });

    it('should handle null data', () => {
      const data = null;

      const result = formatOutput(data, 'json');

      expect(result).toBe(`{
  "data": null
}\n`);
    });
  });

  describe('formatError', () => {
    it('should format Error object as JSON with meta', () => {
      const error = new Error('Test error');
      error.name = 'TestError';
      const meta = { timestamp: '2023-01-01T00:00:00Z' };

      const result = formatError(error, 'json', meta);

      expect(result).toBe(`{
  "errors": [
    {
      "message": "Test error",
      "code": "TestError"
    }
  ],
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z"
  }
}\n`);
    });

    it('should format Error object as JSON without meta', () => {
      const error = new Error('Simple error');

      const result = formatError(error, 'json');

      expect(result).toBe(`{
  "errors": [
    {
      "message": "Simple error",
      "code": "Error"
    }
  ]
}\n`);
    });

    it('should format string error as JSON', () => {
      const error = 'String error message';

      const result = formatError(error, 'json');

      expect(result).toBe(`{
  "errors": [
    {
      "message": "String error message"
    }
  ]
}\n`);
    });

    it('should format Error object as table', () => {
      const error = new Error('Table error');

      const result = formatError(error, 'table');

      expect(result).toBe('Table error');
    });

    it('should format string error as table', () => {
      const error = 'Table string error';

      const result = formatError(error, 'table');

      expect(result).toBe('Table string error');
    });

    it('should use default table format when no format specified', () => {
      const error = 'Default format error';

      const result = formatError(error);

      expect(result).toBe('Default format error');
    });

    it('should handle Error without name property', () => {
      const error = new Error('No name error');
      (error as any).name = undefined;

      const result = formatError(error, 'json');

      expect(result).toBe(`{
  "errors": [
    {
      "message": "No name error"
    }
  ]
}\n`);
    });

    it('should handle custom Error with custom name', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');

      const result = formatError(error, 'json');

      expect(result).toBe(`{
  "errors": [
    {
      "message": "Custom error message",
      "code": "CustomError"
    }
  ]
}\n`);
    });
  });

  describe('formatSuccess', () => {
    it('should delegate to formatOutput for JSON format', () => {
      const data = { success: true };
      const meta = { timestamp: '2023-01-01T00:00:00Z' };

      const result = formatSuccess(data, 'json', meta);

      expect(result).toBe(`{
  "data": {
    "success": true
  },
  "meta": {
    "timestamp": "2023-01-01T00:00:00Z"
  }
}\n`);
    });

    it('should delegate to formatOutput for table format', () => {
      const data = 'success message';

      const result = formatSuccess(data, 'table');

      expect(result).toBe('success message');
    });

    it('should handle complex data structures', () => {
      const data = {
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        total: 2,
      };

      const result = formatSuccess(data, 'json');

      expect(result).toBe(`{
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Item 1"
      },
      {
        "id": 2,
        "name": "Item 2"
      }
    ],
    "total": 2
  }
}\n`);
    });
  });

  describe('ResponseFormat handling', () => {
    it('should handle all valid ResponseFormat values', () => {
      const data = 'test';

      const jsonResult = formatOutput(data, 'json' as ResponseFormat);
      const tableResult = formatOutput(data, 'table' as ResponseFormat);

      expect(jsonResult).toContain('"data": "test"');
      expect(tableResult).toBe('test');
    });

    it('should handle edge case with empty string data', () => {
      const data = '';

      const result = formatOutput(data, 'json');

      expect(result).toBe(`{
  "data": ""
}\n`);
    });

    it('should handle boolean data types', () => {
      const trueData = true;
      const falseData = false;

      const trueResult = formatOutput(trueData, 'json');
      const falseResult = formatOutput(falseData, 'json');

      expect(trueResult).toBe(`{
  "data": true
}\n`);
      expect(falseResult).toBe(`{
  "data": false
}\n`);
    });
  });
});
