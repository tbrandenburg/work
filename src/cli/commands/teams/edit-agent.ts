import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';
import { UpdateAgentRequest } from '../../../types/teams.js';

export default class EditAgent extends BaseCommand {
  static override args = {
    memberPath: Args.string({
      description: 'agent path in format team-id/agent-id',
      required: true,
    }),
  };

  static override description = 'Edit an existing agent in a team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev/code-reviewer --name "Senior Code Reviewer"',
    '<%= config.bin %> <%= command.id %> backend-api/testing-agent --title "Lead QA Agent" --role "senior quality assurance"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the agent',
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the agent',
    }),
    role: Flags.string({
      char: 'r',
      description: 'agent role/function',
    }),
    identity: Flags.string({
      description: 'agent identity description',
    }),
    communication: Flags.string({
      description: 'communication style',
    }),
    principles: Flags.string({
      description: 'guiding principles',
    }),
    icon: Flags.string({
      char: 'i',
      description: 'emoji icon for the agent',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(EditAgent);

    const engine = new TeamsEngine();

    try {
      // Parse member path
      const pathParts = args.memberPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Member path must be in format: team-id/agent-id');
      }

      const [teamId, agentId] = pathParts;
      if (!teamId || !agentId) {
        this.error('Member path must be in format: team-id/agent-id');
      }

      // Get current agent if persona updates are needed
      let currentAgent;
      if (
        flags.role ||
        flags.identity ||
        flags.communication ||
        flags.principles !== undefined
      ) {
        currentAgent = await engine.getMember(teamId, agentId);
        if (!engine.isAgent(currentAgent)) {
          this.error(`Member ${agentId} is not an agent`);
        }
      }

      // Build update object
      const updates: UpdateAgentRequest = {
        ...(flags.name && { name: flags.name }),
        ...(flags.title && { title: flags.title }),
        ...(flags.icon !== undefined && { icon: flags.icon }),
        ...(currentAgent && {
          persona: {
            role: flags.role ?? currentAgent.persona.role,
            identity: flags.identity ?? currentAgent.persona.identity,
            communication_style:
              flags.communication ?? currentAgent.persona.communication_style,
            principles:
              flags.principles !== undefined
                ? flags.principles
                : currentAgent.persona.principles,
          },
        }),
      };

      const agent = await engine.updateAgent(teamId, agentId, updates);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(agent, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Updated agent ${agent.id} in team ${teamId}: ${agent.name}`);
      }
    } catch (error) {
      this.handleError(`Failed to update agent: ${(error as Error).message}`);
    }
  }
}
