/**
 * Azure DevOps API models and interfaces
 * Implements interfaces for interacting with Azure DevOps REST API
 */

/**
 * Interface for Azure DevOps work item as returned by the REST API
 * This represents the raw work item data structure from Azure DevOps
 */
export interface IWorkItem {
  /** Unique identifier of the work item */
  id: number;
  
  /** Revision number of the work item */
  rev: number;
  
  /** URL to access the work item */
  url: string;
  
  /** Dynamic fields containing all work item data */
  fields: {
    /** System fields */
    'System.Id': number;
    'System.WorkItemType': string;
    'System.Title': string;
    'System.State': string;
    'System.AssignedTo'?: {
      displayName: string;
      uniqueName: string;
      id: string;
    };
    'System.Description'?: string;
    'System.AreaPath': string;
    'System.IterationPath': string;
    'System.Tags'?: string;
    'System.Priority'?: number;
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.CreatedBy': {
      displayName: string;
      uniqueName: string;
      id: string;
    };
    
    /** Custom fields for User Stories */
    'Microsoft.VSTS.Common.AcceptanceCriteria'?: string;
    
    /** Custom fields for Bugs */
    'Microsoft.VSTS.TCM.ReproductionSteps'?: string;
    
    /** Additional custom fields */
    [key: string]: any;
  };
  
  /** Relations to other work items or artifacts */
  relations?: IWorkItemRelation[];
}

/**
 * Interface for work item relations
 * Represents links between work items or to external artifacts
 */
export interface IWorkItemRelation {
  /** Type of relation (Child, Parent, Related, etc.) */
  rel: string;
  
  /** URL of the related item */
  url: string;
  
  /** Attributes of the relation */
  attributes?: {
    /** Whether this is a forward link */
    isLocked?: boolean;
    
    /** Name of the relation */
    name?: string;
    
    /** Comment on the relation */
    comment?: string;
  };
}

/**
 * Interface for Azure DevOps project information
 */
export interface IProject {
  /** Unique identifier of the project */
  id: string;
  
  /** Name of the project */
  name: string;
  
  /** Description of the project */
  description?: string;
  
  /** URL to access the project */
  url: string;
  
  /** State of the project (wellFormed, createPending, etc.) */
  state: string;
  
  /** Revision number of the project */
  revision: number;
  
  /** Visibility of the project (private, public) */
  visibility: string;
}

/**
 * Interface for Azure DevOps team information
 */
export interface ITeam {
  /** Unique identifier of the team */
  id: string;
  
  /** Name of the team */
  name: string;
  
  /** Description of the team */
  description?: string;
  
  /** URL to access the team */
  url: string;
  
  /** Project that the team belongs to */
  projectId: string;
}

/**
 * Interface for work item comment
 */
export interface IWorkItemComment {
  /** Unique identifier of the comment */
  id: number;
  
  /** Text content of the comment */
  text: string;
  
  /** User who created the comment */
  createdBy: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
  
  /** Date when the comment was created */
  createdDate: string;
  
  /** Date when the comment was last modified */
  modifiedDate: string;
  
  /** Version of the comment */
  version: number;
}

/**
 * Interface for creating a work item comment
 */
export interface ICreateWorkItemComment {
  /** Text content of the comment */
  text: string;
}

/**
 * Interface for pull request information in Azure DevOps
 */
export interface IPullRequest {
  /** Unique identifier of the pull request */
  pullRequestId: number;
  
  /** Title of the pull request */
  title: string;
  
  /** Description of the pull request */
  description?: string;
  
  /** Source branch reference */
  sourceRefName: string;
  
  /** Target branch reference */
  targetRefName: string;
  
  /** Status of the pull request (active, completed, abandoned) */
  status: string;
  
  /** User who created the pull request */
  createdBy: {
    displayName: string;
    uniqueName: string;
    id: string;
  };
  
  /** Date when the pull request was created */
  creationDate: string;
  
  /** URL to access the pull request */
  url: string;
  
  /** Repository information */
  repository: {
    id: string;
    name: string;
    url: string;
  };
  
  /** Reviewers assigned to the pull request */
  reviewers?: IPullRequestReviewer[];
  
  /** Work items linked to the pull request */
  workItemRefs?: {
    id: string;
    url: string;
  }[];
}

/**
 * Interface for pull request reviewer
 */
export interface IPullRequestReviewer {
  /** Unique identifier of the reviewer */
  id: string;
  
  /** Display name of the reviewer */
  displayName: string;
  
  /** Unique name of the reviewer */
  uniqueName: string;
  
  /** Vote of the reviewer (-10 to 10) */
  vote: number;
  
  /** Whether the reviewer is required */
  isRequired: boolean;
  
  /** Whether the reviewer is a container (team) */
  isContainer: boolean;
}

/**
 * Interface for creating a pull request
 */
export interface ICreatePullRequest {
  /** Title of the pull request */
  title: string;
  
  /** Description of the pull request */
  description?: string;
  
  /** Source branch reference */
  sourceRefName: string;
  
  /** Target branch reference */
  targetRefName: string;
  
  /** Reviewers to assign to the pull request */
  reviewers?: {
    id: string;
    isRequired?: boolean;
  }[];
}

/**
 * Interface for Azure DevOps API response wrapper
 * Many Azure DevOps API endpoints return data in this format
 */
export interface IApiResponse<T> {
  /** The actual data */
  value: T[];
  
  /** Total count of items */
  count: number;
}

/**
 * Interface for Azure DevOps API error response
 */
export interface IApiError {
  /** Error message */
  message: string;
  
  /** Error type identifier */
  typeKey?: string;
  
  /** HTTP status code */
  statusCode?: number;
  
  /** Additional error details */
  details?: any;
}

/**
 * Interface for work item update operation
 */
export interface IWorkItemUpdate {
  /** Operation type (add, replace, remove) */
  op: 'add' | 'replace' | 'remove';
  
  /** Path to the field being updated */
  path: string;
  
  /** Value to set (not used for remove operations) */
  value?: any;
  
  /** Previous value (for tracking changes) */
  from?: any;
}

/**
 * Interface for work item batch update request
 */
export interface IWorkItemBatchUpdate {
  /** Method for the operation (PATCH, POST, etc.) */
  method: string;
  
  /** URI for the work item */
  uri: string;
  
  /** Headers for the request */
  headers?: Record<string, string>;
  
  /** Body containing the update operations */
  body: IWorkItemUpdate[];
}

/**
 * Interface for Azure DevOps webhook subscription
 */
export interface IWebhookSubscription {
  /** Unique identifier of the subscription */
  id: string;
  
  /** URL where webhooks will be sent */
  consumerActionId: string;
  
  /** Consumer ID */
  consumerId: string;
  
  /** Consumer inputs configuration */
  consumerInputs: Record<string, string>;
  
  /** Event type that triggers the webhook */
  eventType: string;
  
  /** Publisher ID */
  publisherId: string;
  
  /** Publisher inputs configuration */
  publisherInputs: Record<string, any>;
  
  /** Resource version */
  resourceVersion: string;
  
  /** Scope of the subscription */
  scope: string;
  
  /** Status of the subscription */
  status: string;
}