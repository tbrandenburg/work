import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Get extends BaseCommand {
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    const engine = new WorkEngine();
    
    try {
      const workItem = await engine.getWorkItem(args.id);

      if (flags.format === 'json') {
        this.log(formatOutput(workItem, flags.format, { timestamp: new Date().toISOString() }));
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
      this.handleError(`Failed to get work item: ${(error as Error).message}`);
    }
  }
}
