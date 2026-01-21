import { Args, Command, Flags } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';

export default class AuthStatus extends Command {
  static override args = {
    context: Args.string({ 
      description: 'context name to check status (defaults to active context)',
      required: false,
    }),
  };

  static override description = 'Show authentication status';

  static override examples = [
    '<%= config.bin %> auth <%= command.id %>',
    '<%= config.bin %> auth <%= command.id %> my-project',
    '<%= config.bin %> auth <%= command.id %> --format json',
  ];

  static override flags = {
    format: Flags.string({
      char: 'f',
      description: 'output format',
      options: ['table', 'json'],
      default: 'table',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthStatus);

    const engine = new WorkEngine();
    
    try {
      if (args.context) {
        engine.setActiveContext(args.context);
      }

      const authStatus = await engine.getAuthStatus();

      if (flags.format === 'json') {
        this.log(JSON.stringify(authStatus, null, 2));
        return;
      }

      // Table format
      this.log(`Authentication Status`);
      this.log('─'.repeat(40));
      this.log(`State:  ${authStatus.state}`);
      this.log(`User:   ${authStatus.user || 'N/A'}`);
      if (authStatus.expiresAt) {
        this.log(`Expires: ${authStatus.expiresAt.toISOString()}`);
      }
    } catch (error) {
      this.error(`Failed to get auth status: ${(error as Error).message}`);
    }
  }
}
