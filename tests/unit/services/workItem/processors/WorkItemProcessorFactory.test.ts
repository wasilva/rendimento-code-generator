/**
 * Unit tests for WorkItemProcessorFactory
 * Tests processor factory functionality and processor registration
 */

import { WorkItemProcessorFactory } from '../../../../../src/services/workItem/processors';
import { WorkItemType } from '../../../../../src/models/workItem';
import { UserStoryProcessor } from '../../../../../src/services/workItem/processors/UserStoryProcessor';
import { TaskProcessor } from '../../../../../src/services/workItem/processors/TaskProcessor';
import { BugProcessor } from '../../../../../src/services/workItem/processors/BugProcessor';

describe('WorkItemProcessorFactory', () => {
  describe('getProcessor', () => {
    it('should return UserStoryProcessor for USER_STORY type', () => {
      const processor = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      
      expect(processor).toBeInstanceOf(UserStoryProcessor);
      expect(processor.supportedType).toBe(WorkItemType.USER_STORY);
    });

    it('should return TaskProcessor for TASK type', () => {
      const processor = WorkItemProcessorFactory.getProcessor(WorkItemType.TASK);
      
      expect(processor).toBeInstanceOf(TaskProcessor);
      expect(processor.supportedType).toBe(WorkItemType.TASK);
    });

    it('should return BugProcessor for BUG type', () => {
      const processor = WorkItemProcessorFactory.getProcessor(WorkItemType.BUG);
      
      expect(processor).toBeInstanceOf(BugProcessor);
      expect(processor.supportedType).toBe(WorkItemType.BUG);
    });

    it('should throw error for unsupported work item type', () => {
      expect(() => {
        WorkItemProcessorFactory.getProcessor(WorkItemType.EPIC);
      }).toThrow('No processor found for work item type: Epic');
    });

    it('should throw error for FEATURE work item type', () => {
      expect(() => {
        WorkItemProcessorFactory.getProcessor(WorkItemType.FEATURE);
      }).toThrow('No processor found for work item type: Feature');
    });

    it('should return same processor instance for multiple calls', () => {
      const processor1 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      const processor2 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      
      expect(processor1).toBe(processor2);
    });
  });

  describe('getAllProcessors', () => {
    it('should return all available processors', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      expect(processors).toHaveLength(3);
      expect(processors.some(p => p instanceof UserStoryProcessor)).toBe(true);
      expect(processors.some(p => p instanceof TaskProcessor)).toBe(true);
      expect(processors.some(p => p instanceof BugProcessor)).toBe(true);
    });

    it('should return processors with correct supported types', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      const supportedTypes = processors.map(p => p.supportedType);
      expect(supportedTypes).toContain(WorkItemType.USER_STORY);
      expect(supportedTypes).toContain(WorkItemType.TASK);
      expect(supportedTypes).toContain(WorkItemType.BUG);
    });

    it('should return array of unique processor instances', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      // Check that all processors are unique instances
      const uniqueProcessors = new Set(processors);
      expect(uniqueProcessors.size).toBe(processors.length);
    });
  });

  describe('getSupportedTypes', () => {
    it('should return all supported work item types', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      expect(supportedTypes).toHaveLength(3);
      expect(supportedTypes).toContain(WorkItemType.USER_STORY);
      expect(supportedTypes).toContain(WorkItemType.TASK);
      expect(supportedTypes).toContain(WorkItemType.BUG);
    });

    it('should not include unsupported types', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      expect(supportedTypes).not.toContain(WorkItemType.EPIC);
      expect(supportedTypes).not.toContain(WorkItemType.FEATURE);
    });

    it('should return array of WorkItemType enum values', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      supportedTypes.forEach(type => {
        expect(Object.values(WorkItemType)).toContain(type);
      });
    });
  });

  describe('Processor Registration', () => {
    it('should have processors registered for all supported types', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      supportedTypes.forEach(type => {
        expect(() => {
          WorkItemProcessorFactory.getProcessor(type);
        }).not.toThrow();
      });
    });

    it('should maintain processor type consistency', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      supportedTypes.forEach(type => {
        const processor = WorkItemProcessorFactory.getProcessor(type);
        expect(processor.supportedType).toBe(type);
      });
    });

    it('should have correct processor count', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      
      expect(processors.length).toBe(supportedTypes.length);
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error message for unsupported type', () => {
      try {
        WorkItemProcessorFactory.getProcessor(WorkItemType.EPIC);
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('No processor found');
        expect(error.message).toContain('Epic');
      }
    });

    it('should handle invalid work item type gracefully', () => {
      const invalidType = 'InvalidType' as WorkItemType;
      
      expect(() => {
        WorkItemProcessorFactory.getProcessor(invalidType);
      }).toThrow('No processor found for work item type: InvalidType');
    });
  });

  describe('Factory Pattern Implementation', () => {
    it('should implement singleton pattern for processors', () => {
      // Get the same processor multiple times
      const processor1 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      const processor2 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      const processor3 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      
      expect(processor1).toBe(processor2);
      expect(processor2).toBe(processor3);
    });

    it('should return different instances for different types', () => {
      const userStoryProcessor = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      const taskProcessor = WorkItemProcessorFactory.getProcessor(WorkItemType.TASK);
      const bugProcessor = WorkItemProcessorFactory.getProcessor(WorkItemType.BUG);
      
      expect(userStoryProcessor).not.toBe(taskProcessor);
      expect(taskProcessor).not.toBe(bugProcessor);
      expect(bugProcessor).not.toBe(userStoryProcessor);
    });

    it('should maintain processor state across calls', () => {
      const processor1 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      
      // Modify processor state (if it had any mutable state)
      // This test ensures the same instance is returned
      const processor2 = WorkItemProcessorFactory.getProcessor(WorkItemType.USER_STORY);
      
      expect(processor1).toBe(processor2);
      expect(processor1.supportedType).toBe(processor2.supportedType);
    });
  });

  describe('Integration with Processor Interfaces', () => {
    it('should return processors that implement IWorkItemProcessor interface', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      processors.forEach(processor => {
        // Check that processor has required interface methods
        expect(typeof processor.processWorkItem).toBe('function');
        expect(typeof processor.validateWorkItem).toBe('function');
        expect(typeof processor.extractSpecificFields).toBe('function');
        expect(typeof processor.generateCodePrompt).toBe('function');
        expect(processor.supportedType).toBeDefined();
      });
    });

    it('should return processors that extend BaseWorkItemProcessor', () => {
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      processors.forEach(processor => {
        // Check that processor has BaseWorkItemProcessor methods
        expect(typeof (processor as any).extractCommonFields).toBe('function');
        expect(typeof (processor as any).generateBaseCodePrompt).toBe('function');
        expect(typeof (processor as any).getProcessingStrategy).toBe('function');
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with TypeScript enum values', () => {
      // Test with all enum values to ensure type safety
      Object.values(WorkItemType).forEach(type => {
        if ([WorkItemType.USER_STORY, WorkItemType.TASK, WorkItemType.BUG].includes(type)) {
          expect(() => {
            WorkItemProcessorFactory.getProcessor(type);
          }).not.toThrow();
        } else {
          expect(() => {
            WorkItemProcessorFactory.getProcessor(type);
          }).toThrow();
        }
      });
    });

    it('should maintain type consistency in returned arrays', () => {
      const supportedTypes = WorkItemProcessorFactory.getSupportedTypes();
      const processors = WorkItemProcessorFactory.getAllProcessors();
      
      expect(supportedTypes.length).toBe(processors.length);
      
      supportedTypes.forEach(type => {
        const processor = WorkItemProcessorFactory.getProcessor(type);
        expect(processors).toContain(processor);
      });
    });
  });
});