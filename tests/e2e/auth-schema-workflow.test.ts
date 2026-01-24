import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Auth and Schema E2E Workflow', () => {
  let testDir: string;
  let originalCwd: string;
  let binPath: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    testDir = mkdtempSync(join(tmpdir(), 'work-e2e-auth-schema-'));
    process.chdir(testDir);
    binPath = join(originalCwd, 'bin/run.js');

    // Create .work directory structure for default context
    execSync('mkdir -p .work/projects/default', { stdio: 'pipe' });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should complete full auth and schema discovery workflow', () => {
    // 1. Check initial auth status
    const initialStatus = execSync(`node ${binPath} auth status`, {
      encoding: 'utf8',
    });
    expect(initialStatus).toContain('authenticated');

    // 2. Login (should succeed)
    const loginResult = execSync(`node ${binPath} auth login`, {
      encoding: 'utf8',
    });
    expect(loginResult).toContain('✅ Authentication successful');

    // 3. Discover schema capabilities
    const schemaResult = execSync(`node ${binPath} schema show`, {
      encoding: 'utf8',
    });
    expect(schemaResult).toContain('Work Item Kinds');
    expect(schemaResult).toContain('task');

    // 4. List specific schema components
    const kindsResult = execSync(`node ${binPath} schema kinds`, {
      encoding: 'utf8',
    });
    expect(kindsResult).toContain('task');

    const attrsResult = execSync(`node ${binPath} schema attrs`, {
      encoding: 'utf8',
    });
    expect(attrsResult).toContain('title: string (required)');

    const relationsResult = execSync(`node ${binPath} schema relations`, {
      encoding: 'utf8',
    });
    expect(relationsResult).toContain('blocks');

    // 5. Logout
    const logoutResult = execSync(`node ${binPath} auth logout`, {
      encoding: 'utf8',
    });
    expect(logoutResult).toContain('✅ Logout successful');

    // 6. Verify status still works (local-fs always authenticated)
    const finalStatus = execSync(`node ${binPath} auth status`, {
      encoding: 'utf8',
    });
    expect(finalStatus).toContain('authenticated');
  });

  it('should handle JSON format across all commands', () => {
    // Auth status JSON
    const authJson = execSync(`node ${binPath} auth status --format json`, {
      encoding: 'utf8',
    });
    const authData = JSON.parse(authJson);
    expect(authData.data.state).toBe('authenticated');

    // Schema JSON
    const schemaJson = execSync(`node ${binPath} schema show --format json`, {
      encoding: 'utf8',
    });
    const schemaData = JSON.parse(schemaJson);
    expect(schemaData.data.kinds).toContain('task');

    // Kinds JSON
    const kindsJson = execSync(`node ${binPath} schema kinds --format json`, {
      encoding: 'utf8',
    });
    const kindsData = JSON.parse(kindsJson);
    expect(kindsData.data).toContain('task');
  });
});
