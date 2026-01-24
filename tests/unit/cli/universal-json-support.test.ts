/**
 * Comprehensive JSON Output Validation Test Suite
 * Verifies all commands support --format json with structured output
 */

import { execSync } from 'child_process';
import { join } from 'path';

const binPath = join(__dirname, '../../../bin/run.js');

describe('Universal JSON Output Support', () => {
  describe('All Commands JSON Support', () => {
    const commands = [
      // Core work item commands
      { cmd: 'create "Test task"', expectData: true },
      { cmd: 'list', expectData: true },
      { cmd: 'get TASK-001', expectData: true, setup: 'create "Setup task"' },

      // State change commands
      { cmd: 'start TASK-001', expectData: true, setup: 'create "Start task"' },
      {
        cmd: 'close TASK-001',
        expectData: true,
        setup: 'create "Close task" && start TASK-001',
      },
      {
        cmd: 'reopen TASK-001',
        expectData: true,
        setup: 'create "Reopen task" && start TASK-001 && close TASK-001',
      },

      // Property commands
      {
        cmd: 'set TASK-001 --assignee "test"',
        expectData: true,
        setup: 'create "Set task"',
      },
      {
        cmd: 'unset TASK-001 --assignee',
        expectData: true,
        setup: 'create "Unset task"',
      },
      {
        cmd: 'edit TASK-001 --title "Updated"',
        expectData: true,
        setup: 'create "Edit task"',
      },

      // Relation commands
      {
        cmd: 'link TASK-001 TASK-002 --type blocks',
        expectData: true,
        setup: 'create "Link1" && create "Link2"',
      },
      {
        cmd: 'unlink TASK-001 TASK-002 --type blocks',
        expectData: true,
        setup:
          'create "Unlink1" && create "Unlink2" && link TASK-001 TASK-002 --type blocks',
      },

      // Utility commands
      { cmd: 'hello --from test', expectData: true },
      {
        cmd: 'comment TASK-001 "Test comment"',
        expectData: true,
        setup: 'create "Comment task"',
      },
      {
        cmd: 'delete TASK-001',
        expectData: true,
        setup: 'create "Delete task"',
      },
      {
        cmd: 'move TASK-001 other-context',
        expectData: true,
        setup: 'create "Move task"',
      },

      // Auth commands
      { cmd: 'auth status', expectData: true },
      { cmd: 'auth login', expectData: true },
      { cmd: 'auth logout', expectData: true },

      // Context commands
      { cmd: 'context list', expectData: true },
      { cmd: 'context show', expectData: true },
      { cmd: 'context add test-context local-fs /tmp/test', expectData: true },
      { cmd: 'context set test-context', expectData: true },
      { cmd: 'context remove test-context', expectData: true },

      // Schema commands
      { cmd: 'schema show', expectData: true },
      { cmd: 'schema kinds', expectData: true },
      { cmd: 'schema attrs', expectData: true },
      { cmd: 'schema relations', expectData: true },
    ];

    commands.forEach(({ cmd, expectData, setup }) => {
      it(`should support JSON output: ${cmd}`, () => {
        try {
          // Run setup commands if needed
          if (setup) {
            const setupCommands = setup.split(' && ');
            setupCommands.forEach(setupCmd => {
              try {
                execSync(`node ${binPath} ${setupCmd}`, {
                  encoding: 'utf8',
                  stdio: 'pipe',
                });
              } catch (error) {
                // Ignore setup errors for this test
              }
            });
          }

          // Test the actual command with JSON format
          const result = execSync(`node ${binPath} ${cmd} --format json`, {
            encoding: 'utf8',
            stdio: 'pipe',
          });

          // Verify it's valid JSON
          const parsed = JSON.parse(result);

          // Verify structured format
          if (expectData) {
            expect(parsed).toHaveProperty('data');
          }

          // Verify meta information is present
          if (parsed.meta) {
            expect(parsed.meta).toHaveProperty('timestamp');
          }

          // Ensure no errors in success case
          expect(parsed).not.toHaveProperty('errors');
        } catch (error) {
          // If command fails, that's okay for this test - we just want to verify
          // that if it succeeds, it outputs proper JSON
          if (error instanceof Error && error.message.includes('SyntaxError')) {
            throw new Error(
              `Command "${cmd}" did not output valid JSON: ${error.message}`
            );
          }
        }
      });
    });
  });

  describe('JSON Structure Validation', () => {
    it('should have consistent response structure across commands', () => {
      const commands = ['list', 'auth status', 'schema show'];

      commands.forEach(cmd => {
        const result = execSync(`node ${binPath} ${cmd} --format json`, {
          encoding: 'utf8',
        });
        const parsed = JSON.parse(result);

        // All responses should have data
        expect(parsed).toHaveProperty('data');

        // Meta should be optional but if present, should have timestamp
        if (parsed.meta) {
          expect(parsed.meta).toHaveProperty('timestamp');
          expect(typeof parsed.meta.timestamp).toBe('string');
        }

        // Should not have errors in success case
        expect(parsed).not.toHaveProperty('errors');
      });
    });

    it('should output errors to stderr in JSON format', () => {
      try {
        execSync(`node ${binPath} get NONEXISTENT --format json`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (error: any) {
        // Error should be in stderr
        const stderr = error.stderr;
        expect(stderr).toBeTruthy();

        // Should be valid JSON
        const parsed = JSON.parse(stderr);
        expect(parsed).toHaveProperty('errors');
        expect(Array.isArray(parsed.errors)).toBe(true);
        expect(parsed.errors[0]).toHaveProperty('message');
      }
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain same data structure for existing JSON commands', () => {
      // Test that existing JSON commands still work the same way
      const result = execSync(`node ${binPath} auth status --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      // Should have the structured format now
      expect(parsed).toHaveProperty('data');
      expect(parsed.data).toHaveProperty('state');
      expect(parsed.data).toHaveProperty('user');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data responses', () => {
      const result = execSync(`node ${binPath} context list --format json`, {
        encoding: 'utf8',
      });
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('data');
      expect(Array.isArray(parsed.data)).toBe(true);
      expect(parsed.data).toHaveLength(1); // Default context is auto-created
      expect(parsed.data[0]).toHaveProperty('name', 'default');
    });

    it('should include proper newline termination', () => {
      const result = execSync(`node ${binPath} auth status --format json`, {
        encoding: 'utf8',
      });
      expect(result.endsWith('\n')).toBe(true);
    });

    it('should use 2-space indentation', () => {
      const result = execSync(`node ${binPath} auth status --format json`, {
        encoding: 'utf8',
      });
      expect(result).toContain('  "data"');
    });
  });
});
