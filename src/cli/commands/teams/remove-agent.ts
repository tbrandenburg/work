import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class RemoveAgent extends BaseCommand {
  static override args = {
    memberPath: Args.string({
      description: 'agent path in format team-id/agent-id',
      required: true,
    }),
  };

  static override description = 'Remove an agent from a team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev/code-reviewer',
    '<%= config.bin %> <%= command.id %> backend-api/testing-agent --force',
    '<%= config.bin %> <%= command.id %> temp-team/temp-agent --no-backup',
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
    const { args, flags } = await this.parse(RemoveAgent);

    const engine = new TeamsEngine();

    try {
      // Parse member path
      const pathParts = args.memberPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Member path must be in format: team-id/agent-id');
      }

      const [teamId, agentId] = pathParts;
      if (!teamId || !agentId) {
        this.error('Member path must be in format: team-id/agent-id');
      }

      // Create backup unless --no-backup flag is provided
      if (!flags['no-backup']) {
        try {
          await engine.createBackup();
        } catch (error) {
          this.warn(`Failed to create backup: ${(error as Error).message}`);
          if (!flags.force) {
            this.error(
              'Backup failed. Use --force to skip backup or fix the issue.'
            );
          }
        }
      }

      await engine.removeAgent(teamId, agentId);

      const result = {
        action: 'removed',
        agentId: agentId,
        teamId: teamId,
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', { timestamp: new Date().toISOString() })
        );
      } else {
        this.log(`Removed agent ${agentId} from team ${teamId}`);
      }
    } catch (error) {
      this.handleError(`Failed to remove agent: ${(error as Error).message}`);
    }
  }
}
