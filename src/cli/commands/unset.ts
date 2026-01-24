import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Unset extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID', required: true }),
    field: Args.string({
      description: 'field to clear',
      required: true,
      options: ['assignee', 'description'],
    }),
  };

  static override description = 'Clear optional fields from a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 assignee',
    '<%= config.bin %> <%= command.id %> TASK-001 description',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Unset);

    try {
      const engine = new WorkEngine();

      // Build update request to clear the field
      const updateRequest: {
        assignee?: string | undefined;
        description?: string | undefined;
      } = {};

      if (args.field === 'assignee') {
        updateRequest.assignee = undefined;
      } else if (args.field === 'description') {
        updateRequest.description = undefined;
      }

      const workItem = await engine.updateWorkItem(args.id, updateRequest);

      const result = {
        message: `Cleared ${args.field} from ${workItem.kind} ${workItem.id}: ${workItem.title}`,
        workItem: workItem,
        clearedField: args.field,
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', { timestamp: new Date().toISOString() })
        );
      } else {
        this.log(
          `Cleared ${args.field} from ${workItem.kind} ${workItem.id}: ${workItem.title}`
        );
      }
    } catch (error) {
      this.handleError(`Failed to unset field: ${(error as Error).message}`);
    }
  }
}
