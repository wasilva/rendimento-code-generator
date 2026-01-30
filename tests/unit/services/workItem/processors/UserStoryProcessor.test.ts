/**
 * Unit tests for UserStoryProcessor
 * Tests field extraction, validation, and code prompt generation for User Stories
 */

import { UserStoryProcessor } from '../../../../../src/services/workItem/processors/UserStoryProcessor';
import { WorkItemType } from '../../../../../src/models/workItem';
import { ProgrammingLanguage } from '../../../../../src/models/codeGeneration';
import { userStoryFixtures, repositoryConfigFixture } from '../../../../fixtures/workItems';

describe('UserStoryProcessor', () => {
  let processor: UserStoryProcessor;

  beforeEach(() => {
    processor = new UserStoryProcessor();
  });

  describe('Basic Properties', () => {
    it('should have correct supported type', () => {
      expect(processor.supportedType).toBe(WorkItemType.USER_STORY);
    });

    it('should return correct processing strategy', () => {
      const strategy = (processor as any).getProcessingStrategy();
      expect(strategy).toBe('UserStoryRequirementsExtraction');
    });
  });

  describe('validateWorkItem', () => {
    it('should pass validation for complete user story', () => {
      const results = processor.validateWorkItem(userStoryFixtures.complete);
      
      const errors = results.filter(r => r.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when title is missing', () => {
      const results = processor.validateWorkItem(userStoryFixtures.missingTitle);
      
      const titleError = results.find(r => r.fieldName === 'title' && r.severity === 'error');
      expect(titleError).toBeDefined();
      expect(titleError?.message).toContain('Title is required');
    });

    it('should warn when description is missing', () => {
      const results = processor.validateWorkItem(userStoryFixtures.missingDescription);
      
      const descriptionWarning = results.find(r => r.fieldName === 'description' && r.severity === 'warning');
      expect(descriptionWarning).toBeDefined();
      expect(descriptionWarning?.message).toContain('Description is required for code generation');
    });

    it('should fail validation when area path is missing', () => {
      const results = processor.validateWorkItem(userStoryFixtures.missingAreaPath);
      
      const areaPathError = results.find(r => r.fieldName === 'areaPath' && r.severity === 'error');
      expect(areaPathError).toBeDefined();
      expect(areaPathError?.message).toContain('Area path is required');
    });

    it('should warn when acceptance criteria are missing', () => {
      const results = processor.validateWorkItem(userStoryFixtures.minimal);
      
      const criteriaWarning = results.find(r => r.fieldName === 'acceptanceCriteria' && r.severity === 'warning');
      expect(criteriaWarning).toBeDefined();
      expect(criteriaWarning?.message).toContain('Acceptance criteria are highly recommended');
    });

    it('should provide info when acceptance criteria lack structure', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        acceptanceCriteria: 'User should be able to login and see dashboard'
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const structureInfo = results.find(r => r.fieldName === 'acceptanceCriteria' && r.severity === 'info');
      expect(structureInfo).toBeDefined();
      expect(structureInfo?.message).toContain('structured format');
    });

    it('should provide info when user role is not mentioned in description', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: 'The system should allow login functionality'
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const roleInfo = results.find(r => r.fieldName === 'description' && r.severity === 'info');
      expect(roleInfo).toBeDefined();
      expect(roleInfo?.message).toContain('user role or persona');
    });
  });

  describe('extractSpecificFields', () => {
    it('should extract all fields from complete user story', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.complete);
      
      expect(fields).toMatchObject({
        id: 1001,
        type: WorkItemType.USER_STORY,
        title: 'As a user, I want to login to the system',
        description: expect.stringContaining('registered user'),
        storyPoints: 5,
        businessPriority: expect.any(String)
      });
      
      expect(fields['acceptanceCriteria']).toBeDefined();
      expect(fields['acceptanceCriteria'].format).toBe('gherkin');
      expect(fields['acceptanceCriteria'].items).toHaveLength(3);
      
      expect(fields['userRole']).toBe('registered user');
      expect(fields['businessValue']).toContain('access my personal dashboard');
      expect(fields['functionalRequirements']).toBeInstanceOf(Array);
    });

    it('should handle user story with bullet point acceptance criteria', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.withBulletPoints);
      
      expect(fields['acceptanceCriteria'].format).toBe('bullet_points');
      expect(fields['acceptanceCriteria'].items).toHaveLength(4);
      expect(fields['acceptanceCriteria'].items[0].type).toBe('bullet');
      expect(fields['acceptanceCriteria'].items[0].content).toContain('view their profile');
    });

    it('should handle minimal user story gracefully', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.minimal);
      
      expect(fields['id']).toBe(1002);
      expect(fields['acceptanceCriteria'].format).toBe('free_text');
      expect(fields['acceptanceCriteria'].items).toHaveLength(0);
      expect(fields['userRole']).toBeNull();
      expect(fields['businessValue']).toBeNull();
      expect(fields['storyPoints']).toBeNull();
    });

    it('should extract user role from "As a" pattern', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.complete);
      expect(fields['userRole']).toBe('registered user');
    });

    it('should extract business value from "so that" pattern', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.complete);
      expect(fields['businessValue']).toContain('access my personal dashboard');
    });

    it('should calculate business priority correctly', () => {
      // High priority story (priority 1, high priority tag)
      const highPriorityStory = {
        ...userStoryFixtures.complete,
        priority: 1,
        tags: ['critical', 'mvp']
      };
      const highFields = processor.extractSpecificFields(highPriorityStory);
      expect(highFields['businessPriority']).toBe('high');

      // Low priority story
      const lowPriorityStory = {
        ...userStoryFixtures.complete,
        priority: 4,
        tags: ['nice-to-have']
      };
      const lowFields = processor.extractSpecificFields(lowPriorityStory);
      expect(lowFields['businessPriority']).toBe('low');
    });

    it('should extract functional requirements from title and acceptance criteria', () => {
      const fields = processor.extractSpecificFields(userStoryFixtures.complete);
      
      expect(fields['functionalRequirements']).toContain('Implement: As a user, I want to login to the system');
      expect(fields['functionalRequirements'].some((req: string) => 
        req.includes('enter valid credentials')
      )).toBe(true);
    });
  });

  describe('generateCodePrompt', () => {
    it('should generate complete code prompt for user story', () => {
      const extractedFields = processor.extractSpecificFields(userStoryFixtures.complete);
      const prompt = processor.generateCodePrompt(
        userStoryFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      expect(prompt.workItem).toBe(userStoryFixtures.complete);
      expect(prompt.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(prompt.projectContext).toBeDefined();
      expect(prompt.projectContext.projectName).toBe('Test Repository');
      expect(prompt.codeTemplates).toHaveLength(1); // Only User Story template
      expect(prompt.codingStandards).toBe(repositoryConfigFixture.codingStandards);
      
      expect(prompt.instructions).toBeDefined();
      expect(prompt.instructions!.requirements).toContain('Implement user-facing functionality');
      expect(prompt.instructions!.requirements).toContain('Follow acceptance criteria strictly');
      expect(prompt.instructions!.patterns).toContain('MVC');
      expect(prompt.instructions!.preferredLibraries).toContain('express');
    });

    it('should include user story specific instructions', () => {
      const extractedFields = processor.extractSpecificFields(userStoryFixtures.complete);
      const prompt = processor.generateCodePrompt(
        userStoryFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('User Role: registered user');
      expect(instructions).toContain('Business Value:');
      expect(instructions).toContain('Acceptance Criteria:');
      expect(instructions).toContain('Functional Requirements:');
      expect(instructions).toContain('Focus on:');
    });

    it('should handle user story without detailed fields', () => {
      const extractedFields = processor.extractSpecificFields(userStoryFixtures.minimal);
      const prompt = processor.generateCodePrompt(
        userStoryFixtures.minimal,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('User Role: General User');
      expect(instructions).toContain('Business Value: Improve user experience');
    });
  });

  describe('processWorkItem', () => {
    it('should successfully process valid user story', async () => {
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.strategy).toBe('UserStoryRequirementsExtraction');
      expect(result.metadata?.extractedFields).toBeDefined();
    });

    it('should fail processing when validation errors exist', async () => {
      const result = await processor.processWorkItem(
        userStoryFixtures.missingTitle,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Work item validation failed');
      expect(result.codePrompt).toBeUndefined();
      expect(result.metadata?.validationResults).toBeDefined();
      
      const errors = result.metadata?.validationResults.filter(r => r.severity === 'error');
      expect(errors?.length).toBeGreaterThan(0);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a method to throw an error
      const originalExtractFields = processor.extractSpecificFields;
      processor.extractSpecificFields = jest.fn().mockImplementation(() => {
        throw new Error('Test processing error');
      });
      
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test processing error');
      expect(result.metadata?.strategy).toBe('UserStoryRequirementsExtraction');
      
      // Restore original method
      processor.extractSpecificFields = originalExtractFields;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty acceptance criteria', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        acceptanceCriteria: ''
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['acceptanceCriteria'].format).toBe('free_text');
      expect(fields['acceptanceCriteria'].items).toHaveLength(0);
    });

    it('should handle acceptance criteria with mixed formats', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        acceptanceCriteria: `Given I am a user
- First bullet point
When I do something
- Second bullet point
Then something happens`
      };
      
      const fields = processor.extractSpecificFields(workItem);
      // Should prioritize Gherkin format when detected
      expect(fields['acceptanceCriteria'].format).toBe('gherkin');
    });

    it('should handle description without clear user role', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: 'The system needs to provide login functionality for security purposes'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['userRole']).toBeNull();
    });

    it('should handle description without clear business value', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: 'As a user, I want to login to the system. This is important.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['businessValue']).toBeNull();
    });

    it('should handle work item with undefined custom fields', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        customFields: {}
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['storyPoints']).toBeNull();
    });

    it('should handle work item with empty tags array', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        tags: []
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['businessPriority']).toBe('medium'); // Should still calculate priority
    });
  });
});