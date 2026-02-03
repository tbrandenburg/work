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

  async send(
    workItems: WorkItem[],
    config: TargetConfig
  ): Promise<NotificationResult> {
    if (config.type !== 'acp') {
      throw new ACPError('Invalid config type');
    }

    this.currentConfig = config; // Store config for callback access

    try {
      const process = this.ensureProcess(config);
      const sessionId =
        config.sessionId || (await this.initializeSession(process, config));

      // Persist sessionId for reuse across CLI invocations
      if (!config.sessionId && sessionId) {
        config.sessionId = sessionId;
      }

      // Send prompt with work items
      const prompt = this.formatWorkItems(workItems);
      const response = await this.sendPrompt(process, sessionId, prompt);

      // For CLI use case: cleanup process after sending
      // This allows the CLI to exit cleanly
      setImmediate(() => this.cleanup());

      return {
        success: true,
        message: `AI response: ${JSON.stringify(response).substring(0, 200)}...`,
      };
    } catch (error) {
      // Clean up on error too
      setImmediate(() => this.cleanup());

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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

    // Initialize protocol (fast, < 1s)
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
      config.timeout || 30
    );

    // Create session (slow, 5-7s on first run)
    const sessionResult = (await this.sendRequest(
      process,
      'session/new',
      {
        cwd: config.cwd || global.process.cwd(),
        mcpServers: [],
      },
      config.timeout || 30
    )) as { sessionId: string };

    // Send system prompt if configured
    if (config.systemPrompt) {
      await this.sendPrompt(
        process,
        sessionResult.sessionId,
        config.systemPrompt
      );
    }

    return sessionResult.sessionId;
  }

  private async sendPrompt(
    process: ChildProcess,
    sessionId: string,
    content: string
  ): Promise<unknown> {
    return this.sendRequest(
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
      60
    ); // Longer timeout for prompts
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

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new ACPTimeoutError(timeoutSeconds));
      }, timeoutSeconds * 1000);

      this.pendingRequests.set(id, {
        resolve: (result: unknown) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      process.stdin?.write(JSON.stringify(message) + '\n');
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
