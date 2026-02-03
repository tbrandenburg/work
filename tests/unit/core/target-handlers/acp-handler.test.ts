/**
 * Unit tests for ACP Target Handler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkItem } from '../../../../src/types/work-item';
import { ACPTargetConfig } from '../../../../src/types/notification';
import { EventEmitter } from 'events';

// Mock child_process - must be at top level with factory function
vi.mock('child_process', () => {
  const mockSpawnFn = vi.fn();
  return {
    spawn: mockSpawnFn,
  };
});

// Import after mocking
import { spawn } from 'child_process';
import { ACPTargetHandler } from '../../../../src/core/target-handlers/acp-handler';

describe('ACPTargetHandler', () => {
  let handler: ACPTargetHandler;
  let mockWorkItems: WorkItem[];
  let mockConfig: ACPTargetConfig;
  let mockProcess: any;
  const mockSpawn = spawn as any;

  let savedDebug: string | undefined;
  let savedWorkDebug: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Save environment variables for restoration
    savedDebug = process.env['DEBUG'];
    savedWorkDebug = process.env['WORK_DEBUG'];

    // Create a more realistic mock process
    mockProcess = {
      stdin: {
        write: vi.fn(),
      },
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      killed: false,
      kill: vi.fn(),
      on: vi.fn(),
    };

    mockSpawn.mockReturnValue(mockProcess);

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

  afterEach(() => {
    vi.useRealTimers();
    
    // Restore environment variables
    if (savedDebug !== undefined) {
      process.env['DEBUG'] = savedDebug;
    } else {
      delete process.env['DEBUG'];
    }
    if (savedWorkDebug !== undefined) {
      process.env['WORK_DEBUG'] = savedWorkDebug;
    } else {
      delete process.env['WORK_DEBUG'];
    }
  });

  describe('formatWorkItems', () => {
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

    it('should handle work items without description', () => {
      const item: WorkItem = {
        id: 'TASK-100',
        kind: 'task',
        title: 'Task without description',
        state: 'new',
        priority: 'low',
        labels: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const formatted = (handler as any).formatWorkItems([item]);

      expect(formatted).toContain('TASK-100');
      expect(formatted).toContain('N/A'); // Description should be N/A
    });
  });

  describe('send', () => {
    it('should reject invalid config type', async () => {
      const invalidConfig = { type: 'bash' as any, script: 'test.sh' };

      await expect(handler.send(mockWorkItems, invalidConfig)).rejects.toThrow(
        'Invalid config type'
      );
    });

    it('should return error result on exception', async () => {
      mockSpawn.mockImplementation(() => {
        throw new Error('Spawn failed');
      });

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Spawn failed');
    });

    it('should successfully send notification', async () => {
      // Mock successful responses
      const sendPromise = handler.send(mockWorkItems, mockConfig);

      // Simulate initialize response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: '1.0.0' },
          }) + '\n'
        );
      }, 10);

      // Simulate session/new response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'session-123' },
          }) + '\n'
        );
      }, 20);

      // Simulate session/prompt response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'AI response here' },
          }) + '\n'
        );
      }, 30);

      // Advance timers
      await vi.advanceTimersByTimeAsync(100);

      const result = await sendPromise;

      expect(result.success).toBe(true);
      expect(result.message).toContain('AI response');
    });
  });

  describe('ensureProcess', () => {
    it('should spawn new process with correct arguments', () => {
      (handler as any).ensureProcess(mockConfig);

      expect(mockSpawn).toHaveBeenCalledWith(
        'opencode',
        ['acp'],
        expect.objectContaining({
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: mockConfig.cwd,
        })
      );
    });

    it('should reuse existing process', () => {
      // First call spawns
      (handler as any).ensureProcess(mockConfig);
      expect(mockSpawn).toHaveBeenCalledTimes(1);

      // Second call reuses
      (handler as any).ensureProcess(mockConfig);
      expect(mockSpawn).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should spawn new process if previous was killed', () => {
      // First call
      (handler as any).ensureProcess(mockConfig);
      expect(mockSpawn).toHaveBeenCalledTimes(1);

      // Mark as killed
      mockProcess.killed = true;

      // Second call spawns new
      mockProcess = {
        stdin: { write: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        killed: false,
        kill: vi.fn(),
        on: vi.fn(),
      };
      mockSpawn.mockReturnValue(mockProcess);

      (handler as any).ensureProcess(mockConfig);
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });

    it('should throw on empty command', () => {
      const badConfig = { ...mockConfig, cmd: '' };

      expect(() => (handler as any).ensureProcess(badConfig)).toThrow(
        'Invalid cmd: empty command'
      );
    });

    it('should parse multi-word commands correctly', () => {
      const multiConfig = { ...mockConfig, cmd: 'cursor acp --verbose' };

      (handler as any).ensureProcess(multiConfig);

      expect(mockSpawn).toHaveBeenCalledWith(
        'cursor',
        ['acp', '--verbose'],
        expect.any(Object)
      );
    });
  });

  describe('sendRequest', () => {
    it('should timeout if no response', async () => {
      // Ensure fresh process for this test
      mockProcess = {
        stdin: { write: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        killed: false,
        kill: vi.fn(),
        on: vi.fn(),
      };

      const requestPromise = (handler as any).sendRequest(
        mockProcess,
        'initialize',
        {},
        0.1 // 100ms timeout
      );

      // Advance past timeout
      vi.advanceTimersByTime(150);

      // Catch the rejection
      await expect(requestPromise).rejects.toThrow(
        'ACP process timed out after 0.1 seconds'
      );

      // Clear any remaining timers
      vi.clearAllTimers();
    });
  });

  describe('Unified timeout configuration', () => {
    it('should use 300s default when no timeout specified', () => {
      const configWithoutTimeout = {
        type: 'acp' as const,
        cmd: 'opencode acp',
        cwd: process.cwd(),
        // No timeout property
      };

      // Test that getTimeout returns 300
      const timeout = (handler as any).getTimeout(configWithoutTimeout);
      expect(timeout).toBe(300);
    });

    it('should respect custom timeout from config', () => {
      const configWithTimeout = {
        type: 'acp' as const,
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: 600,
      };

      const timeout = (handler as any).getTimeout(configWithTimeout);
      expect(timeout).toBe(600);
    });

    it('should use same timeout for all operations', async () => {
      vi.useFakeTimers();
      const customTimeout = 120;

      const configWithTimeout = {
        type: 'acp' as const,
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: customTimeout,
      };

      // Mock process
      const mockProcess = {
        stdin: { write: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        killed: false,
        kill: vi.fn(),
        on: vi.fn(),
      };

      // Wire up the message handler
      (handler as any).setupMessageHandler(mockProcess);

      // Test initialize timeout
      const initPromise = (handler as any).sendRequest(
        mockProcess,
        'initialize',
        {},
        (handler as any).getTimeout(configWithTimeout)
      );
      vi.advanceTimersByTime(customTimeout * 1000 + 100);
      await expect(initPromise).rejects.toThrow(
        `ACP process timed out after ${customTimeout} seconds`
      );

      vi.useRealTimers();
    });

    it('should handle zero timeout as immediate timeout', () => {
      const configNoTimeout = {
        type: 'acp' as const,
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: 0,
      };

      const timeout = (handler as any).getTimeout(configNoTimeout);
      // 0 is treated as 0 (immediate timeout)
      expect(timeout).toBe(0);
    });
  });

  describe('JSON-RPC protocol', () => {
    it('should handle JSON-RPC error response', async () => {
      // Use fresh process and handler to avoid interference
      const freshHandler = new ACPTargetHandler();
      const freshProcess = {
        stdin: { write: vi.fn() },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        killed: false,
        kill: vi.fn(),
        on: vi.fn(),
      };

      // Wire up the message handler
      (freshHandler as any).setupMessageHandler(freshProcess);

      const requestPromise = (freshHandler as any).sendRequest(
        freshProcess,
        'initialize',
        {},
        1 // 1 second timeout
      );

      // Send error response immediately (using setImmediate to ensure event loop processing)
      process.nextTick(() => {
        freshProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            error: { code: -1, message: 'Method not found' },
          }) + '\n'
        );
      });

      // Advance timers to process event
      vi.advanceTimersByTime(10);

      await expect(requestPromise).rejects.toThrow('Method not found');
    });

    it('should write correct JSON-RPC message', () => {
      (handler as any).sendRequest(mockProcess, 'test-method', { foo: 'bar' });

      expect(mockProcess.stdin.write).toHaveBeenCalled();
      const written = mockProcess.stdin.write.mock.calls[0][0];
      const parsed = JSON.parse(written);

      expect(parsed.jsonrpc).toBe('2.0');
      expect(parsed.method).toBe('test-method');
      expect(parsed.params).toEqual({ foo: 'bar' });
      expect(parsed.id).toBeDefined();
    });
  });

  describe('setupMessageHandler', () => {
    it('should handle partial JSON messages', () => {
      (handler as any).ensureProcess(mockConfig);

      // Send partial message
      mockProcess.stdout.emit('data', '{"jsonrpc":"2.0",');

      // Complete message
      mockProcess.stdout.emit('data', '"id":1,"result":"ok"}\n');

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle multiple messages in one chunk', () => {
      (handler as any).ensureProcess(mockConfig);

      const msg1 = '{"jsonrpc":"2.0","id":1,"result":"ok"}\n';
      const msg2 = '{"jsonrpc":"2.0","id":2,"result":"ok2"}\n';

      // Both messages in one chunk
      mockProcess.stdout.emit('data', msg1 + msg2);

      // Should not throw
      expect(true).toBe(true);
    });

    it('should not log parse errors when DEBUG is not set', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      delete process.env['DEBUG'];
      delete process.env['WORK_DEBUG'];

      (handler as any).ensureProcess(mockConfig);

      // Send invalid JSON
      mockProcess.stdout.emit('data', 'invalid json\n');

      // Should not log anything
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should log parse errors when DEBUG is set', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      process.env['DEBUG'] = '1';

      (handler as any).ensureProcess(mockConfig);

      // Send invalid JSON
      mockProcess.stdout.emit('data', 'invalid json\n');

      // Should log error message first, then problematic line
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'ACP message parse error:',
        expect.stringContaining('JSON')
      );
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        2,
        'Problematic line:',
        'invalid json'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should log parse errors when WORK_DEBUG is set', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      process.env['WORK_DEBUG'] = '1';

      (handler as any).ensureProcess(mockConfig);

      // Send invalid JSON
      mockProcess.stdout.emit('data', 'invalid json\n');

      // Should log error message first, then problematic line
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        1,
        'ACP message parse error:',
        expect.stringContaining('JSON')
      );
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        2,
        'Problematic line:',
        'invalid json'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should truncate long problematic lines to 200 characters', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      process.env['DEBUG'] = '1';

      (handler as any).ensureProcess(mockConfig);

      // Send invalid JSON that's longer than 200 characters
      const longInvalidJson = 'x'.repeat(300) + '\n';
      mockProcess.stdout.emit('data', longInvalidJson);

      // Should log truncated line (200 chars max)
      expect(consoleWarnSpy).toHaveBeenNthCalledWith(
        2,
        'Problematic line:',
        'x'.repeat(200)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should kill all processes', () => {
      // Spawn a process
      (handler as any).ensureProcess(mockConfig);

      // Cleanup
      handler.cleanup();

      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should clear processes map', () => {
      // Spawn a process
      (handler as any).ensureProcess(mockConfig);

      // Verify process exists
      expect((handler as any).processes.size).toBe(1);

      // Cleanup
      handler.cleanup();

      // Verify map is cleared
      expect((handler as any).processes.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle process spawn errors', () => {
      const errorHandler = vi.fn();

      (handler as any).ensureProcess(mockConfig);

      // Get the error handler that was registered
      const onCall = mockProcess.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      );
      if (onCall) {
        const handler = onCall[1];
        handler(new Error('Spawn error'));
      }

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle stderr data', () => {
      (handler as any).ensureProcess(mockConfig);

      // Emit stderr - should not throw
      mockProcess.stderr.emit('data', 'Error message');

      expect(true).toBe(true);
    });

    it('should handle process exit', () => {
      (handler as any).ensureProcess(mockConfig);

      // Simulate process exit
      mockProcess.on.mock.calls.find((call: any) => call[0] === 'exit')?.[1](
        0,
        null
      );

      expect(true).toBe(true);
    });
  });

  describe('notification handling', () => {
    it('should invoke onNotification callback for session/update', () => {
      const notifications: Array<{ method: string; params: unknown }> = [];

      const configWithCallback: ACPTargetConfig = {
        ...mockConfig,
        onNotification: (method, params) => {
          notifications.push({ method, params });
        },
      };

      (handler as any).ensureProcess(configWithCallback);
      (handler as any).currentConfig = configWithCallback;

      // Simulate notification from ACP client
      const notification = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: { progress: 50, message: 'Processing...' },
      };

      mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');

      // Verify callback was invoked
      expect(notifications).toHaveLength(1);
      expect(notifications[0].method).toBe('session/update');
      expect(notifications[0].params).toEqual({
        progress: 50,
        message: 'Processing...',
      });
    });

    it('should handle multiple notifications in sequence', () => {
      const notifications: Array<{ method: string; params: unknown }> = [];

      const configWithCallback: ACPTargetConfig = {
        ...mockConfig,
        onNotification: (method, params) => {
          notifications.push({ method, params });
        },
      };

      (handler as any).ensureProcess(configWithCallback);
      (handler as any).currentConfig = configWithCallback;

      // Send multiple notifications
      const notif1 = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: { step: 1 },
      };
      const notif2 = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: { step: 2 },
      };

      mockProcess.stdout.emit(
        'data',
        JSON.stringify(notif1) + '\n' + JSON.stringify(notif2) + '\n'
      );

      expect(notifications).toHaveLength(2);
      expect(notifications[0].params).toEqual({ step: 1 });
      expect(notifications[1].params).toEqual({ step: 2 });
    });

    it('should ignore notifications when no callback registered', () => {
      // Use config without onNotification callback
      (handler as any).ensureProcess(mockConfig);
      (handler as any).currentConfig = mockConfig;

      const notification = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: { progress: 50 },
      };

      // Should not throw
      expect(() => {
        mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');
      }).not.toThrow();
    });

    it('should handle callback exceptions gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const configWithThrowingCallback: ACPTargetConfig = {
        ...mockConfig,
        onNotification: () => {
          throw new Error('Callback error');
        },
      };

      (handler as any).ensureProcess(configWithThrowingCallback);
      (handler as any).currentConfig = configWithThrowingCallback;

      const notification = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: { test: true },
      };

      // Should not throw - error should be caught and logged
      expect(() => {
        mockProcess.stdout.emit('data', JSON.stringify(notification) + '\n');
      }).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in notification callback:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle notifications alongside RPC responses', () => {
      const notifications: Array<{ method: string }> = [];

      const configWithCallback: ACPTargetConfig = {
        ...mockConfig,
        onNotification: (method) => {
          notifications.push({ method });
        },
      };

      (handler as any).ensureProcess(configWithCallback);
      (handler as any).currentConfig = configWithCallback;

      // Set up a pending request so the RPC response can be handled
      const mockResolve = vi.fn();
      const mockReject = vi.fn();
      (handler as any).pendingRequests.set(1, {
        resolve: mockResolve,
        reject: mockReject,
      });

      // Send interleaved notification and RPC response
      const notification = {
        jsonrpc: '2.0',
        method: 'session/update',
        params: {},
      };
      const response = { jsonrpc: '2.0', id: 1, result: 'ok' };

      mockProcess.stdout.emit(
        'data',
        JSON.stringify(notification) + '\n' + JSON.stringify(response) + '\n'
      );

      // Both should be handled without interference
      expect(notifications).toHaveLength(1);
      expect(notifications[0].method).toBe('session/update');
      expect(mockResolve).toHaveBeenCalledWith('ok');
    });
  });

  describe('Capability Configuration', () => {
    it('should send configured capabilities to ACP client', async () => {
      // Arrange: Config with specific capabilities
      const configWithCapabilities: ACPTargetConfig = {
        type: 'acp',
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: 30,
        capabilities: {
          fileSystem: {
            readTextFile: true,
            writeTextFile: false,
          },
          terminal: {
            create: true,
          },
        },
      };

      // Start the send operation
      const sendPromise = handler.send(mockWorkItems, configWithCapabilities);

      // Mock initialize response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
          }) + '\n'
        );
      }, 10);

      // Mock session/create response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      // Mock session/prompt response
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'AI analysis response' },
          }) + '\n'
        );
      }, 30);

      // Advance timers
      await vi.advanceTimersByTimeAsync(100);

      const result = await sendPromise;

      // Assert: Check that initialize request includes capabilities
      const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
        const data = call[0];
        return data.includes('"method":"initialize"');
      });

      expect(initializeCall).toBeDefined();
      const initializeData = JSON.parse(initializeCall[0]);
      expect(initializeData.params.capabilities).toEqual({
        fileSystem: {
          readTextFile: true,
          writeTextFile: false,
        },
        terminal: {
          create: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should default to empty capabilities when not configured', async () => {
      // Arrange: Config without capabilities
      const configNoCapabilities: ACPTargetConfig = {
        type: 'acp',
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: 30,
      };

      // Start the send operation
      const sendPromise = handler.send(mockWorkItems, configNoCapabilities);

      // Mock responses (same pattern as above)
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
          }) + '\n'
        );
      }, 10);

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'AI analysis response' },
          }) + '\n'
        );
      }, 30);

      // Advance timers
      await vi.advanceTimersByTimeAsync(100);

      const result = await sendPromise;

      // Assert: Should default to empty object (current MVP behavior)
      const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
        const data = call[0];
        return data.includes('"method":"initialize"');
      });

      expect(initializeCall).toBeDefined();
      const initializeData = JSON.parse(initializeCall[0]);
      expect(initializeData.params.capabilities).toEqual({});
      expect(result.success).toBe(true);
    });

    it('should handle partial capability configuration', async () => {
      // Arrange: Config with only fileSystem capabilities
      const configPartialCapabilities: ACPTargetConfig = {
        type: 'acp',
        cmd: 'opencode acp',
        cwd: process.cwd(),
        timeout: 30,
        capabilities: {
          fileSystem: {
            readTextFile: true,
          },
        },
      };

      // Start the send operation
      const sendPromise = handler.send(mockWorkItems, configPartialCapabilities);

      // Mock responses
      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0' } },
          }) + '\n'
        );
      }, 10);

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      setTimeout(() => {
        mockProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'AI analysis response' },
          }) + '\n'
        );
      }, 30);

      // Advance timers
      await vi.advanceTimersByTimeAsync(100);

      const result = await sendPromise;

      // Assert: Should pass through partial config as-is
      const initializeCall = (mockProcess.stdin.write as any).mock.calls.find((call: any) => {
        const data = call[0];
        return data.includes('"method":"initialize"');
      });

      expect(initializeCall).toBeDefined();
      const initializeData = JSON.parse(initializeCall[0]);
      expect(initializeData.params.capabilities).toEqual({
        fileSystem: {
          readTextFile: true,
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('system prompt initialization', () => {
    function createMockProcess() {
      return {
        stdin: {
          write: vi.fn(),
        },
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
        killed: false,
        kill: vi.fn(),
        on: vi.fn(),
      };
    }

    it('should send system prompt during session initialization', async () => {
      const configWithPrompt: ACPTargetConfig = {
        ...mockConfig,
        systemPrompt: 'You are a security expert focused on vulnerability detection.',
      };

      const testProcess = createMockProcess();
      mockSpawn.mockReturnValue(testProcess);

      // Setup response pipeline
      const sendPromise = handler.send(mockWorkItems, configWithPrompt);

      // Simulate initialize response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0.0' } },
          }) + '\n'
        );
      }, 10);

      // Simulate session/new response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      // Simulate system prompt response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'System prompt received' },
          }) + '\n'
        );
      }, 30);

      // Simulate work items prompt response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            result: { text: 'Security analysis complete' },
          }) + '\n'
        );
      }, 40);

      await vi.advanceTimersByTimeAsync(100);
      const result = await sendPromise;

      // Verify three prompts sent: initialize, session/new, system prompt, work items
      expect(testProcess.stdin.write).toHaveBeenCalledTimes(4);
      
      // Verify system prompt content
      const calls = (testProcess.stdin.write as any).mock.calls;
      const systemPromptCall = calls.find((call: any) => {
        const msg = JSON.parse(call[0]);
        return msg.method === 'session/prompt' && 
               msg.params?.prompt?.[0]?.text === 'You are a security expert focused on vulnerability detection.';
      });
      expect(systemPromptCall).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should skip system prompt if not configured', async () => {
      const configWithoutPrompt: ACPTargetConfig = {
        ...mockConfig,
        // No systemPrompt field
      };

      const testProcess = createMockProcess();
      mockSpawn.mockReturnValue(testProcess);

      const sendPromise = handler.send(mockWorkItems, configWithoutPrompt);

      // Simulate initialize response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0.0' } },
          }) + '\n'
        );
      }, 10);

      // Simulate session/new response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      // Simulate work items prompt response
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'Analysis complete' },
          }) + '\n'
        );
      }, 30);

      await vi.advanceTimersByTimeAsync(100);
      const result = await sendPromise;

      // Verify only 3 requests sent: initialize, session/new, work items (no system prompt)
      expect(testProcess.stdin.write).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
    });

    it('should send system prompt before work items in conversation history', async () => {
      const configWithPrompt: ACPTargetConfig = {
        ...mockConfig,
        systemPrompt: 'You are a code reviewer.',
      };

      const testProcess = createMockProcess();
      mockSpawn.mockReturnValue(testProcess);

      const sendPromise = handler.send(mockWorkItems, configWithPrompt);

      // Simulate all responses
      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            result: { protocolVersion: 1, serverInfo: { name: 'test', version: '1.0.0' } },
          }) + '\n'
        );
      }, 10);

      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 2,
            result: { sessionId: 'test-session-123' },
          }) + '\n'
        );
      }, 20);

      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 3,
            result: { text: 'System prompt received' },
          }) + '\n'
        );
      }, 30);

      setTimeout(() => {
        testProcess.stdout.emit(
          'data',
          JSON.stringify({
            jsonrpc: '2.0',
            id: 4,
            result: { text: 'Review complete' },
          }) + '\n'
        );
      }, 40);

      await vi.advanceTimersByTimeAsync(100);
      await sendPromise;

      // Verify ordering: initialize, session/new, system prompt, work items
      const calls = (testProcess.stdin.write as any).mock.calls;
      const methods = calls.map((call: any) => {
        const msg = JSON.parse(call[0]);
        return msg.method;
      });
      
      expect(methods).toEqual(['initialize', 'session/new', 'session/prompt', 'session/prompt']);
      
      // First prompt is system, second is work items
      const prompts = calls.filter((call: any) => {
        const msg = JSON.parse(call[0]);
        return msg.method === 'session/prompt';
      });
      expect(prompts[0][0]).toContain('You are a code reviewer.');
      expect(prompts[1][0]).toContain('Task:'); // Work item formatting
    });
  });
});
