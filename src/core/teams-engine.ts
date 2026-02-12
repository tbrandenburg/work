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
  CreateTeamRequest,
  UpdateTeamRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  CreateHumanRequest,
  UpdateHumanRequest,
} from '../types/teams.js';
import {
  TeamNotFoundError,
  AgentNotFoundError,
  HumanNotFoundError,
  MemberNotFoundError,
  TeamValidationError,
  WorkflowNotFoundError,
  DuplicateTeamIdError,
  InvalidTeamConfigError,
  BackupFailedError,
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

  /**
   * Load teams data (public method for import/export operations)
   */
  public async loadTeamsData(): Promise<TeamsData> {
    return await this.loadTeams();
  }

  /**
   * Save teams data (public method for import/export operations)
   */
  public async saveTeamsData(data: TeamsData): Promise<void> {
    await this.saveTeams(data);
    // Force reload
    this.teamsLoaded = false;
    this.teamsData = null;
  }

  /**
   * Create a backup copy of teams.xml before destructive operations (public method)
   */
  public async createBackup(): Promise<string> {
    return await this.createBackupInternal();
  }

  /**
   * Create a backup copy of teams.xml before destructive operations
   */
  private async createBackupInternal(): Promise<string> {
    try {
      const teamsPath = this.getTeamsFilePath();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = teamsPath.replace('.xml', `-backup-${timestamp}.xml`);

      try {
        await fs.access(teamsPath);
        await fs.copyFile(teamsPath, backupPath);
      } catch {
        // If original doesn't exist, no backup needed
      }

      return backupPath;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BackupFailedError(this.getTeamsFilePath(), message);
    }
  }

  /**
   * Create a new team
   */
  public async createTeam(request: CreateTeamRequest): Promise<Team> {
    const teamsData = await this.loadTeams();

    // Check for duplicate team ID
    const existingTeam = teamsData.teams.find(t => t.id === request.id);
    if (existingTeam) {
      throw new DuplicateTeamIdError(request.id);
    }

    // Validate required fields
    if (
      !request.id ||
      !request.name ||
      !request.title ||
      !request.description
    ) {
      throw new InvalidTeamConfigError(
        'Missing required fields: id, name, title, description'
      );
    }

    // Validate ID format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(request.id)) {
      throw new InvalidTeamConfigError(
        'Team ID must contain only alphanumeric characters and hyphens'
      );
    }

    // Create backup before modification
    await this.createBackupInternal();

    const newTeam: Team = {
      id: request.id,
      name: request.name,
      title: request.title,
      description: request.description,
      icon: request.icon,
      agents: [],
      humans: [],
    };

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: [...teamsData.teams, newTeam],
    };

    await this.saveTeams(updatedTeamsData);
    return newTeam;
  }

  /**
   * Update an existing team
   */
  public async updateTeam(
    teamId: string,
    updates: UpdateTeamRequest
  ): Promise<Team> {
    const teamsData = await this.loadTeams();

    const teamIndex = teamsData.teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) {
      throw new TeamNotFoundError(teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const existingTeam = teamsData.teams[teamIndex]!;
    const updatedTeam: Team = {
      id: existingTeam.id,
      name: updates.name ?? existingTeam.name,
      title: updates.title ?? existingTeam.title,
      description: updates.description ?? existingTeam.description,
      icon: updates.icon !== undefined ? updates.icon : existingTeam.icon,
      agents: existingTeam.agents,
      humans: existingTeam.humans,
    };

    const updatedTeams = [...teamsData.teams];
    updatedTeams[teamIndex] = updatedTeam;

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
    return updatedTeam;
  }

  /**
   * Delete an existing team
   */
  public async deleteTeam(teamId: string): Promise<void> {
    const teamsData = await this.loadTeams();

    const teamIndex = teamsData.teams.findIndex(t => t.id === teamId);
    if (teamIndex === -1) {
      throw new TeamNotFoundError(teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const updatedTeams = teamsData.teams.filter(t => t.id !== teamId);
    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
  }

  /**
   * Add an agent to a team
   */
  public async addAgent(
    teamId: string,
    request: CreateAgentRequest
  ): Promise<Agent> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Check for duplicate member ID within team
    const existingAgent = team.agents?.find(a => a.id === request.id);
    const existingHuman = team.humans?.find(h => h.id === request.id);
    if (existingAgent || existingHuman) {
      throw new DuplicateTeamIdError(
        `Member ID ${request.id} already exists in team ${teamId}`
      );
    }

    // Validate required fields
    if (!request.id || !request.name || !request.title || !request.persona) {
      throw new InvalidTeamConfigError(
        'Missing required fields: id, name, title, persona'
      );
    }

    // Validate ID format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(request.id)) {
      throw new InvalidTeamConfigError(
        'Agent ID must contain only alphanumeric characters and hyphens'
      );
    }

    // Create backup before modification
    await this.createBackupInternal();

    const newAgent: Agent = {
      id: request.id,
      name: request.name,
      title: request.title,
      icon: request.icon,
      persona: request.persona,
      commands: request.commands,
      activation: request.activation,
      workflows: request.workflows,
    };

    // Update team with new agent
    const updatedTeam: Team = {
      ...team,
      agents: [...(team.agents || []), newAgent],
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
    return newAgent;
  }

  /**
   * Update an existing agent
   */
  public async updateAgent(
    teamId: string,
    agentId: string,
    updates: UpdateAgentRequest
  ): Promise<Agent> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const agentIndex = team.agents?.findIndex(a => a.id === agentId) ?? -1;
    if (agentIndex === -1) {
      throw new MemberNotFoundError(agentId, teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const existingAgent = team.agents![agentIndex]!;
    const updatedAgent: Agent = {
      id: existingAgent.id,
      name: updates.name ?? existingAgent.name,
      title: updates.title ?? existingAgent.title,
      icon: updates.icon !== undefined ? updates.icon : existingAgent.icon,
      persona: updates.persona ?? existingAgent.persona,
      commands: updates.commands ?? existingAgent.commands,
      activation: updates.activation ?? existingAgent.activation,
      workflows: updates.workflows ?? existingAgent.workflows,
    };

    const updatedAgents = [...team.agents!];
    updatedAgents[agentIndex] = updatedAgent;

    const updatedTeam: Team = {
      ...team,
      agents: updatedAgents,
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
    return updatedAgent;
  }

  /**
   * Remove an agent from a team
   */
  public async removeAgent(teamId: string, agentId: string): Promise<void> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const agentExists = team.agents?.some(a => a.id === agentId) ?? false;
    if (!agentExists) {
      throw new MemberNotFoundError(agentId, teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const updatedAgents = team.agents?.filter(a => a.id !== agentId) ?? [];
    const updatedTeam: Team = {
      ...team,
      agents: updatedAgents,
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
  }

  /**
   * Add a human to a team
   */
  public async addHuman(
    teamId: string,
    request: CreateHumanRequest
  ): Promise<Human> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Check for duplicate member ID within team
    const existingAgent = team.agents?.find(a => a.id === request.id);
    const existingHuman = team.humans?.find(h => h.id === request.id);
    if (existingAgent || existingHuman) {
      throw new DuplicateTeamIdError(
        `Member ID ${request.id} already exists in team ${teamId}`
      );
    }

    // Validate required fields
    if (!request.id || !request.name || !request.title || !request.persona) {
      throw new InvalidTeamConfigError(
        'Missing required fields: id, name, title, persona'
      );
    }

    // Validate ID format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(request.id)) {
      throw new InvalidTeamConfigError(
        'Human ID must contain only alphanumeric characters and hyphens'
      );
    }

    // Create backup before modification
    await this.createBackupInternal();

    const newHuman: Human = {
      id: request.id,
      name: request.name,
      title: request.title,
      icon: request.icon,
      persona: request.persona,
      platforms: request.platforms,
      contact: request.contact,
    };

    // Update team with new human
    const updatedTeam: Team = {
      ...team,
      humans: [...(team.humans || []), newHuman],
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
    return newHuman;
  }

  /**
   * Update an existing human
   */
  public async updateHuman(
    teamId: string,
    humanId: string,
    updates: UpdateHumanRequest
  ): Promise<Human> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const humanIndex = team.humans?.findIndex(h => h.id === humanId) ?? -1;
    if (humanIndex === -1) {
      throw new MemberNotFoundError(humanId, teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const existingHuman = team.humans![humanIndex]!;
    const updatedHuman: Human = {
      id: existingHuman.id,
      name: updates.name ?? existingHuman.name,
      title: updates.title ?? existingHuman.title,
      icon: updates.icon !== undefined ? updates.icon : existingHuman.icon,
      persona: updates.persona ?? existingHuman.persona,
      platforms: updates.platforms ?? existingHuman.platforms,
      contact: updates.contact ?? existingHuman.contact,
    };

    const updatedHumans = [...team.humans!];
    updatedHumans[humanIndex] = updatedHuman;

    const updatedTeam: Team = {
      ...team,
      humans: updatedHumans,
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
    return updatedHuman;
  }

  /**
   * Remove a human from a team
   */
  public async removeHuman(teamId: string, humanId: string): Promise<void> {
    const teamsData = await this.loadTeams();

    const team = teamsData.teams.find(t => t.id === teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const humanExists = team.humans?.some(h => h.id === humanId) ?? false;
    if (!humanExists) {
      throw new MemberNotFoundError(humanId, teamId);
    }

    // Create backup before modification
    await this.createBackupInternal();

    const updatedHumans = team.humans?.filter(h => h.id !== humanId) ?? [];
    const updatedTeam: Team = {
      ...team,
      humans: updatedHumans,
    };

    const updatedTeams = teamsData.teams.map(t =>
      t.id === teamId ? updatedTeam : t
    );

    const updatedTeamsData: TeamsData = {
      ...teamsData,
      teams: updatedTeams,
    };

    await this.saveTeams(updatedTeamsData);
  }
}
