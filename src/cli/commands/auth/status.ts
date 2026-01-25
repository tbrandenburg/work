import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class AuthStatus extends BaseCommand {
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
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(AuthStatus);

    const engine = new WorkEngine();

    try {
      await engine.ensureDefaultContext();
      
      if (args.context) {
        await engine.setActiveContext(args.context);
      }

      const authStatus = await engine.getAuthStatus();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(authStatus, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
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
      this.handleError(
        `Failed to get auth status: ${(error as Error).message}`
      );
    }
  }
}
