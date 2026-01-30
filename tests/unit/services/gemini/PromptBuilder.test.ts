/**
 * Unit tests for PromptBuilder
 * Tests prompt generation for different scenarios and work item types
 */

import { PromptBuilder, IPromptOptions } from '../../../../src/services/gemini/PromptBuilder';
import { 
  ICodeGenerationPrompt, 
  ProgrammingLanguage,
  ICodeTemplate,
  ICodingStandards,
  IProjectContext,
  FileType
} from '../../../../src/models/codeGeneration';
import { WorkItemType } from '../../../../src/models/workItem';

describe('PromptBuilder', () => {
  const mockWorkItem = {
    id: 123,
    type: WorkItemType.USER_STORY,
    title: 'Create user authentication',
    description: 'Implement user login and registration functionality',
    acceptanceCriteria: 'Users should be able to login with email and password',
    priority: 1,
    state: 'New',
    areaPath: 'MyProject\\Authentication',
    iterationPath: 'MyProject\\Sprint 1',
    tags: ['authentication', 'security'],
    assignedTo: 'developer@example.com',
    customFields: {}
  };

  const mockProjectContext: IProjectContext = {
    projectName: 'TestProject',
    primaryLanguage: ProgrammingLanguage.TYPESCRIPT,
    framework: 'Express.js',
    version: '1.0.0',
    structure: {
      sourceDir: 'src',
      testDir: 'tests',
      configDir: 'config',
      docsDir: 'docs'
    },
    dependencies: ['express', 'bcrypt', 'jsonwebtoken'],
    devDependencies: ['jest', '@types/node', 'supertest'],
    buildConfig: {
      buildCommand: 'npm run build',
      testCommand: 'npm test',
      startCommand: 'npm start'
    }
  };

  const mockCodingStandards: ICodingStandards = {
    lintingRules: 'eslint:recommended',
    formattingConfig: 'prettier',
    namingConventions: {
      variables: 'camelCase',
      functions: 'camelCase',
      classes: 'PascalCase',
      constants: 'UPPER_SNAKE_CASE',
      files: 'camelCase',
      directories: 'kebab-case'
    },
    fileStructure: [
      {
        pattern: '*.service.ts',
        requiredStructure: ['class', 'methods', 'exports'],
        namingConvention: 'PascalCase',
        mandatory: true,
        description: 'Service classes should follow standard structure'
      }
    ],
    qualityThresholds: {
      maxComplexity: 10,
      maxFunctionLength: 50,
      maxFileLength: 500,
      minTestCoverage: 80
    }
  };

  const mockCodeTemplate: ICodeTemplate = {
    name: 'Express Service Template',
    description: 'Template for creating Express.js services',
    workItemTypes: [WorkItemType.USER_STORY, WorkItemType.TASK],
    templateFiles: [
      {
        name: 'service.ts',
        targetPath: 'src/services/{name}.service.ts',
        content: 'export class {Name}Service {}',
        fileType: FileType.SOURCE,
        language: ProgrammingLanguage.TYPESCRIPT,
        variables: ['name', 'Name']
      }
    ],
    variables: {
      name: 'auth',
      Name: 'Auth'
    },
    dependencies: ['express'],
    metadata: {
      version: '1.0.0',
      author: 'System',
      createdDate: '2024-01-01',
      lastUpdated: '2024-01-01',
      tags: ['express', 'service']
    }
  };

  const mockPrompt: ICodeGenerationPrompt = {
    workItem: mockWorkItem,
    targetLanguage: ProgrammingLanguage.TYPESCRIPT,
    projectContext: mockProjectContext,
    codeTemplates: [mockCodeTemplate],
    codingStandards: mockCodingStandards,
    instructions: {
      requirements: ['Use async/await', 'Include error handling'],
      patterns: ['Repository pattern', 'Dependency injection'],
      preferredLibraries: ['express', 'bcrypt'],
      stylePreferences: ['Functional programming', 'Immutable data']
    }
  };

  describe('buildCodeGenerationPrompt', () => {
    it('should build comprehensive prompt with all sections', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('# AI Code Generation Assistant');
      expect(prompt).toContain('## Work Item Details');
      expect(prompt).toContain('## Project Context');
      expect(prompt).toContain('## Available Templates');
      expect(prompt).toContain('## Coding Standards');
      expect(prompt).toContain('## Generation Instructions');
      expect(prompt).toContain('## Required Output Format');
    });

    it('should include work item information', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('Create user authentication');
      expect(prompt).toContain('User Story');
      expect(prompt).toContain('authentication, security');
      expect(prompt).toContain('developer@example.com');
    });

    it('should include project context', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('TestProject');
      expect(prompt).toContain('Express.js');
      expect(prompt).toContain('src');
      expect(prompt).toContain('tests');
      expect(prompt).toContain('express');
      expect(prompt).toContain('bcrypt');
    });

    it('should include coding standards', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('camelCase');
      expect(prompt).toContain('PascalCase');
      expect(prompt).toContain('UPPER_SNAKE_CASE');
      expect(prompt).toContain('**Max Complexity**: 10');
      expect(prompt).toContain('**Min Test Coverage**: 80%');
    });

    it('should include template information', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('Express Service Template');
      expect(prompt).toContain('Template for creating Express.js services');
      expect(prompt).toContain('User Story, Task');
    });

    it('should include custom instructions', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('Use async/await');
      expect(prompt).toContain('Include error handling');
      expect(prompt).toContain('Repository pattern');
      expect(prompt).toContain('express');
      expect(prompt).toContain('bcrypt');
    });

    it('should include proper output format', () => {
      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt);

      expect(prompt).toContain('```json');
      expect(prompt).toContain('"files":');
      expect(prompt).toContain('"tests":');
      expect(prompt).toContain('"documentation":');
      expect(prompt).toContain('.ts');
    });

    it('should handle different work item types', () => {
      const bugWorkItem = {
        ...mockWorkItem,
        type: WorkItemType.BUG,
        reproductionSteps: 'Steps to reproduce the bug'
      };

      const bugPrompt = {
        ...mockPrompt,
        workItem: bugWorkItem
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(bugPrompt);

      expect(prompt).toContain('Bug Details');
      expect(prompt).toContain('Steps to reproduce the bug');
    });

    it('should handle task work items', () => {
      const taskWorkItem = {
        ...mockWorkItem,
        type: WorkItemType.TASK,
        title: 'Refactor authentication service'
      };

      const taskPrompt = {
        ...mockPrompt,
        workItem: taskWorkItem
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(taskPrompt);

      expect(prompt).toContain('Task Details');
      expect(prompt).toContain('Refactor authentication service');
    });

    it('should handle options for additional features', () => {
      const options: IPromptOptions = {
        includeSecurity: true,
        includePerformance: true,
        includePatterns: true,
        customInstructions: ['Use TypeScript strict mode', 'Add comprehensive logging']
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt, options);

      expect(prompt).toContain('Implement security best practices');
      expect(prompt).toContain('Optimize for performance');
      expect(prompt).toContain('Use appropriate design patterns');
      // Custom instructions should be included in the main instructions section
      expect(prompt).toContain('Use TypeScript strict mode');
      expect(prompt).toContain('Add comprehensive logging');
    });

    it('should truncate prompt if max length is specified', () => {
      const options: IPromptOptions = {
        maxLength: 500
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt, options);

      expect(prompt.length).toBeLessThanOrEqual(500);
      expect(prompt).toContain('[Note: Prompt truncated due to length limits');
    });

    it('should handle empty templates gracefully', () => {
      const promptWithoutTemplates = {
        ...mockPrompt,
        codeTemplates: []
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(promptWithoutTemplates);

      expect(prompt).toContain('No specific templates provided');
    });

    it('should handle missing optional fields', () => {
      const minimalWorkItem = {
        id: 456,
        type: WorkItemType.TASK,
        title: 'Simple task',
        priority: 2,
        state: 'Active',
        areaPath: 'Project\\Area',
        iterationPath: 'Project\\Sprint',
        tags: [],
        customFields: {}
      };

      const minimalPrompt = {
        ...mockPrompt,
        workItem: minimalWorkItem
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(minimalPrompt);

      expect(prompt).toContain('No description provided');
      expect(prompt).toContain('No acceptance criteria provided');
      expect(prompt).toContain('No tags');
      expect(prompt).toContain('Unassigned');
    });
  });

  describe('buildValidationPrompt', () => {
    const mockCode = `
export class AuthService {
  async login(email: string, password: string): Promise<boolean> {
    // Implementation here
    return true;
  }
}`;

    it('should build validation prompt with code', () => {
      const prompt = PromptBuilder.buildValidationPrompt(
        mockCode, 
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(prompt).toContain('# Code Validation Request');
      expect(prompt).toContain('typescript');
      expect(prompt).toContain('export class AuthService');
      expect(prompt).toContain('Syntax and Structure');
      expect(prompt).toContain('Security Issues');
      expect(prompt).toContain('Performance Considerations');
    });

    it('should include coding standards when provided', () => {
      const prompt = PromptBuilder.buildValidationPrompt(
        mockCode,
        ProgrammingLanguage.TYPESCRIPT,
        mockCodingStandards
      );

      expect(prompt).toContain('Coding Standards to Validate Against');
      expect(prompt).toContain('camelCase');
      expect(prompt).toContain('Maximum cyclomatic complexity: 10');
    });

    it('should include custom instructions', () => {
      const options: IPromptOptions = {
        customInstructions: ['Check for memory leaks', 'Validate async patterns']
      };

      const prompt = PromptBuilder.buildValidationPrompt(
        mockCode,
        ProgrammingLanguage.TYPESCRIPT,
        mockCodingStandards,
        options
      );

      expect(prompt).toContain('Check for memory leaks');
      expect(prompt).toContain('Validate async patterns');
    });

    it('should specify correct output format', () => {
      const prompt = PromptBuilder.buildValidationPrompt(
        mockCode,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(prompt).toContain('"isValid": boolean');
      expect(prompt).toContain('"syntaxErrors":');
      expect(prompt).toContain('"qualityScore": number (0-100)');
    });
  });

  describe('buildFixPrompt', () => {
    const mockCode = `
export class AuthService {
  login(email, password) {
    return true
  }
}`;

    const mockIssues = [
      {
        message: 'Missing semicolon',
        line: 4,
        severity: 'error',
        type: 'syntax'
      },
      {
        message: 'Missing type annotations',
        line: 3,
        severity: 'warning',
        type: 'style'
      }
    ];

    it('should build fix prompt with issues', () => {
      const prompt = PromptBuilder.buildFixPrompt(
        mockCode,
        mockIssues,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(prompt).toContain('# Code Fix Request');
      expect(prompt).toContain('typescript');
      expect(prompt).toContain('export class AuthService');
      expect(prompt).toContain('Missing semicolon');
      expect(prompt).toContain('Missing type annotations');
      expect(prompt).toContain('Line 4');
      expect(prompt).toContain('Line 3');
    });

    it('should include fix instructions', () => {
      const prompt = PromptBuilder.buildFixPrompt(
        mockCode,
        mockIssues,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(prompt).toContain('Maintaining the original functionality');
      expect(prompt).toContain('Following typescript best practices');
      expect(prompt).toContain('Only fixing issues that can be automatically resolved');
    });

    it('should specify output format', () => {
      const prompt = PromptBuilder.buildFixPrompt(
        mockCode,
        mockIssues,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(prompt).toContain('```typescript');
      expect(prompt).toContain('[FIXED_CODE_HERE]');
    });

    it('should handle custom instructions', () => {
      const options: IPromptOptions = {
        customInstructions: ['Preserve comments', 'Maintain code style']
      };

      const prompt = PromptBuilder.buildFixPrompt(
        mockCode,
        mockIssues,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(prompt).toContain('Preserve comments');
      expect(prompt).toContain('Maintain code style');
    });
  });

  describe('File Extension Mapping', () => {
    it('should return correct extensions for different languages', () => {
      const languages = [
        { lang: ProgrammingLanguage.TYPESCRIPT, ext: 'ts' },
        { lang: ProgrammingLanguage.JAVASCRIPT, ext: 'js' },
        { lang: ProgrammingLanguage.PYTHON, ext: 'py' },
        { lang: ProgrammingLanguage.JAVA, ext: 'java' },
        { lang: ProgrammingLanguage.CSHARP, ext: 'cs' }
      ];

      languages.forEach(({ lang, ext }) => {
        const prompt = PromptBuilder.buildCodeGenerationPrompt({
          ...mockPrompt,
          targetLanguage: lang
        });

        expect(prompt).toContain(`.${ext}`);
      });
    });
  });

  describe('Work Item Type Specific Information', () => {
    it('should include user story specific sections', () => {
      const userStoryPrompt = {
        ...mockPrompt,
        workItem: {
          ...mockWorkItem,
          type: WorkItemType.USER_STORY
        }
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(userStoryPrompt);

      expect(prompt).toContain('User Story Details');
      expect(prompt).toContain('As a');
      expect(prompt).toContain('I want');
      expect(prompt).toContain('So that');
    });

    it('should include bug specific sections', () => {
      const bugPrompt = {
        ...mockPrompt,
        workItem: {
          ...mockWorkItem,
          type: WorkItemType.BUG,
          reproductionSteps: 'Step 1: Login\nStep 2: Navigate to profile'
        }
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(bugPrompt);

      expect(prompt).toContain('Bug Details');
      expect(prompt).toContain('Reproduction Steps');
      expect(prompt).toContain('Step 1: Login');
    });

    it('should include task specific sections', () => {
      const taskPrompt = {
        ...mockPrompt,
        workItem: {
          ...mockWorkItem,
          type: WorkItemType.TASK
        }
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(taskPrompt);

      expect(prompt).toContain('Task Details');
      expect(prompt).toContain('Technical Requirements');
    });
  });

  describe('Prompt Truncation', () => {
    it('should not truncate short prompts', () => {
      const shortPrompt = {
        ...mockPrompt,
        workItem: {
          ...mockWorkItem,
          description: 'Short description'
        }
      };

      const options: IPromptOptions = {
        maxLength: 10000
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(shortPrompt, options);

      expect(prompt).not.toContain('[Note: Prompt truncated');
    });

    it('should truncate at section boundaries', () => {
      const options: IPromptOptions = {
        maxLength: 200
      };

      const prompt = PromptBuilder.buildCodeGenerationPrompt(mockPrompt, options);

      expect(prompt.length).toBeLessThanOrEqual(200);
      expect(prompt).toContain('[Note: Prompt truncated');
    });
  });
});