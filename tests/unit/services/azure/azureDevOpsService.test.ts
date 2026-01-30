/**
 * Unit tests for Azure DevOps Service
 * Tests authentication, work item operations, and error handling
 */

import { AzureDevOpsService, IAzureDevOpsConfig } from '../../../../src/services/azure/azureDevOpsService';

// Mock the azure-devops-node-api module
jest.mock('azure-devops-node-api', () => ({
  WebApi: jest.fn(),
  getPersonalAccessTokenHandler: jest.fn()
}));

describe('AzureDevOpsService', () => {
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

  describe('Constructor and Initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(service).toBeInstanceOf(AzureDevOpsService);
    });

    it('should apply default values for optional config properties', () => {
      const minimalConfig = {
        organizationUrl: 'https://dev.azure.com/test',
        personalAccessToken: 'token',
        project: 'project'
      };

      const serviceWithDefaults = new AzureDevOpsService(minimalConfig);
      expect(serviceWithDefaults).toBeInstanceOf(AzureDevOpsService);
    });

    it('should create authentication handler with PAT', () => {
      const { getPersonalAccessTokenHandler } = require('azure-devops-node-api');
      expect(getPersonalAccessTokenHandler).toHaveBeenCalledWith('test-token');
    });
  });

  describe('getWorkItem', () => {
    const mockWorkItemData = {
      id: 123,
      rev: 1,
      url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123',
      fields: {
        'System.Id': 123,
        'System.WorkItemType': 'User Story',
        'System.Title': 'Test Work Item',
        'System.State': 'New'
      },
      relations: []
    };

    it('should retrieve work item successfully', async () => {
      mockWorkItemApi.getWorkItem.mockResolvedValue(mockWorkItemData);

      const result = await service.getWorkItem(123);

      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledWith(
        123,
        undefined,
        undefined,
        undefined,
        'test-project'
      );
      expect(result).toEqual({
        id: 123,
        rev: 1,
        url: 'https://dev.azure.com/test-org/test-project/_apis/wit/workItems/123',
        fields: mockWorkItemData.fields,
        relations: []
      });
    });

    it('should retrieve work item with specific fields', async () => {
      const fields = ['System.Title', 'System.State'];
      mockWorkItemApi.getWorkItem.mockResolvedValue(mockWorkItemData);

      await service.getWorkItem(123, fields);

      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledWith(
        123,
        fields,
        undefined,
        undefined,
        'test-project'
      );
    });

    it('should throw error when work item not found', async () => {
      mockWorkItemApi.getWorkItem.mockResolvedValue(null);

      await expect(service.getWorkItem(999)).rejects.toThrow('Work item 999 not found');
    });

    it('should handle API errors with retry logic', async () => {
      const apiError = new Error('Network error');
      mockWorkItemApi.getWorkItem
        .mockRejectedValueOnce(apiError)
        .mockRejectedValueOnce(apiError)
        .mockResolvedValue(mockWorkItemData);

      const result = await service.getWorkItem(123);

      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledTimes(3);
      expect(result.id).toBe(123);
    });

    it('should not retry on authentication errors', async () => {
      const authError = new Error('Unauthorized') as any;
      authError.statusCode = 401;
      mockWorkItemApi.getWorkItem.mockRejectedValue(authError);

      await expect(service.getWorkItem(123)).rejects.toThrow(/Azure DevOps API error/);
      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledTimes(1);
    });
  });

  describe('addWorkItemComment', () => {
    it('should add comment successfully', async () => {
      mockWorkItemApi.addComment.mockResolvedValue({});

      await service.addWorkItemComment(123, 'Test comment');

      expect(mockWorkItemApi.addComment).toHaveBeenCalledWith(
        { text: 'Test comment' },
        'test-project',
        123
      );
    });

    it('should handle empty comment text', async () => {
      mockWorkItemApi.addComment.mockResolvedValue({});

      await service.addWorkItemComment(123, '');

      expect(mockWorkItemApi.addComment).toHaveBeenCalledWith(
        { text: '' },
        'test-project',
        123
      );
    });

    it('should retry on transient failures', async () => {
      const networkError = new Error('Connection timeout');
      mockWorkItemApi.addComment
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({});

      await service.addWorkItemComment(123, 'Test comment');

      expect(mockWorkItemApi.addComment).toHaveBeenCalledTimes(2);
    });
  });

  describe('linkPullRequestToWorkItem', () => {
    it('should link pull request to work item successfully', async () => {
      mockWorkItemApi.updateWorkItem.mockResolvedValue({});

      await service.linkPullRequestToWorkItem(123, 456, 'repo-id');

      expect(mockWorkItemApi.updateWorkItem).toHaveBeenCalledWith(
        undefined,
        [{
          op: 'add',
          path: '/relations/-',
          value: {
            rel: 'ArtifactLink',
            url: 'https://dev.azure.com/test-org/test-project/_git/repo-id/pullrequest/456',
            attributes: {
              name: 'Pull Request'
            }
          }
        }],
        123,
        'test-project'
      );
    });

    it('should handle linking errors', async () => {
      const linkError = new Error('Failed to create link');
      mockWorkItemApi.updateWorkItem.mockRejectedValue(linkError);

      await expect(service.linkPullRequestToWorkItem(123, 456, 'repo-id'))
        .rejects.toThrow(/Azure DevOps API error/);
    });
  });

  describe('getWorkItemFields', () => {
    const mockFields = [
      {
        referenceName: 'System.Title',
        name: 'Title',
        type: 'String',
        isRequired: true,
        readOnly: false,
        description: 'The title of the work item'
      },
      {
        referenceName: 'System.State',
        name: 'State',
        type: 'String',
        isRequired: true,
        readOnly: false,
        allowedValues: ['New', 'Active', 'Resolved', 'Closed']
      }
    ];

    it('should retrieve work item fields successfully', async () => {
      mockWorkItemApi.getFields.mockResolvedValue(mockFields);

      const result = await service.getWorkItemFields('User Story');

      expect(mockWorkItemApi.getFields).toHaveBeenCalledWith('test-project');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        referenceName: 'System.Title',
        name: 'Title',
        type: 'String',
        isRequired: true,
        isReadOnly: false,
        description: 'The title of the work item'
      });
    });

    it('should handle empty fields response', async () => {
      mockWorkItemApi.getFields.mockResolvedValue(null);

      const result = await service.getWorkItemFields('Task');

      expect(result).toEqual([]);
    });

    it('should transform fields with missing properties', async () => {
      const incompleteFields = [
        {
          referenceName: 'Custom.Field'
          // Missing other properties
        }
      ];
      mockWorkItemApi.getFields.mockResolvedValue(incompleteFields);

      const result = await service.getWorkItemFields('Bug');

      expect(result[0]).toEqual({
        referenceName: 'Custom.Field',
        name: '',
        type: 'string',
        isRequired: false,
        isReadOnly: false
      });
    });
  });

  describe('getPullRequest', () => {
    const mockPullRequest = {
      pullRequestId: 456,
      title: 'Test PR',
      description: 'Test pull request',
      sourceRefName: 'refs/heads/feature/test',
      targetRefName: 'refs/heads/main',
      status: 'active',
      createdBy: {
        displayName: 'Test User',
        uniqueName: 'test@example.com',
        id: 'user-id'
      },
      creationDate: '2023-01-01T00:00:00Z',
      url: 'https://dev.azure.com/test-org/test-project/_git/repo/pullrequest/456',
      repository: {
        id: 'repo-id',
        name: 'test-repo',
        url: 'https://dev.azure.com/test-org/test-project/_git/repo'
      },
      reviewers: [],
      workItemRefs: []
    };

    it('should retrieve pull request successfully', async () => {
      mockGitApi.getPullRequest.mockResolvedValue(mockPullRequest);

      const result = await service.getPullRequest('repo-id', 456);

      expect(mockGitApi.getPullRequest).toHaveBeenCalledWith(
        'repo-id',
        456,
        'test-project'
      );
      expect(result).toEqual(mockPullRequest);
    });

    it('should throw error when pull request not found', async () => {
      mockGitApi.getPullRequest.mockResolvedValue(null);

      await expect(service.getPullRequest('repo-id', 999))
        .rejects.toThrow('Pull request 999 not found');
    });
  });

  describe('createPullRequest', () => {
    const mockPrData = {
      title: 'New PR',
      description: 'New pull request',
      sourceRefName: 'refs/heads/feature/new',
      targetRefName: 'refs/heads/main'
    };

    const mockCreatedPr = {
      pullRequestId: 789,
      ...mockPrData,
      status: 'active',
      createdBy: {
        displayName: 'Test User',
        uniqueName: 'test@example.com',
        id: 'user-id'
      },
      creationDate: '2023-01-01T00:00:00Z',
      url: 'https://dev.azure.com/test-org/test-project/_git/repo/pullrequest/789',
      repository: {
        id: 'repo-id',
        name: 'test-repo',
        url: 'https://dev.azure.com/test-org/test-project/_git/repo'
      },
      reviewers: [],
      workItemRefs: []
    };

    it('should create pull request successfully', async () => {
      mockGitApi.createPullRequest.mockResolvedValue(mockCreatedPr);

      const result = await service.createPullRequest('repo-id', mockPrData);

      expect(mockGitApi.createPullRequest).toHaveBeenCalledWith(
        mockPrData,
        'repo-id',
        'test-project'
      );
      expect(result.pullRequestId).toBe(789);
      expect(result.title).toBe('New PR');
    });

    it('should throw error when creation fails', async () => {
      mockGitApi.createPullRequest.mockResolvedValue(null);

      await expect(service.createPullRequest('repo-id', mockPrData))
        .rejects.toThrow('Failed to create pull request');
    });
  });

  describe('Error Handling', () => {
    it('should identify non-retryable errors correctly', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.statusCode = 404;
      mockWorkItemApi.getWorkItem.mockRejectedValue(notFoundError);

      await expect(service.getWorkItem(123)).rejects.toThrow(/Azure DevOps API error/);
      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledTimes(1);
    });

    it('should retry on server errors', async () => {
      const serverError = new Error('Internal server error') as any;
      serverError.statusCode = 500;
      mockWorkItemApi.getWorkItem
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError)
        .mockRejectedValueOnce(serverError);

      await expect(service.getWorkItem(123)).rejects.toThrow(/Azure DevOps API error/);
      expect(mockWorkItemApi.getWorkItem).toHaveBeenCalledTimes(3);
    });

    it('should include operation context in error messages', async () => {
      const error = new Error('Test error');
      mockWorkItemApi.getWorkItem.mockRejectedValue(error);

      try {
        await service.getWorkItem(123);
      } catch (apiError: any) {
        expect(apiError.message).toContain('getWorkItem');
        expect(apiError.details.operation).toBe('getWorkItem');
        expect(apiError.details.timestamp).toBeDefined();
      }
    });
  });

  describe('Factory Functions', () => {
    it('should create service instance with factory function', () => {
      const { createAzureDevOpsService } = require('../../../../src/services/azure/azureDevOpsService');
      
      const service = createAzureDevOpsService(mockConfig);
      expect(service).toBeInstanceOf(AzureDevOpsService);
    });

    it('should create service from environment variables', () => {
      // Mock environment variables
      process.env['AZURE_DEVOPS_ORG_URL'] = 'https://dev.azure.com/env-org';
      process.env['AZURE_DEVOPS_TOKEN'] = 'env-token';
      process.env['AZURE_DEVOPS_PROJECT'] = 'env-project';
      process.env['AZURE_DEVOPS_TIMEOUT'] = '60000';
      process.env['MAX_RETRY_ATTEMPTS'] = '5';

      const { createAzureDevOpsServiceFromEnv } = require('../../../../src/services/azure/azureDevOpsService');
      
      const service = createAzureDevOpsServiceFromEnv();
      expect(service).toBeInstanceOf(AzureDevOpsService);

      // Clean up environment variables
      delete process.env['AZURE_DEVOPS_ORG_URL'];
      delete process.env['AZURE_DEVOPS_TOKEN'];
      delete process.env['AZURE_DEVOPS_PROJECT'];
      delete process.env['AZURE_DEVOPS_TIMEOUT'];
      delete process.env['MAX_RETRY_ATTEMPTS'];
    });

    it('should throw error when required environment variables are missing', () => {
      const { createAzureDevOpsServiceFromEnv } = require('../../../../src/services/azure/azureDevOpsService');
      
      expect(() => createAzureDevOpsServiceFromEnv())
        .toThrow('AZURE_DEVOPS_ORG_URL environment variable is required');
    });
  });
});