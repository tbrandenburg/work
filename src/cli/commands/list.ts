import { Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';

export default class List extends Command {
  static override description = 'List work items';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --where state=new',
    '<%= config.bin %> <%= command.id %> --where kind=task,priority=high',
  ];

  static override flags = {
    where: Flags.string({
      char: 'w',
      description: 'filter work items (e.g., state=new, kind=task)',
    }),
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(List);

    const engine = new WorkEngine();
    
    try {
      const workItems = await engine.listWorkItems(flags.where);

      if (flags.format === 'json') {
        this.log(JSON.stringify(workItems, null, 2));
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
        const title = item.title.length > 40 ? item.title.slice(0, 37) + '...' : item.title;
        
        this.log(`${id}\t${kind}\t${state}\t${priority}\t${title}`);
      }
      
      this.log(`\nTotal: ${workItems.length} work items`);
    } catch (error) {
      this.error(`Failed to list work items: ${(error as Error).message}`);
    }
  }
}
