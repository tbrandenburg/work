import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class TeamsAgent extends BaseCommand {
  static override args = {
    agentPath: Args.string({
      description: 'agent path in format team-id/agent-id',
      required: true,
    }),
  };

  static override description = 'Show detailed information about an agent';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/tech-lead',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/developer --persona',
    '<%= config.bin %> teams <%= command.id %> research-team/researcher --commands',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/scrum-master --activation',
    '<%= config.bin %> teams <%= command.id %> sw-dev-team/tech-lead --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    persona: Flags.boolean({
      char: 'p',
      description: 'show agent persona details',
      default: false,
    }),
    commands: Flags.boolean({
      char: 'c',
      description: 'show agent commands',
      default: false,
    }),
    activation: Flags.boolean({
      char: 'a',
      description: 'show agent activation settings',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(TeamsAgent);

    const engine = new TeamsEngine();

    try {
      // Parse agent path
      const pathParts = args.agentPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Agent path must be in format: team-id/agent-id');
      }

      const [teamId, agentId] = pathParts;
      if (!teamId || !agentId) {
        this.error('Agent path must be in format: team-id/agent-id');
      }

      const agent = await engine.getAgent(teamId, agentId);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(agent, 'json', { timestamp: new Date().toISOString() })
        );
        return;
      }

      // Table format
      this.log(`Agent: ${agent.name}`);
      this.log('─'.repeat(60));
      this.log(`ID:    ${agent.id}`);
      this.log(`Title: ${agent.title}`);
      if (agent.icon) {
        this.log(`Icon:  ${agent.icon}`);
      }

      // Show persona if requested or no specific flags
      const showAll = !flags.persona && !flags.commands && !flags.activation;
      if (flags.persona || showAll) {
        this.log('\\nPersona:');
        this.log(`  Role:               ${agent.persona.role}`);
        this.log(`  Identity:           ${agent.persona.identity}`);
        this.log(`  Communication:      ${agent.persona.communication_style}`);
        this.log(`  Principles:         ${agent.persona.principles}`);
      }

      // Show commands if requested or no specific flags
      if (
        (flags.commands || showAll) &&
        agent.commands &&
        agent.commands.length > 0
      ) {
        this.log('\\nCommands:');
        for (const command of agent.commands) {
          this.log(`  /${command.trigger}`);
          this.log(`    Description:      ${command.description}`);
          if (command.instructions) {
            // Handle both string and CDATA object formats
            let instructionsText = '';
            if (typeof command.instructions === 'string') {
              instructionsText = command.instructions;
            } else if (
              command.instructions &&
              typeof command.instructions === 'object'
            ) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
              const instructionsObj = command.instructions as any;
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              if (instructionsObj.__cdata) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                instructionsText = instructionsObj.__cdata;
              }
            }

            if (instructionsText) {
              this.log(
                `    Instructions:     ${instructionsText.trim().substring(0, 80)}...`
              );
            }
          }
          if (command.workflow_id) {
            this.log(`    Workflow:         ${command.workflow_id}`);
          }
          this.log('');
        }
      }

      // Show activation if requested or no specific flags
      if ((flags.activation || showAll) && agent.activation) {
        this.log('\\nActivation:');
        this.log(
          `  Critical:           ${agent.activation.critical ? 'Yes' : 'No'}`
        );
        this.log(`  Instructions:       ${agent.activation.instructions}`);
      }

      // Show workflows count
      if (agent.workflows && agent.workflows.length > 0) {
        this.log(`\\nWorkflows: ${agent.workflows.length} available`);
      }
    } catch (error) {
      this.error(`Failed to show agent: ${(error as Error).message}`);
    }
  }
}
