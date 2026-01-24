/**
 * Context and adapter interface definitions
 */

import {
  WorkItem,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  Relation,
} from './work-item.js';
import { NotificationTarget } from './notification.js';

export type AuthState = 'authenticated' | 'unauthenticated' | 'expired';

export interface AuthStatus {
  readonly state: AuthState;
  readonly user?: string | undefined;
  readonly expiresAt?: Date | undefined;
}

export interface SchemaAttribute {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description?: string | undefined;
}

export interface SchemaRelationType {
  readonly name: string;
  readonly description?: string | undefined;
  readonly allowedFromKinds: readonly string[];
  readonly allowedToKinds: readonly string[];
}

export interface Schema {
  readonly kinds: readonly string[];
  readonly attributes: readonly SchemaAttribute[];
  readonly relationTypes: readonly SchemaRelationType[];
}

export interface Context {
  readonly name: string;
  readonly tool: string;
  readonly path?: string | undefined;
  readonly url?: string | undefined;
  readonly authState: AuthState;
  readonly isActive: boolean;
  readonly notificationTargets?: readonly NotificationTarget[] | undefined;
}

export interface WorkAdapter {
  /**
   * Initialize the adapter with context configuration
   */
  initialize(context: Context): Promise<void>;

  /**
   * Create a new work item
   */
  createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem>;

  /**
   * Get a work item by ID
   */
  getWorkItem(id: string): Promise<WorkItem>;

  /**
   * Update a work item
   */
  updateWorkItem(id: string, request: UpdateWorkItemRequest): Promise<WorkItem>;

  /**
   * Change work item state
   */
  changeState(id: string, state: WorkItem['state']): Promise<WorkItem>;

  /**
   * List work items with optional filtering
   */
  listWorkItems(query?: string): Promise<WorkItem[]>;

  /**
   * Create a relation between work items
   */
  createRelation(relation: Relation): Promise<void>;

  /**
   * Get relations for a work item
   */
  getRelations(workItemId: string): Promise<Relation[]>;

  /**
   * Delete a relation
   */
  deleteRelation(
    from: string,
    to: string,
    type: Relation['type']
  ): Promise<void>;

  /**
   * Delete a work item
   */
  deleteWorkItem(id: string): Promise<void>;

  /**
   * Authenticate with the backend
   */
  authenticate(credentials?: Record<string, string>): Promise<AuthStatus>;

  /**
   * Logout from the backend
   */
  logout(): Promise<void>;

  /**
   * Get current authentication status
   */
  getAuthStatus(): Promise<AuthStatus>;

  /**
   * Get complete schema information
   */
  getSchema(): Promise<Schema>;

  /**
   * Get available work item kinds
   */
  getKinds(): Promise<readonly string[]>;

  /**
   * Get available attributes
   */
  getAttributes(): Promise<readonly SchemaAttribute[]>;

  /**
   * Get available relation types
   */
  getRelationTypes(): Promise<readonly SchemaRelationType[]>;
}
