/**
 * Teams management engine for XML-based team configurations.
 *
 * Provides core functionality for loading, saving, and querying teams data
 * stored in .work/teams.xml. Follows the same pattern as the main WorkEngine
 * for file operations and error handling.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  parseTeamsXML,
  buildTeamsXML,
  validateXMLStructure,
} from './xml-utils.js';
import { initializeDefaultTeams } from './default-teams.js';
import {
  Team,
  Agent,
  Human,
  Member,
  TeamsData,
  Workflow,
  isAgent,
  isHuman,
} from '../types/teams.js';
import {
  TeamNotFoundError,
  AgentNotFoundError,
  HumanNotFoundError,
  MemberNotFoundError,
  TeamValidationError,
  WorkflowNotFoundError,
} from '../types/errors.js';

export class TeamsEngine {
  private teamsData: TeamsData | null = null;
  private teamsLoaded = false;

  constructor() {
    // Teams engine is stateless and loads data on-demand
  }

  /**
   * Get teams file path
   *
   * Teams data is persisted to .work/teams.xml following the same pattern
   * as contexts.json in the main WorkEngine.
   */
  private getTeamsFilePath(): string {
    return path.join(process.cwd(), '.work', 'teams.xml');
  }

  /**
   * Load teams from disk, creating defaults if file doesn't exist
   */
  private async loadTeams(): Promise<TeamsData> {
    if (this.teamsLoaded && this.teamsData) {
      return this.teamsData;
    }

    try {
      const teamsPath = this.getTeamsFilePath();

      // Check if teams.xml exists
      try {
        await fs.access(teamsPath);
      } catch {
        // File doesn't exist, create default teams
        // Only log to stderr to avoid interfering with JSON output
        if (process.env['NODE_ENV'] !== 'test') {
          console.error('No teams.xml found, creating default teams...');
        }
        const defaultTeamsData = await initializeDefaultTeams();
        await this.saveTeams(defaultTeamsData);
        this.teamsData = defaultTeamsData;
        this.teamsLoaded = true;
        return this.teamsData;
      }

      // Load existing teams.xml
      const xmlContent = await fs.readFile(teamsPath, 'utf-8');
      this.teamsData = parseTeamsXML(xmlContent);
      this.teamsLoaded = true;

      return this.teamsData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new TeamValidationError(`Failed to load teams: ${message}`);
    }
  }

  /**
   * Save teams to disk
   */
  private async saveTeams(teamsData: TeamsData): Promise<void> {
    try {
      const teamsPath = this.getTeamsFilePath();
      await fs.mkdir(path.dirname(teamsPath), { recursive: true });

      const xmlContent = buildTeamsXML(teamsData);
      await fs.writeFile(teamsPath, xmlContent);

      // Update in-memory data
      this.teamsData = teamsData;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new TeamValidationError(`Failed to save teams: ${message}`);
    }
  }

  /**
   * List all teams
   */
  public async listTeams(): Promise<readonly Team[]> {
    const teamsData = await this.loadTeams();
    return teamsData.teams;
  }

  /**
   * Get specific team by ID
   */
  public async getTeam(teamId: string): Promise<Team> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    return team;
  }

  /**
   * Get agent from specific team
   */
  public async getAgent(teamId: string, agentId: string): Promise<Agent> {
    const team = await this.getTeam(teamId);

    if (!team.agents) {
      throw new AgentNotFoundError(teamId, agentId);
    }

    const agent = team.agents.find(a => a.id === agentId);
    if (!agent) {
      throw new AgentNotFoundError(teamId, agentId);
    }

    return agent;
  }

  /**
   * Get human from specific team
   */
  public async getHuman(teamId: string, humanId: string): Promise<Human> {
    const team = await this.getTeam(teamId);

    if (!team.humans) {
      throw new HumanNotFoundError(teamId, humanId);
    }

    const human = team.humans.find(h => h.id === humanId);
    if (!human) {
      throw new HumanNotFoundError(teamId, humanId);
    }

    return human;
  }

  /**
   * Get any member (agent or human) from specific team
   */
  public async getMember(teamId: string, memberId: string): Promise<Member> {
    const team = await this.getTeam(teamId);

    // Check agents first
    if (team.agents) {
      const agent = team.agents.find(a => a.id === memberId);
      if (agent) {
        return agent;
      }
    }

    // Check humans
    if (team.humans) {
      const human = team.humans.find(h => h.id === memberId);
      if (human) {
        return human;
      }
    }

    throw new MemberNotFoundError(teamId, memberId);
  }

  /**
   * Get workflow from specific agent
   */
  public async getWorkflow(
    teamId: string,
    agentId: string,
    workflowId: string
  ): Promise<Workflow> {
    const agent = await this.getAgent(teamId, agentId);

    if (!agent.workflows) {
      throw new WorkflowNotFoundError(teamId, agentId, workflowId);
    }

    const workflow = agent.workflows.find(w => w.id === workflowId);
    if (!workflow) {
      throw new WorkflowNotFoundError(teamId, agentId, workflowId);
    }

    return workflow;
  }

  /**
   * List all agents across all teams
   */
  public async listAllAgents(): Promise<Array<Agent & { teamId: string }>> {
    const teamsData = await this.loadTeams();
    const agents: Array<Agent & { teamId: string }> = [];

    for (const team of teamsData.teams) {
      if (team.agents) {
        for (const agent of team.agents) {
          agents.push({ ...agent, teamId: team.id });
        }
      }
    }

    return agents;
  }

  /**
   * List all humans across all teams
   */
  public async listAllHumans(): Promise<Array<Human & { teamId: string }>> {
    const teamsData = await this.loadTeams();
    const humans: Array<Human & { teamId: string }> = [];

    for (const team of teamsData.teams) {
      if (team.humans) {
        for (const human of team.humans) {
          humans.push({ ...human, teamId: team.id });
        }
      }
    }

    return humans;
  }

  /**
   * List all members (agents and humans) across all teams
   */
  public async listAllMembers(): Promise<Array<Member & { teamId: string }>> {
    const agents = await this.listAllAgents();
    const humans = await this.listAllHumans();
    return [...agents, ...humans];
  }

  /**
   * Query teams/members by criteria
   */
  public async queryTeams(criteria: {
    type?: 'agent' | 'human';
    team?: string;
    name?: string;
    role?: string;
  }): Promise<Array<(Team | Member) & { teamId?: string }>> {
    const teamsData = await this.loadTeams();
    const results: Array<(Team | Member) & { teamId?: string }> = [];

    for (const team of teamsData.teams) {
      // Filter by team if specified
      if (criteria.team && team.id !== criteria.team) {
        continue;
      }

      // If no type specified, include teams
      if (!criteria.type) {
        if (
          !criteria.name ||
          team.name.toLowerCase().includes(criteria.name.toLowerCase())
        ) {
          results.push(team);
        }
      }

      // Include agents if type matches or not specified
      if (!criteria.type || criteria.type === 'agent') {
        if (team.agents) {
          for (const agent of team.agents) {
            let matches = true;

            if (
              criteria.name &&
              !agent.name.toLowerCase().includes(criteria.name.toLowerCase())
            ) {
              matches = false;
            }

            if (
              criteria.role &&
              !agent.title.toLowerCase().includes(criteria.role.toLowerCase())
            ) {
              matches = false;
            }

            if (matches) {
              results.push({ ...agent, teamId: team.id });
            }
          }
        }
      }

      // Include humans if type matches or not specified
      if (!criteria.type || criteria.type === 'human') {
        if (team.humans) {
          for (const human of team.humans) {
            let matches = true;

            if (
              criteria.name &&
              !human.name.toLowerCase().includes(criteria.name.toLowerCase())
            ) {
              matches = false;
            }

            if (
              criteria.role &&
              !human.title.toLowerCase().includes(criteria.role.toLowerCase())
            ) {
              matches = false;
            }

            if (matches) {
              results.push({ ...human, teamId: team.id });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Validate teams.xml structure and content
   */
  public async validateTeams(): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const teamsPath = this.getTeamsFilePath();

      // Check if file exists
      try {
        await fs.access(teamsPath);
      } catch {
        return {
          isValid: false,
          errors: ['teams.xml file not found'],
          warnings: [],
        };
      }

      // Load and validate XML structure
      const xmlContent = await fs.readFile(teamsPath, 'utf-8');
      const validation = validateXMLStructure(xmlContent);

      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors,
          warnings: [],
        };
      }

      // Additional business logic validation
      const teamsData = await this.loadTeams();
      const warnings: string[] = [];

      // Check for duplicate team IDs
      const teamIds = new Set<string>();
      for (const team of teamsData.teams) {
        if (teamIds.has(team.id)) {
          validation.errors.push(`Duplicate team ID: ${team.id}`);
        }
        teamIds.add(team.id);

        // Check for duplicate member IDs within team
        const memberIds = new Set<string>();

        if (team.agents) {
          for (const agent of team.agents) {
            if (memberIds.has(agent.id)) {
              validation.errors.push(
                `Duplicate member ID in team ${team.id}: ${agent.id}`
              );
            }
            memberIds.add(agent.id);
          }
        }

        if (team.humans) {
          for (const human of team.humans) {
            if (memberIds.has(human.id)) {
              validation.errors.push(
                `Duplicate member ID in team ${team.id}: ${human.id}`
              );
            }
            memberIds.add(human.id);
          }
        }

        // Warning for teams with no members
        const hasMembers =
          (team.agents && team.agents.length > 0) ||
          (team.humans && team.humans.length > 0);
        if (!hasMembers) {
          warnings.push(`Team ${team.id} has no members`);
        }
      }

      return {
        isValid: validation.errors.length === 0,
        errors: validation.errors,
        warnings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        isValid: false,
        errors: [`Validation failed: ${message}`],
        warnings: [],
      };
    }
  }

  /**
   * Get teams configuration file path for CLI commands
   */
  public getConfigPath(): string {
    return this.getTeamsFilePath();
  }

  /**
   * Reset teams to defaults (useful for testing)
   */
  public async resetToDefaults(): Promise<void> {
    const defaultTeamsData = await initializeDefaultTeams();
    await this.saveTeams(defaultTeamsData);

    // Force reload
    this.teamsLoaded = false;
    this.teamsData = null;
  }

  /**
   * Check if member is an agent (type guard helper)
   */
  public isAgent(member: Member): member is Agent {
    return isAgent(member);
  }

  /**
   * Check if member is a human (type guard helper)
   */
  public isHuman(member: Member): member is Human {
    return isHuman(member);
  }
}
