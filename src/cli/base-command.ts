/**
 * Base command class with universal format flag and error handling
 */

import { Command, Flags } from '@oclif/core';
import { ResponseFormat } from '../types/response.js';
import { formatError } from './formatter.js';

/**
 * Base command class that provides universal format flag and JSON-aware error handling
 */
export abstract class BaseCommand extends Command {
  /**
   * Base flags that all commands should inherit
   */
  static override baseFlags = {
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };

  /**
   * Check if the command is running in JSON mode
   */
  protected async getJsonMode(): Promise<boolean> {
    try {
      const { flags } = await this.parse();
      return (flags as { format?: ResponseFormat }).format === 'json';
    } catch {
      // Fallback to command line parsing if this.parse() fails
      const argv = process.argv.slice(2);
      return argv.includes('--format=json') || 
             (argv.includes('--format') && argv[argv.indexOf('--format') + 1] === 'json') ||
             argv.includes('-f=json') ||
             (argv.includes('-f') && argv[argv.indexOf('-f') + 1] === 'json');
    }
  }

  /**
   * Handle errors appropriately for the current output mode
   * In JSON mode, outputs structured error to stderr and exits
   * In table mode, uses standard oclif error handling
   */
  protected handleError(error: string | Error, exitCode = 1): never {
    // Check if we're in JSON mode by parsing command line arguments
    // This avoids calling this.parse() which may fail in error scenarios
    const argv = process.argv.slice(2);
    const isJsonMode = argv.includes('--format=json') || 
                      (argv.includes('--format') && argv[argv.indexOf('--format') + 1] === 'json') ||
                      argv.includes('-f=json') ||
                      (argv.includes('-f') && argv[argv.indexOf('-f') + 1] === 'json');
    
    if (isJsonMode) {
      const errorOutput = formatError(error, 'json');
      process.stderr.write(errorOutput);
      process.exit(exitCode);
    }
    
    // Use standard oclif error handling for table mode
    return this.error(error instanceof Error ? error.message : error, { exit: exitCode });
  }
}
