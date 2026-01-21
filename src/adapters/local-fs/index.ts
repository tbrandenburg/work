/**
 * Local filesystem adapter implementation
 */

import path from 'path';
import { promises as fs } from 'fs';
import { WorkAdapter, Context, WorkItem, CreateWorkItemRequest, UpdateWorkItemRequest, Relation, WorkItemNotFoundError } from '../../types/index.js';
import { generateId } from './id-generator.js';
import { saveWorkItem, loadWorkItem, listWorkItems, saveLinks, loadLinks } from './storage.js';

export class LocalFsAdapter implements WorkAdapter {
  private workDir: string = '';

  initialize(context: Context): Promise<void> {
    if (!context.path) {
      throw new Error('Local filesystem adapter requires a path');
    }
    
    this.workDir = path.resolve(context.path, '.work', 'projects', context.name);
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

  async updateWorkItem(id: string, request: UpdateWorkItemRequest): Promise<WorkItem> {
    const existing = await this.getWorkItem(id);
    const now = new Date().toISOString();
    
    const updated: WorkItem = {
      ...existing,
      title: request.title ?? existing.title,
      description: request.description ?? existing.description,
      priority: request.priority ?? existing.priority,
      assignee: request.assignee ?? existing.assignee,
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
      const searchText = `${item.title} ${item.description || ''} ${item.state} ${item.kind}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });
  }

  async createRelation(relation: Relation): Promise<void> {
    const relations = await loadLinks(this.workDir);
    
    // Check if relation already exists
    const exists = relations.some(r => 
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

  async deleteRelation(from: string, to: string, type: Relation['type']): Promise<void> {
    const relations = await loadLinks(this.workDir);
    const filtered = relations.filter(r => 
      !(r.from === from && r.to === to && r.type === type)
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
}
