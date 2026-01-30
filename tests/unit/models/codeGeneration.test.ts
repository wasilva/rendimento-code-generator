/**
 * Unit tests for code generation models
 * Tests the interfaces and enums defined for AI-powered code generation
 */

import {
  ProgrammingLanguage,
  FileType,
  IProjectContext,
  ICodingStandards,
  ICodeTemplate,
  ICodeGenerationPrompt,
  IGeneratedCode,
  IValidationResult,
  ICodeIssue,
  IGeneratedFile
} from '../../../src/models/codeGeneration';
import { WorkItemType, IEnrichedWorkItem } from '../../../src/models/workItem';

describe('Code Generation Models', () => {
  describe('ProgrammingLanguage enum', () => {
    it('should contain all supported programming languages', () => {
      expect(ProgrammingLanguage.TYPESCRIPT).toBe('typescript');
      expect(ProgrammingLanguage.JAVASCRIPT).toBe('javascript');
      expect(ProgrammingLanguage.PYTHON).toBe('python');
      expect(ProgrammingLanguage.CSHARP).toBe('csharp');
      expect(ProgrammingLanguage.JAVA).toBe('java');
    });

    it('should have consistent string values', () => {
      const languages = Object.values(ProgrammingLanguage);
      expect(languages).toHaveLength(5);
      languages.forEach(lang => {
        expect(typeof lang).toBe('string');
        expect(lang.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FileType enum', () => {
    it('should contain all supported file types', () => {
      expect(FileType.SOURCE).toBe('source');
      expect(FileType.TEST).toBe('test');
      expect(FileType.CONFIG).toBe('config');
      expect(FileType.DOCUMENTATION).toBe('documentation');
    });
  });

  describe('IProjectContext interface', () => {
    it('should create valid project context', () => {
      const projectContext: IProjectContext = {
        projectName: 'test-project',
        primaryLanguage: ProgrammingLanguage.TYPESCRIPT,
        framework: 'Express.js',
        version: '4.18.0',
        structure: {
          sourceDir: 'src',
          testDir: 'tests',
          configDir: 'config',
          docsDir: 'docs'
        },
        dependencies: ['express', '@types/node'],
        devDependencies: ['jest', '@types/jest'],
        buildConfig: {
          buildCommand: 'npm run build',
          testCommand: 'npm test',
          startCommand: 'npm start'
        }
      };

      expect(projectContext.projectName).toBe('test-project');
      expect(projectContext.primaryLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(projectContext.structure.sourceDir).toBe('src');
      expect(projectContext.dependencies).toContain('express');
    });
  });

  describe('ICodingStandards interface', () => {
    it('should create valid coding standards', () => {
      const codingStandards: ICodingStandards = {
        lintingRules: 'eslint-config-standard',
        formattingConfig: 'prettier-config',
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
            pattern: '**/*.ts',
            requiredStructure: ['src/', 'tests/'],
            namingConvention: 'camelCase',
            mandatory: true,
            description: 'TypeScript files structure'
          }
        ],
        qualityThresholds: {
          maxComplexity: 10,
          maxFunctionLength: 50,
          maxFileLength: 500,
          minTestCoverage: 80
        }
      };

      expect(codingStandards.namingConventions.variables).toBe('camelCase');
      expect(codingStandards.qualityThresholds?.maxComplexity).toBe(10);
      expect(codingStandards.fileStructure).toHaveLength(1);
    });
  });

  describe('ICodeTemplate interface', () => {
    it('should create valid code template', () => {
      const codeTemplate: ICodeTemplate = {
        name: 'express-controller',
        description: 'Express.js controller template',
        workItemTypes: [WorkItemType.USER_STORY, WorkItemType.TASK],
        templateFiles: [
          {
            name: 'controller.ts',
            targetPath: 'src/controllers/{{name}}.ts',
            content: 'export class {{Name}}Controller {}',
            fileType: FileType.SOURCE,
            language: ProgrammingLanguage.TYPESCRIPT,
            variables: ['name', 'Name'],
            conditions: {
              workItemTypes: [WorkItemType.USER_STORY],
              requiredFields: ['title', 'description']
            }
          }
        ],
        variables: {
          name: 'defaultController',
          Name: 'DefaultController'
        },
        dependencies: ['express'],
        devDependencies: ['@types/express'],
        postGenerationScripts: ['npm install'],
        metadata: {
          version: '1.0.0',
          author: 'System',
          createdDate: '2024-01-01',
          lastUpdated: '2024-01-01',
          tags: ['express', 'controller']
        }
      };

      expect(codeTemplate.name).toBe('express-controller');
      expect(codeTemplate.workItemTypes).toContain(WorkItemType.USER_STORY);
      expect(codeTemplate.templateFiles).toHaveLength(1);
      expect(codeTemplate.templateFiles[0]?.language).toBe(ProgrammingLanguage.TYPESCRIPT);
    });
  });

  describe('ICodeGenerationPrompt interface', () => {
    it('should create valid code generation prompt', () => {
      const workItem: IEnrichedWorkItem = {
        id: 123,
        type: WorkItemType.USER_STORY,
        title: 'Create user authentication',
        description: 'Implement user login and registration',
        areaPath: 'Project\\Authentication',
        iterationPath: 'Project\\Sprint 1',
        state: 'Active',
        priority: 1,
        tags: ['authentication', 'security'],
        customFields: {}
      };

      const projectContext: IProjectContext = {
        projectName: 'auth-service',
        primaryLanguage: ProgrammingLanguage.TYPESCRIPT,
        structure: {
          sourceDir: 'src',
          testDir: 'tests'
        },
        dependencies: ['express'],
        devDependencies: ['jest']
      };

      const codingStandards: ICodingStandards = {
        lintingRules: 'eslint-standard',
        formattingConfig: 'prettier',
        namingConventions: {
          variables: 'camelCase',
          functions: 'camelCase',
          classes: 'PascalCase',
          constants: 'UPPER_SNAKE_CASE',
          files: 'camelCase',
          directories: 'kebab-case'
        },
        fileStructure: []
      };

      const prompt: ICodeGenerationPrompt = {
        workItem,
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        projectContext,
        codeTemplates: [],
        codingStandards,
        instructions: {
          requirements: ['Use JWT for authentication'],
          patterns: ['Repository pattern'],
          preferredLibraries: ['jsonwebtoken', 'bcrypt'],
          stylePreferences: ['Functional programming']
        },
        existingCodeContext: {
          relatedFiles: ['src/models/user.ts'],
          existingTypes: ['IUser', 'IAuthToken'],
          existingFunctions: ['hashPassword', 'validateEmail']
        }
      };

      expect(prompt.workItem.id).toBe(123);
      expect(prompt.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(prompt.instructions?.requirements).toContain('Use JWT for authentication');
      expect(prompt.existingCodeContext?.existingTypes).toContain('IUser');
    });
  });

  describe('IGeneratedCode interface', () => {
    it('should create valid generated code result', () => {
      const generatedFile: IGeneratedFile = {
        path: 'src/controllers/authController.ts',
        content: 'export class AuthController {}',
        language: ProgrammingLanguage.TYPESCRIPT,
        type: FileType.SOURCE,
        metadata: {
          size: 1024,
          lines: 50,
          complexity: 5,
          dependencies: ['express', 'jsonwebtoken']
        }
      };

      const testFile: IGeneratedFile = {
        path: 'tests/controllers/authController.test.ts',
        content: 'describe("AuthController", () => {})',
        language: ProgrammingLanguage.TYPESCRIPT,
        type: FileType.TEST,
        metadata: {
          size: 512,
          lines: 25
        }
      };

      const generatedCode: IGeneratedCode = {
        files: [generatedFile],
        tests: [testFile],
        documentation: '# Authentication Controller\n\nHandles user authentication.',
        dependencies: ['jsonwebtoken', 'bcrypt'],
        devDependencies: ['@types/jsonwebtoken'],
        buildInstructions: 'Run npm run build to compile TypeScript',
        installationInstructions: 'Run npm install to install dependencies',
        usageExamples: ['const auth = new AuthController()'],
        metadata: {
          totalFiles: 2,
          totalLines: 75,
          generationTime: 1500,
          aiModel: 'gemini-pro',
          templateUsed: 'express-controller',
          confidenceScore: 0.95
        }
      };

      expect(generatedCode.files).toHaveLength(1);
      expect(generatedCode.tests).toHaveLength(1);
      expect(generatedCode.files[0]?.path).toBe('src/controllers/authController.ts');
      expect(generatedCode.metadata.totalFiles).toBe(2);
      expect(generatedCode.metadata.confidenceScore).toBe(0.95);
    });
  });

  describe('IValidationResult interface', () => {
    it('should create valid validation result', () => {
      const syntaxError: ICodeIssue = {
        type: 'syntax',
        severity: 'error',
        message: 'Missing semicolon',
        file: 'src/controller.ts',
        line: 10,
        column: 25,
        rule: 'semi',
        suggestedFix: 'Add semicolon at end of line',
        canAutoFix: true
      };

      const styleWarning: ICodeIssue = {
        type: 'style',
        severity: 'warning',
        message: 'Function name should be camelCase',
        file: 'src/controller.ts',
        line: 15,
        column: 10,
        rule: 'camelcase',
        suggestedFix: 'Rename function to camelCase',
        canAutoFix: false
      };

      const validationResult: IValidationResult = {
        isValid: false,
        syntaxErrors: [syntaxError],
        lintingIssues: [styleWarning],
        styleViolations: [],
        securityIssues: [],
        performanceWarnings: [],
        qualityScore: 75,
        suggestions: ['Fix syntax errors', 'Follow naming conventions'],
        canAutoFix: true
      };

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.syntaxErrors).toHaveLength(1);
      expect(validationResult.lintingIssues).toHaveLength(1);
      expect(validationResult.qualityScore).toBe(75);
      expect(validationResult.canAutoFix).toBe(true);
      expect(validationResult.syntaxErrors[0]?.type).toBe('syntax');
      expect(validationResult.lintingIssues[0]?.severity).toBe('warning');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty arrays and optional fields', () => {
      const minimalProjectContext: IProjectContext = {
        projectName: 'minimal-project',
        primaryLanguage: ProgrammingLanguage.JAVASCRIPT,
        structure: {
          sourceDir: 'src',
          testDir: 'test'
        },
        dependencies: [],
        devDependencies: []
      };

      expect(minimalProjectContext.dependencies).toHaveLength(0);
      expect(minimalProjectContext.framework).toBeUndefined();
      expect(minimalProjectContext.buildConfig).toBeUndefined();
    });

    it('should handle all programming languages consistently', () => {
      const languages = [
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.JAVASCRIPT,
        ProgrammingLanguage.PYTHON,
        ProgrammingLanguage.CSHARP,
        ProgrammingLanguage.JAVA
      ];

      languages.forEach(lang => {
        const file: IGeneratedFile = {
          path: `src/test.${lang === ProgrammingLanguage.CSHARP ? 'cs' : lang}`,
          content: 'test content',
          language: lang,
          type: FileType.SOURCE
        };

        expect(file.language).toBe(lang);
        expect(typeof file.language).toBe('string');
      });
    });

    it('should handle all file types consistently', () => {
      const fileTypes = [
        FileType.SOURCE,
        FileType.TEST,
        FileType.CONFIG,
        FileType.DOCUMENTATION
      ];

      fileTypes.forEach(type => {
        const file: IGeneratedFile = {
          path: `test.${type}`,
          content: 'content',
          language: ProgrammingLanguage.TYPESCRIPT,
          type: type
        };

        expect(file.type).toBe(type);
        expect(typeof file.type).toBe('string');
      });
    });
  });
});