import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';

export default class Edit extends BaseCommand {
  static override args = {
    id: Args.string({
      description: 'unique identifier of the team to edit',
      required: true,
    }),
  };

  static override description = 'Edit an existing team';

  static override examples = [
    '<%= config.bin %> <%= command.id %> mobile-dev --name "Updated Mobile Team"',
    '<%= config.bin %> <%= command.id %> backend-api --title "New API Development Team" --description "Updated description"',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'human-readable name of the team',
    }),
    title: Flags.string({
      char: 't',
      description: 'formal title of the team',
    }),
    description: Flags.string({
      char: 'd',
      description: 'detailed description of the team',
    }),
    icon: Flags.string({
      char: 'i',
      description: 'emoji icon for the team',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Edit);

    const engine = new TeamsEngine();

    try {
      const team = await engine.updateTeam(args.id, {
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
        this.log(`Updated team ${team.id}: ${team.name}`);
      }
    } catch (error) {
      this.handleError(`Failed to update team: ${(error as Error).message}`);
    }
  }
}
