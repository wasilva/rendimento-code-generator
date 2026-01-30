/**
 * GitService - Handles Git operations for automated code generation
 * Implements automated branch creation, commits, and push operations
 * 
 * Requirements implemented:
 * - 4.1: Create branches with standardized naming
 * - 4.2: Ensure branch names are valid Git identifiers
 * - 4.3: Commit generated code with descriptive messages
 * - 4.4: Include work item ID and description in commit messages
 * - 4.5: Automatically push branches to remote repository
 */

import simpleGit, { SimpleGit, CheckRepoActions } from 'simple-git';
import { IFileChange, IGitOperationResult, FileOperation } from '../../models/git';
import { IRepositoryConfig } from '../../models/configuration';
import { IEnrichedWorkItem } from '../../models/workItem';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Interface for GitService
 * Defines the contract for Git operations
 */
export interface IGitService {
  /**
   * Creates a new branch following the standardized naming convention
   * @param repositoryPath - Local path to the Git repository
   * @param branchName - Name of the branch to create
   * @param baseBranch - Base branch to create from (optional, defaults to main/master)
   * @returns Promise resolving to operation result
   */
  createBranch(repositoryPath: string, branchName: string, baseBranch?: string): Promise<IGitOperationResult>;

  /**
   * Commits changes to the current branch
   * @param repositoryPath - Local path to the Git repository
   * @param files - Array of file changes to commit
   * @param message - Commit message
   * @returns Promise resolving to commit SHA
   */
  commitChanges(repositoryPath: string, files: IFileChange[], message: string): Promise<string>;

  /**
   * Pushes a branch to the remote repository
   * @param repositoryPath - Local path to the Git repository
   * @param branchName - Name of the branch to push
   * @param remote - Remote name (optional, defaults to 'origin')
   * @returns Promise resolving to operation result
   */
  pushBranch(repositoryPath: string, branchName: string, remote?: string): Promise<IGitOperationResult>;

  /**
   * Generates a standardized branch name from work item
   * @param workItem - Work item to generate branch name from
   * @returns Sanitized branch name following Git conventions
   */
  generateBranchName(workItem: IEnrichedWorkItem): string;

  /**
   * Generates a descriptive commit message
   * @param workItem - Work item that triggered the code generation
   * @param description - Additional description of changes
   * @returns Formatted commit message
   */
  generateCommitMessage(workItem: IEnrichedWorkItem, description: string): string;

  /**
   * Validates if a branch name is a valid Git identifier
   * @param branchName - Branch name to validate
   * @returns True if valid, false otherwise
   */
  validateBranchName(branchName: string): boolean;

  /**
   * Clones or updates a repository to local path
   * @param repositoryConfig - Repository configuration
   * @param localPath - Local path to clone/update to
   * @returns Promise resolving to operation result
   */
  ensureRepository(repositoryConfig: IRepositoryConfig, localPath: string): Promise<IGitOperationResult>;
}

/**
 * GitService implementation using simple-git
 * Provides automated Git operations for code generation workflow
 */
