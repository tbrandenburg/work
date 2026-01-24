import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Work Item Lifecycle E2E', () => {
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

  it('should complete create → close → reopen workflow', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Create work item (uses default context)
    const createOutput = execSync(`node ${binPath} create "Test Task"`, {
      encoding: 'utf8',
    });
    expect(createOutput).toContain('Created task');

    const workItemId = createOutput.match(/TASK-\d+/)?.[0];
    expect(workItemId).toBeDefined();

    // Verify initial state is 'new'
    const getOutput = execSync(`node ${binPath} get ${workItemId}`, {
      encoding: 'utf8',
    });
    expect(getOutput).toContain('State:       new');

    // Close work item
    const closeOutput = execSync(`node ${binPath} close ${workItemId}`, {
      encoding: 'utf8',
    });
    expect(closeOutput).toContain('Closed task');

    // Verify state is 'closed'
    const getClosedOutput = execSync(`node ${binPath} get ${workItemId}`, {
      encoding: 'utf8',
    });
    expect(getClosedOutput).toContain('State:       closed');

    // Reopen work item
    const reopenOutput = execSync(`node ${binPath} reopen ${workItemId}`, {
      encoding: 'utf8',
    });
    expect(reopenOutput).toContain('Reopened task');

    // Verify state is back to 'active' (reopened state)
    const getFinalOutput = execSync(`node ${binPath} get ${workItemId}`, {
      encoding: 'utf8',
    });
    expect(getFinalOutput).toContain('State:       active');
  });
});
