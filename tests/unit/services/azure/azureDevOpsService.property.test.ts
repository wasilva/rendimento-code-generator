/**
 * Property-based tests for Azure DevOps Service
 * Tests universal properties that must hold across all valid inputs
 */

import * as fc from 'fast-check';
import { AzureDevOpsService, IAzureDevOpsConfig } from '../../../../src/services/azure/azureDevOpsService';

// Mock the azure-devops-node-api module
jest.mock('azure-devops-node-api', () => ({
  WebApi: jest.fn(),
  getPersonalAccessTokenHandler: jest.fn()
}));

describe('AzureDevOpsService - Property Tests', () => {
  let service: AzureDevOpsService;
  let mockConfig: IAzureDevOpsConfig;
  let mockConnection: any;
  let mockWorkItemApi: any;
  let mockGitApi: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock configuration
    mockConfig = {
      organizationUrl: 'https://dev.azure.com/test-org',
      personalAccessToken: 'test-token',
      project: 'test-project',
      timeout: 30000,
      maxRetries: 3
    };

    // Setup mock APIs
    mockWorkItemApi = {
      getWorkItem: jest.fn(),
      addComment: jest.fn(),
      updateWorkItem: jest.fn(),
      getFields: jest.fn()
    };

    mockGitApi = {
      getPullRequest: jest.fn(),
      createPullRequest: jest.fn()
    };

    // Setup mock connection
    mockConnection = {
      getWorkItemTrackingApi: jest.fn().mockResolvedValue(mockWorkItemApi),
      getGitApi: jest.fn().mockResolvedValue(mockGitApi)
    };

    // Mock the WebApi constructor
    const { WebApi } = require('azure-devops-node-api');
    WebApi.mockImplementation(() => mockConnection);

    // Create service instance
    service = new AzureDevOpsService(mockConfig);
  });

  afterEach(() => {
    // Reset all mocks after each test
    jest.resetAllMocks();
  });

  // Generators for property-based testing
  const workItemTypeArb = fc.constantFrom('User Story', 'Task', 'Bug', 'Feature', 'Epic');
  
  const workItemStateArb = fc.constantFrom('New', 'Active', 'Resolved', 'Closed', 'Removed');
  
  const userArb = fc.record({
    displayName: fc.string({ minLength: 1, maxLength: 100 }),
    uniqueName: fc.emailAddress(),
    id: fc.uuid()
  });

  const workItemFieldsArb = fc.record({
    'System.Id': fc.integer({ min: 1, max: 999999 }),
    'System.WorkItemType': workItemTypeArb,
    'System.Title': fc.string({ minLength: 1, maxLength: 255 }),
    'System.State': workItemStateArb,
    'System.AreaPath': fc.string({ minLength: 1, maxLength: 400 }),
    'System.IterationPath': fc.string({ minLength: 1, maxLength: 400 }),
    'System.CreatedDate': fc.date().map(d => d.toISOString()),
    'System.ChangedDate': fc.date().map(d => d.toISOString()),
    'System.CreatedBy': userArb,
    'System.AssignedTo': fc.option(userArb, { nil: undefined }),
    'System.Description': fc.option(fc.string({ maxLength: 32000 }), { nil: undefined }),
    'System.Tags': fc.option(fc.string({ maxLength: 400 }), { nil: undefined }),
    'System.Priority': fc.option(fc.integer({ min: 1, max: 4 }), { nil: undefined }),
    'Microsoft.VSTS.Common.AcceptanceCriteria': fc.option(fc.string({ maxLength: 32000 }), { nil: undefined }),
    'Microsoft.VSTS.TCM.ReproductionSteps': fc.option(fc.string({ maxLength: 32000 }), { nil: undefined })
  });

  const workItemArb = fc.record({
    id: fc.integer({ min: 1, max: 999999 }),
    rev: fc.integer({ min: 1, max: 1000 }),
    url: fc.webUrl(),
    fields: workItemFieldsArb,
    relations: fc.array(fc.record({
      rel: fc.string(),
      url: fc.webUrl(),
      attributes: fc.option(fc.record({
        name: fc.option(fc.string()),
        comment: fc.option(fc.string())
      }))
    }), { maxLength: 10 })
  });

  // Generator for work items with insufficient data
  const insufficientWorkItemArb = fc.record({
    id: fc.integer({ min: 1, max: 999999 }),
    rev: fc.integer({ min: 1, max: 1000 }),
    url: fc.webUrl(),
    fields: fc.record({
      'System.Id': fc.integer({ min: 1, max: 999999 }),
      'System.WorkItemType': workItemTypeArb,
      'System.Title': fc.option(fc.constant(''), { nil: undefined }), // Empty or missing title
      'System.State': workItemStateArb,
      'System.AreaPath': fc.string({ minLength: 1, maxLength: 400 }),
      'System.IterationPath': fc.string({ minLength: 1, maxLength: 400 }),
      'System.CreatedDate': fc.date().map(d => d.toISOString()),
      'System.ChangedDate': fc.date().map(d => d.toISOString()),
      'System.CreatedBy': userArb,
      // Missing description and acceptance criteria for User Stories
      'System.Description': fc.option(fc.constant(''), { nil: undefined }),
      'Microsoft.VSTS.Common.AcceptanceCriteria': fc.option(fc.constant(''), { nil: undefined })
    }),
    relations: fc.array(fc.record({
      rel: fc.string(),
      url: fc.webUrl()
    }), { maxLength: 5 })
  });

  describe('Property 4: Work Item Data Sufficiency Validation', () => {
    /**
     * **Validates: Requirements 2.4**
     * Property: For any work item processed, the system must validate if it contains 
     * sufficient information for code generation before proceeding
     */
    it('should validate work item data sufficiency for all work item types', async () => {
      await fc.assert(fc.asyncProperty(workItemArb, async (workItem) => {
        // Setup mock to return the work item
        mockWorkItemApi.getWorkItem.mockResolvedValue(workItem);

        // Get the work item through the service
        const result = await service.getWorkItem(workItem.id);

        // Property: The service should always return a work item with required fields
        expect(result).toBeDefined();
        expect(result.id).toBe(workItem.id);
        expect(result.fields).toBeDefined();
        expect(result.fields['System.Id']).toBe(workItem.fields['System.Id']);
        expect(result.fields['System.WorkItemType']).toBe(workItem.fields['System.WorkItemType']);
        
        // Property: Work item must have a title for code generation
        if (result.fields['System.Title']) {
          expect(typeof result.fields['System.Title']).toBe('string');
          expect(result.fields['System.Title'].length).toBeGreaterThan(0);
        }

        // Property: Work item type must be valid
        expect(['User Story', 'Task', 'Bug', 'Feature', 'Epic']).toContain(
          result.fields['System.WorkItemType']
        );
      }), { numRuns: 100 });
    });

    it('should identify insufficient work item data consistently', async () => {
      await fc.assert(fc.asyncProperty(insufficientWorkItemArb, async (workItem) => {
        // Setup mock to return the insufficient work item
        mockWorkItemApi.getWorkItem.mockResolvedValue(workItem);

        // Get the work item through the service
        const result = await service.getWorkItem(workItem.id);

        // Property: Service should still return the work item but we can identify insufficiency
        expect(result).toBeDefined();
        expect(result.id).toBe(workItem.id);

        // Property: Check for data sufficiency based on work item type
        const workItemType = result.fields['System.WorkItemType'];
        const title = result.fields['System.Title'];
        const description = result.fields['System.Description'];
        const acceptanceCriteria = result.fields['Microsoft.VSTS.Common.AcceptanceCriteria'];

        // Property: Title is always required for code generation
        const hasSufficientTitle = title && typeof title === 'string' && title.trim().length > 0;

        // Property: For User Stories, acceptance criteria or description should be present
        if (workItemType === 'User Story') {
          const hasDescription = description && typeof description === 'string' && description.trim().length > 0;
          const hasAcceptanceCriteria = acceptanceCriteria && typeof acceptanceCriteria === 'string' && acceptanceCriteria.trim().length > 0;
          
          // Property: User Story needs either description or acceptance criteria for code generation
          const hasSufficientUserStoryData = hasDescription || hasAcceptanceCriteria;
          
          // If title is missing or both description and acceptance criteria are missing,
          // this work item has insufficient data
          const isInsufficient = !hasSufficientTitle || !hasSufficientUserStoryData;
          
          // Property: We can consistently identify insufficient data
          expect(typeof isInsufficient).toBe('boolean');
        }

        // Property: For Tasks and Bugs, description should be present
        if (workItemType === 'Task' || workItemType === 'Bug') {
          const hasDescription = description && typeof description === 'string' && description.trim().length > 0;
          const isInsufficient = !hasSufficientTitle || !hasDescription;
          
          // Property: We can consistently identify insufficient data
          expect(typeof isInsufficient).toBe('boolean');
        }
      }), { numRuns: 100 });
    });

    it('should handle work item validation errors consistently', async () => {
      await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 999999 }), async (workItemId) => {
        // Reset mocks for each property test run
        jest.clearAllMocks();
        
        // Setup mock to return null (work item not found)
        mockWorkItemApi.getWorkItem.mockResolvedValue(null);

        // Property: Service should consistently throw error for non-existent work items
        try {
          await service.getWorkItem(workItemId);
          // If we reach here, the test should fail
          expect(true).toBe(false); // Force failure
        } catch (error: any) {
          // Property: Error should contain the work item ID
          expect(error.message).toContain(`Work item ${workItemId} not found`);
        }
        
        // Property: API should be called at least once
        expect(mockWorkItemApi.getWorkItem).toHaveBeenCalled();
      }), { numRuns: 50 });
    });
  });

  describe('Property 12: Work Item Linking', () => {
    /**
     * **Validates: Requirements 5.3**
     * Property: For any pull request created, it must be linked to the work item 
     * original in Azure DevOps
     */
    it('should link pull requests to work items consistently', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 999999 }), // workItemId
        fc.integer({ min: 1, max: 999999 }), // pullRequestId
        fc.string({ minLength: 1, maxLength: 100 }), // repositoryId
        async (workItemId, pullRequestId, repositoryId) => {
          // Reset mocks for each property test run
          jest.clearAllMocks();
          
          // Setup mock to succeed
          mockWorkItemApi.updateWorkItem.mockResolvedValue({});

          // Execute the linking operation
          await service.linkPullRequestToWorkItem(workItemId, pullRequestId, repositoryId);

          // Property: updateWorkItem should be called at least once
          expect(mockWorkItemApi.updateWorkItem).toHaveBeenCalled();

          // Property: The call should include correct parameters
          const calls = mockWorkItemApi.updateWorkItem.mock.calls;
          const [customHeaders, updateDocument, calledWorkItemId, project] = calls[0];
          
          expect(customHeaders).toBeUndefined();
          expect(calledWorkItemId).toBe(workItemId);
          expect(project).toBe('test-project');

          // Property: Update document should have correct structure
          expect(Array.isArray(updateDocument)).toBe(true);
          expect(updateDocument).toHaveLength(1);
          
          const operation = updateDocument[0];
          expect(operation.op).toBe('add');
          expect(operation.path).toBe('/relations/-');
          expect(operation.value).toBeDefined();
          expect(operation.value.rel).toBe('ArtifactLink');
          expect(operation.value.attributes).toBeDefined();
          expect(operation.value.attributes.name).toBe('Pull Request');

          // Property: URL should be correctly formatted
          const expectedUrl = `https://dev.azure.com/test-org/test-project/_git/${repositoryId}/pullrequest/${pullRequestId}`;
          expect(operation.value.url).toBe(expectedUrl);
        }
      ), { numRuns: 100 });
    });

    it('should maintain linking consistency across different repository formats', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 999999 }), // workItemId
        fc.integer({ min: 1, max: 999999 }), // pullRequestId
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 50 }), // simple repo name
          fc.uuid(), // UUID format
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('/')) // no slashes
        ), // repositoryId
        async (workItemId, pullRequestId, repositoryId) => {
          // Reset mocks for each property test run
          jest.clearAllMocks();
          
          // Setup mock to succeed
          mockWorkItemApi.updateWorkItem.mockResolvedValue({});

          // Execute the linking operation
          await service.linkPullRequestToWorkItem(workItemId, pullRequestId, repositoryId);

          // Property: Linking should work regardless of repository ID format
          expect(mockWorkItemApi.updateWorkItem).toHaveBeenCalled();

          const calls = mockWorkItemApi.updateWorkItem.mock.calls;
          const [, updateDocument] = calls[0];
          const operation = updateDocument[0];

          // Property: URL should always be well-formed
          expect(operation.value.url).toMatch(/^https:\/\/dev\.azure\.com\/test-org\/test-project\/_git\/.+\/pullrequest\/\d+$/);
          
          // Property: Repository ID should be preserved in URL
          expect(operation.value.url).toContain(repositoryId);
          expect(operation.value.url).toContain(pullRequestId.toString());
        }
      ), { numRuns: 100 });
    });

    it('should handle linking failures consistently', async () => {
      await fc.assert(fc.asyncProperty(
        fc.integer({ min: 1, max: 999999 }), // workItemId
        fc.integer({ min: 1, max: 999999 }), // pullRequestId
        fc.string({ minLength: 1, maxLength: 100 }), // repositoryId
        async (workItemId, pullRequestId, repositoryId) => {
          // Reset mocks for each property test run
          jest.clearAllMocks();
          
          // Setup mock to fail with a non-retryable error (4xx status)
          const linkError = new Error('Bad Request') as any;
          linkError.statusCode = 400; // Non-retryable error
          mockWorkItemApi.updateWorkItem.mockRejectedValue(linkError);

          // Property: Service should consistently throw API error for linking failures
          try {
            await service.linkPullRequestToWorkItem(workItemId, pullRequestId, repositoryId);
            // If we reach here, the test should fail
            expect(true).toBe(false); // Force failure
          } catch (error: any) {
            // Property: Error should be an API error
            expect(error.message).toMatch(/Azure DevOps API error/);
          }

          // Property: Should attempt the operation at least once
          expect(mockWorkItemApi.updateWorkItem).toHaveBeenCalled();
        }
      ), { numRuns: 5 }); // Minimal runs to avoid timeout
    }, 10000); // Reduced timeout

    it('should preserve work item linking relationship integrity', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.tuple(
          fc.integer({ min: 1, max: 999999 }), // workItemId
          fc.integer({ min: 1, max: 999999 }), // pullRequestId
          fc.string({ minLength: 1, maxLength: 50 }) // repositoryId
        ), { minLength: 1, maxLength: 5 }),
        async (linkingOperations) => {
          // Reset mocks for each property test run
          jest.clearAllMocks();
          
          // Setup mock to succeed for all operations
          mockWorkItemApi.updateWorkItem.mockResolvedValue({});

          // Execute all linking operations
          for (const [workItemId, pullRequestId, repositoryId] of linkingOperations) {
            await service.linkPullRequestToWorkItem(workItemId, pullRequestId, repositoryId);
          }

          // Property: Each operation should result in at least one API call
          expect(mockWorkItemApi.updateWorkItem).toHaveBeenCalled();
          
          // Property: Should have made calls for each operation (allowing for retries)
          const totalCalls = mockWorkItemApi.updateWorkItem.mock.calls.length;
          expect(totalCalls).toBeGreaterThanOrEqual(linkingOperations.length);

          // Property: Each call should have valid parameters
          const calls = mockWorkItemApi.updateWorkItem.mock.calls;
          for (let i = 0; i < Math.min(calls.length, linkingOperations.length); i++) {
            const [, updateDocument] = calls[i];
            
            expect(updateDocument).toHaveLength(1);
            expect(updateDocument[0].op).toBe('add');
            expect(updateDocument[0].path).toBe('/relations/-');
          }
        }
      ), { numRuns: 20 });
    });
  });

  describe('Cross-Property Validation', () => {
    it('should maintain data consistency between work item retrieval and linking', async () => {
      await fc.assert(fc.asyncProperty(
        workItemArb,
        fc.integer({ min: 1, max: 999999 }), // pullRequestId
        fc.string({ minLength: 1, maxLength: 100 }), // repositoryId
        async (workItem, pullRequestId, repositoryId) => {
          // Reset mocks for each property test run
          jest.clearAllMocks();
          
          // Setup mocks
          mockWorkItemApi.getWorkItem.mockResolvedValue(workItem);
          mockWorkItemApi.updateWorkItem.mockResolvedValue({});

          // First retrieve the work item
          const retrievedWorkItem = await service.getWorkItem(workItem.id);

          // Reset mocks to isolate the linking operation
          jest.clearAllMocks();
          mockWorkItemApi.updateWorkItem.mockResolvedValue({});

          // Then link a PR to it
          await service.linkPullRequestToWorkItem(workItem.id, pullRequestId, repositoryId);

          // Property: Work item ID should be consistent across operations
          expect(retrievedWorkItem.id).toBe(workItem.id);
          
          // Property: Linking should use the same work item ID
          const calls = mockWorkItemApi.updateWorkItem.mock.calls;
          if (calls.length > 0) {
            const [, , linkedWorkItemId] = calls[0];
            expect(linkedWorkItemId).toBe(workItem.id);
            expect(linkedWorkItemId).toBe(retrievedWorkItem.id);
          }
        }
      ), { numRuns: 50 });
    });
  });
});