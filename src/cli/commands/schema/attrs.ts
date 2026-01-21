import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class SchemaAttrs extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to list attributes (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'List available attributes';

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
    const { args, flags } = await this.parse(SchemaAttrs);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const attributes = await engine.getAttributes();

      if (flags.format === 'json') {
        this.log(JSON.stringify(attributes, null, 2));
        return;
      }

      // Table format
      this.log(`Available Attributes (${attributes.length}):`);
      this.log('─'.repeat(40));
      attributes.forEach(attr => {
        const required = attr.required ? ' (required)' : '';
        const desc = attr.description ? ` - ${attr.description}` : '';
        this.log(`  • ${attr.name}: ${attr.type}${required}${desc}`);
      });
    } catch (error) {
      this.error(`Failed to get attributes: ${(error as Error).message}`);
    }
  }
}
