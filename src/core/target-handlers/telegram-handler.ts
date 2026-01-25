import { TargetHandler } from '../notification-service.js';
import { WorkItem } from '../../types/work-item.js';
import { TargetConfig, NotificationResult } from '../../types/notification.js';

/**
 * Telegram target handler for sending work item notifications to Telegram chats
 */
export class TelegramTargetHandler implements TargetHandler {
  async send(
    workItems: WorkItem[],
    config: TargetConfig
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

    return header + '\n' + items;
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
