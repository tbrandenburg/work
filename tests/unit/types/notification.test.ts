/**
 * Unit tests for Notification types
 */

import {
  TargetType,
  NotificationTarget,
  TargetConfig,
  BashTargetConfig,
  TelegramTargetConfig,
  EmailTargetConfig,
  NotificationRequest,
  NotificationResult,
} from '@/types/notification';

describe('Notification Types', () => {
  it('should have valid TargetType values', () => {
    const types: TargetType[] = ['bash', 'telegram', 'email'];
    expect(types).toHaveLength(3);
    expect(types).toContain('bash');
    expect(types).toContain('telegram');
    expect(types).toContain('email');
  });

  it('should create valid BashTargetConfig object', () => {
    const config: BashTargetConfig = {
      type: 'bash',
      script: 'echo "notification: $MESSAGE"',
      timeout: 5000,
    };

    expect(config.type).toBe('bash');
    expect(config.script).toBe('echo "notification: $MESSAGE"');
    expect(config.timeout).toBe(5000);
  });

  it('should create valid BashTargetConfig object without optional timeout', () => {
    const config: BashTargetConfig = {
      type: 'bash',
      script: 'echo "alert"',
    };

    expect(config.type).toBe('bash');
    expect(config.script).toBe('echo "alert"');
    expect(config.timeout).toBeUndefined();
  });

  it('should create valid TelegramTargetConfig object', () => {
    const config: TelegramTargetConfig = {
      type: 'telegram',
      botToken: 'bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      chatId: '-123456789',
    };

    expect(config.type).toBe('telegram');
    expect(config.botToken).toBe(
      'bot123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'
    );
    expect(config.chatId).toBe('-123456789');
  });

  it('should create valid EmailTargetConfig object with all fields', () => {
    const config: EmailTargetConfig = {
      type: 'email',
      to: 'user@example.com',
      from: 'noreply@example.com',
      smtpHost: 'smtp.example.com',
    };

    expect(config.type).toBe('email');
    expect(config.to).toBe('user@example.com');
    expect(config.from).toBe('noreply@example.com');
    expect(config.smtpHost).toBe('smtp.example.com');
  });

  it('should create valid EmailTargetConfig object with minimal fields', () => {
    const config: EmailTargetConfig = {
      type: 'email',
      to: 'user@example.com',
    };

    expect(config.type).toBe('email');
    expect(config.to).toBe('user@example.com');
    expect(config.from).toBeUndefined();
    expect(config.smtpHost).toBeUndefined();
  });

  it('should create valid NotificationTarget with BashTargetConfig', () => {
    const target: NotificationTarget = {
      name: 'local-alert',
      type: 'bash',
      config: {
        type: 'bash',
        script: 'osascript -e "display notification \\"$MESSAGE\\""',
      },
    };

    expect(target.name).toBe('local-alert');
    expect(target.type).toBe('bash');
    expect(target.config.type).toBe('bash');
    expect((target.config as BashTargetConfig).script).toContain('osascript');
  });

  it('should create valid NotificationTarget with TelegramTargetConfig', () => {
    const target: NotificationTarget = {
      name: 'team-chat',
      type: 'telegram',
      config: {
        type: 'telegram',
        botToken: 'bot123:token',
        chatId: '456',
      },
    };

    expect(target.name).toBe('team-chat');
    expect(target.type).toBe('telegram');
    expect(target.config.type).toBe('telegram');
    expect((target.config as TelegramTargetConfig).botToken).toBe(
      'bot123:token'
    );
    expect((target.config as TelegramTargetConfig).chatId).toBe('456');
  });

  it('should create valid NotificationTarget with EmailTargetConfig', () => {
    const target: NotificationTarget = {
      name: 'admin-alerts',
      type: 'email',
      config: {
        type: 'email',
        to: 'admin@company.com',
        from: 'alerts@company.com',
      },
    };

    expect(target.name).toBe('admin-alerts');
    expect(target.type).toBe('email');
    expect(target.config.type).toBe('email');
    expect((target.config as EmailTargetConfig).to).toBe('admin@company.com');
    expect((target.config as EmailTargetConfig).from).toBe(
      'alerts@company.com'
    );
  });

  it('should create valid NotificationRequest object', () => {
    const request: NotificationRequest = {
      query: 'priority:high state:active',
      targetName: 'team-chat',
    };

    expect(request.query).toBe('priority:high state:active');
    expect(request.targetName).toBe('team-chat');
  });

  it('should create valid NotificationResult for success case', () => {
    const result: NotificationResult = {
      success: true,
      message: 'Notification sent successfully',
    };

    expect(result.success).toBe(true);
    expect(result.message).toBe('Notification sent successfully');
    expect(result.error).toBeUndefined();
  });

  it('should create valid NotificationResult for error case', () => {
    const result: NotificationResult = {
      success: false,
      error: 'Failed to connect to Telegram API',
    };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to connect to Telegram API');
    expect(result.message).toBeUndefined();
  });

  it('should create valid NotificationResult with both message and error', () => {
    const result: NotificationResult = {
      success: false,
      message: 'Partial delivery',
      error: 'Some targets failed',
    };

    expect(result.success).toBe(false);
    expect(result.message).toBe('Partial delivery');
    expect(result.error).toBe('Some targets failed');
  });

  it('should validate TargetConfig type discrimination', () => {
    const bashConfig: TargetConfig = {
      type: 'bash',
      script: 'echo "test"',
    };

    const telegramConfig: TargetConfig = {
      type: 'telegram',
      botToken: 'token',
      chatId: 'chat',
    };

    const emailConfig: TargetConfig = {
      type: 'email',
      to: 'test@example.com',
    };

    expect(bashConfig.type).toBe('bash');
    expect(telegramConfig.type).toBe('telegram');
    expect(emailConfig.type).toBe('email');
  });
});
