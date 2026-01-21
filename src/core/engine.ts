/**
 * Main engine class with context resolution and command delegation
 */

import { WorkAdapter, Context, WorkItem, CreateWorkItemRequest, UpdateWorkItemRequest, Relation, ContextNotFoundError, AuthStatus, Schema, SchemaAttribute, SchemaRelationType } from '../types/index.js';
import { LocalFsAdapter } from '../adapters/local-fs/index.js';
import { validateRelation, detectCycles } from './graph.js';
import { parseQuery, executeQuery } from './query.js';

export class WorkEngine {
  private adapters = new Map<string, WorkAdapter>();
  private contexts = new Map<string, Context>();
  private activeContext: string | null = null;

  constructor() {
    // Register built-in adapters
    this.registerAdapter('local-fs', new LocalFsAdapter());
  }

  /**
   * Ensure default context exists for MVP
   */
  private async ensureDefaultContext(): Promise<void> {
    if (this.contexts.size === 0) {
      const defaultContext: Context = {
        name: 'default',
        tool: 'local-fs',
        path: process.cwd(),
        authState: 'authenticated',
        isActive: true,
      };
      
      await this.addContext(defaultContext);
      this.setActiveContext('default');
    } else if (!this.activeContext) {
      // Set first context as active if none is set
      const firstContext = Array.from(this.contexts.keys())[0];
      if (firstContext) {
        this.setActiveContext(firstContext);
      }
    }
  }

  /**
   * Register a new adapter
   */
  registerAdapter(name: string, adapter: WorkAdapter): void {
    this.adapters.set(name, adapter);
  }

  /**
   * Add a new context
   */
  async addContext(context: Context): Promise<void> {
    const adapter = this.adapters.get(context.tool);
    if (!adapter) {
      throw new Error(`Unknown adapter: ${context.tool}`);
    }

    // Initialize the adapter with the context
    await adapter.initialize(context);

    this.contexts.set(context.name, context);
  }

  /**
   * Set the active context
   */
  setActiveContext(name: string): void {
    if (!this.contexts.has(name)) {
      throw new ContextNotFoundError(name);
    }
    this.activeContext = name;
  }

  /**
   * Get the current active context
   */
  getActiveContext(): Context {
    if (!this.activeContext) {
      throw new Error('No active context set');
    }

    const context = this.contexts.get(this.activeContext);
    if (!context) {
      throw new ContextNotFoundError(this.activeContext);
    }

    return context;
  }

  /**
   * Get all contexts
   */
  getContexts(): Context[] {
    return Array.from(this.contexts.values());
  }

  /**
   * Remove a context
   */
  removeContext(name: string): void {
    const context = this.contexts.get(name);
    if (!context) {
      throw new ContextNotFoundError(name);
    }

    // If removing active context, set activeContext to null
    if (this.activeContext === name) {
      this.activeContext = null;
    }

    this.contexts.delete(name);
  }

  /**
   * Get the adapter for the active context
   */
  private getActiveAdapter(): WorkAdapter {
    const context = this.getActiveContext();
    const adapter = this.adapters.get(context.tool);
    if (!adapter) {
      throw new Error(`Adapter not found: ${context.tool}`);
    }
    return adapter;
  }

  /**
   * Create a new work item
   */
  async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.createWorkItem(request);
  }

  /**
   * Get a work item by ID
   */
  async getWorkItem(id: string): Promise<WorkItem> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getWorkItem(id);
  }

  /**
   * Update a work item
   */
  async updateWorkItem(id: string, request: UpdateWorkItemRequest): Promise<WorkItem> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.updateWorkItem(id, request);
  }

  /**
   * Change work item state
   */
  async changeState(id: string, state: WorkItem['state']): Promise<WorkItem> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.changeState(id, state);
  }

  /**
   * List work items with optional query
   */
  async listWorkItems(queryString?: string): Promise<WorkItem[]> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    
    if (!queryString) {
      return adapter.listWorkItems();
    }

    // Parse and execute query - parseQuery expects full query format
    const fullQuery = `where ${queryString}`;
    const query = parseQuery(fullQuery);
    const allItems = await adapter.listWorkItems(); // Get all items, filter in executeQuery
    
    return executeQuery(allItems, query);
  }

  /**
   * Create a relation between work items
   */
  async createRelation(relation: Relation): Promise<void> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    
    // Get all work items and relations for validation
    const workItems = await adapter.listWorkItems();
    const allRelations = await this.getAllRelations();
    
    // Validate the relation
    validateRelation(relation, workItems);
    
    // Check for cycles in parent/child relationships
    if (relation.type === 'parent_of' && detectCycles(allRelations, relation)) {
      throw new Error('Creating this relation would create a cycle');
    }
    
    await adapter.createRelation(relation);
  }

  /**
   * Get relations for a work item
   */
  async getRelations(workItemId: string): Promise<Relation[]> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getRelations(workItemId);
  }

  /**
   * Delete a relation
   */
  async deleteRelation(from: string, to: string, type: Relation['type']): Promise<void> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    await adapter.deleteRelation(from, to, type);
  }

  /**
   * Delete a work item
   */
  async deleteWorkItem(id: string): Promise<void> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    await adapter.deleteWorkItem(id);
  }

  /**
   * Add a comment to a work item (placeholder)
   */
  addComment(workItemId: string, text: string): void {
    // Placeholder implementation for MVP
    console.log(`Comment operation not yet implemented: ${workItemId} - ${text}`);
  }

  /**
   * Move a work item to another context (placeholder)
   */
  moveWorkItem(workItemId: string, targetContext: string): void {
    // Placeholder implementation for MVP
    console.log(`Move operation not yet implemented: ${workItemId} to ${targetContext}`);
  }

  /**
   * Get all relations (for cycle detection)
   */
  private async getAllRelations(): Promise<Relation[]> {
    const adapter = this.getActiveAdapter();
    const workItems = await adapter.listWorkItems();
    const allRelations: Relation[] = [];
    
    for (const item of workItems) {
      const relations = await adapter.getRelations(item.id);
      allRelations.push(...relations);
    }
    
    // Remove duplicates
    const unique = new Map<string, Relation>();
    for (const relation of allRelations) {
      const key = `${relation.from}-${relation.to}-${relation.type}`;
      unique.set(key, relation);
    }
    
    return Array.from(unique.values());
  }

  /**
   * Authenticate with the backend
   */
  async authenticate(credentials?: Record<string, string>  ): Promise<AuthStatus> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.authenticate(credentials);
  }

  /**
   * Logout from the backend
   */
  async logout(): Promise<void> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.logout();
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus(): Promise<AuthStatus> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getAuthStatus();
  }

  /**
   * Get complete schema information
   */
  async getSchema(): Promise<Schema> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getSchema();
  }

  /**
   * Get available work item kinds
   */
  async getKinds(): Promise<readonly string[]> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getKinds();
  }

  /**
   * Get available attributes
   */
  async getAttributes(): Promise<readonly SchemaAttribute[]> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getAttributes();
  }

  /**
   * Get available relation types
   */
  async getRelationTypes(): Promise<readonly SchemaRelationType[]> {
    await this.ensureDefaultContext();
    const adapter = this.getActiveAdapter();
    return adapter.getRelationTypes();
  }
}
