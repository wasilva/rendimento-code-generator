/**
 * GeminiService - Google Gemini AI integration for code generation
 * Implements authentication, code generation, and validation using Google's Gemini API
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';
import { 
  ICodeGenerationPrompt, 
  IGeneratedCode, 
  IValidationResult, 
  ICodeIssue,
  ProgrammingLanguage,
  FileType,
  IGeneratedFile
} from '../../models/codeGeneration';
// IEnrichedWorkItem is used in ICodeGenerationPrompt interface

/**
 * Interface for Gemini service configuration
 */
export interface IGeminiConfig {
  /** Google API key for Gemini */
  apiKey: string;
  
  /** Model name to use (default: gemini-pro) */
  model?: string;
  
  /** Generation configuration */
  generationConfig?: GenerationConfig;
  
  /** Request timeout in milliseconds */
  timeout?: number;
  
  /** Maximum retry attempts */
  maxRetries?: number;
  
  /** Base delay for exponential backoff (ms) */
  baseDelay?: number;
}

/**
 * Interface for the Gemini service
 */
export interface IGeminiService {
  generateCode(prompt: ICodeGenerationPrompt): Promise<IGeneratedCode>;
  validateGeneratedCode(code: string, language: string): Promise<IValidationResult>;
  fixCodeIssues(code: string, issues: ICodeIssue[]): Promise<string>;
}

/**
 * Custom error class for Gemini API errors
 */
export class GeminiApiError extends Error {
  readonly code = 'GEMINI_API_ERROR';
  readonly statusCode = 502;
  readonly retryable = true;

  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'GeminiApiError';
  }
}

/**
 * GeminiService implementation
 * Handles all interactions with Google's Gemini AI API for code generation
 */
