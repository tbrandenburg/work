/**
 * Type definitions for adapter-agnostic assignee resolution
 */

import type { Member } from './teams.js';

/**
 * Supported assignee notation patterns
 */
export type AssigneeNotation =
  | `@${string}` // @member or @team/member
  | '@me' // Special case for current user
  | (string & {}); // Direct username (exclude @-patterns)

/**
 * Result of assignee resolution
 */
export interface AssigneeResolutionResult {
  readonly resolvedAssignee: string;
  readonly member?: Member | undefined;
  readonly notation: AssigneeNotation;
  readonly adapterSpecific: boolean;
}

/**
 * Options for assignee resolution
 */
export interface ResolverOptions {
  readonly currentUser?: string | undefined;
  readonly defaultTeam?: string | undefined;
  readonly validateWithAdapter?: boolean | undefined;
}

/**
 * Assignee resolution context
 */
export interface AssigneeContext {
  readonly teamId?: string | undefined;
  readonly memberId: string;
  readonly originalNotation: string;
}

/**
 * Type guard to check if string is @notation
 */
export const isNotation = (assignee: string): assignee is `@${string}` => {
  return assignee.startsWith('@');
};

/**
 * Type guard to check if string is @me notation
 */
export const isCurrentUserNotation = (assignee: string): assignee is '@me' => {
  return assignee === '@me';
};

/**
 * Parse @notation into team and member components
 */
export const parseNotation = (notation: `@${string}`): AssigneeContext => {
  const withoutAt = notation.slice(1);

  if (withoutAt.includes('/')) {
    const [teamId, memberId] = withoutAt.split('/', 2);
    return {
      teamId: teamId || undefined,
      memberId: memberId || '',
      originalNotation: notation,
    };
  }

  return {
    memberId: withoutAt,
    originalNotation: notation,
  };
};
