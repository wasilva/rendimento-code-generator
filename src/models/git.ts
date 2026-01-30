/**
 * Git models and interfaces
 * Implements interfaces for Git operations and pull request management
 */

/**
 * Enum representing different Git file operations
 */
export enum FileOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RENAME = 'rename'
}

/**
 * Enum representing Git branch types
 */
export enum BranchType {
  FEATURE = 'feature',
  BUGFIX = 'bugfix',
  HOTFIX = 'hotfix',
  RELEASE = 'release',
  DEVELOP = 'develop',
  MAIN = 'main'
}

/**
 * Interface for file changes in Git operations
 * Represents a single file change to be committed
 */
export interface IFileChange {
  /** Path to the file relative to repository root */
  path: string;
  
  /** Content of the file (for create/update operations) */
  content: string;
  
  /** Type of operation to perform on the file */
  operation: FileOperation;
  
  /** Previous path (for rename operations) */
  previousPath?: string;
  
  /** File metadata */
  metadata?: {
    /** File size in bytes */
    size: number;
    
    /** File encoding (utf-8, binary, etc.) */
    encoding: string;
    
    /** MIME type of the file */
    mimeType?: string;
    
    /** Whether the file is executable */
    executable?: boolean;
  };
}

/**
 * Interface for Git commit information
 * Contains details about a Git commit
 */
export interface ICommitInfo {
  /** SHA hash of the commit */
  sha: string;
  
  /** Commit message */
  message: string;
  
  /** Author information */
  author: {
    /** Author name */
    name: string;
    
    /** Author email */
    email: string;
    
    /** Commit date */
    date: string;
  };
  
  /** Committer information (may differ from author) */
  committer: {
    /** Committer name */
    name: string;
    
    /** Committer email */
    email: string;
    
    /** Commit date */
    date: string;
  };
  
  /** Parent commit SHAs */
  parents: string[];
  
  /** Files changed in this commit */
  files?: IFileChange[];
  
  /** Commit statistics */
  stats?: {
    /** Number of files changed */
    filesChanged: number;
    
    /** Number of lines added */
    additions: number;
    
    /** Number of lines deleted */
    deletions: number;
  };
}

/**
 * Interface for Git branch information
 * Contains details about a Git branch
 */
export interface IBranchInfo {
  /** Name of the branch */
  name: string;
  
  /** Type of branch */
  type: BranchType;
  
  /** SHA of the latest commit on this branch */
  latestCommit: string;
  
  /** Branch this was created from */
  baseBranch: string;
  
  /** Whether this is the default branch */
  isDefault: boolean;
  
  /** Whether this branch is protected */
  isProtected: boolean;
  
  /** Creation date of the branch */
  createdDate: string;
  
  /** Last activity date on the branch */
  lastActivityDate: string;
  
  /** Author who created the branch */
  createdBy: {
    /** Author name */
    name: string;
    
    /** Author email */
    email: string;
  };
}

/**
 * Interface for pull request data
 * Contains all information needed to create or manage a pull request
 */
export interface IPullRequestData {
  /** Title of the pull request */
  title: string;
  
  /** Detailed description of the pull request */
  description: string;
  
  /** Source branch name (branch being merged) */
  sourceBranch: string;
  
  /** Target branch name (branch being merged into) */
  targetBranch: string;
  
  /** Reviewers to assign to the pull request */
  reviewers: string[];
  
  /** Work item IDs linked to this pull request */
  workItemIds: number[];
  
  /** Labels/tags to apply to the pull request */
  labels: string[];
  
  /** Whether the pull request should be created as draft */
  isDraft?: boolean;
  
  /** Whether to auto-complete the pull request when approved */
  autoComplete?: boolean;
  
  /** Pull request options */
  options?: {
    /** Whether to delete source branch after merge */
    deleteSourceBranch: boolean;
    
    /** Whether to squash commits when merging */
    squashMerge: boolean;
    
    /** Whether to bypass policy requirements */
    bypassPolicy: boolean;
    
    /** Merge strategy to use */
    mergeStrategy: 'merge' | 'squash' | 'rebase';
  };
  
  /** Additional metadata */
  metadata?: {
    /** Work item that triggered this PR */
    triggeringWorkItem: number;
    
    /** Template used for code generation */
    codeTemplate?: string;
    
    /** AI model used for generation */
    aiModel?: string;
    
    /** Generation timestamp */
    generatedAt: string;
  };
}

/**
 * Interface for Git repository information
 * Contains details about a Git repository
 */
export interface IRepositoryInfo {
  /** Repository ID */
  id: string;
  
  /** Repository name */
  name: string;
  
  /** Repository URL */
  url: string;
  
  /** Clone URL for the repository */
  cloneUrl: string;
  
  /** Default branch name */
  defaultBranch: string;
  
  /** Repository size in bytes */
  size: number;
  
  /** Whether the repository is private */
  isPrivate: boolean;
  
  /** Repository description */
  description?: string;
  
  /** Repository topics/tags */
  topics: string[];
  
