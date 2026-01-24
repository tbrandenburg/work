import { WorkEngine } from '../../../../core/index.js';
import { BaseCommand } from '../../../base-command.js';
import { formatOutput } from '../../../formatter.js';

export default class NotifyTargetList extends BaseCommand {
  static override description = 'List notification targets';

  static override examples = [
    '<%= config.bin %> notify target <%= command.id %>',
    '<%= config.bin %> notify target <%= command.id %> --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const engine = new WorkEngine();

    try {
      const targets = await engine.listNotificationTargets();
      const isJsonMode = await this.getJsonMode();

      if (isJsonMode) {
        const output = formatOutput(
          targets,
          'json',
          {
            total: targets.length,
            timestamp: new Date().toISOString(),
          }
        );
        this.log(output);
        return;
      }

      // Table format
      if (targets.length === 0) {
        this.log('No notification targets configured.');
        return;
      }

      this.log('Name\t\tType\tConfiguration');
      this.log('─'.repeat(60));

      for (const target of targets) {
        let config = '';
        if (target.config.type === 'bash') {
          config = `script: ${target.config.script}`;
        } else if (target.config.type === 'telegram') {
          config = `bot: ${target.config.botToken}, chat: ${target.config.chatId}`;
        } else if (target.config.type === 'email') {
          config = `to: ${target.config.to}`;
        }
        this.log(`${target.name}\t\t${target.type}\t${config}`);
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
