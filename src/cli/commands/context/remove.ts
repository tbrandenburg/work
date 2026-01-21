import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class ContextRemove extends Command {
  static override args = {
    name: Args.string({ 
      description: 'context name to remove',
      required: true,
    }),
  };

  static override description = 'Remove a context';

  static override examples = [
    '<%= config.bin %> context <%= command.id %> local',
    '<%= config.bin %> context <%= command.id %> project1',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(ContextRemove);

    const engine = new WorkEngine();
    
    try {
      engine.removeContext(args.name);
      this.log(`Removed context '${args.name}'`);
    } catch (error) {
      this.error(`Failed to remove context: ${(error as Error).message}`);
    }
  }
}
