import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Delete extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID to delete', required: true }),
  };

  static override description = 'Delete a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001',
    '<%= config.bin %> <%= command.id %> BUG-042',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Delete);

    try {
      const engine = new WorkEngine();

      await engine.deleteWorkItem(args.id);
      
      const result = {
        message: `Deleted work item ${args.id}`,
        workItemId: args.id
      };
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(result, 'json', { timestamp: new Date().toISOString() }));
      } else {
        this.log(`Deleted work item ${args.id}`);
      }
    } catch (error) {
      this.handleError(`Failed to delete work item: ${(error as Error).message}`);
    }
  }
}
