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
    private geminiService: IGeminiService, // Agora será usado para geração de código
    private gitService: IGitService,
    private pullRequestService: IPullRequestService,
    private repositoryConfigs: Record<string, IRepositoryConfig>
  ) {}

  async processWorkItem(workItemData: IWorkItemWebhookPayload): Promise<IProcessingResult> {
    try {
      // 1. Enrich work item data (pass webhook data for fallback)
      const enrichedWorkItem = await this.enrichWorkItemData(workItemData.resource.id, workItemData);
      
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
      
      // 5. Create branch in Azure DevOps first
      const branchResult = await this.gitService.createBranch(branchName);
      if (!branchResult.success) {
        return {
          success: false,
          workItemId: enrichedWorkItem.id,
          error: `Failed to create branch: ${branchResult.error}`,
          processingDetails: processingResult
        };
      }
      
      // 6. Generate code using AI (if code prompt is available)
      let generatedCode;
      if (processingResult.codePrompt) {
        console.log(`🤖 Generating code for work item ${enrichedWorkItem.id}`);
        try {
          generatedCode = await this.geminiService.generateCode(processingResult.codePrompt);
          console.log(`✅ Code generated: ${generatedCode.files.length} files, ${generatedCode.tests.length} tests`);
        } catch (error) {
          console.warn(`⚠️ Code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue without generated code
        }
      }
      
      // 7. Commit generated code to the branch (if available)
      if (generatedCode && generatedCode.files.length > 0) {
        console.log(`📝 Committing ${generatedCode.files.length} generated files`);
        
        // Convert generated files to file changes
        const fileChanges = [
          ...generatedCode.files.map(file => ({
            path: file.path,
            content: file.content,
            operation: FileOperation.CREATE
          })),
          ...generatedCode.tests.map(test => ({
            path: test.path,
            content: test.content,
            operation: FileOperation.CREATE
          }))
        ];
        
        // Commit generated code to the branch
        const commitResult = await this.gitService.commitChanges(
          fileChanges, 
          `feat: ${enrichedWorkItem.title}\n\n${enrichedWorkItem.description || 'Auto-generated code from work item'}`
        );
        
        if (!commitResult.success) {
          console.warn(`⚠️ Failed to commit generated code: ${commitResult.error}`);
          // Continue with PR creation even if commit fails
        } else {
          console.log(`✅ Code committed successfully: ${commitResult.commitSha}`);
        }
      }
      
      // 8. Create pull request
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

  async enrichWorkItemData(workItemId: number, webhookData?: IWorkItemWebhookPayload): Promise<IEnrichedWorkItem> {
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
      // If Azure DevOps API fails, use webhook data if available
      console.warn(`Failed to fetch work item ${workItemId} from Azure DevOps, using webhook data`);
      
      if (webhookData?.resource?.fields) {
        const fields = webhookData.resource.fields;
        return {
          id: workItemId,
          type: this.mapWorkItemType(webhookData.resource.workItemType || fields['System.WorkItemType']),
          title: fields['System.Title'] || `Work Item ${workItemId}`,
          description: fields['System.Description'] || '',
          acceptanceCriteria: fields['Microsoft.VSTS.Common.AcceptanceCriteria'] || '',
          reproductionSteps: fields['Microsoft.VSTS.TCM.ReproSteps'] || '',
          assignedTo: fields['System.AssignedTo'] || 'System',
          areaPath: fields['System.AreaPath'] || 'Rendimento\\Backend',
          iterationPath: fields['System.IterationPath'] || 'Rendimento\\Sprint 1',
          state: fields['System.State'] || 'New',
          priority: fields['Microsoft.VSTS.Common.Priority'] || 2,
          tags: fields['System.Tags']?.split(';') || ['auto-generated'],
          customFields: fields
        };
      }
      
      // Fallback to basic mock data
      return {
        id: workItemId,
        type: WorkItemType.TASK,
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