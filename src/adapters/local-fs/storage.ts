/**
 * File system operations for local-fs adapter
 */

import { promises as fs } from 'fs';
import path from 'path';
import { WorkItem, Relation } from '../../types/index.js';

const WORK_ITEMS_DIR = 'work-items';
const LINKS_FILE = 'links.json';

export async function ensureWorkDir(workDir: string): Promise<void> {
  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.mkdir(path.join(workDir, WORK_ITEMS_DIR), { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore EEXIST errors
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function saveWorkItem(
  workItem: WorkItem,
  workDir: string
): Promise<void> {
  await ensureWorkDir(workDir);

  const fileName = `${workItem.id}.md`;
  const filePath = path.join(workDir, WORK_ITEMS_DIR, fileName);

  // Create markdown content with frontmatter
  const frontmatter = {
    id: workItem.id,
    kind: workItem.kind,
    title: workItem.title,
    state: workItem.state,
    priority: workItem.priority,
    assignee: workItem.assignee,
    labels: workItem.labels,
    createdAt: workItem.createdAt,
    updatedAt: workItem.updatedAt,
    closedAt: workItem.closedAt,
  };

  const content = [
    '---',
    JSON.stringify(frontmatter, null, 2),
    '---',
    '',
    workItem.description || '',
  ].join('\n');

  await fs.writeFile(filePath, content, 'utf-8');
}

export async function loadWorkItem(
  id: string,
  workDir: string
): Promise<WorkItem | null> {
  const fileName = `${id}.md`;
  const filePath = path.join(workDir, WORK_ITEMS_DIR, fileName);

  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n(.*?)\n---\n(.*)/s);
    if (!frontmatterMatch || frontmatterMatch.length < 3) {
      throw new Error(`Invalid work item format: ${id}`);
    }

    const frontmatter = JSON.parse(frontmatterMatch[1]!) as Record<
      string,
      unknown
    >;
    const description = frontmatterMatch[2]?.trim() || undefined;

    return {
      ...frontmatter,
      description,
    } as WorkItem;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function listWorkItems(workDir: string): Promise<WorkItem[]> {
  const workItemsDir = path.join(workDir, WORK_ITEMS_DIR);

  try {
    const files = await fs.readdir(workItemsDir);
    const workItems: WorkItem[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const id = file.slice(0, -3); // Remove .md extension
        const workItem = await loadWorkItem(id, workDir);
        if (workItem !== null) {
          workItems.push(workItem);
        }
      }
    }

    return workItems;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function saveLinks(
  relations: Relation[],
  workDir: string
): Promise<void> {
  await ensureWorkDir(workDir);

  const linksPath = path.join(workDir, LINKS_FILE);
  await fs.writeFile(linksPath, JSON.stringify(relations, null, 2), 'utf-8');
}

export async function loadLinks(workDir: string): Promise<Relation[]> {
  const linksPath = path.join(workDir, LINKS_FILE);

  try {
    const content = await fs.readFile(linksPath, 'utf-8');
    return JSON.parse(content) as Relation[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
