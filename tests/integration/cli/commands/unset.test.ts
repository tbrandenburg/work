import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Unset Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-unset-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should clear assignee field', () => {
    // Create a work item first
    execSync(`node ${binPath} create "Test task"`, { stdio: 'pipe' });

    // Clear assignee field - should trigger assignee conditional branch
    const result = execSync(`node ${binPath} unset TASK-001 assignee`, {
      encoding: 'utf8',
    });
    expect(result).toContain('Cleared assignee from task TASK-001');
  });

  it('should clear description field', () => {
    // Create a work item first
    execSync(`node ${binPath} create "Test task"`, { stdio: 'pipe' });

    // Clear description field - should trigger description conditional branch
    const result = execSync(`node ${binPath} unset TASK-001 description`, {
      encoding: 'utf8',
    });
    expect(result).toContain('Cleared description from task TASK-001');
  });
});
