import { vi } from 'vitest';
import { TelegramTargetHandler } from '../../../../src/core/target-handlers/telegram-handler';
import { WorkItem } from '../../../../src/types/work-item';
import { TelegramTargetConfig } from '../../../../src/types/notification';

// Mock fetch globally
global.fetch = vi.fn();

describe('TelegramTargetHandler', () => {
  let handler: TelegramTargetHandler;
  const mockConfig: TelegramTargetConfig = {
    type: 'telegram',
    botToken: 'test-bot-token',
    chatId: 'test-chat-id',
  };

  const mockWorkItems: WorkItem[] = [
    {
      id: 'TASK-001',
      kind: 'task',
      title: 'Test task',
      state: 'new',
      priority: 'medium',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    handler = new TelegramTargetHandler();
    vi.clearAllMocks();
  });

  describe('send', () => {
    it('should reject invalid config type', async () => {
      const invalidConfig = { type: 'bash' as any, script: 'test' };
      
      const result = await handler.send(mockWorkItems, invalidConfig);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid config type for TelegramTargetHandler');
    });

    it('should send message to Telegram successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sent notification to Telegram chat test-chat-id');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"chat_id":"test-chat-id"'),
        })
      );
    });

    it('should handle Telegram API error', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: vi.fn().mockResolvedValue({ description: 'Invalid chat_id' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Telegram API error: 400 Bad Request - Invalid chat_id');
    });

    it('should handle network error', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await handler.send(mockWorkItems, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send Telegram message: Network error');
    });

    it('should format message with HTML and emojis', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await handler.send(mockWorkItems, mockConfig);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.parse_mode).toBe('HTML');
      expect(body.text).toContain('<b>📋 Work Items Update</b>');
      expect(body.text).toContain('🆕');
      expect(body.text).toContain('<code>TASK-001</code>');
    });

    it('should handle empty work items', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: true }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await handler.send([], mockConfig);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.text).toContain('No items to report');
    });
  });
});
