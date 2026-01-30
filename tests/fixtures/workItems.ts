/**
 * Test fixtures for work items
 * Provides sample work item data for testing processors
 */

import { IEnrichedWorkItem, WorkItemType } from '../../src/models/workItem';
import { ProgrammingLanguage } from '../../src/models/codeGeneration';

/**
 * Base work item fixture with common fields
 */
const baseWorkItem: Partial<IEnrichedWorkItem> = {
  areaPath: 'TestProject\\Features',
  iterationPath: 'TestProject\\Sprint 1',
  state: 'New',
  priority: 2,
  tags: ['test', 'automation'],
  customFields: {}
};

/**
 * User Story fixtures
 */
export const userStoryFixtures = {
  complete: {
    ...baseWorkItem,
    id: 1001,
    type: WorkItemType.USER_STORY,
    title: 'As a user, I want to login to the system',
    description: 'As a registered user, I want to be able to login to the system so that I can access my personal dashboard and manage my account.',
    acceptanceCriteria: `Given I am a registered user
When I enter valid credentials
Then I should be logged in successfully
And I should see my dashboard`,
    assignedTo: 'john.doe@company.com',
    customFields: {
      'Microsoft.VSTS.Scheduling.StoryPoints': 5
    }
  } as IEnrichedWorkItem,

  minimal: {
    ...baseWorkItem,
    id: 1002,
    type: WorkItemType.USER_STORY,
    title: 'User registration',
    description: 'Allow users to register',
    acceptanceCriteria: '',
    assignedTo: ''
  } as IEnrichedWorkItem,

  withBulletPoints: {
    ...baseWorkItem,
    id: 1003,
    type: WorkItemType.USER_STORY,
    title: 'User profile management',
    description: 'As a user, I want to manage my profile information',
    acceptanceCriteria: `- User can view their profile
- User can edit their name and email
- User can change their password
- Changes are saved automatically`,
    assignedTo: 'jane.smith@company.com',
    tags: ['profile', 'user-management']
  } as IEnrichedWorkItem,

  missingTitle: {
    ...baseWorkItem,
    id: 1004,
    type: WorkItemType.USER_STORY,
    title: '',
    description: 'A user story without title',
    acceptanceCriteria: 'Some criteria'
  } as IEnrichedWorkItem,

  missingDescription: {
    ...baseWorkItem,
    id: 1005,
    type: WorkItemType.USER_STORY,
    title: 'Story with no description',
    description: '',
    acceptanceCriteria: 'Some criteria'
  } as IEnrichedWorkItem,

  missingAreaPath: {
    ...baseWorkItem,
    id: 1006,
    type: WorkItemType.USER_STORY,
    title: 'Story with no area path',
    description: 'Description here',
    areaPath: ''
  } as IEnrichedWorkItem
};

/**
 * Task fixtures
 */
export const taskFixtures = {
  complete: {
    ...baseWorkItem,
    id: 2001,
    type: WorkItemType.TASK,
    title: 'Implement user authentication API',
    description: `Create REST API endpoints for user authentication:
1. POST /api/auth/login - authenticate user credentials
2. POST /api/auth/logout - invalidate user session
3. GET /api/auth/verify - verify token validity

Technical requirements:
- Use JWT tokens for authentication
- Implement bcrypt for password hashing
- Add rate limiting for login attempts
- Include comprehensive error handling`,
    assignedTo: 'dev.team@company.com',
    customFields: {
      'Microsoft.VSTS.Scheduling.Effort': 8,
      'Microsoft.VSTS.Scheduling.RemainingWork': 6
    }
  } as IEnrichedWorkItem,

  minimal: {
    ...baseWorkItem,
    id: 2002,
    type: WorkItemType.TASK,
    title: 'Fix login bug',
    description: 'Fix the login issue',
    assignedTo: ''
  } as IEnrichedWorkItem,

  withSteps: {
    ...baseWorkItem,
    id: 2003,
    type: WorkItemType.TASK,
    title: 'Database migration task',
    description: `Migrate user table to new schema:
Step 1: Create backup of existing data
Step 2: Create new table structure
Step 3: Migrate data with transformation
Step 4: Update application code
Step 5: Test migration thoroughly

Consider: This migration affects all user-related functionality`,
    assignedTo: 'database.admin@company.com',
    tags: ['database', 'migration', 'critical']
  } as IEnrichedWorkItem,

  shortDescription: {
    ...baseWorkItem,
    id: 2004,
    type: WorkItemType.TASK,
    title: 'Update config',
    description: 'Update config file',
    assignedTo: 'dev@company.com'
  } as IEnrichedWorkItem
};

