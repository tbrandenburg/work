/**
 * Bash target handler implementation
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { WorkItem } from '../../types/work-item.js';
import { TargetConfig, NotificationResult } from '../../types/notification.js';
import { TargetHandler } from '../notification-service.js';

export class BashTargetHandler implements TargetHandler {
  async send(
    workItems: WorkItem[],
    config: TargetConfig,
    _options?: { async?: boolean }
  ): Promise<NotificationResult> {
    if (config.type !== 'bash') {
      return {
        success: false,
        error: 'Invalid config type for BashTargetHandler',
      };
    }

    const { script, timeout = 30 } = config;

    try {
      // Handle built-in work:log script
      if (script === 'work:log') {
        return this.handleBuiltinLog(workItems);
      }

      // Handle custom script execution
      return this.executeScript(script, workItems, timeout);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async handleBuiltinLog(
    workItems: WorkItem[]
  ): Promise<NotificationResult> {
    try {
      const notificationsDir = path.join(
        os.homedir(),
        '.work',
        'notifications'
      );
      await fs.mkdir(notificationsDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `notification-${timestamp}.json`;
      const filepath = path.join(notificationsDir, filename);

      const logData = {
        timestamp: new Date().toISOString(),
        itemCount: workItems.length,
        items: workItems,
      };

      await fs.writeFile(filepath, JSON.stringify(logData, null, 2));

      return {
        success: true,
        message: `Logged ${workItems.length} items to ${filepath}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to write log file: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async executeScript(
    scriptPath: string,
    workItems: WorkItem[],
    timeoutSeconds: number
  ): Promise<NotificationResult> {
    return new Promise(resolve => {
      const jsonData = JSON.stringify({
        timestamp: new Date().toISOString(),
        itemCount: workItems.length,
        items: workItems,
      });

      const child = spawn(scriptPath, [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: timeoutSeconds * 1000,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      child.on('close', code => {
        if (code === 0) {
          resolve({
            success: true,
            message: `Script executed successfully: ${stdout.trim()}`,
          });
        } else {
          resolve({
            success: false,
            error: `Script failed with code ${code}: ${stderr.trim()}`,
          });
        }
      });

      child.on('error', error => {
        resolve({
          success: false,
          error: `Failed to execute script: ${error.message}`,
        });
      });

      // Send JSON data to script's stdin
      child.stdin?.write(jsonData);
      child.stdin?.end();
    });
  }
}
