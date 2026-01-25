import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { promises as fs } from 'fs';
import os from 'os';

describe('Notify Workflow E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-notify-e2e-'));
    process.chdir(testDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete notification target management workflow', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Add notification target
    execSync(
      `node ${binPath} notify target add test-log --type bash --script work:log`,
      { stdio: 'pipe' }
    );

    // List targets to verify addition
    const listOutput = execSync(
      `node ${binPath} notify target list --format json`,
      { encoding: 'utf8' }
    );
    const listData = JSON.parse(listOutput);
    expect(listData.data).toHaveLength(1);
    expect(listData.data[0].name).toBe('test-log');
    expect(listData.data[0].type).toBe('bash');

    // Remove target
    execSync(`node ${binPath} notify target remove test-log`, {
      stdio: 'pipe',
    });

    // Verify removal
    const emptyListOutput = execSync(
      `node ${binPath} notify target list --format json`,
      { encoding: 'utf8' }
    );
    const emptyListData = JSON.parse(emptyListOutput);
    expect(emptyListData.data).toHaveLength(0);
  });

  it('should complete notification send workflow', async () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Add notification target
    execSync(
      `node ${binPath} notify target add alerts --type bash --script work:log`,
      { stdio: 'pipe' }
    );

    // Test notification send with empty query (no work items needed)
    const sendOutput = execSync(
      `node ${binPath} notify send where priority=high to alerts`,
      { encoding: 'utf8' }
    );

    expect(sendOutput).toContain('Notification sent successfully');
    expect(sendOutput).toContain('0 items'); // No work items, but notification works

    // Verify notification log file was created
    const notificationsDir = join(os.homedir(), '.work', 'notifications');
    const files = await fs.readdir(notificationsDir);
    const logFiles = files.filter(
      f => f.startsWith('notification-') && f.endsWith('.json')
    );

    expect(logFiles.length).toBeGreaterThan(0);

    // Verify log file content
    const logFile = join(notificationsDir, logFiles[0]);
    const logContent = await fs.readFile(logFile, 'utf8');
    const logData = JSON.parse(logContent);

    expect(logData.itemCount).toBe(0);
    expect(logData.items).toHaveLength(0);
  });

  it('should handle human-in-the-loop workflow', async () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Add notification target
    execSync(
      `node ${binPath} notify target add human-alerts --type bash --script work:log`,
      { stdio: 'pipe' }
    );

    // Test notification send for human-assigned items (empty query)
    const sendOutput = execSync(
      `node ${binPath} notify send where assignee=human-alice to human-alerts`,
      { encoding: 'utf8' }
    );

    expect(sendOutput).toContain('Notification sent successfully');
    expect(sendOutput).toContain('0 items'); // No work items, but notification works

    // Verify notification contains proper structure
    const notificationsDir = join(os.homedir(), '.work', 'notifications');
    const files = await fs.readdir(notificationsDir);
    const logFiles = files.filter(
      f => f.startsWith('notification-') && f.endsWith('.json')
    );

    expect(logFiles.length).toBeGreaterThan(0);

    const logFile = join(notificationsDir, logFiles[0]);
    const logContent = await fs.readFile(logFile, 'utf8');
    const logData = JSON.parse(logContent);

    expect(logData.itemCount).toBe(0);
    expect(logData.items).toHaveLength(0);
    expect(logData.timestamp).toBeDefined();
  });

  it('should handle notification errors gracefully', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Try to send to non-existent target
    expect(() => {
      execSync(
        `node ${binPath} notify send where state=new to non-existent-target`,
        { stdio: 'pipe' }
      );
    }).toThrow();

    // Try to remove non-existent target
    expect(() => {
      execSync(`node ${binPath} notify target remove non-existent-target`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });
});
