import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

describe('CLI: assignee functionality integration', () => {
  let tempDir: string;
  let originalCwd: string;
  let originalUser: string | undefined;
  let originalUsername: string | undefined;

  beforeEach(() => {
    // Create temporary directory for test
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'work-cli-assignee-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Store original environment variables
    originalUser = process.env['USER'];
    originalUsername = process.env['USERNAME'];

    // Set test environment variables
    process.env['USER'] = 'test-user';
    process.env['USERNAME'] = 'test-user';

    // Initialize git repo for local-fs adapter
    execSync('git init', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
    execSync('git config user.name "Test User"', { cwd: tempDir });

    // Create a basic teams.xml configuration for testing
    const teamsXml = `<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0">
  <team id="dev-team" name="Development Team" title="Dev Team" description="Main development team">
    <humans>
      <human id="tech-lead" name="Technical Lead" title="Senior Developer">
        <persona role="lead" identity="technical-leader" communication_style="direct" principles="quality-first"/>
        <platforms github="github-tech-lead" email="tech-lead@company.com"/>
      </human>
      <human id="developer" name="Developer" title="Software Developer">
        <persona role="developer" identity="coder" communication_style="collaborative" principles="clean-code"/>
        <platforms github="github-dev" email="dev@company.com"/>
      </human>
    </humans>
  </team>
  <team id="qa-team" name="Quality Assurance Team" title="QA Team" description="Testing team">
    <humans>
      <human id="qa-lead" name="QA Lead" title="Senior QA Engineer">
        <persona role="qa" identity="quality-guardian" communication_style="methodical" principles="thorough-testing"/>
        <platforms github="github-qa" email="qa@company.com"/>
      </human>
    </humans>
  </team>
</teams>`;

    // Create .work directory and teams.xml configuration for testing
    const workDir = path.join(tempDir, '.work');
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(path.join(workDir, 'teams.xml'), teamsXml);
  });

  afterEach(() => {
    // Restore original directory
    process.chdir(originalCwd);

    // Restore environment variables
    if (originalUser !== undefined) {
      process.env['USER'] = originalUser;
    } else {
      delete process.env['USER'];
    }

    if (originalUsername !== undefined) {
      process.env['USERNAME'] = originalUsername;
    } else {
      delete process.env['USERNAME'];
    }

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('create command with assignee', () => {
    it('should create work item with direct username assignee', () => {
      try {
        const result = execSync(
          'npx work create "Test task" --assignee "john-doe"',
          {
            cwd: tempDir,
            encoding: 'utf8',
          }
        );

        expect(result).toContain('Created task');
        expect(result).toContain('Test task');
        expect(result).toContain('Assigned to: john-doe');
      } catch (error: any) {
        // Log the error for debugging
        console.error(
          'Command failed with error:',
          error.stderr || error.message
        );
        throw error;
      }
    });

    it('should create work item with @me notation', () => {
      try {
        const result = execSync(
          'npx work create "Personal task" --assignee "@me"',
          {
            cwd: tempDir,
            encoding: 'utf8',
          }
        );

        expect(result).toContain('Created task');
        expect(result).toContain('Personal task');
        expect(result).toContain('Assigned to: test-user (resolved from @me)');
      } catch (error: any) {
        // Log the error for debugging
        console.error(
          'Command failed with error:',
          error.stderr || error.message
        );
        throw error;
      }
    });

    it('should create work item with @notation passed through', () => {
      const result = execSync(
        'npx work create "Team task" --assignee "@tech-lead"',
        {
          cwd: tempDir,
          encoding: 'utf8',
        }
      );

      expect(result).toContain('Created task');
      expect(result).toContain('Team task');
      // @notation should be passed through as-is for now
      expect(result).toContain('Assigned to: @tech-lead');
    });

    it('should show enhanced help examples with assignee flags', () => {
      const result = execSync('npx work create --help', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('--assignee');
      expect(result).toContain('@tech-lead');
      expect(result).toContain('@dev-team/lead');
      expect(result).toContain('--team');
    });

    it('should create work item in JSON mode with assignee resolution', () => {
      const result = execSync(
        'npx work create "JSON task" --assignee "@me" --format json',
        {
          cwd: tempDir,
          encoding: 'utf8',
        }
      );

      const output = JSON.parse(result);
      expect(output.data.assignee).toBe('test-user');
      expect(output.data.title).toBe('JSON task');
    });
  });

  describe('teams resolve command', () => {
    it('should resolve @me notation', () => {
      const result = execSync('npx work teams resolve @me', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Notation: @me');
      expect(result).toContain('Resolved: test-user');
      expect(result).toContain('Type: Current user (@me)');
    });

    it('should resolve direct username', () => {
      const result = execSync('npx work teams resolve john-doe', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Notation: john-doe');
      expect(result).toContain('Resolved: john-doe');
      expect(result).toContain('Type: Direct username');
    });

    it('should resolve @notation with team context', () => {
      const result = execSync(
        'npx work teams resolve @tech-lead --team dev-team',
        {
          cwd: tempDir,
          encoding: 'utf8',
        }
      );

      expect(result).toContain('Notation: @tech-lead');
      expect(result).toContain('Type: Team notation');
      // Should attempt resolution but may fall back to the notation itself
    });

    it('should show detailed resolution information', () => {
      const result = execSync(
        'npx work teams resolve @tech-lead --team dev-team --details',
        {
          cwd: tempDir,
          encoding: 'utf8',
        }
      );

      expect(result).toContain('Notation: @tech-lead');
      expect(result).toContain('Resolved:');
      expect(result).toContain('Adapter Specific:');
    });

    it('should output JSON format', () => {
      const result = execSync('npx work teams resolve @me --format json', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      const output = JSON.parse(result);
      expect(output.data.notation).toBe('@me');
      expect(output.data.resolvedAssignee).toBe('test-user');
      expect(output.data.type).toBe('current-user');
    });

    it('should show assignee help', () => {
      const result = execSync('npx work teams resolve @me --assignee-help', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Assignee Help:');
      expect(result).toContain('Use @notation for team assignments');
      expect(result).toContain('Use @me for current user');
      expect(result).toContain('Use direct usernames');
    });

    it('should show command help', () => {
      const result = execSync('npx work teams resolve --help', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Resolve assignee notation');
      expect(result).toContain('--team');
      expect(result).toContain('--details');
      expect(result).toContain('@tech-lead');
      expect(result).toContain('@dev-team/lead');
    });
  });

  describe('error handling', () => {
    it('should handle missing environment variables for @me', () => {
      // Temporarily remove environment variables
      delete process.env['USER'];
      delete process.env['USERNAME'];

      const result = execSync('npx work teams resolve @me', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Notation: @me');
      expect(result).toContain('Resolved: unknown');
    });

    it('should handle resolution with missing team context', () => {
      try {
        execSync('npx work teams resolve @unknown-member', {
          cwd: tempDir,
          encoding: 'utf8',
        });
      } catch (error: any) {
        // Should handle the error gracefully
        expect(error.status).toBe(1);
      }
    });
  });

  describe('workflow integration', () => {
    it('should create and resolve assignee in workflow', () => {
      // Create work item with assignee
      const createResult = execSync(
        'npx work create "Workflow task" --assignee "@me"',
        {
          cwd: tempDir,
          encoding: 'utf8',
        }
      );

      expect(createResult).toContain('Created task');
      expect(createResult).toContain('Assigned to: test-user');

      // Verify assignee can be resolved
      const resolveResult = execSync('npx work teams resolve @me', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(resolveResult).toContain('Resolved: test-user');
    });

    it('should handle multiple assignee formats in sequence', () => {
      const assignments = [
        { notation: '@me', expected: 'test-user' },
        { notation: 'direct-user', expected: 'direct-user' },
        { notation: '@tech-lead', expected: '@tech-lead' },
      ];

      assignments.forEach(({ notation, expected }, index) => {
        const result = execSync(
          `npx work create "Task ${index}" --assignee "${notation}"`,
          {
            cwd: tempDir,
            encoding: 'utf8',
          }
        );

        expect(result).toContain('Created task');
        if (expected !== notation) {
          expect(result).toContain(
            `Assigned to: ${expected} (resolved from ${notation})`
          );
        } else {
          expect(result).toContain(`Assigned to: ${expected}`);
        }
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty assignee gracefully', () => {
      const result = execSync('npx work create "No assignee task"', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Created task');
      expect(result).toContain('No assignee task');
      // Should not show assignee information when none provided
      expect(result).not.toContain('Assigned to:');
    });

    it('should handle special characters in assignee notation', () => {
      const result = execSync('npx work teams resolve "user@domain.com"', {
        cwd: tempDir,
        encoding: 'utf8',
      });

      expect(result).toContain('Notation: user@domain.com');
      expect(result).toContain('Resolved: user@domain.com');
    });
  });
});
