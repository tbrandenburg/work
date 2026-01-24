import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Hello extends BaseCommand {
  static override args = {
    person: Args.string({ description: 'person to say hello to' }),
  };

  static override description = 'Say hello';

  static override examples = [
    '<%= config.bin %> <%= command.id %> friend --from oclif',
    '<%= config.bin %> <%= command.id %> friend',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({
      char: 'f',
      description: 'whom is saying hello',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Hello);

    const message = `hello ${args.person ?? 'World'} from ${flags.from}! (./src/commands/hello.ts)`;

    const isJsonMode = await this.getJsonMode();
    if (isJsonMode) {
      this.log(
        formatOutput(
          { message, person: args.person ?? 'World', from: flags.from },
          'json',
          { timestamp: new Date().toISOString() }
        )
      );
    } else {
      this.log(message);
    }
  }
}
