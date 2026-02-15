import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssigneeResolver } from '../../../src/core/assignee-resolver.js';
import { TeamsEngine } from '../../../src/core/teams-engine.js';
import { InvalidAssigneeError } from '../../../src/types/errors.js';
import type { Human } from '../../../src/types/teams.js';

// Mock TeamsEngine
vi.mock('../../../src/core/teams-engine.js', () => ({
  TeamsEngine: vi.fn(),
}));

describe('AssigneeResolver', () => {
  let resolver: AssigneeResolver;
  let mockTeamsEngine: any;
  let mockAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTeamsEngine = {
      getMember: vi.fn(),
    };

    mockAdapter = {
      initialize: vi.fn(),
      createWorkItem: vi.fn(),
      getWorkItem: vi.fn(),
      updateWorkItem: vi.fn(),
      changeState: vi.fn(),
      listWorkItems: vi.fn(),
      createRelation: vi.fn(),
      getRelations: vi.fn(),
      deleteRelation: vi.fn(),
      deleteWorkItem: vi.fn(),
      authenticate: vi.fn(),
      logout: vi.fn(),
      getAuthStatus: vi.fn(),
      getSchema: vi.fn(),
      resolveAssignee: vi.fn(),
      validateAssignee: vi.fn(),
      getAssigneeHelp: vi.fn(),
    };

    vi.mocked(TeamsEngine).mockImplementation(() => mockTeamsEngine);
    resolver = new AssigneeResolver(mockAdapter, mockTeamsEngine);
  });

  describe('resolveAssignee', () => {
    it('should pass through direct usernames when validation passes', async () => {
      const directUsername = 'john-doe';
      mockAdapter.validateAssignee.mockResolvedValue(true);

      const result = await resolver.resolveAssignee(directUsername);

      expect(result).toBe(directUsername);
      expect(mockAdapter.validateAssignee).toHaveBeenCalledWith(directUsername);
    });

    it('should throw InvalidAssigneeError for invalid direct usernames', async () => {
      const invalidUsername = 'invalid-user';
      mockAdapter.validateAssignee.mockResolvedValue(false);

      await expect(resolver.resolveAssignee(invalidUsername)).rejects.toThrow(
        InvalidAssigneeError
      );
    });

    it('should resolve @me notation to current user', async () => {
      const currentUser = 'current-user';

      const result = await resolver.resolveAssignee('@me', { currentUser });

      expect(result).toBe(currentUser);
    });

    it('should resolve @notation using teams configuration', async () => {
      const notation = '@tech-lead';
      const mockMember: Human = {
        id: 'tech-lead',
        name: 'John Doe',
        title: 'Technical Lead',
        persona: {
          role: 'lead',
          identity: 'technical-leader',
          communication_style: 'direct',
          principles: 'quality-first',
        },
        platforms: { github: 'john-github' },
      };

      mockTeamsEngine.getMember.mockResolvedValue(mockMember);
      mockAdapter.resolveAssignee.mockResolvedValue('john-github');

      const result = await resolver.resolveAssignee(notation, {
        defaultTeam: 'dev-team',
      });

      expect(result).toBe('john-github');
      expect(mockTeamsEngine.getMember).toHaveBeenCalledWith(
        'dev-team',
        'tech-lead'
      );
      expect(mockAdapter.resolveAssignee).toHaveBeenCalledWith('john-github');
    });
  });

  describe('parseNotation', () => {
    it('should parse simple @notation', () => {
      const result = resolver.parseNotation('@tech-lead');

      expect(result).toEqual({
        teamId: undefined,
        memberId: 'tech-lead',
        originalNotation: '@tech-lead',
      });
    });

    it('should parse team/member @notation', () => {
      const result = resolver.parseNotation('@dev-team/lead');

      expect(result).toEqual({
        teamId: 'dev-team',
        memberId: 'lead',
        originalNotation: '@dev-team/lead',
      });
    });
  });

  describe('resolveWithDetails', () => {
    it('should return detailed resolution result', async () => {
      const notation = '@tech-lead';
      const mockMember: Human = {
        id: 'tech-lead',
        name: 'John Doe',
        title: 'Technical Lead',
        persona: {
          role: 'lead',
          identity: 'technical-leader',
          communication_style: 'direct',
          principles: 'quality-first',
        },
        platforms: { github: 'john-github' },
      };

      mockTeamsEngine.getMember.mockResolvedValue(mockMember);
      mockAdapter.resolveAssignee.mockResolvedValue('john-github');

      const result = await resolver.resolveWithDetails(notation, {
        defaultTeam: 'dev-team',
      });

      expect(result.resolvedAssignee).toBe('john-github');
      expect(result.member).toBe(mockMember);
      expect(result.notation).toBe('@tech-lead');
      expect(result.adapterSpecific).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should propagate teams engine errors', async () => {
      const notation = '@problematic';
      const teamsError = new Error('Teams lookup failed');

      mockTeamsEngine.getMember.mockRejectedValue(teamsError);

      await expect(
        resolver.resolveAssignee(notation, { defaultTeam: 'team' })
      ).rejects.toThrow('Teams lookup failed');
    });
  });
});
