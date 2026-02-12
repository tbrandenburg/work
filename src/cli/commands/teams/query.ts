import { Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsQuery extends BaseCommand {
  static override description = 'Query and filter teams, agents, and humans';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %>',
    '<%= config.bin %> teams <%= command.id %> --type agent',
    '<%= config.bin %> teams <%= command.id %> --type human',
    '<%= config.bin %> teams <%= command.id %> --team sw-dev-team',
    '<%= config.bin %> teams <%= command.id %> --name developer',
    '<%= config.bin %> teams <%= command.id %> --role lead',
    '<%= config.bin %> teams <%= command.id %> --type agent --team research-team --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({
      char: 't',
      description: 'filter by member type',
      options: ['agent', 'human'],
    }),
    team: Flags.string({
      description: 'filter by team ID',
    }),
    name: Flags.string({
      char: 'n',
      description: 'filter by name (partial match)',
    }),
    role: Flags.string({
      char: 'r',
      description: 'filter by role/title (partial match)',
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(TeamsQuery);

    const engine = new TeamsEngine();

    try {
      // Build query criteria
      const criteria: {
        type?: 'agent' | 'human';
        team?: string;
        name?: string;
        role?: string;
      } = {};

      if (flags.type) {
        criteria.type = flags.type as 'agent' | 'human';
      }
      if (flags.team) {
        criteria.team = flags.team;
      }
      if (flags.name) {
        criteria.name = flags.name;
      }
      if (flags.role) {
        criteria.role = flags.role;
      }

      const results = await engine.queryTeams(criteria);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(results, 'json', {
            total: results.length,
            criteria,
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Table format
      if (results.length === 0) {
        this.log('No results found matching the criteria.');
        return;
      }

      this.log('Query Results');
      this.log('─'.repeat(80));
      this.log('Type\\t\\tID\\t\\tName\\t\\tTitle\\t\\tTeam');
      this.log('─'.repeat(80));

      for (const result of results) {
        // Determine result type and extract information
        let resultType = 'Team';
        let resultTitle = '';
        let teamId = '';

        if ('teamId' in result && result.teamId) {
          // This is a member (agent or human)
          teamId = result.teamId;

          // Check if it's an agent or human
          if (
            'activation' in result ||
            'commands' in result ||
            'workflows' in result
          ) {
            resultType = 'Agent';
          } else {
            resultType = 'Human';
          }

          if ('title' in result) {
            resultTitle = result.title;
          }
        } else {
          // This is a team
          if ('title' in result) {
            resultTitle = result.title;
          }
          if ('description' in result) {
            resultTitle = (result.description).substring(0, 20);
          }
        }

        const type = resultType.padEnd(8);
        const id = result.id.padEnd(12);
        const name = result.name.padEnd(12);
        const title = resultTitle.padEnd(12);
        const team = teamId.padEnd(12);

        this.log(`${type}\\t${id}\\t${name}\\t${title}\\t${team}`);
      }

      this.log(`\\nTotal: ${results.length} results`);

      // Show applied criteria
      if (Object.keys(criteria).length > 0) {
        this.log('\\nApplied Filters:');
        if (criteria.type) {
          this.log(`  Type: ${criteria.type}`);
        }
        if (criteria.team) {
          this.log(`  Team: ${criteria.team}`);
        }
        if (criteria.name) {
          this.log(`  Name: ${criteria.name}`);
        }
        if (criteria.role) {
          this.log(`  Role: ${criteria.role}`);
        }
      }
    } catch (error) {
      this.error(`Failed to query teams: ${(error as Error).message}`);
    }
  }
}
