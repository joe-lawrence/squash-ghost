/**
 * Unit tests for configuration module.
 */

import {
  ConfigLevel,
  SplitStepSpeed,
  IterationType,
  IntervalOffsetType,
  LimitsType,
  IntervalType,
  IntervalOffsetConfig,
  LimitsConfig,
  BaseConfig,
  WorkoutConfig,
  PatternConfig,
  ShotConfig,
  MessageConfig,
  ConfigurationManager,
} from './config.js';

/**
 * Test suite for configuration module.
 */
export class ConfigTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
  }

  runAllTests() {
    console.log('Running Configuration Tests...\n');

    this.testEnums();
    this.testIntervalOffsetConfig();
    this.testLimitsConfig();
    this.testBaseConfig();
    this.testWorkoutConfig();
    this.testPatternConfig();
    this.testShotConfig();
    this.testMessageConfig();
    this.testConfigurationManager();

    this.printSummary();
  }

  testEnums() {
    this.runTest('ConfigLevel enum values', () => {
      return (
        ConfigLevel.WORKOUT === 'workout' &&
        ConfigLevel.PATTERN === 'pattern' &&
        ConfigLevel.SHOT === 'shot' &&
        ConfigLevel.MESSAGE === 'message'
      );
    });

    this.runTest('SplitStepSpeed enum values', () => {
      return (
        SplitStepSpeed.NONE === 'none' &&
        SplitStepSpeed.SLOW === 'slow' &&
        SplitStepSpeed.MEDIUM === 'medium' &&
        SplitStepSpeed.FAST === 'fast' &&
        SplitStepSpeed.RANDOM === 'random' &&
        SplitStepSpeed.AUTO_SCALE === 'auto-scale'
      );
    });

    this.runTest('IterationType enum values', () => {
      return IterationType.IN_ORDER === 'in-order' && IterationType.SHUFFLE === 'shuffle';
    });

    this.runTest('LimitsType enum values', () => {
      return (
        LimitsType.ALL_SHOTS === 'all-shots' &&
        LimitsType.SHOT_LIMIT === 'shot-limit' &&
        LimitsType.TIME_LIMIT === 'time-limit'
      );
    });
  }

  testIntervalOffsetConfig() {
    this.runTest('IntervalOffsetConfig constructor with defaults', () => {
      const config = new IntervalOffsetConfig();
      return config.min === 0.0 && config.max === 0.0;
    });

    this.runTest('IntervalOffsetConfig constructor with values', () => {
      const config = new IntervalOffsetConfig({ min: 1.0, max: 3.0 });
      return config.min === 1.0 && config.max === 3.0;
    });

    this.runTest('IntervalOffsetConfig toDict and fromDict', () => {
      const original = new IntervalOffsetConfig({ min: 1.0, max: 3.0 });
      const dict = original.toDict();
      const restored = IntervalOffsetConfig.fromDict(dict);
      return restored.min === original.min && restored.max === original.max;
    });
  }

  testLimitsConfig() {
    this.runTest('LimitsConfig constructor with defaults', () => {
      const config = new LimitsConfig();
      return config.type === LimitsType.ALL_SHOTS && config.value === null;
    });

    this.runTest('LimitsConfig constructor with shot limit', () => {
      const config = new LimitsConfig({ type: LimitsType.SHOT_LIMIT, value: 10 });
      return config.type === LimitsType.SHOT_LIMIT && config.value === 10;
    });

    this.runTest('LimitsConfig toDict and fromDict', () => {
      const original = new LimitsConfig({ type: LimitsType.TIME_LIMIT, value: 300 });
      const dict = original.toDict();
      const restored = LimitsConfig.fromDict(dict);
      return restored.type === original.type && restored.value === original.value;
    });
  }

  testBaseConfig() {
    this.runTest('BaseConfig constructor with defaults', () => {
      const config = new BaseConfig();
      return (
        config.voice === 'Default' &&
        config.speechRate === 1.0 &&
        config.interval === 5.0 &&
        config.splitStepSpeed === SplitStepSpeed.AUTO_SCALE &&
        config.shotAnnouncementLeadTime === 2.5 &&
        config.intervalOffsetType === IntervalOffsetType.FIXED &&
        config.autoVoiceSplitStep === true
      );
    });

    this.runTest('BaseConfig constructor with values', () => {
      const config = new BaseConfig({
        voice: 'Male',
        speechRate: 1.5,
        interval: 3.0,
        splitStepSpeed: SplitStepSpeed.FAST,
      });
      return (
        config.voice === 'Male' &&
        config.speechRate === 1.5 &&
        config.interval === 3.0 &&
        config.splitStepSpeed === SplitStepSpeed.FAST
      );
    });

    this.runTest('BaseConfig toDict and fromDict', () => {
      const original = new BaseConfig({
        voice: 'Female',
        speechRate: 0.8,
        interval: 4.0,
      });
      const dict = original.toDict();
      const restored = BaseConfig.fromDict(dict);
      return (
        restored.voice === original.voice &&
        restored.speechRate === original.speechRate &&
        restored.interval === original.interval
      );
    });
  }

  testWorkoutConfig() {
    this.runTest('WorkoutConfig constructor with defaults', () => {
      const config = new WorkoutConfig();
      return (
        config.iterationType === IterationType.IN_ORDER &&
        config.limits instanceof LimitsConfig &&
        config.limits.type === LimitsType.ALL_SHOTS
      );
    });

    this.runTest('WorkoutConfig constructor with values', () => {
      const config = new WorkoutConfig({
        iterationType: IterationType.SHUFFLE,
        limits: new LimitsConfig({ type: LimitsType.SHOT_LIMIT, value: 20 }),
      });
      return (
        config.iterationType === IterationType.SHUFFLE &&
        config.limits.type === LimitsType.SHOT_LIMIT &&
        config.limits.value === 20
      );
    });

    this.runTest('WorkoutConfig toDict and fromDict', () => {
      const original = new WorkoutConfig({
        iterationType: IterationType.SHUFFLE,
        limits: new LimitsConfig({ type: LimitsType.TIME_LIMIT, value: 600 }),
      });
      const dict = original.toDict();
      const restored = WorkoutConfig.fromDict(dict);
      return (
        restored.iterationType === original.iterationType &&
        restored.limits.type === original.limits.type &&
        restored.limits.value === original.limits.value
      );
    });
  }

  testPatternConfig() {
    this.runTest('PatternConfig constructor with defaults', () => {
      const config = new PatternConfig();
      return config.iterationType === null && config.limits === null && config.repeatCount === null;
    });

    this.runTest('PatternConfig constructor with values', () => {
      const config = new PatternConfig({
        iterationType: IterationType.SHUFFLE,
        repeatCount: 3,
      });
      return config.iterationType === IterationType.SHUFFLE && config.repeatCount === 3;
    });

    this.runTest('PatternConfig toDict and fromDict', () => {
      const original = new PatternConfig({
        iterationType: IterationType.IN_ORDER,
        repeatCount: 2,
      });
      const dict = original.toDict();
      const restored = PatternConfig.fromDict(dict);
      return (
        restored.iterationType === original.iterationType &&
        restored.repeatCount === original.repeatCount
      );
    });
  }

  testShotConfig() {
    this.runTest('ShotConfig constructor with defaults', () => {
      const config = new ShotConfig();
      return config.repeatCount === 1;
    });

    this.runTest('ShotConfig constructor with values', () => {
      const config = new ShotConfig({ repeatCount: 5 });
      return config.repeatCount === 5;
    });

    this.runTest('ShotConfig toDict and fromDict', () => {
      const original = new ShotConfig({ repeatCount: 3 });
      const dict = original.toDict();
      const restored = ShotConfig.fromDict(dict);
      return restored.repeatCount === original.repeatCount;
    });
  }

  testMessageConfig() {
    this.runTest('MessageConfig constructor with defaults', () => {
      const config = new MessageConfig();
      return (
        config.message === '' &&
        config.messageInterval === '0s' &&
        config.skipAtEndOfWorkout === false &&
        config.intervalType === null
      );
    });

    this.runTest('MessageConfig constructor with values', () => {
      const config = new MessageConfig({
        message: 'Get ready',
        messageInterval: '2s',
        skipAtEndOfWorkout: true,
        intervalType: IntervalType.FIXED,
      });
      return (
        config.message === 'Get ready' &&
        config.messageInterval === '2s' &&
        config.skipAtEndOfWorkout === true &&
        config.intervalType === IntervalType.FIXED
      );
    });

    this.runTest('MessageConfig toDict and fromDict', () => {
      const original = new MessageConfig({
        message: 'Test message',
        intervalType: IntervalType.ADDITIONAL,
      });
      const dict = original.toDict();
      const restored = MessageConfig.fromDict(dict);
      return (
        restored.message === original.message && restored.intervalType === original.intervalType
      );
    });
  }

  testConfigurationManager() {
    this.runTest('ConfigurationManager.getDefaultConfig for workout', () => {
      const config = ConfigurationManager.getDefaultConfig(ConfigLevel.WORKOUT);
      return (
        config.iterationType === IterationType.IN_ORDER &&
        config.limits.type === LimitsType.ALL_SHOTS
      );
    });

    this.runTest('ConfigurationManager.buildWorkoutConfig', () => {
      const configData = {
        iterationType: IterationType.SHUFFLE,
        limits: { type: LimitsType.SHOT_LIMIT, value: 15 },
      };
      const config = ConfigurationManager.buildWorkoutConfig(configData);
      return (
        config.iterationType === IterationType.SHUFFLE &&
        config.limits.type === LimitsType.SHOT_LIMIT &&
        config.limits.value === 15
      );
    });

    this.runTest('ConfigurationManager.buildPatternConfig', () => {
      const workoutConfig = new WorkoutConfig();
      const patternConfigData = { repeatCount: 3 };
      const config = ConfigurationManager.buildPatternConfig(workoutConfig, patternConfigData);
      return config.repeatCount === 3 && config.iterationType === workoutConfig.iterationType;
    });

    this.runTest('ConfigurationManager.mergeConfigs', () => {
      const base = { interval: 5.0, voice: 'Default' };
      const override = { interval: 3.0 };
      const merged = ConfigurationManager.mergeConfigs(base, override);
      return merged.interval === 3.0 && merged.voice === 'Default';
    });

    this.runTest('ConfigurationManager.getConfigValue', () => {
      const config = { interval: 5.0 };
      const value = ConfigurationManager.getConfigValue(config, 'interval', 10.0);
      const missingValue = ConfigurationManager.getConfigValue(config, 'missing', 10.0);
      return value === 5.0 && missingValue === 10.0;
    });

    this.runTest('ConfigurationManager.hasConfigValue', () => {
      const config = { interval: 5.0 };
      const hasInterval = ConfigurationManager.hasConfigValue(config, 'interval');
      const hasMissing = ConfigurationManager.hasConfigValue(config, 'missing');
      return hasInterval === true && hasMissing === false;
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
    console.log('\nConfiguration Test Summary:');
    console.log(`Total tests: ${this.passed + this.failed}`);
    console.log(`Passed: ${this.passed}`);
    console.log(`Failed: ${this.failed}`);
    console.log(`Success rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(2)}%`);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const testSuite = new ConfigTestSuite();
  testSuite.runAllTests();
}
