import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { Context } from '../../../types/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class ContextAdd extends BaseCommand {
  static override args = {
    name: Args.string({ 
      description: 'context name',
      required: true,
    }),
  };

  static override description = 'Add a new context';

  static override examples = [
    '<%= config.bin %> context <%= command.id %> local --tool local-fs --path ./tasks',
    '<%= config.bin %> context <%= command.id %> project1 --tool local-fs --path /home/user/project1',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    tool: Flags.string({
      char: 't',
      description: 'backend tool',
      options: ['local-fs'],
      required: true,
    }),
    path: Flags.string({
      char: 'p',
      description: 'path for local-fs tool',
    }),
    url: Flags.string({
      char: 'u',
      description: 'URL for remote tools',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ContextAdd);

    const engine = new WorkEngine();
    
    try {
      if (flags.tool === 'local-fs' && !flags.path) {
        this.error('--path is required for local-fs tool');
      }

      const context: Context = {
        name: args.name,
        tool: flags.tool,
        path: flags.path,
        url: flags.url,
        authState: 'authenticated', // local-fs doesn't need auth
        isActive: false,
      };

      await engine.addContext(context);
      
      const result = {
        message: `Added context '${args.name}' using ${flags.tool}`,
        context: context
      };
      
      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(formatOutput(result, 'json', { timestamp: new Date().toISOString() }));
      } else {
        this.log(`Added context '${args.name}' using ${flags.tool}`);
      }
    } catch (error) {
      this.handleError(`Failed to add context: ${(error as Error).message}`);
    }
  }
}
