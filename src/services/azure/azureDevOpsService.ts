/**
 * Azure DevOps Service
 * Implements integration with Azure DevOps REST API for work item operations,
 * comments, and pull request linking
 */

import * as azdev from 'azure-devops-node-api';
import { IWorkItemTrackingApi } from 'azure-devops-node-api/WorkItemTrackingApi';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { 
  IWorkItem, 
  ICreateWorkItemComment,
  IWorkItemField,
  IPullRequest
} from '../../models';

/**
 * Interface for Azure DevOps Service
 * Defines all operations needed for work item and pull request management
 */
export interface IAzureDevOpsService {
  /**
   * Retrieve a work item by ID with optional field filtering
   * @param workItemId - The ID of the work item to retrieve
   * @param fields - Optional array of field names to retrieve
   * @returns Promise resolving to the work item data
   */
  getWorkItem(workItemId: number, fields?: string[]): Promise<IWorkItem>;

  /**
   * Add a comment to a work item
   * @param workItemId - The ID of the work item to comment on
   * @param comment - The comment text to add
   * @returns Promise resolving when comment is added
   */
  addWorkItemComment(workItemId: number, comment: string): Promise<void>;

  /**
   * Link a pull request to a work item
   * @param workItemId - The ID of the work item to link
   * @param pullRequestId - The ID of the pull request to link
   * @param repositoryId - The ID of the repository containing the PR
   * @returns Promise resolving when link is created
   */
  linkPullRequestToWorkItem(
    workItemId: number, 
    pullRequestId: number, 
    repositoryId: string
  ): Promise<void>;

  /**
   * Get available fields for a specific work item type
   * @param workItemType - The type of work item (User Story, Task, Bug, etc.)
   * @returns Promise resolving to array of field definitions
   */
  getWorkItemFields(workItemType: string): Promise<IWorkItemField[]>;

  /**
   * Get pull request information by ID
   * @param repositoryId - The ID of the repository
   * @param pullRequestId - The ID of the pull request
   * @returns Promise resolving to pull request data
   */
  getPullRequest(repositoryId: string, pullRequestId: number): Promise<IPullRequest>;

  /**
   * Create a pull request
   * @param repositoryId - The ID of the repository
   * @param pullRequestData - The pull request creation data
   * @returns Promise resolving to created pull request
   */
  createPullRequest(repositoryId: string, pullRequestData: any): Promise<IPullRequest>;

  /**
   * Create a new branch in the repository
   * @param repositoryId - The ID of the repository
   * @param branchName - Name of the new branch
   * @param baseBranch - Name of the base branch (default: main)
   * @returns Promise resolving to branch creation result
   */
  createBranch(repositoryId: string, branchName: string, baseBranch?: string): Promise<{
    success: boolean;
    branchName: string;
    commitSha: string;
    error?: string;
  }>;

  /**
   * Create a commit with file changes in a branch
   * @param repositoryId - The ID of the repository
   * @param branchName - Name of the branch to commit to
   * @param files - Array of file changes
   * @param message - Commit message
   * @returns Promise resolving to commit result
   */
  createCommit(repositoryId: string, branchName: string, files: Array<{
    path: string;
    content: string;
    operation: 'add' | 'edit' | 'delete';
  }>, message: string): Promise<{
    success: boolean;
    commitSha: string;
    error?: string;
  }>;
}

/**
 * Configuration interface for Azure DevOps Service
 */
export interface IAzureDevOpsConfig {
  /** Azure DevOps organization URL */
  organizationUrl: string;
  
  /** Personal Access Token for authentication */
  personalAccessToken: string;
  
  /** Default project name */
  project: string;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
}

/**
 * Custom error class for Azure DevOps API errors
 */
export class AzureDevOpsApiError extends Error {
  readonly code = 'AZURE_DEVOPS_API_ERROR';
  readonly statusCode: number;
  readonly retryable: boolean;
  readonly details: {
    operation: string;
    timestamp: string;
    originalError?: Error;
  };

  constructor(message: string, operation: string, statusCode?: number, originalError?: Error) {
    super(message);
    this.name = 'AzureDevOpsApiError';
    this.statusCode = statusCode || 500;
    this.retryable = statusCode ? statusCode >= 500 : true;
    this.details = {
      operation,
      timestamp: new Date().toISOString(),
      ...(originalError && { originalError })
    };
  }
}

/**
 * Azure DevOps Service Implementation
 * Provides integration with Azure DevOps REST API using the azure-devops-node-api library
 */
export class AzureDevOpsService implements IAzureDevOpsService {
  private connection: azdev.WebApi;
  private workItemApi: IWorkItemTrackingApi | undefined;
  private gitApi: IGitApi | undefined;
  private config: IAzureDevOpsConfig;

