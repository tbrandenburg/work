import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsConfig extends BaseCommand {
  static override description = 'Show teams configuration file path';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %>',
    '<%= config.bin %> teams <%= command.id %> --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  public async run(): Promise<void> {
    const engine = new TeamsEngine();

    try {
      const configPath = engine.getConfigPath();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput({ configPath }, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Table format
      this.log('Teams Configuration');
      this.log('─'.repeat(40));
      this.log(`File Path: ${configPath}`);
      this.log('');
      this.log('Use this path to directly edit the teams.xml file');
      this.log('or to back up your team configurations.');
    } catch (error) {
      this.error(`Failed to show config: ${(error as Error).message}`);
    }
  }
}
