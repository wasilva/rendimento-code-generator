/**
 * PromptBuilder - Utility class for building structured prompts for Gemini AI
 * Provides specialized prompt templates for different types of code generation tasks
 */

import { 
  ICodeGenerationPrompt, 
  ICodeTemplate, 
  ICodingStandards, 
  IProjectContext,
  ProgrammingLanguage 
} from '../../models/codeGeneration';
import { IEnrichedWorkItem, WorkItemType } from '../../models/workItem';

/**
 * Interface for prompt building options
 */
export interface IPromptOptions {
  /** Include detailed examples in the prompt */
  includeExamples?: boolean;
  
  /** Include specific coding patterns */
  includePatterns?: boolean;
  
  /** Include security considerations */
  includeSecurity?: boolean;
  
  /** Include performance considerations */
  includePerformance?: boolean;
  
  /** Maximum prompt length */
  maxLength?: number;
  
  /** Custom instructions to append */
  customInstructions?: string[];
}

/**
 * PromptBuilder class for creating structured AI prompts
 */
export class PromptBuilder {
  /**
   * Build a comprehensive code generation prompt
   */
  static buildCodeGenerationPrompt(
    prompt: ICodeGenerationPrompt,
    options: IPromptOptions = {}
  ): string {
    const sections = [
      this.buildHeaderSection(),
      this.buildWorkItemSection(prompt.workItem),
      this.buildProjectContextSection(prompt.projectContext, prompt.targetLanguage),
      this.buildTemplateSection(prompt.codeTemplates),
      this.buildCodingStandardsSection(prompt.codingStandards),
      this.buildInstructionsSection(prompt, options),
      this.buildOutputFormatSection(prompt.targetLanguage),
      this.buildFooterSection()
    ];

    const fullPrompt = sections.join('\n\n');
    
    // Truncate if necessary
    if (options.maxLength && fullPrompt.length > options.maxLength) {
      return this.truncatePrompt(fullPrompt, options.maxLength);
    }
    
    return fullPrompt;
  }

  /**
   * Build a validation prompt for code quality checking
   */
  static buildValidationPrompt(
    code: string,
    language: ProgrammingLanguage,
    standards?: ICodingStandards,
    options: IPromptOptions = {}
  ): string {
    return `
# Code Validation Request

## Programming Language
${language}

## Code to Validate
\`\`\`${language}
${code}
\`\`\`

${standards ? this.buildValidationStandardsSection(standards) : ''}

## Validation Criteria
Please analyze the code for:

### 1. Syntax and Structure
- Syntax errors and typos
- Proper language constructs usage
- Correct indentation and formatting
- Missing imports or dependencies

### 2. Code Quality
- Code readability and maintainability
- Proper error handling
- Resource management (memory, connections, etc.)
- Code complexity and organization

### 3. Security Issues
- Input validation vulnerabilities
- Authentication and authorization flaws
- Data exposure risks
- Injection attack vulnerabilities

### 4. Performance Considerations
- Inefficient algorithms or data structures
- Memory leaks or excessive resource usage
- Unnecessary computations
- Database query optimization

### 5. Best Practices
- Naming conventions adherence
- Documentation and comments
- Testing considerations
- Design patterns usage

${options.customInstructions ? this.buildCustomInstructionsSection(options.customInstructions) : ''}

## Output Format
\`\`\`json
{
  "isValid": boolean,
  "syntaxErrors": [
    {
      "type": "syntax",
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "file": "filename or 'inline'",
      "line": number,
      "column": number,
      "rule": "rule name if applicable",
      "suggestedFix": "suggested fix if available",
      "canAutoFix": boolean
    }
  ],
  "lintingIssues": [...],
  "styleViolations": [...],
  "securityIssues": [...],
  "performanceWarnings": [...],
  "qualityScore": number (0-100),
  "suggestions": ["improvement suggestion 1", "suggestion 2"],
  "canAutoFix": boolean
}
\`\`\`

Please validate the code now:
`;
  }

