/**
 * Unit tests for parser module.
 */

import {
  loadWorkoutFromJson,
  workoutDataToJson,
  timelineEventsToJson,
  jsonToTimelineEvents,
  generateWorkoutTimeline,
  mergeConfigs,
  getEffectiveConfig,
  loadWorkoutFromJsonWithValidation,
  serializeWorkoutToJson,
} from './parser.js';

import { WorkoutData, TimelineEventData } from './data-structures.js';

/**
 * Test suite for parser module.
 */
export class ParserTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  runAllTests() {
    console.log('Running Parser Tests...\n');

    this.testLoadWorkoutFromJson();
    this.testWorkoutDataToJson();
    this.testTimelineEventsToJson();
    this.testJsonToTimelineEvents();
    this.testGenerateWorkoutTimeline();
    this.testMergeConfigs();
    this.testGetEffectiveConfig();
    this.testLoadWorkoutFromJsonWithValidation();
    this.testSerializeWorkoutToJson();

    this.printSummary();
  }

  testLoadWorkoutFromJson() {
    this.runTest('loadWorkoutFromJson with valid data', () => {
      const jsonData = {
        type: 'Workout',
        name: 'Test Workout',
        config: { interval: 5.0 },
        patterns: [],
      };
      const workout = loadWorkoutFromJson(jsonData);
      return (
        workout instanceof WorkoutData &&
        workout.name === 'Test Workout' &&
        workout.type === 'Workout'
      );
    });

    this.runTest('loadWorkoutFromJson with null data', () => {
      try {
        loadWorkoutFromJson(null);
        return false;
      } catch (error) {
        return error.message.includes('Invalid workout data');
      }
    });

    this.runTest('loadWorkoutFromJson with invalid type', () => {
      try {
        loadWorkoutFromJson({ type: 'Invalid' });
        return false;
      } catch (error) {
        return error.message.includes('Invalid workout type');
      }
    });

    this.runTest('loadWorkoutFromJson with patterns', () => {
      const jsonData = {
        type: 'Workout',
        name: 'Test Workout',
        config: { interval: 5.0 },
        patterns: [
          {
            type: 'Pattern',
            name: 'Test Pattern',
            entries: [
              {
                type: 'Shot',
                name: 'Front Left',
                config: { repeatCount: 1 },
              },
            ],
          },
        ],
      };
      const workout = loadWorkoutFromJson(jsonData);
      return (
        workout.patterns.length === 1 &&
        workout.patterns[0].entries.length === 1 &&
        workout.patterns[0].entries[0].type === 'Shot'
      );
    });
  }

  testWorkoutDataToJson() {
    this.runTest('workoutDataToJson with valid workout', () => {
      const workout = new WorkoutData({
        name: 'Test Workout',
        config: { interval: 5.0 },
        patterns: [],
      });
      const jsonData = workoutDataToJson(workout);
      return (
        jsonData.name === 'Test Workout' &&
        jsonData.type === 'Workout' &&
        jsonData.config.interval === 5.0
      );
    });

    this.runTest('workoutDataToJson with invalid workout', () => {
      try {
        workoutDataToJson({ name: 'Invalid' });
        return false;
      } catch (error) {
        return error.message.includes('Invalid workout');
      }
    });
  }

  testTimelineEventsToJson() {
    this.runTest('timelineEventsToJson with valid timeline', () => {
      const timeline = [
        new TimelineEventData({
          name: 'Front Left',
          type: 'Shot',
          startTime: 0.0,
          endTime: 5.0,
          duration: 5.0,
          subEvents: { shot_start: 2.5 },
        }),
      ];
      const jsonTimeline = timelineEventsToJson(timeline);
      return (
        jsonTimeline.length === 1 &&
        jsonTimeline[0].name === 'Front Left' &&
        jsonTimeline[0].type === 'Shot' &&
        jsonTimeline[0].startTime === 0.0 &&
        jsonTimeline[0].subEvents.shot_start === 2.5
      );
    });

    this.runTest('timelineEventsToJson with invalid timeline', () => {
      try {
        timelineEventsToJson('not an array');
        return false;
      } catch (error) {
        return error.message.includes('Timeline must be an array');
      }
    });

    this.runTest('timelineEventsToJson with invalid event', () => {
      try {
        timelineEventsToJson([{ name: 'Invalid' }]);
        return false;
      } catch (error) {
        return error.message.includes('TimelineEventData instances');
      }
    });
  }

  testJsonToTimelineEvents() {
    this.runTest('jsonToTimelineEvents with valid data', () => {
      const jsonTimeline = [
        {
          name: 'Front Left',
          type: 'Shot',
          startTime: 0.0,
          endTime: 5.0,
          duration: 5.0,
          subEvents: { shot_start: 2.5 },
        },
      ];
      const timeline = jsonToTimelineEvents(jsonTimeline);
      return (
        timeline.length === 1 &&
        timeline[0] instanceof TimelineEventData &&
        timeline[0].name === 'Front Left' &&
        timeline[0].subEvents.shot_start === 2.5
      );
    });

    this.runTest('jsonToTimelineEvents with invalid data', () => {
      try {
        jsonToTimelineEvents('not an array');
        return false;
      } catch (error) {
        return error.message.includes('JSON timeline must be an array');
      }
    });
  }

  testGenerateWorkoutTimeline() {
    this.runTest('generateWorkoutTimeline with single shot', () => {
      const workout = new WorkoutData({
        name: 'Test Workout',
        config: { interval: 5.0, shotAnnouncementLeadTime: 2.5 },
        patterns: [
          {
            type: 'Pattern',
            entries: [
              {
                type: 'Shot',
                name: 'Front Left',
                config: { repeatCount: 1 },
              },
            ],
          },
        ],
      });
      const timeline = generateWorkoutTimeline(workout);
      return (
        timeline.length === 1 &&
        timeline[0].name === 'Front Left' &&
        timeline[0].type === 'Shot' &&
        timeline[0].startTime === 0.0
      );
    });

    this.runTest('generateWorkoutTimeline with message', () => {
      const workout = new WorkoutData({
        name: 'Test Workout',
        config: { interval: 5.0 },
        patterns: [
          {
            type: 'Pattern',
            entries: [
              {
                type: 'Message',
                config: { message: 'Get ready' },
              },
            ],
          },
        ],
      });
      const timeline = generateWorkoutTimeline(workout);
      return (
        timeline.length === 1 && timeline[0].type === 'Message' && timeline[0].name === 'Get ready'
      );
    });

    this.runTest('generateWorkoutTimeline with invalid workout', () => {
      try {
        generateWorkoutTimeline({ name: 'Invalid' });
        return false;
      } catch (error) {
        return error.message.includes('Invalid workout');
      }
    });
  }

  testMergeConfigs() {
    this.runTest('mergeConfigs with simple values', () => {
      const base = { interval: 5.0, voice: 'Default' };
      const override = { interval: 3.0 };
      const merged = mergeConfigs(base, override);
      return merged.interval === 3.0 && merged.voice === 'Default';
    });

    this.runTest('mergeConfigs with nested objects', () => {
      const base = {
        interval: 5.0,
        limits: { type: 'all-shots' },
      };
      const override = {
        limits: { type: 'shot-limit', value: 10 },
      };
      const merged = mergeConfigs(base, override);
      return (
        merged.interval === 5.0 && merged.limits.type === 'shot-limit' && merged.limits.value === 10
      );
    });

    this.runTest('mergeConfigs with null override', () => {
      const base = { interval: 5.0, voice: 'Default' };
      const merged = mergeConfigs(base, null);
      return merged.interval === 5.0 && merged.voice === 'Default';
    });

    this.runTest('mergeConfigs with undefined values', () => {
      const base = { interval: 5.0, voice: 'Default' };
      const override = { interval: undefined, voice: 'Male' };
      const merged = mergeConfigs(base, override);
      return merged.interval === 5.0 && merged.voice === 'Male';
    });
  }

  testGetEffectiveConfig() {
    this.runTest('getEffectiveConfig with all configs', () => {
      const workoutConfig = { interval: 5.0, voice: 'Default' };
      const patternConfig = { interval: 3.0 };
      const entryConfig = { voice: 'Male' };
      const effective = getEffectiveConfig(workoutConfig, patternConfig, entryConfig);
      return effective.interval === 3.0 && effective.voice === 'Male';
    });

    this.runTest('getEffectiveConfig with only workout config', () => {
      const workoutConfig = { interval: 5.0, voice: 'Default' };
      const effective = getEffectiveConfig(workoutConfig, null, null);
      return effective.interval === 5.0 && effective.voice === 'Default';
    });

    this.runTest('getEffectiveConfig with workout and pattern configs', () => {
      const workoutConfig = { interval: 5.0, voice: 'Default' };
      const patternConfig = { interval: 3.0 };
      const effective = getEffectiveConfig(workoutConfig, patternConfig, null);
      return effective.interval === 3.0 && effective.voice === 'Default';
    });
  }

  testLoadWorkoutFromJsonWithValidation() {
    this.runTest('loadWorkoutFromJsonWithValidation with valid data', () => {
      const jsonData = {
        type: 'Workout',
        name: 'Test Workout',
        config: {
          iterationType: 'in-order',
          limits: { type: 'all-shots' },
        },
        patterns: [],
      };
      const result = loadWorkoutFromJsonWithValidation(jsonData);
      return (
        result.success === true && result.workout instanceof WorkoutData && result.error === null
      );
    });

    this.runTest('loadWorkoutFromJsonWithValidation with invalid data', () => {
      const jsonData = {
        type: 'Workout',
        name: 'Test Workout',
        config: {
          iterationType: 'invalid-type',
          limits: { type: 'all-shots' },
        },
        patterns: [],
      };
      const result = loadWorkoutFromJsonWithValidation(jsonData);
      return (
        result.success === false && result.workout === null && result.validationErrors.length > 0
      );
    });

    this.runTest('loadWorkoutFromJsonWithValidation with parsing error', () => {
      const jsonData = { type: 'Workout', patterns: 'not an array' };
      const result = loadWorkoutFromJsonWithValidation(jsonData);
      return (
        result.success === false && result.workout === null && result.validationErrors.length > 0
      );
    });
  }

  testSerializeWorkoutToJson() {
    this.runTest('serializeWorkoutToJson with valid workout', () => {
      const workout = new WorkoutData({
        name: 'Test Workout',
        config: {
          iterationType: 'in-order',
          limits: { type: 'all-shots' },
        },
        patterns: [],
      });
      const result = serializeWorkoutToJson(workout);
      return (
        result.success === true &&
        result.jsonData.name === 'Test Workout' &&
        result.jsonData.type === 'Workout' &&
        result.error === null
      );
    });

    this.runTest('serializeWorkoutToJson with invalid workout', () => {
      const result = serializeWorkoutToJson({ name: 'Invalid' });
      return result.success === false && result.jsonData === null && result.error !== null;
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
    console.log('\nParser Test Summary:');
    console.log(`Total tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const testSuite = new ParserTestSuite();
  testSuite.runAllTests();
}
