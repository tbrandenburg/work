import { Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class NotifySend extends BaseCommand {
  static override description =
    'Send work item notifications to configured targets';

  static override examples = [
    '<%= config.bin %> notify <%= command.id %> to alerts',
    '<%= config.bin %> notify <%= command.id %> "This is a multi-line\nstatus update" to alerts',
    '<%= config.bin %> notify <%= command.id %> TASK-001 to alerts',
    '<%= config.bin %> notify <%= command.id %> where state=new to alerts',
    '<%= config.bin %> notify <%= command.id %> where priority=high to team-notifications',
    '<%= config.bin %> notify <%= command.id %> where assignee=human-alice to human-alerts',
  ];

  static override strict = false;

  static override flags = {
    ...BaseCommand.baseFlags,
    async: Flags.boolean({
      description: 'Send notification asynchronously (fire-and-forget, agent works independently)',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(NotifySend);

    // Parse arguments from argv
    const args = argv as string[];

    if (args.length < 2) {
      this.error(
        'Invalid syntax. Use: work notify send to <target> OR work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
      );
    }

    let message: string | null = null;
    let query: string | null = null;
    let target: string;

    // Support four syntaxes:
    // 1. All items: work notify send to alerts
    //    args = ['to', 'alerts']
    // 2. Message: work notify send "message content" to alerts
    //    args = ['message content', 'to', 'alerts']
    // 3. Shorthand: work notify send TASK-001 to alerts
    //    args = ['TASK-001', 'to', 'alerts']
    // 4. Full: work notify send where id=TASK-001 to alerts
    //    args = ['where', 'id=TASK-001', 'to', 'alerts']
    if (args[0] === 'to') {
      // All items syntax: work notify send to <target>
      target = args.slice(1).join(' ');
      
      if (!target) {
        this.error('Expected target name after "to"');
      }
      
      // query remains null - will send all items
    } else if (args[0] === 'where') {
      // Full syntax: where <query> to <target>
      if (args.length < 4) {
        this.error('Expected: work notify send where <query> to <target>');
      }

      const toIndex = args.indexOf('to');
      if (toIndex === -1) {
        this.error('Expected "to" keyword before target name');
      }

      // Query is everything between 'where' and 'to'
      query = args.slice(1, toIndex).join(' ');
      // Target is everything after 'to'
      target = args.slice(toIndex + 1).join(' ');

      if (!query || !target) {
        this.error('Expected: work notify send where <query> to <target>');
      }
    } else if (args[1] === 'to') {
      // Could be message syntax or shorthand syntax
      // Message syntax: "message content" to <target> (args[0] has spaces/newlines)
      // Shorthand: TASK-001 to <target> (args[0] is single word)
      
      if (args[0]?.includes(' ') || args[0]?.includes('\n')) {
        // Message syntax
        message = args[0] || '';
        target = args.slice(2).join(' ');
        
        if (!target) {
          this.error('Expected target name after "to"');
        }
        
        if (!message || !message.trim()) {
          this.error('Message cannot be empty');
        }
      } else {
        // Shorthand syntax: <id> to <target>
        if (!args[0]) {
          this.error('Task ID cannot be empty');
        }
        
        // Convert shorthand to query format
        query = `id=${args[0]}`;
        target = args.slice(2).join(' ');

        if (!target) {
          this.error('Expected target name after "to"');
        }
      }
    } else {
      this.error(
        'Invalid syntax. Use: work notify send to <target> OR work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
      );
    }

    const engine = new WorkEngine();

    try {
      if (message) {
        // Send plain message
        const result = await engine.sendPlainNotification(message, target);
        
        if (!result.success) {
          this.error(result.error || 'Notification failed');
        }
        
        const output = formatOutput(
          `Message sent successfully to ${target}`,
          (await this.getJsonMode()) ? 'json' : 'table'
        );
        
        this.log(output);
      } else {
        // Execute query to get work items (undefined = all items)
        const workItems = await engine.listWorkItems(query || undefined);

        // Send notification
        const result = await engine.sendNotification(workItems, target, {
          async: flags.async || false,
        });

        if (!result.success) {
          this.error(result.error || 'Notification failed');
        }

        const output = formatOutput(
          `Notification sent successfully to ${target} (${workItems.length} items)`,
          (await this.getJsonMode()) ? 'json' : 'table'
        );

        this.log(output);
      }
    } catch (error) {
      this.handleError(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
