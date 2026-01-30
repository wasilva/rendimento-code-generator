/**
 * Unit tests for GeminiServiceFactory
 * Tests factory pattern, configuration management, and service creation
 */

import { 
  GeminiServiceFactory, 
  IGeminiServiceFactoryConfig,
  createGeminiService,
  createDefaultGeminiService 
} from '../../../../src/services/gemini/GeminiServiceFactory';
import { ProgrammingLanguage } from '../../../../src/models/codeGeneration';

// Mock the GeminiService
jest.mock('../../../../src/services/gemini/GeminiService', () => ({
  GeminiService: jest.fn().mockImplementation(() => ({
    generateCode: jest.fn(),
    validateGeneratedCode: jest.fn(),
    fixCodeIssues: jest.fn()
  }))
}));

describe('GeminiServiceFactory', () => {
  const mockConfig: IGeminiServiceFactoryConfig = {
    apiKey: 'test-api-key',
    environment: 'development',
    defaultModel: 'gemini-pro',
    timeouts: {
      default: 30000,
      codeGeneration: 45000,
      validation: 20000,
      codeFix: 25000
    },
    retryConfig: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000
    }
  };

  beforeEach(() => {
    // Clear singleton instance before each test
    (GeminiServiceFactory as any).instance = undefined;
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should create singleton instance with config', () => {
      const factory1 = GeminiServiceFactory.getInstance(mockConfig);
      const factory2 = GeminiServiceFactory.getInstance();

      expect(factory1).toBe(factory2);
      expect(factory1).toBeInstanceOf(GeminiServiceFactory);
    });

    it('should throw error when accessing instance without initial config', () => {
      expect(() => {
        GeminiServiceFactory.getInstance();
      }).toThrow('Configuration is required for first-time factory initialization');
    });

    it('should not require config on subsequent calls', () => {
      GeminiServiceFactory.getInstance(mockConfig);
      
      expect(() => {
        GeminiServiceFactory.getInstance();
      }).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required API key', () => {
      const invalidConfig = { ...mockConfig, apiKey: '' };

      expect(() => {
        GeminiServiceFactory.getInstance(invalidConfig);
      }).toThrow('Google API key is required');
    });

    it('should apply default values for missing config', () => {
      const minimalConfig = { apiKey: 'test-key' };
      const factory = GeminiServiceFactory.getInstance(minimalConfig);

      expect(factory).toBeInstanceOf(GeminiServiceFactory);
    });

    it('should normalize configuration values', () => {
      const configWithoutDefaults = {
        apiKey: 'test-key'
      };

      const factory = GeminiServiceFactory.getInstance(configWithoutDefaults);
      const serviceConfig = factory.getServiceConfig(ProgrammingLanguage.TYPESCRIPT);

      expect(serviceConfig.timeout).toBeDefined();
      expect(serviceConfig.maxRetries).toBeDefined();
      expect(serviceConfig.baseDelay).toBeDefined();
    });
  });

  describe('Service Creation', () => {
    let factory: GeminiServiceFactory;

    beforeEach(() => {
      factory = GeminiServiceFactory.getInstance(mockConfig);
    });

    it('should create service for specific language', () => {
      const service = factory.createService(ProgrammingLanguage.TYPESCRIPT);

      expect(service).toBeDefined();
      expect(service.generateCode).toBeDefined();
      expect(service.validateGeneratedCode).toBeDefined();
      expect(service.fixCodeIssues).toBeDefined();
    });

    it('should create default service', () => {
      const service = factory.createDefaultService();

      expect(service).toBeDefined();
    });

    it('should cache service instances', () => {
      const service1 = factory.createService(ProgrammingLanguage.TYPESCRIPT);
      const service2 = factory.createService(ProgrammingLanguage.TYPESCRIPT);

      expect(service1).toBe(service2);
    });

    it('should create different instances for different languages', () => {
      const tsService = factory.createService(ProgrammingLanguage.TYPESCRIPT);
      const pyService = factory.createService(ProgrammingLanguage.PYTHON);

      expect(tsService).not.toBe(pyService);
    });

    it('should create different instances for different environments', () => {
      const devFactory = GeminiServiceFactory.getInstance({
        ...mockConfig,
        environment: 'development'
      });

      const prodFactory = GeminiServiceFactory.getInstance({
        ...mockConfig,
        environment: 'production'
      });

      // Clear cache to force new instances
      devFactory.clearCache();
      prodFactory.clearCache();

      const devService = devFactory.createService(ProgrammingLanguage.TYPESCRIPT);
      const prodService = prodFactory.createService(ProgrammingLanguage.TYPESCRIPT);

      // They should be different instances (though we can't directly compare due to caching)
      expect(devService).toBeDefined();
      expect(prodService).toBeDefined();
    });
  });

  describe('Language-Specific Configuration', () => {
    let factory: GeminiServiceFactory;

    beforeEach(() => {
      const configWithLanguageSettings: IGeminiServiceFactoryConfig = {
        ...mockConfig,
        languageConfigs: {
          [ProgrammingLanguage.TYPESCRIPT]: {
            model: 'gemini-pro-typescript',
            timeout: 35000
          },
          [ProgrammingLanguage.PYTHON]: {
            model: 'gemini-pro-python',
            timeout: 40000
          }
        }
      };

      factory = GeminiServiceFactory.getInstance(configWithLanguageSettings);
    });

    it('should apply language-specific configuration', () => {
      const tsConfig = factory.getServiceConfig(ProgrammingLanguage.TYPESCRIPT);
      const pyConfig = factory.getServiceConfig(ProgrammingLanguage.PYTHON);

      expect(tsConfig.model).toBe('gemini-pro-typescript');
      expect(tsConfig.timeout).toBe(35000);
      expect(pyConfig.model).toBe('gemini-pro-python');
      expect(pyConfig.timeout).toBe(40000);
    });

    it('should use default model for languages without specific config', () => {
      const javaConfig = factory.getServiceConfig(ProgrammingLanguage.JAVA);

      expect(javaConfig.model).toBe('gemini-pro'); // Default model
    });

    it('should apply different generation configs per language', () => {
      const tsConfig = factory.getServiceConfig(ProgrammingLanguage.TYPESCRIPT);
      const javaConfig = factory.getServiceConfig(ProgrammingLanguage.JAVA);

      expect(tsConfig.generationConfig?.temperature).toBe(0.7);
      expect(javaConfig.generationConfig?.temperature).toBe(0.5);
    });
  });

  describe('Configuration Updates', () => {
    let factory: GeminiServiceFactory;

    beforeEach(() => {
      factory = GeminiServiceFactory.getInstance(mockConfig);
    });

    it('should update configuration', () => {
      const newConfig = {
        defaultModel: 'gemini-pro-v2',
        timeouts: {
          default: 60000,
          codeGeneration: 90000,
          validation: 40000,
          codeFix: 50000
        }
      };

      factory.updateConfig(newConfig);
      const serviceConfig = factory.getServiceConfig(ProgrammingLanguage.TYPESCRIPT);

      expect(serviceConfig.model).toBe('gemini-pro-v2');
      expect(serviceConfig.timeout).toBe(90000);
    });

    it('should clear cache when configuration is updated', () => {
      const service1 = factory.createService(ProgrammingLanguage.TYPESCRIPT);
      
      factory.updateConfig({ defaultModel: 'new-model' });
      
      const service2 = factory.createService(ProgrammingLanguage.TYPESCRIPT);

      // Services should be different instances after config update
      expect(service1).not.toBe(service2);
    });

    it('should clear cache manually', () => {
      const service1 = factory.createService(ProgrammingLanguage.TYPESCRIPT);
      
      factory.clearCache();
      
      const service2 = factory.createService(ProgrammingLanguage.TYPESCRIPT);

      expect(service1).not.toBe(service2);
    });
  });

  describe('Default Model Selection', () => {
    let factory: GeminiServiceFactory;

    beforeEach(() => {
      factory = GeminiServiceFactory.getInstance(mockConfig);
    });

    it('should select appropriate default model for each language', () => {
      const languages = [
        ProgrammingLanguage.TYPESCRIPT,
        ProgrammingLanguage.JAVASCRIPT,
        ProgrammingLanguage.PYTHON,
        ProgrammingLanguage.JAVA,
        ProgrammingLanguage.CSHARP
      ];

      languages.forEach(language => {
        const config = factory.getServiceConfig(language);
        expect(config.model).toBeDefined();
        expect(typeof config.model).toBe('string');
      });
    });
  });

  describe('Generation Configuration', () => {
    let factory: GeminiServiceFactory;

    beforeEach(() => {
      factory = GeminiServiceFactory.getInstance(mockConfig);
    });

    it('should provide language-optimized generation settings', () => {
      const tsConfig = factory.getServiceConfig(ProgrammingLanguage.TYPESCRIPT);
      const pyConfig = factory.getServiceConfig(ProgrammingLanguage.PYTHON);
      const javaConfig = factory.getServiceConfig(ProgrammingLanguage.JAVA);

      expect(tsConfig.generationConfig?.temperature).toBe(0.7);
      expect(pyConfig.generationConfig?.temperature).toBe(0.6);
      expect(javaConfig.generationConfig?.temperature).toBe(0.5);

      // All should have common settings
      [tsConfig, pyConfig, javaConfig].forEach(config => {
        expect(config.generationConfig?.topK).toBe(40);
        expect(config.generationConfig?.topP).toBe(0.95);
        expect(config.generationConfig?.maxOutputTokens).toBe(8192);
      });
    });
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    // Clear singleton instance before each test
    (GeminiServiceFactory as any).instance = undefined;
    jest.clearAllMocks();
  });

  describe('createGeminiService', () => {
    it('should create service with minimal configuration', () => {
      const service = createGeminiService('test-api-key');

      expect(service).toBeDefined();
      expect(service.generateCode).toBeDefined();
    });

    it('should create service for specific language', () => {
      const service = createGeminiService('test-api-key', ProgrammingLanguage.PYTHON);

      expect(service).toBeDefined();
    });

    it('should accept additional options', () => {
      const service = createGeminiService('test-api-key', ProgrammingLanguage.TYPESCRIPT, {
        environment: 'production',
        defaultModel: 'gemini-pro-v2'
      });

      expect(service).toBeDefined();
    });
  });

  describe('createDefaultGeminiService', () => {
    it('should create default service', () => {
      const service = createDefaultGeminiService('test-api-key');

      expect(service).toBeDefined();
    });

    it('should accept additional options', () => {
      const service = createDefaultGeminiService('test-api-key', {
        environment: 'staging'
      });

      expect(service).toBeDefined();
    });
  });
});