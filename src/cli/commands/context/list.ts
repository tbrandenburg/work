import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class ContextList extends BaseCommand {
  static override description = 'List all contexts';

  static override examples = [
    '<%= config.bin %> context <%= command.id %>',
    '<%= config.bin %> context <%= command.id %> --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(ContextList);

    const engine = new WorkEngine();
    
    try {
      const contexts = engine.getContexts();

      if (flags.format === 'json') {
        this.log(formatOutput(contexts, flags.format, { 
          total: contexts.length,
          timestamp: new Date().toISOString() 
        }));
        return;
      }

      // Table format
      if (contexts.length === 0) {
        this.log('No contexts found.');
        return;
      }

      this.log('Name\t\tTool\t\tPath/URL\t\tActive');
      this.log('─'.repeat(60));
      
      for (const context of contexts) {
        const name = context.name.padEnd(12);
        const tool = context.tool.padEnd(12);
        const location = (context.path || context.url || '').padEnd(20);
        const active = context.isActive ? '✓' : '';
        
        this.log(`${name}\t${tool}\t${location}\t${active}`);
      }
      
      this.log(`\nTotal: ${contexts.length} contexts`);
    } catch (error) {
      this.error(`Failed to list contexts: ${(error as Error).message}`);
    }
  }
}
