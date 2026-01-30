/**
 * Unit tests for Azure DevOps models and interfaces
 */

import {
  IWorkItem,
  IProject,
  IWorkItemComment,
  IPullRequest,
  ICreatePullRequest,
  IApiResponse,
  IApiError,
  IWorkItemUpdate,
  IWebhookSubscription
} from '../../../src/models/azureDevOps';

describe('Azure DevOps Models', () => {
  describe('IWorkItem interface', () => {
    it('should accept complete work item structure from Azure DevOps API', () => {
      const workItem: IWorkItem = {
        id: 123,
        rev: 5,
        url: 'https://dev.azure.com/org/project/_apis/wit/workItems/123',
        fields: {
          'System.Id': 123,
          'System.WorkItemType': 'User Story',
          'System.Title': 'Implement user authentication',
          'System.State': 'Active',
          'System.AssignedTo': {
            displayName: 'John Doe',
            uniqueName: 'john.doe@company.com',
            id: 'user-guid-123'
          },
          'System.Description': 'As a user, I want to authenticate securely...',
          'System.AreaPath': 'Project\\Team\\Authentication',
          'System.IterationPath': 'Project\\Sprint 1',
          'System.Tags': 'authentication; security; user-story',
          'System.Priority': 2,
          'System.CreatedDate': '2024-01-15T10:30:00Z',
          'System.ChangedDate': '2024-01-16T14:20:00Z',
          'System.CreatedBy': {
            displayName: 'Jane Smith',
            uniqueName: 'jane.smith@company.com',
            id: 'user-guid-456'
          },
          'Microsoft.VSTS.Common.AcceptanceCriteria': 'Given a user... When they... Then they should...'
        }
      };

      expect(workItem.id).toBe(123);
      expect(workItem.fields['System.Title']).toBe('Implement user authentication');
      expect(workItem.fields['System.AssignedTo']?.displayName).toBe('John Doe');
    });

    it('should handle bug work items with reproduction steps', () => {
      const bugWorkItem: IWorkItem = {
        id: 456,
        rev: 2,
        url: 'https://dev.azure.com/org/project/_apis/wit/workItems/456',
        fields: {
          'System.Id': 456,
          'System.WorkItemType': 'Bug',
          'System.Title': 'Login page crashes on invalid input',
          'System.State': 'New',
          'System.Description': 'The login page crashes when invalid credentials are entered',
          'System.AreaPath': 'Project\\Team\\Frontend',
          'System.IterationPath': 'Project\\Sprint 2',
          'System.Priority': 1,
          'System.CreatedDate': '2024-01-17T09:15:00Z',
          'System.ChangedDate': '2024-01-17T09:15:00Z',
          'System.CreatedBy': {
            displayName: 'Test User',
            uniqueName: 'test.user@company.com',
            id: 'user-guid-789'
          },
          'Microsoft.VSTS.TCM.ReproductionSteps': '1. Navigate to login\n2. Enter invalid credentials\n3. Click login button'
        },
        relations: [
          {
            rel: 'System.LinkTypes.Related',
            url: 'https://dev.azure.com/org/project/_apis/wit/workItems/123',
            attributes: {
              name: 'Related'
            }
          }
        ]
      };

      expect(bugWorkItem.fields['System.WorkItemType']).toBe('Bug');
      expect(bugWorkItem.fields['Microsoft.VSTS.TCM.ReproductionSteps']).toContain('Navigate to login');
      expect(bugWorkItem.relations).toHaveLength(1);
    });

    it('should handle custom fields dynamically', () => {
      const workItemWithCustomFields: IWorkItem = {
        id: 789,
        rev: 1,
        url: 'https://dev.azure.com/org/project/_apis/wit/workItems/789',
        fields: {
          'System.Id': 789,
          'System.WorkItemType': 'Feature',
          'System.Title': 'Custom feature',
          'System.State': 'New',
          'System.AreaPath': 'Project\\Team',
          'System.IterationPath': 'Project\\Sprint 3',
          'System.CreatedDate': '2024-01-18T11:00:00Z',
          'System.ChangedDate': '2024-01-18T11:00:00Z',
          'System.CreatedBy': {
            displayName: 'Developer',
            uniqueName: 'dev@company.com',
            id: 'user-guid-dev'
          },
          'Custom.BusinessValue': 'High',
          'Custom.Effort': 13,
          'Custom.RiskLevel': 'Medium'
        }
      };

      expect(workItemWithCustomFields.fields['Custom.BusinessValue']).toBe('High');
      expect(workItemWithCustomFields.fields['Custom.Effort']).toBe(13);
    });
  });

  describe('IProject interface', () => {
    it('should represent Azure DevOps project correctly', () => {
      const project: IProject = {
        id: 'project-guid-123',
        name: 'Redimento Code Generator',
        description: 'Automated code generation from work items',
        url: 'https://dev.azure.com/org/project',
        state: 'wellFormed',
        revision: 10,
        visibility: 'private'
      };

      expect(project.name).toBe('Redimento Code Generator');
      expect(project.state).toBe('wellFormed');
      expect(project.visibility).toBe('private');
    });
  });

  describe('IPullRequest interface', () => {
    it('should represent complete pull request data', () => {
      const pullRequest: IPullRequest = {
        pullRequestId: 42,
        title: 'feat/123_implement_user_authentication',
        description: 'Implements user authentication feature\n\nCloses #123',
        sourceRefName: 'refs/heads/feat/123_implement_user_authentication',
        targetRefName: 'refs/heads/main',
        status: 'active',
        createdBy: {
          displayName: 'Code Generator',
          uniqueName: 'codegen@company.com',
          id: 'system-user-guid'
        },
        creationDate: '2024-01-19T15:30:00Z',
        url: 'https://dev.azure.com/org/project/_git/repo/pullrequest/42',
        repository: {
          id: 'repo-guid-123',
          name: 'main-repository',
          url: 'https://dev.azure.com/org/project/_git/repo'
        },
        reviewers: [
          {
            id: 'reviewer-guid-1',
            displayName: 'Senior Developer',
            uniqueName: 'senior.dev@company.com',
            vote: 0,
            isRequired: true,
            isContainer: false
          },
          {
            id: 'team-guid-1',
            displayName: 'Architecture Team',
            uniqueName: 'arch-team@company.com',
            vote: 0,
            isRequired: false,
            isContainer: true
          }
        ],
        workItemRefs: [
          {
            id: '123',
            url: 'https://dev.azure.com/org/project/_apis/wit/workItems/123'
          }
        ]
      };

      expect(pullRequest.pullRequestId).toBe(42);
      expect(pullRequest.reviewers).toHaveLength(2);
      expect(pullRequest.workItemRefs).toHaveLength(1);
      if (pullRequest.reviewers && pullRequest.reviewers.length >= 2) {
        expect(pullRequest.reviewers[0]!.isRequired).toBe(true);
        expect(pullRequest.reviewers[1]!.isContainer).toBe(true);
      }
    });
  });

  describe('ICreatePullRequest interface', () => {
    it('should define structure for creating pull requests', () => {
      const createPR: ICreatePullRequest = {
        title: 'feat/456_new_feature_implementation',
        description: 'Implements new feature based on work item #456\n\n- Added feature logic\n- Added tests\n- Updated documentation',
        sourceRefName: 'refs/heads/feat/456_new_feature_implementation',
        targetRefName: 'refs/heads/develop',
        reviewers: [
          {
            id: 'reviewer-1',
            isRequired: true
          },
          {
            id: 'reviewer-2',
            isRequired: false
          }
        ]
      };

      expect(createPR.title).toContain('feat/456');
      expect(createPR.reviewers).toHaveLength(2);
      if (createPR.reviewers && createPR.reviewers.length > 0) {
        expect(createPR.reviewers[0]!.isRequired).toBe(true);
      }
    });
  });

  describe('IWorkItemComment interface', () => {
    it('should represent work item comments correctly', () => {
      const comment: IWorkItemComment = {
        id: 1,
        text: 'Code generation completed successfully. Branch feat/123_user_auth created.',
        createdBy: {
          displayName: 'Redimento Code Generator',
          uniqueName: 'system@company.com',
          id: 'system-guid'
        },
        createdDate: '2024-01-20T10:15:00Z',
        modifiedDate: '2024-01-20T10:15:00Z',
        version: 1
      };

      expect(comment.text).toContain('Code generation completed');
      expect(comment.createdBy.displayName).toBe('Redimento Code Generator');
      expect(comment.version).toBe(1);
    });
  });

  describe('IWorkItemUpdate interface', () => {
    it('should define work item update operations', () => {
      const updates: IWorkItemUpdate[] = [
        {
          op: 'add',
          path: '/fields/System.History',
          value: 'Automated code generation initiated'
        },
        {
          op: 'replace',
          path: '/fields/System.State',
          value: 'Active',
          from: 'New'
        },
        {
          op: 'add',
          path: '/fields/Custom.GeneratedBranch',
          value: 'feat/123_user_authentication'
        }
      ];

      expect(updates[0]!.op).toBe('add');
      expect(updates[1]!.op).toBe('replace');
      expect(updates[1]!.from).toBe('New');
      expect(updates[2]!.path).toContain('Custom.GeneratedBranch');
    });
  });

  describe('IApiResponse interface', () => {
    it('should wrap API responses correctly', () => {
      const workItemsResponse: IApiResponse<IWorkItem> = {
        value: [
          {
            id: 1,
            rev: 1,
            url: 'https://dev.azure.com/org/project/_apis/wit/workItems/1',
            fields: {
              'System.Id': 1,
              'System.WorkItemType': 'Task',
              'System.Title': 'Test task',
              'System.State': 'New',
              'System.AreaPath': 'Project',
              'System.IterationPath': 'Project\\Sprint 1',
              'System.CreatedDate': '2024-01-21T08:00:00Z',
              'System.ChangedDate': '2024-01-21T08:00:00Z',
              'System.CreatedBy': {
                displayName: 'User',
                uniqueName: 'user@company.com',
                id: 'user-guid'
              }
            }
          }
        ],
        count: 1
      };

      expect(workItemsResponse.count).toBe(1);
      expect(workItemsResponse.value).toHaveLength(1);
      expect(workItemsResponse.value[0]!.id).toBe(1);
    });
  });

  describe('IApiError interface', () => {
    it('should represent API errors correctly', () => {
      const apiError: IApiError = {
        message: 'Work item not found',
        typeKey: 'WorkItemNotFoundException',
        statusCode: 404,
        details: {
          workItemId: 999,
          project: 'test-project'
        }
      };

      expect(apiError.message).toBe('Work item not found');
      expect(apiError.statusCode).toBe(404);
      expect(apiError.details.workItemId).toBe(999);
    });
  });

  describe('IWebhookSubscription interface', () => {
    it('should define webhook subscription structure', () => {
      const subscription: IWebhookSubscription = {
        id: 'subscription-guid-123',
        consumerActionId: 'httpRequest',
        consumerId: 'webHooks',
        consumerInputs: {
          url: 'https://api.company.com/webhooks/azure-devops'
        },
        eventType: 'workitem.created',
        publisherId: 'tfs',
        publisherInputs: {
          projectId: 'project-guid',
          workItemType: 'User Story'
        },
        resourceVersion: '1.0',
        scope: 'project',
        status: 'enabled'
      };

      expect(subscription.eventType).toBe('workitem.created');
      expect(subscription.status).toBe('enabled');
      expect(subscription.consumerInputs['url']).toContain('webhooks');
    });
  });
});