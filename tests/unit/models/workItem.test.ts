/**
 * Unit tests for Work Item models and interfaces
 */

import {
  WorkItemType,
  IWorkItemWebhookPayload,
  IEnrichedWorkItem,
  IWorkItemField,
  IProcessingResult
} from '../../../src/models/workItem';

describe('Work Item Models', () => {
  describe('WorkItemType enum', () => {
    it('should have correct values for all work item types', () => {
      expect(WorkItemType.USER_STORY).toBe('User Story');
      expect(WorkItemType.TASK).toBe('Task');
      expect(WorkItemType.BUG).toBe('Bug');
      expect(WorkItemType.FEATURE).toBe('Feature');
      expect(WorkItemType.EPIC).toBe('Epic');
    });

    it('should contain all expected work item types', () => {
      const expectedTypes = ['User Story', 'Task', 'Bug', 'Feature', 'Epic'];
      const actualTypes = Object.values(WorkItemType);
      
      expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
      expect(actualTypes).toHaveLength(expectedTypes.length);
    });
  });

  describe('IWorkItemWebhookPayload interface', () => {
    it('should accept valid webhook payload structure', () => {
      const validPayload: IWorkItemWebhookPayload = {
        eventType: 'workitem.created',
        publisherId: 'tfs',
        resource: {
          id: 123,
          workItemType: 'User Story',
          url: 'https://dev.azure.com/org/project/_apis/wit/workItems/123',
          fields: {
            'System.Title': 'Test User Story',
            'System.State': 'New'
          }
        },
        resourceVersion: '1.0',
        resourceContainers: {
          project: {
            id: 'project-guid',
            name: 'Test Project'
          }
        }
      };

      // Should compile without errors and have correct structure
      expect(validPayload.eventType).toBe('workitem.created');
      expect(validPayload.resource.id).toBe(123);
      expect(validPayload.resourceContainers.project.name).toBe('Test Project');
    });

    it('should handle dynamic fields in resource', () => {
      const payload: IWorkItemWebhookPayload = {
        eventType: 'workitem.updated',
        publisherId: 'tfs',
        resource: {
          id: 456,
          workItemType: 'Bug',
          url: 'https://dev.azure.com/org/project/_apis/wit/workItems/456',
          fields: {
            'System.Title': 'Critical Bug',
            'System.Priority': 1,
            'Microsoft.VSTS.TCM.ReproductionSteps': 'Steps to reproduce...',
            'Custom.Field': 'Custom value'
          }
        },
        resourceVersion: '1.0',
        resourceContainers: {
          project: {
            id: 'project-guid-2',
            name: 'Bug Project'
          }
        }
      };

      expect(payload.resource.fields['System.Priority']).toBe(1);
      expect(payload.resource.fields['Custom.Field']).toBe('Custom value');
    });
  });

  describe('IEnrichedWorkItem interface', () => {
    it('should accept complete enriched work item data', () => {
      const enrichedWorkItem: IEnrichedWorkItem = {
        id: 789,
        type: WorkItemType.USER_STORY,
        title: 'Implement user authentication',
        description: 'As a user, I want to log in securely...',
        acceptanceCriteria: 'Given a valid user... When they log in... Then they should...',
        assignedTo: 'john.doe@company.com',
        areaPath: 'Project\\Team\\Authentication',
        iterationPath: 'Project\\Sprint 1',
        state: 'Active',
        priority: 2,
        tags: ['authentication', 'security', 'user-story'],
        customFields: {
          'Custom.Effort': 8,
          'Custom.BusinessValue': 'High'
        }
      };

      expect(enrichedWorkItem.type).toBe(WorkItemType.USER_STORY);
      expect(enrichedWorkItem.tags).toContain('authentication');
      expect(enrichedWorkItem.customFields['Custom.Effort']).toBe(8);
    });

    it('should handle optional fields correctly', () => {
      const minimalWorkItem: IEnrichedWorkItem = {
        id: 101,
        type: WorkItemType.TASK,
        title: 'Simple task',
        areaPath: 'Project\\Team',
        iterationPath: 'Project\\Sprint 2',
        state: 'New',
        priority: 3,
        tags: [],
        customFields: {}
      };

      expect(minimalWorkItem.description).toBeUndefined();
      expect(minimalWorkItem.acceptanceCriteria).toBeUndefined();
      expect(minimalWorkItem.reproductionSteps).toBeUndefined();
      expect(minimalWorkItem.assignedTo).toBeUndefined();
    });

    it('should handle bug-specific fields', () => {
      const bugWorkItem: IEnrichedWorkItem = {
        id: 202,
        type: WorkItemType.BUG,
        title: 'Login page crashes',
        description: 'The login page crashes when invalid credentials are entered',
        reproductionSteps: '1. Navigate to login page\n2. Enter invalid credentials\n3. Click login',
        areaPath: 'Project\\Team\\Frontend',
        iterationPath: 'Project\\Sprint 3',
        state: 'Active',
        priority: 1,
        tags: ['bug', 'frontend', 'critical'],
        customFields: {
          'Microsoft.VSTS.Common.Severity': 'High'
        }
      };

      expect(bugWorkItem.type).toBe(WorkItemType.BUG);
      expect(bugWorkItem.reproductionSteps).toContain('Navigate to login page');
    });
  });

  describe('IWorkItemField interface', () => {
    it('should define work item field metadata correctly', () => {
      const titleField: IWorkItemField = {
        referenceName: 'System.Title',
        name: 'Title',
        type: 'String',
        isRequired: true,
        isReadOnly: false,
        description: 'The title of the work item'
      };

      expect(titleField.referenceName).toBe('System.Title');
      expect(titleField.isRequired).toBe(true);
      expect(titleField.isReadOnly).toBe(false);
    });

    it('should handle fields with allowed values', () => {
      const stateField: IWorkItemField = {
        referenceName: 'System.State',
        name: 'State',
        type: 'String',
        isRequired: true,
        isReadOnly: false,
        description: 'The current state of the work item',
        allowedValues: ['New', 'Active', 'Resolved', 'Closed']
      };

      expect(stateField.allowedValues).toContain('New');
      expect(stateField.allowedValues).toContain('Closed');
      expect(stateField.allowedValues).toHaveLength(4);
    });
  });

  describe('IProcessingResult interface', () => {
    it('should represent successful processing result', () => {
      const successResult: IProcessingResult = {
        success: true,
        workItem: {
          id: 303,
          type: WorkItemType.FEATURE,
          title: 'New feature',
          areaPath: 'Project\\Team',
          iterationPath: 'Project\\Sprint 4',
          state: 'New',
          priority: 2,
          tags: ['feature'],
          customFields: {}
        },
        details: {
          processingTime: 1500,
          targetRepository: 'main-repo',
          branchName: 'feat/303_new_feature',
          pullRequestId: 42
        }
      };

      expect(successResult.success).toBe(true);
      expect(successResult.workItem?.id).toBe(303);
      expect(successResult.details?.branchName).toBe('feat/303_new_feature');
    });

    it('should represent failed processing result', () => {
      const failureResult: IProcessingResult = {
        success: false,
        error: 'Work item does not contain sufficient information for code generation',
        details: {
          processingTime: 500
        }
      };

      expect(failureResult.success).toBe(false);
      expect(failureResult.error).toContain('sufficient information');
      expect(failureResult.workItem).toBeUndefined();
    });
  });
});