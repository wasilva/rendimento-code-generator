/**
 * CodeParser - Utility class for parsing and validating AI-generated code responses
 * Handles extraction, validation, and transformation of code from AI responses
 */

import { 
  IGeneratedCode, 
  IGeneratedFile, 
  IValidationResult, 
  ICodeIssue,
  ProgrammingLanguage,
  FileType 
} from '../../models/codeGeneration';

/**
 * Interface for parsing options
 */
export interface IParseOptions {
  /** Validate file paths */
  validatePaths?: boolean;
  
  /** Validate code syntax */
  validateSyntax?: boolean;
  
  /** Extract metadata from code */
  extractMetadata?: boolean;
  
  /** Maximum file size allowed */
  maxFileSize?: number;
  
  /** Allowed file extensions */
  allowedExtensions?: string[];
}

/**
 * Interface for parsed AI response
 */
export interface IParsedResponse {
  /** Successfully parsed content */
  content: any;
  
  /** Parsing errors encountered */
  errors: string[];
  
  /** Warnings during parsing */
  warnings: string[];
  
  /** Whether parsing was successful */
  success: boolean;
}

/**
 * CodeParser class for handling AI response parsing
 */
export class CodeParser {
  /**
   * Parse generated code response from AI
   */
  static parseGeneratedCodeResponse(
    response: string,
    targetLanguage: ProgrammingLanguage,
    options: IParseOptions = {}
  ): IParsedResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Extract JSON from response
      const jsonContent = this.extractJsonFromResponse(response);
      if (!jsonContent) {
        errors.push('No valid JSON found in AI response');
        return { content: null, errors, warnings, success: false };
      }

