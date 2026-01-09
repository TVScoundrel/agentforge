/**
 * Type definitions for {{TOOL_NAME}} tool
 */

/**
 * Input type for {{TOOL_NAME}} tool
 */
export interface {{TOOL_NAME_PASCAL}}Input {
  /**
   * Input parameter
   * TODO: Define your input properties
   */
  input: string;
}

/**
 * Output type for {{TOOL_NAME}} tool
 */
export interface {{TOOL_NAME_PASCAL}}Output {
  /**
   * Whether the operation was successful
   */
  success: boolean;
  
  /**
   * Result data (when successful)
   */
  data?: any;
  
  /**
   * Error message (when failed)
   */
  error?: string;
  
  /**
   * Additional metadata
   */
  metadata?: {
    /**
     * Response time in milliseconds
     */
    responseTime?: number;
    
    /**
     * Additional context
     */
    [key: string]: any;
  };
}

