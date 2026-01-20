import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class ContextSet extends Command {
  static override args = {
    name: Args.string({ 
      description: 'context name to activate',
      required: true,
    }),
  };

  static override description = 'Set the active context';

  static override examples = [
    '<%= config.bin %> context <%= command.id %> local',
    '<%= config.bin %> context <%= command.id %> project1',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(ContextSet);

    const engine = new WorkEngine();
    
    try {
      engine.setActiveContext(args.name);
      this.log(`Activated context '${args.name}'`);
    } catch (error) {
      this.error(`Failed to set context: ${(error as Error).message}`);
    }
  }
}
