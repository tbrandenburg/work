/**
 * Generic assignee resolution service compatible with all adapters
 */

import type { WorkAdapter } from '../types/context.js';
import type { Member } from '../types/teams.js';
import { isHuman } from '../types/teams.js';
import type {
  AssigneeNotation,
  AssigneeResolutionResult,
  ResolverOptions,
  AssigneeContext,
} from '../types/assignee.js';
import {
  isNotation,
  isCurrentUserNotation,
  parseNotation,
} from '../types/assignee.js';
import { InvalidAssigneeError } from '../types/errors.js';
import { TeamsEngine } from './teams-engine.js';

/**
 * Stateless service for adapter-agnostic assignee resolution
 */
export class AssigneeResolver {
  constructor(
    private readonly adapter: WorkAdapter,
    private readonly teamsEngine: TeamsEngine
  ) {}

  /**
   * Resolve any assignee notation to adapter-specific username
   */
  public async resolveAssignee(
    notation: AssigneeNotation,
    options: ResolverOptions = {}
  ): Promise<string> {
    // Handle special @me pattern
    if (isCurrentUserNotation(notation)) {
      return this.resolveCurrentUser(options.currentUser);
    }

    // Handle @notation patterns
    if (isNotation(notation)) {
      const resolvedUser = await this.resolveFromTeams(notation, options);

      // Let adapter do final mapping if it supports it
      if (this.adapter.resolveAssignee) {
        return this.adapter.resolveAssignee(resolvedUser);
      }

      return resolvedUser;
    }

    // Direct username - validate if adapter supports it
    if (this.adapter.validateAssignee) {
      const isValid = await this.adapter.validateAssignee(notation);
      if (!isValid) {
        throw new InvalidAssigneeError(notation);
      }
    }

    return notation;
  }

  /**
   * Parse @notation and extract member information
   */
  public parseNotation(notation: `@${string}`): AssigneeContext {
    return parseNotation(notation);
  }

  /**
   * Get detailed resolution result with member information
   */
  public async resolveWithDetails(
    notation: AssigneeNotation,
    options: ResolverOptions = {}
  ): Promise<AssigneeResolutionResult> {
    const resolvedAssignee = await this.resolveAssignee(notation, options);

    let member: Member | undefined;
    let adapterSpecific = false;

    // Try to get member information if it's @notation
    if (isNotation(notation) && !isCurrentUserNotation(notation)) {
      try {
        member = await this.getMemberFromNotation(notation, options);
        adapterSpecific = this.adapter.resolveAssignee !== undefined;
      } catch {
        // Member not found in teams, but resolution might still work
        adapterSpecific = true;
      }
    }

    return {
      resolvedAssignee,
      member,
      notation,
      adapterSpecific,
    };
  }

  /**
   * Resolve current user (@me)
   */
  private resolveCurrentUser(currentUser?: string): string {
    if (currentUser) {
      return currentUser;
    }

    // Try to get current user from git config
    // For now, return a placeholder that adapters can handle
    return '@me';
  }

  /**
   * Resolve @notation through teams configuration
   */
  private async resolveFromTeams(
    notation: `@${string}`,
    options: ResolverOptions
  ): Promise<string> {
    const member = await this.getMemberFromNotation(notation, options);

    // For humans, try to get platform-specific mapping
    if (isHuman(member) && member.platforms) {
      // Try different platform mappings based on adapter capabilities
      // This is where adapter-specific logic could be implemented
      const platforms = member.platforms;

      if (platforms.github) {
        return platforms.github;
      }

      if (platforms.email) {
        return platforms.email;
      }
    }

    // Fall back to member ID
    return member.id;
  }

  /**
   * Get member from @notation
   */
  private async getMemberFromNotation(
    notation: `@${string}`,
    options: ResolverOptions
  ): Promise<Member> {
    const context = this.parseNotation(notation);

    // If team specified in notation (@team/member)
    if (context.teamId) {
      return this.teamsEngine.getMember(context.teamId, context.memberId);
    }

    // No team specified, search all teams or use default
    const teamId = options.defaultTeam;
    if (!teamId) {
      throw new Error(
        `No team specified and no default team configured for member: ${context.memberId}`
      );
    }

    return this.teamsEngine.getMember(teamId, context.memberId);
  }
}