export class GitService implements IGitService {
  private readonly maxBranchNameLength = 250; // Git limit is 255, leaving some buffer
  private readonly forbiddenChars = /[~^:?*[\]\\@{}<>|!"]/g;

  /**
   * Creates a new branch following the standardized naming convention
   * Implements requirements 4.1 and 4.2
   */
  async createBranch(
    repositoryPath: string, 
    branchName: string, 
    baseBranch: string = 'main'
  ): Promise<IGitOperationResult> {
    const startTime = Date.now();
    
    try {
      // Validate branch name
      if (!this.validateBranchName(branchName)) {
        throw new Error(`Invalid branch name: ${branchName}`);
      }

      const git: SimpleGit = simpleGit(repositoryPath);
      
      // Ensure we're in a Git repository
      const isRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
      if (!isRepo) {
        throw new Error(`Path ${repositoryPath} is not a Git repository`);
      }

      // Fetch latest changes
      await git.fetch();

      // Check if base branch exists
      const branches = await git.branch();
      const remoteBranches = await git.branch(['-r']);
      
      let actualBaseBranch = baseBranch;
      if (!branches.all.includes(baseBranch)) {
        // Try common default branch names
        const defaultBranches = ['main', 'master', 'develop'];
        for (const defaultBranch of defaultBranches) {
          if (branches.all.includes(defaultBranch) || remoteBranches.all.includes(`origin/${defaultBranch}`)) {
            actualBaseBranch = defaultBranch;
            break;
          }
        }
      }

      // Checkout base branch and pull latest
      await git.checkout(actualBaseBranch);
      await git.pull('origin', actualBaseBranch);

      // Create and checkout new branch
      await git.checkoutLocalBranch(branchName);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          branchName,
        },
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'createBranch'
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'createBranch'
        }
      };
    }
  }

  /**
   * Commits changes to the current branch
   * Implements requirements 4.3 and 4.4
   */
  async commitChanges(
    repositoryPath: string, 
    files: IFileChange[], 
    message: string
  ): Promise<string> {
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      
      // Process file changes
      const filesToAdd: string[] = [];
      const filesToRemove: string[] = [];
      
      for (const file of files) {
        const fullPath = path.join(repositoryPath, file.path);
        
        switch (file.operation) {
          case FileOperation.CREATE:
          case FileOperation.UPDATE:
            // Ensure directory exists
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            // Write file content
            await fs.writeFile(fullPath, file.content, 'utf-8');
            filesToAdd.push(file.path);
            break;
            
          case FileOperation.DELETE:
            filesToRemove.push(file.path);
            break;
            
          case FileOperation.RENAME:
            if (file.previousPath) {
              // Git handles renames automatically when we add the new file and remove the old one
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              await fs.writeFile(fullPath, file.content, 'utf-8');
              filesToAdd.push(file.path);
              filesToRemove.push(file.previousPath);
            }
            break;
        }
      }

      // Add files to staging
      if (filesToAdd.length > 0) {
        await git.add(filesToAdd);
      }

      // Remove files from staging
      if (filesToRemove.length > 0) {
        await git.rm(filesToRemove);
      }

      // Commit changes
      const commitResult = await git.commit(message);
      
      return commitResult.commit;
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Pushes a branch to the remote repository
   * Implements requirement 4.5
   */
  async pushBranch(
    repositoryPath: string, 
    branchName: string, 
    remote: string = 'origin'
  ): Promise<IGitOperationResult> {
    const startTime = Date.now();
    
    try {
      const git: SimpleGit = simpleGit(repositoryPath);
      
      // Push branch to remote
      await git.push(remote, branchName, { '--set-upstream': null });

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: {
          branchName,
        },
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'pushBranch'
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'pushBranch'
        }
      };
    }
  }

  /**
   * Generates a standardized branch name from work item
   * Implements requirements 4.1 and 4.2
   */
  generateBranchName(workItem: IEnrichedWorkItem): string {
    // Determine branch prefix based on work item type
    let prefix = 'feat';
    switch (workItem.type.toLowerCase()) {
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
    const sanitizedTitle = this.sanitizeForBranchName(workItem.title);
    
    // Create branch name: prefix/id_title
    const branchName = `${prefix}/${workItem.id}_${sanitizedTitle}`;
    
    // Ensure branch name doesn't exceed maximum length
    if (branchName.length > this.maxBranchNameLength) {
      const maxTitleLength = this.maxBranchNameLength - prefix.length - workItem.id.toString().length - 2; // 2 for '/' and '_'
      const truncatedTitle = sanitizedTitle.substring(0, maxTitleLength);
      return `${prefix}/${workItem.id}_${truncatedTitle}`;
    }
    
    return branchName;
  }

  /**
   * Generates a descriptive commit message
   * Implements requirement 4.4
   */
  generateCommitMessage(workItem: IEnrichedWorkItem, description: string): string {
    const type = this.getCommitType(workItem.type);
    const scope = this.getCommitScope(workItem.areaPath);
    // Use the original title as-is for commit messages (preserve whitespace)
    const title = workItem.title || 'Untitled Work Item';
    
    // Format: type(scope): description
    // 
    // Work Item: #ID - Title
    // 
    // Additional details if available
    let message = `${type}(${scope}): ${description}\n\n`;
    message += `Work Item: #${workItem.id} - ${title}\n`;
    
    if (workItem.description) {
      message += `\nDescription: ${workItem.description}\n`;
    }
    
    if (workItem.acceptanceCriteria) {
      message += `\nAcceptance Criteria:\n${workItem.acceptanceCriteria}\n`;
    }
    
    // Add tags if available
    if (workItem.tags && workItem.tags.length > 0) {
      message += `\nTags: ${workItem.tags.join(', ')}\n`;
    }
    
    return message.trim();
  }

  /**
   * Gets the appropriate commit type for work item type
   */
  private getCommitType(workItemType: string): string {
    switch (workItemType.toLowerCase()) {
      case 'bug':
        return 'fix';
      case 'task':
        return 'feat';
      case 'user story':
        return 'feat';
      case 'feature':
        return 'feat';
      default:
        return 'chore';
    }
  }

  /**
   * Gets the commit scope from area path
   */
  private getCommitScope(areaPath: string): string {
    if (!areaPath || areaPath.trim().length === 0) {
      return 'general';
    }
    
    const area = areaPath.split('\\').pop()?.trim();
    
    // Sanitize the area to ensure it's valid for commit scope
    const sanitizedArea = area?.replace(/[^\w\-]/g, '').trim();
    
    return sanitizedArea && sanitizedArea.length > 0 ? sanitizedArea : 'general';
  }

  /**
   * Validates if a branch name is a valid Git identifier
   * Implements requirement 4.2
   */
  validateBranchName(branchName: string): boolean {
    // Git branch name rules:
    // - Cannot be empty
    // - Cannot contain certain characters: ~^:?*[]@{}<>|!
    // - Cannot start or end with . - /
    // - Cannot contain consecutive slashes
    // - Cannot be longer than 255 characters
    // - Cannot contain backslashes
    // - Cannot be just whitespace
    
    if (!branchName || branchName.length === 0) {
      return false;
    }
    
    if (branchName.length > this.maxBranchNameLength) {
      return false;
    }
    
    // Cannot be just whitespace
    if (/^\s*$/.test(branchName)) {
      return false;
    }
    
    // Check for forbidden characters (including backslash, exclamation mark, and quotes)
    if (/[~^:?*[\]\\@{}<>|!"']/.test(branchName)) {
      return false;
    }
    
    // Check for consecutive slashes (two or more)
    if (/\/\/+/.test(branchName)) {
      return false;
    }
    
    // Check for leading/trailing forbidden characters
    if (/^[.\-\/\s]|[.\-\/\s]$/.test(branchName)) {
      return false;
    }
    
    // Cannot end with .lock
    if (branchName.endsWith('.lock')) {
      return false;
    }
    
    // Additional check: cannot contain only spaces and slashes
    if (/^[\s\/]*$/.test(branchName)) {
      return false;
    }
    
    // Additional check: cannot contain only spaces, slashes, and other forbidden chars
    if (/^[\s\/.\-!"'~^:?*[\]\\@{}<>|]*$/.test(branchName)) {
      return false;
    }
    
    // Additional check: cannot contain spaces in the middle (Git doesn't allow spaces in branch names)
    if (/\s/.test(branchName)) {
      return false;
    }
    
    return true;
  }

  /**
   * Clones or updates a repository to local path
   */
  async ensureRepository(
    repositoryConfig: IRepositoryConfig, 
    localPath: string
  ): Promise<IGitOperationResult> {
    const startTime = Date.now();
    
    try {
      // Check if directory exists and is a Git repository
      try {
        await fs.access(localPath);
        const git: SimpleGit = simpleGit(localPath);
        const isRepo = await git.checkIsRepo(CheckRepoActions.IS_REPO_ROOT);
        
        if (isRepo) {
          // Repository exists, fetch latest changes
          await git.fetch();
          
          const duration = Date.now() - startTime;
          return {
            success: true,
            data: {},
            metadata: {
              duration,
              completedAt: new Date().toISOString(),
              operationType: 'updateRepository'
            }
          };
        }
      } catch {
        // Directory doesn't exist or is not a Git repository
      }

      // Clone repository
      const git: SimpleGit = simpleGit();
      await git.clone(repositoryConfig.url, localPath);

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: {},
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'cloneRepository'
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          duration,
          completedAt: new Date().toISOString(),
          operationType: 'ensureRepository'
        }
      };
    }
  }

  /**
   * Sanitizes a string for use in branch names
   * Removes or replaces characters that are not allowed in Git branch names
   */
  private sanitizeForBranchName(input: string): string {
    if (!input || input.trim().length === 0) {
      return 'untitled';
    }

    // Handle edge cases where input is only special characters or whitespace
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return 'untitled';
    }

    // Check if input contains only forbidden characters
    const withoutForbidden = trimmed.replace(this.forbiddenChars, '').replace(/[^\w\s\-]/g, '');
    if (withoutForbidden.trim().length === 0) {
      return 'untitled';
    }

    let sanitized = trimmed
      .toLowerCase()
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(this.forbiddenChars, '') // Remove forbidden characters
      .replace(/[^\w\-]/g, '')        // Keep only word characters and hyphens
      .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, '')        // Remove leading/trailing hyphens
      .replace(/_+/g, '_')            // Replace multiple underscores with single underscore
      .replace(/^_+|_+$/g, '');       // Remove leading/trailing underscores
    
    // Ensure we have at least some content
    let result = sanitized || 'untitled';
    
    // Ensure the result is valid (not empty and not just special characters)
    if (!result || result.length === 0 || !/[a-zA-Z0-9]/.test(result)) {
      result = 'untitled';
    }
    
    // Ensure result doesn't start or end with problematic characters
    result = result.replace(/^[.\-\/_]+|[.\-\/_]+$/g, '');
    
    // Final fallback if everything was stripped
    if (!result || result.length === 0) {
      result = 'untitled';
    }
    
    return result;
  }
}