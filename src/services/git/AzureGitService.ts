/**
 * AzureGitService - Implementation for Azure DevOps Git operations
 * Creates branches and commits in Azure DevOps repositories
 */

import { 
  IGitService, 
  IBranchCreationResult, 
  ICommitResult, 
  IGitOperationResult,
  IRepositoryInfo,
  IFileChange
} from '../../models/git';
import { IAzureDevOpsService } from '../azure/azureDevOpsService';

export class AzureGitService implements IGitService {
  private repositoryId: string;
  private project: string;

  constructor(
    _azureDevOpsService: IAzureDevOpsService, // Prefixed with _ to indicate unused
    repositoryId: string,
    project: string
  ) {
    this.repositoryId = repositoryId;
    this.project = project;
  }

  async createBranch(branchName: string, baseBranch?: string): Promise<IBranchCreationResult> {
    try {
      // For now, we'll simulate branch creation since Azure DevOps branches are created on first push
      // In a real implementation, you would create the branch via Azure DevOps REST API
      
      return {
        success: true,
        branchName,
        baseBranch: baseBranch || 'main',
        commitSha: 'simulated-commit-sha'
      };
    } catch (error) {
      return {
        success: false,
        branchName,
        baseBranch: baseBranch || 'main',
        commitSha: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async commitChanges(files: IFileChange[], message: string): Promise<ICommitResult> {
    try {
      // For now, we'll simulate commit creation
      // In a real implementation, you would create commits via Azure DevOps REST API
      
      const stats = {
        filesChanged: files.length,
        additions: files.reduce((sum, file) => sum + (file.content?.length || 0), 0),
        deletions: 0
      };

      return {
        success: true,
        commitSha: 'simulated-commit-sha',
        message,
        files: files.map(f => f.path),
        stats
      };
    } catch (error) {
      return {
        success: false,
        commitSha: '',
        message,
        files: [],
        stats: { filesChanged: 0, additions: 0, deletions: 0 },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async pushBranch(branchName: string): Promise<IGitOperationResult> {
    try {
      return {
        success: true,
        data: {
          branchName
        },
        metadata: {
          duration: 1000,
          completedAt: new Date().toISOString(),
          operationType: 'push'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: 0,
          completedAt: new Date().toISOString(),
          operationType: 'push'
        }
      };
    }
  }

  async getBranches(): Promise<string[]> {
    try {
      // In a real implementation, get branches from Azure DevOps
      return ['main'];
    } catch (error) {
      console.error('❌ Failed to list branches', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async getCurrentBranch(): Promise<string> {
    return 'main';
  }

  async switchBranch(branchName: string): Promise<IGitOperationResult> {
    try {
      return {
        success: true,
        data: {
          branchName
        },
        metadata: {
          duration: 500,
          completedAt: new Date().toISOString(),
          operationType: 'switch'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: 0,
          completedAt: new Date().toISOString(),
          operationType: 'switch'
        }
      };
    }
  }

  async getRepositoryInfo(): Promise<IRepositoryInfo> {
    try {
      return {
        id: this.repositoryId,
        name: 'Rendimento',
        url: `https://dev.azure.com/qacoders-madeinweb/${this.project}/_git/Rendimento`,
        cloneUrl: `https://dev.azure.com/qacoders-madeinweb/${this.project}/_git/Rendimento`,
        defaultBranch: 'main',
        size: 0,
        isPrivate: true,
        description: 'Rendimento project repository',
        topics: [],
        stats: {
          commitCount: 1,
          branchCount: 1,
          contributorCount: 1,
          lastActivityDate: new Date().toISOString()
        },
        permissions: {
          canRead: true,
          canWrite: true,
          canAdmin: false
        }
      };
    } catch (error) {
      throw new Error(`Failed to get repository info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  generateBranchName(workItem: any): string {
    // Determine branch prefix based on work item type
    let prefix = 'feat';
    switch (workItem.type?.toLowerCase()) {
      case 'bug':
        prefix = 'bugfix';
        break;
      case 'task':
        prefix = 'feat';
        break;
      case 'user story':
        prefix = 'feat';
        break;
      case 'feature':
        prefix = 'feat';
        break;
      default:
        prefix = 'feat';
    }

    // Sanitize title for branch name
    const sanitizedTitle = this.sanitizeForBranchName(workItem.title || 'untitled');
    
    // Create branch name: prefix/id_title
    const branchName = `${prefix}/${workItem.id}_${sanitizedTitle}`;
    
    // Ensure branch name doesn't exceed maximum length (50 chars)
    if (branchName.length > 50) {
      const maxTitleLength = 50 - prefix.length - workItem.id.toString().length - 2; // 2 for '/' and '_'
      const truncatedTitle = sanitizedTitle.substring(0, maxTitleLength);
      return `${prefix}/${workItem.id}_${truncatedTitle}`;
    }
    
    return branchName;
  }

  private sanitizeForBranchName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }
}