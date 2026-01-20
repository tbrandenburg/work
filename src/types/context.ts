/**
 * Context and adapter interface definitions
 */

import { WorkItem, CreateWorkItemRequest, UpdateWorkItemRequest, Relation } from './work-item.js';

export type AuthState = 'authenticated' | 'unauthenticated' | 'expired';

export interface Context {
  readonly name: string;
  readonly tool: string;
  readonly path?: string | undefined;
  readonly url?: string | undefined;
  readonly authState: AuthState;
  readonly isActive: boolean;
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
  deleteRelation(from: string, to: string, type: Relation['type']): Promise<void>;
}
