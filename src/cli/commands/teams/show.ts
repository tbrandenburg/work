import { Args } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsShow extends BaseCommand {
  static override args = {
    teamId: Args.string({
      description: 'team ID to show',
      required: true,
    }),
  };

  static override description = 'Show detailed information about a team';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %> sw-dev-team',
    '<%= config.bin %> teams <%= command.id %> research-team --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(TeamsShow);

    const engine = new TeamsEngine();

    try {
      const team = await engine.getTeam(args.teamId);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(team, 'json', { timestamp: new Date().toISOString() })
        );
        return;
      }

      // Table format
      this.log(`Team: ${team.name}`);
      this.log('─'.repeat(60));
      this.log(`ID:          ${team.id}`);
      this.log(`Title:       ${team.title}`);
      if (team.icon) {
        this.log(`Icon:        ${team.icon}`);
      }
      this.log(`Description: ${team.description}`);

      // Show agents
      if (team.agents && team.agents.length > 0) {
        this.log('\\nAgents:');
        this.log('  ID\\t\\tName\\t\\tTitle');
        this.log('  ─'.repeat(40));
        for (const agent of team.agents) {
          const id = agent.id.padEnd(12);
          const name = agent.name.padEnd(12);
          const title = agent.title;
          this.log(`  ${id}\\t${name}\\t${title}`);
        }
      }

      // Show humans
      if (team.humans && team.humans.length > 0) {
        this.log('\\nHumans:');
        this.log('  ID\\t\\tName\\t\\tTitle');
        this.log('  ─'.repeat(40));
        for (const human of team.humans) {
          const id = human.id.padEnd(12);
          const name = human.name.padEnd(12);
          const title = human.title;
          this.log(`  ${id}\\t${name}\\t${title}`);
        }
      }

      // Show totals
      const agentCount = team.agents?.length || 0;
      const humanCount = team.humans?.length || 0;
      this.log(
        `\\nTotal Members: ${agentCount + humanCount} (${agentCount} agents, ${humanCount} humans)`
      );
    } catch (error) {
      this.error(`Failed to show team: ${(error as Error).message}`);
    }
  }
}
