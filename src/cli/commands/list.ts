import { Flags, Args } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class List extends BaseCommand {
  static override description = 'List work items';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> where state=new',
    '<%= config.bin %> <%= command.id %> where priority=high AND state=active',
  ];

  static override args = {
    subcommand: Args.string({
      description: 'subcommand (where)',
      required: false,
    }),
    query: Args.string({
      description: 'query expression for where clause',
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    where: Flags.string({
      char: 'w',
      description:
        'filter work items (e.g., state=new, kind=task) - deprecated, use positional args',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(List);

    const engine = new WorkEngine();

    try {
      let whereClause: string | undefined;

      // Handle new positional syntax: work list where "query"
      if (args.subcommand === 'where') {
        if (!args.query) {
          this.error('Query expression required after "where"');
        }
        whereClause = args.query;
      } else if (args.subcommand && !args.query) {
        // Handle case where query is provided as first arg without "where"
        whereClause = args.subcommand;
      } else if (flags.where) {
        // Backward compatibility with --where flag
        whereClause = flags.where;
      }

      const workItems = await engine.listWorkItems(whereClause);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(workItems, 'json', {
            total: workItems.length,
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Table format
      if (workItems.length === 0) {
        this.log('No work items found.');
        return;
      }

      // Simple table output
      this.log('ID\t\tKind\tState\tPriority\tTitle');
      this.log('─'.repeat(80));

      for (const item of workItems) {
        const id = item.id.padEnd(12);
        const kind = item.kind.padEnd(8);
        const state = item.state.padEnd(8);
        const priority = item.priority.padEnd(8);
        const title =
          item.title.length > 40 ? item.title.slice(0, 37) + '...' : item.title;

        this.log(`${id}\t${kind}\t${state}\t${priority}\t${title}`);
      }

      this.log(`\nTotal: ${workItems.length} work items`);
    } catch (error) {
      this.error(`Failed to list work items: ${(error as Error).message}`);
    }
  }
}
