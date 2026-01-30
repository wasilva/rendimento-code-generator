/**
 * Property-based tests for WorkItemService
 * Tests universal properties that must hold for all work item processing operations
 * 
 * **Feature: redimento-code-generator, Property 15: Repository Mapping**
 * **Feature: redimento-code-generator, Property 6: Programming Language Mapping**
 */

import fc from 'fast-check';
import { WorkItemService, IWorkItemService } from '../../../../src/services/workItem/WorkItemService';
import { WorkItemType } from '../../../../src/models/workItem';
import { IRepositoryConfig } from '../../../../src/models/configuration';
import { ProgrammingLanguage } from '../../../../src/models/codeGeneration';
import { IWorkItem } from '../../../../src/models/azureDevOps';
import { IAzureDevOpsService } from '../../../../src/services/azure/azureDevOpsService';
import { IGeminiService } from '../../../../src/services/gemini/GeminiService';
import { IGitService } from '../../../../src/services/git/GitService';
import { IPullRequestService } from '../../../../src/services/git/PullRequestService';

describe('WorkItemService Property Tests', () => {
  let workItemService: IWorkItemService;
  let mockAzureDevOpsService: jest.Mocked<IAzureDevOpsService>;
  let mockGeminiService: jest.Mocked<IGeminiService>;
  let mockGitService: jest.Mocked<IGitService>;
  let mockPullRequestService: jest.Mocked<IPullRequestService>;
  let mockRepositoryConfigs: Record<string, IRepositoryConfig>;

  beforeEach(() => {
    // Create mocks
    mockAzureDevOpsService = {
      getWorkItem: jest.fn(),
      addWorkItemComment: jest.fn(),
      linkPullRequestToWorkItem: jest.fn(),
      getWorkItemFields: jest.fn(),
      getPullRequest: jest.fn(),
      createPullRequest: jest.fn()
    } as jest.Mocked<IAzureDevOpsService>;

    mockGeminiService = {
      generateCode: jest.fn(),
      validateGeneratedCode: jest.fn(),
      fixCodeIssues: jest.fn()
    } as jest.Mocked<IGeminiService>;

    mockGitService = {
      createBranch: jest.fn(),
      commitChanges: jest.fn(),
      pushBranch: jest.fn(),
      generateBranchName: jest.fn().mockReturnValue('feat/123_test-feature'),
      generateCommitMessage: jest.fn(),
      validateBranchName: jest.fn(),
      ensureRepository: jest.fn()
    } as jest.Mocked<IGitService>;

    mockPullRequestService = {
      createPullRequest: jest.fn().mockResolvedValue({ id: 1, title: 'Test PR' }),
      generatePullRequestData: jest.fn().mockReturnValue({
        title: 'Test PR',
        description: 'Test description',
        sourceBranch: 'feat/123_test-feature',
        targetBranch: 'main',
        reviewers: [],
        workItemIds: [123],
        labels: []
      }),
      assignReviewers: jest.fn(),
      linkPullRequestToWorkItems: jest.fn()
    } as jest.Mocked<IPullRequestService>;

    // Setup repository configurations
    mockRepositoryConfigs = {
      'frontend-repo': {
        id: 'frontend-repo',
        name: 'Frontend Repository',
        url: 'https://dev.azure.com/org/project/_git/frontend',
        defaultBranch: 'main',
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        codeTemplates: [],
        codingStandards: {
          lintingRules: 'eslint:recommended',
          formattingConfig: 'prettier',
          namingConventions: {
            variables: 'camelCase',
            functions: 'camelCase',
            classes: 'PascalCase',
            constants: 'UPPER_SNAKE_CASE',
            files: 'camelCase',
            directories: 'kebab-case'
          },
          fileStructure: []
        },
        reviewers: ['reviewer1@company.com'],
        areaPathMappings: {
          'Project\\Frontend': 'frontend',
          'Project\\UI': 'frontend',
          'Project\\Web': 'frontend'
        }
      },
      'backend-repo': {
        id: 'backend-repo',
        name: 'Backend Repository',
        url: 'https://dev.azure.com/org/project/_git/backend',
        defaultBranch: 'main',
        targetLanguage: ProgrammingLanguage.CSHARP,
        codeTemplates: [],
        codingStandards: {
          lintingRules: 'dotnet-analyzer',
          formattingConfig: 'editorconfig',
          namingConventions: {
            variables: 'camelCase',
            functions: 'PascalCase',
            classes: 'PascalCase',
            constants: 'UPPER_SNAKE_CASE',
            files: 'PascalCase',
            directories: 'PascalCase'
          },
          fileStructure: []
        },
        reviewers: ['reviewer2@company.com'],
        areaPathMappings: {
          'Project\\Backend': 'backend',
          'Project\\API': 'backend',
          'Project\\Services': 'backend'
        }
      },
      'mobile-repo': {
        id: 'mobile-repo',
        name: 'Mobile Repository',
        url: 'https://dev.azure.com/org/project/_git/mobile',
        defaultBranch: 'main',
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        codeTemplates: [],
        codingStandards: {
          lintingRules: 'react-native',
          formattingConfig: 'prettier',
          namingConventions: {
            variables: 'camelCase',
            functions: 'camelCase',
            classes: 'PascalCase',
            constants: 'UPPER_SNAKE_CASE',
            files: 'camelCase',
            directories: 'kebab-case'
          },
          fileStructure: []
        },
        reviewers: ['reviewer3@company.com'],
        areaPathMappings: {
          'Project\\Mobile': 'mobile',
          'Project\\App': 'mobile'
        }
      }
    };

    workItemService = new WorkItemService(
      mockAzureDevOpsService,
      mockGeminiService,
      mockGitService,
      mockPullRequestService,
      mockRepositoryConfigs
    );
  });

  // Arbitraries for generating test data
  const workItemTypeArb = fc.constantFrom(
    WorkItemType.USER_STORY,
    WorkItemType.TASK,
    WorkItemType.BUG,
    WorkItemType.FEATURE,
    WorkItemType.EPIC
  );

  const areaPathArb = fc.constantFrom(
    'Project\\Frontend',
    'Project\\UI',
    'Project\\Web',
    'Project\\Backend',
    'Project\\API',
    'Project\\Services',
    'Project\\Mobile',
    'Project\\App',
    'Project\\Unknown'
  );

  describe('Property 15: Repository Mapping', () => {
    /**
     * **Feature: redimento-code-generator, Property 15: Repository Mapping**
     * For any work item processed, the system must determine repository target based on area path
     * **Validates: Requirements 6.2**
     */
    it('should consistently map work items to repositories based on area path', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999 }),
          workItemTypeArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          areaPathArb,
          async (workItemId, workItemType, title, areaPath) => {
            // Setup mock work item data
            const mockWorkItem: IWorkItem = {
              id: workItemId,
              rev: 1,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields: {
                'System.Id': workItemId,
                'System.WorkItemType': workItemType,
                'System.Title': title,
                'System.AreaPath': areaPath,
                'System.State': 'New',
                'System.IterationPath': 'Project\\Sprint 1',
                'Microsoft.VSTS.Common.Priority': 2,
                'System.CreatedDate': new Date().toISOString(),
                'System.ChangedDate': new Date().toISOString(),
                'System.CreatedBy': {
                  displayName: 'Test User',
                  uniqueName: 'test@company.com',
                  id: 'test-user-id'
                }
        }
            };

            mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

            const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemId);
            const repositoryConfig = await workItemService.determineTargetRepository(enrichedWorkItem);

            // Property: Repository mapping must be consistent for same area path
            const repositoryConfig2 = await workItemService.determineTargetRepository(enrichedWorkItem);
            expect(repositoryConfig.id).toBe(repositoryConfig2.id);

            // Property: Repository must have area path mapping for the work item's area
            const hasMapping = Object.keys(repositoryConfig.areaPathMappings).some(mappedPath => 
              areaPath.startsWith(mappedPath) || mappedPath === areaPath
            );
            
            // If area path is known, it should map to a repository with that mapping
            if (areaPath !== 'Project\\Unknown') {
              expect(hasMapping || repositoryConfig === Object.values(mockRepositoryConfigs)[0]).toBe(true);
            }

            // Property: Repository configuration must be valid
            expect(repositoryConfig.id).toBeDefined();
            expect(repositoryConfig.name).toBeDefined();
            expect(repositoryConfig.url).toBeDefined();
            expect(repositoryConfig.targetLanguage).toBeDefined();
            expect(repositoryConfig.areaPathMappings).toBeDefined();
          }
        ),
        { numRuns: 20, timeout: 5000 }
      );
    });

    it('should handle unknown area paths by falling back to default repository', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999 }),
          workItemTypeArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 50 }).filter(s => !s.includes('Frontend') && !s.includes('Backend') && !s.includes('Mobile')),
          async (workItemId, workItemType, title, unknownAreaPath) => {
            // Setup mock work item data with unknown area path
            const mockWorkItem: IWorkItem = {
              id: workItemId,
              rev: 1,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields: {
                'System.Id': workItemId,
                'System.WorkItemType': workItemType,
                'System.Title': title,
                'System.AreaPath': unknownAreaPath,
                'System.State': 'New',
                'System.IterationPath': 'Project\\Sprint 1',
                'Microsoft.VSTS.Common.Priority': 2,
                'System.CreatedDate': new Date().toISOString(),
                'System.ChangedDate': new Date().toISOString(),
                'System.CreatedBy': {
                  displayName: 'Test User',
                  uniqueName: 'test@company.com',
                  id: 'test-user-id'
                }
              }
            };

            mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

            const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemId);
            const repositoryConfig = await workItemService.determineTargetRepository(enrichedWorkItem);

            // Property: Unknown area paths should map to default repository (first in config)
            const defaultRepo = Object.values(mockRepositoryConfigs)[0];
            if (defaultRepo) {
              expect(repositoryConfig.id).toBe(defaultRepo.id);
            }

            // Property: Default repository must be valid
            expect(repositoryConfig.id).toBeDefined();
            expect(repositoryConfig.targetLanguage).toBeDefined();
          }
        ),
        { numRuns: 10, timeout: 3000 }
      );
    });
  });

  describe('Property 6: Programming Language Mapping', () => {
    /**
     * **Feature: redimento-code-generator, Property 6: Programming Language Mapping**
     * For any project configured, the system must generate code in the appropriate language 
     * based on project configuration
     * **Validates: Requirements 3.3**
     */
    it('should consistently map repositories to their configured programming languages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999 }),
          workItemTypeArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          areaPathArb,
          async (workItemId, workItemType, title, areaPath) => {
            // Setup mock work item data
            const mockWorkItem: IWorkItem = {
              id: workItemId,
              rev: 1,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields: {
                'System.Id': workItemId,
                'System.WorkItemType': workItemType,
                'System.Title': title,
                'System.AreaPath': areaPath,
                'System.State': 'New',
                'System.IterationPath': 'Project\\Sprint 1',
                'Microsoft.VSTS.Common.Priority': 2,
                'System.CreatedDate': new Date().toISOString(),
                'System.ChangedDate': new Date().toISOString(),
                'System.CreatedBy': {
                  displayName: 'Test User',
                  uniqueName: 'test@company.com',
                  id: 'test-user-id'
                }
              }
            };

            mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

            const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemId);
            const repositoryConfig = await workItemService.determineTargetRepository(enrichedWorkItem);

            // Property: Repository language mapping must be consistent
            const repositoryConfig2 = await workItemService.determineTargetRepository(enrichedWorkItem);
            expect(repositoryConfig.targetLanguage).toBe(repositoryConfig2.targetLanguage);

            // Property: Language must be a valid programming language
            const validLanguages = Object.values(ProgrammingLanguage);
            expect(validLanguages).toContain(repositoryConfig.targetLanguage);

            // Property: Specific area paths should map to expected languages
            if (areaPath.includes('Frontend') || areaPath.includes('UI') || areaPath.includes('Web')) {
              expect(repositoryConfig.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
            } else if (areaPath.includes('Backend') || areaPath.includes('API') || areaPath.includes('Services')) {
              expect(repositoryConfig.targetLanguage).toBe(ProgrammingLanguage.CSHARP);
            } else if (areaPath.includes('Mobile') || areaPath.includes('App')) {
              expect(repositoryConfig.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
            }

            // Property: Repository configuration must include language-specific settings
            expect(repositoryConfig.codingStandards).toBeDefined();
            expect(repositoryConfig.codingStandards.namingConventions).toBeDefined();
            expect(repositoryConfig.codingStandards.lintingRules).toBeDefined();
          }
        ),
        { numRuns: 20, timeout: 5000 }
      );
    });

    it('should maintain language consistency across multiple work items for same repository', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.record({
            id: fc.integer({ min: 1, max: 999999 }),
            type: workItemTypeArb,
            title: fc.string({ minLength: 5, maxLength: 100 }),
            areaPath: fc.constantFrom('Project\\Frontend', 'Project\\Backend')
          }), { minLength: 2, maxLength: 5 }),
          async (workItems) => {
            const repositoryLanguages = new Map<string, ProgrammingLanguage>();

            for (const workItemData of workItems) {
              // Setup mock work item data
              const mockWorkItem: IWorkItem = {
                id: workItemData.id,
                rev: 1,
                url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemData.id}`,
                fields: {
                  'System.Id': workItemData.id,
                  'System.WorkItemType': workItemData.type,
                  'System.Title': workItemData.title,
                  'System.AreaPath': workItemData.areaPath,
                  'System.State': 'New',
                  'System.IterationPath': 'Project\\Sprint 1',
                  'Microsoft.VSTS.Common.Priority': 2,
                  'System.CreatedDate': new Date().toISOString(),
                  'System.ChangedDate': new Date().toISOString(),
                  'System.CreatedBy': {
                    displayName: 'Test User',
                    uniqueName: 'test@company.com',
                    id: 'test-user-id'
                  }
                }
              };

              mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

              const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemData.id);
              const repositoryConfig = await workItemService.determineTargetRepository(enrichedWorkItem);

              // Property: Same repository should always have same language
              if (repositoryLanguages.has(repositoryConfig.id)) {
                expect(repositoryConfig.targetLanguage).toBe(repositoryLanguages.get(repositoryConfig.id));
              } else {
                repositoryLanguages.set(repositoryConfig.id, repositoryConfig.targetLanguage);
              }

              // Property: Language must be valid
              expect(Object.values(ProgrammingLanguage)).toContain(repositoryConfig.targetLanguage);
            }

            // Property: At least one repository should be mapped
            expect(repositoryLanguages.size).toBeGreaterThan(0);
          }
        ),
        { numRuns: 10, timeout: 5000 }
      );
    });
  });

  describe('Cross-Property Validation', () => {
    it('should maintain consistency between repository mapping and language mapping', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999 }),
          workItemTypeArb,
          fc.string({ minLength: 5, maxLength: 100 }),
          areaPathArb,
          async (workItemId, workItemType, title, areaPath) => {
            // Setup mock work item data
            const mockWorkItem: IWorkItem = {
              id: workItemId,
              rev: 1,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields: {
                'System.Id': workItemId,
                'System.WorkItemType': workItemType,
                'System.Title': title,
                'System.AreaPath': areaPath,
                'System.State': 'New',
                'System.IterationPath': 'Project\\Sprint 1',
                'Microsoft.VSTS.Common.Priority': 2,
                'System.CreatedDate': new Date().toISOString(),
                'System.ChangedDate': new Date().toISOString(),
                'System.CreatedBy': {
                  displayName: 'Test User',
                  uniqueName: 'test@company.com',
                  id: 'test-user-id'
                }
              }
            };

            mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

            const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemId);
            const repositoryConfig = await workItemService.determineTargetRepository(enrichedWorkItem);

            // Property: Repository and language mapping must be consistent
            // Same area path should always map to same repository and language
            const repositoryConfig2 = await workItemService.determineTargetRepository(enrichedWorkItem);
            expect(repositoryConfig.id).toBe(repositoryConfig2.id);
            expect(repositoryConfig.targetLanguage).toBe(repositoryConfig2.targetLanguage);

            // Property: Repository configuration must be complete
            expect(repositoryConfig.id).toBeDefined();
            expect(repositoryConfig.name).toBeDefined();
            expect(repositoryConfig.url).toBeDefined();
            expect(repositoryConfig.targetLanguage).toBeDefined();
            expect(repositoryConfig.areaPathMappings).toBeDefined();
            expect(repositoryConfig.codingStandards).toBeDefined();
            expect(repositoryConfig.reviewers).toBeDefined();
            expect(Array.isArray(repositoryConfig.reviewers)).toBe(true);
          }
        ),
        { numRuns: 15, timeout: 4000 }
      );
    });
  });

  describe('Work Item Enrichment Properties', () => {
    it('should consistently enrich work item data regardless of input variations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 999999 }),
          workItemTypeArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.option(fc.string({ minLength: 10, maxLength: 500 })),
          fc.option(fc.string({ minLength: 10, maxLength: 300 })),
          areaPathArb,
          async (workItemId, workItemType, title, description, acceptanceCriteria, areaPath) => {
            // Setup mock work item data
            const mockWorkItem: IWorkItem = {
              id: workItemId,
              rev: 1,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields: {
                'System.Id': workItemId,
                'System.WorkItemType': workItemType,
                'System.Title': title,
                ...(description && { 'System.Description': description }),
                ...(acceptanceCriteria && { 'Microsoft.VSTS.Common.AcceptanceCriteria': acceptanceCriteria }),
                'System.AreaPath': areaPath,
                'System.State': 'New',
                'System.IterationPath': 'Project\\Sprint 1',
                'Microsoft.VSTS.Common.Priority': 2,
                'System.CreatedDate': new Date().toISOString(),
                'System.ChangedDate': new Date().toISOString(),
                'System.CreatedBy': {
                  displayName: 'Test User',
                  uniqueName: 'test@company.com',
                  id: 'test-user-id'
                }
              }
            };

            mockAzureDevOpsService.getWorkItem.mockResolvedValue(mockWorkItem);

            const enrichedWorkItem = await workItemService.enrichWorkItemData(workItemId);

            // Property: Enriched work item must have consistent structure
            expect(enrichedWorkItem.id).toBe(workItemId);
            expect(enrichedWorkItem.type).toBe(workItemType);
            expect(enrichedWorkItem.title).toBe(title);
            expect(enrichedWorkItem.areaPath).toBe(areaPath);

            // Property: Optional fields should be handled gracefully
            expect(typeof enrichedWorkItem.description).toBe('string');
            expect(typeof enrichedWorkItem.acceptanceCriteria).toBe('string');
            expect(Array.isArray(enrichedWorkItem.tags)).toBe(true);
            expect(typeof enrichedWorkItem.customFields).toBe('object');

            // Property: Required fields must be present
            expect(enrichedWorkItem.id).toBeDefined();
            expect(enrichedWorkItem.type).toBeDefined();
            expect(enrichedWorkItem.title).toBeDefined();
            expect(enrichedWorkItem.areaPath).toBeDefined();
          }
        ),
        { numRuns: 15, timeout: 4000 }
      );
    });
  });
});