  /**
   * Build a code fixing prompt
   */
  static buildFixPrompt(
    code: string,
    issues: Array<{ message: string; line: number; severity: string; type: string }>,
    language: ProgrammingLanguage,
    options: IPromptOptions = {}
  ): string {
    const issuesList = issues.map((issue, index) => 
      `${index + 1}. **Line ${issue.line}** (${issue.severity}): ${issue.message}`
    ).join('\n');

    return `
# Code Fix Request

## Programming Language
${language}

## Original Code
\`\`\`${language}
${code}
\`\`\`

## Issues to Fix
${issuesList}

## Fix Instructions
Please fix the identified issues while:
1. Maintaining the original functionality and logic
2. Preserving the code structure as much as possible
3. Following ${language} best practices
4. Ensuring the fixes don't introduce new issues
5. Only fixing issues that can be automatically resolved

${options.customInstructions ? this.buildCustomInstructionsSection(options.customInstructions) : ''}

## Output Format
Please provide only the corrected code without additional explanation:

\`\`\`${language}
[FIXED_CODE_HERE]
\`\`\`

Fix the code now:
`;
  }

  /**
   * Build header section for prompts
   */
  private static buildHeaderSection(): string {
    return `# AI Code Generation Assistant

You are an expert software developer with deep knowledge of multiple programming languages, frameworks, and best practices. Your task is to generate high-quality, production-ready code based on the provided requirements.`;
  }

  /**
   * Build work item section
   */
  private static buildWorkItemSection(workItem: IEnrichedWorkItem): string {
    const typeSpecificInfo = this.getWorkItemTypeSpecificInfo(workItem);
    
    return `## Work Item Details

### Basic Information
- **ID**: ${workItem.id}
- **Type**: ${workItem.type}
- **Title**: ${workItem.title}
- **Priority**: ${workItem.priority}
- **State**: ${workItem.state}
- **Area Path**: ${workItem.areaPath}
- **Iteration**: ${workItem.iterationPath}

### Description
${workItem.description || 'No description provided'}

### Acceptance Criteria
${workItem.acceptanceCriteria || 'No acceptance criteria provided'}

${typeSpecificInfo}

### Tags
${workItem.tags.length > 0 ? workItem.tags.join(', ') : 'No tags'}

### Assigned To
${workItem.assignedTo || 'Unassigned'}`;
  }

  /**
   * Get work item type specific information
   */
  private static getWorkItemTypeSpecificInfo(workItem: IEnrichedWorkItem): string {
    switch (workItem.type) {
      case WorkItemType.BUG:
        return `### Bug Details
- **Reproduction Steps**: ${workItem.reproductionSteps || 'Not provided'}
- **Expected Behavior**: Should be derived from acceptance criteria
- **Actual Behavior**: Described in the work item description`;

      case WorkItemType.USER_STORY:
        return `### User Story Details
- **As a**: User/Role (extract from description)
- **I want**: Functionality (extract from title/description)
- **So that**: Benefit (extract from acceptance criteria)`;

      case WorkItemType.TASK:
        return `### Task Details
- **Technical Requirements**: Extract from description
- **Implementation Notes**: Any specific technical considerations`;

      default:
        return '';
    }
  }

