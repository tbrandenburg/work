import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Relation Lifecycle E2E', () => {
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

  it('should complete link → unlink workflow', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Create two work items (uses default context)
    const createOutput1 = execSync(`node ${binPath} create "Parent Task"`, {
      encoding: 'utf8',
    });
    const parentId = createOutput1.match(/TASK-\d+/)?.[0];
    expect(parentId).toBeDefined();

    const createOutput2 = execSync(`node ${binPath} create "Child Task"`, {
      encoding: 'utf8',
    });
    const childId = createOutput2.match(/TASK-\d+/)?.[0];
    expect(childId).toBeDefined();

    // Link work items (parent_of relation)
    const linkOutput = execSync(
      `node ${binPath} link ${parentId} ${childId} --type parent_of`,
      { encoding: 'utf8' }
    );
    expect(linkOutput).toContain('Created relation');

    // Verify relation was created (check that link command succeeded)
    expect(linkOutput).toContain(`${parentId} parent_of ${childId}`);

    // Unlink work items
    const unlinkOutput = execSync(
      `node ${binPath} unlink ${parentId} ${childId} --type parent_of`,
      { encoding: 'utf8' }
    );
    expect(unlinkOutput).toContain('Removed relation');

    // Verify relation was removed (check that unlink command succeeded)
    expect(unlinkOutput).toContain(`${parentId} parent_of ${childId}`);
  });
});
