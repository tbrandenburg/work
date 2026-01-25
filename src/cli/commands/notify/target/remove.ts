import { Args } from '@oclif/core';
import { WorkEngine } from '../../../../core/index.js';
import { BaseCommand } from '../../../base-command.js';
import { formatOutput } from '../../../formatter.js';

export default class NotifyTargetRemove extends BaseCommand {
  static override args = {
    name: Args.string({
      description: 'target name to remove',
      required: true,
    }),
  };

  static override description = 'Remove a notification target';

  static override examples = [
    '<%= config.bin %> notify target <%= command.id %> alerts',
    '<%= config.bin %> notify target <%= command.id %> team-notifications',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(NotifyTargetRemove);

    const engine = new WorkEngine();

    try {
      await engine.removeNotificationTarget(args.name);

      const output = formatOutput(
        `Target '${args.name}' removed successfully`,
        (await this.getJsonMode()) ? 'json' : 'table'
      );

      this.log(output);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