  /**
   * Build project context section
   */
  private static buildProjectContextSection(
    context: IProjectContext,
    language: ProgrammingLanguage
  ): string {
    return `## Project Context

### Project Information
- **Name**: ${context.projectName}
- **Primary Language**: ${language}
- **Framework**: ${context.framework || 'Not specified'}
- **Version**: ${context.version || 'Not specified'}

### Project Structure
- **Source Directory**: ${context.structure.sourceDir}
- **Test Directory**: ${context.structure.testDir}
- **Config Directory**: ${context.structure.configDir || 'Not specified'}
- **Docs Directory**: ${context.structure.docsDir || 'Not specified'}

### Dependencies
**Production Dependencies:**
${context.dependencies.length > 0 ? context.dependencies.map(dep => `- ${dep}`).join('\n') : '- None specified'}

**Development Dependencies:**
${context.devDependencies.length > 0 ? context.devDependencies.map(dep => `- ${dep}`).join('\n') : '- None specified'}

### Build Configuration
${context.buildConfig ? `
- **Build Command**: ${context.buildConfig.buildCommand}
- **Test Command**: ${context.buildConfig.testCommand}
- **Start Command**: ${context.buildConfig.startCommand}
` : 'No build configuration specified'}`;
  }

  /**
   * Build template section
   */
  private static buildTemplateSection(templates: ICodeTemplate[]): string {
    if (templates.length === 0) {
      return '## Templates\nNo specific templates provided. Use standard patterns for the language.';
    }

    const templateInfo = templates.map(template => `
### ${template.name}
- **Description**: ${template.description}
- **Work Item Types**: ${template.workItemTypes.join(', ')}
- **Files**: ${template.templateFiles.length} template files
- **Variables**: ${Object.keys(template.variables).join(', ')}
`).join('\n');

    return `## Available Templates
${templateInfo}`;
  }

  /**
   * Build coding standards section
   */
  private static buildCodingStandardsSection(standards: ICodingStandards): string {
    return `## Coding Standards

### Naming Conventions
- **Variables**: ${standards.namingConventions.variables}
- **Functions**: ${standards.namingConventions.functions}
- **Classes**: ${standards.namingConventions.classes}
- **Constants**: ${standards.namingConventions.constants}
- **Files**: ${standards.namingConventions.files}
- **Directories**: ${standards.namingConventions.directories}

### Quality Thresholds
${standards.qualityThresholds ? `
- **Max Complexity**: ${standards.qualityThresholds.maxComplexity}
- **Max Function Length**: ${standards.qualityThresholds.maxFunctionLength} lines
- **Max File Length**: ${standards.qualityThresholds.maxFileLength} lines
- **Min Test Coverage**: ${standards.qualityThresholds.minTestCoverage}%
` : 'No specific quality thresholds defined'}

### File Structure Rules
${standards.fileStructure.length > 0 ? 
  standards.fileStructure.map(rule => `- **${rule.pattern}**: ${rule.description}`).join('\n') :
  'No specific file structure rules defined'
}`;
  }

  /**
   * Build validation standards section
   */
  private static buildValidationStandardsSection(standards: ICodingStandards): string {
    return `## Coding Standards to Validate Against

### Naming Conventions
- Variables should follow: ${standards.namingConventions.variables}
- Functions should follow: ${standards.namingConventions.functions}
- Classes should follow: ${standards.namingConventions.classes}
- Constants should follow: ${standards.namingConventions.constants}
- Files should follow: ${standards.namingConventions.files}

### Quality Requirements
${standards.qualityThresholds ? `
- Maximum cyclomatic complexity: ${standards.qualityThresholds.maxComplexity}
- Maximum function length: ${standards.qualityThresholds.maxFunctionLength} lines
- Maximum file length: ${standards.qualityThresholds.maxFileLength} lines
` : ''}`;
  }

