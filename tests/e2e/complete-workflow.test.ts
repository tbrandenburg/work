import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Complete Workflow E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-'));
    process.chdir(testDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete full work item management journey', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Create work items (uses default context)
    const createOutput1 = execSync(
      `node ${binPath} create "Epic: User Authentication"`,
      { encoding: 'utf8' }
    );
    const epicId = createOutput1.match(/TASK-\d+/)?.[0];

    const createOutput2 = execSync(
      `node ${binPath} create "Implement login form"`,
      { encoding: 'utf8' }
    );
    const taskId = createOutput2.match(/TASK-\d+/)?.[0];

    // Edit work items with details
    execSync(
      `node ${binPath} edit ${epicId} --description "Complete user authentication system"`,
      { stdio: 'pipe' }
    );
    execSync(
      `node ${binPath} edit ${taskId} --assignee "developer@example.com"`,
      { stdio: 'pipe' }
    );

    // Create relationships
    execSync(`node ${binPath} link ${epicId} ${taskId} --type parent_of`, {
      stdio: 'pipe',
    });

    // Work on task
    execSync(`node ${binPath} start ${taskId}`, { stdio: 'pipe' });

    // Add comments (placeholder command)
    execSync(`node ${binPath} comment ${taskId} "Started implementation"`, {
      stdio: 'pipe',
    });

    // Complete task
    execSync(`node ${binPath} close ${taskId}`, { stdio: 'pipe' });

    // List all work items
    const listOutput = execSync(`node ${binPath} list`, { encoding: 'utf8' });
    expect(listOutput).toContain(epicId);
    expect(listOutput).toContain(taskId);

    // Verify final state
    const getTaskOutput = execSync(`node ${binPath} get ${taskId}`, {
      encoding: 'utf8',
    });
    expect(getTaskOutput).toContain('State:       closed');
    expect(getTaskOutput).toContain('developer@example.com');
  });
});
