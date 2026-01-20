import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/engine.js';
import { RelationType } from '../../types/work-item.js';

export default class Link extends Command {
  static override args = {
    from: Args.string({ description: 'source work item ID', required: true }),
    to: Args.string({ description: 'target work item ID', required: true }),
  };

  static override description = 'Create a relation between work items';

  static override examples = [
    '<%= config.bin %> <%= command.id %> EPIC-001 TASK-001 --type parent_of',
    '<%= config.bin %> <%= command.id %> TASK-001 TASK-002 --type blocks',
    '<%= config.bin %> <%= command.id %> BUG-001 BUG-002 --type duplicates',
  ];

  static override flags = {
    context: Flags.string({
      char: 'c',
      description: 'context to use',
    }),
    type: Flags.string({
      char: 't',
      description: 'relation type',
      required: true,
      options: ['parent_of', 'child_of', 'blocks', 'blocked_by', 'duplicates', 'duplicate_of', 'relates_to'],
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Link);

    try {
      const engine = new WorkEngine();

      const relation = {
        from: args.from,
        to: args.to,
        type: flags.type as RelationType,
      };

      await engine.createRelation(relation);
      
      this.log(`Created relation: ${args.from} ${flags.type} ${args.to}`);
    } catch (error) {
      this.error(error instanceof Error ? error.message : String(error));
    }
  }
}
