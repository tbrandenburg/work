import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';

export default class Get extends Command {
  static override args = {
    id: Args.string({ 
      description: 'work item ID to retrieve',
      required: true,
    }),
  };

  static override description = 'Get details of a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001',
    '<%= config.bin %> <%= command.id %> BUG-042 --format json',
  ];

  static override flags = {
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    const engine = new WorkEngine();
    
    try {
      const workItem = await engine.getWorkItem(args.id);

      if (flags.format === 'json') {
        this.log(JSON.stringify(workItem, null, 2));
        return;
      }

      // Table format
      this.log(`ID:          ${workItem.id}`);
      this.log(`Kind:        ${workItem.kind}`);
      this.log(`Title:       ${workItem.title}`);
      this.log(`State:       ${workItem.state}`);
      this.log(`Priority:    ${workItem.priority}`);
      this.log(`Assignee:    ${workItem.assignee || 'Unassigned'}`);
      this.log(`Labels:      ${workItem.labels.join(', ') || 'None'}`);
      this.log(`Created:     ${workItem.createdAt}`);
      this.log(`Updated:     ${workItem.updatedAt}`);
      if (workItem.closedAt) {
        this.log(`Closed:      ${workItem.closedAt}`);
      }
      if (workItem.description) {
        this.log(`\nDescription:\n${workItem.description}`);
      }
    } catch (error) {
      this.error(`Failed to get work item: ${(error as Error).message}`);
    }
  }
}
