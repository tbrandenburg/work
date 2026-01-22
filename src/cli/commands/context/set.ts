import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class ContextSet extends BaseCommand {
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

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(ContextSet);

    const engine = new WorkEngine();
    
    try {
      engine.setActiveContext(args.name);
      
      const result = {
        message: `Activated context '${args.name}'`,
        contextName: args.name
      };
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(result, 'json', { timestamp: new Date().toISOString() }));
      } else {
        this.log(`Activated context '${args.name}'`);
      }
    } catch (error) {
      this.handleError(`Failed to set context: ${(error as Error).message}`);
    }
  }
}
