/**
 * User Story Processor
 * Handles processing of User Story work items with focus on requirements and acceptance criteria
 */

import { IEnrichedWorkItem, WorkItemType } from '../../../models/workItem';
import { ICodeGenerationPrompt } from '../../../models/codeGeneration';
import { IRepositoryConfig } from '../../../models/configuration';
import { BaseWorkItemProcessor, IValidationResult } from './BaseWorkItemProcessor';

/**
 * Processor specifically designed for User Story work items
 * Extracts requirements, acceptance criteria, and user-focused information
 */
export class UserStoryProcessor extends BaseWorkItemProcessor {
  public readonly supportedType = WorkItemType.USER_STORY;

  /**
   * Get the processing strategy name
   */
  protected getProcessingStrategy(): string {
    return 'UserStoryRequirementsExtraction';
  }

  /**
   * Validate User Story specific fields
   */
  protected validateTypeSpecificFields(workItem: IEnrichedWorkItem): IValidationResult[] {
    const results: IValidationResult[] = [];

    // User Stories should have acceptance criteria
    if (!workItem.acceptanceCriteria || workItem.acceptanceCriteria.trim().length === 0) {
      results.push({
        fieldName: 'acceptanceCriteria',
        isValid: false,
        message: 'Acceptance criteria are highly recommended for User Stories to ensure clear requirements',
        severity: 'warning'
      });
    }

    // Check if acceptance criteria follow a structured format
    if (workItem.acceptanceCriteria) {
      const hasGivenWhenThen = /given|when|then/i.test(workItem.acceptanceCriteria);
      const hasBulletPoints = /^[\s]*[-*•]\s/m.test(workItem.acceptanceCriteria);
      
      if (!hasGivenWhenThen && !hasBulletPoints) {
        results.push({
          fieldName: 'acceptanceCriteria',
          isValid: true,
          message: 'Consider using structured format (Given-When-Then or bullet points) for better clarity',
          severity: 'info'
        });
      }
    }

    // User Stories should have a clear user persona or role
    if (workItem.description) {
      const hasUserRole = /as\s+(a|an)\s+\w+/i.test(workItem.description) || 
                         /user|customer|admin|manager/i.test(workItem.description);
      
      if (!hasUserRole) {
        results.push({
          fieldName: 'description',
          isValid: true,
          message: 'Consider including user role or persona in the description (e.g., "As a user...")',
          severity: 'info'
        });
      }
    }

    return results;
  }

  /**
   * Extract User Story specific fields
   */
  public extractSpecificFields(workItem: IEnrichedWorkItem): Record<string, any> {
    const commonFields = this.extractCommonFields(workItem);
    
    // Parse acceptance criteria into structured format
    const acceptanceCriteria = this.parseAcceptanceCriteria(workItem.acceptanceCriteria || '');
    
    // Extract user role/persona from description
    const userRole = this.extractUserRole(workItem.description || '');
    
    // Extract business value or goal
    const businessValue = this.extractBusinessValue(workItem.description || '');
    
    // Identify functional requirements
    const functionalRequirements = this.extractFunctionalRequirements(workItem);

    return {
      ...commonFields,
      acceptanceCriteria,
      userRole,
      businessValue,
      functionalRequirements,
      storyPoints: workItem.customFields['Microsoft.VSTS.Scheduling.StoryPoints'] || null,
      businessPriority: this.calculateBusinessPriority(workItem)
    };
  }

  /**
   * Generate code generation prompt for User Story
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
          'Implement user-facing functionality',
          'Follow acceptance criteria strictly',
          'Include input validation',
          'Add appropriate error handling',
          'Consider user experience and accessibility'
        ],
        patterns: ['MVC', 'Repository', 'Service Layer'],
        preferredLibraries: ['express', 'joi', 'bcrypt'],
        stylePreferences: [
          this.generateUserStoryInstructions(extractedFields)
        ]
      }
    };
  }

  /**
   * Parse acceptance criteria into structured format
   */
  private parseAcceptanceCriteria(criteria: string): {
    format: 'gherkin' | 'bullet_points' | 'free_text';
    items: Array<{
      type: 'given' | 'when' | 'then' | 'bullet' | 'text';
      content: string;
    }>;
  } {
    if (!criteria.trim()) {
      return { format: 'free_text', items: [] };
    }

    // Check for Gherkin format (Given-When-Then)
    const gherkinPattern = /(given|when|then)\s+(.+?)(?=(?:given|when|then)|$)/gis;
    const gherkinMatches = Array.from(criteria.matchAll(gherkinPattern));
    
    if (gherkinMatches.length > 0) {
      return {
        format: 'gherkin',
        items: gherkinMatches.map(match => ({
          type: (match[1]?.toLowerCase() || 'text') as 'given' | 'when' | 'then',
          content: (match[2]?.trim() || '')
        }))
      };
    }

    // Check for bullet points
    const bulletPattern = /^[\s]*[-*•]\s*(.+)$/gm;
    const bulletMatches = Array.from(criteria.matchAll(bulletPattern));
    
    if (bulletMatches.length > 0) {
      return {
        format: 'bullet_points',
        items: bulletMatches.map(match => ({
          type: 'bullet' as const,
          content: (match[1]?.trim() || '')
        }))
      };
    }

    // Free text format
    return {
      format: 'free_text',
      items: [{
        type: 'text' as const,
        content: criteria.trim()
      }]
    };
  }

