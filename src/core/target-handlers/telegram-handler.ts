import { TargetHandler } from '../notification-service.js';
import { WorkItem } from '../../types/work-item.js';
import { TargetConfig, NotificationResult } from '../../types/notification.js';

/**
 * Telegram target handler for sending work item notifications to Telegram chats
 */
export class TelegramTargetHandler implements TargetHandler {
  async send(
    workItems: WorkItem[],
    config: TargetConfig,
    _options?: { async?: boolean }
  ): Promise<NotificationResult> {
    if (config.type !== 'telegram') {
      return {
        success: false,
        error: 'Invalid config type for TelegramTargetHandler',
      };
    }

    const { botToken, chatId } = config;

    try {
      const message = this.formatMessage(workItems);
      return await this.sendToTelegram(botToken, chatId, message);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private formatMessage(workItems: WorkItem[]): string {
    // Detect plain message marker
    if (workItems.length === 1 && workItems[0]?.id === '__plain_message__') {
      const message = workItems[0].title;
      return this.formatPlainMessage(message);
    }

    // Regular work items formatting
    if (workItems.length === 0) {
      return '<b>📋 Work Items Update</b>\n\nNo items to report.';
    }

    const header = `<b>📋 Work Items Update</b>\n<i>${workItems.length} item${workItems.length === 1 ? '' : 's'}</i>\n`;

    const items = workItems
      .map((item, index) => {
        const emoji = this.getStateEmoji(item.state);
        const title = this.escapeHtml(item.title);
        const id = this.escapeHtml(item.id);

        return `${index + 1}. ${emoji} <b>${title}</b>\n   ID: <code>${id}</code>`;
      })
      .join('\n\n');

    const fullMessage = header + '\n' + items;
    
    // Telegram message limit is 4096 characters
    if (fullMessage.length > 4000) {
      const truncatedItems = workItems
        .slice(0, 3) // Show only first 3 items
        .map((item, index) => {
          const emoji = this.getStateEmoji(item.state);
          const title = this.escapeHtml(item.title.substring(0, 50) + (item.title.length > 50 ? '...' : ''));
          const id = this.escapeHtml(item.id);

          return `${index + 1}. ${emoji} <b>${title}</b>\n   ID: <code>${id}</code>`;
        })
        .join('\n\n');
      
      const remaining = workItems.length - 3;
      const truncatedMessage = header + '\n' + truncatedItems + 
        (remaining > 0 ? `\n\n<i>... and ${remaining} more item${remaining === 1 ? '' : 's'}</i>` : '');
      
      return truncatedMessage;
    }

    return fullMessage;
  }

  /**
   * Format a plain text message with HTML markup
   */
  private formatPlainMessage(message: string): string {
    const escapedMessage = this.escapeHtml(message);
    
    // Check character limit
    if (escapedMessage.length > 4000) {
      const truncated = escapedMessage.substring(0, 3950);
      return `<b>📬 Message</b>\n\n${truncated}\n\n<i>... (message truncated)</i>`;
    }
    
    return `<b>📬 Message</b>\n\n${escapedMessage}`;
  }

  private getStateEmoji(state: string): string {
    switch (state.toLowerCase()) {
      case 'open':
      case 'new':
        return '🆕';
      case 'in_progress':
      case 'active':
        return '🔄';
      case 'done':
      case 'closed':
        return '✅';
      case 'blocked':
        return '🚫';
      default:
        return '📝';
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private async sendToTelegram(
    botToken: string,
    chatId: string,
    message: string
  ): Promise<NotificationResult> {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          description?: string;
        };
        return {
          success: false,
          error: `Telegram API error: ${response.status} ${response.statusText}${errorData.description ? ` - ${errorData.description}` : ''}`,
        };
      }

      return {
        success: true,
        message: `Sent notification to Telegram chat ${chatId}`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send Telegram message: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
