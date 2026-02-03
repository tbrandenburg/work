import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../../../core/index.js';
import { BaseCommand } from '../../../base-command.js';
import { formatOutput } from '../../../formatter.js';
import { TargetConfig } from '../../../../types/notification.js';

interface ParsedFlags {
  type: 'bash' | 'telegram' | 'email' | 'acp';
  script?: string;
  timeout?: number;
  'bot-token'?: string;
  'chat-id'?: string;
  to?: string;
  from?: string;
  'smtp-host'?: string;
  cmd?: string;
  cwd?: string;
  'system-prompt'?: string;
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
    '<%= config.bin %> notify target <%= command.id %> ai --type acp --cmd "opencode acp"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'target type',
      options: ['bash', 'telegram', 'email', 'acp'],
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
    cmd: Flags.string({
      description:
        'Command to spawn ACP client (e.g., "opencode acp", "cursor acp")',
      dependsOn: ['type'],
    }),
    cwd: Flags.string({
      description: 'Working directory for ACP client context',
      dependsOn: ['type'],
    }),
    'system-prompt': Flags.string({
      description: 'System prompt for ACP agent behavior and role definition',
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

    if (flags.type === 'acp' && !flags.cmd) {
      this.error('--cmd is required for acp targets');
    }

    const engine = new WorkEngine();

    try {
      await engine.addNotificationTarget(args.name, {
        name: args.name,
        type: flags.type as 'bash' | 'telegram' | 'email' | 'acp',
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
      case 'acp':
        if (!flags.cmd) {
          throw new Error('cmd is required for acp target');
        }
        return {
          type: 'acp' as const,
          cmd: flags.cmd,
          cwd: flags.cwd || process.cwd(),
          timeout: 30,
          ...(flags['system-prompt'] && {
            systemPrompt: flags['system-prompt'],
          }),
        };
      default:
        throw new Error(`Unsupported target type: ${flags.type as string}`);
    }
  }
}
