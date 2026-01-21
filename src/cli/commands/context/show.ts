import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class ContextShow extends Command {
  static override args = {
    name: Args.string({ 
      description: 'context name to show (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Show detailed information about a context';

  static override examples = [
    '<%= config.bin %> context <%= command.id %>',
    '<%= config.bin %> context <%= command.id %> my-project',
    '<%= config.bin %> context <%= command.id %> --format json',
  ];

  static override flags = {
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ContextShow);

    const engine = new WorkEngine();
    
    try {
      let context;
      
      if (args.name) {
        // Find context by name
        const contexts = engine.getContexts();
        context = contexts.find(c => c.name === args.name);
        if (!context) {
          this.error(`Context '${args.name}' not found`);
        }
      } else {
        // Get active context
        context = engine.getActiveContext();
        if (!context) {
          this.error('No active context found. Use "work context set <name>" to set one.');
        }
      }

      if (flags.format === 'json') {
        this.log(JSON.stringify(context, null, 2));
        return;
      }

      // Table format
      this.log(`Context: ${context.name}`);
      this.log('─'.repeat(40));
      this.log(`Tool:       ${context.tool}`);
      this.log(`Path:       ${context.path || context.url || 'N/A'}`);
      this.log(`Active:     ${context.isActive ? 'Yes' : 'No'}`);
      this.log(`Auth State: ${context.authState}`);
    } catch (error) {
      this.error(`Failed to show context: ${(error as Error).message}`);
    }
  }
}
