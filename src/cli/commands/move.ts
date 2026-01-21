import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';

export default class Move extends Command {
  static override args = {
    id: Args.string({ description: 'work item ID to move', required: true }),
    context: Args.string({ description: 'target context (with @context syntax)', required: true }),
  };

  static override description = 'Move a work item to another context';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 @other-project',
    '<%= config.bin %> <%= command.id %> BUG-042 @production',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(Move);

    try {
      const engine = new WorkEngine();

      // For MVP, this is a placeholder implementation
      engine.moveWorkItem(args.id, args.context);
      
      this.log(`Move operation not yet implemented`);
      this.log(`Would move ${args.id} to context ${args.context}`);
    } catch (error) {
      this.error(`Failed to move work item: ${(error as Error).message}`);
    }
  }
}
