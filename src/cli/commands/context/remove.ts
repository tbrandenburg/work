import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class ContextRemove extends BaseCommand {
  static override args = {
    name: Args.string({
      description: 'context name to remove',
      required: true,
    }),
  };

  static override description = 'Remove a context';

  static override examples = [
    '<%= config.bin %> context <%= command.id %> local',
    '<%= config.bin %> context <%= command.id %> project1',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ContextRemove);

    const engine = new WorkEngine();

    try {
      engine.removeContext(args.name);

      const result = {
        message: `Removed context '${args.name}'`,
        contextName: args.name,
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', { timestamp: new Date().toISOString() })
        );
      } else {
        this.log(`Removed context '${args.name}'`);
      }
    } catch (error) {
      this.handleError(`Failed to remove context: ${(error as Error).message}`);
    }
  }
}
