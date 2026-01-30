/**
 * Property-based tests for GitService
 * Tests universal properties that must hold for all Git operations
 */

import * as fc from 'fast-check';
import { GitService } from '../../../../src/services/git/GitService';
import { IEnrichedWorkItem, WorkItemType } from '../../../../src/models/workItem';

describe('GitService Property Tests', () => {
  let gitService: GitService;

  beforeEach(() => {
    gitService = new GitService();
  });

  describe('Property 8: Branch Naming Convention', () => {
    it('should always generate valid Git branch names following feat/{id}_{title} pattern', () => {
      /**
       * **Feature: redimento-code-generator, Property 8: Branch Naming Convention**
       * **Validates: Requirements 4.1, 4.2**
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 999999 }),
            type: fc.constantFrom('User Story', 'Task', 'Bug', 'Feature'),
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            areaPath: fc.string(),
            iterationPath: fc.string(),
            state: fc.string(),
            priority: fc.integer({ min: 1, max: 4 }),
            tags: fc.array(fc.string()),
            customFields: fc.dictionary(fc.string(), fc.anything())
          }),
          (workItemData) => {
            const workItem: IEnrichedWorkItem = {
              ...workItemData,
              type: workItemData.type as WorkItemType
            };

            const branchName = gitService.generateBranchName(workItem);

            // Property: Branch name must follow pattern prefix/{id}_{sanitized_title}
            const branchPattern = /^(feat|bugfix)\/\d+_[a-z0-9\-_]+$/;
            expect(branchName).toMatch(branchPattern);

            // Property: Branch name must be valid Git identifier
            expect(gitService.validateBranchName(branchName)).toBe(true);

            // Property: Branch name must contain work item ID
            expect(branchName).toContain(workItem.id.toString());

            // Property: Branch name must not exceed maximum length
            expect(branchName.length).toBeLessThanOrEqual(250);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should always validate branch names according to Git rules', () => {
      /**
       * **Feature: redimento-code-generator, Property 8: Branch Naming Convention**
       * **Validates: Requirements 4.2**
       */
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 300 }),
          (branchName) => {
            const isValid = gitService.validateBranchName(branchName);

            // Property: Invalid characters should make branch name invalid
            const hasInvalidChars = /[~^:?*[\]\\@{}<>|!"']/.test(branchName);
            const hasConsecutiveSlashes = /\/\/+/.test(branchName);
            const hasInvalidStartEnd = /^[.\-\/\s]|[.\-\/\s]$/.test(branchName);
            const endsWithLock = branchName.endsWith('.lock');
            const tooLong = branchName.length > 250;
            const hasSpaces = /\s/.test(branchName);
            const isOnlyWhitespace = /^\s*$/.test(branchName);

            if (hasInvalidChars || hasConsecutiveSlashes || hasInvalidStartEnd || endsWithLock || tooLong || hasSpaces || isOnlyWhitespace) {
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 9: Commit Message Consistency', () => {
    it('should always generate commit messages with work item ID and description', () => {
      /**
       * **Feature: redimento-code-generator, Property 9: Commit Message Consistency**
       * **Validates: Requirements 4.3, 4.4**
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 999999 }),
            type: fc.constantFrom('User Story', 'Task', 'Bug', 'Feature'),
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), // Ensure title has non-whitespace content
            areaPath: fc.string({ minLength: 1 }),
            iterationPath: fc.string(),
            state: fc.string(),
            priority: fc.integer({ min: 1, max: 4 }),
            tags: fc.array(fc.string()),
            customFields: fc.dictionary(fc.string(), fc.anything())
          }),
          fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0), // Ensure description has content
          (workItemData, description) => {
            const workItem: IEnrichedWorkItem = {
              ...workItemData,
              type: workItemData.type as WorkItemType
            };

            const commitMessage = gitService.generateCommitMessage(workItem, description);

            // Property: Commit message must contain work item ID
            expect(commitMessage).toContain(`#${workItem.id}`);

            // Property: Commit message must contain work item title (or fallback if empty)
            const expectedTitle = workItem.title.trim() || 'Untitled Work Item';
            expect(commitMessage).toContain(expectedTitle);

            // Property: Commit message must contain description
            expect(commitMessage).toContain(description);

            // Property: Commit message must follow conventional commit format
            const conventionalPattern = /^(feat|fix|bugfix|task|chore)\([^)]+\):/;
            expect(commitMessage).toMatch(conventionalPattern);

            // Property: Commit message must contain "Work Item:" section
            expect(commitMessage).toContain('Work Item:');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Automated Git Operations', () => {
    it('should generate consistent branch names for same work items', () => {
      /**
       * **Feature: redimento-code-generator, Property 10: Automated Git Operations**
       * **Validates: Requirements 4.1, 4.2**
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 999999 }),
            type: fc.constantFrom('User Story', 'Task', 'Bug', 'Feature'),
            title: fc.string({ minLength: 1, maxLength: 100 }),
            areaPath: fc.string(),
            iterationPath: fc.string(),
            state: fc.string(),
            priority: fc.integer({ min: 1, max: 4 }),
            tags: fc.array(fc.string()),
            customFields: fc.dictionary(fc.string(), fc.anything())
          }),
          (workItemData) => {
            const workItem: IEnrichedWorkItem = {
              ...workItemData,
              type: workItemData.type as WorkItemType
            };

            // Property: Same work item should always generate same branch name
            const branchName1 = gitService.generateBranchName(workItem);
            const branchName2 = gitService.generateBranchName(workItem);
            
            expect(branchName1).toBe(branchName2);

            // Property: Branch name should be deterministic based on work item properties
            const workItemCopy = { ...workItem };
            const branchName3 = gitService.generateBranchName(workItemCopy);
            
            expect(branchName1).toBe(branchName3);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Branch Name Sanitization Properties', () => {
    it('should always produce safe branch names from any input', () => {
      /**
       * **Feature: redimento-code-generator, Property 8: Branch Naming Convention**
       * **Validates: Requirements 4.2**
       */
      fc.assert(
        fc.property(
          fc.record({
            id: fc.integer({ min: 1, max: 999999 }),
            type: fc.constantFrom('User Story', 'Task', 'Bug', 'Feature'),
            title: fc.string({ minLength: 1, maxLength: 200 }), // Allow any characters in title
            areaPath: fc.string(),
            iterationPath: fc.string(),
            state: fc.string(),
            priority: fc.integer({ min: 1, max: 4 }),
            tags: fc.array(fc.string()),
            customFields: fc.dictionary(fc.string(), fc.anything())
          }),
          (workItemData) => {
            const workItem: IEnrichedWorkItem = {
              ...workItemData,
              type: workItemData.type as WorkItemType
            };

            const branchName = gitService.generateBranchName(workItem);

            // Property: Generated branch name must always be valid
            expect(gitService.validateBranchName(branchName)).toBe(true);

            // Property: Branch name must not contain forbidden characters
            expect(branchName).not.toMatch(/[~^:?*[\]\\@{}<>|]/);

            // Property: Branch name must not have consecutive slashes
            expect(branchName).not.toMatch(/\/\/+/);

            // Property: Branch name must not start/end with forbidden chars
            expect(branchName).not.toMatch(/^[.\-\/]|[.\-\/]$/);

            // Property: Branch name must not end with .lock
            expect(branchName).not.toMatch(/\.lock$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});