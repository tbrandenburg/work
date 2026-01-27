import { execSync } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Notify Target List Command Integration', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-notify-target-list-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should show no targets message when no targets configured', () => {
    const result = execSync(`node ${binPath} notify target list`, {
      encoding: 'utf8',
    });
    expect(result.trim()).toBe('No notification targets configured.');
  });

  it('should show no targets in JSON format when no targets configured', () => {
    const result = execSync(
      `node ${binPath} notify target list --format json`,
      {
        encoding: 'utf8',
      }
    );
    const parsed = JSON.parse(result);
    expect(parsed.data).toEqual([]);
    expect(parsed.meta.total).toBe(0);
    expect(parsed.meta).toHaveProperty('timestamp');
  });

  it('should list bash target in table format', () => {
    // Create a context with a notification target
    const contextData = {
      name: 'default',
      tool: 'local-fs',
      path: './tasks',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [
        {
          name: 'test-bash',
          type: 'bash',
          config: {
            type: 'bash',
            script: 'work:log',
            timeout: 30,
          },
        },
      ],
    };

    writeFileSync(
      '.work/projects/default/context.json',
      JSON.stringify(contextData, null, 2)
    );

    const result = execSync(`node ${binPath} notify target list`, {
      encoding: 'utf8',
    });

    expect(result).toContain('Name\t\tType\tConfiguration');
    expect(result).toContain('test-bash\t\tbash\tscript: work:log');
  });

  it('should list telegram target in table format', () => {
    // Create a context with a telegram notification target
    const contextData = {
      name: 'default',
      tool: 'local-fs',
      path: './tasks',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [
        {
          name: 'test-telegram',
          type: 'telegram',
          config: {
            type: 'telegram',
            botToken: 'bot123:ABC',
            chatId: '123456789',
          },
        },
      ],
    };

    writeFileSync(
      '.work/projects/default/context.json',
      JSON.stringify(contextData, null, 2)
    );

    const result = execSync(`node ${binPath} notify target list`, {
      encoding: 'utf8',
    });

    expect(result).toContain('Name\t\tType\tConfiguration');
    expect(result).toContain(
      'test-telegram\t\ttelegram\tbot: bot123:ABC, chat: 123456789'
    );
  });

  it('should list email target in table format', () => {
    // Create a context with an email notification target
    const contextData = {
      name: 'default',
      tool: 'local-fs',
      path: './tasks',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [
        {
          name: 'test-email',
          type: 'email',
          config: {
            type: 'email',
            to: 'test@example.com',
          },
        },
      ],
    };

    writeFileSync(
      '.work/projects/default/context.json',
      JSON.stringify(contextData, null, 2)
    );

    const result = execSync(`node ${binPath} notify target list`, {
      encoding: 'utf8',
    });

    expect(result).toContain('Name\t\tType\tConfiguration');
    expect(result).toContain('test-email\t\temail\tto: test@example.com');
  });

  it('should list multiple targets in table format', () => {
    // Create a context with multiple notification targets
    const contextData = {
      name: 'default',
      tool: 'local-fs',
      path: './tasks',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [
        {
          name: 'test-bash',
          type: 'bash',
          config: {
            type: 'bash',
            script: 'work:log',
          },
        },
        {
          name: 'test-telegram',
          type: 'telegram',
          config: {
            type: 'telegram',
            botToken: 'bot123:ABC',
            chatId: '123456789',
          },
        },
      ],
    };

    writeFileSync(
      '.work/projects/default/context.json',
      JSON.stringify(contextData, null, 2)
    );

    const result = execSync(`node ${binPath} notify target list`, {
      encoding: 'utf8',
    });

    expect(result).toContain('test-bash\t\tbash\tscript: work:log');
    expect(result).toContain(
      'test-telegram\t\ttelegram\tbot: bot123:ABC, chat: 123456789'
    );
  });

  it('should list targets in JSON format', () => {
    // Create a context with notification targets
    const contextData = {
      name: 'default',
      tool: 'local-fs',
      path: './tasks',
      authState: 'authenticated',
      isActive: true,
      notificationTargets: [
        {
          name: 'test-bash',
          type: 'bash',
          config: {
            type: 'bash',
            script: 'work:log',
            timeout: 30,
          },
        },
      ],
    };

    writeFileSync(
      '.work/projects/default/context.json',
      JSON.stringify(contextData, null, 2)
    );

    const result = execSync(
      `node ${binPath} notify target list --format json`,
      {
        encoding: 'utf8',
      }
    );

    const parsed = JSON.parse(result);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].name).toBe('test-bash');
    expect(parsed.data[0].type).toBe('bash');
    expect(parsed.data[0].config.type).toBe('bash');
    expect(parsed.data[0].config.script).toBe('work:log');
    expect(parsed.meta.total).toBe(1);
    expect(parsed.meta).toHaveProperty('timestamp');
  });

  it('should handle invalid format option', () => {
    expect(() => {
      execSync(`node ${binPath} notify target list --format invalid`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });

  it('should handle engine error gracefully', () => {
    // Remove .work directory to cause engine error
    execSync('rm -rf .work', { stdio: 'pipe' });

    expect(() => {
      execSync(`node ${binPath} notify target list`, {
        stdio: 'pipe',
      });
    }).toThrow();
  });
});
