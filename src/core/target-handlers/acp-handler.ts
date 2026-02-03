/**
 * ACP (Agent Client Protocol) target handler implementation
 * Generic handler that works with ANY ACP-compliant client (OpenCode, Cursor, Cody, etc.)
 */

import { spawn, ChildProcess } from 'child_process';
import { WorkItem } from '../../types/work-item.js';
import {
  TargetConfig,
  NotificationResult,
  ACPTargetConfig,
} from '../../types/notification.js';
import { ACPError, ACPTimeoutError } from '../../types/errors.js';
import { TargetHandler } from '../notification-service.js';

interface ACPMessage {
  jsonrpc: '2.0';
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}

export class ACPTargetHandler implements TargetHandler {
  private processes = new Map<string, ChildProcess>();
  private nextId = 1;
  private pendingRequests = new Map<
    number,
    {
      resolve: (result: unknown) => void;
      reject: (error: Error) => void;
    }
  >();
  private currentConfig: ACPTargetConfig | null = null;

  /**
   * Default timeout for all ACP operations (5 minutes)
   * Covers 95% of AI operations while providing timeout protection
   */
  private static readonly DEFAULT_TIMEOUT = 300;

  /**
   * Get configured timeout or default
   * @param config - Optional ACPTargetConfig to read timeout from
   * @returns Timeout in seconds
   */
  private getTimeout(config?: ACPTargetConfig): number {
    return config?.timeout ?? ACPTargetHandler.DEFAULT_TIMEOUT;
  }

  async send(
    workItems: WorkItem[],
    config: TargetConfig
  ): Promise<NotificationResult> {
    if (config.type !== 'acp') {
      throw new ACPError('Invalid config type');
    }

    this.currentConfig = config; // Store config for callback access

    try {
      this.debug('ACPHandler.send: Starting notification');
      this.debug(`ACPHandler.send: Work items count: ${workItems.length}`);
      this.debug(`ACPHandler.send: Config: ${JSON.stringify(config)}`);
      this.debug(`ACPHandler.send: Timeout: ${this.getTimeout(config)}s`);
      
      const process = this.ensureProcess(config);
      this.debug('ACPHandler.send: Process ensured');
      
      const sessionId =
        config.sessionId || (await this.initializeSession(process, config));
      this.debug(`ACPHandler.send: Session ID: ${sessionId}`);

      // Persist sessionId for reuse across CLI invocations
      if (!config.sessionId && sessionId) {
        config.sessionId = sessionId;
      }

      // Send prompt with work items
      const prompt = this.formatWorkItems(workItems);
      this.debug(`ACPHandler.send: Sending prompt (length: ${prompt.length})`);
      const response = await this.sendPrompt(process, sessionId, prompt, config);
      this.debug('ACPHandler.send: Got response from prompt');

      // For CLI use case: cleanup process after sending
      // This allows the CLI to exit cleanly
      setImmediate(() => this.cleanup());

      return {
        success: true,
        message: `AI response: ${JSON.stringify(response).substring(0, 200)}...`,
      };
    } catch (error) {
      this.debug(`ACPHandler.send: Error: ${error instanceof Error ? error.message : String(error)}`);
      // Clean up on error too
      setImmediate(() => this.cleanup());

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private debug(message: string): void {
    if (process.env['DEBUG'] || process.env['WORK_DEBUG']) {
      console.error(`[ACP DEBUG] ${message}`);
    }
  }

  private ensureProcess(config: ACPTargetConfig): ChildProcess {
    const key = `${config.cmd}-${config.cwd || process.cwd()}`;

    if (this.processes.has(key)) {
      const existing = this.processes.get(key)!;
      if (!existing.killed) {
        return existing;
      }
    }

    // Spawn new process - parse command and args from config.cmd
    const cmdParts = config.cmd.split(' ');
    const command = cmdParts[0];
    const args = cmdParts.slice(1);

    if (!command) {
      throw new ACPError('Invalid cmd: empty command');
    }

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: config.cwd || process.cwd(),
    });

    this.setupMessageHandler(child);
    this.setupErrorHandler(child, key);

    this.processes.set(key, child);
    return child;
  }