      // Parse JSON
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(jsonContent);
      } catch (error) {
        errors.push(`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { content: null, errors, warnings, success: false };
      }

      // Validate structure
      const validationResult = this.validateGeneratedCodeStructure(parsedJson);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (validationResult.errors.length > 0) {
        return { content: null, errors, warnings, success: false };
      }

      // Transform to IGeneratedCode
      const generatedCode = this.transformToGeneratedCode(parsedJson, targetLanguage, options);
      
      // Additional validations
      if (options.validatePaths) {
        const pathValidation = this.validateFilePaths(generatedCode.files.concat(generatedCode.tests));
        warnings.push(...pathValidation);
      }

      if (options.validateSyntax) {
        const syntaxValidation = this.performBasicSyntaxValidation(generatedCode.files, targetLanguage);
        warnings.push(...syntaxValidation);
      }

      return {
        content: generatedCode,
        errors,
        warnings,
        success: true
      };

    } catch (error) {
      errors.push(`Unexpected error during parsing: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { content: null, errors, warnings, success: false };
    }
  }

  /**
   * Parse validation result response from AI
   */
  static parseValidationResponse(response: string): IParsedResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const jsonContent = this.extractJsonFromResponse(response);
      if (!jsonContent) {
        errors.push('No valid JSON found in validation response');
        return { content: null, errors, warnings, success: false };
      }

      const parsedJson = JSON.parse(jsonContent);
      
      // Validate validation result structure
      const validationResult = this.validateValidationResultStructure(parsedJson);
      errors.push(...validationResult.errors);
      warnings.push(...validationResult.warnings);

      if (validationResult.errors.length > 0) {
        return { content: null, errors, warnings, success: false };
      }

      // Transform to IValidationResult
      const result: IValidationResult = {
        isValid: Boolean(parsedJson.isValid),
        syntaxErrors: this.parseCodeIssues(parsedJson.syntaxErrors || []),
        lintingIssues: this.parseCodeIssues(parsedJson.lintingIssues || []),
        styleViolations: this.parseCodeIssues(parsedJson.styleViolations || []),
        securityIssues: this.parseCodeIssues(parsedJson.securityIssues || []),
        performanceWarnings: this.parseCodeIssues(parsedJson.performanceWarnings || []),
        qualityScore: Math.max(0, Math.min(100, Number(parsedJson.qualityScore) || 0)),
        suggestions: Array.isArray(parsedJson.suggestions) ? parsedJson.suggestions : [],
        canAutoFix: Boolean(parsedJson.canAutoFix)
      };

      return {
        content: result,
        errors,
        warnings,
        success: true
      };

    } catch (error) {
      errors.push(`Error parsing validation response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { content: null, errors, warnings, success: false };
    }
  }

  /**
   * Parse fixed code response from AI
   */
  static parseFixedCodeResponse(response: string, originalCode: string): IParsedResponse {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Extract code from markdown blocks or plain text
      const fixedCode = this.extractCodeFromResponse(response);
      
      if (!fixedCode || fixedCode.trim().length === 0) {
        errors.push('Fixed code is empty');
        return { content: originalCode, errors, warnings, success: false };
      }

      // Check if the fixed code is significantly different from original
      const similarity = this.calculateCodeSimilarity(originalCode, fixedCode);
      if (similarity < 0.5) {
        warnings.push('Fixed code is significantly different from original - review carefully');
      }

      return {
        content: fixedCode,
        errors,
        warnings,
        success: true
      };

    } catch (error) {
      errors.push(`Error parsing fixed code: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { content: originalCode, errors, warnings, success: false };
    }
  }

  /**
   * Extract JSON content from AI response
   */
  private static extractJsonFromResponse(response: string): string | null {
    // Try to find JSON in markdown code blocks
    const jsonBlockMatch = response.match(/```json\s*\n([\s\S]*?)\n\s*```/i);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      return jsonBlockMatch[1].trim();
    }

    // Try to find JSON in plain code blocks
    const codeBlockMatch = response.match(/```\s*\n([\s\S]*?)\n\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const content = codeBlockMatch[1].trim();
      if (content.startsWith('{') && content.endsWith('}')) {
        return content;
      }
    }

    // Try to find JSON in the response directly
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    return null;
  }

  /**
   * Extract code from AI response (for fixed code)
   */
  private static extractCodeFromResponse(response: string): string | null {
    // Try to find code in markdown blocks
    const codeBlockMatch = response.match(/```[\w]*\s*\n([\s\S]*?)\n\s*```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      return codeBlockMatch[1].trim();
    }

    // If no code blocks, return the response as-is (fallback)
    return response.trim();
  }

  /**
   * Validate generated code structure
   */
  private static validateGeneratedCodeStructure(data: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!data.files && !data.tests) {
      errors.push('Response must contain either files or tests');
    }

    if (data.files && !Array.isArray(data.files)) {
      errors.push('files must be an array');
    }

    if (data.tests && !Array.isArray(data.tests)) {
      errors.push('tests must be an array');
    }

    // Validate file objects
    if (data.files) {
      data.files.forEach((file: any, index: number) => {
        const fileErrors = this.validateFileObject(file, `files[${index}]`);
        errors.push(...fileErrors);
      });
    }

    if (data.tests) {
      data.tests.forEach((test: any, index: number) => {
        const testErrors = this.validateFileObject(test, `tests[${index}]`);
        errors.push(...testErrors);
      });
    }

    // Check optional fields
    if (data.dependencies && !Array.isArray(data.dependencies)) {
      warnings.push('dependencies should be an array');
    }

    if (data.documentation && typeof data.documentation !== 'string') {
      warnings.push('documentation should be a string');
    }

    return { errors, warnings };
  }

  /**
   * Validate file object structure
   */
  private static validateFileObject(file: any, context: string): string[] {
    const errors: string[] = [];

    if (!file.path || typeof file.path !== 'string') {
      errors.push(`${context}: path is required and must be a string`);
    }

    if (!file.content || typeof file.content !== 'string') {
      errors.push(`${context}: content is required and must be a string`);
    }

    if (!file.language || typeof file.language !== 'string') {
      errors.push(`${context}: language is required and must be a string`);
    }

    if (!file.type || typeof file.type !== 'string') {
      errors.push(`${context}: type is required and must be a string`);
    }

    return errors;
  }

  /**
   * Validate validation result structure
   */
  private static validateValidationResultStructure(data: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (typeof data.isValid !== 'boolean') {
      errors.push('isValid must be a boolean');
    }

    const issueArrays = ['syntaxErrors', 'lintingIssues', 'styleViolations', 'securityIssues', 'performanceWarnings'];
    issueArrays.forEach(arrayName => {
      if (data[arrayName] && !Array.isArray(data[arrayName])) {
        warnings.push(`${arrayName} should be an array`);
      }
    });

    if (data.qualityScore !== undefined && (typeof data.qualityScore !== 'number' || data.qualityScore < 0 || data.qualityScore > 100)) {
      warnings.push('qualityScore should be a number between 0 and 100');
    }

    return { errors, warnings };
  }

  /**
   * Transform parsed JSON to IGeneratedCode
   */
  private static transformToGeneratedCode(
    data: any,
    _targetLanguage: ProgrammingLanguage,
    options: IParseOptions
  ): IGeneratedCode {
    const files: IGeneratedFile[] = (data.files || []).map((file: any) => 
      this.transformToGeneratedFile(file, options)
    );

    const tests: IGeneratedFile[] = (data.tests || []).map((test: any) => 
      this.transformToGeneratedFile({ ...test, type: FileType.TEST }, options)
    );

    const totalFiles = files.length + tests.length;
    const totalLines = [...files, ...tests].reduce((sum, file) => sum + (file.metadata?.lines || 0), 0);

    return {
      files,
      tests,
      documentation: data.documentation || '',
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
      devDependencies: Array.isArray(data.devDependencies) ? data.devDependencies : [],
      buildInstructions: data.buildInstructions || '',
      installationInstructions: data.installationInstructions || '',
      usageExamples: Array.isArray(data.usageExamples) ? data.usageExamples : [],
      metadata: {
        totalFiles,
        totalLines,
        generationTime: Date.now(),
        aiModel: 'gemini-pro', // Default model
        templateUsed: 'default',
        confidenceScore: 0.8
      }
    };
  }

  /**
   * Transform to generated file
   */
  private static transformToGeneratedFile(file: any, options: IParseOptions): IGeneratedFile {
    const content = file.content || '';
    const metadata = options.extractMetadata ? {
      size: Buffer.byteLength(content, 'utf8'),
      lines: content.split('\n').length,
      complexity: this.estimateComplexity(content),
      dependencies: this.extractDependenciesFromCode(content, file.language)
    } : {
      size: Buffer.byteLength(content, 'utf8'),
      lines: content.split('\n').length
    };

    return {
      path: file.path,
      content,
      language: file.language as ProgrammingLanguage,
      type: file.type as FileType,
      metadata
    };
  }

  /**
   * Parse code issues from validation response
   */
  private static parseCodeIssues(issues: any[]): ICodeIssue[] {
    return issues.map(issue => ({
      type: issue.type || 'syntax',
      severity: issue.severity || 'error',
      message: issue.message || 'Unknown issue',
      file: issue.file || 'unknown',
      line: Number(issue.line) || 1,
      column: issue.column ? Number(issue.column) : 1,
      rule: issue.rule,
      suggestedFix: issue.suggestedFix,
      canAutoFix: Boolean(issue.canAutoFix)
    }));
  }

  /**
   * Validate file paths
   */
  private static validateFilePaths(files: IGeneratedFile[]): string[] {
    const warnings: string[] = [];

    files.forEach(file => {
      // Check for absolute paths
      if (file.path.startsWith('/') || file.path.match(/^[A-Za-z]:/)) {
        warnings.push(`File path should be relative: ${file.path}`);
      }

      // Check for dangerous paths
      if (file.path.includes('..')) {
        warnings.push(`File path contains parent directory references: ${file.path}`);
      }

      // Check for empty paths
      if (!file.path.trim()) {
        warnings.push('File path is empty');
      }
    });

    return warnings;
  }

  /**
   * Perform basic syntax validation
   */
  private static performBasicSyntaxValidation(files: IGeneratedFile[], language: ProgrammingLanguage): string[] {
    const warnings: string[] = [];

    files.forEach(file => {
      const content = file.content;
      
      switch (language) {
        case ProgrammingLanguage.TYPESCRIPT:
        case ProgrammingLanguage.JAVASCRIPT:
          // Basic bracket matching
          if (!this.validateBrackets(content)) {
            warnings.push(`Potential bracket mismatch in ${file.path}`);
          }
          break;
          
        case ProgrammingLanguage.PYTHON:
          // Basic indentation check
          if (!this.validatePythonIndentation(content)) {
            warnings.push(`Potential indentation issues in ${file.path}`);
          }
          break;
      }
    });

    return warnings;
  }

  /**
   * Validate bracket matching
   */
  private static validateBrackets(code: string): boolean {
    const stack: string[] = [];
    const pairs: Record<string, string> = { '(': ')', '[': ']', '{': '}' };
    const opening = Object.keys(pairs);
    const closing = Object.values(pairs);

    for (const char of code) {
      if (opening.includes(char)) {
        stack.push(char);
      } else if (closing.includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last] !== char) {
          return false;
        }
      }
    }

    return stack.length === 0;
  }

  /**
   * Validate Python indentation
   */
  private static validatePythonIndentation(code: string): boolean {
    const lines = code.split('\n');
    let indentLevel = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('#')) continue;
      
      const currentIndent = line.length - line.trimStart().length;
      
      if (trimmed.endsWith(':')) {
        indentLevel += 4;
      } else if (currentIndent < indentLevel && currentIndent % 4 !== 0) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Estimate code complexity
   */
  private static estimateComplexity(code: string): number {
    // Simple complexity estimation based on control structures
    const controlStructures = [
      'if', 'else', 'elif', 'for', 'while', 'switch', 'case', 'try', 'catch', 'finally'
    ];
    
    let complexity = 1; // Base complexity
    
    controlStructures.forEach(structure => {
      const regex = new RegExp(`\\b${structure}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  /**
   * Extract dependencies from code
   */
  private static extractDependenciesFromCode(code: string, language: string): string[] {
    const dependencies: string[] = [];
    
    switch (language) {
      case 'typescript':
      case 'javascript':
        const importMatches = code.match(/import.*from\s+['"]([^'"]+)['"]/g);
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
        const pythonImports = code.match(/^(?:from\s+(\w+)|import\s+(\w+))/gm);
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
    
    return [...new Set(dependencies)];
  }

  /**
   * Calculate similarity between two code strings
   */
  private static calculateCodeSimilarity(code1: string, code2: string): number {
    const normalize = (code: string) => code.replace(/\s+/g, ' ').trim().toLowerCase();
    
    const normalized1 = normalize(code1);
    const normalized2 = normalize(code2);
    
    if (normalized1 === normalized2) return 1;
    
    // Simple Levenshtein distance-based similarity
    const maxLength = Math.max(normalized1.length, normalized2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(normalized1, normalized2);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0]![i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j]![0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j]![i] = Math.min(
          matrix[j]![i - 1]! + 1,
          matrix[j - 1]![i]! + 1,
          matrix[j - 1]![i - 1]! + indicator
        );
      }
    }
    
    return matrix[str2.length]![str1.length]!;
  }
}