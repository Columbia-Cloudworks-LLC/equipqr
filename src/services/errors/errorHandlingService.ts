
export interface ErrorContext {
  operation: string;
  component?: string;
  userId?: string;
  organizationId?: string;
  equipmentId?: string;
}

export interface ProcessedError {
  title: string;
  message: string;
  shouldRedirectToAuth: boolean;
  isRetryable: boolean;
}

/**
 * Centralized error handling service for consistent error processing
 */
export class ErrorHandlingService {
  /**
   * Process errors into user-friendly messages
   */
  processError(error: any, context: ErrorContext): ProcessedError {
    const errorMessage = error?.message || 'An unknown error occurred';
    
    // Authentication errors
    if (this.isAuthenticationError(errorMessage)) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please sign in again.',
        shouldRedirectToAuth: true,
        isRetryable: false
      };
    }
    
    // Permission errors
    if (this.isPermissionError(errorMessage)) {
      return {
        title: 'Permission Error',
        message: errorMessage,
        shouldRedirectToAuth: false,
        isRetryable: false
      };
    }
    
    // Organization errors
    if (this.isOrganizationError(errorMessage)) {
      return {
        title: 'Organization Error',
        message: `${errorMessage} Please refresh the page and ensure you have selected a valid organization.`,
        shouldRedirectToAuth: false,
        isRetryable: true
      };
    }
    
    // Server errors
    if (this.isServerError(errorMessage)) {
      return {
        title: 'Server Error',
        message: 'There was an issue with the service. Please try again or contact support if the problem persists.',
        shouldRedirectToAuth: false,
        isRetryable: true
      };
    }
    
    // Default error
    return {
      title: `Failed to ${context.operation}`,
      message: errorMessage,
      shouldRedirectToAuth: false,
      isRetryable: true
    };
  }

  private isAuthenticationError(message: string): boolean {
    return message.includes('Authentication required') || 
           message.includes('sign in') ||
           message.includes('logged in');
  }

  private isPermissionError(message: string): boolean {
    return message.includes('Permission') || 
           message.includes('permission') || 
           message.includes('need to be') ||
           message.includes('access to this team');
  }

  private isOrganizationError(message: string): boolean {
    return message.includes('Organization is required') ||
           message.includes('Organization cannot be empty') ||
           message.includes('Invalid organization selected');
  }

  private isServerError(message: string): boolean {
    return message.includes('Server permission service') ||
           message.includes('Edge Function') ||
           message.includes('function invoke error') ||
           message.includes('System error (Code:');
  }
}

export const errorHandlingService = new ErrorHandlingService();
