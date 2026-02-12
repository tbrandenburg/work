/**
 * Default team template loading utilities.
 *
 * Loads XML templates from src/templates/ directory and parses them into Team objects.
 * Provides default teams (sw-dev-team, research-team) for initialization.
 */

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseTeamsXML } from './xml-utils.js';
import { Team, TeamsData } from '../types/teams.js';
import { TeamValidationError } from '../types/errors.js';

// Get the directory of this module for template loading
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load default teams from templates directory.
 * Returns pre-installed sw-dev-team and research-team configurations.
 */
export async function loadDefaultTeams(): Promise<Team[]> {
  const teams: Team[] = [];

  try {
    // Load sw-dev-team template
    const swDevTeam = await loadTeamTemplate('sw-dev-team.xml');
    if (swDevTeam) {
      teams.push(swDevTeam);
    }

    // Load research-team template
    const researchTeam = await loadTeamTemplate('research-team.xml');
    if (researchTeam) {
      teams.push(researchTeam);
    }

    if (teams.length === 0) {
      throw new TeamValidationError(
        'No default teams could be loaded from templates'
      );
    }

    return teams;
  } catch (error) {
    if (error instanceof TeamValidationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new TeamValidationError(`Failed to load default teams: ${message}`);
  }
}

/**
 * Load a specific team template by filename.
 * Returns the first team from the template file, or null if loading fails.
 */
export async function loadTeamTemplate(filename: string): Promise<Team | null> {
  try {
    const templatePath = getTemplatePath(filename);
    const xmlContent = await readFile(templatePath, 'utf-8');

    const teamsData = parseTeamsXML(xmlContent);

    if (!teamsData.teams || teamsData.teams.length === 0) {
      throw new TeamValidationError(`Template ${filename} contains no teams`);
    }

    // Return the first team from the template
    return teamsData.teams[0] || null;
  } catch (error) {
    if (error instanceof TeamValidationError) {
      throw error;
    }

    // Log warning but don't throw - allows system to continue with partial teams
    console.warn(`Warning: Could not load team template ${filename}:`, error);
    return null;
  }
}

/**
 * Get the content of a template file as raw XML string.
 * Used for debugging and direct XML access.
 */
export async function getTemplateXMLContent(filename: string): Promise<string> {
  try {
    const templatePath = getTemplatePath(filename);
    return await readFile(templatePath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new TeamValidationError(
      `Failed to read template ${filename}: ${message}`
    );
  }
}

/**
 * Initialize default teams structure.
 * Creates a TeamsData object with default teams and version information.
 */
export async function initializeDefaultTeams(): Promise<TeamsData> {
  try {
    const teams = await loadDefaultTeams();

    return {
      teams: teams,
      version: '1.0',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new TeamValidationError(
      `Failed to initialize default teams: ${message}`
    );
  }
}

/**
 * Get the full path to a template file.
 * Resolves relative to the src/templates directory.
 */
function getTemplatePath(filename: string): string {
  // Go up from src/core to src/templates
  return join(__dirname, '..', 'templates', filename);
}

/**
 * Check if a template file exists.
 * Returns true if the template can be loaded, false otherwise.
 */
export async function templateExists(filename: string): Promise<boolean> {
  try {
    await getTemplateXMLContent(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * List available template files in the templates directory.
 * Returns array of filenames (without path).
 */
export async function listAvailableTemplates(): Promise<string[]> {
  try {
    const { readdir } = await import('fs/promises');
    const templatesPath = join(__dirname, '..', 'templates');

    const files = await readdir(templatesPath);
    return files.filter(file => file.endsWith('.xml'));
  } catch (error) {
    // Return empty array if directory doesn't exist or can't be read
    console.warn('Could not list template directory:', error);
    return [];
  }
}
