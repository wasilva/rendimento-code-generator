/**
 * Unit tests for BaseWorkItemProcessor
 * Tests common functionality shared by all work item processors
 */

import { BaseWorkItemProcessor, IValidationResult } from '../../../../../src/services/workItem/processors/BaseWorkItemProcessor';
import { IEnrichedWorkItem, WorkItemType } from '../../../../../src/models/workItem';
import { ICodeGenerationPrompt, ProgrammingLanguage } from '../../../../../src/models/codeGeneration';
import { IRepositoryConfig } from '../../../../../src/models/configuration';
import { userStoryFixtures, repositoryConfigFixture } from '../../../../fixtures/workItems';

// Create a concrete implementation for testing
class TestWorkItemProcessor extends BaseWorkItemProcessor {
  public readonly supportedType = WorkItemType.USER_STORY;

  protected getProcessingStrategy(): string {
    return 'TestStrategy';
  }

  protected validateTypeSpecificFields(workItem: IEnrichedWorkItem): IValidationResult[] {
    const results: IValidationResult[] = [];
    
    if (workItem.title.includes('invalid')) {
      results.push({
        fieldName: 'title',
        isValid: false,
        message: 'Title contains invalid keyword',
        severity: 'error'
      });
    }
    
    return results;
  }

  public extractSpecificFields(_workItem: IEnrichedWorkItem): Record<string, any> {
    return {
      testField: 'test-value',
      extractedAt: new Date().toISOString()
    };
  }

  public generateCodePrompt(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig,
    _extractedFields: Record<string, any>
  ): ICodeGenerationPrompt {
    const basePrompt = this.generateBaseCodePrompt(workItem, repositoryConfig);
    
    return {
      ...basePrompt,
      workItem,
      targetLanguage: repositoryConfig.targetLanguage,
      projectContext: basePrompt.projectContext!,
      codeTemplates: basePrompt.codeTemplates!,
      codingStandards: basePrompt.codingStandards!,
      instructions: {
        requirements: ['Test requirement'],
        patterns: ['Test Pattern'],
        preferredLibraries: ['test-lib'],
        stylePreferences: ['Test style preference']
      }
    };
  }
}

