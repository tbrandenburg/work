import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Edit Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-edit-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should error when no fields specified', () => {
    // Create a work item first
    execSync(`node ${binPath} create "Test task"`, { stdio: 'pipe' });

    // Try to edit without any fields - should trigger conditional branch
    expect(() => {
      execSync(`node ${binPath} edit TASK-001`, { stdio: 'pipe' });
    }).toThrow();
  });

  it('should update work item when fields provided', () => {
    // Create a work item first
    execSync(`node ${binPath} create "Test task"`, { stdio: 'pipe' });

    // Edit with fields - should trigger success branch
    const result = execSync(
      `node ${binPath} edit TASK-001 --title "Updated title"`,
      { encoding: 'utf8' }
    );
    expect(result).toContain('Edited task TASK-001');
  });
});
