/**
 * Unit tests for Bash Target Handler
 */

import { vi } from 'vitest';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { BashTargetHandler } from '../../../../src/core/target-handlers/bash-handler';
import { WorkItem } from '../../../../src/types/work-item';
import { BashTargetConfig } from '../../../../src/types/notification';

// Mock child_process and fs
vi.mock('child_process');
vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));
vi.mock('os');

describe('BashTargetHandler', () => {
  let handler: BashTargetHandler;
  const mockSpawn = vi.mocked(spawn);
  const mockFs = vi.mocked(fs);
  const mockOs = vi.mocked(os);

  const mockConfig: BashTargetConfig = {
    type: 'bash',
    script: 'echo "notification sent"',
    timeout: 10,
  };

  const mockWorkItems: WorkItem[] = [
    {
      id: 'TASK-001',
      kind: 'task',
      title: 'Test task',
      description: 'Test description',
      state: 'active',
      priority: 'high',
      assignee: 'user@example.com',
      labels: ['urgent'],
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
      closedAt: undefined,
    },
  ];

  beforeEach(() => {
    handler = new BashTargetHandler();
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should reject invalid config type', async () => {
      const invalidConfig = { type: 'invalid' as any, script: 'test' };

      const result = await handler.send(mockWorkItems, invalidConfig);

      expect(result).toEqual({
        success: false,
        error: 'Invalid config type for BashTargetHandler',
      });
    });

    it('should handle builtin work:log script', async () => {
      const builtinConfig: BashTargetConfig = {
        type: 'bash',
        script: 'work:log',
      };

      mockOs.homedir.mockReturnValue('/home/user');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      // Mock Date to get consistent timestamp
      const mockDate = new Date('2024-01-01T10:30:00.000Z');
      vi.spyOn(global, 'Date').mockImplementation(() => mockDate);

      const result = await handler.send(mockWorkItems, builtinConfig);

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        '/home/user/.work/notifications',
        { recursive: true }
      );

      const expectedPath = path.join(
        '/home/user/.work/notifications',
        'notification-2024-01-01T10-30-00-000Z.json'
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        JSON.stringify(
          {
            timestamp: '2024-01-01T10:30:00.000Z',
            itemCount: 1,
            items: mockWorkItems,
          },
          null,
          2
        )
      );

      expect(result).toEqual({
        success: true,
        message: `Logged 1 items to ${expectedPath}`,
      });
    });

    it('should handle builtin work:log script with mkdir error', async () => {
      const builtinConfig: BashTargetConfig = {
        type: 'bash',
        script: 'work:log',
      };

      mockOs.homedir.mockReturnValue('/home/user');
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const result = await handler.send(mockWorkItems, builtinConfig);

      expect(result).toEqual({
        success: false,
        error: 'Failed to write log file: Permission denied',
      });
    });

    it('should execute custom script successfully', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Script output'));
            }
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        stdin: {
          write: vi.fn(),
          end: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        }),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(mockSpawn).toHaveBeenCalledWith('echo "notification sent"', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      });

      expect(mockChild.stdin.write).toHaveBeenCalledWith(
        expect.stringContaining('"itemCount":1')
      );
      expect(mockChild.stdin.end).toHaveBeenCalled();

      expect(result).toEqual({
        success: true,
        message: 'Script executed successfully: Script output',
      });
    });

    it('should handle script execution failure', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('Script error message'));
            }
          }),
        },
        stdin: {
          write: vi.fn(),
          end: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(1); // Error exit code
          }
        }),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result).toEqual({
        success: false,
        error: 'Script failed with code 1: Script error message',
      });
    });

    it('should handle script spawn error', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn(),
        },
        stdin: {
          write: vi.fn(),
          end: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        }),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result).toEqual({
        success: false,
        error: 'Failed to execute script: Command not found',
      });
    });

    it('should use default timeout when not specified', async () => {
      const configNoTimeout: BashTargetConfig = {
        type: 'bash',
        script: 'echo "test"',
      };

      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        stdin: { write: vi.fn(), end: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') callback(0);
        }),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      await handler.send(mockWorkItems, configNoTimeout);

      expect(mockSpawn).toHaveBeenCalledWith(
        expect.any(String),
        [],
        expect.objectContaining({
          timeout: 30000, // Default 30 seconds
        })
      );
    });

    it('should handle empty work items array', async () => {
      const builtinConfig: BashTargetConfig = {
        type: 'bash',
        script: 'work:log',
      };

      mockOs.homedir.mockReturnValue('/home/user');
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await handler.send([], builtinConfig);

      expect(result).toEqual({
        success: true,
        message: expect.stringContaining('Logged 0 items to'),
      });
    });

    it('should handle unexpected error in main try-catch', async () => {
      // Force an error by mocking homedir to throw
      mockOs.homedir.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const builtinConfig: BashTargetConfig = {
        type: 'bash',
        script: 'work:log',
      };

      const result = await handler.send(mockWorkItems, builtinConfig);

      expect(result).toEqual({
        success: false,
        error: 'Failed to write log file: Unexpected error',
      });
    });
  });
});
