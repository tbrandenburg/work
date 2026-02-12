import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class Create extends BaseCommand {
  static override args = {
    id: Args.string({
      description:
        'unique identifier for the team (alphanumeric and hyphens only)',
      required: true,
    }),
  };

  static override description = 'Create a new team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev --name "Mobile Team" --title "Mobile Development Team" --description "Team focused on mobile app development"',
    '<%= config.bin %> <%= command.id %> backend-api --name "Backend Team" --title "API Development Team" --description "Team managing backend services" --icon "🔧"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the team',
      required: true,
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the team',
      required: true,
    }),
    description: Flags.string({
      char: 'd',
      description: 'detailed description of the team',
      required: true,
    }),
    icon: Flags.string({
      char: 'i',
      description: 'emoji icon for the team',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);

    const engine = new TeamsEngine();

    try {
      const team = await engine.createTeam({
        id: args.id,
        name: flags.name,
        title: flags.title,
        description: flags.description,
        icon: flags.icon,
      });

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(team, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Created team ${team.id}: ${team.name}`);
      }
    } catch (error) {
      this.handleError(`Failed to create team: ${(error as Error).message}`);
    }
  }
}
