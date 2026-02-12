import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';
import { UpdateHumanRequest } from '../../../types/teams.js';

export default class EditHuman extends BaseCommand {
  static override args = {
    memberPath: Args.string({
      description: 'human path in format team-id/human-id',
      required: true,
    }),
  };

  static override description = 'Edit an existing human in a team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev/product-owner --name "Jane Smith-Johnson"',
    '<%= config.bin %> <%= command.id %> backend-api/tech-lead --title "Senior Technical Lead" --expertise "distributed systems"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the human',
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the human',
    }),
    role: Flags.string({
      char: 'r',
      description: 'human role/function',
    }),
    identity: Flags.string({
      description: 'human identity description',
    }),
    communication: Flags.string({
      description: 'communication style',
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
    const { args, flags } = await this.parse(EditHuman);

    const engine = new TeamsEngine();

    try {
      // Parse member path
      const pathParts = args.memberPath.split('/');
      if (pathParts.length !== 2) {
        this.error('Member path must be in format: team-id/human-id');
      }

      const [teamId, humanId] = pathParts;
      if (!teamId || !humanId) {
        this.error('Member path must be in format: team-id/human-id');
      }

      // Get current human if persona updates are needed
      let currentHuman;
      if (
        flags.role ||
        flags.identity ||
        flags.communication ||
        flags.principles !== undefined ||
        flags.expertise !== undefined ||
        flags.availability !== undefined
      ) {
        currentHuman = await engine.getMember(teamId, humanId);
        if (!engine.isHuman(currentHuman)) {
          this.error(`Member ${humanId} is not a human`);
        }
      }

      // Build update object
      const updates: UpdateHumanRequest = {
        ...(flags.name && { name: flags.name }),
        ...(flags.title && { title: flags.title }),
        ...(flags.icon !== undefined && { icon: flags.icon }),
        ...(currentHuman && {
          persona: {
            role: flags.role ?? currentHuman.persona.role,
            identity: flags.identity ?? currentHuman.persona.identity,
            communication_style:
              flags.communication ?? currentHuman.persona.communication_style,
            principles:
              flags.principles !== undefined
                ? flags.principles
                : currentHuman.persona.principles,
            expertise:
              flags.expertise !== undefined
                ? flags.expertise
                : currentHuman.persona.expertise,
            availability:
              flags.availability !== undefined
                ? flags.availability
                : currentHuman.persona.availability,
          },
        }),
      };

      const human = await engine.updateHuman(teamId, humanId, updates);

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(human, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Updated human ${human.id} in team ${teamId}: ${human.name}`);
      }
    } catch (error) {
      this.handleError(`Failed to update human: ${(error as Error).message}`);
    }
  }
}
