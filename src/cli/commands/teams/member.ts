import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsMember extends BaseCommand {
  static override args = {
    memberPath: Args.string({
      description: 'member path in format team-id/member-id',
      required: true,
    }),
  };

  static override description =
    'Show detailed information about any team member (agent or human)';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/tech-lead',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/product-owner',
    '<%= config.bin %> teams <%= command.id %> research-team/researcher --persona',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/tech-lead --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    persona: Flags.boolean({
      char: 'p',
      description: 'show member persona details',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(TeamsMember);

    const engine = new TeamsEngine();

    try {
      // Parse member path
      const pathParts = args.memberPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Member path must be in format: team-id/member-id');
      }

      const [teamId, memberId] = pathParts;
      if (!teamId || !memberId) {
        this.error('Member path must be in format: team-id/member-id');
      }

      const member = await engine.getMember(teamId, memberId);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(member, 'json', { timestamp: new Date().toISOString() })
        );
        return;
      }

      // Determine member type
      const isAgent = engine.isAgent(member);
      const memberType = isAgent ? 'Agent' : 'Human';

      // Table format
      this.log(`${memberType}: ${member.name}`);
      this.log('─'.repeat(60));
      this.log(`ID:    ${member.id}`);
      this.log(`Title: ${member.title}`);
      this.log(`Type:  ${memberType}`);
      if (member.icon) {
        this.log(`Icon:  ${member.icon}`);
      }

      // Show persona if requested or by default
      if (flags.persona || !flags.persona) {
        this.log('\\nPersona:');
        this.log(`  Role:               ${member.persona.role}`);
        this.log(`  Identity:           ${member.persona.identity}`);
        this.log(`  Communication:      ${member.persona.communication_style}`);
        this.log(`  Principles:         ${member.persona.principles}`);

        // Show human-specific persona details
        if (!isAgent && 'expertise' in member.persona) {
          const humanMember = member;
          if (humanMember.persona.expertise) {
            this.log(`  Expertise:          ${humanMember.persona.expertise}`);
          }
          if (humanMember.persona.availability) {
            this.log(
              `  Availability:       ${humanMember.persona.availability}`
            );
          }
        }
      }

      // Show type-specific information
      if (isAgent) {
        // Agent-specific information

        const agentMember = member; // Agent type

        if (agentMember.commands && agentMember.commands.length > 0) {
          this.log(`\\nCommands: ${agentMember.commands.length} available`);
          this.log('  Use "work teams agent" for detailed command information');
        }

        if (agentMember.activation) {
          this.log('\\nActivation Settings:');
          this.log(
            `  Critical:           ${agentMember.activation.critical ? 'Yes' : 'No'}`
          );
          this.log(
            '  Use "work teams agent --activation" for detailed activation information'
          );
        }

        if (agentMember.workflows && agentMember.workflows.length > 0) {
          this.log(`\\nWorkflows: ${agentMember.workflows.length} available`);
        }
      } else {
        // Human-specific information
        const humanMember = member;

        if (humanMember.contact) {
          this.log('\\nContact Available:');
          this.log('  Use "work teams human" for detailed contact information');
        }

        if (humanMember.platforms) {
          this.log('\\nPlatform Mappings Available:');
          this.log(
            '  Use "work teams human" for detailed platform information'
          );
        }
      }
    } catch (error) {
      this.error(`Failed to show member: ${(error as Error).message}`);
    }
  }
}
