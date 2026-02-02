import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class NotifySend extends BaseCommand {
  static override description =
    'Send work item notifications to configured targets';

  static override examples = [
    '<%= config.bin %> notify <%= command.id %> "This is a multi-line\nstatus update" to alerts',
    '<%= config.bin %> notify <%= command.id %> TASK-001 to alerts',
    '<%= config.bin %> notify <%= command.id %> where state=new to alerts',
    '<%= config.bin %> notify <%= command.id %> where priority=high to team-notifications',
    '<%= config.bin %> notify <%= command.id %> where assignee=human-alice to human-alerts',
  ];

  static override strict = false;

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { argv } = await this.parse(NotifySend);

    // Parse arguments from argv
    const args = argv as string[];

    if (args.length < 3) {
      this.error(
        'Invalid syntax. Use: work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
      );
    }

    let message: string | null = null;
    let query: string | null = null;
    let target: string;

    // Support three syntaxes:
    // 1. Message: work notify send "message content" to alerts
    //    args = ['message content', 'to', 'alerts']
    // 2. Shorthand: work notify send TASK-001 to alerts
    //    args = ['TASK-001', 'to', 'alerts']
    // 3. Full: work notify send where id=TASK-001 to alerts
    //    args = ['where', 'id=TASK-001', 'to', 'alerts']
    if (args[0] === 'where') {
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
        'Invalid syntax. Use: work notify send "message" to <target> OR work notify send TASK-001 to <target> OR work notify send where <query> to <target>'
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
        // Execute query to get work items
        const workItems = await engine.listWorkItems(query!);

        // Send notification
        const result = await engine.sendNotification(workItems, target);

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
