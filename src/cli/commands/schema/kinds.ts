import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class SchemaKinds extends BaseCommand {
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(SchemaKinds);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const kinds = await engine.getKinds();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(kinds, 'json', { timestamp: new Date().toISOString() }));
        return;
      }

      // Table format
      this.log(`Available Work Item Kinds (${kinds.length}):`);
      this.log('─'.repeat(40));
      kinds.forEach(kind => this.log(`  • ${kind}`));
    } catch (error) {
      this.handleError(`Failed to get kinds: ${(error as Error).message}`);
    }
  }
}
