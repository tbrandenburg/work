/**
 * Notification service for executing notifications to configured targets
 */

import { WorkItem } from '../types/work-item.js';
import {
  NotificationTarget,
  TargetConfig,
  TargetType,
  NotificationResult,
} from '../types/notification.js';

export interface TargetHandler {
  send(
    workItems: WorkItem[],
    config: TargetConfig,
    options?: { async?: boolean }
  ): Promise<NotificationResult>;
}

export class NotificationService {
  private targetHandlers = new Map<TargetType, TargetHandler>();

  constructor() {
    // Built-in handlers will be registered by the engine
  }

  /**
   * Register a target handler for a specific type
   */
  registerHandler(type: TargetType, handler: TargetHandler): void {
    this.targetHandlers.set(type, handler);
  }

  /**
   * Send notification to a target
   */
  async sendNotification(
    workItems: WorkItem[],
    target: NotificationTarget,
    options?: { async?: boolean }
  ): Promise<NotificationResult> {
    const handler = this.targetHandlers.get(target.type);
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for target type: ${target.type}`,
      };
    }

    try {
      return await handler.send(workItems, target.config, options);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Send a plain text message to a notification target
   * Uses a special marker work item to signal plain message mode
   */
  async sendPlainNotification(
    message: string,
    target: NotificationTarget
  ): Promise<NotificationResult> {
    const handler = this.targetHandlers.get(target.type);
    if (!handler) {
      return {
        success: false,
        error: `No handler registered for target type: ${target.type}`,
      };
    }

    // Create special marker work item for plain messages
    const messageWorkItem: WorkItem = {
      id: '__plain_message__',
      kind: 'task',
      title: message,
      state: 'new',
      priority: 'medium',
      labels: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      return await handler.send([messageWorkItem], target.config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get list of supported target types
   */
  getSupportedTypes(): TargetType[] {
    return Array.from(this.targetHandlers.keys());
  }
}