  /**
   * Initialize the Azure DevOps Service
   * @param config - Configuration for Azure DevOps connection
   */
  constructor(config: IAzureDevOpsConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config
    };

    console.log(`🔧 Initializing Azure DevOps Service:`, {
      organizationUrl: this.config.organizationUrl,
      project: this.config.project,
      timeout: this.config.timeout
    });

    // Create authentication handler using Personal Access Token
    const authHandler = azdev.getPersonalAccessTokenHandler(
      this.config.personalAccessToken
    );

    // Initialize connection to Azure DevOps
    this.connection = new azdev.WebApi(
      this.config.organizationUrl,
      authHandler,
      this.config.timeout ? {
        socketTimeout: this.config.timeout
      } : undefined
    );
  }

  /**
   * Initialize API clients lazily
   * This ensures APIs are only initialized when needed
   */
  private async initializeApis(): Promise<void> {
    if (!this.workItemApi) {
      this.workItemApi = await this.connection.getWorkItemTrackingApi();
    }
    if (!this.gitApi) {
      this.gitApi = await this.connection.getGitApi();
    }
  }

  /**
   * Execute an operation with retry logic and error handling
   * @param operation - The async operation to execute
   * @param operationName - Name of the operation for logging
   * @returns Promise resolving to the operation result
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= (this.config.maxRetries || 3); attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication or client errors (4xx)
        if (this.isNonRetryableError(error)) {
          throw this.createApiError(error, operationName);
        }
        
        // Wait before retrying with exponential backoff
        if (attempt < (this.config.maxRetries || 3)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.delay(delay);
        }
      }
    }
    
    throw this.createApiError(lastError!, operationName);
  }

  /**
   * Check if an error should not be retried
   * @param error - The error to check
   * @returns True if the error should not be retried
   */
  private isNonRetryableError(error: any): boolean {
    // Check for HTTP status codes that shouldn't be retried
    if (error.statusCode) {
      const statusCode = error.statusCode;
      return statusCode >= 400 && statusCode < 500; // Client errors
    }
    
    // Check for specific error types
    if (error.message) {
      const message = error.message.toLowerCase();
      return message.includes('unauthorized') || 
             message.includes('forbidden') ||
             message.includes('not found');
    }
    
    return false;
  }

  /**
   * Create and throw a standardized API error
   * @param error - The original error
   * @param operationName - Name of the operation that failed
   */
  private createApiError(error: any, operationName: string): never {
    const message = `Azure DevOps API error in ${operationName}: ${error.message}`;
    const statusCode = error.statusCode || 500;
    throw new AzureDevOpsApiError(message, operationName, statusCode, error);
  }

  /**
   * Utility method to add delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retrieve a work item by ID with optional field filtering
   */
  async getWorkItem(workItemId: number, fields?: string[]): Promise<IWorkItem> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.workItemApi) {
        throw new Error('Work Item API not initialized');
      }

      const workItem = await this.workItemApi.getWorkItem(
        workItemId,
        fields,
        undefined, // asOf
        undefined, // expand
        this.config.project
      );

      if (!workItem) {
        throw new Error(`Work item ${workItemId} not found`);
      }

      // Transform the Azure DevOps work item to our interface
      return this.transformWorkItem(workItem);
    }, 'getWorkItem');
  }

  /**
   * Add a comment to a work item
   */
  async addWorkItemComment(workItemId: number, comment: string): Promise<void> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.workItemApi) {
        throw new Error('Work Item API not initialized');
      }

      const commentData: ICreateWorkItemComment = {
        text: comment
      };

      await this.workItemApi.addComment(
        commentData,
        this.config.project,
        workItemId
      );
    }, 'addWorkItemComment');
  }

  /**
   * Link a pull request to a work item
   */
  async linkPullRequestToWorkItem(
    workItemId: number, 
    pullRequestId: number, 
    repositoryId: string
  ): Promise<void> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.workItemApi) {
        throw new Error('Work Item API not initialized');
      }

      // Create the relation to link the PR to the work item
      const pullRequestUrl = `${this.config.organizationUrl}/${this.config.project}/_git/${repositoryId}/pullrequest/${pullRequestId}`;
      
      const updateDocument = [
        {
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'ArtifactLink',
            url: pullRequestUrl,
            attributes: {
              name: 'Pull Request'
            }
          }
        }
      ];

      await this.workItemApi.updateWorkItem(
        undefined, // customHeaders
        updateDocument,
        workItemId,
        this.config.project
      );
    }, 'linkPullRequestToWorkItem');
  }

  /**
   * Get available fields for a specific work item type
   */
  async getWorkItemFields(_workItemType: string): Promise<IWorkItemField[]> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.workItemApi) {
        throw new Error('Work Item API not initialized');
      }

      const fields = await this.workItemApi.getFields(this.config.project);
      
      if (!fields) {
        return [];
      }

      // Transform Azure DevOps fields to our interface
      return fields.map(field => {
        const workItemField: IWorkItemField = {
          referenceName: field.referenceName || '',
          name: field.name || '',
          type: field.type?.toString() || 'string',
          isRequired: (field as any).isRequired || false,
          isReadOnly: field.readOnly || false
        };
        
        if (field.description) {
          workItemField.description = field.description;
        }
        
        if ((field as any).allowedValues) {
          workItemField.allowedValues = (field as any).allowedValues;
        }
        
        return workItemField;
      });
    }, 'getWorkItemFields');
  }

  /**
   * Get pull request information by ID
   */
  async getPullRequest(repositoryId: string, pullRequestId: number): Promise<IPullRequest> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.gitApi) {
        throw new Error('Git API not initialized');
      }

      const pullRequest = await this.gitApi.getPullRequest(
        repositoryId,
        pullRequestId,
        this.config.project
      );

      if (!pullRequest) {
        throw new Error(`Pull request ${pullRequestId} not found`);
      }

      return this.transformPullRequest(pullRequest);
    }, 'getPullRequest');
  }

  /**
   * Create a pull request
   */
  async createPullRequest(repositoryId: string, pullRequestData: any): Promise<IPullRequest> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.gitApi) {
        throw new Error('Git API not initialized');
      }

      const createdPr = await this.gitApi.createPullRequest(
        pullRequestData,
        repositoryId,
        this.config.project
      );

      if (!createdPr) {
        throw new Error('Failed to create pull request');
      }

      return this.transformPullRequest(createdPr);
    }, 'createPullRequest');
  }

  /**
   * Create a new branch in the repository
   */
  async createBranch(repositoryId: string, branchName: string, baseBranch: string = 'main'): Promise<{
    success: boolean;
    branchName: string;
    commitSha: string;
    error?: string;
  }> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.gitApi) {
        throw new Error('Git API not initialized');
      }

      try {
        console.log(`🔍 Creating branch in Azure DevOps:`, {
          repositoryId,
          branchName,
          baseBranch,
          project: this.config.project
        });

        // 1. Get the latest commit SHA from the base branch
        const baseRef = await this.gitApi.getRefs(
          repositoryId,
          this.config.project,
          `heads/${baseBranch}`
        );

        console.log(`📋 Base refs found:`, baseRef?.length || 0);

        if (!baseRef || baseRef.length === 0) {
          throw new Error(`Base branch '${baseBranch}' not found`);
        }

        const baseCommitSha = baseRef[0]?.objectId;
        if (!baseCommitSha) {
          throw new Error(`Could not get commit SHA for base branch '${baseBranch}'`);
        }

        console.log(`📝 Base commit SHA: ${baseCommitSha}`);

        // 2. Create the new branch reference
        const newRef = {
          name: `refs/heads/${branchName}`,
          oldObjectId: '0000000000000000000000000000000000000000', // New branch
          newObjectId: baseCommitSha
        };

        console.log(`🚀 Creating new ref:`, newRef);

        await this.gitApi.updateRefs(
          [newRef],
          repositoryId,
          this.config.project
        );

        console.log(`✅ Branch created successfully: ${branchName}`);

        return {
          success: true,
          branchName,
          commitSha: baseCommitSha
        };
      } catch (error) {
        console.error(`❌ Error in createBranch:`, {
          error: error instanceof Error ? error.message : error,
          repositoryId,
          branchName,
          project: this.config.project
        });
        
        return {
          success: false,
          branchName,
          commitSha: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }, 'createBranch');
  }

  /**
   * Create a commit with file changes in a branch
   */
  async createCommit(repositoryId: string, branchName: string, files: Array<{
    path: string;
    content: string;
    operation: 'add' | 'edit' | 'delete';
  }>, message: string): Promise<{
    success: boolean;
    commitSha: string;
    error?: string;
  }> {
    await this.initializeApis();
    
    return this.executeWithRetry(async () => {
      if (!this.gitApi) {
        throw new Error('Git API not initialized');
      }

      try {
        console.log(`📝 Creating commit in branch: ${branchName}`, {
          repositoryId,
          filesCount: files.length,
          message
        });

        // 1. Get the current commit SHA of the branch
        const branchRef = await this.gitApi.getRefs(
          repositoryId,
          this.config.project,
          `heads/${branchName}`
        );

        if (!branchRef || branchRef.length === 0) {
          throw new Error(`Branch '${branchName}' not found`);
        }

        const currentCommitSha = branchRef[0]?.objectId;
        if (!currentCommitSha) {
          throw new Error(`Could not get current commit SHA for branch '${branchName}'`);
        }

        // 2. Prepare the commit changes
        const changes = files.map(file => {
          const change: any = {
            changeType: file.operation === 'add' ? 1 : file.operation === 'edit' ? 2 : 16, // Add=1, Edit=2, Delete=16
            item: {
              path: file.path
            }
          };
          
          if (file.operation !== 'delete') {
            change.newContent = {
              content: file.content,
              contentType: 0 // RawText
            };
          }
          
          return change;
        });

        // 3. Create the commit
        const commitData: any = {
          refUpdates: [
            {
              name: `refs/heads/${branchName}`,
              oldObjectId: currentCommitSha
            }
          ],
          commits: [
            {
              comment: message,
              changes: changes
            }
          ]
        };

        console.log(`🚀 Pushing commit with ${changes.length} changes`);

        const pushResult = await this.gitApi.createPush(
          commitData,
          repositoryId,
          this.config.project
        );

        if (!pushResult || !pushResult.commits || pushResult.commits.length === 0) {
          throw new Error('Failed to create commit - no commit returned');
        }

        const newCommitSha = pushResult.commits[0]?.commitId;
        if (!newCommitSha) {
          throw new Error('No commit SHA returned from push');
        }
        
        console.log(`✅ Commit created successfully: ${newCommitSha}`);

        return {
          success: true,
          commitSha: newCommitSha
        };
      } catch (error) {
        console.error(`❌ Error in createCommit:`, {
          error: error instanceof Error ? error.message : error,
          repositoryId,
          branchName,
          project: this.config.project
        });
        
        return {
          success: false,
          commitSha: '',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }, 'createCommit');
  }

  /**
   * Transform Azure DevOps work item to our interface
   * @param azureWorkItem - Work item from Azure DevOps API
   * @returns Transformed work item
   */
  private transformWorkItem(azureWorkItem: any): IWorkItem {
    return {
      id: azureWorkItem.id,
      rev: azureWorkItem.rev,
      url: azureWorkItem.url,
      fields: azureWorkItem.fields || {},
      relations: azureWorkItem.relations || []
    };
  }

  /**
   * Transform Azure DevOps pull request to our interface
   * @param azurePr - Pull request from Azure DevOps API
   * @returns Transformed pull request
   */
  private transformPullRequest(azurePr: any): IPullRequest {
    return {
      pullRequestId: azurePr.pullRequestId,
      title: azurePr.title,
      description: azurePr.description,
      sourceRefName: azurePr.sourceRefName,
      targetRefName: azurePr.targetRefName,
      status: azurePr.status,
      createdBy: azurePr.createdBy,
      creationDate: azurePr.creationDate,
      url: azurePr.url,
      repository: azurePr.repository,
      reviewers: azurePr.reviewers || [],
      workItemRefs: azurePr.workItemRefs || []
    };
  }
}

/**
 * Factory function to create Azure DevOps Service instance
 * @param config - Configuration for the service
 * @returns Configured Azure DevOps Service instance
 */
export function createAzureDevOpsService(config: IAzureDevOpsConfig): IAzureDevOpsService {
  return new AzureDevOpsService(config);
}

/**
 * Create Azure DevOps Service from environment variables
 * @returns Configured Azure DevOps Service instance
 */
export function createAzureDevOpsServiceFromEnv(): IAzureDevOpsService {
  const config: IAzureDevOpsConfig = {
    organizationUrl: process.env['AZURE_DEVOPS_ORG_URL'] || '',
    personalAccessToken: process.env['AZURE_DEVOPS_TOKEN'] || '',
    project: process.env['AZURE_DEVOPS_PROJECT'] || '',
    timeout: parseInt(process.env['AZURE_DEVOPS_TIMEOUT'] || '30000'),
    maxRetries: parseInt(process.env['MAX_RETRY_ATTEMPTS'] || '3')
  };

  // Validate required configuration
  if (!config.organizationUrl) {
    throw new Error('AZURE_DEVOPS_ORG_URL environment variable is required');
  }
  if (!config.personalAccessToken) {
    throw new Error('AZURE_DEVOPS_TOKEN environment variable is required');
  }
  if (!config.project) {
    throw new Error('AZURE_DEVOPS_PROJECT environment variable is required');
  }

  return new AzureDevOpsService(config);
}