/**
 * End-to-end test for GitHub authentication with Telegram notifications
 * 
 * This test demonstrates two authentication scenarios:
 * 1. gh CLI authentication with current repository (tbrandenburg/work)
 * 2. Token-based authentication with external repository (tbrandenburg/playground)
 */

import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('GitHub Auth + Telegram Notification E2E', () => {
  let testDir: string;
  let originalCwd: string;
  let createdIssueId: string | null = null;
  let binPath: string;

  beforeAll(async () => {
    originalCwd = process.cwd();
    binPath = join(originalCwd, 'bin/run.js');
  });

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'work-github-telegram-e2e-'));
    process.chdir(testDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    // Clean up created GitHub issue
    if (createdIssueId) {
      try {
        // The cleanup will be handled by each test scenario
        createdIssueId = null;
      } catch (error) {
        console.warn('Failed to clean up GitHub issue:', error);
      }
    }

    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete GitHub CLI auth workflow with current repository', async () => {
    // Skip if we don't have required environment variables
    const hasRequiredEnvVars = process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      console.log('Skipping test - missing Telegram credentials');
      return;
    }

    // Skip in CI if we don't have write permissions 
    // This test uses GitHub CLI auth which falls back to GITHUB_TOKEN in CI (read-only)
    if (process.env.CI === 'true') {
      console.log('Skipping test - CI environment uses read-only GITHUB_TOKEN for GitHub CLI auth');
      return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;

    // Step 1: Add GitHub context using current work repository
    execSync(
      `node ${binPath} context add work-repo --tool github --url https://github.com/tbrandenburg/work`,
      { stdio: 'pipe' }
    );

    // Step 2: Set the GitHub context as active
    execSync(`node ${binPath} context set work-repo`, { stdio: 'pipe' });

    // Step 3: Authenticate with GitHub CLI (this will use gh auth login if available)
    execSync(`node ${binPath} auth login`, { stdio: 'pipe' });

    // Step 4: Verify authentication works
    const authOutput = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
    const authData = JSON.parse(authOutput);
    expect(authData.data.state).toBe('authenticated');

    // Step 5: Create a test issue in the work repository
    const createOutput = execSync(
      `node ${binPath} create "E2E Test: GitHub CLI Auth" --format json`,
      { encoding: 'utf8' }
    );
    const createData = JSON.parse(createOutput);
    createdIssueId = createData.data.id;
    expect(createData.data.title).toBe('E2E Test: GitHub CLI Auth');

    // Step 6: Add Telegram notification target
    execSync(
      `node ${binPath} notify target add work-telegram-test --type telegram --bot-token ${botToken} --chat-id ${chatId}`,
      { stdio: 'pipe' }
    );

    // Step 7: Send notification about the created issue
    const notifyOutput = execSync(
      `node ${binPath} notify send where "title=E2E Test: GitHub CLI Auth" to work-telegram-test`,
      { encoding: 'utf8' }
    );
    expect(notifyOutput).toContain('Notification sent successfully');

    // Step 8: Clean up - close the issue
    execSync(`node ${binPath} close ${createdIssueId}`, { stdio: 'pipe' });

    // Step 9: Remove the notification target
    execSync(`node ${binPath} notify target remove work-telegram-test`, { stdio: 'pipe' });

    // Mark as cleaned up
    createdIssueId = null;
  });

  it('should complete token-based auth workflow with work repository', async () => {
    // Skip if we don't have required environment variables
    const hasRequiredEnvVars = process.env.CI_GITHUB_TOKEN && 
                              process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      console.log('Skipping test - missing CI_GITHUB_TOKEN or Telegram credentials');
      return;
    }

    // Skip if GitHub CLI is authenticated (it uses read-only GITHUB_TOKEN in CI)
    try {
      execSync('gh auth status', { stdio: 'pipe' });
      console.log('Skipping test - GitHub CLI is authenticated with read-only token in CI');
      return;
    } catch {
      // GitHub CLI not authenticated, test can proceed
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;

    // Step 1: Add GitHub context using work repository (consistent access)
    execSync(
      `node ${binPath} context add work-repo --tool github --url https://github.com/tbrandenburg/work`,
      { stdio: 'pipe' }
    );

    // Step 2: Set the GitHub context as active
    execSync(`node ${binPath} context set work-repo`, { stdio: 'pipe' });

    // Step 3: Authenticate with token (this will use CI_GITHUB_TOKEN from environment)
    execSync(`node ${binPath} auth login`, { 
      stdio: 'pipe',
      env: { ...process.env, CI_GITHUB_TOKEN: process.env.CI_GITHUB_TOKEN }
    });

    // Step 4: Verify authentication works
    const authOutput = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
    const authData = JSON.parse(authOutput);
    expect(authData.data.state).toBe('authenticated');

    // Step 5: Create a test issue in the work repository
    const createOutput = execSync(
      `node ${binPath} create "E2E Test: Token Auth" --labels test --format json`,
      { encoding: 'utf8' }
    );
    const createData = JSON.parse(createOutput);
    createdIssueId = createData.data.id;
    expect(createData.data.title).toBe('E2E Test: Token Auth');

    // Step 6: Add Telegram notification target
    execSync(
      `node ${binPath} notify target add playground-telegram-test --type telegram --bot-token ${botToken} --chat-id ${chatId}`,
      { stdio: 'pipe' }
    );

    // Step 7: Send notification about issues with test label
    const notifyOutput = execSync(
      `node ${binPath} notify send where "labels=test" to playground-telegram-test`,
      { encoding: 'utf8' }
    );
    expect(notifyOutput).toContain('Notification sent successfully');

    // Step 8: Clean up - close the issue
    execSync(`node ${binPath} close ${createdIssueId}`, { stdio: 'pipe' });

    // Step 9: Remove the notification target
    execSync(`node ${binPath} notify target remove playground-telegram-test`, { stdio: 'pipe' });

    // Mark as cleaned up
    createdIssueId = null;
  });
});
