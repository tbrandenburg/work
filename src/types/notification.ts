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

/**
 * ACP client capabilities for permission control
 * @see dev/poc-opencode-server/README.md:111-133 for protocol examples
 */
export interface ACPCapabilities {
  fileSystem?: {
    readTextFile?: boolean;
    writeTextFile?: boolean;
    listDirectory?: boolean;
  };
  terminal?: {
    create?: boolean;
    sendText?: boolean;
  };
  editor?: {
    applyDiff?: boolean;
    openFile?: boolean;
  };
}

export interface ACPTargetConfig {
  readonly type: 'acp';
  readonly cmd: string;
  readonly cwd?: string;
  readonly timeout?: number;
  sessionId?: string; // Mutable to allow session persistence
  onNotification?: (method: string, params: unknown) => void; // Optional streaming callback
  capabilities?: ACPCapabilities; // Optional client capabilities for permission control
  systemPrompt?: string; // Optional system prompt for AI role and behavior definition
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
