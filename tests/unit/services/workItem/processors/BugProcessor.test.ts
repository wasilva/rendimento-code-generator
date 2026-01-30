/**
 * Unit tests for BugProcessor
 * Tests field extraction, validation, and code prompt generation for Bugs
 */

import { BugProcessor } from '../../../../../src/services/workItem/processors/BugProcessor';
import { WorkItemType } from '../../../../../src/models/workItem';
import { ProgrammingLanguage } from '../../../../../src/models/codeGeneration';
import { bugFixtures, repositoryConfigFixture } from '../../../../fixtures/workItems';

describe('BugProcessor', () => {
  let processor: BugProcessor;

  beforeEach(() => {
    processor = new BugProcessor();
  });

  describe('Basic Properties', () => {
    it('should have correct supported type', () => {
      expect(processor.supportedType).toBe(WorkItemType.BUG);
    });

    it('should return correct processing strategy', () => {
      const strategy = (processor as any).getProcessingStrategy();
      expect(strategy).toBe('BugFixImplementation');
    });
  });

  describe('validateWorkItem', () => {
    it('should pass validation for complete bug', () => {
      const results = processor.validateWorkItem(bugFixtures.complete);
      
      const errors = results.filter(r => r.severity === 'error');
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when reproduction steps are missing', () => {
      const results = processor.validateWorkItem(bugFixtures.missingReproductionSteps);
      
      const stepsError = results.find(r => r.fieldName === 'reproductionSteps' && r.severity === 'error');
      expect(stepsError).toBeDefined();
      expect(stepsError?.message).toContain('Reproduction steps are essential');
    });

    it('should warn when reproduction steps are too short', () => {
      const results = processor.validateWorkItem(bugFixtures.shortReproductionSteps);
      
      const stepsWarning = results.find(r => r.fieldName === 'reproductionSteps' && r.severity === 'warning');
      expect(stepsWarning).toBeDefined();
      expect(stepsWarning?.message).toContain('detailed enough');
    });

    it('should warn when bug description is too short', () => {
      const workItem = {
        ...bugFixtures.complete,
        description: 'Bug exists'
      };
      
      const results = processor.validateWorkItem(workItem);
      
      const descriptionWarning = results.find(r => r.fieldName === 'description' && r.severity === 'warning');
      expect(descriptionWarning).toBeDefined();
      expect(descriptionWarning?.message).toContain('clearly explain the issue');
    });

    it('should not warn for adequate reproduction steps', () => {
      const results = processor.validateWorkItem(bugFixtures.complete);
      
      const stepsWarning = results.find(r => r.fieldName === 'reproductionSteps' && r.severity === 'warning');
      expect(stepsWarning).toBeUndefined();
    });
  });

  describe('extractSpecificFields', () => {
    it('should extract all fields from complete bug', () => {
      const fields = processor.extractSpecificFields(bugFixtures.complete);
      
      expect(fields).toMatchObject({
        id: 3001,
        type: WorkItemType.BUG,
        title: 'Login fails with special characters in password',
        description: expect.stringContaining('special characters'),
        severity: 'High',
        bugCategory: expect.any(String)
      });
      
      expect(fields['reproductionSteps']).toBeDefined();
      expect(fields['behaviorAnalysis']).toBeDefined();
      expect(fields['errorInfo']).toBeDefined();
      expect(fields['affectedComponents']).toBeDefined();
      expect(fields['impactAssessment']).toBeDefined();
    });

    it('should parse numbered reproduction steps correctly', () => {
      const fields = processor.extractSpecificFields(bugFixtures.complete);
      
      expect(fields['reproductionSteps'].format).toBe('numbered');
      expect(fields['reproductionSteps'].steps).toHaveLength(5);
      expect(fields['reproductionSteps'].steps[0]).toMatchObject({
        stepNumber: 1,
        action: 'Navigate to login page'
      });
      expect(fields['reproductionSteps'].steps[4]).toMatchObject({
        stepNumber: 5,
        action: 'Observe error message'
      });
    });

    it('should parse bullet point reproduction steps correctly', () => {
      const fields = processor.extractSpecificFields(bugFixtures.withBulletSteps);
      
      expect(fields['reproductionSteps'].format).toBe('bullet_points');
      expect(fields['reproductionSteps'].steps).toHaveLength(4);
      expect(fields['reproductionSteps'].steps[0]).toMatchObject({
        stepNumber: 1,
        action: 'Login to the application'
      });
    });

    it('should handle free text reproduction steps', () => {
      const workItem = {
        ...bugFixtures.complete,
        reproductionSteps: 'Just click the login button and it fails. Try different passwords.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      
      expect(fields['reproductionSteps'].format).toBe('free_text');
      expect(fields['reproductionSteps'].steps.length).toBeGreaterThan(0);
    });

    it('should extract expected vs actual behavior', () => {
      const fields = processor.extractSpecificFields(bugFixtures.complete);
      
      expect(fields['behaviorAnalysis'].expectedBehavior).toContain('should be able to login');
      expect(fields['behaviorAnalysis'].actualBehavior).toContain('Login fails');
    });

    it('should extract error information', () => {
      const workItem = {
        ...bugFixtures.complete,
        description: 'Error: Invalid credentials (Code: AUTH_001). Exception: Authentication failed.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      
      expect(fields['errorInfo'].errorMessages.length).toBeGreaterThan(0);
      expect(fields['errorInfo'].errorMessages.some((msg: string) => 
        msg.includes('Invalid credentials')
      )).toBe(true);
    });

    it('should identify affected components', () => {
      const fields = processor.extractSpecificFields(bugFixtures.complete);
      
      expect(fields['affectedComponents']).toContain('api');
    });

    it('should assess bug impact correctly', () => {
      // High severity bug
      const highImpactFields = processor.extractSpecificFields(bugFixtures.complete);
      expect(highImpactFields['impactAssessment'].userImpact).toBe('high');
      expect(highImpactFields['impactAssessment'].urgency).toBe('high');

      // Medium severity bug
      const mediumImpactFields = processor.extractSpecificFields(bugFixtures.withBulletSteps);
      expect(mediumImpactFields['impactAssessment'].userImpact).toBe('medium');
      expect(mediumImpactFields['impactAssessment'].urgency).toBe('medium');

      // Critical priority bug
      const criticalBug = {
        ...bugFixtures.complete,
        priority: 1,
        customFields: { 'Microsoft.VSTS.Common.Severity': 'Critical' }
      };
      const criticalFields = processor.extractSpecificFields(criticalBug);
      expect(criticalFields['impactAssessment'].urgency).toBe('immediate');
    });

    it('should categorize bugs correctly', () => {
      const functionalBug = processor.extractSpecificFields(bugFixtures.complete);
      expect(functionalBug['bugCategory']).toBe('functional');

      const uiBug = {
        ...bugFixtures.complete,
        title: 'UI layout is broken on mobile',
        description: 'The interface elements are not displaying correctly'
      };
      const uiFields = processor.extractSpecificFields(uiBug);
      expect(uiFields['bugCategory']).toBe('ui');

      const performanceBug = {
        ...bugFixtures.complete,
        title: 'Application is very slow',
        description: 'Performance issues causing timeouts'
      };
      const perfFields = processor.extractSpecificFields(performanceBug);
      expect(perfFields['bugCategory']).toBe('performance');
    });

    it('should handle minimal bug gracefully', () => {
      const fields = processor.extractSpecificFields(bugFixtures.minimal);
      
      expect(fields['id']).toBe(3002);
      expect(fields['reproductionSteps'].format).toBe('free_text');
      expect(fields['reproductionSteps'].steps).toHaveLength(0);
      expect(fields['behaviorAnalysis'].expectedBehavior).toBeNull();
      expect(fields['behaviorAnalysis'].actualBehavior).toBeNull();
      expect(fields['severity']).toBe('Medium'); // Default value
    });
  });

  describe('generateCodePrompt', () => {
    it('should generate complete code prompt for bug', () => {
      const extractedFields = processor.extractSpecificFields(bugFixtures.complete);
      const prompt = processor.generateCodePrompt(
        bugFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      expect(prompt.workItem).toBe(bugFixtures.complete);
      expect(prompt.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(prompt.projectContext).toBeDefined();
      expect(prompt.codeTemplates).toHaveLength(1); // Only Bug template
      expect(prompt.codingStandards).toBe(repositoryConfigFixture.codingStandards);
      
      expect(prompt.instructions).toBeDefined();
      expect(prompt.instructions!.requirements).toContain('Fix the root cause, not just symptoms');
      expect(prompt.instructions!.requirements).toContain('Include regression tests');
      expect(prompt.instructions!.patterns).toContain('Error Handling');
      expect(prompt.instructions!.preferredLibraries).toContain('jest');
    });

    it('should include bug specific instructions', () => {
      const extractedFields = processor.extractSpecificFields(bugFixtures.complete);
      const prompt = processor.generateCodePrompt(
        bugFixtures.complete,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('Bug Category: functional');
      expect(instructions).toContain('Severity: High');
      expect(instructions).toContain('Expected Behavior:');
      expect(instructions).toContain('Reproduction Steps:');
    });

    it('should handle bug without detailed behavior analysis', () => {
      const extractedFields = processor.extractSpecificFields(bugFixtures.minimal);
      const prompt = processor.generateCodePrompt(
        bugFixtures.minimal,
        repositoryConfigFixture,
        extractedFields
      );
      
      const instructions = prompt.instructions!.stylePreferences![0];
      expect(instructions).toContain('Bug Category: general');
      expect(instructions).toContain('Severity: Medium');
      // Should not contain expected behavior section when not available
      expect(instructions).not.toContain('Expected Behavior:');
    });
  });

  describe('processWorkItem', () => {
    it('should successfully process valid bug', async () => {
      const result = await processor.processWorkItem(
        bugFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(true);
      expect(result.codePrompt).toBeDefined();
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.strategy).toBe('BugFixImplementation');
      expect(result.metadata?.extractedFields).toBeDefined();
    });

    it('should fail processing when validation errors exist', async () => {
      const result = await processor.processWorkItem(
        bugFixtures.missingReproductionSteps,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Work item validation failed');
      expect(result.codePrompt).toBeUndefined();
      expect(result.metadata?.validationResults).toBeDefined();
      
      const errors = result.metadata?.validationResults.filter(r => r.severity === 'error');
      expect(errors?.length).toBeGreaterThan(0);
    });

    it('should succeed with validation warnings', async () => {
      const result = await processor.processWorkItem(
        bugFixtures.shortReproductionSteps,
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
        bugFixtures.complete,
        repositoryConfigFixture
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test processing error');
      expect(result.metadata?.strategy).toBe('BugFixImplementation');
      
      // Restore original method
      processor.extractSpecificFields = originalExtractFields;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty reproduction steps', () => {
      const workItem = {
        ...bugFixtures.complete,
        reproductionSteps: ''
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['reproductionSteps'].format).toBe('free_text');
      expect(fields['reproductionSteps'].steps).toHaveLength(0);
    });

    it('should handle description without clear expected/actual behavior', () => {
      const workItem = {
        ...bugFixtures.complete,
        description: 'There is a problem with the login system. It needs to be fixed.'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['behaviorAnalysis'].expectedBehavior).toBeNull();
      expect(fields['behaviorAnalysis'].actualBehavior).toBeNull();
    });

    it('should handle bug with undefined severity', () => {
      const workItem = {
        ...bugFixtures.complete,
        customFields: {}
      };
      
      const fields = processor.extractSpecificFields(workItem);
      expect(fields['severity']).toBe('Medium'); // Default value
    });

    it('should handle various severity levels for impact assessment', () => {
      const testCases = [
        { severity: 'Critical', priority: 1, expectedUrgency: 'immediate' },
        { severity: 'High', priority: 2, expectedUrgency: 'high' },
        { severity: 'Low', priority: 4, expectedUrgency: 'low' },
        { severity: 'Medium', priority: 3, expectedUrgency: 'medium' }
      ];

      testCases.forEach(({ severity, priority, expectedUrgency }) => {
        const workItem = {
          ...bugFixtures.complete,
          priority,
          customFields: { 'Microsoft.VSTS.Common.Severity': severity }
        };
        
        const fields = processor.extractSpecificFields(workItem);
        expect(fields['impactAssessment'].urgency).toBe(expectedUrgency);
      });
    });

    it('should extract error information from both description and reproduction steps', () => {
      const workItem = {
        ...bugFixtures.complete,
        description: 'Error: Database connection failed',
        reproductionSteps: 'Try to login and you get Exception: Timeout occurred'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      
      expect(fields['errorInfo'].errorMessages.length).toBeGreaterThan(0);
      expect(fields['errorInfo'].errorMessages.some((msg: string) => 
        msg.includes('Database connection')
      )).toBe(true);
    });

    it('should identify multiple affected components', () => {
      const workItem = {
        ...bugFixtures.complete,
        title: 'API and UI components not working with database',
        description: 'The service layer fails to communicate with the controller'
      };
      
      const fields = processor.extractSpecificFields(workItem);
      
      expect(fields['affectedComponents']).toContain('api');
      expect(fields['affectedComponents']).toContain('ui');
      expect(fields['affectedComponents']).toContain('database');
      expect(fields['affectedComponents']).toContain('service');
    });

    it('should handle mixed format reproduction steps', () => {
      const workItem = {
        ...bugFixtures.complete,
        reproductionSteps: `1. First numbered step
- Bullet point step
2. Second numbered step
Another free text step`
      };
      
      const fields = processor.extractSpecificFields(workItem);
      // Should prioritize numbered format when detected
      expect(fields['reproductionSteps'].format).toBe('numbered');
      expect(fields['reproductionSteps'].steps.length).toBeGreaterThan(0);
    });
  });
});

