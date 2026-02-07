import { Args, Flags } from '@oclif/core';
import { WorkEngine } from '../../core/index.js';
import { WorkItemKind, Priority } from '../../types/index.js';
import { BaseCommand } from '../base-command.js';
import { formatOutput } from '../formatter.js';

export default class Create extends BaseCommand {
  static override args = {
    title: Args.string({
      description: 'title of the work item',
      required: true,
    }),
  };

  static override description = 'Create a new work item';

  static override examples = [
    '<%= config.bin %> <%= command.id %> "Fix login bug" --kind bug --priority high',
    '<%= config.bin %> <%= command.id %> "Implement user dashboard" --kind task',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    kind: Flags.string({
      char: 'k',
      description: 'kind of work item',
      options: ['task', 'bug', 'epic', 'story'],
      default: 'task',
    }),
    priority: Flags.string({
      char: 'p',
      description: 'priority level',
      options: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    }),
    description: Flags.string({
      char: 'd',
      description: 'detailed description',
    }),
    assignee: Flags.string({
      char: 'a',
      description: 'assignee username',
    }),
    agent: Flags.string({
      description: 'agent identifier',
    }),
    labels: Flags.string({
      char: 'l',
      description: 'comma-separated labels',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);

    const engine = new WorkEngine();

    try {
      const labels = flags.labels
        ? flags.labels.split(',').map(l => l.trim())
        : [];

      const workItem = await engine.createWorkItem({
        title: args.title,
        kind: flags.kind as WorkItemKind,
        priority: flags.priority as Priority,
        description: flags.description,
        assignee: flags.assignee,
        agent: flags.agent,
        labels,
      });

      const isJsonMode = await this.getJsonMode();
      if (isJsonMode) {
        this.log(
          formatOutput(workItem, 'json', {
            timestamp: new Date().toISOString(),
          })
        );
      } else {
        this.log(`Created ${workItem.kind} ${workItem.id}: ${workItem.title}`);
      }
    } catch (error) {
      this.handleError(
        `Failed to create work item: ${(error as Error).message}`
      );
    }
  }
}
