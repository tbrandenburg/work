import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { Priority } from '../../types/work-item.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Set extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID to update', required: true }),
  };

  static override description = 'Update properties of a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 --priority high',
    '<%= config.bin %> <%= command.id %> TASK-001 --assignee john.doe',
    '<%= config.bin %> <%= command.id %> TASK-001 --title "Updated task title"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    context: Flags.string({
      char: 'c',
      description: 'context to use',
    }),
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
    labels: Flags.string({
      description: 'update work item labels (comma-separated)',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Set);

    try {
      const engine = new WorkEngine();

      // Build update request from flags
      const updateRequest: {
        title?: string;
        description?: string;
        priority?: Priority;
        assignee?: string;
        labels?: string[];
      } = {};
      if (flags.title) updateRequest.title = flags.title;
      if (flags.description) updateRequest.description = flags.description;
      if (flags.priority) updateRequest.priority = flags.priority as Priority;
      if (flags.assignee) updateRequest.assignee = flags.assignee;
      if (flags.labels)
        updateRequest.labels = flags.labels.split(',').map(l => l.trim());

      if (Object.keys(updateRequest).length === 0) {
        this.error(
          'No properties specified to update. Use --title, --description, --priority, --assignee, or --labels'
        );
      }

      const workItem = await engine.updateWorkItem(args.id, updateRequest);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(workItem, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Updated work item ${workItem.id}`);
        this.log(`Title: ${workItem.title}`);
        this.log(`State: ${workItem.state}`);
        this.log(`Priority: ${workItem.priority}`);
        if (workItem.assignee) this.log(`Assignee: ${workItem.assignee}`);
        if (workItem.labels.length > 0)
          this.log(`Labels: ${workItem.labels.join(', ')}`);
      }
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
