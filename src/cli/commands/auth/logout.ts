import { Args } from '@oclif/core';
import { WorkEngine } from '../../../core/index.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class AuthLogout extends BaseCommand {
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

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(AuthLogout);

    const engine = new WorkEngine();

    try {
      if (args.context) {
        await engine.setActiveContext(args.context);
      }

      await engine.logout();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(
            { success: true, message: 'Logout successful' },
            'json',
            { timestamp: new Date().toISOString() }
          )
        );
      } else {
        this.log(`✅ Logout successful`);
      }
    } catch (error) {
      this.error(`Failed to logout: ${(error as Error).message}`);
    }
  }
}
