import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class ContextShow extends BaseCommand {
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ContextShow);

    const engine = new WorkEngine();

    let context;

    if (args.name) {
      // Find context by name
      const contexts = engine.getContexts();
      context = contexts.find(c => c.name === args.name);
      if (!context) {
        this.handleError(`Context '${args.name}' not found`);
      }
    } else {
      // Get active context
      context = engine.getActiveContext();
      if (!context) {
        this.handleError(
          'No active context found. Use "work context set <name>" to set one.'
        );
      }
    }

    const isJsonMode = await this.getJsonMode();
    if (isJsonMode) {
      this.log(
        formatOutput(context, 'json', { timestamp: new Date().toISOString() })
      );
    } else {
      // Table format
      this.log(`Context: ${context.name}`);
      this.log('─'.repeat(40));
      this.log(`Tool:       ${context.tool}`);
      this.log(`Path:       ${context.path || context.url || 'N/A'}`);
      this.log(`Active:     ${context.isActive ? 'Yes' : 'No'}`);
      this.log(`Auth State: ${context.authState}`);
    }
  }
}
