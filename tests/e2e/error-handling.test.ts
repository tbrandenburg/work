import { execSync } from 'child_process';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Error Handling E2E', () => {
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

  describe('Work Item Errors', () => {
    it('should handle non-existent work item operations', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Try to get non-existent work item
      expect(() => {
        execSync(`node ${binPath} get NONEXISTENT`, { stdio: 'pipe' });
      }).toThrow();

      // Try to close non-existent work item
      expect(() => {
        execSync(`node ${binPath} close NONEXISTENT`, { stdio: 'pipe' });
      }).toThrow();

      // Try to edit non-existent work item
      expect(() => {
        execSync(`node ${binPath} edit NONEXISTENT --title "test"`, {
          stdio: 'pipe',
        });
      }).toThrow();
    });

    it('should handle reopen non-closed work item gracefully', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Create work item (starts as 'new')
      const createOutput = execSync(`node ${binPath} create "Test Task"`, {
        encoding: 'utf8',
      });
      const workItemId = createOutput.match(/TASK-\d+/)?.[0];

      // Reopen already non-closed work item (should succeed - idempotent)
      const reopenOutput = execSync(`node ${binPath} reopen ${workItemId}`, {
        encoding: 'utf8',
      });
      expect(reopenOutput).toContain('Reopened task');
    });

    it('should handle edit with no fields specified', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Create work item
      const createOutput = execSync(`node ${binPath} create "Test Task"`, {
        encoding: 'utf8',
      });
      const workItemId = createOutput.match(/TASK-\d+/)?.[0];

      // Try to edit with no fields
      expect(() => {
        execSync(`node ${binPath} edit ${workItemId}`, { stdio: 'pipe' });
      }).toThrow();
    });
  });

  describe('Context Errors', () => {
    it('should handle non-existent context operations', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Try to show non-existent context
      expect(() => {
        execSync(`node ${binPath} context show nonexistent`, { stdio: 'pipe' });
      }).toThrow();

      // Try to remove non-existent context
      expect(() => {
        execSync(`node ${binPath} context remove nonexistent`, {
          stdio: 'pipe',
        });
      }).toThrow();
    });
  });

  describe('Relation Errors', () => {
    it('should handle invalid relation operations gracefully', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Create one work item
      const createOutput = execSync(`node ${binPath} create "Test Task"`, {
        encoding: 'utf8',
      });
      const workItemId = createOutput.match(/TASK-\d+/)?.[0];

      // Try to link with non-existent work item (should fail)
      expect(() => {
        execSync(
          `node ${binPath} link ${workItemId} NONEXISTENT --type parent_of`,
          { stdio: 'pipe' }
        );
      }).toThrow();

      // Try to unlink non-existent relation (should succeed - idempotent)
      const unlinkOutput = execSync(
        `node ${binPath} unlink ${workItemId} NONEXISTENT --type parent_of`,
        { encoding: 'utf8' }
      );
      expect(unlinkOutput).toContain('Removed relation');
    });
  });

  describe('Command Validation Errors', () => {
    it('should handle missing required arguments', () => {
      const binPath = join(originalCwd, 'bin/run.js');

      // Try create without title
      expect(() => {
        execSync(`node ${binPath} create`, { stdio: 'pipe' });
      }).toThrow();

      // Try link without enough arguments
      expect(() => {
        execSync(`node ${binPath} link TASK-001`, { stdio: 'pipe' });
      }).toThrow();
    });
  });
});
