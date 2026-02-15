/**
 * Local filesystem adapter implementation
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
  WorkItemNotFoundError,
  AuthStatus,
  Schema,
  SchemaAttribute,
  SchemaRelationType,
} from '../../types/index.js';
import { generateId } from './id-generator.js';
import {
  saveWorkItem,
  loadWorkItem,
  listWorkItems,
  saveLinks,
  loadLinks,
} from './storage.js';

export class LocalFsAdapter implements WorkAdapter {
  private workDir: string = '';

  initialize(context: Context): Promise<void> {
    if (!context.path) {
      throw new Error('Local filesystem adapter requires a path');
    }

    this.workDir = path.resolve(
      context.path,
      '.work',
      'projects',
      context.name
    );
    return Promise.resolve();
  }

  async createWorkItem(request: CreateWorkItemRequest): Promise<WorkItem> {
    const id = await generateId(request.kind, this.workDir);
    const now = new Date().toISOString();

    const workItem: WorkItem = {
      id,
      kind: request.kind,
      title: request.title,
      description: request.description,
      state: 'new',
      priority: request.priority || 'medium',
      assignee: request.assignee,
      agent: request.agent,
      labels: request.labels || [],
      createdAt: now,
      updatedAt: now,
    };

    await saveWorkItem(workItem, this.workDir);
    return workItem;
  }

  async getWorkItem(id: string): Promise<WorkItem> {
    const workItem = await loadWorkItem(id, this.workDir);
    if (!workItem) {
      throw new WorkItemNotFoundError(id);
    }
    return workItem;
  }

  async updateWorkItem(
    id: string,
    request: UpdateWorkItemRequest
  ): Promise<WorkItem> {
    const existing = await this.getWorkItem(id);
    const now = new Date().toISOString();

    const updated: WorkItem = {
      ...existing,
      title: request.title ?? existing.title,
      description: request.description ?? existing.description,
      priority: request.priority ?? existing.priority,
      assignee: request.assignee ?? existing.assignee,
      agent: request.agent ?? existing.agent,
      labels: request.labels ?? existing.labels,
      updatedAt: now,
    };

    await saveWorkItem(updated, this.workDir);
    return updated;
  }

  async changeState(id: string, state: WorkItem['state']): Promise<WorkItem> {
    const existing = await this.getWorkItem(id);
    const now = new Date().toISOString();

    const updated: WorkItem = {
      ...existing,
      state,
      updatedAt: now,
      closedAt: state === 'closed' ? now : existing.closedAt,
    };

    await saveWorkItem(updated, this.workDir);
    return updated;
  }

  async listWorkItems(query?: string): Promise<WorkItem[]> {
    const allItems = await listWorkItems(this.workDir);

    if (!query) {
      return allItems;
    }

    // Simple query filtering - can be enhanced later
    return allItems.filter(item => {
      const searchText =
        `${item.title} ${item.description || ''} ${item.state} ${item.kind}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }

  async createRelation(relation: Relation): Promise<void> {
    const relations = await loadLinks(this.workDir);

    // Check if relation already exists
    const exists = relations.some(
      r =>
        r.from === relation.from &&
        r.to === relation.to &&
        r.type === relation.type
    );

    if (!exists) {
      relations.push(relation);
      await saveLinks(relations, this.workDir);
    }
  }

  async getRelations(workItemId: string): Promise<Relation[]> {
    const relations = await loadLinks(this.workDir);
    return relations.filter(r => r.from === workItemId || r.to === workItemId);
  }

  async deleteRelation(
    from: string,
    to: string,
    type: Relation['type']
  ): Promise<void> {
    const relations = await loadLinks(this.workDir);
    const filtered = relations.filter(
      r => !(r.from === from && r.to === to && r.type === type)
    );

    await saveLinks(filtered, this.workDir);
  }

  async deleteWorkItem(id: string): Promise<void> {
    // First check if work item exists
    await this.getWorkItem(id); // This will throw WorkItemNotFoundError if not found

    const filePath = path.join(this.workDir, 'work-items', `${id}.md`);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new WorkItemNotFoundError(id);
      }
      throw error;
    }
  }

  async authenticate(
    _credentials?: Record<string, string>
  ): Promise<AuthStatus> {
    // Local filesystem adapter - trivial implementation
    return Promise.resolve({
      state: 'authenticated' as const,
      user: 'local-user',
    });
  }

  async logout(): Promise<void> {
    // Local filesystem adapter - trivial implementation
    return Promise.resolve();
  }

  async getAuthStatus(): Promise<AuthStatus> {
    // Local filesystem adapter - always authenticated
    return Promise.resolve({
      state: 'authenticated' as const,
      user: 'local-user',
    });
  }

  async getSchema(): Promise<Schema> {
    // Local filesystem adapter - hardcoded schema
    return Promise.resolve({
      kinds: ['task', 'bug', 'feature', 'epic'] as const,
      attributes: [
        {
          name: 'title',
          type: 'string',
          required: true,
          description: 'Work item title',
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Work item description',
        },
        {
          name: 'priority',
          type: 'enum',
          required: false,
          description: 'Priority level (low, medium, high, critical)',
        },
        {
          name: 'assignee',
          type: 'string',
          required: false,
          description: 'Assigned user',
        },
        {
          name: 'labels',
          type: 'array',
          required: false,
          description: 'Labels for categorization',
        },
      ] as const,
      relationTypes: [
        {
          name: 'blocks',
          description: 'This item blocks another',
          allowedFromKinds: ['task', 'bug', 'feature'],
          allowedToKinds: ['task', 'bug', 'feature'],
        },
        {
          name: 'parent_of',
          description: 'This item is parent of another',
          allowedFromKinds: ['epic', 'feature'],
          allowedToKinds: ['task', 'bug'],
        },
        {
          name: 'duplicates',
          description: 'This item duplicates another',
          allowedFromKinds: ['task', 'bug'],
          allowedToKinds: ['task', 'bug'],
        },
        {
          name: 'relates_to',
          description: 'This item relates to another',
          allowedFromKinds: ['task', 'bug', 'feature', 'epic'],
          allowedToKinds: ['task', 'bug', 'feature', 'epic'],
        },
      ] as const,
    });
  }

  async getKinds(): Promise<readonly string[]> {
    const schema = await this.getSchema();
    return schema.kinds;
  }

  async getAttributes(): Promise<readonly SchemaAttribute[]> {
    const schema = await this.getSchema();
    return schema.attributes;
  }

  async getRelationTypes(): Promise<readonly SchemaRelationType[]> {
    const schema = await this.getSchema();
    return schema.relationTypes;
  }

  /**
   * Resolve @notation or team-based assignment to adapter-specific username
   * Local filesystem: simple passthrough - accepts any assignee string as-is
   */
  resolveAssignee(notation: string): Promise<string> {
    // Local-fs has no user management - all assignees valid, no transformation
    return Promise.resolve(notation);
  }

  /**
   * Validate if a username/assignee is valid for this adapter
   * Local filesystem: all assignees are valid (no user management system)
   */
  validateAssignee(_assignee: string): Promise<boolean> {
    // Local-fs accepts any assignee string
    return Promise.resolve(true);
  }

  /**
   * Get information about supported assignee patterns for this adapter
   * Local filesystem: accepts any string, passes through @notation unchanged
   */
  getAssigneeHelp(): Promise<string> {
    return Promise.resolve(
      'Local filesystem adapter accepts any assignee string. @notation is passed through unchanged.'
    );
  }
}
