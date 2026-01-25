import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class NotifySend extends BaseCommand {
  static override description =
    'Send work item notifications to configured targets';

  static override examples = [
    '<%= config.bin %> notify <%= command.id %> where state=new to alerts',
    '<%= config.bin %> notify <%= command.id %> where priority=high to team-notifications',
    '<%= config.bin %> notify <%= command.id %> where assignee=human-alice to human-alerts',
  ];

  static override args = {
    subcommand: Args.string({
      description: 'where',
      required: true,
    }),
    query: Args.string({
      description: 'query expression',
      required: true,
    }),
    to: Args.string({
      description: 'to',
      required: true,
    }),
    target: Args.string({
      description: 'target name',
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(NotifySend);

    // Validate command structure
    if (args.subcommand !== 'where') {
      this.error('Expected "where" keyword after notify send');
    }

    if (args.to !== 'to') {
      this.error('Expected "to" keyword before target name');
    }

    const engine = new WorkEngine();

    try {
      // Execute query to get work items
      const workItems = await engine.listWorkItems(args.query);

      // Send notification
      const result = await engine.sendNotification(workItems, args.target);

      if (!result.success) {
        this.error(result.error || 'Notification failed');
      }

      const output = formatOutput(
        `Notification sent successfully to ${args.target} (${workItems.length} items)`,
        (await this.getJsonMode()) ? 'json' : 'table'
      );

      this.log(output);
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
