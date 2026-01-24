/**
 * Optimized JSON Output Validation Test Suite
 * Uses mocked engine calls instead of full CLI execution for performance
 */

import { vi } from 'vitest';
import { WorkEngine } from '../../../src/core/index.js';
import { WorkItem } from '../../../src/types/index.js';
import { formatOutput } from '../../../src/cli/formatter.js';

// Mock the WorkEngine
vi.mock('../../../src/core/index.js', () => ({
  WorkEngine: vi.fn(),
}));

describe('Universal JSON Output Support (Optimized)', () => {
  let mockEngine: any;

  beforeEach(() => {
    mockEngine = {
      createWorkItem: vi.fn(),
      listWorkItems: vi.fn(),
      getWorkItem: vi.fn(),
      updateWorkItem: vi.fn(),
      changeState: vi.fn(),
      deleteWorkItem: vi.fn(),
      createRelation: vi.fn(),
      getRelations: vi.fn(),
      deleteRelation: vi.fn(),
      getAuthStatus: vi.fn(),
    };
    vi.mocked(WorkEngine).mockImplementation(() => mockEngine);
    vi.clearAllMocks();
  });

  const mockWorkItem: WorkItem = {
    id: 'TASK-001',
    kind: 'task',
    state: 'new',
    title: 'Test task',
    priority: 'medium',
    labels: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  describe('Core Commands JSON Output', () => {
    it('should format create command output as JSON', () => {
      mockEngine.createWorkItem.mockResolvedValue(mockWorkItem);

      const result = formatOutput(mockWorkItem, 'json', {
        timestamp: '2024-01-01T00:00:00Z',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toEqual(mockWorkItem);
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('timestamp');
    });

    it('should format list command output as JSON', () => {
      const mockList = [mockWorkItem];
      mockEngine.listWorkItems.mockResolvedValue(mockList);

      const result = formatOutput(mockList, 'json', {
        total: 1,
        timestamp: '2024-01-01T00:00:00Z',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toEqual(mockList);
      expect(parsed.meta).toHaveProperty('total', 1);
    });

    it('should format get command output as JSON', () => {
      mockEngine.getWorkItem.mockResolvedValue(mockWorkItem);

      const result = formatOutput(mockWorkItem, 'json');
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toEqual(mockWorkItem);
    });

    it('should format state change commands as JSON', () => {
      const updatedItem = { ...mockWorkItem, state: 'active' as const };
      mockEngine.changeState.mockResolvedValue(updatedItem);

      const result = formatOutput(updatedItem, 'json');
      const parsed = JSON.parse(result);

      expect(parsed.data.state).toBe('active');
    });

    it('should format auth status as JSON', () => {
      const authStatus = { state: 'authenticated', user: 'test-user' };
      mockEngine.getAuthStatus.mockResolvedValue(authStatus as any);

      const result = formatOutput(authStatus, 'json');
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toEqual(authStatus);
    });
  });

  describe('JSON Structure Validation', () => {
    it('should have consistent response structure', () => {
      const result = formatOutput(mockWorkItem, 'json', {
        timestamp: '2024-01-01T00:00:00Z',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('meta');
      expect(parsed.meta).toHaveProperty('timestamp');
      expect(typeof parsed.meta.timestamp).toBe('string');
    });

    it('should handle empty data responses', () => {
      const result = formatOutput([], 'json');
      const parsed = JSON.parse(result);

      expect(parsed.data).toEqual([]);
      expect(Array.isArray(parsed.data)).toBe(true);
    });

    it('should use 2-space indentation', () => {
      const result = formatOutput(mockWorkItem, 'json');

      expect(result).toContain('  "data"');
    });

    it('should include proper newline termination', () => {
      const result = formatOutput(mockWorkItem, 'json');

      expect(result.endsWith('\n')).toBe(true);
      expect(result.split('\n').pop()).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should format errors properly in JSON', () => {
      const error = new Error('Test error');
      const result = formatOutput({ error: error.message }, 'json');
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(parsed.data.error).toBe('Test error');
    });
  });
});
