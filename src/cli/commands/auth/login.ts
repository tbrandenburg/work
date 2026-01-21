import { Args, Command } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class AuthLogin extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to authenticate (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Authenticate with the backend';

  static override examples = [
    '<%= config.bin %> auth <%= command.id %>',
    '<%= config.bin %> auth <%= command.id %> my-project',
  ];

  public async run(): Promise<void> {
    const { args } = await this.parse(AuthLogin);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const authStatus = await engine.authenticate();
      
      this.log(`✅ Authentication successful`);
      this.log(`User: ${authStatus.user || 'N/A'}`);
      this.log(`State: ${authStatus.state}`);
      if (authStatus.expiresAt) {
        this.log(`Expires: ${authStatus.expiresAt.toISOString()}`);
      }
    } catch (error) {
      this.error(`Failed to authenticate: ${(error as Error).message}`);
    }
  }
}
