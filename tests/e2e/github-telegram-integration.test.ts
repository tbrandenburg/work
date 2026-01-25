/**
 * End-to-end test for GitHub authentication with Telegram notifications
 * 
 * This test demonstrates the complete workflow:
 * 1. Uses gh CLI authentication (if available) or falls back to GITHUB_TOKEN
 * 2. Creates a GitHub issue in the work repository
 * 3. Sets up Telegram notification target
 * 4. Sends notification about the created issue
 * 5. Cleans up by removing the issue and notification target
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
    
    // Check if we have GitHub authentication available
    const hasGitHubToken = process.env.GITHUB_TOKEN;
    const isCI = process.env.CI === 'true';
    
    if (!hasGitHubToken) {
      if (isCI) {
        throw new Error('GITHUB_TOKEN environment variable is required in CI');
      }
      console.log('Skipping GitHub + Telegram E2E test - missing GITHUB_TOKEN');
      return;
    }

    // Check if we have Telegram credentials
    const hasTelegramCreds = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID;
    if (!hasTelegramCreds) {
      if (isCI) {
        throw new Error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required in CI');
      }
      console.log('Skipping GitHub + Telegram E2E test - missing Telegram credentials');
      return;
    }

    // Check if we can access the test repository
    try {
      const response = await fetch('https://api.github.com/repos/tbrandenburg/playground/issues', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'work-cli-test'
        }
      });
      
      if (!response.ok) {
        console.log(`Skipping GitHub + Telegram E2E test - cannot access test repository (${response.status})`);
        return;
      }
    } catch (error) {
      console.log('Skipping GitHub + Telegram E2E test - repository access check failed:', error);
      return;
    }
  });

  beforeEach(() => {
    const hasRequiredEnvVars = process.env.GITHUB_TOKEN && 
                              process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      return; // Skip setup if we don't have required env vars
    }

    testDir = mkdtempSync(join(tmpdir(), 'work-github-telegram-e2e-'));
    process.chdir(testDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    const hasRequiredEnvVars = process.env.GITHUB_TOKEN && 
                              process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      return; // Skip cleanup if we didn't run the test
    }

    // Clean up created GitHub issue
    if (createdIssueId) {
      try {
        // Switch to GitHub context and close the issue
        execSync(`node ${binPath} context add github-test --tool github --url https://github.com/tbrandenburg/playground`, { stdio: 'pipe' });
        execSync(`node ${binPath} context set github-test`, { stdio: 'pipe' });
        execSync(`node ${binPath} close ${createdIssueId}`, { stdio: 'pipe' });
        createdIssueId = null;
      } catch (error) {
        console.warn('Failed to clean up GitHub issue:', error);
      }
    }

    // Clean up notification targets
    try {
      execSync(`node ${binPath} notify target remove github-telegram-test`, { stdio: 'pipe' });
    } catch (error) {
      // Target might not exist, ignore
    }

    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete full GitHub auth + Telegram notification workflow', async () => {
    const hasRequiredEnvVars = process.env.GITHUB_TOKEN && 
                              process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      console.log('Skipping test - missing required environment variables');
      return;
    }

    // Check repository access
    try {
      const response = await fetch('https://api.github.com/repos/tbrandenburg/playground/issues', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'work-cli-test'
        }
      });
      
      if (!response.ok) {
        console.log(`Skipping test - cannot access repository (${response.status})`);
        return;
      }
    } catch (error) {
      console.log('Skipping test - repository access failed:', error);
      return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const chatId = process.env.TELEGRAM_CHAT_ID!;

    // Step 1: Add GitHub context (this will use the enhanced auth hierarchy)
    // The auth.ts will try gh CLI first, then fall back to GITHUB_TOKEN env var
    execSync(
      `node ${binPath} context add github-test --tool github --url https://github.com/tbrandenburg/playground`,
      { stdio: 'pipe' }
    );

    // Step 2: Set the GitHub context as active
    execSync(`node ${binPath} context set github-test`, { stdio: 'pipe' });

    // Step 3: Authenticate with GitHub (this will use the enhanced auth hierarchy)
    execSync(`node ${binPath} auth login`, { stdio: 'pipe' });

    // Step 4: Verify authentication works
    const authOutput = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
    const authData = JSON.parse(authOutput);
    expect(authData.data.state).toBe('authenticated');

    // Step 4: Create a GitHub issue
    const createOutput = execSync(
      `node ${binPath} create "E2E Test: GitHub Auth + Telegram Integration" --description "This issue was created by the end-to-end test to verify GitHub authentication hierarchy and Telegram notification integration." --labels test,e2e,integration --format json`,
      { encoding: 'utf8' }
    );
    const createData = JSON.parse(createOutput);
    expect(createData.data.title).toBe('E2E Test: GitHub Auth + Telegram Integration');
    expect(createData.data.state).toBe('new');
    expect(createData.data.labels).toContain('test');
    
    createdIssueId = createData.data.id;

    // Step 5: Add Telegram notification target
    execSync(
      `node ${binPath} notify target add github-telegram-test --type telegram --bot-token ${botToken} --chat-id ${chatId}`,
      { stdio: 'pipe' }
    );

    // Step 6: Verify the notification target was added
    const targetsOutput = execSync(`node ${binPath} notify target list --format json`, { encoding: 'utf8' });
    const targetsData = JSON.parse(targetsOutput);
    expect(targetsData.data).toHaveLength(1);
    expect(targetsData.data[0].name).toBe('github-telegram-test');
    expect(targetsData.data[0].type).toBe('telegram');

    // Step 7: Send notification about the created issue
    const notifyOutput = execSync(
      `node ${binPath} notify send where "labels=test" to github-telegram-test`,
      { encoding: 'utf8' }
    );
    expect(notifyOutput).toContain('Notification sent successfully');

    // Step 8: Verify the issue exists and can be retrieved
    const getOutput = execSync(`node ${binPath} get ${createdIssueId} --format json`, { encoding: 'utf8' });
    const getData = JSON.parse(getOutput);
    expect(getData.data.id).toBe(createdIssueId);
    expect(getData.data.title).toBe('E2E Test: GitHub Auth + Telegram Integration');

    // Step 9: Close the issue (cleanup)
    const closeOutput = execSync(`node ${binPath} close ${createdIssueId} --format json`, { encoding: 'utf8' });
    const closeData = JSON.parse(closeOutput);
    expect(closeData.data.state).toBe('closed');

    // Step 10: Remove the notification target (cleanup)
    execSync(`node ${binPath} notify target remove github-telegram-test`, { stdio: 'pipe' });

    // Step 11: Verify cleanup
    const emptyTargetsOutput = execSync(`node ${binPath} notify target list --format json`, { encoding: 'utf8' });
    const emptyTargetsData = JSON.parse(emptyTargetsOutput);
    expect(emptyTargetsData.data).toHaveLength(0);

    // Mark as cleaned up
    createdIssueId = null;
  });

  it('should demonstrate GitHub CLI authentication priority', async () => {
    const hasRequiredEnvVars = process.env.GITHUB_TOKEN && 
                              process.env.TELEGRAM_BOT_TOKEN && 
                              process.env.TELEGRAM_CHAT_ID;
    if (!hasRequiredEnvVars) {
      console.log('Skipping test - missing required environment variables');
      return;
    }

    // Check repository access
    try {
      const response = await fetch('https://api.github.com/repos/tbrandenburg/playground/issues', {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'work-cli-test'
        }
      });
      
      if (!response.ok) {
        console.log(`Skipping test - cannot access repository (${response.status})`);
        return;
      }
    } catch (error) {
      console.log('Skipping test - repository access failed:', error);
      return;
    }

    // This test verifies that the authentication hierarchy works
    // In CI, gh CLI might not be available, so it should fall back to GITHUB_TOKEN
    // In local development, if gh CLI is available and authenticated, it should use that

    // Add GitHub context
    execSync(
      `node ${binPath} context add github-auth-test --tool github --url https://github.com/tbrandenburg/playground`,
      { stdio: 'pipe' }
    );

    execSync(`node ${binPath} context set github-auth-test`, { stdio: 'pipe' });

    // Authenticate with GitHub
    execSync(`node ${binPath} auth login`, { stdio: 'pipe' });

    // Test authentication - this will use the three-tier hierarchy:
    // 1. Try gh CLI (execFileSync('gh', ['auth', 'token']))
    // 2. Fall back to manual credentials (none provided)
    // 3. Fall back to environment variables (GITHUB_TOKEN)
    const authOutput = execSync(`node ${binPath} auth status --format json`, { encoding: 'utf8' });
    const authData = JSON.parse(authOutput);
    
    expect(authData.data.state).toBe('authenticated');
    expect(authData.data.user).toBeDefined();

    // Create a simple issue to verify the authentication actually works
    const createOutput = execSync(
      `node ${binPath} create "Auth Hierarchy Test" --description "Testing the three-tier GitHub authentication hierarchy" --format json`,
      { encoding: 'utf8' }
    );
    const createData = JSON.parse(createOutput);
    expect(createData.data.title).toBe('Auth Hierarchy Test');
    
    // Clean up immediately
    execSync(`node ${binPath} close ${createData.data.id}`, { stdio: 'pipe' });

    // Remove context
    execSync(`node ${binPath} context remove github-auth-test`, { stdio: 'pipe' });
  });
});
