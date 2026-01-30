/**
 * Unit tests for Git models
 * Tests interfaces and types for Git operations and pull request management
 */

import {
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
  IDiffInfo
} from '../../../src/models/git';

describe('Git Models', () => {
  describe('FileOperation enum', () => {
    it('should contain all supported file operations', () => {
      expect(FileOperation.CREATE).toBe('create');
      expect(FileOperation.UPDATE).toBe('update');
      expect(FileOperation.DELETE).toBe('delete');
      expect(FileOperation.RENAME).toBe('rename');
    });

    it('should have consistent string values', () => {
      const operations = Object.values(FileOperation);
      expect(operations).toHaveLength(4);
      operations.forEach(operation => {
        expect(typeof operation).toBe('string');
        expect(operation.length).toBeGreaterThan(0);
      });
    });
  });

  describe('BranchType enum', () => {
    it('should contain all supported branch types', () => {
      expect(BranchType.FEATURE).toBe('feature');
      expect(BranchType.BUGFIX).toBe('bugfix');
      expect(BranchType.HOTFIX).toBe('hotfix');
      expect(BranchType.RELEASE).toBe('release');
      expect(BranchType.DEVELOP).toBe('develop');
      expect(BranchType.MAIN).toBe('main');
    });
  });

  describe('IFileChange interface', () => {
    it('should create valid file change for create operation', () => {
      const fileChange: IFileChange = {
        path: 'src/components/Button.tsx',
        content: 'export const Button = () => <button>Click me</button>;',
        operation: FileOperation.CREATE,
        metadata: {
          size: 52,
          encoding: 'utf-8',
          mimeType: 'text/typescript',
          executable: false
        }
      };

      expect(fileChange.path).toBe('src/components/Button.tsx');
      expect(fileChange.operation).toBe(FileOperation.CREATE);
      expect(fileChange.metadata?.size).toBe(52);
      expect(fileChange.metadata?.encoding).toBe('utf-8');
    });

    it('should handle rename operation with previous path', () => {
      const fileChange: IFileChange = {
        path: 'src/components/NewButton.tsx',
        content: 'export const NewButton = () => <button>Click me</button>;',
        operation: FileOperation.RENAME,
        previousPath: 'src/components/OldButton.tsx'
      };

      expect(fileChange.operation).toBe(FileOperation.RENAME);
      expect(fileChange.previousPath).toBe('src/components/OldButton.tsx');
    });

    it('should handle delete operation', () => {
      const fileChange: IFileChange = {
        path: 'src/components/ObsoleteComponent.tsx',
        content: '',
        operation: FileOperation.DELETE
      };

      expect(fileChange.operation).toBe(FileOperation.DELETE);
      expect(fileChange.content).toBe('');
    });
  });

  describe('ICommitInfo interface', () => {
    it('should create valid commit information', () => {
      const commitInfo: ICommitInfo = {
        sha: 'abc123def456',
        message: 'feat: add new button component\n\nImplements user story #123',
        author: {
          name: 'John Doe',
          email: 'john.doe@company.com',
          date: '2024-01-15T10:30:00Z'
        },
        committer: {
          name: 'John Doe',
          email: 'john.doe@company.com',
          date: '2024-01-15T10:30:00Z'
        },
        parents: ['def456ghi789'],
        stats: {
          filesChanged: 2,
          additions: 45,
          deletions: 3
        }
      };

      expect(commitInfo.sha).toBe('abc123def456');
      expect(commitInfo.author.name).toBe('John Doe');
      expect(commitInfo.parents).toHaveLength(1);
      expect(commitInfo.stats?.filesChanged).toBe(2);
    });

    it('should handle merge commits with multiple parents', () => {
      const mergeCommit: ICommitInfo = {
        sha: 'merge123abc',
        message: 'Merge pull request #42 from feature/new-feature',
        author: {
          name: 'GitHub',
          email: 'noreply@github.com',
          date: '2024-01-15T11:00:00Z'
        },
        committer: {
          name: 'GitHub',
          email: 'noreply@github.com',
          date: '2024-01-15T11:00:00Z'
        },
        parents: ['parent1abc', 'parent2def']
      };

      expect(mergeCommit.parents).toHaveLength(2);
      expect(mergeCommit.message).toContain('Merge pull request');
    });
  });

  describe('IBranchInfo interface', () => {
    it('should create valid branch information', () => {
      const branchInfo: IBranchInfo = {
        name: 'feature/user-authentication',
        type: BranchType.FEATURE,
        latestCommit: 'abc123def456',
        baseBranch: 'main',
        isDefault: false,
        isProtected: false,
        createdDate: '2024-01-15T09:00:00Z',
        lastActivityDate: '2024-01-15T10:30:00Z',
        createdBy: {
          name: 'Jane Smith',
          email: 'jane.smith@company.com'
        }
      };

      expect(branchInfo.name).toBe('feature/user-authentication');
      expect(branchInfo.type).toBe(BranchType.FEATURE);
      expect(branchInfo.isDefault).toBe(false);
      expect(branchInfo.createdBy.name).toBe('Jane Smith');
    });

    it('should handle main branch configuration', () => {
      const mainBranch: IBranchInfo = {
        name: 'main',
        type: BranchType.MAIN,
        latestCommit: 'main123abc',
        baseBranch: '',
        isDefault: true,
        isProtected: true,
        createdDate: '2024-01-01T00:00:00Z',
        lastActivityDate: '2024-01-15T12:00:00Z',
        createdBy: {
          name: 'System',
          email: 'system@company.com'
        }
      };

      expect(mainBranch.isDefault).toBe(true);
      expect(mainBranch.isProtected).toBe(true);
      expect(mainBranch.type).toBe(BranchType.MAIN);
    });
  });

  describe('IPullRequestData interface', () => {
    it('should create valid pull request data', () => {
      const pullRequestData: IPullRequestData = {
        title: 'Add user authentication feature',
        description: 'Implements user login and registration functionality\n\nCloses #123',
        sourceBranch: 'feature/user-authentication',
        targetBranch: 'main',
        reviewers: ['reviewer1@company.com', 'reviewer2@company.com'],
        workItemIds: [123, 124],
        labels: ['feature', 'authentication', 'high-priority'],
        isDraft: false,
        autoComplete: true,
        options: {
          deleteSourceBranch: true,
          squashMerge: true,
          bypassPolicy: false,
          mergeStrategy: 'squash'
        },
        metadata: {
          triggeringWorkItem: 123,
          codeTemplate: 'react-component',
          aiModel: 'gemini-pro',
          generatedAt: '2024-01-15T10:30:00Z'
        }
      };

      expect(pullRequestData.title).toBe('Add user authentication feature');
      expect(pullRequestData.reviewers).toHaveLength(2);
      expect(pullRequestData.workItemIds).toContain(123);
      expect(pullRequestData.labels).toContain('authentication');
      expect(pullRequestData.options?.squashMerge).toBe(true);
      expect(pullRequestData.metadata?.triggeringWorkItem).toBe(123);
    });

    it('should handle draft pull request', () => {
      const draftPR: IPullRequestData = {
        title: 'WIP: Add new feature',
        description: 'Work in progress - not ready for review',
        sourceBranch: 'feature/wip-feature',
        targetBranch: 'develop',
        reviewers: [],
        workItemIds: [456],
        labels: ['wip', 'draft'],
        isDraft: true,
        autoComplete: false
      };

      expect(draftPR.isDraft).toBe(true);
      expect(draftPR.autoComplete).toBe(false);
      expect(draftPR.reviewers).toHaveLength(0);
    });
  });

  describe('IRepositoryInfo interface', () => {
    it('should create valid repository information', () => {
      const repositoryInfo: IRepositoryInfo = {
        id: 'repo-123',
        name: 'main-repository',
        url: 'https://github.com/company/main-repository',
        cloneUrl: 'https://github.com/company/main-repository.git',
        defaultBranch: 'main',
        size: 1024000,
        isPrivate: true,
        description: 'Main application repository',
        topics: ['typescript', 'react', 'api'],
        stats: {
          commitCount: 1250,
          branchCount: 15,
          contributorCount: 8,
          lastActivityDate: '2024-01-15T12:00:00Z'
        },
        permissions: {
          canRead: true,
          canWrite: true,
          canAdmin: false
        }
      };

      expect(repositoryInfo.name).toBe('main-repository');
      expect(repositoryInfo.isPrivate).toBe(true);
      expect(repositoryInfo.topics).toContain('typescript');
      expect(repositoryInfo.stats.commitCount).toBe(1250);
      expect(repositoryInfo.permissions.canWrite).toBe(true);
    });
  });

  describe('IGitOperationResult interface', () => {
    it('should represent successful operation result', () => {
      const successResult: IGitOperationResult = {
        success: true,
        data: {
          commitSha: 'abc123def456',
          branchName: 'feature/new-feature',
          pullRequestId: 42,
          affectedFiles: ['src/component.tsx', 'src/component.test.tsx']
        },
        metadata: {
          duration: 2500,
          completedAt: '2024-01-15T10:30:00Z',
          operationType: 'create-pull-request'
        }
      };

      expect(successResult.success).toBe(true);
      expect(successResult.data?.commitSha).toBe('abc123def456');
      expect(successResult.data?.affectedFiles).toHaveLength(2);
      expect(successResult.metadata.duration).toBe(2500);
    });

    it('should represent failed operation result', () => {
      const failureResult: IGitOperationResult = {
        success: false,
        error: 'Failed to create branch: branch already exists',
        metadata: {
          duration: 1000,
          completedAt: '2024-01-15T10:25:00Z',
          operationType: 'create-branch'
        }
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toContain('branch already exists');
      expect(failureResult.data).toBeUndefined();
    });
  });

  describe('IMergeConflict interface', () => {
    it('should represent merge conflict information', () => {
      const mergeConflict: IMergeConflict = {
        filePath: 'src/config.ts',
        conflictType: 'content',
        sourceContent: 'const API_URL = "https://api-dev.company.com";',
        targetContent: 'const API_URL = "https://api-prod.company.com";',
        baseContent: 'const API_URL = "https://api.company.com";',
        conflictLines: {
          start: 5,
          end: 5
        },
        canAutoResolve: false,
        suggestedResolution: 'Review both values and choose appropriate API URL for environment'
      };

      expect(mergeConflict.filePath).toBe('src/config.ts');
      expect(mergeConflict.conflictType).toBe('content');
      expect(mergeConflict.canAutoResolve).toBe(false);
      expect(mergeConflict.conflictLines.start).toBe(5);
    });

    it('should handle auto-resolvable conflicts', () => {
      const autoResolvableConflict: IMergeConflict = {
        filePath: 'package.json',
        conflictType: 'content',
        sourceContent: '  "version": "1.2.0",',
        targetContent: '  "version": "1.1.0",',
        conflictLines: {
          start: 3,
          end: 3
        },
        canAutoResolve: true,
        suggestedResolution: 'Use higher version number: 1.2.0'
      };

      expect(autoResolvableConflict.canAutoResolve).toBe(true);
      expect(autoResolvableConflict.suggestedResolution).toContain('1.2.0');
    });
  });

  describe('IBranchProtectionRule interface', () => {
    it('should create valid branch protection rule', () => {
      const protectionRule: IBranchProtectionRule = {
        branchPattern: 'main',
        requirePullRequestReviews: true,
        requiredReviewerCount: 2,
        dismissStaleReviews: true,
        requireCodeOwnerReviews: true,
        requireStatusChecks: true,
        requiredStatusChecks: ['ci/build', 'ci/test', 'security/scan'],
        requireUpToDateBranches: true,
        restrictPushes: true,
        allowedPushers: ['admin@company.com'],
        enforceForAdmins: false
      };

      expect(protectionRule.branchPattern).toBe('main');
      expect(protectionRule.requiredReviewerCount).toBe(2);
      expect(protectionRule.requiredStatusChecks).toHaveLength(3);
      expect(protectionRule.allowedPushers).toContain('admin@company.com');
    });
  });

  describe('IDiffInfo interface', () => {
    it('should create valid diff information', () => {
      const diffInfo: IDiffInfo = {
        files: [
          {
            path: 'src/component.tsx',
            changeType: 'modified',
            additions: 15,
            deletions: 3,
            patch: '@@ -10,7 +10,19 @@ export const Component = () => {'
          },
          {
            path: 'src/newFile.tsx',
            changeType: 'added',
            additions: 25,
            deletions: 0
          }
        ],
        stats: {
          filesChanged: 2,
          additions: 40,
          deletions: 3
        },
        baseCommit: 'base123abc',
        headCommit: 'head456def'
      };

      expect(diffInfo.files).toHaveLength(2);
      expect(diffInfo.files[0]?.changeType).toBe('modified');
      expect(diffInfo.files[1]?.changeType).toBe('added');
      expect(diffInfo.stats.filesChanged).toBe(2);
      expect(diffInfo.stats.additions).toBe(40);
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty file changes', () => {
      const emptyFileChange: IFileChange = {
        path: '',
        content: '',
        operation: FileOperation.DELETE
      };

      expect(emptyFileChange.path).toBe('');
      expect(emptyFileChange.content).toBe('');
      expect(emptyFileChange.operation).toBe(FileOperation.DELETE);
    });

    it('should handle all file operations consistently', () => {
      const operations = Object.values(FileOperation);
      
      operations.forEach(operation => {
        const fileChange: IFileChange = {
          path: `test-${operation}.txt`,
          content: `Content for ${operation}`,
          operation: operation
        };

        expect(fileChange.operation).toBe(operation);
        expect(fileChange.path).toContain(operation);
      });
    });

    it('should handle all branch types consistently', () => {
      const branchTypes = Object.values(BranchType);
      
      branchTypes.forEach(branchType => {
        const branchInfo: IBranchInfo = {
          name: `${branchType}/test-branch`,
          type: branchType,
          latestCommit: 'test123abc',
          baseBranch: 'main',
          isDefault: branchType === BranchType.MAIN,
          isProtected: branchType === BranchType.MAIN,
          createdDate: '2024-01-15T09:00:00Z',
          lastActivityDate: '2024-01-15T10:30:00Z',
          createdBy: {
            name: 'Test User',
            email: 'test@company.com'
          }
        };

        expect(branchInfo.type).toBe(branchType);
        expect(branchInfo.name).toContain(branchType);
      });
    });

    it('should handle complex pull request scenarios', () => {
      const complexPR: IPullRequestData = {
        title: 'Complex feature with multiple work items',
        description: 'This PR implements multiple features and fixes several bugs',
        sourceBranch: 'feature/complex-feature-branch-with-long-name',
        targetBranch: 'develop',
        reviewers: [
          'senior-dev@company.com',
          'tech-lead@company.com',
          'product-owner@company.com'
        ],
        workItemIds: [100, 101, 102, 103, 104],
        labels: [
          'feature',
          'bugfix',
          'high-priority',
          'breaking-change',
          'needs-documentation'
        ],
        isDraft: false,
        autoComplete: false,
        options: {
          deleteSourceBranch: false,
          squashMerge: false,
          bypassPolicy: false,
          mergeStrategy: 'merge'
        }
      };

      expect(complexPR.reviewers).toHaveLength(3);
      expect(complexPR.workItemIds).toHaveLength(5);
      expect(complexPR.labels).toHaveLength(5);
      expect(complexPR.options?.mergeStrategy).toBe('merge');
    });
  });
});