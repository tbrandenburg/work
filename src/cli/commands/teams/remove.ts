import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class Remove extends BaseCommand {
  static override args = {
    id: Args.string({
      description: 'unique identifier of the team to remove',
      required: true,
    }),
  };

  static override description = 'Remove an existing team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev',
    '<%= config.bin %> <%= command.id %> old-team --force',
    '<%= config.bin %> <%= command.id %> temp-team --no-backup',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: 'skip confirmation prompt',
    }),
    'no-backup': Flags.boolean({
      description: 'skip backup creation',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Remove);

    const engine = new TeamsEngine();

    try {
      // Check if team exists first
      try {
        await engine.getTeam(args.id);
      } catch {
        this.error(`Team not found: ${args.id}`);
      }

      // Create backup unless --no-backup flag is provided
      if (!flags['no-backup']) {
        try {
          await engine.createBackup();
        } catch (error) {
          this.warn(`Failed to create backup: ${(error as Error).message}`);
          // Continue without backup if not in force mode
          if (!flags.force) {
            this.error(
              'Backup failed. Use --force to skip backup or fix the issue.'
            );
          }
        }
      }

      await engine.deleteTeam(args.id);

      const result = {
        action: 'removed',
        teamId: args.id,
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', { timestamp: new Date().toISOString() })
        );
      } else {
        this.log(`Removed team ${args.id}`);
      }
    } catch (error) {
      this.handleError(`Failed to remove team: ${(error as Error).message}`);
    }
  }
}
