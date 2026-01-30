/**
 * Unit tests for Configuration models
 * Tests interfaces and types for repository and project configuration
 */

import {
  IRepositoryConfig,
  IProjectConfig,
  IApplicationConfig,
  IEnvironmentConfig,
  IConfigValidationResult,
  IConfigValidationError,
  IConfigTemplate
} from '../../../src/models/configuration';
import { ProgrammingLanguage, WorkItemType } from '../../../src/models';

describe('Configuration Models', () => {
  describe('IRepositoryConfig interface', () => {
    it('should create valid repository configuration', () => {
      const repositoryConfig: IRepositoryConfig = {
        id: 'repo-1',
        name: 'main-repository',
        url: 'https://github.com/company/main-repository.git',
        defaultBranch: 'main',
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        codeTemplates: [],
        codingStandards: {
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
          fileStructure: []
        },
        reviewers: ['user1@company.com', 'user2@company.com'],
        areaPathMappings: {
          'Project\\Frontend': 'frontend-config',
          'Project\\Backend': 'backend-config'
        }
      };

      expect(repositoryConfig.id).toBe('repo-1');
      expect(repositoryConfig.name).toBe('main-repository');
      expect(repositoryConfig.targetLanguage).toBe(ProgrammingLanguage.TYPESCRIPT);
      expect(repositoryConfig.reviewers).toHaveLength(2);
      expect(repositoryConfig.areaPathMappings).toHaveProperty('Project\\Frontend');
    });

    it('should handle optional settings', () => {
      const repositoryConfig: IRepositoryConfig = {
        id: 'repo-2',
        name: 'test-repository',
        url: 'https://github.com/company/test-repository.git',
        defaultBranch: 'develop',
        targetLanguage: ProgrammingLanguage.PYTHON,
        codeTemplates: [],
        codingStandards: {
          lintingRules: 'pylint',
          formattingConfig: 'black',
          namingConventions: {
            variables: 'snake_case',
            functions: 'snake_case',
            classes: 'PascalCase',
            constants: 'UPPER_SNAKE_CASE',
            files: 'snake_case',
            directories: 'snake_case'
          },
          fileStructure: []
        },
        reviewers: [],
        areaPathMappings: {},
        settings: {
          autoCreateBranches: true,
          autoCreatePullRequests: true,
          autoAssignReviewers: false,
          branchNamingPattern: 'feat/{id}_{title}',
          commitMessageTemplate: 'feat: {title}\n\n{description}',
          pullRequestTitleTemplate: '{title}',
          pullRequestDescriptionTemplate: 'Closes #{id}\n\n{description}'
        },
        authentication: {
          type: 'token',
          credentialRef: 'github-token'
        }
      };

      expect(repositoryConfig.settings?.autoCreateBranches).toBe(true);
      expect(repositoryConfig.authentication?.type).toBe('token');
      expect(repositoryConfig.targetLanguage).toBe(ProgrammingLanguage.PYTHON);
    });
  });

  describe('IProjectConfig interface', () => {
    it('should create valid project configuration', () => {
      const projectConfig: IProjectConfig = {
        projectId: 'proj-123',
        projectName: 'Test Project',
        organizationUrl: 'https://dev.azure.com/company',
        defaultRepository: {
          id: 'default-repo',
          name: 'default',
          url: 'https://github.com/company/default.git',
          defaultBranch: 'main',
          targetLanguage: ProgrammingLanguage.TYPESCRIPT,
          codeTemplates: [],
          codingStandards: {
            lintingRules: 'eslint',
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
          },
          reviewers: [],
          areaPathMappings: {}
        },
        repositories: {},
        areaPathRepositoryMappings: {
          'Project\\Area1': 'repo-1',
          'Project\\Area2': 'repo-2'
        },
        globalSettings: {
          defaultLanguage: ProgrammingLanguage.TYPESCRIPT,
          processedWorkItemTypes: [WorkItemType.USER_STORY, WorkItemType.TASK, WorkItemType.BUG],
          webhookValidation: {
            validateSignature: true,
            secretKey: 'webhook-secret'
          },
          retryConfig: {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2
          }
        }
      };

      expect(projectConfig.projectId).toBe('proj-123');
      expect(projectConfig.globalSettings.processedWorkItemTypes).toHaveLength(3);
      expect(projectConfig.globalSettings.retryConfig.maxAttempts).toBe(3);
      expect(projectConfig.areaPathRepositoryMappings).toHaveProperty('Project\\Area1');
    });
  });

  describe('IApplicationConfig interface', () => {
    it('should create valid application configuration', () => {
      const appConfig: IApplicationConfig = {
        server: {
          port: 3000,
          host: '0.0.0.0',
          https: false
        },
        azureDevOps: {
          organizationUrl: 'https://dev.azure.com/company',
          personalAccessToken: 'pat-token',
          apiVersion: '7.0'
        },
        gemini: {
          apiKey: 'gemini-api-key',
          model: 'gemini-pro',
          temperature: 0.7,
          maxTokens: 2048
        },
        git: {
          userName: 'Redimento Bot',
          userEmail: 'bot@company.com',
          commitMessagePrefix: 'auto:'
        },
        logging: {
          level: 'info',
          format: 'json',
          logToFile: true,
          logFilePath: './logs/app.log'
        },
        projects: {}
      };

      expect(appConfig.server.port).toBe(3000);
      expect(appConfig.azureDevOps.apiVersion).toBe('7.0');
      expect(appConfig.gemini.temperature).toBe(0.7);
      expect(appConfig.git.userName).toBe('Redimento Bot');
      expect(appConfig.logging.level).toBe('info');
    });

    it('should handle HTTPS configuration', () => {
      const appConfig: IApplicationConfig = {
        server: {
          port: 443,
          host: '0.0.0.0',
          https: true,
          ssl: {
            certPath: '/path/to/cert.pem',
            keyPath: '/path/to/key.pem'
          }
        },
        azureDevOps: {
          organizationUrl: 'https://dev.azure.com/company',
          personalAccessToken: 'pat-token',
          apiVersion: '7.0'
        },
        gemini: {
          apiKey: 'gemini-api-key',
          model: 'gemini-pro',
          temperature: 0.5,
          maxTokens: 1024
        },
        git: {
          userName: 'Bot',
          userEmail: 'bot@company.com',
          commitMessagePrefix: 'feat:'
        },
        logging: {
          level: 'debug',
          format: 'simple',
          logToFile: false
        },
        projects: {}
      };

      expect(appConfig.server.https).toBe(true);
      expect(appConfig.server.ssl?.certPath).toBe('/path/to/cert.pem');
      expect(appConfig.gemini.temperature).toBe(0.5);
    });
  });

  describe('IEnvironmentConfig interface', () => {
    it('should create valid environment configuration', () => {
      const envConfig: IEnvironmentConfig = {
        environment: 'development',
        config: {
          server: {
            port: 3000,
            host: 'localhost',
            https: false
          },
          azureDevOps: {
            organizationUrl: 'https://dev.azure.com/company',
            personalAccessToken: 'dev-pat-token',
            apiVersion: '7.0'
          },
          gemini: {
            apiKey: 'dev-gemini-key',
            model: 'gemini-pro',
            temperature: 0.8,
            maxTokens: 1024
          },
          git: {
            userName: 'Dev Bot',
            userEmail: 'dev-bot@company.com',
            commitMessagePrefix: 'dev:'
          },
          logging: {
            level: 'debug',
            format: 'simple',
            logToFile: false
          },
          projects: {}
        },
        overrides: {
          database: {
            'main': 'mongodb://localhost:27017/dev'
          },
          services: {
            'notification': 'http://localhost:8080'
          },
          features: {
            'enableDebugMode': true,
            'enableMetrics': false
          }
        }
      };

      expect(envConfig.environment).toBe('development');
      expect(envConfig.config.server.host).toBe('localhost');
      expect(envConfig.overrides?.features?.['enableDebugMode']).toBe(true);
    });
  });

  describe('IConfigValidationResult interface', () => {
    it('should represent successful validation', () => {
      const validationResult: IConfigValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        suggestions: ['Consider enabling HTTPS in production']
      };

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
      expect(validationResult.suggestions).toHaveLength(1);
    });

    it('should represent failed validation with errors', () => {
      const validationError: IConfigValidationError = {
        path: 'server.port',
        message: 'Port must be a number between 1 and 65535',
        severity: 'error',
        expected: 'number (1-65535)',
        actual: 'invalid-port',
        suggestedFix: 'Set port to a valid number like 3000'
      };

      const validationResult: IConfigValidationResult = {
        isValid: false,
        errors: [validationError],
        warnings: [],
        suggestions: []
      };

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveLength(1);
      expect(validationResult.errors[0]?.severity).toBe('error');
      expect(validationResult.errors[0]?.path).toBe('server.port');
    });
  });

  describe('IConfigTemplate interface', () => {
    it('should create valid configuration template', () => {
      const configTemplate: IConfigTemplate = {
        name: 'Basic Web API',
        description: 'Template for a basic web API project',
        version: '1.0.0',
        template: {
          server: {
            port: 3000,
            host: '0.0.0.0',
            https: false
          },
          logging: {
            level: 'info',
            format: 'json',
            logToFile: true
          }
        },
        variables: {
          'PROJECT_NAME': {
            description: 'Name of the project',
            defaultValue: 'my-project',
            required: true,
            type: 'string'
          },
          'PORT': {
            description: 'Server port number',
            defaultValue: 3000,
            required: false,
            type: 'number'
          },
          'ENABLE_HTTPS': {
            description: 'Whether to enable HTTPS',
            defaultValue: false,
            required: false,
            type: 'boolean'
          }
        },
        metadata: {
          author: 'Development Team',
          createdDate: '2024-01-01',
          lastUpdated: '2024-01-15',
          tags: ['web-api', 'typescript', 'express']
        }
      };

      expect(configTemplate.name).toBe('Basic Web API');
      expect(configTemplate.variables).toHaveProperty('PROJECT_NAME');
      expect(configTemplate.variables['PROJECT_NAME']?.required).toBe(true);
      expect(configTemplate.variables['PORT']?.type).toBe('number');
      expect(configTemplate.metadata.tags).toContain('typescript');
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle empty configurations', () => {
      const emptyRepoConfig: IRepositoryConfig = {
        id: '',
        name: '',
        url: '',
        defaultBranch: 'main',
        targetLanguage: ProgrammingLanguage.TYPESCRIPT,
        codeTemplates: [],
        codingStandards: {
          lintingRules: '',
          formattingConfig: '',
          namingConventions: {
            variables: '',
            functions: '',
            classes: '',
            constants: '',
            files: '',
            directories: ''
          },
          fileStructure: []
        },
        reviewers: [],
        areaPathMappings: {}
      };

      expect(emptyRepoConfig.id).toBe('');
      expect(emptyRepoConfig.codeTemplates).toHaveLength(0);
      expect(emptyRepoConfig.reviewers).toHaveLength(0);
    });

    it('should handle all programming languages', () => {
      const languages = Object.values(ProgrammingLanguage);
      
      languages.forEach(language => {
        const config: IRepositoryConfig = {
          id: `repo-${language}`,
          name: `${language}-repo`,
          url: `https://github.com/company/${language}-repo.git`,
          defaultBranch: 'main',
          targetLanguage: language,
          codeTemplates: [],
          codingStandards: {
            lintingRules: '',
            formattingConfig: '',
            namingConventions: {
              variables: '',
              functions: '',
              classes: '',
              constants: '',
              files: '',
              directories: ''
            },
            fileStructure: []
          },
          reviewers: [],
          areaPathMappings: {}
        };

        expect(config.targetLanguage).toBe(language);
      });
    });

    it('should handle complex area path mappings', () => {
      const complexMappings = {
        'Project\\Frontend\\Components': 'frontend-components-repo',
        'Project\\Frontend\\Services': 'frontend-services-repo',
        'Project\\Backend\\API': 'backend-api-repo',
        'Project\\Backend\\Database': 'backend-db-repo',
        'Project\\Shared\\Utils': 'shared-utils-repo'
      };

      const projectConfig: IProjectConfig = {
        projectId: 'complex-proj',
        projectName: 'Complex Project',
        organizationUrl: 'https://dev.azure.com/company',
        defaultRepository: {
          id: 'default',
          name: 'default',
          url: 'https://github.com/company/default.git',
          defaultBranch: 'main',
          targetLanguage: ProgrammingLanguage.TYPESCRIPT,
          codeTemplates: [],
          codingStandards: {
            lintingRules: '',
            formattingConfig: '',
            namingConventions: {
              variables: '',
              functions: '',
              classes: '',
              constants: '',
              files: '',
              directories: ''
            },
            fileStructure: []
          },
          reviewers: [],
          areaPathMappings: {}
        },
        repositories: {},
        areaPathRepositoryMappings: complexMappings,
        globalSettings: {
          defaultLanguage: ProgrammingLanguage.TYPESCRIPT,
          processedWorkItemTypes: [WorkItemType.USER_STORY],
          webhookValidation: {
            validateSignature: false
          },
          retryConfig: {
            maxAttempts: 1,
            baseDelay: 500,
            maxDelay: 5000,
            backoffMultiplier: 1.5
          }
        }
      };

      expect(Object.keys(projectConfig.areaPathRepositoryMappings)).toHaveLength(5);
      expect(projectConfig.areaPathRepositoryMappings['Project\\Frontend\\Components']).toBe('frontend-components-repo');
    });
  });
});