  /** Repository statistics */
  stats: {
    /** Number of commits */
    commitCount: number;
    
    /** Number of branches */
    branchCount: number;
    
    /** Number of contributors */
    contributorCount: number;
    
    /** Last activity date */
    lastActivityDate: string;
  };
  
  /** Repository permissions */
  permissions: {
    /** Whether current user can read */
    canRead: boolean;
    
    /** Whether current user can write */
    canWrite: boolean;
    
    /** Whether current user can admin */
    canAdmin: boolean;
  };
}

/**
 * Interface for Git operation result
 * Contains the result of a Git operation
 */
export interface IGitOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  
  /** Error message if operation failed */
  error?: string;
  
  /** Result data specific to the operation */
  data?: {
    /** Commit SHA (for commit operations) */
    commitSha?: string;
    
    /** Branch name (for branch operations) */
    branchName?: string;
    
    /** Pull request ID (for PR operations) */
    pullRequestId?: number;
    
    /** Files affected by the operation */
    affectedFiles?: string[];
  };
  
  /** Operation metadata */
  metadata: {
    /** Time taken to complete the operation */
    duration: number;
    
    /** Timestamp when operation completed */
    completedAt: string;
    
    /** Operation type */
    operationType: string;
  };
}

/**
 * Interface for Git merge conflict information
 * Contains details about merge conflicts
 */
export interface IMergeConflict {
  /** File path where conflict occurred */
  filePath: string;
  
  /** Type of conflict */
  conflictType: 'content' | 'rename' | 'delete' | 'mode';
  
  /** Content from the source branch */
  sourceContent: string;
  
  /** Content from the target branch */
  targetContent: string;
  
  /** Common ancestor content */
  baseContent?: string;
  
  /** Line numbers where conflict occurs */
  conflictLines: {
    /** Starting line number */
    start: number;
    
    /** Ending line number */
    end: number;
  };
  
  /** Whether the conflict can be auto-resolved */
  canAutoResolve: boolean;
  
  /** Suggested resolution */
  suggestedResolution?: string;
}

/**
 * Interface for Git branch protection rules
 * Contains rules that protect branches from direct pushes
 */
export interface IBranchProtectionRule {
  /** Branch pattern this rule applies to */
  branchPattern: string;
  
  /** Whether to require pull request reviews */
  requirePullRequestReviews: boolean;
  
  /** Number of required reviewers */
  requiredReviewerCount: number;
  
  /** Whether to dismiss stale reviews */
  dismissStaleReviews: boolean;
  
  /** Whether to require code owner reviews */
  requireCodeOwnerReviews: boolean;
  
  /** Whether to require status checks */
  requireStatusChecks: boolean;
  
  /** Required status check contexts */
  requiredStatusChecks: string[];
  
  /** Whether to require branches to be up to date */
  requireUpToDateBranches: boolean;
  
  /** Whether to restrict pushes */
  restrictPushes: boolean;
  
  /** Users/teams allowed to push */
  allowedPushers: string[];
  
  /** Whether admins are subject to these rules */
  enforceForAdmins: boolean;
}

/**
 * Interface for Git webhook configuration
 * Contains settings for Git repository webhooks
 */
export interface IGitWebhookConfig {
  /** Webhook URL */
  url: string;
  
  /** Events that trigger the webhook */
  events: string[];
  
  /** Whether the webhook is active */
  active: boolean;
  
  /** Secret for webhook validation */
  secret?: string;
  
  /** Content type for webhook payload */
  contentType: 'json' | 'form';
  
  /** Whether to verify SSL certificates */
  insecureSsl: boolean;
  
  /** Webhook configuration */
  config: {
    /** URL to send webhooks to */
    url: string;
    
    /** Content type */
    content_type: string;
    
    /** Secret for validation */
    secret?: string;
    
    /** Whether to verify SSL */
    insecure_ssl: string;
  };
}

/**
 * Interface for Git tag information
 * Contains details about a Git tag
 */
export interface ITagInfo {
  /** Tag name */
  name: string;
  
  /** Commit SHA the tag points to */
  commitSha: string;
  
  /** Tag message */
  message?: string;
  
  /** Tagger information */
  tagger?: {
    /** Tagger name */
    name: string;
    
    /** Tagger email */
    email: string;
    
    /** Tag date */
    date: string;
  };
  
  /** Whether this is a lightweight tag */
  isLightweight: boolean;
  
  /** Tag type (commit, tree, blob, tag) */
  objectType: string;
}

/**
 * Interface for Git diff information
 * Contains details about differences between commits or branches
 */
export interface IDiffInfo {
  /** Files that were changed */
  files: {
    /** File path */
    path: string;
    
    /** Previous file path (for renames) */
    previousPath?: string;
    
    /** Type of change */
    changeType: 'added' | 'modified' | 'deleted' | 'renamed';
    
    /** Number of additions */
    additions: number;
    
    /** Number of deletions */
    deletions: number;
    
    /** Patch content */
    patch?: string;
  }[];
  
