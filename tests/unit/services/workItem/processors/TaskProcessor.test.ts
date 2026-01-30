/**
 * Unit tests for TaskProcessor
 * Tests field extraction, validation, and code prompt generation for Tasks
 */

import { TaskProcessor } from '../../../../../src/services/workItem/processors/TaskProcessor';
import { WorkItemType } from '../../../../../src/models/workItem';
import { ProgrammingLanguage } from '../../../../../src/models/codeGeneration';
import { taskFixtures, repositoryConfigFixture } from '../../../../fixtures/workItems';

describe('TaskProcessor', () => {
  let processor: TaskProcessor;

  beforeEach(() => {
    processor = new TaskProcessor();
  });

  describe('Basic Properties', () => {
    it('should have correct supported type', () => {
      expect(processor.supportedType).toBe(WorkItemType.TASK);
    });

    it('should return correct processing strategy', () => {
      const strategy = (processor as any).getProcessingStrategy();
      expect(strategy).toBe('TaskTechnicalImplementation');
    });
  });

  describe('validateWorkItem', () => {
    it('should pass validation for complete task', () => {
      const results = processor.validateWorkItem(taskFixtures.complete);
      
      const errors = results.filter(r => r.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should warn when description is too short', () => {
      const results = processor.validateWorkItem(taskFixtures.shortDescription);
      
      const descriptionWarning = results.find(r => r.fieldName === 'description' && r.severity === 'warning');
      expect(descriptionWarning).toBeDefined();
      expect(descriptionWarning?.message).toContain('detailed enough');
    });

    it('should provide info when description lacks technical content', () => {
      const workItem = {
        ...taskFixtures.complete,
        description: 'Please do something with the system. Make it work better.'
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const techInfo = results.find(r => r.fieldName === 'description' && r.severity === 'info');
      expect(techInfo).toBeDefined();
      expect(techInfo?.message).toContain('technical details');
    });

    it('should provide info when effort estimation is missing', () => {
      const workItem = {
        ...taskFixtures.complete,
        customFields: {}
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const effortInfo = results.find(r => r.fieldName === 'effort' && r.severity === 'info');
      expect(effortInfo).toBeDefined();
      expect(effortInfo?.message).toContain('effort estimation');
    });

    it('should not warn when description contains technical keywords', () => {
      const results = processor.validateWorkItem(taskFixtures.complete);
      
      const techWarning = results.find(r => r.fieldName === 'description' && r.message.includes('technical details'));
      expect(techWarning).toBeUndefined();
    });
  });

  describe('extractSpecificFields', () => {
    it('should extract all fields from complete task', () => {
      const fields = processor.extractSpecificFields(taskFixtures.complete);
      
      expect(fields).toMatchObject({
        id: 2001,
        type: WorkItemType.TASK,
        title: 'Implement user authentication API',
        description: expect.stringContaining('REST API endpoints'),
        effort: 8,
        remainingWork: 6,
        complexity: expect.any(String),
        taskCategory: expect.any(String)
      });
      
      expect(fields['technicalSpecs']).toBeDefined();
      expect(fields['implementationApproach']).toBeDefined();
      expect(fields['dependencies']).toBeDefined();
      expect(fields['deliverables']).toBeDefined();
    });

    it('should extract technical specifications correctly', () => {
      const fields = processor.extractSpecificFields(taskFixtures.complete);
      
      expect(fields['technicalSpecs'].apis).toContain('POST /api/auth/login');
      expect(fields['technicalSpecs'].apis).toContain('GET /api/auth/verify');
      expect(fields['technicalSpecs'].technologies).toContain('JWT');
      expect(fields['technicalSpecs'].requirements).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Use JWT tokens')
        ])
      );
    });

    it('should extract implementation approach with steps', () => {
      const fields = processor.extractSpecificFields(taskFixtures.withSteps);
      
      expect(fields['implementationApproach'].approach).toBe('standard');
      expect(fields['implementationApproach'].steps).toContain('Create backup of existing data');
      expect(fields['implementationApproach'].steps).toContain('Create new table structure');
      expect(fields['implementationApproach'].considerations).toContain('This migration affects all user-related functionality');
    });

    it('should categorize tasks correctly', () => {
      const apiTask = processor.extractSpecificFields(taskFixtures.complete);
      expect(apiTask['taskCategory']).toBe('backend');

      const dbTask = processor.extractSpecificFields(taskFixtures.withSteps);
      expect(dbTask['taskCategory']).toBe('database');

      const generalTask = processor.extractSpecificFields(taskFixtures.minimal);
      expect(generalTask['taskCategory']).toBe('bugfix'); // Contains "fix"
    });

    it('should assess technical complexity correctly', () => {
      // High complexity task (has integration, migration keywords + high effort)
      const complexFields = processor.extractSpecificFields(taskFixtures.withSteps);
      expect(complexFields['complexity']).toBe('high');

      // Medium complexity task (has API, service keywords)
      const mediumFields = processor.extractSpecificFields(taskFixtures.complete);
      expect(mediumFields['complexity']).toBe('medium');

      // Low complexity task (has fix keyword, no effort)
      const simpleFields = processor.extractSpecificFields(taskFixtures.minimal);
      expect(simpleFields['complexity']).toBe('low');
    });

    it('should handle minimal task gracefully', () => {
      const fields = processor.extractSpecificFields(taskFixtures.minimal);
      
      expect(fields['id']).toBe(2002);
      expect(fields['technicalSpecs'].apis).toHaveLength(0);
      expect(fields['implementationApproach'].steps).toHaveLength(0);
      expect(fields['effort']).toBeNull();
      expect(fields['remainingWork']).toBeNull();
    });

    it('should extract dependencies correctly', () => {
      const workItem = {
        ...taskFixtures.complete,
        description: 'This task depends on work item #1234 and requires the user service API. It also needs external vendor integration.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      
      expect(fields['dependencies'].workItems).toContain('#1234');
      expect(fields['dependencies'].technical.some((dep: string) => dep.includes('service'))).toBe(true);
      expect(fields['dependencies'].external).toContain('vendor');
    });

    it('should extract deliverables from description', () => {
      const fields = processor.extractSpecificFields(taskFixtures.complete);
      
      expect(fields['deliverables'].some((deliverable: string) => 
        deliverable.includes('REST API endpoints')
      )).toBe(true);
    });
  });

  describe('generateCodePrompt', () => {
    it('should generate complete code prompt for task', () => {
      const extractedFields = processor.extractSpecificFields(taskFixtures.complete);
      const prompt = processor.generateCodePrompt(
        taskFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      expect(prompt.workItem).toBe(taskFixtures.complete);
      expect(prompt.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(prompt.projectContext).toBeDefined();
      expect(prompt.codeTemplates).toHaveLength(1); // Only Task template
      expect(prompt.codingStandards).toBe(repositoryConfigFixture.codingStandards);
      
      expect(prompt.instructions).toBeDefined();
      expect(prompt.instructions!.requirements).toContain('Follow technical specifications exactly');
      expect(prompt.instructions!.requirements).toContain('Include unit tests for new functionality');
      expect(prompt.instructions!.patterns).toContain('Factory');
      expect(prompt.instructions!.preferredLibraries).toContain('typescript');
    });

    it('should include task specific instructions', () => {
      const extractedFields = processor.extractSpecificFields(taskFixtures.complete);
      const prompt = processor.generateCodePrompt(
        taskFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('Task Category: backend');
      expect(instructions).toContain('Complexity Level: medium');
      expect(instructions).toContain('Technical Requirements:');
      expect(instructions).toContain('Expected Deliverables:');
      expect(instructions).toContain('Focus on:');
    });

    it('should include implementation steps when available', () => {
      const extractedFields = processor.extractSpecificFields(taskFixtures.withSteps);
      const prompt = processor.generateCodePrompt(
        taskFixtures.withSteps,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('Implementation Steps:');
      expect(instructions).toContain('Create backup of existing data');
    });

    it('should include technical dependencies when available', () => {
      const workItem = {
        ...taskFixtures.complete,
        description: 'This task requires the authentication service and depends on the user database.'
      };
      
      const extractedFields = processor.extractSpecificFields(workItem);
      const prompt = processor.generateCodePrompt(
        workItem,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('Technical Dependencies:');
    });
  });

  describe('processWorkItem', () => {
    it('should successfully process valid task', async () => {
      const result = await processor.processWorkItem(
        taskFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.strategy).toBe('TaskTechnicalImplementation');
      expect(result.metadata?.extractedFields).toBeDefined();
    });

    it('should succeed even with validation warnings', async () => {
      const result = await processor.processWorkItem(
        taskFixtures.shortDescription,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.metadata?.validationResults).toBeDefined();
      
      const warnings = result.metadata?.validationResults.filter(r => r.severity === 'warning');
      expect(warnings?.length).toBeGreaterThan(0);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock a method to throw an error
      const originalExtractFields = processor.extractSpecificFields;
      processor.extractSpecificFields = jest.fn().mockImplementation(() => {
        throw new Error('Test processing error');
      });
      
      const result = await processor.processWorkItem(
        taskFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test processing error');
      expect(result.metadata?.strategy).toBe('TaskTechnicalImplementation');
      
      // Restore original method
      processor.extractSpecificFields = originalExtractFields;
    });
  });

  describe('Edge Cases', () => {
    it('should handle task with no technical specifications', () => {
      const workItem = {
        ...taskFixtures.complete,
        description: 'Please update the documentation for users.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['technicalSpecs'].apis).toHaveLength(0);
      expect(fields['technicalSpecs'].technologies).toHaveLength(0);
      expect(fields['taskCategory']).toBe('documentation');
    });

    it('should handle task with no implementation steps', () => {
      const fields = processor.extractSpecificFields(taskFixtures.minimal);
      
      expect(fields['implementationApproach'].steps).toHaveLength(0);
      expect(fields['implementationApproach'].considerations).toHaveLength(0);
      expect(fields['implementationApproach'].approach).toBe('standard');
    });

    it('should determine approach based on description keywords', () => {
      const refactorTask = {
        ...taskFixtures.complete,
        description: 'Refactor the authentication module to improve performance'
      };
      const refactorFields = processor.extractSpecificFields(refactorTask);
      expect(refactorFields['implementationApproach'].approach).toBe('refactoring');

      const optimizeTask = {
        ...taskFixtures.complete,
        description: 'Optimize the database queries for better performance'
      };
      const optimizeFields = processor.extractSpecificFields(optimizeTask);
      expect(optimizeFields['implementationApproach'].approach).toBe('optimization');

      const integrateTask = {
        ...taskFixtures.complete,
        description: 'Integrate with the external payment service'
      };
      const integrateFields = processor.extractSpecificFields(integrateTask);
      expect(integrateFields['implementationApproach'].approach).toBe('integration');
    });

    it('should handle task with undefined custom fields', () => {
      const workItem = {
        ...taskFixtures.complete,
        customFields: {}
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['effort']).toBeNull();
      expect(fields['remainingWork']).toBeNull();
    });

    it('should handle task with alternative effort field names', () => {
      const workItem = {
        ...taskFixtures.complete,
        customFields: {
          'Microsoft.VSTS.Scheduling.OriginalEstimate': 12
        }
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['effort']).toBe(12);
    });

    it('should categorize various task types correctly', () => {
      const testCases = [
        { description: 'Create React component for user profile', expected: 'frontend' },
        { description: 'Setup Docker container for deployment', expected: 'infrastructure' },
        { description: 'Write unit tests for authentication service', expected: 'testing' },
        { description: 'Clean up legacy code in payment module', expected: 'refactoring' },
        { description: 'Update project documentation', expected: 'documentation' }
      ];

      testCases.forEach(({ description, expected }) => {
        const workItem = { ...taskFixtures.complete, description };
        const fields = processor.extractSpecificFields(workItem);
        expect(fields['taskCategory']).toBe(expected);
      });
    });
  });
});
