/**
 * Bug Processor
 * Handles processing of Bug work items with focus on issue reproduction, root cause analysis, and fix implementation
 */

import { IEnrichedWorkItem, WorkItemType } from '../../../models/workItem';
import { ICodeGenerationPrompt } from '../../../models/codeGeneration';
import { IRepositoryConfig } from '../../../models/configuration';
import { BaseWorkItemProcessor, IValidationResult } from './BaseWorkItemProcessor';

/**
 * Processor specifically designed for Bug work items
 * Extracts bug description, reproduction steps, expected vs actual behavior, and fix requirements
 */
export class BugProcessor extends BaseWorkItemProcessor {
  public readonly supportedType = WorkItemType.BUG;

  /**
   * Get the processing strategy name
   */
  protected getProcessingStrategy(): string {
    return 'BugFixImplementation';
  }

  /**
   * Validate Bug specific fields
   */
  protected validateTypeSpecificFields(workItem: IEnrichedWorkItem): IValidationResult[] {
    const results: IValidationResult[] = [];

    // Bugs should have reproduction steps
    if (!workItem.reproductionSteps || workItem.reproductionSteps.trim().length === 0) {
      results.push({
        fieldName: 'reproductionSteps',
        isValid: false,
        message: 'Reproduction steps are essential for understanding and fixing the bug',
        severity: 'error'
      });
    }

    // Check if reproduction steps are detailed enough
    if (workItem.reproductionSteps && workItem.reproductionSteps.length < 30) {
      results.push({
        fieldName: 'reproductionSteps',
        isValid: false,
        message: 'Reproduction steps should be detailed enough to reliably reproduce the issue',
        severity: 'warning'
      });
    }

    // Bugs should have clear description of the problem
    if (workItem.description && workItem.description.length < 50) {
      results.push({
        fieldName: 'description',
        isValid: false,
        message: 'Bug description should clearly explain the issue and its impact',
        severity: 'warning'
      });
    }

    return results;
  }

  /**
   * Extract Bug specific fields
   */
  public extractSpecificFields(workItem: IEnrichedWorkItem): Record<string, any> {
    const commonFields = this.extractCommonFields(workItem);
    
    // Parse reproduction steps into structured format
    const reproductionSteps = this.parseReproductionSteps(workItem.reproductionSteps || '');
    
    // Extract expected vs actual behavior
    const behaviorAnalysis = this.extractBehaviorAnalysis(workItem.description || '');
    
    // Extract error information
    const errorInfo = this.extractErrorInformation(workItem);
    
    // Extract affected components/areas
    const affectedComponents = this.extractAffectedComponents(workItem);
    
    // Assess bug impact and severity
    const impactAssessment = this.assessBugImpact(workItem);

    return {
      ...commonFields,
      reproductionSteps,
      behaviorAnalysis,
      errorInfo,
      affectedComponents,
      impactAssessment,
      severity: workItem.customFields['Microsoft.VSTS.Common.Severity'] || 'Medium',
      bugCategory: this.categorizeBug(workItem)
    };
  }

