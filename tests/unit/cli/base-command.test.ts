/**
 * Unit tests for BaseCommand class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseCommand } from '../../../src/cli/base-command.js';

// Create a concrete test implementation of BaseCommand
class TestCommand extends BaseCommand {
  constructor() {
    super([], {} as any);
  }

  async run(): Promise<void> {
    // Test implementation
  }

  // Make protected methods public for testing
  public async getJsonMode(): Promise<boolean> {
    return super.getJsonMode();
  }

  public handleError(error: string | Error, exitCode = 1): never {
    return super.handleError(error, exitCode);
  }
}

describe('BaseCommand', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  describe('baseFlags', () => {
    it('should have format flag defined', () => {
      expect(BaseCommand.baseFlags.format).toBeDefined();
      expect(BaseCommand.baseFlags.format.options).toEqual(['table', 'json']);
      expect(BaseCommand.baseFlags.format.default).toBe('table');
      expect(BaseCommand.baseFlags.format.char).toBe('f');
      expect(BaseCommand.baseFlags.format.description).toBe('output format');
    });
  });

  describe('getJsonMode', () => {
    it('should return true for --format=json', async () => {
      process.argv = ['node', 'test', '--format=json'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(true);
    });

    it('should return true for --format json', async () => {
      process.argv = ['node', 'test', '--format', 'json'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(true);
    });

    it('should return true for -f=json', async () => {
      process.argv = ['node', 'test', '-f=json'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(true);
    });

    it('should return true for -f json', async () => {
      process.argv = ['node', 'test', '-f', 'json'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(true);
    });

    it('should return false for table format', async () => {
      process.argv = ['node', 'test', '--format', 'table'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(false);
    });

    it('should return false when no format specified', async () => {
      process.argv = ['node', 'test'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(false);
    });

    it('should handle edge cases with format flag placement', async () => {
      process.argv = [
        'node',
        'test',
        'other-args',
        '--format',
        'json',
        'more-args',
      ];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(true);
    });

    it('should return false when format flag has no value', async () => {
      process.argv = ['node', 'test', '--format'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(false);
    });

    it('should return false when -f flag has no value', async () => {
      process.argv = ['node', 'test', '-f'];
      const command = new TestCommand();

      const result = await command.getJsonMode();

      expect(result).toBe(false);
    });
  });

  describe('handleError fallback behavior', () => {
    it('should detect JSON mode from argv for error handling', () => {
      process.argv = ['node', 'test', '--format=json'];
      const command = new TestCommand();

      // Mock process.stderr.write and process.exit to test error handling
      const stderrSpy = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`Process exit called with code ${code}`);
      });

      expect(() => {
        command.handleError('Test error');
      }).toThrow('Process exit called with code 1');

      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test error')
      );
      expect(exitSpy).toHaveBeenCalledWith(1);

      stderrSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should detect JSON mode with custom exit code', () => {
      process.argv = ['node', 'test', '-f', 'json'];
      const command = new TestCommand();

      const stderrSpy = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`Process exit called with code ${code}`);
      });

      expect(() => {
        command.handleError('Custom error', 2);
      }).toThrow('Process exit called with code 2');

      expect(exitSpy).toHaveBeenCalledWith(2);

      stderrSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('should handle --format with space separated argument (line 57)', () => {
      process.argv = ['node', 'test', '--format', 'json'];
      const command = new TestCommand();

      const stderrSpy = vi
        .spyOn(process.stderr, 'write')
        .mockImplementation(() => true);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`Process exit called with code ${code}`);
      });

      expect(() => {
        command.handleError('Test format space error');
      }).toThrow('Process exit called with code 1');

      // This should trigger line 57: argv.indexOf('--format') + 1
      expect(stderrSpy).toHaveBeenCalledWith(
        expect.stringContaining('Test format space error')
      );

      stderrSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
