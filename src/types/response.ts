/**
 * Response format types for consistent CLI output
 * Based on JSON:API specification principles adapted for CLI use
 */

/**
 * Output format options for CLI commands
 */
export type ResponseFormat = 'table' | 'json';

/**
 * Metadata that can be included with responses
 */
export interface Meta {
  /** Total number of items (for paginated responses) */
  total?: number;
  /** Timestamp of the response */
  timestamp?: string;
  /** Additional metadata fields */
  [key: string]: unknown;
}

/**
 * Error object structure for consistent error reporting
 */
export interface ErrorObject {
  /** Error code or identifier */
  code?: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: unknown;
}

/**
 * Successful response structure
 * Data and errors are mutually exclusive per JSON:API spec
 */
export interface SuccessResponse<T = unknown> {
  /** The response data */
  data: T;
  /** Optional metadata */
  meta?: Meta;
}

/**
 * Error response structure
 * Data and errors are mutually exclusive per JSON:API spec
 */
export interface ErrorResponse {
  /** Array of error objects */
  errors: ErrorObject[];
  /** Optional metadata */
  meta?: Meta;
}

/**
 * Union type for all possible response structures
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;
