import { Args, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';
import { buildTeamsXML } from '../../../core/xml-utils.js';

export default class Export extends BaseCommand {
  static override args = {
    file: Args.string({
      description: 'path to export teams XML file to',
      required: true,
    }),
  };

  static override description = 'Export teams configuration to XML file';

  static override examples = [
    '<%= config.bin %> <%= command.id %> teams-backup.xml',
    '<%= config.bin %> <%= command.id %> /path/to/exported-teams.xml --teams mobile-dev,backend-api',
    '<%= config.bin %> <%= command.id %> teams.xml',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    teams: Flags.string({
      char: 't',
      description:
        'comma-separated list of team IDs to export (exports all if not specified)',
    }),
    overwrite: Flags.boolean({
      char: 'o',
      description: 'overwrite existing file',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Export);

    const engine = new TeamsEngine();

    try {
      // Check if output file already exists
      if (!flags.overwrite) {
        try {
          await fs.access(args.file);
          this.error(
            `Export file already exists: ${args.file}. Use --overwrite to replace it.`
          );
        } catch {
          // File doesn't exist, which is what we want
        }
      }

      // Load current teams data
      const teamsData = await engine.loadTeamsData();

      let exportData = teamsData;

      // Filter teams if specific team IDs were requested
      if (flags.teams) {
        const requestedTeamIds = flags.teams.split(',').map(id => id.trim());
        const filteredTeams = teamsData.teams.filter(team =>
          requestedTeamIds.includes(team.id)
        );

        if (filteredTeams.length === 0) {
          this.error(`No teams found matching: ${flags.teams}`);
        }

        const missingTeams = requestedTeamIds.filter(
          id => !teamsData.teams.some(team => team.id === id)
        );
        if (missingTeams.length > 0) {
          this.error(`Teams not found: ${missingTeams.join(', ')}`);
        }

        exportData = {
          ...teamsData,
          teams: filteredTeams,
        };
      }

      // Convert to XML
      const xmlContent = buildTeamsXML(exportData);

      // Write to file
      await fs.writeFile(args.file, xmlContent, 'utf-8');

      const result = {
        action: 'exported',
        file: args.file,
        teams: exportData.teams.length,
        totalAgents: exportData.teams.reduce(
          (sum, team) => sum + (team.agents?.length || 0),
          0
        ),
        totalHumans: exportData.teams.reduce(
          (sum, team) => sum + (team.humans?.length || 0),
          0
        ),
      };

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Exported ${result.teams} teams to ${args.file}`);
        this.log(`  - ${result.totalAgents} agents`);
        this.log(`  - ${result.totalHumans} humans`);
      }
    } catch (error) {
      this.handleError(`Failed to export teams: ${(error as Error).message}`);
    }
  }
}
