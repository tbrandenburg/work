import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Move extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID to move', required: true }),
    context: Args.string({ description: 'target context (with @context syntax)', required: true }),
  };

  static override description = 'Move a work item to another context';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 @other-project',
    '<%= config.bin %> <%= command.id %> BUG-042 @production',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Move);

    try {
      const engine = new WorkEngine();

      // For MVP, this is a placeholder implementation
      engine.moveWorkItem(args.id, args.context);
      
      const result = {
        message: `Moved ${args.id} to context ${args.context}`,
        workItemId: args.id,
        targetContext: args.context
      };
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(result, 'json', { timestamp: new Date().toISOString() }));
      } else {
        this.log(`Moved ${args.id} to context ${args.context}`);
      }
    } catch (error) {
      this.handleError(`Failed to move work item: ${(error as Error).message}`);
    }
  }
}