  /**
   * Extract user role from description
   */
  private extractUserRole(description: string): string | null {
    // Look for "As a/an [role]" pattern
    const rolePattern = /as\s+(a|an)\s+([^,\n]+)/i;
    const match = description.match(rolePattern);
    
    if (match && match[2]) {
      return match[2].trim();
    }

    // Look for common user roles
    const commonRoles = ['user', 'customer', 'admin', 'administrator', 'manager', 'developer', 'analyst'];
    for (const role of commonRoles) {
      if (new RegExp(`\\b${role}\\b`, 'i').test(description)) {
        return role;
      }
    }

    return null;
  }

  /**
   * Extract business value from description
   */
  private extractBusinessValue(description: string): string | null {
    // Look for "so that" or "in order to" patterns
    const valuePatterns = [
      /so\s+that\s+(.+?)(?:\.|$)/i,
      /in\s+order\s+to\s+(.+?)(?:\.|$)/i,
      /to\s+(?:be\s+able\s+to\s+)?(.+?)(?:\.|$)/i
    ];

    for (const pattern of valuePatterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Extract functional requirements from work item
   */
  private extractFunctionalRequirements(workItem: IEnrichedWorkItem): string[] {
    const requirements: string[] = [];
    
    // Extract from title
    if (workItem.title) {
      requirements.push(`Implement: ${workItem.title}`);
    }

    // Extract from acceptance criteria
    if (workItem.acceptanceCriteria) {
      const criteria = this.parseAcceptanceCriteria(workItem.acceptanceCriteria);
      criteria.items.forEach(item => {
        if (item.type === 'when' || item.type === 'bullet') {
          requirements.push(item.content);
        }
      });
    }

    return requirements;
  }

  /**
   * Calculate business priority based on various factors
   */
  private calculateBusinessPriority(workItem: IEnrichedWorkItem): 'high' | 'medium' | 'low' {
    let score = 0;

    // Priority field weight
    if (workItem.priority <= 1) score += 3;
    else if (workItem.priority <= 2) score += 2;
    else score += 1;

    // Tags weight
    const highPriorityTags = ['critical', 'urgent', 'mvp', 'release-blocker'];
    const hasHighPriorityTag = workItem.tags.some(tag => 
      highPriorityTags.some(priorityTag => 
        tag.toLowerCase().includes(priorityTag)
      )
    );
    if (hasHighPriorityTag) score += 2;

    // Story points weight (higher story points might indicate complexity, not necessarily priority)
    const storyPoints = workItem.customFields['Microsoft.VSTS.Scheduling.StoryPoints'];
    if (storyPoints && storyPoints <= 3) score += 1; // Small stories might be quick wins

    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  /**
   * Generate User Story specific instructions for code generation
   */
  private generateUserStoryInstructions(extractedFields: Record<string, any>): string {
    const instructions = [
      'Generate code that implements the user story requirements:',
      `- User Role: ${extractedFields['userRole'] || 'General User'}`,
      `- Business Value: ${extractedFields['businessValue'] || 'Improve user experience'}`
    ];

    if (extractedFields['acceptanceCriteria']?.items?.length > 0) {
      instructions.push('- Acceptance Criteria:');
      extractedFields['acceptanceCriteria'].items.forEach((item: any, index: number) => {
        instructions.push(`  ${index + 1}. ${item.content}`);
      });
    }

    if (extractedFields['functionalRequirements']?.length > 0) {
      instructions.push('- Functional Requirements:');
      extractedFields['functionalRequirements'].forEach((req: string, index: number) => {
        instructions.push(`  ${index + 1}. ${req}`);
      });
    }

    instructions.push(
      '',
      'Focus on:',
      '- User interface components if applicable',
      '- Business logic implementation',
      '- Data validation and error handling',
      '- Integration with existing systems',
      '- Performance and scalability considerations'
    );

    return instructions.join('\n');
  }
}