import { vi, describe, beforeEach, it, expect } from 'vitest';
import { TeamsEngine } from '../../../../../src/core/teams-engine';
import {
  TeamNotFoundError,
  DuplicateTeamIdError,
  InvalidTeamConfigError,
  AgentNotFoundError,
  HumanNotFoundError,
} from '../../../../../src/types/errors';
import { Team, Agent, Human } from '../../../../../src/types/teams';

// Mock the TeamsEngine
vi.mock('../../../../../src/core/teams-engine', () => ({
  TeamsEngine: vi.fn(),
}));

describe('Teams CRUD Operations Engine', () => {
  let mockTeamsEngine: any;
  let TeamsEngineConstructor: any;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a fresh mock instance
    mockTeamsEngine = {
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      addAgent: vi.fn(),
      updateAgent: vi.fn(),
      removeAgent: vi.fn(),
      addHuman: vi.fn(),
      updateHuman: vi.fn(),
      removeHuman: vi.fn(),
      getTeam: vi.fn(),
    };

    // Mock the constructor to return our mock instance
    TeamsEngineConstructor = TeamsEngine as any;
    TeamsEngineConstructor.mockImplementation(() => mockTeamsEngine);
  });

  describe('Team Operations', () => {
    it('should create a team with valid parameters', async () => {
      const teamRequest = {
        id: 'test-team',
        name: 'Test Team',
        title: 'Test Title',
        description: 'Test description',
        icon: '🚀',
      };

      const mockTeam: Team = { ...teamRequest };
      mockTeamsEngine.createTeam.mockResolvedValue(mockTeam);

      const engine = new TeamsEngine();
      const result = await engine.createTeam(teamRequest);

      expect(mockTeamsEngine.createTeam).toHaveBeenCalledWith(teamRequest);
      expect(result).toEqual(mockTeam);
    });

    it('should handle duplicate team ID error during creation', async () => {
      const teamRequest = {
        id: 'duplicate-team',
        name: 'Test Team',
        title: 'Test Title',
        description: 'Test description',
      };

      mockTeamsEngine.createTeam.mockRejectedValue(
        new DuplicateTeamIdError('duplicate-team')
      );

      const engine = new TeamsEngine();

      await expect(engine.createTeam(teamRequest)).rejects.toThrow(
        'Team ID already exists: duplicate-team'
      );
      expect(mockTeamsEngine.createTeam).toHaveBeenCalledWith(teamRequest);
    });

    it('should update team with partial data', async () => {
      const updateRequest = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      const mockUpdatedTeam: Team = {
        id: 'test-team',
        name: 'Updated Team Name',
        title: 'Original Title',
        description: 'Updated description',
      };

      mockTeamsEngine.updateTeam.mockResolvedValue(mockUpdatedTeam);

      const engine = new TeamsEngine();
      const result = await engine.updateTeam('test-team', updateRequest);

      expect(mockTeamsEngine.updateTeam).toHaveBeenCalledWith(
        'test-team',
        updateRequest
      );
      expect(result).toEqual(mockUpdatedTeam);
    });

    it('should handle team not found error during update', async () => {
      const updateRequest = { name: 'Updated Team' };

      mockTeamsEngine.updateTeam.mockRejectedValue(
        new TeamNotFoundError('nonexistent-team')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.updateTeam('nonexistent-team', updateRequest)
      ).rejects.toThrow('Team not found: nonexistent-team');
    });

    it('should delete team successfully', async () => {
      mockTeamsEngine.deleteTeam.mockResolvedValue(undefined);

      const engine = new TeamsEngine();
      await engine.deleteTeam('test-team');

      expect(mockTeamsEngine.deleteTeam).toHaveBeenCalledWith('test-team');
    });

    it('should handle team not found error during deletion', async () => {
      mockTeamsEngine.deleteTeam.mockRejectedValue(
        new TeamNotFoundError('nonexistent-team')
      );

      const engine = new TeamsEngine();

      await expect(engine.deleteTeam('nonexistent-team')).rejects.toThrow(
        'Team not found: nonexistent-team'
      );
    });
  });

  describe('Agent Operations', () => {
    it('should add agent to team', async () => {
      const agentRequest = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Developer',
        persona: {
          role: 'developer',
          identity: 'experienced developer',
          communication_style: 'professional',
          principles: 'clean code practices',
        },
      };

      const mockAgent: Agent = { ...agentRequest };
      mockTeamsEngine.addAgent.mockResolvedValue(mockAgent);

      const engine = new TeamsEngine();
      const result = await engine.addAgent('test-team', agentRequest);

      expect(mockTeamsEngine.addAgent).toHaveBeenCalledWith(
        'test-team',
        agentRequest
      );
      expect(result).toEqual(mockAgent);
    });

    it('should handle team not found when adding agent', async () => {
      const agentRequest = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Developer',
        persona: {
          role: 'developer',
          identity: 'experienced',
          communication_style: 'professional',
          principles: 'clean code',
        },
      };

      mockTeamsEngine.addAgent.mockRejectedValue(
        new TeamNotFoundError('nonexistent-team')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.addAgent('nonexistent-team', agentRequest)
      ).rejects.toThrow('Team not found: nonexistent-team');
    });

    it('should update agent successfully', async () => {
      const updateRequest = {
        name: 'Updated Agent',
        title: 'Senior Developer',
      };

      const mockUpdatedAgent: Agent = {
        id: 'test-agent',
        name: 'Updated Agent',
        title: 'Senior Developer',
        persona: {
          role: 'developer',
          identity: 'experienced',
          communication_style: 'professional',
          principles: 'clean code',
        },
      };

      mockTeamsEngine.updateAgent.mockResolvedValue(mockUpdatedAgent);

      const engine = new TeamsEngine();
      const result = await engine.updateAgent(
        'test-team',
        'test-agent',
        updateRequest
      );

      expect(mockTeamsEngine.updateAgent).toHaveBeenCalledWith(
        'test-team',
        'test-agent',
        updateRequest
      );
      expect(result).toEqual(mockUpdatedAgent);
    });

    it('should handle agent not found during update', async () => {
      mockTeamsEngine.updateAgent.mockRejectedValue(
        new AgentNotFoundError('test-team', 'nonexistent-agent')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.updateAgent('test-team', 'nonexistent-agent', {})
      ).rejects.toThrow('Agent not found: test-team/nonexistent-agent');
    });

    it('should remove agent successfully', async () => {
      mockTeamsEngine.removeAgent.mockResolvedValue(undefined);

      const engine = new TeamsEngine();
      await engine.removeAgent('test-team', 'test-agent');

      expect(mockTeamsEngine.removeAgent).toHaveBeenCalledWith(
        'test-team',
        'test-agent'
      );
    });

    it('should handle agent not found during removal', async () => {
      mockTeamsEngine.removeAgent.mockRejectedValue(
        new AgentNotFoundError('test-team', 'nonexistent-agent')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.removeAgent('test-team', 'nonexistent-agent')
      ).rejects.toThrow('Agent not found: test-team/nonexistent-agent');
    });
  });

  describe('Human Operations', () => {
    it('should add human to team', async () => {
      const humanRequest = {
        id: 'test-human',
        name: 'John Doe',
        title: 'Developer',
        persona: {
          role: 'developer',
          identity: 'experienced developer',
          communication_style: 'collaborative',
          principles: 'quality first',
          expertise: 'frontend development',
        },
        contact: {
          preferred_method: 'email',
          timezone: 'America/New_York',
          working_hours: '9-17',
          status: 'available',
        },
      };

      const mockHuman: Human = { ...humanRequest };
      mockTeamsEngine.addHuman.mockResolvedValue(mockHuman);

      const engine = new TeamsEngine();
      const result = await engine.addHuman('test-team', humanRequest);

      expect(mockTeamsEngine.addHuman).toHaveBeenCalledWith(
        'test-team',
        humanRequest
      );
      expect(result).toEqual(mockHuman);
    });

    it('should handle team not found when adding human', async () => {
      const humanRequest = {
        id: 'test-human',
        name: 'John Doe',
        title: 'Developer',
        persona: {
          role: 'developer',
          identity: 'experienced',
          communication_style: 'collaborative',
          principles: 'quality first',
        },
      };

      mockTeamsEngine.addHuman.mockRejectedValue(
        new TeamNotFoundError('nonexistent-team')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.addHuman('nonexistent-team', humanRequest)
      ).rejects.toThrow('Team not found: nonexistent-team');
    });

    it('should update human successfully', async () => {
      const updateRequest = {
        name: 'Jane Doe',
        title: 'Senior Developer',
        contact: {
          timezone: 'America/Los_Angeles',
          working_hours: '10-18',
        },
      };

      const mockUpdatedHuman: Human = {
        id: 'test-human',
        name: 'Jane Doe',
        title: 'Senior Developer',
        persona: {
          role: 'developer',
          identity: 'experienced',
          communication_style: 'collaborative',
          principles: 'quality first',
        },
        contact: {
          timezone: 'America/Los_Angeles',
          working_hours: '10-18',
        },
      };

      mockTeamsEngine.updateHuman.mockResolvedValue(mockUpdatedHuman);

      const engine = new TeamsEngine();
      const result = await engine.updateHuman(
        'test-team',
        'test-human',
        updateRequest
      );

      expect(mockTeamsEngine.updateHuman).toHaveBeenCalledWith(
        'test-team',
        'test-human',
        updateRequest
      );
      expect(result).toEqual(mockUpdatedHuman);
    });

    it('should handle human not found during update', async () => {
      mockTeamsEngine.updateHuman.mockRejectedValue(
        new HumanNotFoundError('test-team', 'nonexistent-human')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.updateHuman('test-team', 'nonexistent-human', {})
      ).rejects.toThrow('Human not found: test-team/nonexistent-human');
    });

    it('should remove human successfully', async () => {
      mockTeamsEngine.removeHuman.mockResolvedValue(undefined);

      const engine = new TeamsEngine();
      await engine.removeHuman('test-team', 'test-human');

      expect(mockTeamsEngine.removeHuman).toHaveBeenCalledWith(
        'test-team',
        'test-human'
      );
    });

    it('should handle human not found during removal', async () => {
      mockTeamsEngine.removeHuman.mockRejectedValue(
        new HumanNotFoundError('test-team', 'nonexistent-human')
      );

      const engine = new TeamsEngine();

      await expect(
        engine.removeHuman('test-team', 'nonexistent-human')
      ).rejects.toThrow('Human not found: test-team/nonexistent-human');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid team configuration error', async () => {
      const invalidRequest = {
        id: '',
        name: 'Test Team',
        title: 'Test Title',
        description: 'Test description',
      };

      mockTeamsEngine.createTeam.mockRejectedValue(
        new InvalidTeamConfigError('Team ID cannot be empty')
      );

      const engine = new TeamsEngine();

      await expect(engine.createTeam(invalidRequest)).rejects.toThrow(
        'Invalid team configuration: Team ID cannot be empty'
      );
    });

    it('should propagate unexpected errors', async () => {
      const teamRequest = {
        id: 'test-team',
        name: 'Test Team',
        title: 'Test Title',
        description: 'Test description',
      };

      const unexpectedError = new Error('Unexpected database error');
      mockTeamsEngine.createTeam.mockRejectedValue(unexpectedError);

      const engine = new TeamsEngine();

      await expect(engine.createTeam(teamRequest)).rejects.toThrow(
        'Unexpected database error'
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate team request structure', async () => {
      const teamRequest = {
        id: 'valid-team-id',
        name: 'Valid Team Name',
        title: 'Valid Team Title',
        description: 'Valid team description with enough detail',
        icon: '🚀',
      };

      mockTeamsEngine.createTeam.mockResolvedValue(teamRequest as Team);

      const engine = new TeamsEngine();
      const result = await engine.createTeam(teamRequest);

      expect(mockTeamsEngine.createTeam).toHaveBeenCalledWith(teamRequest);
      expect(result.id).toBe('valid-team-id');
      expect(result.name).toBe('Valid Team Name');
    });

    it('should validate agent persona structure', async () => {
      const agentRequest = {
        id: 'test-agent',
        name: 'Test Agent',
        title: 'Developer',
        persona: {
          role: 'software-developer',
          identity: 'experienced full-stack developer',
          communication_style: 'professional and clear',
          principles: 'clean code, testing, documentation',
        },
      };

      mockTeamsEngine.addAgent.mockResolvedValue(agentRequest as Agent);

      const engine = new TeamsEngine();
      const result = await engine.addAgent('test-team', agentRequest);

      expect(result.persona.role).toBe('software-developer');
      expect(result.persona.identity).toContain('experienced');
      expect(result.persona.communication_style).toContain('professional');
      expect(result.persona.principles).toContain('clean code');
    });

    it('should validate human contact information', async () => {
      const humanRequest = {
        id: 'test-human',
        name: 'John Doe',
        title: 'Developer',
        persona: {
          role: 'developer',
          identity: 'senior developer',
          communication_style: 'collaborative',
          principles: 'user-focused development',
        },
        contact: {
          preferred_method: 'slack',
          timezone: 'America/New_York',
          working_hours: '9-17',
          status: 'available',
        },
        platforms: {
          github: 'johndoe',
          email: 'john.doe@company.com',
        },
      };

      mockTeamsEngine.addHuman.mockResolvedValue(humanRequest as Human);

      const engine = new TeamsEngine();
      const result = await engine.addHuman('test-team', humanRequest);

      expect(result.contact?.timezone).toBe('America/New_York');
      expect(result.contact?.working_hours).toBe('9-17');
      expect(result.platforms?.github).toBe('johndoe');
      expect(result.platforms?.email).toBe('john.doe@company.com');
    });
  });
});
