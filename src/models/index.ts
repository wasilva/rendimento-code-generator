/**
 * Data models and interfaces for the Redimento Code Generator
 * Exports all interfaces and types used throughout the application
 */

// Work Item models
export {
  WorkItemType,
  IWorkItemWebhookPayload,
  IEnrichedWorkItem,
  IWorkItemField,
  IProcessingResult
} from './workItem';

// Azure DevOps API models
export {
  IWorkItem,
  IWorkItemRelation,
  IProject,
  ITeam,
  IWorkItemComment,
  ICreateWorkItemComment,
  IPullRequest,
  IPullRequestReviewer,
  ICreatePullRequest,
  IApiResponse,
  IApiError,
  IWorkItemUpdate,
  IWorkItemBatchUpdate,
  IWebhookSubscription
} from './azureDevOps';

// Code Generation models
export {
  ProgrammingLanguage,
  FileType,
  IProjectContext,
  ICodingStandards,
  IFileStructureRule,
  ITemplateFile,
  ICodeTemplate,
  ICodeGenerationPrompt,
  IGeneratedFile,
  IGeneratedCode,
  IValidationResult,
  ICodeIssue,
  ICodeGenerationConfig
} from './codeGeneration';

// Configuration models
export {
  IRepositoryConfig,
  IProjectConfig,
  IApplicationConfig,
  IEnvironmentConfig,
  IConfigValidationResult,
  IConfigValidationError,
  IConfigTemplate
} from './configuration';

// Git models
export {
  FileOperation,
  BranchType,
  IFileChange,
  ICommitInfo,
  IBranchInfo,
  IPullRequestData,
  IRepositoryInfo,
  IGitOperationResult,
  IMergeConflict,
  IBranchProtectionRule,
  IGitWebhookConfig,
  ITagInfo,
  IDiffInfo
} from './git';
