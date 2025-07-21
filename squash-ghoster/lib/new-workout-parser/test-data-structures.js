/**
 * Unit tests for data structures module.
 */

import {
  WorkoutData,
  PatternData,
  ShotData,
  MessageData,
  TimelineEventData,
  WorkoutState,
  AutoCompleteData,
  WorkoutTemplate,
} from './data-structures.js';

/**
 * Test suite for data structures.
 */
export class DataStructuresTestSuite {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  runAllTests() {
    console.log('Running Data Structures Tests...\n');

    this.testShotData();
    this.testMessageData();
    this.testPatternData();
    this.testWorkoutData();
    this.testTimelineEventData();
    this.testWorkoutState();
    this.testAutoCompleteData();
    this.testWorkoutTemplate();

    this.printSummary();
  }

  testShotData() {
    this.runTest('ShotData constructor with defaults', () => {
      const shot = new ShotData();
      return (
        shot.id === null &&
        shot.name === null &&
        shot.type === 'Shot' &&
        shot.positionType === 'normal' &&
        Object.keys(shot.config).length === 0
      );
    });

    this.runTest('ShotData constructor with values', () => {
      const shot = new ShotData({
        id: 'test-id',
        name: 'Front Left',
        positionType: 'locked',
        config: { interval: 5.0 },
      });
      return (
        shot.id === 'test-id' &&
        shot.name === 'Front Left' &&
        shot.positionType === 'locked' &&
        shot.config.interval === 5.0
      );
    });

    this.runTest('ShotData toDict', () => {
      const shot = new ShotData({
        id: 'test-id',
        name: 'Front Left',
        config: { interval: 5.0 },
      });
      const dict = shot.toDict();
      return (
        dict.id === 'test-id' &&
        dict.name === 'Front Left' &&
        dict.type === 'Shot' &&
        dict.config.interval === 5.0
      );
    });

    this.runTest('ShotData fromDict', () => {
      const data = {
        id: 'test-id',
        name: 'Front Left',
        type: 'Shot',
        positionType: 'normal',
        config: { interval: 5.0 },
      };
      const shot = ShotData.fromDict(data);
      return (
        shot.id === 'test-id' &&
        shot.name === 'Front Left' &&
        shot.type === 'Shot' &&
        shot.config.interval === 5.0
      );
    });
  }

  testMessageData() {
    this.runTest('MessageData constructor with defaults', () => {
      const message = new MessageData();
      return (
        message.id === null &&
        message.name === null &&
        message.type === 'Message' &&
        message.positionType === 'normal' &&
        Object.keys(message.config).length === 0
      );
    });

    this.runTest('MessageData constructor with values', () => {
      const message = new MessageData({
        id: 'msg-id',
        name: 'Get ready',
        positionType: 'linked',
        config: { message: 'Get ready for the next shot' },
      });
      return (
        message.id === 'msg-id' &&
        message.name === 'Get ready' &&
        message.positionType === 'linked' &&
        message.config.message === 'Get ready for the next shot'
      );
    });

    this.runTest('MessageData toDict and fromDict', () => {
      const original = new MessageData({
        id: 'msg-id',
        name: 'Get ready',
        config: { message: 'Get ready for the next shot' },
      });
      const dict = original.toDict();
      const restored = MessageData.fromDict(dict);
      return (
        restored.id === original.id &&
        restored.name === original.name &&
        restored.config.message === original.config.message
      );
    });
  }

  testPatternData() {
    this.runTest('PatternData constructor with defaults', () => {
      const pattern = new PatternData();
      return (
        pattern.id === null &&
        pattern.name === null &&
        pattern.type === 'Pattern' &&
        pattern.positionType === 'normal' &&
        pattern.entries.length === 0
      );
    });

    this.runTest('PatternData with entries', () => {
      const shot = new ShotData({ name: 'Front Left' });
      const message = new MessageData({ name: 'Get ready' });
      const pattern = new PatternData({
        name: 'Test Pattern',
        entries: [shot, message],
      });
      return (
        pattern.name === 'Test Pattern' &&
        pattern.entries.length === 2 &&
        pattern.entries[0].type === 'Shot' &&
        pattern.entries[1].type === 'Message'
      );
    });

    this.runTest('PatternData toDict and fromDict', () => {
      const shot = new ShotData({ name: 'Front Left' });
      const pattern = new PatternData({
        name: 'Test Pattern',
        entries: [shot],
      });
      const dict = pattern.toDict();
      const restored = PatternData.fromDict(dict);
      return (
        restored.name === pattern.name &&
        restored.entries.length === pattern.entries.length &&
        restored.entries[0].name === shot.name
      );
    });
  }

