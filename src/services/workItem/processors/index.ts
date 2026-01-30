/**
 * Work Item Processors
 * Exports all work item type-specific processors
 */

export { BaseWorkItemProcessor, IWorkItemProcessor, IWorkItemProcessingResult, IValidationResult } from './BaseWorkItemProcessor';
export { UserStoryProcessor } from './UserStoryProcessor';
export { TaskProcessor } from './TaskProcessor';
export { BugProcessor } from './BugProcessor';

// Processor factory for creating appropriate processor based on work item type
import { WorkItemType } from '../../../models/workItem';
import { IWorkItemProcessor } from './BaseWorkItemProcessor';
import { UserStoryProcessor } from './UserStoryProcessor';
import { TaskProcessor } from './TaskProcessor';
import { BugProcessor } from './BugProcessor';

/**
 * Factory class for creating work item processors
 */
export class WorkItemProcessorFactory {
  private static processors = new Map<WorkItemType, IWorkItemProcessor>([
    [WorkItemType.USER_STORY, new UserStoryProcessor()],
    [WorkItemType.TASK, new TaskProcessor()],
    [WorkItemType.BUG, new BugProcessor()]
  ]);

  /**
   * Get the appropriate processor for a work item type
   */
  static getProcessor(workItemType: WorkItemType): IWorkItemProcessor {
    const processor = this.processors.get(workItemType);
    
    if (!processor) {
      throw new Error(`No processor found for work item type: ${workItemType}`);
    }
    
    return processor;
  }

  /**
   * Get all available processors
   */
  static getAllProcessors(): IWorkItemProcessor[] {
    return Array.from(this.processors.values());
  }

  /**
   * Get supported work item types
   */
  static getSupportedTypes(): WorkItemType[] {
    return Array.from(this.processors.keys());
  }
}