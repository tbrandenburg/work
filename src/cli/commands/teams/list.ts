import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsList extends BaseCommand {
  static override description = 'List all teams';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %>',
    '<%= config.bin %> teams <%= command.id %> --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(TeamsList);

    const engine = new TeamsEngine();

    try {
      const teams = await engine.listTeams();

      if (flags.format === 'json') {
        this.log(
          formatOutput(teams, flags.format, {
            total: teams.length,
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Table format
      if (teams.length === 0) {
        this.log('No teams found.');
        return;
      }

      this.log('ID\t\tName\t\tTitle\t\tDescription');
      this.log('─'.repeat(80));

      for (const team of teams) {
        const id = team.id.padEnd(12);
        const name = team.name.padEnd(12);
        const title = team.title.padEnd(12);
        const description = team.description.substring(0, 30).padEnd(30);

        this.log(`${id}\t${name}\t${title}\t${description}`);
      }

      this.log(`\nTotal: ${teams.length} teams`);
    } catch (error) {
      this.error(`Failed to list teams: ${(error as Error).message}`);
    }
  }
}
