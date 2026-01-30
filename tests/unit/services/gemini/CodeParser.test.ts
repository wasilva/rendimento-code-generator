/**
 * Unit tests for CodeParser
 * Tests parsing and validation of AI-generated responses
 */

import { CodeParser, IParseOptions } from '../../../../src/services/gemini/CodeParser';
import { 
  IGeneratedCode, 
  IValidationResult,
  ProgrammingLanguage,
  FileType 
} from '../../../../src/models/codeGeneration';

describe('CodeParser', () => {
  describe('parseGeneratedCodeResponse', () => {
    const validJsonResponse = `
Here's the generated code:

\`\`\`json
{
  "files": [
    {
      "path": "src/auth/authService.ts",
      "content": "export class AuthService {\\n  async login(email: string, password: string): Promise<boolean> {\\n    return true;\\n  }\\n}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [
    {
      "path": "tests/auth/authService.test.ts",
      "content": "describe('AuthService', () => {\\n  it('should login successfully', () => {\\n    expect(true).toBe(true);\\n  });\\n});",
      "language": "typescript",
      "type": "test"
    }
  ],
  "documentation": "Authentication service implementation with login functionality",
  "dependencies": ["bcrypt", "jsonwebtoken"],
  "devDependencies": ["@types/bcrypt"],
  "buildInstructions": "Run npm install && npm run build",
  "installationInstructions": "Install dependencies with npm install",
  "usageExamples": ["const auth = new AuthService(); await auth.login('user@example.com', 'password');"]
}
\`\`\`

The implementation is complete.
`;

    it('should parse valid JSON response successfully', () => {
      const result = CodeParser.parseGeneratedCodeResponse(
        validJsonResponse,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.content).toBeDefined();

      const generatedCode = result.content as IGeneratedCode;
      expect(generatedCode.files).toHaveLength(1);
      expect(generatedCode.tests).toHaveLength(1);
      expect(generatedCode.files[0]?.path).toBe('src/auth/authService.ts');
      expect(generatedCode.files[0]?.language).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(generatedCode.files[0]?.type).toBe(FileType.SOURCE);
      expect(generatedCode.documentation).toContain('Authentication service');
      expect(generatedCode.dependencies).toContain('bcrypt');
      expect(generatedCode.devDependencies).toContain('@types/bcrypt');
    });

    it('should handle response without JSON', () => {
      const invalidResponse = 'This is just plain text without JSON';

      const result = CodeParser.parseGeneratedCodeResponse(
        invalidResponse,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No valid JSON found in AI response');
      expect(result.content).toBeNull();
    });

    it('should handle malformed JSON', () => {
      const malformedResponse = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "invalid json
    }
  ]
}
\`\`\`
`;

      const result = CodeParser.parseGeneratedCodeResponse(
        malformedResponse,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid JSON format');
    });

    it('should validate required fields', () => {
      const incompleteResponse = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts"
    }
  ]
}
\`\`\`
`;

      const result = CodeParser.parseGeneratedCodeResponse(
        incompleteResponse,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('content is required'))).toBe(true);
    });

    it('should generate metadata when extractMetadata option is true', () => {
      const options: IParseOptions = {
        extractMetadata: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        validJsonResponse,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      const generatedCode = result.content as IGeneratedCode;
      expect(generatedCode.files[0]?.metadata).toBeDefined();
      expect(generatedCode.files[0]?.metadata?.size).toBeGreaterThan(0);
      expect(generatedCode.files[0]?.metadata?.lines).toBeGreaterThan(0);
    });

    it('should validate file paths when validatePaths option is true', () => {
      const responseWithBadPaths = `
\`\`\`json
{
  "files": [
    {
      "path": "/absolute/path/test.ts",
      "content": "export class Test {}",
      "language": "typescript",
      "type": "source"
    },
    {
      "path": "../parent/test.ts",
      "content": "export class Test2 {}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        validatePaths: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        responseWithBadPaths,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('should be relative'))).toBe(true);
      expect(result.warnings.some(warning => warning.includes('parent directory references'))).toBe(true);
    });

    it('should perform basic syntax validation when validateSyntax option is true', () => {
      const responseWithSyntaxIssues = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "export class Test { method() { if (true { return false; } }",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        validateSyntax: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        responseWithSyntaxIssues,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('bracket mismatch'))).toBe(true);
    });

    it('should extract dependencies from TypeScript code', () => {
      const responseWithImports = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "import express from 'express';\\nimport { Router } from 'express';\\nimport bcrypt from 'bcrypt';\\nimport './localFile';\\nexport class Test {}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        extractMetadata: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        responseWithImports,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      const generatedCode = result.content as IGeneratedCode;
      const dependencies = generatedCode.files[0]?.metadata?.dependencies || [];
      expect(dependencies).toContain('express');
      expect(dependencies).toContain('bcrypt');
      expect(dependencies).not.toContain('./localFile');
    });

    it('should handle code blocks without json marker', () => {
      const responseWithPlainCodeBlock = `
\`\`\`
{
  "files": [
    {
      "path": "test.ts",
      "content": "export class Test {}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const result = CodeParser.parseGeneratedCodeResponse(
        responseWithPlainCodeBlock,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
    });
  });

  describe('parseValidationResponse', () => {
    const validValidationResponse = `
\`\`\`json
{
  "isValid": false,
  "syntaxErrors": [
    {
      "type": "syntax",
      "severity": "error",
      "message": "Missing semicolon",
      "file": "test.ts",
      "line": 5,
      "column": 20,
      "rule": "semi",
      "suggestedFix": "Add semicolon at end of statement",
      "canAutoFix": true
    }
  ],
  "lintingIssues": [
    {
      "type": "style",
      "severity": "warning",
      "message": "Prefer const over let",
      "file": "test.ts",
      "line": 3,
      "canAutoFix": true
    }
  ],
  "styleViolations": [],
  "securityIssues": [
    {
      "type": "security",
      "severity": "error",
      "message": "Potential SQL injection vulnerability",
      "file": "test.ts",
      "line": 10,
      "canAutoFix": false
    }
  ],
  "performanceWarnings": [],
  "qualityScore": 65,
  "suggestions": ["Add input validation", "Use parameterized queries"],
  "canAutoFix": true
}
\`\`\`
`;

    it('should parse validation response successfully', () => {
      const result = CodeParser.parseValidationResponse(validValidationResponse);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.content).toBeDefined();

      const validationResult = result.content as IValidationResult;
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.syntaxErrors).toHaveLength(1);
      expect(validationResult.lintingIssues).toHaveLength(1);
      expect(validationResult.securityIssues).toHaveLength(1);
      expect(validationResult.qualityScore).toBe(65);
      expect(validationResult.suggestions).toContain('Add input validation');
      expect(validationResult.canAutoFix).toBe(true);
    });

    it('should handle validation response without JSON', () => {
      const invalidResponse = 'No JSON here';

      const result = CodeParser.parseValidationResponse(invalidResponse);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('No valid JSON found in validation response');
    });

    it('should validate validation result structure', () => {
      const invalidStructureResponse = `
\`\`\`json
{
  "isValid": "not a boolean",
  "syntaxErrors": "not an array",
  "qualityScore": 150
}
\`\`\`
`;

      const result = CodeParser.parseValidationResponse(invalidStructureResponse);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('isValid must be a boolean');
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalResponse = `
\`\`\`json
{
  "isValid": true,
  "qualityScore": 85
}
\`\`\`
`;

      const result = CodeParser.parseValidationResponse(minimalResponse);

      expect(result.success).toBe(true);
      const validationResult = result.content as IValidationResult;
      expect(validationResult.syntaxErrors).toHaveLength(0);
      expect(validationResult.lintingIssues).toHaveLength(0);
      expect(validationResult.suggestions).toHaveLength(0);
    });

    it('should normalize quality score to valid range', () => {
      const responseWithInvalidScore = `
\`\`\`json
{
  "isValid": true,
  "qualityScore": 150
}
\`\`\`
`;

      const result = CodeParser.parseValidationResponse(responseWithInvalidScore);

      expect(result.success).toBe(true);
      const validationResult = result.content as IValidationResult;
      expect(validationResult.qualityScore).toBe(100); // Clamped to max
    });
  });

  describe('parseFixedCodeResponse', () => {
    const originalCode = `
export class Test {
  method() {
    let x = 5
    return x
  }
}`;

    it('should extract code from markdown blocks', () => {
      const fixedResponse = `
Here's the fixed code:

\`\`\`typescript
export class Test {
  method(): number {
    const x = 5;
    return x;
  }
}
\`\`\`

The issues have been resolved.
`;

      const result = CodeParser.parseFixedCodeResponse(fixedResponse, originalCode);

      expect(result.success).toBe(true);
      expect(result.content).toContain('const x = 5;');
      expect(result.content).toContain('method(): number');
    });

    it('should handle plain text response', () => {
      const plainTextResponse = `export class Test {
  method(): number {
    const x = 5;
    return x;
  }
}`;

      const result = CodeParser.parseFixedCodeResponse(plainTextResponse, originalCode);

      expect(result.success).toBe(true);
      expect(result.content).toBe(plainTextResponse);
    });

    it('should handle empty response', () => {
      const emptyResponse = '';

      const result = CodeParser.parseFixedCodeResponse(emptyResponse, originalCode);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Fixed code is empty');
      expect(result.content).toBe(originalCode); // Returns original code
    });

    it('should warn about significant changes', () => {
      const completelyDifferentCode = `
export class CompletelyDifferent {
  differentMethod() {
    return 'totally different';
  }
}`;

      const result = CodeParser.parseFixedCodeResponse(completelyDifferentCode, originalCode);

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('significantly different from original')
      )).toBe(true);
    });

    it('should handle code blocks without language specification', () => {
      const responseWithGenericBlock = `
\`\`\`
export class Test {
  method(): number {
    const x = 5;
    return x;
  }
}
\`\`\`
`;

      const result = CodeParser.parseFixedCodeResponse(responseWithGenericBlock, originalCode);

      expect(result.success).toBe(true);
      expect(result.content).toContain('const x = 5;');
    });
  });

  describe('Bracket Validation', () => {
    it('should validate correct bracket matching', () => {
      const validCode = `
function test() {
  const obj = { key: 'value' };
  const arr = [1, 2, 3];
  if (true) {
    return obj;
  }
}`;

      const response = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "${validCode.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        validateSyntax: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        response,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('bracket mismatch'))).toBe(false);
    });

    it('should detect bracket mismatches', () => {
      const invalidCode = `
function test() {
  const obj = { key: 'value' ;
  if (true) {
    return obj;
  }
`;

      const response = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "${invalidCode.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        validateSyntax: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        response,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('bracket mismatch'))).toBe(true);
    });
  });

  describe('Python Indentation Validation', () => {
    it('should validate correct Python indentation', () => {
      const validPythonCode = `
def test_function():
    if True:
        return "valid"
    else:
        return "also valid"
`;

      const response = `
\`\`\`json
{
  "files": [
    {
      "path": "test.py",
      "content": "${validPythonCode.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
      "language": "python",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        validateSyntax: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        response,
        ProgrammingLanguage.PYTHON,
        options
      );

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('indentation issues'))).toBe(false);
    });
  });

  describe('Complexity Estimation', () => {
    it('should estimate code complexity', () => {
      const complexCode = `
function complexFunction() {
  if (condition1) {
    for (let i = 0; i < 10; i++) {
      if (condition2) {
        while (condition3) {
          try {
            // do something
          } catch (error) {
            // handle error
          }
        }
      }
    }
  } else {
    switch (value) {
      case 1:
        break;
      case 2:
        break;
    }
  }
}`;

      const response = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "${complexCode.replace(/\n/g, '\\n').replace(/"/g, '\\"')}",
      "language": "typescript",
      "type": "source"
    }
  ],
  "tests": [],
  "documentation": "",
  "dependencies": [],
  "buildInstructions": ""
}
\`\`\`
`;

      const options: IParseOptions = {
        extractMetadata: true
      };

      const result = CodeParser.parseGeneratedCodeResponse(
        response,
        ProgrammingLanguage.TYPESCRIPT,
        options
      );

      expect(result.success).toBe(true);
      const generatedCode = result.content as IGeneratedCode;
      expect(generatedCode.files[0]?.metadata?.complexity).toBeGreaterThan(1);
    });
  });

  describe('Code Similarity Calculation', () => {
    it('should calculate high similarity for similar code', () => {
      const originalCode = 'function test() { return true; }';
      const similarCode = 'function test() { return true; }';

      const result = CodeParser.parseFixedCodeResponse(similarCode, originalCode);

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('significantly different')
      )).toBe(false);
    });

    it('should calculate low similarity for different code', () => {
      const originalCode = 'function test() { return true; }';
      const differentCode = 'class MyClass { method() { console.log("hello"); } }';

      const result = CodeParser.parseFixedCodeResponse(differentCode, originalCode);

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => 
        warning.includes('significantly different')
      )).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors gracefully', () => {
      // This should trigger an error in JSON parsing
      const malformedResponse = `
\`\`\`json
{
  "files": [
    {
      "path": "test.ts",
      "content": "export class Test {}"
      // Missing comma and closing brace
\`\`\`
`;

      const result = CodeParser.parseGeneratedCodeResponse(
        malformedResponse,
        ProgrammingLanguage.TYPESCRIPT
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.content).toBeNull();
    });
  });
});