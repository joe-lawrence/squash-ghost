/**
 * Unit tests for timing module.
 */

import {
  secondsToTimeStr,
  timeStrToSeconds,
  parseDuration,
  calculateEffectiveInterval,
  calculateMessageTiming,
  calculateShotTiming,
  calculatePatternTiming,
  calculateWorkoutTiming,
  calculateSubEvents,
  validateTimingConsistency,
  calculateWorkoutStats,
} from './timing.js';

/**
 * Test suite for timing module.
 */
export class TimingTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  runAllTests() {
    console.log('Running Timing Tests...\n');

    this.testSecondsToTimeStr();
    this.testTimeStrToSeconds();
    this.testParseDuration();
    this.testCalculateEffectiveInterval();
    this.testCalculateMessageTiming();
    this.testCalculateShotTiming();
    this.testCalculatePatternTiming();
    this.testCalculateWorkoutTiming();
    this.testCalculateSubEvents();
    this.testValidateTimingConsistency();
    this.testCalculateWorkoutStats();

    this.printSummary();
  }

  testSecondsToTimeStr() {
    this.runTest('secondsToTimeStr with zero', () => {
      return secondsToTimeStr(0) === '00:00.00';
    });

    this.runTest('secondsToTimeStr with whole seconds', () => {
      return secondsToTimeStr(65) === '01:05.00';
    });

    this.runTest('secondsToTimeStr with milliseconds', () => {
      return secondsToTimeStr(65.5) === '01:05.50';
    });

    this.runTest('secondsToTimeStr with negative value', () => {
      return secondsToTimeStr(-5) === '00:00.00';
    });

    this.runTest('secondsToTimeStr with large value', () => {
      return secondsToTimeStr(3661.75) === '61:01.75';
    });
  }

  testTimeStrToSeconds() {
    this.runTest('timeStrToSeconds with zero', () => {
      return timeStrToSeconds('00:00.00') === 0;
    });

    this.runTest('timeStrToSeconds with minutes and seconds', () => {
      return timeStrToSeconds('01:05.00') === 65;
    });

    this.runTest('timeStrToSeconds with milliseconds', () => {
      return timeStrToSeconds('01:05.50') === 65.5;
    });

    this.runTest('timeStrToSeconds with invalid format', () => {
      return timeStrToSeconds('invalid') === 0;
    });

    this.runTest('timeStrToSeconds with null', () => {
      return timeStrToSeconds(null) === 0;
    });
  }

  testParseDuration() {
    this.runTest('parseDuration with whole seconds', () => {
      return parseDuration('5s') === 5;
    });

    this.runTest('parseDuration with decimal seconds', () => {
      return parseDuration('2.5s') === 2.5;
    });

    this.runTest('parseDuration with invalid format', () => {
      return parseDuration('invalid') === 0;
    });

    this.runTest('parseDuration with null', () => {
      return parseDuration(null) === 0;
    });

    this.runTest('parseDuration with zero', () => {
      return parseDuration('0s') === 0;
    });
  }

  testCalculateEffectiveInterval() {
    this.runTest('calculateEffectiveInterval with fixed offset', () => {
      return calculateEffectiveInterval(5.0, null, 'fixed') === 5.0;
    });

    this.runTest('calculateEffectiveInterval with random offset', () => {
      const result = calculateEffectiveInterval(5.0, { min: 1.0, max: 2.0 }, 'random');
      return result >= 6.0 && result <= 7.0;
    });

    this.runTest('calculateEffectiveInterval with negative base interval', () => {
      return calculateEffectiveInterval(-1.0, null, 'fixed') === 0;
    });

    this.runTest('calculateEffectiveInterval with null offset config', () => {
      return calculateEffectiveInterval(5.0, null, 'random') === 5.0;
    });
  }

  testCalculateMessageTiming() {
    this.runTest('calculateMessageTiming with short message', () => {
      const timing = calculateMessageTiming('Hello', { interval: 5.0, speechRate: 1.0 }, 0);
      return (
        timing.messageStartTime === 0 &&
        timing.ttsEndTime > timing.messageStartTime &&
        timing.messageEndTime > timing.ttsEndTime &&
        timing.effectiveInterval === 5.0
      );
    });

    this.runTest('calculateMessageTiming with longer message', () => {
      const message = 'This is a longer message with more words to test TTS duration calculation';
      const timing = calculateMessageTiming(message, { interval: 3.0, speechRate: 1.0 }, 10);
      return (
        timing.messageStartTime === 10 &&
        timing.ttsEndTime > timing.messageStartTime &&
        timing.messageEndTime > timing.ttsEndTime &&
        timing.effectiveInterval === 3.0
      );
    });

    this.runTest('calculateMessageTiming with custom speech rate', () => {
      const timing = calculateMessageTiming('Test message', { interval: 5.0, speechRate: 2.0 }, 0);
      return timing.ttsDuration < 1.0; // Should be faster with higher speech rate
    });
  }

  testCalculateShotTiming() {
    this.runTest('calculateShotTiming with default config', () => {
      const timing = calculateShotTiming(
        'Front Left',
        { interval: 5.0, shotAnnouncementLeadTime: 2.5 },
        0,
      );
      return (
        timing.announcementStartTime === 0 &&
        timing.shotStartTime === 2.5 &&
        timing.shotEndTime === 7.5 &&
        timing.leadTime === 2.5 &&
        timing.effectiveInterval === 5.0
      );
    });

    this.runTest('calculateShotTiming with custom lead time', () => {
      const timing = calculateShotTiming(
        'Front Left',
        { interval: 3.0, shotAnnouncementLeadTime: 1.0 },
        10,
      );
      return (
        timing.announcementStartTime === 10 &&
        timing.shotStartTime === 11 &&
        timing.shotEndTime === 14 &&
        timing.leadTime === 1.0
      );
    });

    this.runTest('calculateShotTiming with random offset', () => {
      const timing = calculateShotTiming(
        'Front Left',
        {
          interval: 5.0,
          shotAnnouncementLeadTime: 2.5,
          intervalOffset: { min: 1.0, max: 2.0 },
          intervalOffsetType: 'random',
        },
        0,
      );
      return timing.effectiveInterval >= 6.0 && timing.effectiveInterval <= 7.0;
    });
  }

  testCalculatePatternTiming() {
    this.runTest('calculatePatternTiming with single shot', () => {
      const pattern = {
        entries: [
          {
            type: 'Shot',
            name: 'Front Left',
            config: { repeatCount: 1 },
          },
        ],
      };
      const config = { interval: 5.0, shotAnnouncementLeadTime: 2.5 };
      const timing = calculatePatternTiming(pattern, config, 0);
      return timing.patternStartTime === 0 && timing.patternEndTime > 0 && timing.totalShots === 1;
    });

    this.runTest('calculatePatternTiming with multiple entries', () => {
      const pattern = {
        entries: [
          { type: 'Shot', name: 'Front Left', config: { repeatCount: 1 } },
          { type: 'Message', name: 'Get ready', config: { message: 'Get ready' } },
        ],
      };
      const config = { interval: 5.0, shotAnnouncementLeadTime: 2.5 };
      const timing = calculatePatternTiming(pattern, config, 0);
      return timing.totalShots === 1 && timing.entryTimings.length === 2;
    });

    this.runTest('calculatePatternTiming with shot limit', () => {
      const pattern = {
        entries: [
          { type: 'Shot', name: 'Front Left', config: { repeatCount: 3 } },
          { type: 'Shot', name: 'Front Right', config: { repeatCount: 3 } },
        ],
      };
      const config = {
        interval: 5.0,
        shotAnnouncementLeadTime: 2.5,
        limits: { type: 'shot-limit', value: 4 },
      };
      const timing = calculatePatternTiming(pattern, config, 0);
      return timing.totalShots === 4;
    });
  }

  testCalculateWorkoutTiming() {
    this.runTest('calculateWorkoutTiming with single pattern', () => {
      const workout = {
        config: { interval: 5.0, shotAnnouncementLeadTime: 2.5 },
        patterns: [
          {
            entries: [{ type: 'Shot', name: 'Front Left', config: { repeatCount: 1 } }],
          },
        ],
      };
      const timing = calculateWorkoutTiming(workout);
      return (
        timing.workoutStartTime === 0 &&
        timing.workoutEndTime > 0 &&
        timing.totalShots === 1 &&
        timing.patternTimings.length === 1
      );
    });

    this.runTest('calculateWorkoutTiming with multiple patterns', () => {
      const workout = {
        config: { interval: 5.0, shotAnnouncementLeadTime: 2.5 },
        patterns: [
          { entries: [{ type: 'Shot', name: 'Front Left', config: { repeatCount: 1 } }] },
          { entries: [{ type: 'Shot', name: 'Front Right', config: { repeatCount: 1 } }] },
        ],
      };
      const timing = calculateWorkoutTiming(workout);
      return timing.totalShots === 2 && timing.patternTimings.length === 2;
    });

    this.runTest('calculateWorkoutTiming with workout shot limit', () => {
      const workout = {
        config: {
          interval: 5.0,
          shotAnnouncementLeadTime: 2.5,
          limits: { type: 'shot-limit', value: 1 },
        },
        patterns: [
          { entries: [{ type: 'Shot', name: 'Front Left', config: { repeatCount: 2 } }] },
          { entries: [{ type: 'Shot', name: 'Front Right', config: { repeatCount: 2 } }] },
        ],
      };
      const timing = calculateWorkoutTiming(workout);
      return timing.totalShots === 1;
    });
  }

  testCalculateSubEvents() {
    this.runTest('calculateSubEvents for shot', () => {
      const event = {
        type: 'Shot',
        name: 'Front Left',
        startTime: 0,
      };
      const config = { interval: 5.0, shotAnnouncementLeadTime: 2.5 };
      const subEvents = calculateSubEvents(event, config);
      return (
        subEvents.announcement_start === 0 &&
        subEvents.shot_start === 2.5 &&
        subEvents.shot_end === 7.5
      );
    });

    this.runTest('calculateSubEvents for message', () => {
      const event = {
        type: 'Message',
        config: { message: 'Get ready' },
        startTime: 0,
      };
      const config = { interval: 5.0, speechRate: 1.0 };
      const subEvents = calculateSubEvents(event, config);
      return (
        subEvents.message_start === 0 &&
        subEvents.tts_end > subEvents.message_start &&
        subEvents.message_end > subEvents.tts_end
      );
    });
  }

  testValidateTimingConsistency() {
    this.runTest('validateTimingConsistency with consistent timeline', () => {
      const timeline = [
        { startTime: 0, endTime: 5 },
        { startTime: 5, endTime: 10 },
      ];
      const errors = validateTimingConsistency(timeline);
      return errors.length === 0;
    });

    this.runTest('validateTimingConsistency with overlapping events', () => {
      const timeline = [
        { startTime: 0, endTime: 10 },
        { startTime: 5, endTime: 15 },
      ];
      const errors = validateTimingConsistency(timeline);
      return errors.length > 0;
    });

    this.runTest('validateTimingConsistency with single event', () => {
      const timeline = [{ startTime: 0, endTime: 5 }];
      const errors = validateTimingConsistency(timeline);
      return errors.length === 0;
    });
  }

  testCalculateWorkoutStats() {
    this.runTest('calculateWorkoutStats with mixed events', () => {
      const timeline = [
        { type: 'Shot', startTime: 0, endTime: 5 },
        { type: 'Message', startTime: 5, endTime: 8 },
        { type: 'Shot', startTime: 8, endTime: 13 },
      ];
      const stats = calculateWorkoutStats(timeline);
      return (
        stats.totalEvents === 3 &&
        stats.totalShots === 2 &&
        stats.totalMessages === 1 &&
        stats.totalDuration === 13 &&
        stats.eventTypes.Shot === 2 &&
        stats.eventTypes.Message === 1
      );
    });

    this.runTest('calculateWorkoutStats with empty timeline', () => {
      const timeline = [];
      const stats = calculateWorkoutStats(timeline);
      return (
        stats.totalEvents === 0 &&
        stats.totalShots === 0 &&
        stats.totalMessages === 0 &&
        stats.totalDuration === 0
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
    console.log('\nTiming Test Summary:');
    console.log(`Total tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const testSuite = new TimingTestSuite();
  testSuite.runAllTests();
}
