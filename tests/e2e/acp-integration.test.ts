import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * E2E test for ACP (Agent Client Protocol) integration
 *
 * PREREQUISITE: An ACP-compliant client must be installed and authenticated
 * This test uses OpenCode as the example client: opencode auth login
 *
 * The ACP handler is generic and should work with any ACP-compliant client
 * (OpenCode, Cursor, Cody, etc.) but we test with OpenCode.
 */
describe('ACP Integration E2E (OpenCode)', () => {
  let tempDir: string;
  let originalCwd: string;
  const binPath = join(process.cwd(), 'bin/run.js');

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(join(tmpdir(), 'work-acp-e2e-'));
    process.chdir(tempDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default');
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('should add ACP notification target', () => {
    const output = execSync(
      `node ${binPath} notify target add ai-reviewer --type acp --cmd "opencode acp" --cwd "${tempDir}" --format json`,
      { encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.data).toBeDefined();
    expect(result.data).toContain('ai-reviewer');

    // Verify target was saved to config
    const contextData = JSON.parse(
      readFileSync(join(tempDir, '.work/contexts.json'), 'utf-8')
    );

    // contexts is serialized as Map: [[name, context], ...]
    const contextEntry = contextData.contexts.find(
      (entry: any) => entry[0] === 'default'
    );
    expect(contextEntry).toBeDefined();

    const context = contextEntry[1];
    const target = context?.notificationTargets?.find(
      (t: any) => t.name === 'ai-reviewer'
    );

    expect(target).toBeDefined();
    expect(target.config.type).toBe('acp');
    expect(target.config.cmd).toBe('opencode acp');
  });

  it.skip('should send notification to ACP target (requires ACP client)', () => {
    // Skip by default - requires opencode authentication
    // To run: opencode auth login, then remove .skip

    // Check if opencode is authenticated
    try {
      execSync('opencode auth status', { stdio: 'ignore' });
    } catch {
      console.log(
        'Skipping E2E test: opencode not authenticated (required for ACP testing)'
      );
      return;
    }

    // Add target (using OpenCode as example ACP client)
    execSync(
      `node ${binPath} notify target add ai --type acp --cmd "opencode acp" --cwd "${tempDir}"`
    );

    // Create a work item
    writeFileSync(
      join(tempDir, '.work/projects/default/TASK-123.json'),
      JSON.stringify(
        {
          id: 'TASK-123',
          kind: 'task',
          title: 'Fix authentication bug',
          state: 'in-progress',
          description: 'OAuth login fails for new users',
          priority: 'high',
          labels: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      )
    );

    // Send notification (this will actually call the ACP client - OpenCode in this test)
    const output = execSync(
      `node ${binPath} notify send "Analyze this task" to ai --format json`,
      { encoding: 'utf-8', timeout: 60000 } // 60s timeout
    );

    const result = JSON.parse(output);
    expect(result.success).toBe(true);
    expect(result.message).toContain('AI response');

    // Verify session was persisted
    const contextData = JSON.parse(
      readFileSync(join(tempDir, '.work/contexts.json'), 'utf-8')
    );

    const target = contextData.contexts[0].notificationTargets.find(
      (t: any) => t.name === 'ai'
    );

    expect(target.config.sessionId).toBeDefined();
    expect(target.config.sessionId).toMatch(/^session-/);
  });

  it('should list ACP targets', () => {
    execSync(`node ${binPath} notify target add ai --type acp --cmd "opencode acp"`);

    const output = execSync(`node ${binPath} notify target list --format json`, {
      encoding: 'utf-8',
    });

    const result = JSON.parse(output);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.data.some((t: any) => t.name === 'ai')).toBe(true);
  });

  it('should remove ACP target', () => {
    execSync(`node ${binPath} notify target add temp --type acp --cmd "opencode acp"`);

    const output = execSync(
      `node ${binPath} notify target remove temp --format json`,
      { encoding: 'utf-8' }
    );

    const result = JSON.parse(output);
    expect(result.data).toBeDefined();

    // Verify removed from config
    const contextData = JSON.parse(
      readFileSync(join(tempDir, '.work/contexts.json'), 'utf-8')
    );

    // contexts is serialized as Map: [[name, context], ...]
    const contextEntry = contextData.contexts.find(
      (entry: any) => entry[0] === 'default'
    );
    const context = contextEntry ? contextEntry[1] : null;
    const target = context?.notificationTargets?.find(
      (t: any) => t.name === 'temp'
    );

    expect(target).toBeUndefined();
  });
});
