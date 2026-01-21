import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { RelationType } from '../../types/work-item.js';

export default class Unlink extends Command {
  static override args = {
    from: Args.string({ description: 'source work item ID', required: true }),
    to: Args.string({ description: 'target work item ID', required: true }),
  };

  static override description = 'Remove a relation between work items';

  static override examples = [
    '<%= config.bin %> <%= command.id %> EPIC-001 TASK-001 --type parent_of',
    '<%= config.bin %> <%= command.id %> TASK-001 TASK-002 --type blocks',
    '<%= config.bin %> <%= command.id %> BUG-001 BUG-002 --type duplicates',
  ];

  static override flags = {
    type: Flags.string({
      char: 't',
      description: 'relation type',
      required: true,
      options: ['parent_of', 'child_of', 'blocks', 'blocked_by', 'duplicates', 'duplicate_of', 'relates_to'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Unlink);

    try {
      const engine = new WorkEngine();

      await engine.deleteRelation(args.from, args.to, flags.type as RelationType);
      
      this.log(`Removed relation: ${args.from} ${flags.type} ${args.to}`);
    } catch (error) {
      this.error(`Failed to unlink work items: ${(error as Error).message}`);
    }
  }
}
