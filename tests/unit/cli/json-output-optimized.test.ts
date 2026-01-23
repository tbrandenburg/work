/**
 * Optimized JSON Output Validation Test Suite
 * Uses direct formatter testing instead of CLI execution
 */

import { formatOutput } from '../../../src/cli/formatter.js';
import { WorkItem } from '../../../src/types/index.js';

describe('JSON Output Validation (Optimized)', () => {
  const mockWorkItem: WorkItem = {
    id: 'TASK-001',
    kind: 'task',
    state: 'new',
    title: 'Test JSON task',
    priority: 'medium',
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('Structured Response Format', () => {
    it('should output structured JSON for create command', () => {
      const result = formatOutput(mockWorkItem, 'json', { timestamp: '2024-01-01T00:00:00Z' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('id');
      expect(parsed.data).toHaveProperty('title', 'Test JSON task');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for list command', () => {
      const mockList = [mockWorkItem];
      const result = formatOutput(mockList, 'json', { total: 1, timestamp: '2024-01-01T00:00:00Z' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.meta).toHaveProperty('total', 1);
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for auth status command', () => {
      const authData = { state: 'authenticated', user: 'test-user' };
      const result = formatOutput(authData, 'json', { timestamp: '2024-01-01T00:00:00Z' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should output structured JSON for hello command', () => {
      const helloData = { message: 'hello world from test' };
      const result = formatOutput(helloData, 'json', { timestamp: '2024-01-01T00:00:00Z' });
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.data).toHaveProperty('message');
    });
  });

  describe('State Change Commands JSON Output', () => {
    it('should output structured JSON for start command', () => {
      const startedItem = { ...mockWorkItem, state: 'active' as const };
      const result = formatOutput(startedItem, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed.data.state).toBe('active');
    });

    it('should output structured JSON for close command', () => {
      const closedItem = { ...mockWorkItem, state: 'closed' as const };
      const result = formatOutput(closedItem, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed.data.state).toBe('closed');
    });

    it('should output structured JSON for reopen command', () => {
      const reopenedItem = { ...mockWorkItem, state: 'new' as const };
      const result = formatOutput(reopenedItem, 'json');
      const parsed = JSON.parse(result);
      
      expect(parsed.data.state).toBe('new');
    });
  });

  describe('JSON Format Validation', () => {
    it('should produce valid JSON for all commands', () => {
      const testData = [
        mockWorkItem,
        [mockWorkItem],
        { message: 'test' },
        null,
        []
      ];

      testData.forEach(data => {
        const result = formatOutput(data, 'json');
        expect(() => JSON.parse(result)).not.toThrow();
      });
    });

    it('should include proper newline termination', () => {
      const result = formatOutput(mockWorkItem, 'json');
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should use 2-space indentation', () => {
      const result = formatOutput(mockWorkItem, 'json');
      expect(result).toContain('  "data"');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data responses', () => {
      const result = formatOutput([], 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data).toEqual([]);
    });

    it('should handle unicode characters in JSON output', () => {
      const unicodeItem = { ...mockWorkItem, title: 'Test 🚀 Unicode' };
      const result = formatOutput(unicodeItem, 'json');
      const parsed = JSON.parse(result);
      expect(parsed.data.title).toBe('Test 🚀 Unicode');
    });
  });

  describe('Meta Information', () => {
    it('should include timestamp in meta when provided', () => {
      const result = formatOutput(mockWorkItem, 'json', { timestamp: '2024-01-01T00:00:00Z' });
      const parsed = JSON.parse(result);
      
      expect(parsed.meta).toHaveProperty('timestamp');
      expect(typeof parsed.meta.timestamp).toBe('string');
      expect(new Date(parsed.meta.timestamp)).toBeInstanceOf(Date);
    });

    it('should include total count for list commands', () => {
      const result = formatOutput([mockWorkItem], 'json', { total: 1 });
      const parsed = JSON.parse(result);
      
      expect(parsed.meta).toHaveProperty('total', 1);
    });
  });
});
