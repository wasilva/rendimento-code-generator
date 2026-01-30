/**
 * Work Item models and interfaces for Azure DevOps integration
 * Implements interfaces for webhook payloads and enriched work item data
 */

/**
 * Enum representing different types of work items in Azure DevOps
 */
export enum WorkItemType {
  USER_STORY = 'User Story',
  TASK = 'Task',
  BUG = 'Bug',
  FEATURE = 'Feature',
  EPIC = 'Epic'
}

/**
 * Interface for webhook payload received from Azure DevOps
 * Represents the structure of webhook notifications sent by Azure DevOps
 * when work items are created or updated
 */
export interface IWorkItemWebhookPayload {
  /** Type of event that triggered the webhook */
  eventType: string;
  
  /** ID of the publisher that sent the webhook */
  publisherId: string;
  
  /** Main resource data containing work item information */
  resource: {
    /** Unique identifier of the work item */
    id: number;
    
    /** Type of the work item (User Story, Task, Bug, etc.) - optional, may be in fields */
    workItemType?: string;
    
    /** URL to access the work item via Azure DevOps API */
    url?: string;
    
    /** Dynamic fields containing work item data */
    fields: Record<string, any>;
  };
  
  /** Version of the resource schema */
  resourceVersion: string;
  
  /** Container information including project details */
  resourceContainers: {
    project: {
      /** Unique identifier of the project */
      id: string;
      
      /** Name of the project */
      name: string;
    };
  };
}

/**
 * Interface for enriched work item data
 * Contains processed and normalized work item information
 * with additional data fetched from Azure DevOps API
 */
export interface IEnrichedWorkItem {
  /** Unique identifier of the work item */
  id: number;
  
  /** Type of the work item using the WorkItemType enum */
  type: WorkItemType;
  
  /** Title/summary of the work item */
  title: string;
  
  /** Detailed description of the work item (optional) */
  description?: string;
  
  /** Acceptance criteria for User Stories (optional) */
  acceptanceCriteria?: string;
  
  /** Steps to reproduce for Bugs (optional) */
  reproductionSteps?: string;
  
  /** Person assigned to the work item (optional) */
  assignedTo?: string;
  
  /** Area path indicating the team/component */
  areaPath: string;
  
  /** Iteration path indicating the sprint/timeline */
  iterationPath: string;
  
  /** Current state of the work item (New, Active, Resolved, etc.) */
  state: string;
  
  /** Priority level of the work item */
  priority: number;
  
  /** Tags associated with the work item */
  tags: string[];
  
  /** Custom fields specific to the project or work item type */
  customFields: Record<string, any>;
}

/**
 * Interface for work item field definition
 * Used to understand the structure and metadata of work item fields
 */
export interface IWorkItemField {
  /** Reference name of the field */
  referenceName: string;
  
  /** Display name of the field */
  name: string;
  
  /** Type of the field (string, integer, datetime, etc.) */
  type: string;
  
  /** Whether the field is required */
  isRequired: boolean;
  
  /** Whether the field is read-only */
  isReadOnly: boolean;
  
  /** Description of the field */
  description?: string;
  
  /** Allowed values for the field (if applicable) */
  allowedValues?: string[];
}

/**
 * Interface for work item processing result
 * Contains the outcome of processing a work item
 */
export interface IProcessingResult {
  /** Whether the processing was successful */
  success: boolean;
  
  /** The processed work item data */
  workItem?: IEnrichedWorkItem;
  
  /** Error message if processing failed */
  error?: string;
  
  /** Additional details about the processing */
  details?: {
    /** Time taken to process the work item */
    processingTime: number;
    
    /** Repository that was determined for the work item */
    targetRepository?: string;
    
    /** Branch name that was created */
    branchName?: string;
    
    /** Pull request ID if created */
    pullRequestId?: number;
  };
}