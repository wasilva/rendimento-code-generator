/**
 * Code Generation models and interfaces
 * Implements interfaces for AI-powered code generation using Gemini API
 */

import { IEnrichedWorkItem, WorkItemType } from './workItem';

/**
 * Enum representing supported programming languages for code generation
 */
export enum ProgrammingLanguage {
  TYPESCRIPT = 'typescript',
  JAVASCRIPT = 'javascript',
  PYTHON = 'python',
  CSHARP = 'csharp',
  JAVA = 'java'
}

/**
 * Enum representing different types of generated files
 */
export enum FileType {
  SOURCE = 'source',
  TEST = 'test',
  CONFIG = 'config',
  DOCUMENTATION = 'documentation'
}

/**
 * Interface for project context information used in code generation
 * Provides contextual information about the target project
 */
export interface IProjectContext {
  /** Name of the project */
  projectName: string;
  
  /** Primary programming language of the project */
  primaryLanguage: ProgrammingLanguage;
  
  /** Framework or technology stack being used */
  framework?: string;
  
  /** Version of the framework/language */
  version?: string;
  
  /** Project structure and conventions */
  structure: {
    /** Source code directory */
    sourceDir: string;
    
    /** Test directory */
    testDir: string;
    
    /** Configuration directory */
    configDir?: string;
    
    /** Documentation directory */
    docsDir?: string;
  };
  
  /** Existing dependencies and libraries */
  dependencies: string[];
  
  /** Development dependencies */
  devDependencies: string[];
  
  /** Build and deployment configuration */
  buildConfig?: {
    /** Build command */
    buildCommand: string;
    
    /** Test command */
    testCommand: string;
    
    /** Start/run command */
    startCommand: string;
  };
}

/**
 * Interface for coding standards and conventions
 * Defines the coding style and quality rules for generated code
 */
export interface ICodingStandards {
  /** Linting rules configuration (ESLint, Pylint, etc.) */
  lintingRules: string;
  
  /** Code formatting configuration (Prettier, Black, etc.) */
  formattingConfig: string;
  
  /** Naming conventions for different code elements */
  namingConventions: {
    /** Variable naming convention (camelCase, snake_case, etc.) */
    variables: string;
    
    /** Function naming convention */
    functions: string;
    
    /** Class naming convention */
    classes: string;
    
    /** Constant naming convention */
    constants: string;
    
    /** File naming convention */
    files: string;
    
    /** Directory naming convention */
    directories: string;
  };
  
  /** File structure rules and patterns */
  fileStructure: IFileStructureRule[];
  
  /** Code quality thresholds */
  qualityThresholds?: {
    /** Maximum cyclomatic complexity */
    maxComplexity: number;
    
    /** Maximum function length */
    maxFunctionLength: number;
    
    /** Maximum file length */
    maxFileLength: number;
    
    /** Minimum test coverage percentage */
    minTestCoverage: number;
  };
}

/**
 * Interface for file structure rules
 * Defines how files should be organized and structured
 */
export interface IFileStructureRule {
  /** Pattern to match file paths */
  pattern: string;
  
  /** Required directory structure */
  requiredStructure: string[];
  
  /** Naming convention for this pattern */
  namingConvention: string;
  
  /** Whether this rule is mandatory */
  mandatory: boolean;
  
  /** Description of the rule */
  description: string;
}

/**
 * Interface for template file definition
 * Represents a single template file used in code generation
 */
export interface ITemplateFile {
  /** Name of the template file */
  name: string;
  
  /** Path where the generated file should be placed */
  targetPath: string;
  
  /** Template content with placeholders */
  content: string;
  
  /** Type of file being generated */
  fileType: FileType;
  
  /** Programming language of the template */
  language: ProgrammingLanguage;
  
  /** Variables that can be substituted in the template */
  variables: string[];
  
  /** Conditions under which this template should be used */
  conditions?: {
    /** Work item types this template applies to */
    workItemTypes?: WorkItemType[];
    
    /** Required fields in the work item */
    requiredFields?: string[];
    
    /** Custom conditions */
    customConditions?: string[];
  };
}

/**
 * Interface for code template definition
 * Represents a complete template for generating code from work items
 */
export interface ICodeTemplate {
  /** Unique name of the template */
  name: string;
  
  /** Description of what this template generates */
  description: string;
  
  /** Work item types this template can handle */
  workItemTypes: WorkItemType[];
  
  /** Template files that make up this template */
  templateFiles: ITemplateFile[];
  
  /** Default variables and their values */
  variables: Record<string, string>;
  
  /** Dependencies that should be added when using this template */
  dependencies?: string[];
  
  /** Development dependencies */
  devDependencies?: string[];
  
  /** Post-generation scripts to run */
  postGenerationScripts?: string[];
  
  /** Template metadata */
  metadata: {
    /** Version of the template */
    version: string;
    
    /** Author of the template */
    author: string;
    
    /** Date when template was created */
    createdDate: string;
    
    /** Date when template was last updated */
    lastUpdated: string;
    
    /** Tags for categorizing the template */
    tags: string[];
  };
}

/**
 * Interface for code generation prompt sent to AI
 * Contains all information needed for the AI to generate appropriate code
 */
export interface ICodeGenerationPrompt {
  /** Work item being processed */
  workItem: IEnrichedWorkItem;
  
  /** Target programming language for generation */
  targetLanguage: ProgrammingLanguage;
  
  /** Project context information */
  projectContext: IProjectContext;
  
  /** Code templates to use for generation */
  codeTemplates: ICodeTemplate[];
  
