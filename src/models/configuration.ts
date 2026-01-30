/**
 * Configuration models and interfaces
 * Implements interfaces for repository configuration and project settings
 */

import { WorkItemType } from './workItem';
import { ProgrammingLanguage, ICodeTemplate, ICodingStandards } from './codeGeneration';

/**
 * Interface for repository configuration
 * Contains settings for a specific repository including templates and standards
 */
export interface IRepositoryConfig {
  /** Unique identifier for the repository configuration */
  id: string;
  
  /** Name of the repository */
  name: string;
  
  /** URL of the repository (Git remote URL) */
  url: string;
  
  /** Default branch for pull requests (usually 'main' or 'master') */
  defaultBranch: string;
  
  /** Primary programming language for this repository */
  targetLanguage: ProgrammingLanguage;
  
  /** Code templates available for this repository */
  codeTemplates: ICodeTemplate[];
  
  /** Coding standards and conventions for this repository */
  codingStandards: ICodingStandards;
  
  /** Default reviewers for pull requests */
  reviewers: string[];
  
  /** Mapping of area paths to specific configurations */
  areaPathMappings: Record<string, string>;
  
  /** Repository-specific settings */
  settings?: {
    /** Whether to automatically create branches */
    autoCreateBranches: boolean;
    
    /** Whether to automatically create pull requests */
    autoCreatePullRequests: boolean;
    
    /** Whether to automatically assign reviewers */
    autoAssignReviewers: boolean;
    
    /** Branch naming pattern (with placeholders) */
    branchNamingPattern: string;
    
    /** Commit message template */
    commitMessageTemplate: string;
    
    /** Pull request title template */
    pullRequestTitleTemplate: string;
    
    /** Pull request description template */
    pullRequestDescriptionTemplate: string;
  };
  
  /** Authentication configuration */
  authentication?: {
    /** Type of authentication (token, ssh, etc.) */
    type: 'token' | 'ssh' | 'basic';
    
    /** Token or credential reference */
    credentialRef: string;
  };
}

/**
 * Interface for project configuration
 * Contains settings that apply to an entire Azure DevOps project
 */
export interface IProjectConfig {
  /** Azure DevOps project ID */
  projectId: string;
  
  /** Project name */
  projectName: string;
  
  /** Organization URL */
  organizationUrl: string;
  
  /** Default repository configuration */
  defaultRepository: IRepositoryConfig;
  
  /** Repository configurations mapped by repository ID */
  repositories: Record<string, IRepositoryConfig>;
  
  /** Area path to repository mappings */
  areaPathRepositoryMappings: Record<string, string>;
  
  /** Global settings for the project */
  globalSettings: {
    /** Default programming language */
    defaultLanguage: ProgrammingLanguage;
    
    /** Default work item types to process */
    processedWorkItemTypes: WorkItemType[];
    
    /** Webhook validation settings */
    webhookValidation: {
      /** Whether to validate webhook signatures */
      validateSignature: boolean;
      
      /** Secret key for webhook validation */
      secretKey?: string;
    };
    
    /** Retry configuration */
    retryConfig: {
      /** Maximum number of retry attempts */
      maxAttempts: number;
      
      /** Base delay between retries (in milliseconds) */
      baseDelay: number;
      
      /** Maximum delay between retries (in milliseconds) */
      maxDelay: number;
      
      /** Backoff multiplier for exponential backoff */
      backoffMultiplier: number;
    };
  };
}

/**
 * Interface for application configuration
 * Contains global settings for the entire application
 */
export interface IApplicationConfig {
  /** Server configuration */
  server: {
    /** Port to listen on */
    port: number;
    
    /** Host to bind to */
    host: string;
    
    /** Whether to enable HTTPS */
    https: boolean;
    
    /** SSL certificate configuration (if HTTPS enabled) */
    ssl?: {
      /** Path to certificate file */
      certPath: string;
      
      /** Path to private key file */
      keyPath: string;
    };
  };
  
  /** Azure DevOps configuration */
  azureDevOps: {
    /** Organization URL */
    organizationUrl: string;
    
    /** Personal Access Token */
    personalAccessToken: string;
    
    /** API version to use */
    apiVersion: string;
  };
  
  /** Gemini AI configuration */
  gemini: {
    /** API key for Gemini */
    apiKey: string;
    
    /** Model to use for code generation */
    model: string;
    
    /** Temperature for generation (0-1) */
    temperature: number;
    
    /** Maximum tokens to generate */
    maxTokens: number;
  };
  
  /** Git configuration */
  git: {
    /** Global Git user name */
    userName: string;
    
    /** Global Git user email */
    userEmail: string;
    
    /** Default commit message prefix */
    commitMessagePrefix: string;
  };
  
  /** Logging configuration */
  logging: {
    /** Log level (error, warn, info, debug) */
    level: string;
    
    /** Log format (json, simple) */
    format: string;
    
    /** Whether to log to file */
    logToFile: boolean;
    
    /** Log file path (if logging to file) */
    logFilePath?: string;
  };
  
  /** Project configurations mapped by project ID */
  projects: Record<string, IProjectConfig>;
}

/**
 * Interface for environment-specific configuration
 * Allows different settings for development, testing, and production
 */
export interface IEnvironmentConfig {
  /** Environment name (development, test, production) */
  environment: string;
  
  /** Application configuration for this environment */
  config: IApplicationConfig;
  
  /** Environment-specific overrides */
  overrides?: {
    /** Database connection strings */
    database?: Record<string, string>;
    
    /** External service URLs */
    services?: Record<string, string>;
    
    /** Feature flags */
    features?: Record<string, boolean>;
  };
}

/**
 * Interface for configuration validation result
 * Contains the result of validating a configuration
 */
export interface IConfigValidationResult {
  /** Whether the configuration is valid */
  isValid: boolean;
  
  /** Validation errors found */
  errors: IConfigValidationError[];
  
  /** Validation warnings */
  warnings: IConfigValidationError[];
  
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * Interface for configuration validation error
 * Represents a single validation issue in the configuration
 */
export interface IConfigValidationError {
  /** Path to the configuration field with the error */
  path: string;
  
  /** Error message */
  message: string;
  
  /** Severity of the error */
  severity: 'error' | 'warning';
  
  /** Expected value or format */
  expected?: string;
  
  /** Actual value that caused the error */
  actual?: any;
  
  /** Suggested fix for the error */
  suggestedFix?: string;
}

/**
 * Interface for configuration template
 * Represents a template for creating new configurations
 */
export interface IConfigTemplate {
  /** Name of the template */
  name: string;
  
  /** Description of the template */
  description: string;
  
  /** Template version */
  version: string;
  
  /** Template configuration data */
  template: Partial<IApplicationConfig>;
  
  /** Variables that can be substituted in the template */
  variables: Record<string, {
    /** Description of the variable */
    description: string;
    
    /** Default value */
    defaultValue?: any;
    
    /** Whether the variable is required */
    required: boolean;
    
    /** Type of the variable */
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  }>;
  
  /** Template metadata */
  metadata: {
    /** Author of the template */
    author: string;
    
    /** Creation date */
    createdDate: string;
    
    /** Last update date */
    lastUpdated: string;
    
    /** Tags for categorizing the template */
    tags: string[];
  };
}