/**
 * Notification system type definitions
 */

export type TargetType = 'bash' | 'telegram' | 'email' | 'acp';

export interface NotificationTarget {
  readonly name: string;
  readonly type: TargetType;
  readonly config: TargetConfig;
}

export type TargetConfig =
  | BashTargetConfig
  | TelegramTargetConfig
  | EmailTargetConfig
  | ACPTargetConfig;

export interface BashTargetConfig {
  readonly type: 'bash';
  readonly script: string;
  readonly timeout?: number;
}

export interface TelegramTargetConfig {
  readonly type: 'telegram';
  readonly botToken: string;
  readonly chatId: string;
}

export interface EmailTargetConfig {
  readonly type: 'email';
  readonly to: string;
  readonly from?: string;
  readonly smtpHost?: string;
}

export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string; // Mutable to allow session persistence
}

export interface NotificationRequest {
  readonly query: string;
  readonly targetName: string;
}

export interface NotificationResult {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
}