  /**
   * Build instructions section
   */
  private static buildInstructionsSection(
    prompt: ICodeGenerationPrompt,
    options: IPromptOptions
  ): string {
    const baseInstructions = [
      'Generate complete, production-ready code that implements the work item requirements',
      'Follow the specified coding standards and naming conventions',
      'Include comprehensive error handling and input validation',
      'Write clear, self-documenting code with appropriate comments',
      'Generate corresponding unit tests with good coverage',
      'Use the project\'s existing dependencies where appropriate',
      'Ensure the code is maintainable and follows SOLID principles'
    ];

    const conditionalInstructions = [];

    if (options.includeSecurity) {
      conditionalInstructions.push('Implement security best practices and input sanitization');
    }

    if (options.includePerformance) {
      conditionalInstructions.push('Optimize for performance and efficient resource usage');
    }

    if (options.includePatterns) {
      conditionalInstructions.push('Use appropriate design patterns where beneficial');
    }

    if (prompt.instructions?.requirements) {
      conditionalInstructions.push(...prompt.instructions.requirements);
    }

    if (options.customInstructions) {
      conditionalInstructions.push(...options.customInstructions);
    }

    const allInstructions = [...baseInstructions, ...conditionalInstructions];

    return `## Generation Instructions

${allInstructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}

${prompt.instructions?.patterns ? `
### Preferred Patterns
${prompt.instructions.patterns.map(pattern => `- ${pattern}`).join('\n')}
` : ''}

${prompt.instructions?.preferredLibraries ? `
### Preferred Libraries
${prompt.instructions.preferredLibraries.map(lib => `- ${lib}`).join('\n')}
` : ''}`;
  }

  /**
   * Build custom instructions section
   */
  private static buildCustomInstructionsSection(instructions: string[]): string {
    return `## Additional Instructions
${instructions.map((instruction, index) => `${index + 1}. ${instruction}`).join('\n')}`;
  }

  /**
   * Build output format section
   */
  private static buildOutputFormatSection(language: ProgrammingLanguage): string {
    return `## Required Output Format

Please provide your response in the following JSON format:

\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.${this.getFileExtension(language)}",
      "content": "Complete file content here",
      "language": "${language}",
      "type": "source"
    }
  ],
  "tests": [
    {
      "path": "relative/path/to/test.spec.${this.getFileExtension(language)}",
      "content": "Complete test file content here",
      "language": "${language}",
      "type": "test"
    }
  ],
  "documentation": "Generated documentation in markdown format explaining the implementation",
  "dependencies": ["new-dependency-1", "new-dependency-2"],
  "devDependencies": ["test-framework", "linting-tools"],
  "buildInstructions": "Step-by-step instructions for building and running the code",
  "installationInstructions": "Instructions for installing dependencies",
  "usageExamples": ["Example 1: How to use the main functionality", "Example 2: Advanced usage"]
}
\`\`\`

### Important Notes:
- Ensure all file paths are relative to the project root
- Include complete, runnable code in each file
- Provide comprehensive test coverage
- Use proper error handling throughout
- Follow the specified coding standards exactly`;
  }

  /**
   * Build footer section
   */
  private static buildFooterSection(): string {
    return `## Ready to Generate

Please generate the code now, ensuring it meets all the specified requirements and follows the established patterns and standards.`;
  }

  /**
   * Get file extension for programming language
   */
  private static getFileExtension(language: ProgrammingLanguage): string {
    switch (language) {
      case ProgrammingLanguage.TYPESCRIPT:
        return 'ts';
      case ProgrammingLanguage.JAVASCRIPT:
        return 'js';
      case ProgrammingLanguage.PYTHON:
        return 'py';
      case ProgrammingLanguage.JAVA:
        return 'java';
      case ProgrammingLanguage.CSHARP:
        return 'cs';
      default:
        return 'txt';
    }
  }

  /**
   * Truncate prompt to fit within length limits
   */
  private static truncatePrompt(prompt: string, maxLength: number): string {
    if (prompt.length <= maxLength) {
      return prompt;
    }

    // Try to truncate at section boundaries
    const sections = prompt.split('\n\n');
    let truncated = '';
    
    for (const section of sections) {
      if (truncated.length + section.length + 2 <= maxLength - 100) { // Leave room for footer
        truncated += (truncated ? '\n\n' : '') + section;
      } else {
        break;
      }
    }

    // Add truncation notice
    truncated += '\n\n[Note: Prompt truncated due to length limits. Focus on the core requirements above.]';
    
    return truncated;
  }
}