import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsValidate extends BaseCommand {
  static override description = 'Validate teams.xml structure and content';

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
      const validation = await engine.validateTeams();

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(validation, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
        return;
      }

      // Table format
      this.log('Teams XML Validation');
      this.log('─'.repeat(40));

      if (validation.isValid) {
        this.log('Status: ✓ Valid');
      } else {
        this.log('Status: ✗ Invalid');
      }

      if (validation.errors.length > 0) {
        this.log('\\nErrors:');
        for (const error of validation.errors) {
          this.log(`  ✗ ${error}`);
        }
      }

      if (validation.warnings.length > 0) {
        this.log('\\nWarnings:');
        for (const warning of validation.warnings) {
          this.log(`  ⚠ ${warning}`);
        }
      }

      if (validation.isValid && validation.warnings.length === 0) {
        this.log('\\n✓ Teams configuration is valid with no warnings.');
      }

      // Exit with error code if validation failed
      if (!validation.isValid) {
        process.exit(1);
      }
    } catch (error) {
      this.error(`Failed to validate teams: ${(error as Error).message}`);
    }
  }
}
