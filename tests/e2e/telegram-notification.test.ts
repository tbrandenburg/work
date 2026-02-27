import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Telegram Notification E2E', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-telegram-e2e-'));
    process.chdir(testDir);

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should manage telegram notification targets', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Add telegram notification target
    execSync(
      `node ${binPath} notify target add test-telegram --type telegram --bot-token test-token --chat-id test-chat`,
      { stdio: 'pipe' }
    );

    // List targets to verify addition
    const listOutput = execSync(
      `node ${binPath} notify target list --format json`,
      { encoding: 'utf8' }
    );
    const listData = JSON.parse(listOutput);
    expect(listData.data).toHaveLength(1);
    expect(listData.data[0].name).toBe('test-telegram');
    expect(listData.data[0].type).toBe('telegram');
    expect(listData.data[0].config.botToken).toBe('test-token');
    expect(listData.data[0].config.chatId).toBe('test-chat');

    // Remove target
    execSync(`node ${binPath} notify target remove test-telegram`, {
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

  it('should send telegram notifications with work items', () => {
    const binPath = join(originalCwd, 'bin/run.js');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const skipNetworkTests =
      process.env.CI === 'true' || !process.env.TELEGRAM_NETWORK_TESTS_ENABLED;

    if (!botToken || !chatId || skipNetworkTests) {
      console.log(
        'Skipping real Telegram test - missing credentials, running in CI, or network tests not enabled (set TELEGRAM_NETWORK_TESTS_ENABLED=true to enable)'
      );
      return;
    }

    // Create a work item
    execSync(
      `node ${binPath} create "Test notification task" --priority high`,
      {
        stdio: 'pipe',
      }
    );

    // Add telegram target with real credentials
    execSync(
      `node ${binPath} notify target add test-telegram --type telegram --bot-token ${botToken} --chat-id ${chatId}`,
      { stdio: 'pipe' }
    );

    // Send notification for all items (should include the created task)
    const result = execSync(
      `node ${binPath} notify send where "priority=high" to test-telegram`,
      { encoding: 'utf8' }
    );

    expect(result).toContain('Notification sent successfully');
  });

  it('should send plain multi-line message to telegram', () => {
    const binPath = join(originalCwd, 'bin/run.js');
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const skipNetworkTests =
      process.env.CI === 'true' || !process.env.TELEGRAM_NETWORK_TESTS_ENABLED;

    if (!botToken || !chatId || skipNetworkTests) {
      console.log(
        'Skipping real Telegram test - missing credentials, running in CI, or network tests not enabled (set TELEGRAM_NETWORK_TESTS_ENABLED=true to enable)'
      );
      return;
    }

    // Add telegram target with real credentials
    execSync(
      `node ${binPath} notify target add test-telegram --type telegram --bot-token ${botToken} --chat-id ${chatId}`,
      { stdio: 'pipe' }
    );

    // Send plain multi-line message
    // Use a message with spaces (no newlines needed for detection)
    const multiLineMessage = 'This is a test message with multiple words';

    const result = execSync(
      `node ${binPath} notify send '${multiLineMessage}' to test-telegram`,
      { encoding: 'utf8' }
    );

    expect(result).toContain('Message sent successfully');

    // Clean up
    execSync(`node ${binPath} notify target remove test-telegram`, {
      stdio: 'pipe',
    });
  });

  it('should validate telegram target configuration', () => {
    const binPath = join(originalCwd, 'bin/run.js');

    // Try to add telegram target without required parameters
    expect(() => {
      execSync(
        `node ${binPath} notify target add test-telegram --type telegram`,
        { stdio: 'pipe' }
      );
    }).toThrow();

    // Try to add telegram target with missing chat-id
    expect(() => {
      execSync(
        `node ${binPath} notify target add test-telegram --type telegram --bot-token test-token`,
        { stdio: 'pipe' }
      );
    }).toThrow();

    // Try to add telegram target with missing bot-token
    expect(() => {
      execSync(
        `node ${binPath} notify target add test-telegram --type telegram --chat-id test-chat`,
        { stdio: 'pipe' }
      );
    }).toThrow();
  });
});
