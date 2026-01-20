/**
 * Core WorkItem type definitions following the work CLI specification
 */

export type WorkItemState = 'new' | 'active' | 'closed';

export type WorkItemKind = 'task' | 'bug' | 'epic' | 'story';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type RelationType = 'parent_of' | 'child_of' | 'blocks' | 'blocked_by' | 'duplicates' | 'duplicate_of' | 'relates_to';

export interface WorkItem {
  readonly id: string;
  readonly kind: WorkItemKind;
  readonly title: string;
  readonly description?: string | undefined;
  readonly state: WorkItemState;
  readonly priority: Priority;
  readonly assignee?: string | undefined;
  readonly labels: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt?: string | undefined;
}

export interface Relation {
  readonly from: string;
  readonly to: string;
  readonly type: RelationType;
}

export interface CreateWorkItemRequest {
  readonly title: string;
  readonly kind: WorkItemKind;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly labels?: readonly string[] | undefined;
}

export interface UpdateWorkItemRequest {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly priority?: Priority | undefined;
  readonly assignee?: string | undefined;
  readonly labels?: readonly string[] | undefined;
}
