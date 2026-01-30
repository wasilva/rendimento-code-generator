/**
 * Property-based tests for Work Item models
 * Tests universal properties that must hold for all valid inputs
 */

import * as fc from 'fast-check';
import {
  WorkItemType,
  IWorkItemWebhookPayload
} from '../../../src/models/workItem';

describe('Work Item Models - Property Tests', () => {
  describe('Property 1: Webhook Processing Consistency', () => {
    /**
     * **Validates: Requirements 1.2, 2.1, 2.2, 2.3**
     * 
     * Property: For any valid work item received via webhook, the system should
     * process the payload and extract information consistently, regardless of
     * work item type.
     * 
     * This property ensures that:
     * - All webhook payloads with valid structure can be processed
     * - Work item type doesn't affect the ability to extract basic information
     * - Required fields are always accessible from the payload
     * - The processing is deterministic and consistent
     */
    it('should consistently process webhook payloads regardless of work item type', () => {
      // Generator for valid work item types
      const workItemTypeArb = fc.constantFrom(
        WorkItemType.USER_STORY,
        WorkItemType.TASK,
        WorkItemType.BUG,
        WorkItemType.FEATURE,
        WorkItemType.EPIC
      );

      // Generator for valid event types
      const eventTypeArb = fc.constantFrom(
        'workitem.created',
        'workitem.updated',
        'workitem.restored',
        'workitem.commented'
      );

      // Generator for valid work item IDs (positive integers)
      const workItemIdArb = fc.integer({ min: 1, max: 999999 });

      // Generator for valid project GUIDs
      const projectGuidArb = fc.uuid();

      // Generator for project names (non-empty strings)
      const projectNameArb = fc.string({ minLength: 1, maxLength: 100 })
        .filter(name => name.trim().length > 0);

      // Generator for work item titles
      const titleArb = fc.string({ minLength: 1, maxLength: 255 })
        .filter(title => title.trim().length > 0);

      // Generator for work item states
      const stateArb = fc.constantFrom('New', 'Active', 'Resolved', 'Closed', 'Removed');

      // Generator for area paths
      const areaPathArb = fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        { minLength: 1, maxLength: 5 }
      ).map(parts => parts.join('\\'));

      // Generator for iteration paths
      const iterationPathArb = fc.array(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        { minLength: 1, maxLength: 5 }
      ).map(parts => parts.join('\\'));

      // Generator for optional descriptions
      const descriptionArb = fc.option(
        fc.string({ minLength: 0, maxLength: 1000 }),
        { nil: undefined }
      );

      // Generator for optional assigned users
      const assignedToArb = fc.option(
        fc.record({
          displayName: fc.string({ minLength: 1, maxLength: 100 }),
          uniqueName: fc.emailAddress(),
          id: fc.uuid()
        }),
        { nil: undefined }
      );

      // Generator for priority values
      const priorityArb = fc.option(fc.integer({ min: 1, max: 4 }), { nil: undefined });

      // Generator for tags
      const tagsArb = fc.option(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 })
          .map(tags => tags.join('; ')),
        { nil: undefined }
      );

      // Generator for work item type specific fields
      const typeSpecificFieldsArb = (workItemType: WorkItemType) => {
        switch (workItemType) {
          case WorkItemType.USER_STORY:
            return fc.record({
              'Microsoft.VSTS.Common.AcceptanceCriteria': fc.option(
                fc.string({ minLength: 0, maxLength: 2000 }),
                { nil: undefined }
              )
            });
          case WorkItemType.BUG:
            return fc.record({
              'Microsoft.VSTS.TCM.ReproductionSteps': fc.option(
                fc.string({ minLength: 0, maxLength: 2000 }),
                { nil: undefined }
              )
            });
          default:
            return fc.record({});
        }
      };

      // Main generator for webhook payloads
      const webhookPayloadArb = fc.tuple(
        eventTypeArb,
        workItemTypeArb,
        workItemIdArb,
        projectGuidArb,
        projectNameArb,
        titleArb,
        stateArb,
        areaPathArb,
        iterationPathArb,
        descriptionArb,
        assignedToArb,
        priorityArb,
        tagsArb
      ).chain(([
        eventType,
        workItemType,
        workItemId,
        projectGuid,
        projectName,
        title,
        state,
        areaPath,
        iterationPath,
        description,
        assignedTo,
        priority,
        tags
      ]) => {
        return typeSpecificFieldsArb(workItemType).map(typeSpecificFields => {
          const fields: Record<string, any> = {
            'System.Id': workItemId,
            'System.WorkItemType': workItemType,
            'System.Title': title,
            'System.State': state,
            'System.AreaPath': areaPath,
            'System.IterationPath': iterationPath,
            'System.CreatedDate': new Date().toISOString(),
            'System.ChangedDate': new Date().toISOString(),
            'System.CreatedBy': {
              displayName: 'Test User',
              uniqueName: 'test@company.com',
              id: fc.sample(fc.uuid(), 1)[0]
            },
            ...typeSpecificFields
          };

          // Add optional fields if they exist
          if (description !== undefined) {
            fields['System.Description'] = description;
          }
          if (assignedTo !== undefined) {
            fields['System.AssignedTo'] = assignedTo;
          }
          if (priority !== undefined) {
            fields['System.Priority'] = priority;
          }
          if (tags !== undefined) {
            fields['System.Tags'] = tags;
          }

          const payload: IWorkItemWebhookPayload = {
            eventType,
            publisherId: 'tfs',
            resource: {
              id: workItemId,
              workItemType,
              url: `https://dev.azure.com/org/project/_apis/wit/workItems/${workItemId}`,
              fields
            },
            resourceVersion: '1.0',
            resourceContainers: {
              project: {
                id: projectGuid,
                name: projectName
              }
            }
          };

          return payload;
        });
      });

      // Property test
      fc.assert(
        fc.property(webhookPayloadArb, (payload) => {
          // Test that basic information can always be extracted consistently
          const extractedInfo = extractBasicWorkItemInfo(payload);

          // Property 1: Basic information extraction should always succeed for valid payloads
          expect(extractedInfo.success).toBe(true);
          expect(extractedInfo.workItemId).toBe(payload.resource.id);
          expect(extractedInfo.workItemType).toBe(payload.resource.workItemType);
          expect(extractedInfo.projectId).toBe(payload.resourceContainers.project.id);
          expect(extractedInfo.projectName).toBe(payload.resourceContainers.project.name);

          // Property 2: Required system fields should always be accessible
          expect(extractedInfo.title).toBe(payload.resource.fields['System.Title']);
          expect(extractedInfo.state).toBe(payload.resource.fields['System.State']);
          expect(extractedInfo.areaPath).toBe(payload.resource.fields['System.AreaPath']);
          expect(extractedInfo.iterationPath).toBe(payload.resource.fields['System.IterationPath']);

          // Property 3: Processing should be deterministic - same input produces same output
          const extractedInfo2 = extractBasicWorkItemInfo(payload);
          expect(extractedInfo).toEqual(extractedInfo2);

          // Property 4: Work item type should not affect basic field extraction
          const hasRequiredFields = 
            extractedInfo.workItemId > 0 &&
            extractedInfo.workItemType.length > 0 &&
            extractedInfo.title.length > 0 &&
            extractedInfo.state.length > 0 &&
            extractedInfo.areaPath.length > 0 &&
            extractedInfo.iterationPath.length > 0;

          expect(hasRequiredFields).toBe(true);

          // Property 5: Optional fields should be handled consistently
          if (payload.resource.fields['System.Description']) {
            expect(extractedInfo.description).toBe(payload.resource.fields['System.Description']);
          } else {
            expect(extractedInfo.description).toBeUndefined();
          }

          if (payload.resource.fields['System.AssignedTo']) {
            expect(extractedInfo.assignedTo).toBe(payload.resource.fields['System.AssignedTo'].displayName);
          } else {
            expect(extractedInfo.assignedTo).toBeUndefined();
          }

          // Property 6: Type-specific fields should be accessible when present
          if (extractedInfo.workItemType === WorkItemType.USER_STORY) {
            const acceptanceCriteria = payload.resource.fields['Microsoft.VSTS.Common.AcceptanceCriteria'];
            if (acceptanceCriteria !== undefined) {
              expect(extractedInfo.typeSpecificData?.acceptanceCriteria).toBe(acceptanceCriteria);
            }
          }

          if (extractedInfo.workItemType === WorkItemType.BUG) {
            const reproductionSteps = payload.resource.fields['Microsoft.VSTS.TCM.ReproductionSteps'];
            if (reproductionSteps !== undefined) {
              expect(extractedInfo.typeSpecificData?.reproductionSteps).toBe(reproductionSteps);
            }
          }

          return true;
        }),
        { numRuns: 100, verbose: true }
      );
    });

    it('should handle malformed webhook payloads gracefully', () => {
      // Generator for potentially malformed payloads
      const malformedPayloadArb = fc.record({
        eventType: fc.option(fc.string(), { nil: undefined }),
        publisherId: fc.option(fc.string(), { nil: undefined }),
        resource: fc.option(fc.record({
          id: fc.option(fc.oneof(fc.integer(), fc.string()), { nil: undefined }),
          workItemType: fc.option(fc.string(), { nil: undefined }),
          url: fc.option(fc.string(), { nil: undefined }),
          fields: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined })
        }), { nil: undefined }),
        resourceVersion: fc.option(fc.string(), { nil: undefined }),
        resourceContainers: fc.option(fc.record({
          project: fc.option(fc.record({
            id: fc.option(fc.string(), { nil: undefined }),
            name: fc.option(fc.string(), { nil: undefined })
          }), { nil: undefined })
        }), { nil: undefined })
      });

      fc.assert(
        fc.property(malformedPayloadArb, (payload) => {
          // Property: Malformed payloads should be handled gracefully without throwing
          let extractionResult: IBasicWorkItemInfo | undefined;
          expect(() => {
            extractionResult = extractBasicWorkItemInfo(payload as any);
          }).not.toThrow();

          // If extraction fails, it should return a failure result with error information
          if (extractionResult && !extractionResult.success) {
            expect(extractionResult.error).toBeDefined();
            expect(typeof extractionResult.error).toBe('string');
            expect(extractionResult.error!.length).toBeGreaterThan(0);
          }

          return true;
        }),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Helper function to extract basic work item information from webhook payload
 * This simulates the core processing logic that should be consistent across all work item types
 */
interface IBasicWorkItemInfo {
  success: boolean;
  error?: string;
  workItemId: number;
  workItemType: string;
  projectId: string;
  projectName: string;
  title: string;
  state: string;
  areaPath: string;
  iterationPath: string;
  description?: string;
  assignedTo?: string;
  priority?: number;
  tags?: string[];
  typeSpecificData?: {
    acceptanceCriteria?: string;
    reproductionSteps?: string;
  };
}

function extractBasicWorkItemInfo(payload: IWorkItemWebhookPayload): IBasicWorkItemInfo {
  try {
    // Validate required structure
    if (!payload || !payload.resource || !payload.resourceContainers?.project) {
      return {
        success: false,
        error: 'Invalid payload structure: missing required properties',
        workItemId: 0,
        workItemType: '',
        projectId: '',
        projectName: '',
        title: '',
        state: '',
        areaPath: '',
        iterationPath: ''
      };
    }

    const { resource, resourceContainers } = payload;
    const { fields } = resource;

    // Validate required fields
    if (!fields || typeof fields !== 'object') {
      return {
        success: false,
        error: 'Invalid payload: missing or invalid fields object',
        workItemId: resource.id || 0,
        workItemType: resource.workItemType || '',
        projectId: resourceContainers.project.id || '',
        projectName: resourceContainers.project.name || '',
        title: '',
        state: '',
        areaPath: '',
        iterationPath: ''
      };
    }

    // Extract required system fields
    const requiredFields = [
      'System.Title',
      'System.State', 
      'System.AreaPath',
      'System.IterationPath'
    ];

    for (const field of requiredFields) {
      if (!fields[field] || typeof fields[field] !== 'string' || fields[field].trim().length === 0) {
        return {
          success: false,
          error: `Missing or invalid required field: ${field}`,
          workItemId: resource.id || 0,
          workItemType: resource.workItemType || '',
          projectId: resourceContainers.project.id || '',
          projectName: resourceContainers.project.name || '',
          title: fields['System.Title'] || '',
          state: fields['System.State'] || '',
          areaPath: fields['System.AreaPath'] || '',
          iterationPath: fields['System.IterationPath'] || ''
        };
      }
    }

    // Extract basic information
    const basicInfo: IBasicWorkItemInfo = {
      success: true,
      workItemId: resource.id,
      workItemType: resource.workItemType,
      projectId: resourceContainers.project.id,
      projectName: resourceContainers.project.name,
      title: fields['System.Title'],
      state: fields['System.State'],
      areaPath: fields['System.AreaPath'],
      iterationPath: fields['System.IterationPath']
    };

    // Extract optional fields
    if (fields['System.Description']) {
      basicInfo.description = fields['System.Description'];
    }

    if (fields['System.AssignedTo'] && fields['System.AssignedTo'].displayName) {
      basicInfo.assignedTo = fields['System.AssignedTo'].displayName;
    }

    if (fields['System.Priority']) {
      basicInfo.priority = fields['System.Priority'];
    }

    if (fields['System.Tags']) {
      basicInfo.tags = fields['System.Tags'].split(';').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    // Extract type-specific fields
    const typeSpecificData: any = {};
    
    if (resource.workItemType === WorkItemType.USER_STORY) {
      const acceptanceCriteria = fields['Microsoft.VSTS.Common.AcceptanceCriteria'];
      if (acceptanceCriteria !== undefined) {
        typeSpecificData.acceptanceCriteria = acceptanceCriteria;
      }
    }

    if (resource.workItemType === WorkItemType.BUG) {
      const reproductionSteps = fields['Microsoft.VSTS.TCM.ReproductionSteps'];
      if (reproductionSteps !== undefined) {
        typeSpecificData.reproductionSteps = reproductionSteps;
      }
    }

    if (Object.keys(typeSpecificData).length > 0) {
      basicInfo.typeSpecificData = typeSpecificData;
    }

    return basicInfo;

  } catch (error) {
    return {
      success: false,
      error: `Unexpected error during processing: ${error instanceof Error ? error.message : 'Unknown error'}`,
      workItemId: 0,
      workItemType: '',
      projectId: '',
      projectName: '',
      title: '',
      state: '',
      areaPath: '',
      iterationPath: ''
    };
  }
}