export class GeminiService implements IGeminiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<IGeminiConfig>;

  constructor(config: IGeminiConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-pro',
      generationConfig: config.generationConfig || {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
    };

    if (!this.config.apiKey) {
      throw new Error('Google API key is required for Gemini service');
    }

    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: this.config.model,
      generationConfig: this.config.generationConfig
    });
  }

  /**
   * Generate code based on work item requirements using Gemini AI
   */
  async generateCode(prompt: ICodeGenerationPrompt): Promise<IGeneratedCode> {
    try {
      const structuredPrompt = this.buildCodeGenerationPrompt(prompt);
      const response = await this.executeWithRetry(() => 
        this.model.generateContent(structuredPrompt)
      );

      let generatedText = '';
      if (response && response.response && typeof response.response.text === 'function') {
        generatedText = response.response.text();
        
        if (!generatedText || generatedText.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }
      } else {
        throw new Error('Invalid response structure from Gemini API');
      }

      return this.parseGeneratedCode(generatedText, prompt);
    } catch (error) {
      throw new GeminiApiError(
        `Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate generated code for syntax, style, and quality issues
   */
  async validateGeneratedCode(code: string, language: string): Promise<IValidationResult> {
    try {
      const validationPrompt = this.buildValidationPrompt(code, language);
      const response = await this.executeWithRetry(() =>
        this.model.generateContent(validationPrompt)
      );

      let validationText = '';
      if (response && response.response && typeof response.response.text === 'function') {
        validationText = response.response.text();
        
        if (!validationText || validationText.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }
      } else {
        throw new Error('Invalid response structure from Gemini API');
      }

      return this.parseValidationResult(validationText);
    } catch (error) {
      throw new GeminiApiError(
        `Failed to validate code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Fix code issues automatically using AI suggestions
   */
  async fixCodeIssues(code: string, issues: ICodeIssue[]): Promise<string> {
    try {
      const fixPrompt = this.buildFixPrompt(code, issues);
      const response = await this.executeWithRetry(() =>
        this.model.generateContent(fixPrompt)
      );

      let fixedCode = '';
      if (response && response.response && typeof response.response.text === 'function') {
        fixedCode = response.response.text();
        
        if (!fixedCode || fixedCode.trim().length === 0) {
          throw new Error('Empty response from Gemini API');
        }
      } else {
        throw new Error('Invalid response structure from Gemini API');
      }

      return this.extractFixedCode(fixedCode);
    } catch (error) {
      throw new GeminiApiError(
        `Failed to fix code issues: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Build structured prompt for code generation
   */
  private buildCodeGenerationPrompt(prompt: ICodeGenerationPrompt): string {
    const { workItem, targetLanguage, projectContext, codingStandards } = prompt;

    return `
# Code Generation Request

## Work Item Details
- **Type**: ${workItem.type}
- **Title**: ${workItem.title}
- **Description**: ${workItem.description || 'No description provided'}
- **Acceptance Criteria**: ${workItem.acceptanceCriteria || 'No acceptance criteria provided'}
- **Priority**: ${workItem.priority}
- **Area Path**: ${workItem.areaPath}

## Project Context
- **Project Name**: ${projectContext.projectName}
- **Target Language**: ${targetLanguage}
- **Framework**: ${projectContext.framework || 'Not specified'}
- **Source Directory**: ${projectContext.structure.sourceDir}
- **Test Directory**: ${projectContext.structure.testDir}

## Coding Standards
- **Naming Conventions**: 
  - Variables: ${codingStandards.namingConventions.variables}
  - Functions: ${codingStandards.namingConventions.functions}
  - Classes: ${codingStandards.namingConventions.classes}
  - Files: ${codingStandards.namingConventions.files}

## Dependencies Available
${projectContext.dependencies.join(', ')}

## Instructions
Generate complete, production-ready code that:
1. Implements the work item requirements
2. Follows the specified coding standards
3. Includes appropriate error handling
4. Includes comprehensive tests
5. Includes JSDoc/documentation comments
6. Uses the project's existing dependencies where appropriate

## Output Format
Please provide the response in the following JSON format:
\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "file content here",
      "language": "${targetLanguage}",
      "type": "source"
    }
  ],
  "tests": [
    {
      "path": "relative/path/to/test.spec.ts",
      "content": "test content here",
      "language": "${targetLanguage}",
      "type": "test"
    }
  ],
  "documentation": "Generated documentation in markdown format",
  "dependencies": ["new-dependency-1", "new-dependency-2"],
  "buildInstructions": "Instructions for building/running the code"
}
\`\`\`

Generate the code now:
`;
  }

  /**
   * Build prompt for code validation
   */
  private buildValidationPrompt(code: string, language: string): string {
    return `
# Code Validation Request

## Language
${language}

## Code to Validate
\`\`\`${language}
${code}
\`\`\`

## Instructions
Please analyze the provided code and check for:
1. Syntax errors
2. Style violations
3. Security issues
4. Performance problems
5. Logic errors
6. Naming convention issues

## Output Format
Please provide the response in the following JSON format:
\`\`\`json
{
  "isValid": true/false,
  "syntaxErrors": [
    {
      "type": "syntax",
      "severity": "error",
      "message": "Error description",
      "file": "filename",
      "line": 10,
      "column": 5,
      "canAutoFix": true/false
    }
  ],
  "lintingIssues": [],
  "styleViolations": [],
  "securityIssues": [],
  "performanceWarnings": [],
  "qualityScore": 85,
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "canAutoFix": true/false
}
\`\`\`

Validate the code now:
`;
  }

  /**
   * Build prompt for fixing code issues
   */
  private buildFixPrompt(code: string, issues: ICodeIssue[]): string {
    const issueDescriptions = issues.map(issue => 
      `- Line ${issue.line}: ${issue.message} (${issue.severity})`
    ).join('\n');

    return `
# Code Fix Request

## Original Code
\`\`\`
${code}
\`\`\`

## Issues to Fix
${issueDescriptions}

## Instructions
Please fix the identified issues in the code while maintaining the original functionality.
Only fix issues that can be automatically resolved without changing the core logic.

## Output Format
Please provide only the fixed code without any additional formatting or explanation:

\`\`\`
[FIXED_CODE_HERE]
\`\`\`

Fix the code now:
`;
  }

  /**
   * Parse generated code response from AI
   */
  private parseGeneratedCode(generatedText: string, prompt: ICodeGenerationPrompt): IGeneratedCode {
    try {
      // Debug log
      console.log('Generated text:', JSON.stringify(generatedText));
      
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsedResponse = JSON.parse(jsonMatch[1]!);
      
      // Validate and transform the response
      const files: IGeneratedFile[] = (parsedResponse.files || []).map((file: any) => ({
        path: file.path,
        content: file.content,
        language: file.language as ProgrammingLanguage,
        type: file.type as FileType,
        metadata: {
          size: Buffer.byteLength(file.content, 'utf8'),
          lines: file.content.split('\n').length,
          dependencies: this.extractDependencies(file.content, file.language)
        }
      }));

      const tests: IGeneratedFile[] = (parsedResponse.tests || []).map((test: any) => ({
        path: test.path,
        content: test.content,
        language: test.language as ProgrammingLanguage,
        type: FileType.TEST,
        metadata: {
          size: Buffer.byteLength(test.content, 'utf8'),
          lines: test.content.split('\n').length,
          dependencies: this.extractDependencies(test.content, test.language)
        }
      }));

      const totalFiles = files.length + tests.length;
      const totalLines = [...files, ...tests].reduce((sum, file) => sum + (file.metadata?.lines || 0), 0);

      return {
        files,
        tests,
        documentation: parsedResponse.documentation || '',
        dependencies: parsedResponse.dependencies || [],
        devDependencies: parsedResponse.devDependencies || [],
        buildInstructions: parsedResponse.buildInstructions || '',
        installationInstructions: parsedResponse.installationInstructions,
        usageExamples: parsedResponse.usageExamples || [],
        metadata: {
          totalFiles,
          totalLines,
          generationTime: Date.now(),
          aiModel: this.config.model,
          templateUsed: prompt.codeTemplates[0]?.name || 'default',
          confidenceScore: 0.8 // Default confidence score
        }
      };
    } catch (error) {
      throw new GeminiApiError(
        `Failed to parse generated code response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse validation result from AI response
   */
  private parseValidationResult(validationText: string): IValidationResult {
    try {
      const jsonMatch = validationText.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in validation response');
      }

      const parsedResponse = JSON.parse(jsonMatch[1]!);
      
      return {
        isValid: parsedResponse.isValid || false,
        syntaxErrors: parsedResponse.syntaxErrors || [],
        lintingIssues: parsedResponse.lintingIssues || [],
        styleViolations: parsedResponse.styleViolations || [],
        securityIssues: parsedResponse.securityIssues || [],
        performanceWarnings: parsedResponse.performanceWarnings || [],
        qualityScore: parsedResponse.qualityScore || 0,
        suggestions: parsedResponse.suggestions || [],
        canAutoFix: parsedResponse.canAutoFix || false
      };
    } catch (error) {
      throw new GeminiApiError(
        `Failed to parse validation response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Extract fixed code from AI response
   */
  private extractFixedCode(fixedText: string): string {
    // Extract code from markdown code blocks
    const codeMatch = fixedText.match(/```[\w]*\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1]!;
    }
    
    // If no code blocks found, return the text as-is (fallback)
    return fixedText;
  }

  /**
   * Extract dependencies from code content
   */
  private extractDependencies(content: string, language: string): string[] {
    const dependencies: string[] = [];
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        // Extract import statements
        const importMatches = content.match(/import.*from\s+['"]([^'"]+)['"]/g);
        if (importMatches) {
          importMatches.forEach(match => {
            const depMatch = match.match(/from\s+['"]([^'"]+)['"]/);
            if (depMatch && depMatch[1] && !depMatch[1].startsWith('.')) {
              dependencies.push(depMatch[1]);
            }
          });
        }
        break;
        
      case 'python':
        // Extract import statements
        const pythonImports = content.match(/^(?:from\s+(\w+)|import\s+(\w+))/gm);
        if (pythonImports) {
          pythonImports.forEach(match => {
            const parts = match.split(/\s+/);
            if (parts[0] === 'from' && parts[1]) {
              dependencies.push(parts[1]);
            } else if (parts[0] === 'import' && parts[1]) {
              dependencies.push(parts[1]);
            }
          });
        }
        break;
    }
    
    return [...new Set(dependencies)]; // Remove duplicates
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error = new Error('Unknown error');
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await Promise.race([
          operation(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
          )
        ]);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt === this.config.maxRetries) {
          break;
        }
        
        // Exponential backoff
        const delay = this.config.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new GeminiApiError(
      `Operation failed after ${this.config.maxRetries} attempts: ${lastError.message}`,
      lastError
    );
  }
}