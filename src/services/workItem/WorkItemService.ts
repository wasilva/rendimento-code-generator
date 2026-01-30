/**
 * WorkItemService - Main orchestrator for work item processing
 * Coordinates the complete workflow from webhook to pull request
 */

import { IEnrichedWorkItem, IWorkItemWebhookPayload, WorkItemType } from '../../models/workItem';
import { IRepositoryConfig } from '../../models/configuration';
import { IAzureDevOpsService } from '../azure/azureDevOpsService';
import { IGeminiService } from '../gemini/GeminiService';
import { IGitService, FileOperation } from '../../models/git';
import { IPullRequestService } from '../git/PullRequestService';
import { WorkItemProcessorFactory, IWorkItemProcessingResult } from './processors';

export interface IProcessingResult {
  success: boolean;
  workItemId: number;
  branchName?: string;
  pullRequestId?: number;
  error?: string;
  processingDetails?: IWorkItemProcessingResult;
}

export interface IWorkItemService {
  processWorkItem(workItemData: IWorkItemWebhookPayload): Promise<IProcessingResult>;
  enrichWorkItemData(workItemId: number): Promise<IEnrichedWorkItem>;
  determineTargetRepository(workItem: IEnrichedWorkItem): Promise<IRepositoryConfig>;
  processWorkItemWithSpecificProcessor(workItem: IEnrichedWorkItem, repositoryConfig: IRepositoryConfig): Promise<IWorkItemProcessingResult>;
}

export class WorkItemService implements IWorkItemService {
  constructor(
    private azureDevOpsService: IAzureDevOpsService,
    // @ts-ignore - Will be used for AI code generation in future implementation
    private geminiService: IGeminiService,
    private gitService: IGitService,
    private pullRequestService: IPullRequestService,
    private repositoryConfigs: Record<string, IRepositoryConfig>
  ) {}

