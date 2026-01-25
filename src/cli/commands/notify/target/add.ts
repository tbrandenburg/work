import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../../../core/index.js';
import { BaseCommand } from '../../../base-command.js';
import { formatOutput } from '../../../formatter.js';
import { TargetConfig } from '../../../../types/notification.js';

interface ParsedFlags {
  type: 'bash' | 'telegram' | 'email';
  script?: string;
  timeout?: number;
  'bot-token'?: string;
  'chat-id'?: string;
  to?: string;
  from?: string;
  'smtp-host'?: string;
}

export default class NotifyTargetAdd extends BaseCommand {
  static override args = {
    name: Args.string({
      description: 'target name',
      required: true,
    }),
  };

  static override description = 'Add a notification target';

  static override examples = [
    '<%= config.bin %> notify target <%= command.id %> alerts --type bash --script work:log',
    '<%= config.bin %> notify target <%= command.id %> team --type bash --script /usr/local/bin/notify-team.sh',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'target type',
      options: ['bash', 'telegram', 'email'],
      required: true,
    }),
    script: Flags.string({
      description: 'bash script path (for bash type)',
      dependsOn: ['type'],
    }),
    timeout: Flags.integer({
      description: 'script timeout in seconds (for bash type)',
      dependsOn: ['type'],
    }),
    'bot-token': Flags.string({
      description: 'telegram bot token (for telegram type)',
      dependsOn: ['type'],
    }),
    'chat-id': Flags.string({
      description: 'telegram chat ID (for telegram type)',
      dependsOn: ['type'],
    }),
    to: Flags.string({
      description: 'email recipient (for email type)',
      dependsOn: ['type'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(NotifyTargetAdd);

    if (flags.type === 'bash' && !flags.script) {
      this.error('--script is required for bash targets');
    }

    if (
      flags.type === 'telegram' &&
      (!flags['bot-token'] || !flags['chat-id'])
    ) {
      this.error('--bot-token and --chat-id are required for telegram targets');
    }

    if (flags.type === 'email' && !flags.to) {
      this.error('--to is required for email targets');
    }

    const engine = new WorkEngine();

    try {
      await engine.addNotificationTarget(args.name, {
        name: args.name,
        type: flags.type as 'bash' | 'telegram' | 'email',
        config: this.buildConfig(flags as ParsedFlags),
      });

      const output = formatOutput(
        `Target '${args.name}' added successfully`,
        (await this.getJsonMode()) ? 'json' : 'table'
      );

      this.log(output);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private buildConfig(flags: ParsedFlags): TargetConfig {
    switch (flags.type) {
      case 'bash':
        return {
          type: 'bash' as const,
          script: flags.script!,
          ...(flags.timeout && { timeout: flags.timeout }),
        };
      case 'telegram':
        return {
          type: 'telegram' as const,
          botToken: flags['bot-token']!,
          chatId: flags['chat-id']!,
        };
      case 'email':
        return {
          type: 'email' as const,
          to: flags.to!,
        };
      default:
        throw new Error(`Unsupported target type: ${flags.type as string}`);
    }
  }
}
