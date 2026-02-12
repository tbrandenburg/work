import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class AddHuman extends BaseCommand {
  static override args = {
    teamId: Args.string({
      description: 'unique identifier of the team',
      required: true,
    }),
    humanId: Args.string({
      description:
        'unique identifier for the human (alphanumeric and hyphens only)',
      required: true,
    }),
  };

  static override description = 'Add a human to a team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev product-owner --name "Jane Smith" --title "Product Owner" --role "product management" --identity "experienced product manager" --communication "collaborative and clear"',
    '<%= config.bin %> <%= command.id %> backend-api tech-lead --name "John Doe" --title "Technical Lead" --role "technical leadership" --identity "senior engineer" --communication "technical and mentoring" --expertise "backend systems" --icon "👨‍💻"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the human',
      required: true,
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the human',
      required: true,
    }),
    role: Flags.string({
      char: 'r',
      description: 'human role/function',
      required: true,
    }),
    identity: Flags.string({
      description: 'human identity description',
      required: true,
    }),
    communication: Flags.string({
      description: 'communication style',
      required: true,
    }),
    principles: Flags.string({
      description: 'guiding principles',
    }),
    expertise: Flags.string({
      description: 'area of expertise',
    }),
    availability: Flags.string({
      description: 'availability information',
    }),
    icon: Flags.string({
      char: 'i',
      description: 'emoji icon for the human',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(AddHuman);

    const engine = new TeamsEngine();

    try {
      const human = await engine.addHuman(args.teamId, {
        id: args.humanId,
        name: flags.name,
        title: flags.title,
        icon: flags.icon,
        persona: {
          role: flags.role,
          identity: flags.identity,
          communication_style: flags.communication,
          principles: flags.principles || '',
          expertise: flags.expertise,
          availability: flags.availability,
        },
      });

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(human, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(
          `Added human ${human.id} to team ${args.teamId}: ${human.name}`
        );
      }
    } catch (error) {
      this.handleError(`Failed to add human: ${(error as Error).message}`);
    }
  }
}
