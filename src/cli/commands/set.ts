import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';

export default class Set extends Command {
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
      const updateRequest: any = {};
      if (flags.title) updateRequest.title = flags.title;
      if (flags.description) updateRequest.description = flags.description;
      if (flags.priority) updateRequest.priority = flags.priority;
      if (flags.assignee) updateRequest.assignee = flags.assignee;
      if (flags.labels) updateRequest.labels = flags.labels.split(',').map(l => l.trim());

      if (Object.keys(updateRequest).length === 0) {
        this.error('No properties specified to update. Use --title, --description, --priority, --assignee, or --labels');
      }

      const workItem = await engine.updateWorkItem(args.id, updateRequest);
      
      this.log(`Updated work item ${workItem.id}`);
      this.log(`Title: ${workItem.title}`);
      this.log(`State: ${workItem.state}`);
      this.log(`Priority: ${workItem.priority}`);
      if (workItem.assignee) this.log(`Assignee: ${workItem.assignee}`);
      if (workItem.labels.length > 0) this.log(`Labels: ${workItem.labels.join(', ')}`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