  /** Coding standards to follow */
  codingStandards: ICodingStandards;
  
  /** Additional instructions for the AI */
  instructions?: {
    /** Specific requirements or constraints */
    requirements?: string[];
    
    /** Code patterns to follow */
    patterns?: string[];
    
    /** Libraries or frameworks to use */
    preferredLibraries?: string[];
    
    /** Code style preferences */
    stylePreferences?: string[];
  };
  
  /** Context from existing codebase */
  existingCodeContext?: {
    /** Related files that might be relevant */
    relatedFiles?: string[];
    
    /** Existing interfaces or types to reuse */
    existingTypes?: string[];
    
    /** Existing functions or methods to integrate with */
    existingFunctions?: string[];
  };
}

/**
 * Interface for a single generated file
 * Represents one file generated by the AI
 */
export interface IGeneratedFile {
  /** Path where the file should be created */
  path: string;
  
  /** Content of the generated file */
  content: string;
  
  /** Programming language of the file */
  language: ProgrammingLanguage;
  
  /** Type of file (source, test, config, etc.) */
  type: FileType;
  
  /** File metadata */
  metadata?: {
    /** Size of the file in bytes */
    size: number;
    
    /** Number of lines in the file */
    lines: number;
    
    /** Estimated complexity score */
    complexity?: number;
    
    /** Dependencies used in this file */
    dependencies?: string[];
  };
}

/**
 * Interface for generated code result from AI
 * Contains all files and information generated for a work item
 */
export interface IGeneratedCode {
  /** Generated source files */
  files: IGeneratedFile[];
  
  /** Generated test files */
  tests: IGeneratedFile[];
  
  /** Generated documentation */
  documentation: string;
  
  /** Dependencies that should be added to the project */
  dependencies: string[];
  
  /** Development dependencies */
  devDependencies?: string[];
  
  /** Build instructions for the generated code */
  buildInstructions: string;
  
  /** Installation instructions */
  installationInstructions?: string;
  
  /** Usage examples */
  usageExamples?: string[];
  
  /** Generation metadata */
  metadata: {
    /** Total number of files generated */
    totalFiles: number;
    
    /** Total lines of code generated */
    totalLines: number;
    
    /** Time taken to generate the code */
    generationTime: number;
    
    /** AI model used for generation */
    aiModel: string;
    
    /** Template used for generation */
    templateUsed: string;
    
    /** Confidence score of the generation (0-1) */
    confidenceScore?: number;
  };
}

/**
 * Interface for code validation result
 * Contains the result of validating generated code
 */
export interface IValidationResult {
  /** Whether the code is valid */
  isValid: boolean;
  
  /** Syntax errors found in the code */
  syntaxErrors: ICodeIssue[];
  
  /** Linting issues found in the code */
  lintingIssues: ICodeIssue[];
  
  /** Style violations found in the code */
  styleViolations: ICodeIssue[];
  
  /** Security issues found in the code */
  securityIssues: ICodeIssue[];
  
  /** Performance warnings */
  performanceWarnings: ICodeIssue[];
  
  /** Overall quality score (0-100) */
  qualityScore: number;
  
  /** Suggestions for improvement */
  suggestions: string[];
  
  /** Whether the code can be automatically fixed */
  canAutoFix: boolean;
}

/**
 * Interface for code issues found during validation
 * Represents a single issue in the generated code
 */
export interface ICodeIssue {
  /** Type of issue (syntax, style, security, etc.) */
  type: 'syntax' | 'style' | 'security' | 'performance' | 'logic' | 'naming';
  
  /** Severity of the issue */
  severity: 'error' | 'warning' | 'info';
  
  /** Description of the issue */
  message: string;
  
  /** File where the issue was found */
  file: string;
  
  /** Line number where the issue occurs */
  line: number;
  
  /** Column number where the issue occurs */
  column?: number;
  
  /** Rule that was violated (for linting issues) */
  rule?: string;
  
  /** Suggested fix for the issue */
  suggestedFix?: string;
  
  /** Whether this issue can be automatically fixed */
  canAutoFix: boolean;
}

/**
 * Interface for code generation configuration
 * Contains settings that control how code is generated
 */
export interface ICodeGenerationConfig {
  /** Default programming language */
  defaultLanguage: ProgrammingLanguage;
  
  /** Available templates */
  templates: ICodeTemplate[];
  
  /** Default coding standards */
  defaultCodingStandards: ICodingStandards;
  
  /** AI model configuration */
  aiConfig: {
    /** Model name to use */
    model: string;
    
    /** Temperature for generation (0-1) */
    temperature: number;
    
    /** Maximum tokens to generate */
    maxTokens: number;
    
    /** Number of attempts for generation */
    maxAttempts: number;
  };
  
  /** Validation configuration */
  validationConfig: {
    /** Whether to validate syntax */
    validateSyntax: boolean;
    
    /** Whether to run linting */
    runLinting: boolean;
    
    /** Whether to check security */
    checkSecurity: boolean;
    
    /** Whether to attempt auto-fixing */
    attemptAutoFix: boolean;
    
    /** Maximum number of fix attempts */
    maxFixAttempts: number;
  };
  
  /** Output configuration */
  outputConfig: {
    /** Whether to generate tests */
    generateTests: boolean;
    
    /** Whether to generate documentation */
    generateDocumentation: boolean;
    
    /** Whether to include usage examples */
    includeExamples: boolean;
    
    /** Whether to include build instructions */
    includeBuildInstructions: boolean;
  };
}