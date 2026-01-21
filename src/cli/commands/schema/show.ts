import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class SchemaShow extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to show schema (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Show complete schema information';

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
    const { args, flags } = await this.parse(SchemaShow);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const schema = await engine.getSchema();

      if (flags.format === 'json') {
        this.log(JSON.stringify(schema, null, 2));
        return;
      }

      // Table format
      this.log(`Schema Information`);
      this.log('─'.repeat(40));
      
      this.log(`\nWork Item Kinds (${schema.kinds.length}):`);
      schema.kinds.forEach(kind => this.log(`  • ${kind}`));
      
      this.log(`\nAttributes (${schema.attributes.length}):`);
      schema.attributes.forEach(attr => {
        const required = attr.required ? ' (required)' : '';
        const desc = attr.description ? ` - ${attr.description}` : '';
        this.log(`  • ${attr.name}: ${attr.type}${required}${desc}`);
      });
      
      this.log(`\nRelation Types (${schema.relationTypes.length}):`);
      schema.relationTypes.forEach(rel => {
        const desc = rel.description ? ` - ${rel.description}` : '';
        this.log(`  • ${rel.name}${desc}`);
        this.log(`    From: ${rel.allowedFromKinds.join(', ')}`);
        this.log(`    To: ${rel.allowedToKinds.join(', ')}`);
      });
    } catch (error) {
      this.error(`Failed to get schema: ${(error as Error).message}`);
    }
  }
}
