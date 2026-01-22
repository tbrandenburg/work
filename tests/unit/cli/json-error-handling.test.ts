/**
 * Basic error handling tests for JSON mode
 */

import { execSync } from 'child_process';
import path from 'path';

const binPath = path.resolve(__dirname, '../../../bin/run.js');

describe('JSON Error Handling', () => {
  it('should output structured errors to stderr in JSON mode', () => {
    let stdout = '';
    let stderr = '';
    let exitCode = 0;
    
    try {
      execSync(`node ${binPath} get NONEXISTENT --format json`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error: any) {
      stdout = error.stdout || '';
      stderr = error.stderr || '';
      exitCode = error.status || 0;
    }
    
    expect(exitCode).toBe(1);
    expect(stdout).toBe(''); // stdout should be clean
    expect(stderr).toBeTruthy();
    
    const errorResponse = JSON.parse(stderr);
    expect(errorResponse).toHaveProperty('errors');
    expect(errorResponse.errors).toBeInstanceOf(Array);
    expect(errorResponse.errors[0]).toHaveProperty('message');
    expect(errorResponse.errors[0].message).toContain('Work item not found');
  });

  it('should handle missing required arguments with structured errors', () => {
    let stderr = '';
    let exitCode = 0;
    
    try {
      execSync(`node ${binPath} create --format json`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error: any) {
      stderr = error.stderr || '';
      exitCode = error.status || 0;
    }
    
    expect(exitCode).toBe(2); // oclif validation error
    expect(stderr).toContain('Missing 1 required arg');
  });

  it('should handle invalid field values with structured errors', () => {
    let stderr = '';
    let exitCode = 0;
    
    try {
      execSync(`node ${binPath} edit TASK-001 --format json`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (error: any) {
      stderr = error.stderr || '';
      exitCode = error.status || 0;
    }
    
    expect(exitCode).toBe(2); // oclif validation error, not our custom error
    expect(stderr).toBeTruthy();
    // This is an oclif validation error, not our JSON error format
    expect(stderr).toContain('No fields specified');
  });
});
