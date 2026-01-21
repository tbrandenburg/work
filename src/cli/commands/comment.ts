import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';

export default class Comment extends Command {
  static override args = {
    id: Args.string({ description: 'work item ID', required: true }),
    text: Args.string({ description: 'comment text', required: true }),
  };

  static override description = 'Add a comment to a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 "This is a comment"',
    '<%= config.bin %> <%= command.id %> BUG-042 "Fixed in latest build"',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(Comment);

    try {
      const engine = new WorkEngine();

      // For MVP, this is a placeholder implementation
      engine.addComment(args.id, args.text);
      
      this.log(`Comment operation not yet implemented`);
      this.log(`Would add comment to ${args.id}: "${args.text}"`);
    } catch (error) {
      this.error(`Failed to add comment: ${(error as Error).message}`);
    }
  }
}
