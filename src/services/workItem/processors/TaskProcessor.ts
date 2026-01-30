/**
 * Task Processor
 * Handles processing of Task work items with focus on technical specifications and implementation details
 */

import { IEnrichedWorkItem, WorkItemType } from '../../../models/workItem';
import { ICodeGenerationPrompt } from '../../../models/codeGeneration';
import { IRepositoryConfig } from '../../../models/configuration';
import { BaseWorkItemProcessor, IValidationResult } from './BaseWorkItemProcessor';

/**
 * Processor specifically designed for Task work items
 * Extracts technical specifications, implementation details, and development-focused information
 */
export class TaskProcessor extends BaseWorkItemProcessor {
  public readonly supportedType = WorkItemType.TASK;

  /**
   * Get the processing strategy name
   */
  protected getProcessingStrategy(): string {
    return 'TaskTechnicalImplementation';
  }

  /**
   * Validate Task specific fields
   */
  protected validateTypeSpecificFields(workItem: IEnrichedWorkItem): IValidationResult[] {
    const results: IValidationResult[] = [];

    // Tasks should have detailed technical description
    if (workItem.description && workItem.description.length < 50) {
      results.push({
        fieldName: 'description',
        isValid: false,
        message: 'Task description should be detailed enough to provide clear implementation guidance',
        severity: 'warning'
      });
    }

    // Check for technical keywords in description
    if (workItem.description) {
      const technicalKeywords = [
        'implement', 'create', 'update', 'delete', 'refactor', 'optimize',
        'api', 'endpoint', 'function', 'method', 'class', 'component',
        'database', 'query', 'service', 'integration'
      ];
      
      const hasTechnicalContent = technicalKeywords.some(keyword => 
        workItem.description!.toLowerCase().includes(keyword)
      );
      
      if (!hasTechnicalContent) {
        results.push({
          fieldName: 'description',
          isValid: true,
          message: 'Consider adding more technical details about the implementation approach',
          severity: 'info'
        });
      }
    }

    // Tasks should ideally have effort estimation
    const effort = workItem.customFields['Microsoft.VSTS.Scheduling.Effort'] || 
                  workItem.customFields['Microsoft.VSTS.Scheduling.OriginalEstimate'];
    
    if (!effort) {
      results.push({
        fieldName: 'effort',
        isValid: true,
        message: 'Consider adding effort estimation for better planning',
        severity: 'info'
      });
    }

    return results;
  }

  /**
   * Extract Task specific fields
   */
  public extractSpecificFields(workItem: IEnrichedWorkItem): Record<string, any> {
    const commonFields = this.extractCommonFields(workItem);
    
    // Extract technical specifications
    const technicalSpecs = this.extractTechnicalSpecifications(workItem.description || '');
    
    // Extract implementation approach
    const implementationApproach = this.extractImplementationApproach(workItem.description || '');
    
    // Extract dependencies
    const dependencies = this.extractDependencies(workItem);
    
    // Extract deliverables
    const deliverables = this.extractDeliverables(workItem.description || '');
    
    // Extract technical complexity
    const complexity = this.assessTechnicalComplexity(workItem);

    return {
      ...commonFields,
      technicalSpecs,
      implementationApproach,
      dependencies,
      deliverables,
      complexity,
      effort: workItem.customFields['Microsoft.VSTS.Scheduling.Effort'] || 
              workItem.customFields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || null,
      remainingWork: workItem.customFields['Microsoft.VSTS.Scheduling.RemainingWork'] || null,
      taskCategory: this.categorizeTask(workItem)
    };
  }

