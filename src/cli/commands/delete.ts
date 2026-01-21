import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';

export default class Delete extends Command {
  static override args = {
    id: Args.string({ description: 'work item ID to delete', required: true }),
  };

  static override description = 'Delete a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001',
    '<%= config.bin %> <%= command.id %> BUG-042',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(Delete);

    try {
      const engine = new WorkEngine();

      await engine.deleteWorkItem(args.id);
      
      this.log(`Deleted work item ${args.id}`);
    } catch (error) {
      this.error(`Failed to delete work item: ${(error as Error).message}`);
    }
  }
}
