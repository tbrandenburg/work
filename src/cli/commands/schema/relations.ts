import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class SchemaRelations extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to list relations (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'List available relation types';

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
    const { args, flags } = await this.parse(SchemaRelations);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const relationTypes = await engine.getRelationTypes();

      if (flags.format === 'json') {
        this.log(JSON.stringify(relationTypes, null, 2));
        return;
      }

      // Table format
      this.log(`Available Relation Types (${relationTypes.length}):`);
      this.log('─'.repeat(40));
      relationTypes.forEach(rel => {
        const desc = rel.description ? ` - ${rel.description}` : '';
        this.log(`  • ${rel.name}${desc}`);
        this.log(`    From: ${rel.allowedFromKinds.join(', ')}`);
        this.log(`    To: ${rel.allowedToKinds.join(', ')}`);
      });
    } catch (error) {
      this.error(`Failed to get relation types: ${(error as Error).message}`);
    }
  }
}