  /** Total statistics */
  stats: {
    /** Total files changed */
    filesChanged: number;
    
    /** Total additions */
    additions: number;
    
    /** Total deletions */
    deletions: number;
  };
  
  /** Base commit SHA */
  baseCommit: string;
  
  /** Head commit SHA */
  headCommit: string;
}

/**
 * Interface for Git service operations
 * Main interface for Git operations like branch creation, commits, and pushes
 */
export interface IGitService {
  /** Create a new branch from the default branch */
  createBranch(branchName: string, baseBranch?: string): Promise<IBranchCreationResult>;
  
  /** Commit changes to the current branch */
  commitChanges(files: IFileChange[], message: string): Promise<ICommitResult>;
  
  /** Push branch to remote repository */
  pushBranch(branchName: string): Promise<IGitOperationResult>;
  
  /** Get list of branches */
  getBranches(): Promise<string[]>;
  
  /** Get current branch name */
  getCurrentBranch(): Promise<string>;
  
  /** Switch to a different branch */
  switchBranch(branchName: string): Promise<IGitOperationResult>;
  
  /** Get repository information */
  getRepositoryInfo(): Promise<IRepositoryInfo>;
  
  /** Generate a standardized branch name from work item */
  generateBranchName(workItem: any): string;
}

/**
 * Interface for branch creation result
 */
export interface IBranchCreationResult {
  /** Whether the branch creation was successful */
  success: boolean;
  
  /** Name of the created branch */
  branchName: string;
  
  /** Error message if creation failed */
  error?: string;
  
  /** Base branch used for creation */
  baseBranch: string;
  
  /** Commit SHA where branch was created */
  commitSha: string;
}

/**
 * Interface for commit operation result
 */
export interface ICommitResult {
  /** Whether the commit was successful */
  success: boolean;
  
  /** SHA of the created commit */
  commitSha: string;
  
  /** Commit message */
  message: string;
  
  /** Error message if commit failed */
  error?: string;
  
  /** Files that were committed */
  files: string[];
  
  /** Commit statistics */
  stats: {
    /** Number of files changed */
    filesChanged: number;
    
    /** Number of lines added */
    additions: number;
    
    /** Number of lines deleted */
    deletions: number;
  };
}

/**
 * Interface for Git configuration
 */
export interface IGitConfiguration {
  /** Repository path */
  repositoryPath: string;
  
  /** Remote repository URL */
  remoteUrl: string;
  
  /** Default branch name */
  defaultBranch: string;
  
  /** Repository owner (GitHub username or organization) */
  owner?: string;
  
  /** Repository name */
  repo?: string;
  
  /** Git user configuration */
  user: {
    /** User name for commits */
    name: string;
    
    /** User email for commits */
    email: string;
  };
  
  /** Authentication configuration */
  auth?: {
    /** Authentication type */
    type: 'token' | 'ssh' | 'basic';
    
    /** Authentication token or password */
    token?: string;
    
    /** Username for basic auth */
    username?: string;
    
    /** SSH key path */
    sshKeyPath?: string;
  };
  
  /** GitHub token for API operations */
  githubToken?: string;
}

/**
 * Interface for Pull Request service operations
 */
export interface IPullRequestService {
  /** Create a new pull request */
  createPullRequest(
    sourceBranch: string,
    title: string,
    description: string,
    workItem: any,
    reviewers?: string[]
  ): Promise<IPullRequestCreationResult>;
  
  /** Update an existing pull request */
  updatePullRequest(
    pullRequestId: number,
    title?: string,
    description?: string
  ): Promise<IPullRequestUpdateResult>;
  
  /** Get pull request information */
  getPullRequestInfo(pullRequestId: number): Promise<IPullRequestInfo | null>;
}

/**
 * Interface for pull request creation result
 */
export interface IPullRequestCreationResult {
  /** Whether the creation was successful */
  success: boolean;
  
  /** ID of the created pull request */
  pullRequestId?: number;
  
  /** URL of the created pull request */
  pullRequestUrl?: string;
  
  /** Error message if creation failed */
  error?: string;
  
  /** Success or error message */
  message: string;
}

/**
 * Interface for pull request update result
 */
export interface IPullRequestUpdateResult {
  /** Whether the update was successful */
  success: boolean;
  
  /** URL of the updated pull request */
  pullRequestUrl?: string;
  
  /** Error message if update failed */
  error?: string;
  
  /** Success or error message */
  message: string;
}

/**
 * Interface for pull request information
 */
export interface IPullRequestInfo {
  /** Pull request ID */
  id: number;
  
  /** Pull request title */
  title: string;
  
  /** Pull request description */
  description: string;
  
  /** Source branch name */
  sourceBranch: string;
  
  /** Target branch name */
  targetBranch: string;
  
  /** Pull request state */
  state: string;
  
  /** Pull request URL */
  url: string;
  
  /** Creation date */
  createdAt: Date;
  
  /** Last update date */
  updatedAt: Date;
}