  private setupMessageHandler(child: ChildProcess): void {
    let buffer = '';

    child.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const msg = JSON.parse(line) as ACPMessage;
            this.handleMessage(msg);
          } catch (err) {
            // Log parse errors in debug mode
            if (process.env['DEBUG'] || process.env['WORK_DEBUG']) {
              console.warn('ACP message parse error:', err instanceof Error ? err.message : String(err));
              console.warn('Problematic line:', line.substring(0, 200));
            }
          }
        }
      }
    });
  }

  private handleMessage(msg: ACPMessage): void {
    if (msg.id && this.pendingRequests.has(msg.id)) {
      const { resolve, reject } = this.pendingRequests.get(msg.id)!;
      this.pendingRequests.delete(msg.id);

      if (msg.error) {
        reject(new ACPError(msg.error.message, 'ACP_RPC_ERROR'));
      } else {
        resolve(msg.result);
      }
    } else if (msg.method && this.currentConfig?.onNotification) {
      // Handle notifications by invoking callback
      try {
        this.currentConfig.onNotification(msg.method, msg.params);
      } catch (error) {
        console.error('Error in notification callback:', error);
        // Continue processing - don't let callback errors crash the handler
      }
    }
    // Otherwise ignore unhandled notifications
  }

  private setupErrorHandler(child: ChildProcess, key: string): void {
    child.on('error', (error: Error) => {
      console.error(`ACP process error:`, error);
      this.processes.delete(key);
    });

    child.on('exit', (code: number | null) => {
      if (code !== 0) {
        console.error(`ACP process exited with code ${code}`);
      }
      this.processes.delete(key);
    });

    child.stderr?.on('data', (data: Buffer) => {
      const str = data.toString();
      // Filter out info logs, show errors
      if (!str.includes('INFO') && !str.includes('service=')) {
        console.error('ACP client stderr:', str);
      }
    });
  }

  private async initializeSession(
    process: ChildProcess,
    config: ACPTargetConfig
  ): Promise<string> {
    // NOTE: Session creation typically takes 5-7 seconds on first run
    // as the ACP client bootstraps the environment. Subsequent sessions
    // with persisted sessionId are much faster.

    this.debug('initializeSession: Starting');
    const timeout = this.getTimeout(config);
    this.debug(`initializeSession: Timeout set to ${timeout}s`);

    // Initialize protocol (fast, < 1s)
    this.debug('initializeSession: Sending initialize request');
    await this.sendRequest(
      process,
      'initialize',
      {
        protocolVersion: 1,
        clientInfo: {
          name: 'work-cli',
          version: '0.2.7',
        },
        capabilities: config.capabilities || {}, // Use configured capabilities or default to minimal
      },
      timeout
    );
    this.debug('initializeSession: Initialize complete');

    // Create session (slow, 5-7s on first run)
    this.debug('initializeSession: Sending session/new request');
    const sessionResult = (await this.sendRequest(
      process,
      'session/new',
      {
        cwd: config.cwd || global.process.cwd(),
        mcpServers: [],
      },
      timeout
    )) as { sessionId: string };
    this.debug(`initializeSession: Session created: ${sessionResult.sessionId}`);

    // Send system prompt if configured
    if (config.systemPrompt) {
      this.debug('initializeSession: Sending system prompt');
      await this.sendPrompt(
        process,
        sessionResult.sessionId,
        config.systemPrompt,
        config
      );
      this.debug('initializeSession: System prompt sent');
    }

    this.debug('initializeSession: Complete');
    return sessionResult.sessionId;
  }

  private async sendPrompt(
    process: ChildProcess,
    sessionId: string,
    content: string,
    config: ACPTargetConfig
  ): Promise<unknown> {
    this.debug(`sendPrompt: Sending prompt (length: ${content.length})`);
    // NOTE: OpenCode supports multiple prompt formats:
    // - prompt: [{ type: 'text', text: '...' }] (our format)
    // - content: [{ role: 'user', content: '...' }] (alternative)
    // Both are valid per ACP spec.
    const result = await this.sendRequest(
      process,
      'session/prompt',
      {
        sessionId,
        prompt: [
          {
            type: 'text',
            text: content,
          },
        ],
      },
      this.getTimeout(config)
    );
    this.debug('sendPrompt: Complete');
    return result;
  }

  private async sendRequest(
    process: ChildProcess,
    method: string,
    params: unknown,
    timeoutSeconds: number
  ): Promise<unknown> {
    const id = this.nextId++;
    const message: ACPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params,
    };

    this.debug(`sendRequest: ${method} (id=${id}, timeout=${timeoutSeconds}s)`);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.debug(`sendRequest: Timeout after ${timeoutSeconds}s for ${method} (id=${id})`);
        this.pendingRequests.delete(id);
        reject(new ACPTimeoutError(timeoutSeconds));
      }, timeoutSeconds * 1000);

      this.pendingRequests.set(id, {
        resolve: (result: unknown) => {
          this.debug(`sendRequest: Response received for ${method} (id=${id})`);
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error: Error) => {
          this.debug(`sendRequest: Error for ${method} (id=${id}): ${error.message}`);
          clearTimeout(timeout);
          reject(error);
        },
      });

      const json = JSON.stringify(message);
      this.debug(`sendRequest: Writing to stdin: ${json}`);
      process.stdin?.write(json + '\n');
    });
  }

  private formatWorkItems(workItems: WorkItem[]): string {
    if (workItems.length === 0) {
      return 'No work items to analyze.';
    }

    return workItems
      .map(item => {
        return `Task: ${item.title}\nID: ${item.id}\nStatus: ${item.state}\nDescription: ${item.description || 'N/A'}`;
      })
      .join('\n\n');
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    for (const [key, process] of this.processes.entries()) {
      process.kill('SIGTERM');
      this.processes.delete(key);
    }
  }
}
