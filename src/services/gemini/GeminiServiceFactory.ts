/**
 * GeminiServiceFactory - Factory for creating and configuring GeminiService instances
 * Provides centralized configuration and instance management
 */

import { GeminiService, IGeminiConfig, IGeminiService } from './GeminiService';
import { ProgrammingLanguage } from '../../models/codeGeneration';

/**
 * Configuration interface for the Gemini service factory
 */
export interface IGeminiServiceFactoryConfig {
  /** Google API key */
  apiKey: string;
  
  /** Default model to use */
  defaultModel?: string;
  
  /** Environment-specific settings */
  environment?: 'development' | 'staging' | 'production';
  
  /** Language-specific configurations */
  languageConfigs?: Partial<Record<ProgrammingLanguage, Partial<IGeminiConfig>>>;
  
  /** Global timeout settings */
  timeouts?: {
    /** Default timeout for all requests */
    default: number;
    
    /** Timeout for code generation requests */
    codeGeneration: number;
    
    /** Timeout for validation requests */
    validation: number;
    
    /** Timeout for code fixing requests */
    codeFix: number;
  };
  
  /** Retry configuration */
  retryConfig?: {
    /** Maximum number of retries */
    maxRetries: number;
    
    /** Base delay for exponential backoff */
    baseDelay: number;
    
    /** Maximum delay between retries */
    maxDelay: number;
  };
}

/**
 * Factory class for creating GeminiService instances
 */
export class GeminiServiceFactory {
  private static instance: GeminiServiceFactory;
  private serviceInstances: Map<string, IGeminiService> = new Map();
  private config: IGeminiServiceFactoryConfig;

  private constructor(config: IGeminiServiceFactoryConfig) {
    this.config = this.validateAndNormalizeConfig(config);
  }

  /**
   * Get or create the singleton factory instance
   */
  static getInstance(config?: IGeminiServiceFactoryConfig): GeminiServiceFactory {
    if (!GeminiServiceFactory.instance) {
      if (!config) {
        throw new Error('Configuration is required for first-time factory initialization');
      }
      GeminiServiceFactory.instance = new GeminiServiceFactory(config);
    }
    return GeminiServiceFactory.instance;
  }

  /**
   * Create a GeminiService instance for a specific language
   */
  createService(language: ProgrammingLanguage): IGeminiService {
    const cacheKey = `${language}-${this.config.environment || 'default'}`;
    
    if (this.serviceInstances.has(cacheKey)) {
      return this.serviceInstances.get(cacheKey)!;
    }

    const serviceConfig = this.buildServiceConfig(language);
    const service = new GeminiService(serviceConfig);
    
    this.serviceInstances.set(cacheKey, service);
    return service;
  }

  /**
   * Create a default GeminiService instance
   */
  createDefaultService(): IGeminiService {
    return this.createService(ProgrammingLanguage.TYPESCRIPT);
  }

  /**
   * Get service configuration for a specific language
   */
  getServiceConfig(language: ProgrammingLanguage): IGeminiConfig {
    return this.buildServiceConfig(language);
  }

  /**
   * Update factory configuration
   */
  updateConfig(newConfig: Partial<IGeminiServiceFactoryConfig>): void {
    this.config = this.validateAndNormalizeConfig({
      ...this.config,
      ...newConfig
    });
    
    // Clear cached instances to force recreation with new config
    this.serviceInstances.clear();
  }

  /**
   * Clear all cached service instances
   */
  clearCache(): void {
    this.serviceInstances.clear();
  }

  /**
   * Build service configuration for a specific language
   */
  private buildServiceConfig(language: ProgrammingLanguage): IGeminiConfig {
    const baseConfig: IGeminiConfig = {
      apiKey: this.config.apiKey,
      model: this.config.defaultModel || this.getDefaultModelForLanguage(language),
      timeout: this.config.timeouts?.codeGeneration || this.config.timeouts?.default || 30000,
      maxRetries: this.config.retryConfig?.maxRetries || 3,
      baseDelay: this.config.retryConfig?.baseDelay || 1000,
      generationConfig: this.getGenerationConfigForLanguage(language)
    };

    // Apply language-specific overrides
    const languageConfig = this.config.languageConfigs?.[language];
    if (languageConfig) {
      return {
        ...baseConfig,
        ...languageConfig
      };
    }

    return baseConfig;
  }

  /**
   * Get default model for a specific programming language
   */
  private getDefaultModelForLanguage(language: ProgrammingLanguage): string {
    switch (language) {
      case ProgrammingLanguage.TYPESCRIPT:
      case ProgrammingLanguage.JAVASCRIPT:
        return 'gemini-pro';
      case ProgrammingLanguage.PYTHON:
        return 'gemini-pro';
      case ProgrammingLanguage.JAVA:
        return 'gemini-pro';
      case ProgrammingLanguage.CSHARP:
        return 'gemini-pro';
      default:
        return 'gemini-pro';
    }
  }

  /**
   * Get generation configuration optimized for a specific language
   */
  private getGenerationConfigForLanguage(language: ProgrammingLanguage) {
    const baseConfig = {
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    switch (language) {
      case ProgrammingLanguage.TYPESCRIPT:
      case ProgrammingLanguage.JAVASCRIPT:
        return {
          ...baseConfig,
          temperature: 0.7, // Balanced creativity for web development
        };
      
      case ProgrammingLanguage.PYTHON:
        return {
          ...baseConfig,
          temperature: 0.6, // Slightly more conservative for Python
        };
      
      case ProgrammingLanguage.JAVA:
        return {
          ...baseConfig,
          temperature: 0.5, // More conservative for enterprise Java
        };
      
      case ProgrammingLanguage.CSHARP:
        return {
          ...baseConfig,
          temperature: 0.5, // Conservative for .NET development
        };
      
      default:
        return {
          ...baseConfig,
          temperature: 0.7,
        };
    }
  }

  /**
   * Validate and normalize factory configuration
   */
  private validateAndNormalizeConfig(config: IGeminiServiceFactoryConfig): IGeminiServiceFactoryConfig {
    if (!config.apiKey) {
      throw new Error('Google API key is required');
    }

    return {
      ...config,
      environment: config.environment || 'development',
      timeouts: {
        default: 30000,
        codeGeneration: 45000,
        validation: 20000,
        codeFix: 25000,
        ...config.timeouts
      },
      retryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        ...config.retryConfig
      }
    };
  }
}

/**
 * Utility function to create a GeminiService instance with minimal configuration
 */
export function createGeminiService(
  apiKey: string, 
  language: ProgrammingLanguage = ProgrammingLanguage.TYPESCRIPT,
  options?: Partial<IGeminiServiceFactoryConfig>
): IGeminiService {
  const factory = GeminiServiceFactory.getInstance({
    apiKey,
    ...options
  });
  
  return factory.createService(language);
}

/**
 * Utility function to create a default GeminiService instance
 */
export function createDefaultGeminiService(
  apiKey: string,
  options?: Partial<IGeminiServiceFactoryConfig>
): IGeminiService {
  const factory = GeminiServiceFactory.getInstance({
    apiKey,
    ...options
  });
  
  return factory.createDefaultService();
}