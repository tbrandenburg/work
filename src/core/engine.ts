/**
 * Main engine class with context resolution and command delegation
 */

import path from 'path';
import { promises as fs } from 'fs';
import {
  WorkAdapter,
  Context,
  WorkItem,
  CreateWorkItemRequest,
  UpdateWorkItemRequest,
  Relation,
  ContextNotFoundError,
  AuthStatus,
  Schema,
  SchemaAttribute,
  SchemaRelationType,
} from '../types/index.js';
import {
  NotificationTarget,
  NotificationResult,
} from '../types/notification.js';
import { LocalFsAdapter } from '../adapters/local-fs/index.js';
import { validateRelation, detectCycles } from './graph.js';
import { parseQuery, executeQuery } from './query.js';
import { NotificationService } from './notification-service.js';

export class WorkEngine {
  private adapters = new Map<string, WorkAdapter>();
  private contexts = new Map<string, Context>();
  private activeContext: string | null = null;
  private notificationService = new NotificationService();
  private contextsLoaded = false;

  constructor() {
    // Register built-in adapters
    this.registerAdapter('local-fs', new LocalFsAdapter());
    
    // Register built-in notification handlers
    this.registerNotificationHandler();
  }

  /**
   * Register notification handlers
   */
  private registerNotificationHandler(): void {
    // Import here to avoid circular dependencies
    import('./target-handlers/index.js').then(({ BashTargetHandler }) => {
      this.notificationService.registerHandler('bash', new BashTargetHandler());
    }).catch(() => {
      // Silently fail if handlers not available
    });
  }

  /**
   * Ensure default context exists for MVP
   */
  private async ensureDefaultContext(): Promise<void> {
    // Load contexts from disk if not already loaded
    if (!this.contextsLoaded) {
      await this.loadContexts();
      this.contextsLoaded = true;
    }

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
  async updateWorkItem(
    id: string,
    request: UpdateWorkItemRequest
  ): Promise<WorkItem> {
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
  async deleteRelation(
    from: string,
    to: string,
    type: Relation['type']
  ): Promise<void> {
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
    console.log(
      `Comment operation not yet implemented: ${workItemId} - ${text}`
    );
  }

  /**
   * Move a work item to another context (placeholder)
   */
  moveWorkItem(workItemId: string, targetContext: string): void {
    // Placeholder implementation for MVP
    console.log(
      `Move operation not yet implemented: ${workItemId} to ${targetContext}`
    );
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
  async authenticate(
    credentials?: Record<string, string>
  ): Promise<AuthStatus> {
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

  /**
   * Add a notification target to the active context
   */
  async addNotificationTarget(name: string, target: NotificationTarget): Promise<void> {
    await this.ensureDefaultContext();
    const context = this.getActiveContext();
    
    const existingTargets = context.notificationTargets || [];
    const updatedTargets = [...existingTargets.filter(t => t.name !== name), target];
    
    const updatedContext: Context = {
      ...context,
      notificationTargets: updatedTargets,
    };
    
    this.contexts.set(context.name, updatedContext);
    await this.saveContexts();
  }

  /**
   * Remove a notification target from the active context
   */
  async removeNotificationTarget(name: string): Promise<void> {
    await this.ensureDefaultContext();
    const context = this.getActiveContext();
    
    const existingTargets = context.notificationTargets || [];
    const targetExists = existingTargets.some(t => t.name === name);
    
    if (!targetExists) {
      throw new Error(`Notification target '${name}' not found`);
    }
    
    const updatedTargets = existingTargets.filter(t => t.name !== name);
    
    const updatedContext: Context = {
      ...context,
      notificationTargets: updatedTargets,
    };
    
    this.contexts.set(context.name, updatedContext);
    await this.saveContexts();
  }

  /**
   * List notification targets for the active context
   */
  async listNotificationTargets(): Promise<NotificationTarget[]> {
    await this.ensureDefaultContext();
    const context = this.getActiveContext();
    return Array.from(context.notificationTargets || []);
  }

  /**
   * Send notification to a target
   */
  async sendNotification(workItems: WorkItem[], targetName: string): Promise<NotificationResult> {
    await this.ensureDefaultContext();
    const context = this.getActiveContext();
    
    const targets = context.notificationTargets || [];
    const target = targets.find(t => t.name === targetName);
    
    if (!target) {
      return {
        success: false,
        error: `Notification target '${targetName}' not found`,
      };
    }
    
    return this.notificationService.sendNotification(workItems, target);
  }

  /**
   * Get contexts file path
   * 
   * Context Persistence: Notification targets and other context data are persisted
   * to .work/contexts.json to maintain state between CLI command invocations.
   * This enables notification targets to be configured once and used across
   * multiple CLI sessions.
   */
  private getContextsFilePath(): string {
    return path.join(process.cwd(), '.work', 'contexts.json');
  }

  /**
   * Save contexts to disk
   */
  private async saveContexts(): Promise<void> {
    try {
      const contextsPath = this.getContextsFilePath();
      await fs.mkdir(path.dirname(contextsPath), { recursive: true });
      
      const contextsData = {
        contexts: Array.from(this.contexts.entries()),
        activeContext: this.activeContext,
      };
      
      await fs.writeFile(contextsPath, JSON.stringify(contextsData, null, 2));
    } catch {
      // Silently fail - context persistence is not critical for functionality
    }
  }

  /**
   * Load contexts from disk
   */
  private async loadContexts(): Promise<void> {
    try {
      const contextsPath = this.getContextsFilePath();
      const content = await fs.readFile(contextsPath, 'utf-8');
      const contextsData = JSON.parse(content) as { contexts: [string, Context][]; activeContext: string | null };
      
      this.contexts = new Map(contextsData.contexts);
      this.activeContext = contextsData.activeContext;
    } catch {
      // File doesn't exist or is invalid - start fresh
    }
  }
}