  async processWorkItem(workItemData: IWorkItemWebhookPayload): Promise<IProcessingResult> {
    try {
      // 1. Enrich work item data
      const enrichedWorkItem = await this.enrichWorkItemData(workItemData.resource.id);
      
      // 2. Determine target repository
      const repositoryConfig = await this.determineTargetRepository(enrichedWorkItem);
      
      // 3. Process work item with specific processor
      const processingResult = await this.processWorkItemWithSpecificProcessor(
        enrichedWorkItem,
        repositoryConfig
      );
      
      if (!processingResult.success) {
        return {
          success: false,
          workItemId: enrichedWorkItem.id,
          error: processingResult.error || 'Processing failed',
          processingDetails: processingResult
        };
      }
      
      // 4. Generate branch name
      const branchName = this.gitService.generateBranchName(enrichedWorkItem);
      
      // 5. Generate code using AI (if code prompt is available)
      let generatedCode;
      if (processingResult.codePrompt) {
        generatedCode = await this.geminiService.generateCode(processingResult.codePrompt);
      }
      
      // 6. Create branch and commit (if code was generated)
      if (generatedCode) {
        // Create branch in Azure DevOps
        await this.gitService.createBranch(branchName);
        
        // Convert generated files to file changes
        const fileChanges = generatedCode.files.map(file => ({
          path: file.path,
          content: file.content,
          operation: FileOperation.CREATE
        }));
        
        // Commit generated code to the branch
        await this.gitService.commitChanges(fileChanges, `feat: ${enrichedWorkItem.title}`);
      } else {
        // Even without generated code, create an empty branch for the PR
        await this.gitService.createBranch(branchName);
      }
      
      // 7. Create pull request
      const pullRequestData = this.pullRequestService.generatePullRequestData(
        enrichedWorkItem,
        branchName,
        repositoryConfig
      );
      
      const pullRequest = await this.pullRequestService.createPullRequest(
        repositoryConfig,
        pullRequestData
      );
      
      return {
        success: true,
        workItemId: enrichedWorkItem.id,
        branchName,
        pullRequestId: pullRequest.id,
        processingDetails: processingResult
      };
    } catch (error) {
      return {
        success: false,
        workItemId: workItemData.resource.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async enrichWorkItemData(workItemId: number): Promise<IEnrichedWorkItem> {
    try {
      const workItem = await this.azureDevOpsService.getWorkItem(workItemId);
      
      return {
        id: workItem.id,
        type: this.mapWorkItemType(workItem.fields['System.WorkItemType']),
        title: workItem.fields['System.Title'] || '',
        description: workItem.fields['System.Description'] || '',
        acceptanceCriteria: workItem.fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
        reproductionSteps: workItem.fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
        assignedTo: workItem.fields['System.AssignedTo']?.displayName || '',
        areaPath: workItem.fields['System.AreaPath'] || '',
        iterationPath: workItem.fields['System.IterationPath'] || '',
        state: workItem.fields['System.State'] || '',
        priority: workItem.fields['Microsoft.VSTS.Common.Priority'] || 2,
        tags: workItem.fields['System.Tags']?.split(';') || [],
        customFields: workItem.fields
      };
    } catch (error) {
      // If Azure DevOps API fails, create a mock work item from webhook data for testing
      console.warn(`Failed to fetch work item ${workItemId} from Azure DevOps, using mock data`);
      
      return {
        id: workItemId,
        type: WorkItemType.TASK, // Default to Task for testing
        title: `Mock Work Item ${workItemId}`,
        description: 'This is a mock work item for testing purposes',
        acceptanceCriteria: '',
        reproductionSteps: '',
        assignedTo: 'System',
        areaPath: 'Rendimento\\Backend',
        iterationPath: 'Rendimento\\Sprint 1',
        state: 'New',
        priority: 2,
        tags: ['auto-generated', 'test'],
        customFields: {}
      };
    }
  }

  /**
   * Maps Azure DevOps work item types to our internal enum
   */
  private mapWorkItemType(azureWorkItemType: string): WorkItemType {
    const typeMapping: Record<string, WorkItemType> = {
      'User Story': WorkItemType.USER_STORY,
      'Task': WorkItemType.TASK,
      'Bug': WorkItemType.BUG,
      'Feature': WorkItemType.FEATURE,
      'Epic': WorkItemType.EPIC,
      // Add common variations
      'user story': WorkItemType.USER_STORY,
      'task': WorkItemType.TASK,
      'bug': WorkItemType.BUG,
      'feature': WorkItemType.FEATURE,
      'epic': WorkItemType.EPIC
    };

    const mappedType = typeMapping[azureWorkItemType];
    if (!mappedType) {
      // Default to TASK if type is not recognized
      console.warn(`Unknown work item type: ${azureWorkItemType}, defaulting to Task`);
      return WorkItemType.TASK;
    }

    return mappedType;
  }

  async processWorkItemWithSpecificProcessor(
    workItem: IEnrichedWorkItem,
    repositoryConfig: IRepositoryConfig
  ): Promise<IWorkItemProcessingResult> {
    try {
      // Get the appropriate processor for this work item type
      const processor = WorkItemProcessorFactory.getProcessor(workItem.type);
      
      // Process the work item using the specific processor
      const result = await processor.processWorkItem(workItem, repositoryConfig);
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process work item with specific processor',
        metadata: {
          extractedFields: {},
          strategy: 'unknown',
          validationResults: []
        }
      };
    }
  }

  async determineTargetRepository(workItem: IEnrichedWorkItem): Promise<IRepositoryConfig> {
    // Simple implementation - use area path to determine repository
    const areaPath = workItem.areaPath;
    
    // Find repository based on area path mappings
    for (const [, config] of Object.entries(this.repositoryConfigs)) {
      if (config.areaPathMappings[areaPath]) {
        return config;
      }
    }
    
    // Default to first repository if no mapping found
    const defaultRepo = Object.values(this.repositoryConfigs)[0];
    if (!defaultRepo) {
      throw new Error('No repository configuration found');
    }
    
    return defaultRepo;
  }
}