/**
 * Unit tests for ACP Target Handler
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ACPTargetHandler } from '../../../../src/core/target-handlers/acp-handler';
import { WorkItem } from '../../../../src/types/work-item';
import { ACPTargetConfig } from '../../../../src/types/notification';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(() => {
    const mockProcess = {
      stdin: {
        write: vi.fn(),
      },
      stdout: {
        on: vi.fn(),
      },
      stderr: {
        on: vi.fn(),
      },
      on: vi.fn(),
      killed: false,
      kill: vi.fn(),
    };
    return mockProcess;
  }),
}));

describe('ACPTargetHandler', () => {
  let handler: ACPTargetHandler;
  let mockWorkItems: WorkItem[];
  let mockConfig: ACPTargetConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new ACPTargetHandler();

    mockWorkItems = [
      {
        id: 'TASK-123',
        kind: 'task',
        title: 'Fix bug in auth module',
        state: 'in-progress',
        priority: 'high',
        description: 'Authentication fails for OAuth users',
        labels: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ];

    mockConfig = {
      type: 'acp',
      cmd: 'opencode acp',
      cwd: process.cwd(),
      timeout: 30,
    };
  });

  it('should format work items correctly', () => {
    const formatted = (handler as any).formatWorkItems(mockWorkItems);

    expect(formatted).toContain('TASK-123');
    expect(formatted).toContain('Fix bug in auth module');
    expect(formatted).toContain('in-progress');
  });

  it('should handle empty work items', () => {
    const formatted = (handler as any).formatWorkItems([]);

    expect(formatted).toBe('No work items to analyze.');
  });

  it('should format multiple work items', () => {
    const items: WorkItem[] = [
      {
        id: 'TASK-1',
        kind: 'task',
        title: 'First task',
        state: 'active',
        priority: 'medium',
        labels: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'TASK-2',
        kind: 'task',
        title: 'Second task',
        state: 'done',
        priority: 'low',
        labels: [],
        createdAt: '2026-01-02T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      },
    ];

    const formatted = (handler as any).formatWorkItems(items);

    expect(formatted).toContain('TASK-1');
    expect(formatted).toContain('First task');
    expect(formatted).toContain('TASK-2');
    expect(formatted).toContain('Second task');
  });
});
