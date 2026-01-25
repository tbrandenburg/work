import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class SchemaRelations extends BaseCommand {
  static override args = {
    context: Args.string({
      description:
        'context name to list relations (defaults to active context)',
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(SchemaRelations);

    const engine = new WorkEngine();

    try {
      if (args.context) {
        await engine.setActiveContext(args.context);
      }

      const relationTypes = await engine.getRelationTypes();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(relationTypes, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
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
      this.handleError(
        `Failed to get relation types: ${(error as Error).message}`
      );
    }
  }
}
