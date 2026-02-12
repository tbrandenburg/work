import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsHuman extends BaseCommand {
  static override args = {
    humanPath: Args.string({
      description: 'human path in format team-id/human-id',
      required: true,
    }),
  };

  static override description =
    'Show detailed information about a human team member';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/product-owner',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/ui-designer --persona',
    '<%= config.bin %> teams <%= command.id %> research-team/subject-expert --role',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/product-owner --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    persona: Flags.boolean({
      char: 'p',
      description: 'show human persona details',
      default: false,
    }),
    role: Flags.boolean({
      char: 'r',
      description: 'show human role and expertise',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(TeamsHuman);

    const engine = new TeamsEngine();

    try {
      // Parse human path
      const pathParts = args.humanPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Human path must be in format: team-id/human-id');
      }

      const [teamId, humanId] = pathParts;
      if (!teamId || !humanId) {
        this.error('Human path must be in format: team-id/human-id');
      }

      const human = await engine.getHuman(teamId, humanId);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(human, 'json', { timestamp: new Date().toISOString() })
        );
        return;
      }

      // Table format
      this.log(`Human: ${human.name}`);
      this.log('─'.repeat(60));
      this.log(`ID:    ${human.id}`);
      this.log(`Title: ${human.title}`);
      if (human.icon) {
        this.log(`Icon:  ${human.icon}`);
      }

      // Show persona if requested or no specific flags
      const showAll = !flags.persona && !flags.role;
      if (flags.persona || showAll) {
        this.log('\\nPersona:');
        this.log(`  Role:               ${human.persona.role}`);
        this.log(`  Identity:           ${human.persona.identity}`);
        this.log(`  Communication:      ${human.persona.communication_style}`);
        this.log(`  Principles:         ${human.persona.principles}`);

        if (human.persona.expertise) {
          this.log(`  Expertise:          ${human.persona.expertise}`);
        }
        if (human.persona.availability) {
          this.log(`  Availability:       ${human.persona.availability}`);
        }
      }

      // Show role details if requested or no specific flags
      if (flags.role || showAll) {
        this.log('\\nRole Information:');
        this.log(`  Title:              ${human.title}`);
        if (human.persona.expertise) {
          this.log(`  Expertise Areas:    ${human.persona.expertise}`);
        }
        if (human.persona.availability) {
          this.log(`  Availability:       ${human.persona.availability}`);
        }
      }

      // Show contact information
      if (human.contact) {
        this.log('\\nContact Information:');
        if (human.contact.preferred_method) {
          this.log(`  Preferred Method:   ${human.contact.preferred_method}`);
        }
        if (human.contact.timezone) {
          this.log(`  Timezone:           ${human.contact.timezone}`);
        }
        if (human.contact.working_hours) {
          this.log(`  Working Hours:      ${human.contact.working_hours}`);
        }
        if (human.contact.status) {
          this.log(`  Status:             ${human.contact.status}`);
        }
      }

      // Show platform mappings
      if (human.platforms) {
        this.log('\\nPlatform Mappings:');
        if (human.platforms.github) {
          this.log(`  GitHub:             ${human.platforms.github}`);
        }
        if (human.platforms.slack) {
          this.log(`  Slack:              ${human.platforms.slack}`);
        }
        if (human.platforms.email) {
          this.log(`  Email:              ${human.platforms.email}`);
        }
        if (human.platforms.teams) {
          this.log(`  Teams:              ${human.platforms.teams}`);
        }
      }
    } catch (error) {
      this.error(`Failed to show human: ${(error as Error).message}`);
    }
  }
}