  testWorkoutData() {
    this.runTest('WorkoutData constructor with defaults', () => {
      const workout = new WorkoutData();
      return workout.name === null && workout.type === 'Workout' && workout.patterns.length === 0;
    });

    this.runTest('WorkoutData with patterns', () => {
      const pattern = new PatternData({ name: 'Test Pattern' });
      const workout = new WorkoutData({
        name: 'Test Workout',
        patterns: [pattern],
      });
      return (
        workout.name === 'Test Workout' &&
        workout.patterns.length === 1 &&
        workout.patterns[0].name === 'Test Pattern'
      );
    });

    this.runTest('WorkoutData toDict and fromDict', () => {
      const pattern = new PatternData({ name: 'Test Pattern' });
      const workout = new WorkoutData({
        name: 'Test Workout',
        patterns: [pattern],
      });
      const dict = workout.toDict();
      const restored = WorkoutData.fromDict(dict);
      return (
        restored.name === workout.name &&
        restored.patterns.length === workout.patterns.length &&
        restored.patterns[0].name === pattern.name
      );
    });
  }

  testTimelineEventData() {
    this.runTest('TimelineEventData constructor', () => {
      const event = new TimelineEventData({
        name: 'Front Left',
        type: 'Shot',
        startTime: 0.0,
        endTime: 5.0,
        duration: 5.0,
        subEvents: { shot_start: 2.5 },
      });
      return (
        event.name === 'Front Left' &&
        event.type === 'Shot' &&
        event.startTime === 0.0 &&
        event.endTime === 5.0 &&
        event.duration === 5.0 &&
        event.subEvents.shot_start === 2.5
      );
    });

    this.runTest('TimelineEventData toDict and fromDict', () => {
      const original = new TimelineEventData({
        name: 'Front Left',
        type: 'Shot',
        startTime: 0.0,
        endTime: 5.0,
        duration: 5.0,
        subEvents: { shot_start: 2.5 },
      });
      const dict = original.toDict();
      const restored = TimelineEventData.fromDict(dict);
      return (
        restored.name === original.name &&
        restored.type === original.type &&
        restored.startTime === original.startTime &&
        restored.subEvents.shot_start === original.subEvents.shot_start
      );
    });
  }

  testWorkoutState() {
    this.runTest('WorkoutState constructor with defaults', () => {
      const state = new WorkoutState();
      return (
        state.currentPattern === 0 &&
        state.currentShot === 0 &&
        state.elapsedTime === 0.0 &&
        state.isPaused === false &&
        state.isCompleted === false
      );
    });

    this.runTest('WorkoutState with values', () => {
      const state = new WorkoutState({
        currentPattern: 1,
        currentShot: 2,
        elapsedTime: 15.5,
        isPaused: true,
      });
      return (
        state.currentPattern === 1 &&
        state.currentShot === 2 &&
        state.elapsedTime === 15.5 &&
        state.isPaused === true
      );
    });

    this.runTest('WorkoutState toDict and fromDict', () => {
      const original = new WorkoutState({
        currentPattern: 1,
        elapsedTime: 15.5,
        isPaused: true,
      });
      const dict = original.toDict();
      const restored = WorkoutState.fromDict(dict);
      return (
        restored.currentPattern === original.currentPattern &&
        restored.elapsedTime === original.elapsedTime &&
        restored.isPaused === original.isPaused
      );
    });
  }

  testAutoCompleteData() {
    this.runTest('AutoCompleteData constructor with defaults', () => {
      const autoComplete = new AutoCompleteData();
      return (
        autoComplete.shotNames.length === 16 &&
        autoComplete.positionTypes.length === 3 &&
        autoComplete.voiceOptions.length === 5
      );
    });

    this.runTest('AutoCompleteData with custom values', () => {
      const autoComplete = new AutoCompleteData({
        shotNames: ['Custom Shot'],
        voiceOptions: ['Custom Voice'],
      });
      return (
        autoComplete.shotNames.length === 1 &&
        autoComplete.shotNames[0] === 'Custom Shot' &&
        autoComplete.voiceOptions.length === 1 &&
        autoComplete.voiceOptions[0] === 'Custom Voice'
      );
    });

    this.runTest('AutoCompleteData toDict and fromDict', () => {
      const original = new AutoCompleteData({
        shotNames: ['Custom Shot'],
      });
      const dict = original.toDict();
      const restored = AutoCompleteData.fromDict(dict);
      return (
        restored.shotNames.length === original.shotNames.length &&
        restored.shotNames[0] === original.shotNames[0]
      );
    });
  }

  testWorkoutTemplate() {
    this.runTest('WorkoutTemplate constructor', () => {
      const template = new WorkoutTemplate({
        name: 'Test Template',
        description: 'A test template',
        category: 'Beginner',
        config: { interval: 5.0 },
        patterns: [],
      });
      return (
        template.name === 'Test Template' &&
        template.description === 'A test template' &&
        template.category === 'Beginner' &&
        template.config.interval === 5.0
      );
    });

    this.runTest('WorkoutTemplate toDict and fromDict', () => {
      const original = new WorkoutTemplate({
        name: 'Test Template',
        description: 'A test template',
        category: 'Beginner',
        config: { interval: 5.0 },
        patterns: [],
      });
      const dict = original.toDict();
      const restored = WorkoutTemplate.fromDict(dict);
      return (
        restored.name === original.name &&
        restored.description === original.description &&
        restored.category === original.category &&
        restored.config.interval === original.config.interval
      );
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
    console.log('\nData Structures Test Summary:');
    console.log(`Total tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const testSuite = new DataStructuresTestSuite();
  testSuite.runAllTests();
}
