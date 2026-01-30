/**
 * Unit tests for GeminiService
 * Tests authentication, code generation, validation, and error handling
 */

import { GeminiService, GeminiApiError, IGeminiConfig } from '../../../../src/services/gemini/GeminiService';
import { 
  ICodeGenerationPrompt,
  ICodeIssue,
  ProgrammingLanguage
} from '../../../../src/models/codeGeneration';
import { WorkItemType } from '../../../../src/models/workItem';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn()
    })
  }))
}));

describe('GeminiService', () => {
  let geminiService: GeminiService;
  let mockModel: any;

  const mockConfig: IGeminiConfig = {
    apiKey: 'test-api-key',
    model: 'gemini-pro',
    timeout: 5000,
    maxRetries: 2,
    baseDelay: 100
  };

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

  const mockProjectContext = {
    projectName: 'TestProject',
    primaryLanguage: ProgrammingLanguage.TYPESCRIPT,
    framework: 'Express.js',
    structure: {
      sourceDir: 'src',
      testDir: 'tests'
    },
    dependencies: ['express', 'bcrypt'],
    devDependencies: ['jest', '@types/node'],
    buildConfig: {
      buildCommand: 'npm run build',
      testCommand: 'npm test',
      startCommand: 'npm start'
    }
  };

  const mockCodingStandards = {
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
    fileStructure: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks properly
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    
    // Create mock model first
    mockModel = {
      generateContent: jest.fn()
    };
    
    // Mock the GoogleGenerativeAI constructor and getGenerativeModel method
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue(mockModel)
    }));
    
    geminiService = new GeminiService(mockConfig);
  });

  describe('Constructor', () => {
    it('should create GeminiService with valid config', () => {
      expect(geminiService).toBeInstanceOf(GeminiService);
    });

    it('should throw error when API key is missing', () => {
      expect(() => {
        new GeminiService({ ...mockConfig, apiKey: '' });
      }).toThrow('Google API key is required for Gemini service');
    });

    it('should use default values for optional config', () => {
      const minimalConfig = { apiKey: 'test-key' };
      const service = new GeminiService(minimalConfig);
      expect(service).toBeInstanceOf(GeminiService);
    });
  });

  describe('generateCode', () => {
    const mockPrompt: ICodeGenerationPrompt = {
      workItem: mockWorkItem,
      targetLanguage: ProgrammingLanguage.TYPESCRIPT,
      projectContext: mockProjectContext,
      codeTemplates: [],
      codingStandards: mockCodingStandards
    };

    it('should generate code successfully', async () => {
      const jsonResponse = `{
  "files": [
    {
      "path": "src/auth/authService.ts",
      "content": "export class AuthService { login() {} }",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [
    {
      "path": "tests/auth/authService.test.ts",
      "content": "describe('AuthService', () => { it('should login', () => {}) })",
      "language": "typescript",
      "type": "test"
    }
  ],
  "documentation": "Authentication service implementation",
  "dependencies": ["bcrypt"],
  "buildInstructions": "Run npm install and npm run build"
}`;

      const mockResponse = {
        response: {
          text: () => '```json\n' + jsonResponse + '\n```'
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.generateCode(mockPrompt);

      expect(result).toBeDefined();
      expect(result.files).toHaveLength(1);
      expect(result.tests).toHaveLength(1);
      expect(result.files[0]?.path).toBe('src/auth/authService.ts');
      expect(result.files[0]?.language).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(result.documentation).toBe('Authentication service implementation');
      expect(result.dependencies).toContain('bcrypt');
    });

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API rate limit exceeded');
      mockModel.generateContent.mockRejectedValue(apiError);

      await expect(geminiService.generateCode(mockPrompt)).rejects.toThrow(GeminiApiError);
    });

    it('should retry on failure', async () => {
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          response: {
            text: () => `\`\`\`json
{
  "files": [],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\``
          }
        });

      const result = await geminiService.generateCode(mockPrompt);
      
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should handle invalid JSON response', async () => {
      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      await expect(geminiService.generateCode(mockPrompt)).rejects.toThrow(GeminiApiError);
    });

    it('should handle timeout', async () => {
      const timeoutService = new GeminiService({ ...mockConfig, timeout: 100 });
      
      mockModel.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 200))
      );

      await expect(timeoutService.generateCode(mockPrompt)).rejects.toThrow(GeminiApiError);
    });
  });

  describe('validateGeneratedCode', () => {
    const mockCode = `
export class AuthService {
  login(email: string, password: string) {
    // Implementation here
  }
}`;

    it('should validate code successfully', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "isValid": true,
  "syntaxErrors": [],
  "lintingIssues": [
    {
      "type": "style",
      "severity": "warning",
      "message": "Missing JSDoc comment",
      "file": "inline",
      "line": 2,
      "canAutoFix": false
    }
  ],
  "styleViolations": [],
  "securityIssues": [],
  "performanceWarnings": [],
  "qualityScore": 85,
  "suggestions": ["Add JSDoc comments", "Add input validation"],
  "canAutoFix": false
}
\`\`\``
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.validateGeneratedCode(mockCode, 'typescript');

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.qualityScore).toBe(85);
      expect(result.lintingIssues).toHaveLength(1);
      expect(result.suggestions).toContain('Add JSDoc comments');
    });

    it('should handle validation errors', async () => {
      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "isValid": false,
  "syntaxErrors": [
    {
      "type": "syntax",
      "severity": "error",
      "message": "Missing semicolon",
      "file": "inline",
      "line": 3,
      "column": 25,
      "canAutoFix": true
    }
  ],
  "lintingIssues": [],
  "styleViolations": [],
  "securityIssues": [],
  "performanceWarnings": [],
  "qualityScore": 45,
  "suggestions": ["Fix syntax errors"],
  "canAutoFix": true
}
\`\`\``
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const result = await geminiService.validateGeneratedCode(mockCode, 'typescript');

      expect(result.isValid).toBe(false);
      expect(result.syntaxErrors).toHaveLength(1);
      expect(result.syntaxErrors[0]?.message).toBe('Missing semicolon');
      expect(result.canAutoFix).toBe(true);
    });

    it('should handle API errors during validation', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Validation service unavailable'));

      await expect(geminiService.validateGeneratedCode(mockCode, 'typescript')).rejects.toThrow(GeminiApiError);
    });
  });

  describe('fixCodeIssues', () => {
    const mockCode = `
export class AuthService {
  login(email, password) {
    return true
  }
}`;

    const mockIssues: ICodeIssue[] = [
      {
        type: 'syntax',
        severity: 'error',
        message: 'Missing semicolon',
        file: 'inline',
        line: 4,
        canAutoFix: true
      },
      {
        type: 'style',
        severity: 'warning',
        message: 'Missing type annotations',
        file: 'inline',
        line: 3,
        canAutoFix: true
      }
    ];

    it('should fix code issues successfully', async () => {
      const fixedCode = `
export class AuthService {
  login(email: string, password: string): boolean {
    return true;
  }
}`;

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => `\`\`\`typescript
${fixedCode}
\`\`\``
        }
      });

      const result = await geminiService.fixCodeIssues(mockCode, mockIssues);

      expect(result).toBe(fixedCode);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should handle fix failures', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('Fix service unavailable'));

      await expect(geminiService.fixCodeIssues(mockCode, mockIssues)).rejects.toThrow(GeminiApiError);
    });

    it('should extract code from plain text response', async () => {
      const fixedCode = 'export class AuthService { login() { return true; } }';

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => fixedCode
        }
      });

      const result = await geminiService.fixCodeIssues(mockCode, mockIssues);

      expect(result).toBe(fixedCode);
    });
  });

  describe('Error Handling', () => {
    it('should create GeminiApiError with correct properties', () => {
      const originalError = new Error('Original error');
      const geminiError = new GeminiApiError('Test error', originalError);

      expect(geminiError.code).toBe('GEMINI_API_ERROR');
      expect(geminiError.statusCode).toBe(502);
      expect(geminiError.retryable).toBe(true);
      expect(geminiError.originalError).toBe(originalError);
    });

    it('should handle network timeouts', async () => {
      const timeoutService = new GeminiService({ ...mockConfig, timeout: 50 });
      
      mockModel.generateContent.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const mockPrompt: ICodeGenerationPrompt = {
        workItem: mockWorkItem,
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        projectContext: mockProjectContext,
        codeTemplates: [],
        codingStandards: mockCodingStandards
      };

      await expect(timeoutService.generateCode(mockPrompt)).rejects.toThrow('Request timeout');
    });

    it('should exhaust retries and throw final error', async () => {
      const error = new Error('Persistent error');
      mockModel.generateContent.mockRejectedValue(error);

      const mockPrompt: ICodeGenerationPrompt = {
        workItem: mockWorkItem,
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        projectContext: mockProjectContext,
        codeTemplates: [],
        codingStandards: mockCodingStandards
      };

      await expect(geminiService.generateCode(mockPrompt)).rejects.toThrow(GeminiApiError);
      expect(mockModel.generateContent).toHaveBeenCalledTimes(2); // maxRetries = 2
    });
  });

  describe('Dependency Extraction', () => {
    it('should extract TypeScript dependencies correctly', async () => {
      const codeWithImports = `
import express from 'express';
import { Router } from 'express';
import bcrypt from 'bcrypt';
import './localFile';
`;

      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "files": [
    {
      "path": "src/test.ts",
      "content": "${codeWithImports.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\``
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const mockPrompt: ICodeGenerationPrompt = {
        workItem: mockWorkItem,
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        projectContext: mockProjectContext,
        codeTemplates: [],
        codingStandards: mockCodingStandards
      };

      const result = await geminiService.generateCode(mockPrompt);

      expect(result.files[0]?.metadata?.dependencies).toContain('express');
      expect(result.files[0]?.metadata?.dependencies).toContain('bcrypt');
      expect(result.files[0]?.metadata?.dependencies).not.toContain('./localFile');
    });
  });

  describe('Metadata Generation', () => {
    it('should generate correct file metadata', async () => {
      const fileContent = `export class TestClass {
  method1() {}
  method2() {}
}`;

      const mockResponse = {
        response: {
          text: () => `\`\`\`json
{
  "files": [
    {
      "path": "src/test.ts",
      "content": "${fileContent.replace(/\n/g, '\\n')}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\``
        }
      };

      mockModel.generateContent.mockResolvedValue(mockResponse);

      const mockPrompt: ICodeGenerationPrompt = {
        workItem: mockWorkItem,
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        projectContext: mockProjectContext,
        codeTemplates: [],
        codingStandards: mockCodingStandards
      };

      const result = await geminiService.generateCode(mockPrompt);

      expect(result.files[0]?.metadata?.size).toBeGreaterThan(0);
      expect(result.files[0]?.metadata?.lines).toBe(4);
      expect(result.metadata.totalFiles).toBe(1);
      expect(result.metadata.totalLines).toBe(4);
    });
  });
});