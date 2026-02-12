import { Args, Flags } from '@oclif/core';
import { promises as fs } from 'fs';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';
import { parseTeamsXML } from '../../../core/xml-utils.js';

export default class Import extends BaseCommand {
  static override args = {
    file: Args.string({
      description: 'path to teams XML file to import',
      required: true,
    }),
  };

  static override description = 'Import teams configuration from XML file';

  static override examples = [
    '<%= config.bin %> <%= command.id %> teams-backup.xml',
    '<%= config.bin %> <%= command.id %> /path/to/teams.xml --merge',
    '<%= config.bin %> <%= command.id %> exported-teams.xml --validate-only',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    merge: Flags.boolean({
      char: 'm',
      description: 'merge with existing teams instead of replacing',
    }),
    'validate-only': Flags.boolean({
      description: 'validate the import file without importing',
    }),
    backup: Flags.boolean({
      char: 'b',
      description: 'create backup before import',
      default: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Import);

    const engine = new TeamsEngine();

    try {
      // Check if file exists
      try {
        await fs.access(args.file);
      } catch {
        this.error(`Import file not found: ${args.file}`);
      }

      // Read and validate the import file
      const importContent = await fs.readFile(args.file, 'utf-8');
      const importData = parseTeamsXML(importContent);

      if (flags['validate-only']) {
        this.log(`✓ Import file is valid`);
        this.log(`  - Contains ${importData.teams.length} teams`);
        const totalAgents = importData.teams.reduce(
          (sum, team) => sum + (team.agents?.length || 0),
          0
        );
        const totalHumans = importData.teams.reduce(
          (sum, team) => sum + (team.humans?.length || 0),
          0
        );
        this.log(`  - Contains ${totalAgents} agents`);
        this.log(`  - Contains ${totalHumans} humans`);
        return;
      }

      let result;
      if (flags.merge) {
        // Merge with existing teams
        const currentData = await engine.loadTeamsData();
        const existingTeamIds = new Set(currentData.teams.map(t => t.id));
        const newTeams = importData.teams.filter(
          t => !existingTeamIds.has(t.id)
        );

        if (newTeams.length === 0) {
          this.log('No new teams to import (all teams already exist)');
          return;
        }

        // Create backup if requested
        if (flags.backup) {
          await engine.createBackup();
        }

        const mergedData = {
          ...currentData,
          teams: [...currentData.teams, ...newTeams],
        };

        await engine.saveTeamsData(mergedData);
        result = {
          action: 'merged',
          imported: newTeams.length,
          existing: currentData.teams.length,
          total: mergedData.teams.length,
        };
      } else {
        // Replace existing teams
        if (flags.backup) {
          await engine.createBackup();
        }

        await engine.saveTeamsData(importData);
        result = {
          action: 'replaced',
          imported: importData.teams.length,
        };
      }

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(result, 'json', {
            timestamp: new Date().toISOString(),
            file: args.file,
          })
        );
      } else {
        if (flags.merge) {
          this.log(
            `Imported ${result.imported} new teams (${result.total} total)`
          );
        } else {
          this.log(`Imported ${result.imported} teams from ${args.file}`);
        }
      }
    } catch (error) {
      this.handleError(`Failed to import teams: ${(error as Error).message}`);
    }
  }
}
