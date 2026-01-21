import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class AuthLogout extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to logout from (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Logout from the backend';

  static override examples = [
    '<%= config.bin %> auth <%= command.id %>',
    '<%= config.bin %> auth <%= command.id %> my-project',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(AuthLogout);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      await engine.logout();
      
      this.log(`✅ Logout successful`);
    } catch (error) {
      this.error(`Failed to logout: ${(error as Error).message}`);
    }
  }
}
