import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Comment extends BaseCommand {
  static override args = {
    id: Args.string({ description: 'work item ID', required: true }),
    text: Args.string({ description: 'comment text', required: true }),
  };

  static override description = 'Add a comment to a work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001 "This is a comment"',
    '<%= config.bin %> <%= command.id %> BUG-042 "Fixed in latest build"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Comment);

    try {
      const engine = new WorkEngine();

      // For MVP, this is a placeholder implementation
      engine.addComment(args.id, args.text);

      const result = {
        message: `Comment added to ${args.id}`,
        comment: args.text,
        workItemId: args.id,
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', { timestamp: new Date().toISOString() })
        );
      } else {
        this.log(`Comment added to ${args.id}: "${args.text}"`);
      }
    } catch (error) {
      this.handleError(`Failed to add comment: ${(error as Error).message}`);
    }
  }
}