describe('BaseWorkItemProcessor', () => {
  let processor: TestWorkItemProcessor;

  beforeEach(() => {
    processor = new TestWorkItemProcessor();
  });

  describe('Basic Properties', () => {
    it('should have correct supported type', () => {
      expect(processor.supportedType).toBe(WorkItemType.USER_STORY);
    });

    it('should return correct processing strategy', () => {
      const strategy = (processor as any).getProcessingStrategy();
      expect(strategy).toBe('TestStrategy');
    });
  });

  describe('validateWorkItem', () => {
    it('should validate common required fields', () => {
      const results = processor.validateWorkItem(userStoryFixtures.complete);
      
      // Should not have errors for complete work item
      const errors = results.filter(r => r.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when title is missing', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        title: ''
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const titleError = results.find(r => r.fieldName === 'title' && r.severity === 'error');
      expect(titleError).toBeDefined();
      expect(titleError?.message).toContain('Title is required');
      expect(titleError?.isValid).toBe(false);
    });

    it('should fail validation when title is only whitespace', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        title: '   \n\t   '
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const titleError = results.find(r => r.fieldName === 'title' && r.severity === 'error');
      expect(titleError).toBeDefined();
    });

    it('should warn when description is missing', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: ''
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const descriptionWarning = results.find(r => r.fieldName === 'description' && r.severity === 'warning');
      expect(descriptionWarning).toBeDefined();
      expect(descriptionWarning?.message).toContain('Description is required for code generation');
      expect(descriptionWarning?.isValid).toBe(false);
    });

    it('should fail validation when area path is missing', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        areaPath: ''
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const areaPathError = results.find(r => r.fieldName === 'areaPath' && r.severity === 'error');
      expect(areaPathError).toBeDefined();
      expect(areaPathError?.message).toContain('Area path is required');
    });

    it('should include type-specific validation results', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        title: 'This title contains invalid keyword'
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const typeSpecificError = results.find(r => r.message.includes('invalid keyword'));
      expect(typeSpecificError).toBeDefined();
      expect(typeSpecificError?.severity).toBe('error');
    });

    it('should combine common and type-specific validation results', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        title: 'invalid',  // Triggers type-specific error
        description: ''    // Triggers common warning
      };
      
      const results = processor.validateWorkItem(workItem);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some(r => r.message.includes('invalid keyword'))).toBe(true);
      expect(results.some(r => r.message.includes('Description is required'))).toBe(true);
    });
  });

  describe('extractCommonFields', () => {
    it('should extract all common fields correctly', () => {
      const commonFields = (processor as any).extractCommonFields(userStoryFixtures.complete);
      
      expect(commonFields).toEqual({
        id: 1001,
        type: WorkItemType.USER_STORY,
        title: 'As a user, I want to login to the system',
        description: expect.stringContaining('registered user'),
        assignedTo: 'john.doe@company.com',
        areaPath: 'TestProject\\Features',
        iterationPath: 'TestProject\\Sprint 1',
        state: 'New',
        priority: 2,
        tags: ['test', 'automation']
      });
    });

    it('should handle work item with undefined optional fields', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        assignedTo: undefined,
        tags: []
      };
      
      const commonFields = (processor as any).extractCommonFields(workItem);
      
      expect(commonFields.assignedTo).toBeUndefined();
      expect(commonFields.tags).toEqual([]);
    });
  });

  describe('generateBaseCodePrompt', () => {
    it('should generate base code prompt structure', () => {
      const basePrompt = (processor as any).generateBaseCodePrompt(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(basePrompt.workItem).toBe(userStoryFixtures.complete);
      expect(basePrompt.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(basePrompt.projectContext).toBeDefined();
      expect(basePrompt.projectContext.projectName).toBe('Test Repository');
      expect(basePrompt.projectContext.primaryLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(basePrompt.projectContext.framework).toBe('Express.js');
      expect(basePrompt.projectContext.structure).toBeDefined();
      expect(basePrompt.codeTemplates).toBeDefined();
      expect(basePrompt.codingStandards).toBe(repositoryConfigFixture.codingStandards);
    });

    it('should filter code templates by work item type', () => {
      const basePrompt = (processor as any).generateBaseCodePrompt(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      // Should only include templates that support USER_STORY
      expect(basePrompt.codeTemplates).toHaveLength(1);
      expect(basePrompt.codeTemplates[0].name).toBe('API Endpoint Template');
    });

    it('should set correct project context structure', () => {
      const basePrompt = (processor as any).generateBaseCodePrompt(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(basePrompt.projectContext.structure).toEqual({
        sourceDir: 'src',
        testDir: 'tests',
        configDir: 'config',
        docsDir: 'docs'
      });
    });
  });

  describe('processWorkItem', () => {
    it('should successfully process valid work item', async () => {
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.strategy).toBe('TestStrategy');
      expect(result.metadata?.extractedFields).toBeDefined();
      expect(result.metadata?.validationResults).toBeDefined();
    });

    it('should fail processing when validation errors exist', async () => {
      const workItem = {
        ...userStoryFixtures.complete,
        title: 'invalid title'  // Triggers type-specific error
      };
      
      const result = await processor.processWorkItem(
        workItem,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Work item validation failed');
      expect(result.codePrompt).toBeUndefined();
      expect(result.metadata?.validationResults).toBeDefined();
      
      const errors = result.metadata?.validationResults.filter(r => r.severity === 'error');
      expect(errors?.length).toBeGreaterThan(0);
    });

    it('should succeed with validation warnings only', async () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: ''  // Triggers warning, not error
      };
      
      const result = await processor.processWorkItem(
        workItem,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.metadata?.validationResults).toBeDefined();
      
      const warnings = result.metadata?.validationResults.filter(r => r.severity === 'warning');
      expect(warnings?.length).toBeGreaterThan(0);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock extractSpecificFields to throw an error
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
      expect(result.metadata?.strategy).toBe('TestStrategy');
      expect(result.metadata?.extractedFields).toEqual({});
      expect(result.metadata?.validationResults).toEqual([]);
      
      // Restore original method
      processor.extractSpecificFields = originalExtractFields;
    });

    it('should handle unknown errors gracefully', async () => {
      // Mock extractSpecificFields to throw a non-Error object
      const originalExtractFields = processor.extractSpecificFields;
      processor.extractSpecificFields = jest.fn().mockImplementation(() => {
        throw 'String error';
      });
      
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown processing error');
      
      // Restore original method
      processor.extractSpecificFields = originalExtractFields;
    });

    it('should include extracted fields in metadata', async () => {
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.metadata?.extractedFields).toBeDefined();
      expect(result.metadata?.extractedFields['testField']).toBe('test-value');
      expect(result.metadata?.extractedFields['extractedAt']).toBeDefined();
    });

    it('should include validation results in metadata', async () => {
      const result = await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.metadata?.validationResults).toBeDefined();
      expect(Array.isArray(result.metadata?.validationResults)).toBe(true);
    });
  });

  describe('Abstract Method Implementation', () => {
    it('should call extractSpecificFields during processing', async () => {
      const extractSpy = jest.spyOn(processor, 'extractSpecificFields');
      
      await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(extractSpy).toHaveBeenCalledWith(userStoryFixtures.complete);
      
      extractSpy.mockRestore();
    });

    it('should call generateCodePrompt during processing', async () => {
      const generateSpy = jest.spyOn(processor, 'generateCodePrompt');
      
      await processor.processWorkItem(
        userStoryFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(generateSpy).toHaveBeenCalledWith(
        userStoryFixtures.complete,
        repositoryConfigFixture,
        expect.any(Object)
      );
      
      generateSpy.mockRestore();
    });

    it('should call validateTypeSpecificFields during validation', () => {
      const validateSpy = jest.spyOn(processor as any, 'validateTypeSpecificFields');
      
      processor.validateWorkItem(userStoryFixtures.complete);
      
      expect(validateSpy).toHaveBeenCalledWith(userStoryFixtures.complete);
      
      validateSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle work item with null/undefined fields', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        description: null as any,
        assignedTo: undefined as any,
        tags: null as any
      };
      
      const results = processor.validateWorkItem(workItem);
      
      // Should handle null/undefined gracefully
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle repository config with empty templates', () => {
      const emptyTemplateConfig = {
        ...repositoryConfigFixture,
        codeTemplates: []
      };
      
      const basePrompt = (processor as any).generateBaseCodePrompt(
        userStoryFixtures.complete,
        emptyTemplateConfig
      );
      
      expect(basePrompt.codeTemplates).toEqual([]);
    });

    it('should handle work item with empty custom fields', () => {
      const workItem = {
        ...userStoryFixtures.complete,
        customFields: {}
      };
      
      const commonFields = (processor as any).extractCommonFields(workItem);
      expect(commonFields).toBeDefined();
      expect(commonFields.id).toBe(workItem.id);
    });
  });
});