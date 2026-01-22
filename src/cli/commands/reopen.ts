import { Args } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Reopen extends BaseCommand {
  static override args = {
    id: Args.string({ 
      description: 'work item ID to reopen',
      required: true,
    }),
  };

  static override description = 'Reopen a closed work item (change state to active)';

  static override examples = [
    '<%= config.bin %> <%= command.id %> TASK-001',
    '<%= config.bin %> <%= command.id %> BUG-042',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Reopen);

    const engine = new WorkEngine();
    
    try {
      const workItem = await engine.changeState(args.id, 'active');
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(workItem, 'json', { 
          timestamp: new Date().toISOString(),
          reopened: true 
        }));
      } else {
        this.log(`Reopened ${workItem.kind} ${workItem.id}: ${workItem.title}`);
      }
    } catch (error) {
      this.error(`Failed to reopen work item: ${(error as Error).message}`);
    }
  }
}
