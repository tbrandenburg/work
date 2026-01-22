import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { Priority } from '../../types/work-item.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Edit extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID to edit', required: true }),
  };

  static override description = 'Edit properties of a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 --title "Updated title" --priority high',
    '<%= config.bin %> <%= command.id %> TASK-001 --assignee john.doe',
    '<%= config.bin %> <%= command.id %> TASK-001 --description "New description"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({
      description: 'update work item title',
    }),
    description: Flags.string({
      description: 'update work item description',
    }),
    priority: Flags.string({
      description: 'update work item priority',
      options: ['low', 'medium', 'high', 'critical'],
    }),
    assignee: Flags.string({
      description: 'update work item assignee',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Edit);

    try {
      const engine = new WorkEngine();

      // Build update request from flags
      const updateRequest: {
        title?: string;
        description?: string;
        priority?: Priority;
        assignee?: string;
      } = {};
      
      if (flags.title) updateRequest.title = flags.title;
      if (flags.description) updateRequest.description = flags.description;
      if (flags.priority) updateRequest.priority = flags.priority as Priority;
      if (flags.assignee) updateRequest.assignee = flags.assignee;

      if (Object.keys(updateRequest).length === 0) {
        this.error('No fields specified to edit. Use --title, --description, --priority, or --assignee');
      }

      const workItem = await engine.updateWorkItem(args.id, updateRequest);
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(workItem, 'json', { timestamp: new Date().toISOString() }));
      } else {
        this.log(`Edited ${workItem.kind} ${workItem.id}: ${workItem.title}`);
        this.log(`State: ${workItem.state}`);
        this.log(`Priority: ${workItem.priority}`);
        if (workItem.assignee) this.log(`Assignee: ${workItem.assignee}`);
        if (workItem.description) this.log(`Description: ${workItem.description}`);
      }
    } catch (error) {
      this.error(`Failed to edit work item: ${(error as Error).message}`);
    }
  }
}