  /**
   * Generate code generation prompt for Task
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
          'Follow technical specifications exactly',
          'Implement efficient and maintainable code',
          'Include comprehensive error handling',
          'Add appropriate logging and monitoring',
          'Follow established patterns and conventions',
          'Include unit tests for new functionality'
        ],
        patterns: ['Factory', 'Strategy', 'Observer'],
        preferredLibraries: ['typescript', 'jest', 'winston'],
        stylePreferences: [
          this.generateTaskInstructions(extractedFields)
        ]
      }
    };
  }

  /**
   * Extract technical specifications from description
   */
  private extractTechnicalSpecifications(description: string): {
    apis: string[];
    databases: string[];
    technologies: string[];
    patterns: string[];
    requirements: string[];
  } {
    const specs = {
      apis: [] as string[],
      databases: [] as string[],
      technologies: [] as string[],
      patterns: [] as string[],
      requirements: [] as string[]
    };

    // Extract API mentions
    const apiPatterns = [
      /\b(REST|GraphQL|SOAP)\s+API/gi,
      /\b(GET|POST|PUT|DELETE|PATCH)\s+\/[\w\/\-{}]+/gi,
      /\bendpoint\s+[\w\/\-{}]+/gi
    ];
    
    apiPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        specs.apis.push(...matches.map(m => m.trim()));
      }
    });

    // Extract database mentions
    const dbKeywords = ['database', 'table', 'collection', 'schema', 'query', 'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL'];
    dbKeywords.forEach(keyword => {
      if (new RegExp(`\\b${keyword}\\b`, 'i').test(description)) {
        specs.databases.push(keyword);
      }
    });

    // Extract technology mentions
    const techKeywords = ['TypeScript', 'JavaScript', 'Node.js', 'Express', 'React', 'Angular', 'Vue', 'Docker', 'Kubernetes'];
    techKeywords.forEach(tech => {
      if (new RegExp(`\\b${tech}\\b`, 'i').test(description)) {
        specs.technologies.push(tech);
      }
    });

    // Extract pattern mentions
    const patternKeywords = ['MVC', 'Repository', 'Factory', 'Singleton', 'Observer', 'Strategy', 'middleware', 'service'];
    patternKeywords.forEach(pattern => {
      if (new RegExp(`\\b${pattern}\\b`, 'i').test(description)) {
        specs.patterns.push(pattern);
      }
    });

    // Extract requirements (sentences with "must", "should", "need to")
    const reqPattern = /[^.!?]*(?:must|should|need to|required to)[^.!?]*[.!?]/gi;
    const requirements = description.match(reqPattern);
    if (requirements) {
      specs.requirements.push(...requirements.map(req => req.trim()));
    }

    return specs;
  }

  /**
   * Extract implementation approach from description
   */
  private extractImplementationApproach(description: string): {
    approach: string;
    steps: string[];
    considerations: string[];
  } {
    const approach = {
      approach: 'standard',
      steps: [] as string[],
      considerations: [] as string[]
    };

    // Look for step-by-step instructions
    const stepPatterns = [
      /(?:step\s+\d+|first|second|third|then|next|finally)[:\-\s]*([^.\n]+)/gi,
      /^\s*\d+\.\s*([^.\n]+)/gm,
      /^\s*[-*]\s*([^.\n]+)/gm
    ];

    stepPatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        approach.steps.push(...matches.map(m => m.replace(/^(?:step\s+\d+|first|second|third|then|next|finally)[:\-\s]*/i, '').trim()));
      }
    });

    // Look for considerations
    const considerationKeywords = ['consider', 'note', 'important', 'warning', 'caution', 'remember'];
    considerationKeywords.forEach(keyword => {
      const pattern = new RegExp(`${keyword}[:\-\s]*([^.\n]+)`, 'gi');
      const matches = description.match(pattern);
      if (matches) {
        approach.considerations.push(...matches.map(m => m.replace(new RegExp(`^${keyword}[:\-\s]*`, 'i'), '').trim()));
      }
    });

    // Determine overall approach
    if (description.toLowerCase().includes('refactor')) {
      approach.approach = 'refactoring';
    } else if (description.toLowerCase().includes('optimize')) {
      approach.approach = 'optimization';
    } else if (description.toLowerCase().includes('integrate')) {
      approach.approach = 'integration';
    } else if (description.toLowerCase().includes('create') || description.toLowerCase().includes('implement')) {
      approach.approach = 'new_development';
    }

    return approach;
  }

  /**
   * Extract dependencies from work item
   */
  private extractDependencies(workItem: IEnrichedWorkItem): {
    technical: string[];
    workItems: string[];
    external: string[];
  } {
    const dependencies = {
      technical: [] as string[],
      workItems: [] as string[],
      external: [] as string[]
    };

    const description = workItem.description || '';

    // Technical dependencies
    const techDeps = ['npm', 'package', 'library', 'framework', 'service', 'API', 'database'];
    techDeps.forEach(dep => {
      const pattern = new RegExp(`(?:depends on|requires|needs)\\s+[^.]*\\b${dep}\\b[^.]*`, 'gi');
      const matches = description.match(pattern);
      if (matches) {
        dependencies.technical.push(...matches);
      }
    });

    // Work item dependencies (look for work item IDs)
    const workItemPattern = /#(\d+)|work item\s+(\d+)|task\s+(\d+)|story\s+(\d+)/gi;
    const workItemMatches = description.match(workItemPattern);
    if (workItemMatches) {
      dependencies.workItems.push(...workItemMatches);
    }

    // External dependencies
    const externalKeywords = ['third-party', 'external', 'vendor', 'partner'];
    externalKeywords.forEach(keyword => {
      if (description.toLowerCase().includes(keyword)) {
        dependencies.external.push(keyword);
      }
    });

    return dependencies;
  }

  /**
   * Extract deliverables from description
   */
  private extractDeliverables(description: string): string[] {
    const deliverables: string[] = [];

    // Look for deliverable patterns
    const deliverablePatterns = [
      /(?:deliver|create|implement|build|develop)\s+([^.\n]+)/gi,
      /(?:output|result|deliverable)[:\-\s]*([^.\n]+)/gi
    ];

    deliverablePatterns.forEach(pattern => {
      const matches = description.match(pattern);
      if (matches) {
        deliverables.push(...matches.map(m => m.replace(/^(?:deliver|create|implement|build|develop|output|result|deliverable)[:\-\s]*/i, '').trim()));
      }
    });

    return deliverables;
  }

  /**
   * Assess technical complexity of the task
   */
  private assessTechnicalComplexity(workItem: IEnrichedWorkItem): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    const description = (workItem.description || '').toLowerCase();

    // Complexity indicators
    const highComplexityKeywords = ['integration', 'migration', 'refactor', 'architecture', 'performance', 'security', 'scalability'];
    const mediumComplexityKeywords = ['api', 'database', 'service', 'component', 'algorithm'];
    const lowComplexityKeywords = ['fix', 'update', 'change', 'add', 'remove'];

    highComplexityKeywords.forEach(keyword => {
      if (description.includes(keyword)) complexityScore += 3;
    });

    mediumComplexityKeywords.forEach(keyword => {
      if (description.includes(keyword)) complexityScore += 2;
    });

    lowComplexityKeywords.forEach(keyword => {
      if (description.includes(keyword)) complexityScore += 1;
    });

    // Consider effort estimation
    const effort = workItem.customFields['Microsoft.VSTS.Scheduling.Effort'] || 
                  workItem.customFields['Microsoft.VSTS.Scheduling.OriginalEstimate'];
    
    if (effort) {
      if (effort > 16) complexityScore += 3;
      else if (effort > 8) complexityScore += 2;
      else if (effort > 4) complexityScore += 1;
    }

    if (complexityScore >= 8) return 'high';
    if (complexityScore >= 4) return 'medium';
    return 'low';
  }

  /**
   * Categorize the task based on its content
   */
  private categorizeTask(workItem: IEnrichedWorkItem): string {
    const description = (workItem.description || '').toLowerCase();
    const title = (workItem.title || '').toLowerCase();
    const content = `${title} ${description}`;

    const categories = {
      'frontend': ['ui', 'frontend', 'react', 'angular', 'vue', 'component', 'page', 'form'],
      'backend': ['api', 'backend', 'server', 'endpoint', 'service', 'controller'],
      'database': ['database', 'db', 'table', 'schema', 'query', 'migration'],
      'infrastructure': ['deploy', 'infrastructure', 'docker', 'kubernetes', 'ci/cd', 'pipeline'],
      'testing': ['test', 'testing', 'unit test', 'integration test', 'e2e'],
      'documentation': ['document', 'documentation', 'readme', 'guide', 'manual'],
      'bugfix': ['fix', 'bug', 'issue', 'error', 'problem'],
      'refactoring': ['refactor', 'cleanup', 'optimize', 'improve', 'restructure']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }

  /**
   * Generate Task specific instructions for code generation
   */
  private generateTaskInstructions(extractedFields: Record<string, any>): string {
    const instructions = [
      'Generate code that implements the technical task requirements:',
      `- Task Category: ${extractedFields['taskCategory']}`,
      `- Complexity Level: ${extractedFields['complexity']}`
    ];

    if (extractedFields['technicalSpecs']?.requirements?.length > 0) {
      instructions.push('- Technical Requirements:');
      extractedFields['technicalSpecs'].requirements.forEach((req: string, index: number) => {
        instructions.push(`  ${index + 1}. ${req}`);
      });
    }

    if (extractedFields['implementationApproach']?.steps?.length > 0) {
      instructions.push('- Implementation Steps:');
      extractedFields['implementationApproach'].steps.forEach((step: string, index: number) => {
        instructions.push(`  ${index + 1}. ${step}`);
      });
    }

    if (extractedFields['deliverables']?.length > 0) {
      instructions.push('- Expected Deliverables:');
      extractedFields['deliverables'].forEach((deliverable: string, index: number) => {
        instructions.push(`  ${index + 1}. ${deliverable}`);
      });
    }

    if (extractedFields['dependencies']?.technical?.length > 0) {
      instructions.push('- Technical Dependencies:');
      extractedFields['dependencies'].technical.forEach((dep: string, index: number) => {
        instructions.push(`  ${index + 1}. ${dep}`);
      });
    }

    instructions.push(
      '',
      'Focus on:',
      '- Clean, maintainable code structure',
      '- Proper error handling and logging',
      '- Performance optimization where applicable',
      '- Following established coding standards',
      '- Including appropriate tests'
    );

    return instructions.join('\n');
  }
}