import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Close extends BaseCommand {
  static override args = {
    id: Args.string({
      description: 'work item ID to close',
      required: true,
    }),
  };

  static override description = 'Close a work item (change state to closed)';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001',
    '<%= config.bin %> <%= command.id %> BUG-042',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Close);

    const engine = new WorkEngine();

    try {
      const workItem = await engine.changeState(args.id, 'closed');

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(workItem, 'json', {
            timestamp: new Date().toISOString(),
            closedAt: workItem.closedAt,
          })
        );
      } else {
        this.log(`Closed ${workItem.kind} ${workItem.id}: ${workItem.title}`);
      }
    } catch (error) {
      this.error(`Failed to close work item: ${(error as Error).message}`);
    }
  }
}
