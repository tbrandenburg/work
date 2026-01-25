import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class SchemaAttrs extends BaseCommand {
  static override args = {
    context: Args.string({
      description:
        'context name to list attributes (defaults to active context)',
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(SchemaAttrs);

    const engine = new WorkEngine();

    try {
      if (args.context) {
        await engine.setActiveContext(args.context);
      }

      const attributes = await engine.getAttributes();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(attributes, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
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
      this.handleError(`Failed to get attributes: ${(error as Error).message}`);
    }
  }
}
