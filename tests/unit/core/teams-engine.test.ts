import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { TeamsEngine } from '../../../src/core/teams-engine';
import {
  TeamNotFoundError,
  AgentNotFoundError,
  HumanNotFoundError,
} from '../../../src/types/errors';

// Use real fs for test directory operations, but mock it for the tests
const realFs = fs;

// Mock the XML utils module
vi.mock('../../../src/core/xml-utils', () => ({
  parseTeamsXML: vi.fn(),
  buildTeamsXML: vi.fn(),
  validateXMLStructure: vi.fn(),
}));

// Mock the filesystem and default teams
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      ...(actual as any).promises,
      access: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
    },
  };
});

vi.mock('../../../src/core/default-teams', () => ({
  initializeDefaultTeams: vi.fn(),
}));

describe('TeamsEngine', () => {
  let engine: TeamsEngine;
  let mockFs: any;
  let testDir: string;
  let originalCwd: typeof process.cwd;

  // Import mocked modules
  let mockParseTeamsXML: any;
  let mockBuildTeamsXML: any;
  let mockValidateXMLStructure: any;
  let mockInitializeDefaultTeams: any;

  beforeEach(async () => {
    // Mock process.cwd() to return test directory
    testDir = join(tmpdir(), `teams-test-${Date.now()}`);
    await realFs.mkdir(testDir, { recursive: true });

    originalCwd = process.cwd;
    process.cwd = vi.fn().mockReturnValue(testDir);

    engine = new TeamsEngine();
    mockFs = fs as any;

    // Import the mocked functions
    const xmlUtils = await import('../../../src/core/xml-utils');
    const defaultTeams = await import('../../../src/core/default-teams');

    mockParseTeamsXML = xmlUtils.parseTeamsXML as any;
    mockBuildTeamsXML = xmlUtils.buildTeamsXML as any;
    mockValidateXMLStructure = xmlUtils.validateXMLStructure as any;
    mockInitializeDefaultTeams = defaultTeams.initializeDefaultTeams as any;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Restore original process.cwd
    process.cwd = originalCwd;

    // Clean up the test directory
    try {
      await realFs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('listTeams', () => {
    it('should return teams from loaded data', async () => {
      const mockTeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test Team Title',
            description: 'Test team description',
          },
        ],
        version: '1.0.0',
      };

      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
<teams version="1.0.0">
  <team id="test-team">
    <name>Test Team</name>
    <title>Test Team Title</title>
    <description>Test team description</description>
  </team>
</teams>`);

      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      const result = await engine.listTeams();

      expect(result).toEqual(mockTeamsData.teams);
      expect(mockFs.access).toHaveBeenCalled();
      expect(mockFs.readFile).toHaveBeenCalled();
    });

    it('should create default teams if file does not exist', async () => {
      const mockDefaultTeams = {
        teams: [
          {
            id: 'default-team',
            name: 'Default Team',
            title: 'Default Team Title',
            description: 'Default team description',
          },
        ],
        version: '1.0.0',
      };

      mockFs.access.mockRejectedValue(new Error('File not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockInitializeDefaultTeams.mockResolvedValue(mockDefaultTeams);
      mockBuildTeamsXML.mockReturnValue('<teams></teams>');

      const result = await engine.listTeams();

      expect(result).toEqual(mockDefaultTeams.teams);
      expect(mockFs.access).toHaveBeenCalled();
      expect(mockInitializeDefaultTeams).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getTeam', () => {
    it('should return specific team when found', async () => {
      const mockTeam = {
        id: 'existing-team',
        name: 'Existing Team',
        title: 'Existing Team Title',
        description: 'Existing team description',
      };

      const mockTeamsData = {
        teams: [mockTeam],
        version: '1.0.0',
      };

      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('<teams></teams>');
      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      const result = await engine.getTeam('existing-team');

      expect(result).toEqual(mockTeam);
    });

    it('should throw TeamNotFoundError when team does not exist', async () => {
      const mockTeamsData = {
        teams: [],
        version: '1.0.0',
      };

      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('<teams></teams>');
      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      await expect(engine.getTeam('nonexistent-team')).rejects.toThrow(
        TeamNotFoundError
      );
    });
  });

  describe('getAgent', () => {
    it('should return specific agent when found', async () => {
      const mockAgent = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Test Agent Title',
        persona: {
          role: 'Test Role',
          identity: 'Test Identity',
          communication_style: 'Test Style',
          principles: 'Test Principles',
        },
      };

      const mockTeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test Team Title',
            description: 'Test team description',
            agents: [mockAgent],
          },
        ],
        version: '1.0.0',
      };

      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('<teams></teams>');
      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      const result = await engine.getAgent('test-team', 'test-agent');

      expect(result).toEqual(mockAgent);
    });

    it('should throw AgentNotFoundError when agent does not exist', async () => {
      const mockTeamsData = {
        teams: [
          {
            id: 'test-team',
            name: 'Test Team',
            title: 'Test Team Title',
            description: 'Test team description',
            agents: [],
          },
        ],
        version: '1.0.0',
      };

      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('<teams></teams>');
      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      await expect(
        engine.getAgent('test-team', 'nonexistent-agent')
      ).rejects.toThrow(AgentNotFoundError);
    });
  });

  describe('validateTeams', () => {
    it('should return valid result for well-formed XML', async () => {
      mockFs.access.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('<teams></teams>');

      const mockValidation = {
        isValid: true,
        errors: [],
      };

      mockValidateXMLStructure.mockReturnValue(mockValidation);

      const mockTeamsData = {
        teams: [
          {
            id: 'valid-team',
            name: 'Valid Team',
            title: 'Valid Team Title',
            description: 'Valid team description',
            agents: [
              {
                id: 'agent-1',
                name: 'Agent 1',
                title: 'Agent Title',
                persona: {
                  role: 'Role',
                  identity: 'Identity',
                  communication_style: 'Style',
                  principles: 'Principles',
                },
              },
            ],
          },
        ],
        version: '1.0.0',
      };

      mockParseTeamsXML.mockReturnValue(mockTeamsData);

      const result = await engine.validateTeams();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when teams.xml file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      const result = await engine.validateTeams();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('teams.xml file not found');
    });
  });
});
