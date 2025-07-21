/**
 * Unit tests for validation module.
 */

import {
  ValidationError,
  ValidationResult,
  validateWorkout,
  validateWorkoutConfig,
  validatePatternConfig,
  validateShotConfig,
  validateMessageConfig,
  validateTimeline,
} from './validation.js';

/**
 * Test suite for validation module.
 */
export class ValidationTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  runAllTests() {
    console.log('Running Validation Tests...\n');

    this.testValidationError();
    this.testValidationResult();
    this.testValidateWorkout();
    this.testValidateWorkoutConfig();
    this.testValidatePatternConfig();
    this.testValidateShotConfig();
    this.testValidateMessageConfig();
    this.testValidateTimeline();

    this.printSummary();
  }

  testValidationError() {
    this.runTest('ValidationError constructor with defaults', () => {
      const error = new ValidationError({ message: 'Test error' });
      return (
        error.field === null &&
        error.message === 'Test error' &&
        error.value === null &&
        error.suggestions.length === 0
      );
    });

    this.runTest('ValidationError constructor with all values', () => {
      const error = new ValidationError({
        field: 'test.field',
        message: 'Test error',
        value: 'test_value',
        suggestions: ['suggestion1', 'suggestion2'],
      });
      return (
        error.field === 'test.field' &&
        error.message === 'Test error' &&
        error.value === 'test_value' &&
        error.suggestions.length === 2
      );
    });

    this.runTest('ValidationError toDict', () => {
      const error = new ValidationError({
        field: 'test.field',
        message: 'Test error',
        value: 'test_value',
        suggestions: ['suggestion1'],
      });
      const dict = error.toDict();
      return (
        dict.field === 'test.field' &&
        dict.message === 'Test error' &&
        dict.value === 'test_value' &&
        dict.suggestions.length === 1
      );
    });
  }

  testValidationResult() {
    this.runTest('ValidationResult constructor with defaults', () => {
      const result = new ValidationResult();
      return result.isValid === true && result.errors.length === 0;
    });

    this.runTest('ValidationResult constructor with values', () => {
      const error = new ValidationError({ message: 'Test error' });
      const result = new ValidationResult({ isValid: false, errors: [error] });
      return result.isValid === false && result.errors.length === 1;
    });

    this.runTest('ValidationResult addError', () => {
      const result = new ValidationResult();
      const error = new ValidationError({ message: 'Test error' });
      result.addError(error);
      return result.isValid === false && result.errors.length === 1;
    });

    this.runTest('ValidationResult merge', () => {
      const result1 = new ValidationResult();
      const result2 = new ValidationResult();
      const error = new ValidationError({ message: 'Test error' });
      result2.addError(error);
      result1.merge(result2);
      return result1.isValid === false && result1.errors.length === 1;
    });

    this.runTest('ValidationResult toDict', () => {
      const result = new ValidationResult();
      const error = new ValidationError({ message: 'Test error' });
      result.addError(error);
      const dict = result.toDict();
      return dict.isValid === false && dict.errors.length === 1;
    });
  }

  testValidateWorkout() {
    this.runTest('validateWorkout with null data', () => {
      const result = validateWorkout(null);
      return result.isValid === false && result.errors.length > 0;
    });

    this.runTest('validateWorkout with invalid type', () => {
      const result = validateWorkout({ type: 'Invalid' });
      return result.isValid === false && result.errors.some(e => e.field === 'type');
    });

    this.runTest('validateWorkout with valid data', () => {
      const workout = {
        type: 'Workout',
        config: {
          iterationType: 'in-order',
          limits: { type: 'all-shots' },
        },
        patterns: [],
      };
      const result = validateWorkout(workout);
      return result.isValid === true;
    });

    this.runTest('validateWorkout with invalid patterns', () => {
      const workout = {
        type: 'Workout',
        config: {
          iterationType: 'in-order',
          limits: { type: 'all-shots' },
        },
        patterns: 'not an array',
      };
      const result = validateWorkout(workout);
      return result.isValid === false && result.errors.some(e => e.field === 'patterns');
    });
  }

  testValidateWorkoutConfig() {
    this.runTest('validateWorkoutConfig with valid data', () => {
      const config = {
        iterationType: 'in-order',
        limits: { type: 'all-shots' },
      };
      const errors = validateWorkoutConfig(config);
      return errors.length === 0;
    });

    this.runTest('validateWorkoutConfig with invalid iteration type', () => {
      const config = {
        iterationType: 'invalid-type',
        limits: { type: 'all-shots' },
      };
      const errors = validateWorkoutConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'iterationType');
    });

    this.runTest('validateWorkoutConfig with invalid limits', () => {
      const config = {
        iterationType: 'in-order',
        limits: { type: 'invalid-limit' },
      };
      const errors = validateWorkoutConfig(config);
      return errors.length > 0 && errors.some(e => e.field.includes('limits'));
    });
  }

  testValidatePatternConfig() {
    this.runTest('validatePatternConfig with valid data', () => {
      const config = {
        iterationType: 'shuffle',
        repeatCount: 3,
      };
      const errors = validatePatternConfig(config);
      return errors.length === 0;
    });

    this.runTest('validatePatternConfig with invalid repeat count', () => {
      const config = {
        repeatCount: -1,
      };
      const errors = validatePatternConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'repeatCount');
    });

    this.runTest('validatePatternConfig with invalid iteration type', () => {
      const config = {
        iterationType: 'invalid-type',
      };
      const errors = validatePatternConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'iterationType');
    });
  }

  testValidateShotConfig() {
    this.runTest('validateShotConfig with valid data', () => {
      const config = {
        repeatCount: 5,
      };
      const errors = validateShotConfig(config);
      return errors.length === 0;
    });

    this.runTest('validateShotConfig with invalid repeat count', () => {
      const config = {
        repeatCount: 0,
      };
      const errors = validateShotConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'repeatCount');
    });

    this.runTest('validateShotConfig with invalid interval', () => {
      const config = {
        interval: -1,
      };
      const errors = validateShotConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'interval');
    });
  }

  testValidateMessageConfig() {
    this.runTest('validateMessageConfig with valid data', () => {
      const config = {
        message: 'Test message',
        intervalType: 'fixed',
      };
      const errors = validateMessageConfig(config);
      return errors.length === 0;
    });

    this.runTest('validateMessageConfig with invalid interval type', () => {
      const config = {
        intervalType: 'invalid-type',
      };
      const errors = validateMessageConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'intervalType');
    });

    this.runTest('validateMessageConfig with missing interval type', () => {
      const config = {
        interval: '5s',
      };
      const errors = validateMessageConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'intervalType');
    });

    this.runTest('validateMessageConfig with invalid message', () => {
      const config = {
        message: 123,
      };
      const errors = validateMessageConfig(config);
      return errors.length > 0 && errors.some(e => e.field === 'message');
    });
  }

  testValidateTimeline() {
    this.runTest('validateTimeline with valid data', () => {
      const timeline = [
        {
          name: 'Shot 1',
          type: 'Shot',
          startTime: 0.0,
          endTime: 5.0,
          duration: 5.0,
          subEvents: {},
        },
        {
          name: 'Shot 2',
          type: 'Shot',
          startTime: 5.0,
          endTime: 10.0,
          duration: 5.0,
          subEvents: {},
        },
      ];
      const result = validateTimeline(timeline);
      return result.isValid && result.errors.length === 0;
    });

    this.runTest('validateTimeline with invalid event', () => {
      const timeline = [
        {
          name: 'Shot 1',
          type: 'Shot',
          startTime: 0.0,
          endTime: 5.0,
          duration: 5.0,
          subEvents: {},
        },
        {
          name: null,
          type: 'Shot',
          startTime: 5.0,
          endTime: 10.0,
          duration: 5.0,
          subEvents: {},
        },
      ];
      const result = validateTimeline(timeline);
      return (
        !result.isValid &&
        result.errors.length > 0 &&
        result.errors.some(e => e.field.includes('name'))
      );
    });

    this.runTest('validateTimeline with timing inconsistency', () => {
      const timeline = [
        {
          name: 'Shot 1',
          type: 'Shot',
          startTime: 0.0,
          endTime: 10.0,
          duration: 10.0,
          subEvents: {},
        },
        {
          name: 'Shot 2',
          type: 'Shot',
          startTime: 5.0,
          endTime: 15.0,
          duration: 10.0,
          subEvents: {},
        },
      ];
      const result = validateTimeline(timeline);
      return !result.isValid && result.errors.length > 0;
    });
  }

  runTest(name, testFunction) {
    try {
      const result = testFunction();
      if (result) {
        console.log(`✅ ${name}`);
        this.passed++;
      } else {
        console.log(`❌ ${name} - Test returned false`);
        this.failed++;
      }
    } catch (error) {
      console.log(`❌ ${name} - Error: ${error.message}`);
      this.failed++;
    }
  }

  printSummary() {
    console.log('\nValidation Test Summary:');
    console.log(`Total tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const testSuite = new ValidationTestSuite();
  testSuite.runAllTests();
}
