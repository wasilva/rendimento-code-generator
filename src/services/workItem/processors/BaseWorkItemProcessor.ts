/**
 * Base Work Item Processor
 * Abstract base class for work item type-specific processors
 */

import { IEnrichedWorkItem, WorkItemType } from '../../../models/workItem';
import { ICodeGenerationPrompt, IGeneratedCode } from '../../../models/codeGeneration';
import { IRepositoryConfig } from '../../../models/configuration';

/**
 * Interface for work item processing result
 */
export interface IWorkItemProcessingResult {
  /** Whether the processing was successful */
  success: boolean;
  
  /** Generated code prompt for AI */
  codePrompt?: ICodeGenerationPrompt;
  
  /** Generated code (if available) */
  generatedCode?: IGeneratedCode;
  
  /** Error message if processing failed */
  error?: string;
  
  /** Additional metadata */
  metadata?: {
    /** Fields extracted from the work item */
    extractedFields: Record<string, any>;
    
    /** Processing strategy used */
    strategy: string;
    
    /** Validation results */
    validationResults: IValidationResult[];
  };
}

/**
 * Interface for field validation result
 */
export interface IValidationResult {
  /** Field name that was validated */
  fieldName: string;
  
  /** Whether the field is valid */
  isValid: boolean;
  
  /** Validation message */
  message: string;
  
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Interface for work item processor
 */
export interface IWorkItemProcessor {
  /** Work item type this processor handles */
  readonly supportedType: WorkItemType;
  
  /** Process a work item and extract relevant information */
  processWorkItem(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig
  ): Promise<IWorkItemProcessingResult>;
  
  /** Validate that the work item has sufficient information */
  validateWorkItem(workItem: IEnrichedWorkItem): IValidationResult[];
  
  /** Extract type-specific fields from the work item */
  extractSpecificFields(workItem: IEnrichedWorkItem): Record<string, any>;
  
  /** Generate code generation prompt for this work item type */
  generateCodePrompt(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig,
    extractedFields: Record<string, any>
  ): ICodeGenerationPrompt;
}

/**
 * Abstract base class for work item processors
 * Provides common functionality and enforces the processor interface
 */
export abstract class BaseWorkItemProcessor implements IWorkItemProcessor {
  /** Work item type this processor handles */
  public abstract readonly supportedType: WorkItemType;

  /**
   * Process a work item and extract relevant information
   */
  async processWorkItem(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig
  ): Promise<IWorkItemProcessingResult> {
    try {
      // Validate the work item
      const validationResults = this.validateWorkItem(workItem);
      const hasErrors = validationResults.some(result => result.severity === 'error');
      
      if (hasErrors) {
        return {
          success: false,
          error: 'Work item validation failed',
          metadata: {
            extractedFields: {},
            strategy: this.getProcessingStrategy(),
            validationResults
          }
        };
      }

      // Extract type-specific fields
      const extractedFields = this.extractSpecificFields(workItem);
      
      // Generate code prompt
      const codePrompt = this.generateCodePrompt(workItem, repositoryConfig, extractedFields);
      
      return {
        success: true,
        codePrompt,
        metadata: {
          extractedFields,
          strategy: this.getProcessingStrategy(),
          validationResults
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        metadata: {
          extractedFields: {},
          strategy: this.getProcessingStrategy(),
          validationResults: []
        }
      };
    }
  }

  /**
   * Validate that the work item has sufficient information
   * Base implementation checks common required fields
   */
  validateWorkItem(workItem: IEnrichedWorkItem): IValidationResult[] {
    const results: IValidationResult[] = [];

    // Check required common fields
    if (!workItem.title || workItem.title.trim().length === 0) {
      results.push({
        fieldName: 'title',
        isValid: false,
        message: 'Title is required and cannot be empty',
        severity: 'error'
      });
    }

    if (!workItem.description || workItem.description.trim().length === 0) {
      results.push({
        fieldName: 'description',
        isValid: false,
        message: 'Description is required for code generation',
        severity: 'warning'
      });
    }

    if (!workItem.areaPath || workItem.areaPath.trim().length === 0) {
      results.push({
        fieldName: 'areaPath',
        isValid: false,
        message: 'Area path is required to determine target repository',
        severity: 'error'
      });
    }

    // Add type-specific validations
    results.push(...this.validateTypeSpecificFields(workItem));

    return results;
  }

  /**
   * Extract common fields that are useful for all work item types
   */
  protected extractCommonFields(workItem: IEnrichedWorkItem): Record<string, any> {
    return {
      id: workItem.id,
      type: workItem.type,
      title: workItem.title,
      description: workItem.description,
      assignedTo: workItem.assignedTo,
      areaPath: workItem.areaPath,
      iterationPath: workItem.iterationPath,
      state: workItem.state,
      priority: workItem.priority,
      tags: workItem.tags
    };
  }

  /**
   * Generate base code prompt structure
   */
  protected generateBaseCodePrompt(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig
  ): Partial<ICodeGenerationPrompt> {
    return {
      workItem,
      targetLanguage: repositoryConfig.targetLanguage,
      projectContext: {
        projectName: repositoryConfig.name,
        primaryLanguage: repositoryConfig.targetLanguage,
        framework: 'Express.js',
        version: '1.0.0',
        structure: {
          sourceDir: 'src',
          testDir: 'tests',
          configDir: 'config',
          docsDir: 'docs'
        },
        dependencies: [],
        devDependencies: []
      },
      codeTemplates: repositoryConfig.codeTemplates.filter(
        template => template.workItemTypes.includes(workItem.type)
      ),
      codingStandards: repositoryConfig.codingStandards
    };
  }

  /**
   * Get the processing strategy name for this processor
   */
  protected abstract getProcessingStrategy(): string;

  /**
   * Validate type-specific fields
   * Override in derived classes to add type-specific validation
   */
  protected abstract validateTypeSpecificFields(workItem: IEnrichedWorkItem): IValidationResult[];

  /**
   * Extract type-specific fields from the work item
   * Must be implemented by derived classes
   */
  public abstract extractSpecificFields(workItem: IEnrichedWorkItem): Record<string, any>;

  /**
   * Generate code generation prompt for this work item type
   * Must be implemented by derived classes
   */
  public abstract generateCodePrompt(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig,
    extractedFields: Record<string, any>
  ): ICodeGenerationPrompt;
}