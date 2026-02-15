import { Args, Flags } from '@oclif/core';
import { TeamsEngine } from '../../../core/teams-engine.js';
import { AssigneeResolver } from '../../../core/assignee-resolver.js';
import { BaseCommand } from '../../base-command.js';
import { formatOutput } from '../../formatter.js';
import { isNotation, isCurrentUserNotation } from '../../../types/assignee.js';
import type { WorkAdapter } from '../../../types/context.js';

export default class TeamsResolve extends BaseCommand {
  static override args = {
    notation: Args.string({
      description:
        'assignee notation to resolve (e.g., @tech-lead, @team/member, @me)',
      required: true,
    }),
  };

  static override description =
    'Resolve assignee notation to platform-specific usernames';

  static override examples = [
    '<%= config.bin %> teams <%= command.id %> @tech-lead',
    '<%= config.bin %> teams <%= command.id %> @dev-team/lead',
    '<%= config.bin %> teams <%= command.id %> @me',
    '<%= config.bin %> teams <%= command.id %> john-doe',
    '<%= config.bin %> teams <%= command.id %> @tech-lead --team dev-team --format json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
    team: Flags.string({
      char: 't',
      description: 'default team for notation resolution',
    }),
    details: Flags.boolean({
      char: 'd',
      description: 'show detailed resolution information',
      default: false,
    }),
    'assignee-help': Flags.boolean({
      description: 'show assignee help information',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(TeamsResolve);

    try {
      const teamsEngine = new TeamsEngine();

      // If assignee help flag is provided, show assignee help
      if (flags['assignee-help']) {
        this.log('Assignee Help:');
        this.log(
          '- Use @notation for team assignments (e.g., @tech-lead, @team/member)'
        );
        this.log('- Use @me for current user');
        this.log('- Use direct usernames for platform-specific assignment');
        this.log('- Use --team flag to specify default team for resolution');
        this.log(
          '- Use --details flag for comprehensive resolution information'
        );
        return;
      }

      const notation = args.notation;
      const isJsonMode = await this.getJsonMode();

      // Handle different notation types
      if (isCurrentUserNotation(notation)) {
        // @me notation
        const currentUser =
          process.env['USER'] || process.env['USERNAME'] || 'unknown';

        if (isJsonMode) {
          this.log(
            formatOutput(
              {
                notation,
                resolvedAssignee: currentUser,
                type: 'current-user',
                source: 'environment',
              },
              'json'
            )
          );
        } else {
          this.log(`Notation: ${notation}`);
          this.log(`Resolved: ${currentUser}`);
          this.log('Type: Current user (@me)');
        }
        return;
      }

      if (isNotation(notation)) {
        // @notation patterns
        try {
          // Create a mock adapter for resolution testing
          const mockAdapter: WorkAdapter = {
            initialize: async () => {},
            // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
            createWorkItem: async () => ({}) as any,
            // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
            getWorkItem: async () => ({}) as any,
            // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
            updateWorkItem: async () => ({}) as any,
            // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
            changeState: async () => ({}) as any,
            // eslint-disable-next-line @typescript-eslint/require-await
            listWorkItems: async () => [],
            createRelation: async () => {},
            // eslint-disable-next-line @typescript-eslint/require-await
            getRelations: async () => [],
            deleteRelation: async () => {},
            deleteWorkItem: async () => {},
            // eslint-disable-next-line @typescript-eslint/require-await
            authenticate: async () => ({ state: 'unauthenticated' }),
            logout: async () => {},
            // eslint-disable-next-line @typescript-eslint/require-await
            getAuthStatus: async () => ({ state: 'unauthenticated' }),
            // eslint-disable-next-line @typescript-eslint/require-await
            getSchema: async () => ({
              kinds: [],
              attributes: [],
              relationTypes: [],
            }),
            // eslint-disable-next-line @typescript-eslint/require-await
            getKinds: async () => [],
            // eslint-disable-next-line @typescript-eslint/require-await
            getAttributes: async () => [],
            // eslint-disable-next-line @typescript-eslint/require-await
            getRelationTypes: async () => [],
            // eslint-disable-next-line @typescript-eslint/require-await
            resolveAssignee: async (assignee: string) => assignee,
            // eslint-disable-next-line @typescript-eslint/require-await
            validateAssignee: async () => true,
          };

          const resolver = new AssigneeResolver(mockAdapter, teamsEngine);

          if (flags.details) {
            const result = await resolver.resolveWithDetails(notation, {
              defaultTeam: flags.team,
              currentUser: process.env['USER'] || process.env['USERNAME'],
            });

            if (isJsonMode) {
              this.log(formatOutput(result, 'json'));
            } else {
              this.log(`Notation: ${result.notation}`);
              this.log(`Resolved: ${result.resolvedAssignee}`);
              this.log(`Adapter Specific: ${result.adapterSpecific}`);
              if (result.member) {
                this.log(
                  `Member Found: ${result.member.name} (${result.member.id})`
                );
                if ('platforms' in result.member && result.member.platforms) {
                  this.log('Platforms:');
                  Object.entries(result.member.platforms).forEach(
                    ([platform, username]) => {
                      if (username) {
                        this.log(`  ${platform}: ${username}`);
                      }
                    }
                  );
                }
              } else {
                this.log('Member: Not found in teams configuration');
              }
            }
          } else {
            const resolved = await resolver.resolveAssignee(notation, {
              defaultTeam: flags.team,
              currentUser: process.env['USER'] || process.env['USERNAME'],
            });

            if (isJsonMode) {
              this.log(
                formatOutput(
                  {
                    notation,
                    resolvedAssignee: resolved,
                    type: 'team-notation',
                  },
                  'json'
                )
              );
            } else {
              this.log(`Notation: ${notation}`);
              this.log(`Resolved: ${resolved}`);
              this.log('Type: Team notation');
            }
          }
        } catch (error) {
          this.handleError(
            `Failed to resolve notation "${notation}": ${(error as Error).message}`
          );
        }
      } else {
        // Direct username
        if (isJsonMode) {
          this.log(
            formatOutput(
              {
                notation,
                resolvedAssignee: notation,
                type: 'direct-username',
              },
              'json'
            )
          );
        } else {
          this.log(`Notation: ${notation}`);
          this.log(`Resolved: ${notation}`);
          this.log('Type: Direct username (no resolution needed)');
        }
      }
    } catch (error) {
      this.handleError(`Teams resolve failed: ${(error as Error).message}`);
    }
  }
}
