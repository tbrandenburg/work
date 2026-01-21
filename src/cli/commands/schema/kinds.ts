import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class SchemaKinds extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to list kinds (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'List available work item kinds';

  static override examples = [
    '<%= config.bin %> schema <%= command.id %>',
    '<%= config.bin %> schema <%= command.id %> my-project',
    '<%= config.bin %> schema <%= command.id %> --format json',
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
    const { args, flags } = await this.parse(SchemaKinds);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const kinds = await engine.getKinds();

      if (flags.format === 'json') {
        this.log(JSON.stringify(kinds, null, 2));
        return;
      }

      // Table format
      this.log(`Available Work Item Kinds (${kinds.length}):`);
      this.log('─'.repeat(40));
      kinds.forEach(kind => this.log(`  • ${kind}`));
    } catch (error) {
      this.error(`Failed to get kinds: ${(error as Error).message}`);
    }
  }
}
