/**
 * Centralized formatting utilities for consistent CLI output
 */

import {
  SuccessResponse,
  ErrorResponse,
  ErrorObject,
  Meta,
  ResponseFormat,
} from '../types/response.js';

/**
 * Format successful output for CLI display
 * @param data - The data to format
 * @param format - Output format (table or json)
 * @param meta - Optional metadata to include
 * @returns Formatted string for output
 */
export function formatOutput<T>(
  data: T,
  format: ResponseFormat,
  meta?: Meta
): string {
  if (format === 'json') {
    const response: SuccessResponse<T> = { data };
    if (meta) {
      response.meta = meta;
    }
    return JSON.stringify(response, null, 2) + '\n';
  }

  // For table format, return the data as-is (commands handle table formatting)
  return String(data);
}

/**
 * Format error output for CLI display
 * @param error - Error to format (string or Error object)
 * @param format - Output format (table or json)
 * @param meta - Optional metadata to include
 * @returns Formatted error string
 */
export function formatError(
  error: string | Error,
  format: ResponseFormat = 'table',
  meta?: Meta
): string {
  const errorObj: ErrorObject = {
    message: error instanceof Error ? error.message : error,
  };

  if (error instanceof Error && error.name) {
    errorObj.code = error.name;
  }

  if (format === 'json') {
    const response: ErrorResponse = { errors: [errorObj] };
    if (meta) {
      response.meta = meta;
    }
    return JSON.stringify(response, null, 2) + '\n';
  }

  // For table format, return simple error message
  return errorObj.message;
}

/**
 * Format success response with structured data
 * @param data - The success data
 * @param format - Output format
 * @param meta - Optional metadata
 * @returns Formatted success response
 */
export function formatSuccess<T>(
  data: T,
  format: ResponseFormat,
  meta?: Meta
): string {
  return formatOutput(data, format, meta);
}