  /**
   * Generate code generation prompt for Bug
   */
  public generateCodePrompt(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig,
    extractedFields: Record<string, any>
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
        requirements: [
          'Fix the root cause, not just symptoms',
          'Ensure the fix doesn\'t introduce new issues',
          'Add appropriate error handling and validation',
          'Include regression tests to prevent reoccurrence'
        ],
        patterns: ['Error Handling', 'Validation', 'Testing'],
        preferredLibraries: ['jest', 'supertest', 'joi'],
        stylePreferences: [
          this.generateBugFixInstructions(extractedFields)
        ]
      }
    };
  }

  /**
   * Parse reproduction steps into structured format
   */
  private parseReproductionSteps(steps: string): {
    format: 'numbered' | 'bullet_points' | 'free_text';
    steps: Array<{
      stepNumber: number;
      action: string;
    }>;
  } {
    if (!steps.trim()) {
      return { format: 'free_text', steps: [] };
    }

    // Check for numbered steps
    const numberedPattern = /^\s*(\d+)\.\s*(.+?)(?=^\s*\d+\.|$)/gms;
    const numberedMatches = Array.from(steps.matchAll(numberedPattern));
    
    if (numberedMatches.length > 0) {
      return {
        format: 'numbered',
        steps: numberedMatches.map(match => ({
          stepNumber: parseInt(match[1] || '0'),
          action: (match[2]?.trim() || '')
        }))
      };
    }

    // Check for bullet points
    const bulletPattern = /^\s*[-*•]\s*(.+?)(?=^\s*[-*•]|$)/gms;
    const bulletMatches = Array.from(steps.matchAll(bulletPattern));
    
    if (bulletMatches.length > 0) {
      return {
        format: 'bullet_points',
        steps: bulletMatches.map((match, index) => ({
          stepNumber: index + 1,
          action: (match[1]?.trim() || '')
        }))
      };
    }

    // Free text format
    const sentences = steps.split(/[.\n]/).filter(s => s.trim().length > 0);
    return {
      format: 'free_text',
      steps: sentences.map((sentence, index) => ({
        stepNumber: index + 1,
        action: sentence.trim()
      }))
    };
  }

  /**
   * Extract expected vs actual behavior analysis
   */
  private extractBehaviorAnalysis(description: string): {
    expectedBehavior: string | null;
    actualBehavior: string | null;
  } {
    const analysis = {
      expectedBehavior: null as string | null,
      actualBehavior: null as string | null
    };

    // Extract expected behavior
    const expectedPatterns = [
      /expected[:\-\s]*(.+?)(?:\.|but|however|instead|actual)/i,
      /should[:\-\s]*(.+?)(?:\.|but|however|instead|actual)/i
    ];

    for (const pattern of expectedPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        analysis.expectedBehavior = match[1].trim();
        break;
      }
    }

    // Extract actual behavior
    const actualPatterns = [
      /actual[:\-\s]*(.+?)(?:\.|$)/i,
      /instead[:\-\s]*(.+?)(?:\.|$)/i,
      /but[:\-\s]*(.+?)(?:\.|$)/i
    ];

    for (const pattern of actualPatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        analysis.actualBehavior = match[1].trim();
        break;
      }
    }

    return analysis;
  }

  /**
   * Extract error information from work item
   */
  private extractErrorInformation(workItem: IEnrichedWorkItem): {
    errorMessages: string[];
    errorCodes: string[];
  } {
    const errorInfo = {
      errorMessages: [] as string[],
      errorCodes: [] as string[]
    };

    const fullText = `${workItem.description || ''} ${workItem.reproductionSteps || ''}`;

    // Extract error messages
    const errorPatterns = [
      /error[:\-\s]*(.+?)(?:\n|$)/gi,
      /exception[:\-\s]*(.+?)(?:\n|$)/gi
    ];

    errorPatterns.forEach(pattern => {
      const matches = fullText.match(pattern);
      if (matches) {
        errorInfo.errorMessages.push(...matches.map(m => m.trim()));
      }
    });

    return errorInfo;
  }

  /**
   * Extract affected components from work item
   */
  private extractAffectedComponents(workItem: IEnrichedWorkItem): string[] {
    const components: string[] = [];
    const fullText = `${workItem.title || ''} ${workItem.description || ''}`;

    // Common component keywords
    const componentKeywords = [
      'api', 'service', 'controller', 'component', 'database', 'ui'
    ];

    componentKeywords.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(fullText)) {
        components.push(keyword);
      }
    });

    return [...new Set(components)];
  }

  /**
   * Assess bug impact and severity
   */
  private assessBugImpact(workItem: IEnrichedWorkItem): {
    userImpact: 'high' | 'medium' | 'low';
    urgency: 'immediate' | 'high' | 'medium' | 'low';
  } {
    const severity = workItem.customFields['Microsoft.VSTS.Common.Severity'] || 'Medium';
    const priority = workItem.priority;

    let userImpact: 'high' | 'medium' | 'low' = 'medium';
    let urgency: 'immediate' | 'high' | 'medium' | 'low' = 'medium';

    if (severity === 'Critical' || priority === 1) {
      userImpact = 'high';
      urgency = 'immediate';
    } else if (severity === 'High' || priority === 2) {
      userImpact = 'high';
      urgency = 'high';
    } else if (severity === 'Low' || priority === 4) {
      userImpact = 'low';
      urgency = 'low';
    }

    return { userImpact, urgency };
  }

  /**
   * Categorize the bug based on its characteristics
   */
  private categorizeBug(workItem: IEnrichedWorkItem): string {
    const description = (workItem.description || '').toLowerCase();
    const title = (workItem.title || '').toLowerCase();
    const content = `${title} ${description}`;

    const categories = {
      'functional': ['feature', 'function', 'behavior', 'logic'],
      'ui': ['ui', 'interface', 'display', 'layout'],
      'performance': ['slow', 'performance', 'timeout'],
      'data': ['data', 'database', 'corruption']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Generate Bug fix specific instructions
   */
  private generateBugFixInstructions(extractedFields: Record<string, any>): string {
    const instructions = [
      'Generate code that fixes the reported bug:',
      `- Bug Category: ${extractedFields['bugCategory']}`,
      `- Severity: ${extractedFields['severity']}`
    ];

    if (extractedFields['behaviorAnalysis']?.expectedBehavior) {
      instructions.push(`- Expected Behavior: ${extractedFields['behaviorAnalysis'].expectedBehavior}`);
    }

    if (extractedFields['reproductionSteps']?.steps?.length > 0) {
      instructions.push('- Reproduction Steps:');
      extractedFields['reproductionSteps'].steps.forEach((step: any, index: number) => {
        instructions.push(`  ${index + 1}. ${step.action}`);
      });
    }

    return instructions.join('\n');
  }
}