/**
 * Bug fixtures
 */
export const bugFixtures = {
  complete: {
    ...baseWorkItem,
    id: 3001,
    type: WorkItemType.BUG,
    title: 'Login fails with special characters in password',
    description: `Users cannot login when their password contains special characters like @, #, or %.
Expected: Users should be able to login with any valid password
Actual: Login fails with "Invalid credentials" error`,
    reproductionSteps: `1. Navigate to login page
2. Enter username: testuser@example.com
3. Enter password: MyP@ssw0rd#123
4. Click Login button
5. Observe error message`,
    assignedTo: 'bug.fixer@company.com',
    priority: 1,
    customFields: {
      'Microsoft.VSTS.Common.Severity': 'High'
    }
  } as IEnrichedWorkItem,

  minimal: {
    ...baseWorkItem,
    id: 3002,
    type: WorkItemType.BUG,
    title: 'App crashes',
    description: 'The app crashes sometimes',
    reproductionSteps: '',
    assignedTo: ''
  } as IEnrichedWorkItem,

  withBulletSteps: {
    ...baseWorkItem,
    id: 3003,
    type: WorkItemType.BUG,
    title: 'Dashboard loading issue',
    description: 'Dashboard takes too long to load and sometimes shows empty data',
    reproductionSteps: `- Login to the application
- Navigate to dashboard
- Wait for data to load
- Notice slow loading or empty state`,
    assignedTo: 'performance.team@company.com',
    tags: ['performance', 'dashboard'],
    customFields: {
      'Microsoft.VSTS.Common.Severity': 'Medium'
    }
  } as IEnrichedWorkItem,

  missingReproductionSteps: {
    ...baseWorkItem,
    id: 3004,
    type: WorkItemType.BUG,
    title: 'Bug without reproduction steps',
    description: 'Something is broken',
    reproductionSteps: '',
    assignedTo: 'dev@company.com'
  } as IEnrichedWorkItem,

  shortReproductionSteps: {
    ...baseWorkItem,
    id: 3005,
    type: WorkItemType.BUG,
    title: 'Bug with short steps',
    description: 'Detailed bug description here',
    reproductionSteps: 'Click button',
    assignedTo: 'dev@company.com'
  } as IEnrichedWorkItem
};

/**
 * Repository configuration fixture
 */
export const repositoryConfigFixture = {
  id: 'test-repo',
  name: 'Test Repository',
  url: 'https://dev.azure.com/test-org/test-project/_git/test-repo',
  defaultBranch: 'main',
  targetLanguage: ProgrammingLanguage.TYPESCRIPT,
  codeTemplates: [
    {
      name: 'API Endpoint Template',
      description: 'Template for creating REST API endpoints',
      workItemTypes: [WorkItemType.USER_STORY, WorkItemType.TASK],
      templateFiles: [],
      variables: {},
      metadata: {
        version: '1.0.0',
        author: 'Test Author',
        createdDate: '2023-01-01',
        lastUpdated: '2023-01-01',
        tags: ['api', 'rest']
      }
    },
    {
      name: 'Bug Fix Template',
      description: 'Template for fixing bugs',
      workItemTypes: [WorkItemType.BUG],
      templateFiles: [],
      variables: {},
      metadata: {
        version: '1.0.0',
        author: 'Test Author',
        createdDate: '2023-01-01',
        lastUpdated: '2023-01-01',
        tags: ['bugfix']
      }
    }
  ],
  codingStandards: {
    lintingRules: 'eslint:recommended',
    formattingConfig: 'prettier',
    namingConventions: {
      'variables': 'camelCase',
      'functions': 'camelCase',
      'classes': 'PascalCase',
      'constants': 'UPPER_SNAKE_CASE',
      'files': 'camelCase',
      'directories': 'kebab-case'
    },
    fileStructure: []
  },
  reviewers: ['reviewer1@company.com', 'reviewer2@company.com'],
  areaPathMappings: {
    'TestProject\\Features': 'src/features',
    'TestProject\\Infrastructure': 'src/infrastructure'
  }
};