/**
 * Repository Configuration
 * Default configuration for the Redimento project repository
 */

import { IRepositoryConfig } from '../models/configuration';
import { ICodeTemplate, ICodingStandards, ProgrammingLanguage, FileType } from '../models/codeGeneration';
import { WorkItemType } from '../models/workItem';

// Default coding standards
const defaultCodingStandards: ICodingStandards = {
  lintingRules: 'eslint:recommended',
  formattingConfig: 'prettier',
  namingConventions: {
    functions: 'camelCase',
    classes: 'PascalCase',
    variables: 'camelCase',
    constants: 'UPPER_SNAKE_CASE',
    files: 'camelCase',
    directories: 'kebab-case'
  },
  fileStructure: [
    {
      pattern: 'src/**/*.ts',
      description: 'TypeScript source files',
      requiredStructure: ['src'],
      namingConvention: 'camelCase',
      mandatory: true
    },
    {
      pattern: 'tests/**/*.test.ts',
      description: 'Test files',
      requiredStructure: ['tests'],
      namingConvention: 'camelCase',
      mandatory: false
    }
  ]
};

// Default code templates
const defaultCodeTemplates: ICodeTemplate[] = [
  {
    name: 'TypeScript Service',
    description: 'Generates a TypeScript service class with interface',
    workItemTypes: [WorkItemType.TASK, WorkItemType.USER_STORY],
    templateFiles: [
      {
        name: 'TypeScript Service Template',
        targetPath: 'src/services/{{serviceName}}.ts',
        content: `/**
 * {{serviceName}} - Generated from work item {{workItemId}}
 * {{description}}
 */

export interface I{{serviceName}} {
  // Interface methods will be defined here
}

export class {{serviceName}} implements I{{serviceName}} {
  constructor() {
    // Constructor implementation
  }

  // Implementation methods will be added here
}
`,
        fileType: FileType.SOURCE,
        language: ProgrammingLanguage.TYPESCRIPT,
        variables: ['serviceName', 'workItemId', 'description']
      }
    ],
    variables: {
      serviceName: 'Extracted from work item title',
      workItemId: 'Work item ID',
      description: 'Work item description'
    },
    metadata: {
      version: '1.0.0',
      author: 'Redimento Code Generator',
      createdDate: '2024-01-01',
      lastUpdated: '2024-01-01',
      tags: ['typescript', 'service', 'class']
    }
  },
  {
    name: 'Bug Fix Template',
    description: 'Generates a TypeScript class for bug fixes',
    workItemTypes: [WorkItemType.BUG],
    templateFiles: [
      {
        name: 'Bug Fix Template',
        targetPath: 'src/fixes/{{bugFixName}}.ts',
        content: `/**
 * Bug Fix: {{title}}
 * Work Item: {{workItemId}}
 * 
 * Description: {{description}}
 * Reproduction Steps: {{reproductionSteps}}
 */

export class {{bugFixName}} {
  /**
   * Fixes the issue described in work item {{workItemId}}
   */
  public fix(): void {
    // Bug fix implementation will be generated here
  }
}
`,
        fileType: FileType.SOURCE,
        language: ProgrammingLanguage.TYPESCRIPT,
        variables: ['bugFixName', 'title', 'workItemId', 'description', 'reproductionSteps']
      }
    ],
    variables: {
      bugFixName: 'Generated from bug title',
      title: 'Bug title',
      workItemId: 'Work item ID',
      description: 'Bug description',
      reproductionSteps: 'Steps to reproduce the bug'
    },
    metadata: {
      version: '1.0.0',
      author: 'Redimento Code Generator',
      createdDate: '2024-01-01',
      lastUpdated: '2024-01-01',
      tags: ['typescript', 'bugfix', 'class']
    }
  }
];

// Default repository configuration
export const defaultRepositoryConfig: IRepositoryConfig = {
  id: 'redimento-main',
  name: 'Redimento Code Generator',
  url: process.env['GIT_REPOSITORY_URL'] || 'https://github.com/qacoders-madeinweb/redimento-code-generator.git',
  defaultBranch: 'main',
  targetLanguage: ProgrammingLanguage.TYPESCRIPT,
  codeTemplates: defaultCodeTemplates,
  codingStandards: defaultCodingStandards,
  reviewers: [
    process.env['DEFAULT_REVIEWER'] || 'admin@qacoders.com'
  ],
  areaPathMappings: {
    'Rendimento': 'redimento-main',
    'Rendimento\\Backend': 'redimento-main',
    'Rendimento\\Frontend': 'redimento-main',
    'Rendimento\\API': 'redimento-main'
  }
};

// Repository configurations map
export const repositoryConfigs: Record<string, IRepositoryConfig> = {
  'redimento-main': defaultRepositoryConfig
};