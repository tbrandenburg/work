import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class AddAgent extends BaseCommand {
  static override args = {
    teamId: Args.string({
      description: 'unique identifier of the team',
      required: true,
    }),
    agentId: Args.string({
      description:
        'unique identifier for the agent (alphanumeric and hyphens only)',
      required: true,
    }),
  };

  static override description = 'Add an agent to a team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev code-reviewer --name "Code Reviewer" --title "Senior Code Reviewer" --role "code review" --identity "experienced developer" --communication "professional and constructive"',
    '<%= config.bin %> <%= command.id %> backend-api testing-agent --name "Test Agent" --title "QA Testing Agent" --role "quality assurance" --identity "thorough tester" --communication "detailed and methodical" --icon "🧪"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the agent',
      required: true,
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the agent',
      required: true,
    }),
    role: Flags.string({
      char: 'r',
      description: 'agent role/function',
      required: true,
    }),
    identity: Flags.string({
      description: 'agent identity description',
      required: true,
    }),
    communication: Flags.string({
      description: 'communication style',
      required: true,
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
    const { args, flags } = await this.parse(AddAgent);

    const engine = new TeamsEngine();

    try {
      const agent = await engine.addAgent(args.teamId, {
        id: args.agentId,
        name: flags.name,
        title: flags.title,
        icon: flags.icon,
        persona: {
          role: flags.role,
          identity: flags.identity,
          communication_style: flags.communication,
          principles: flags.principles || '',
        },
      });

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(agent, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(
          `Added agent ${agent.id} to team ${args.teamId}: ${agent.name}`
        );
      }
    } catch (error) {
      this.handleError(`Failed to add agent: ${(error as Error).message}`);
    }
  }
}
