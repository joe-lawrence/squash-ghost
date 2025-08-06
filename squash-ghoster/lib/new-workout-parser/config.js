/**
 * Enhanced configuration module for squash workout definitions.
 *
 * This module provides comprehensive configuration management with:
 * - Centralized defaults for all configuration levels
 * - Type-safe configuration building
 * - Validation integration
 * - Clear inheritance rules
 * - Easy integration with the webapp
 */

/**
 * Configuration levels in the workout hierarchy.
 */
export const ConfigLevel = {
  WORKOUT: 'workout',
  PATTERN: 'pattern',
  SHOT: 'shot',
  MESSAGE: 'message',
};

/**
 * Valid split step speed values.
 */
export const SplitStepSpeed = {
  NONE: 'none',
  SLOW: 'slow',
  MEDIUM: 'medium',
  FAST: 'fast',
  RANDOM: 'random',
  AUTO_SCALE: 'auto-scale',
};

/**
 * Valid iteration type values.
 */
export const IterationType = {
  IN_ORDER: 'in-order',
  SHUFFLE: 'shuffle',
};

/**
 * Valid interval offset type values.
 */
export const IntervalOffsetType = {
  FIXED: 'fixed',
  RANDOM: 'random',
};

/**
 * Valid limits type values.
 */
export const LimitsType = {
  ALL_SHOTS: 'all-shots',
  SHOT_LIMIT: 'shot-limit',
  TIME_LIMIT: 'time-limit',
};

/**
 * Valid interval type values for messages.
 */
export const IntervalType = {
  FIXED: 'fixed',
  ADDITIONAL: 'additional',
};

/**
 * Configuration for interval offsets.
 */
export class IntervalOffsetConfig {
  constructor({ min = 0.0, max = 0.0 } = {}) {
    this.min = min;
    this.max = max;
  }

  toDict() {
    return {
      min: this.min,
      max: this.max,
    };
  }

  static fromDict(data) {
    return new IntervalOffsetConfig({
      min: data.min || 0.0,
      max: data.max || 0.0,
    });
  }
}

/**
 * Configuration for workout limits.
 */
export class LimitsConfig {
  constructor({ type = LimitsType.ALL_SHOTS, value = null } = {}) {
    this.type = type;
    this.value = value;
  }

  toDict() {
    const result = { type: this.type };
    if (this.value !== null) {
      result.value = this.value;
    }
    return result;
  }

  static fromDict(data) {
    return new LimitsConfig({
      type: data.type || LimitsType.ALL_SHOTS,
      value: data.value || null,
    });
  }
}

/**
 * Base configuration class with common properties.
 */
export class BaseConfig {
  constructor({
    voice = 'Default',
    speechRate = 1.0,
    interval = 5.0,
    splitStepSpeed = SplitStepSpeed.AUTO_SCALE,
    shotAnnouncementLeadTime = 2.5,
    intervalOffsetType = IntervalOffsetType.FIXED,
    intervalOffset = new IntervalOffsetConfig(),
    autoVoiceSplitStep = true,
  } = {}) {
    this.voice = voice;
    this.speechRate = speechRate;
    this.interval = interval;
    this.splitStepSpeed = splitStepSpeed;
    this.shotAnnouncementLeadTime = shotAnnouncementLeadTime;
    this.intervalOffsetType = intervalOffsetType;
    this.intervalOffset = intervalOffset;
    this.autoVoiceSplitStep = autoVoiceSplitStep;
  }

  toDict() {
    const result = {
      voice: this.voice,
      speechRate: this.speechRate,
      interval: this.interval,
      splitStepSpeed: this.splitStepSpeed,
      shotAnnouncementLeadTime: this.shotAnnouncementLeadTime,
      intervalOffsetType: this.intervalOffsetType,
      intervalOffset: this.intervalOffset.toDict(),
      autoVoiceSplitStep: this.autoVoiceSplitStep,
    };
    
    // Filter out null values to prevent them from being saved
    Object.keys(result).forEach(key => {
      if (result[key] === null) {
        delete result[key];
      }
    });
    
    return result;
  }

  static fromDict(data) {
    return new BaseConfig({
      voice: data.voice || 'Default',
      speechRate: data.speechRate || 1.0,
      interval: data.interval || 5.0,
      splitStepSpeed: data.splitStepSpeed || SplitStepSpeed.AUTO_SCALE,
      shotAnnouncementLeadTime: data.shotAnnouncementLeadTime || 2.5,
      intervalOffsetType: data.intervalOffsetType || IntervalOffsetType.FIXED,
      intervalOffset: IntervalOffsetConfig.fromDict(data.intervalOffset || {}),
      autoVoiceSplitStep: data.autoVoiceSplitStep !== undefined ? data.autoVoiceSplitStep : true,
    });
  }
}

/**
 * Workout-level configuration.
 */
export class WorkoutConfig extends BaseConfig {
  constructor({
    voice = 'Default',
    speechRate = 1.0,
    interval = 5.0,
    splitStepSpeed = SplitStepSpeed.AUTO_SCALE,
    shotAnnouncementLeadTime = 2.5,
    intervalOffsetType = IntervalOffsetType.FIXED,
    intervalOffset = new IntervalOffsetConfig(),
    autoVoiceSplitStep = true,
    iterationType = IterationType.IN_ORDER,
    limits = new LimitsConfig(),
  } = {}) {
    super({
      voice,
      speechRate,
      interval,
      splitStepSpeed,
      shotAnnouncementLeadTime,
      intervalOffsetType,
      intervalOffset,
      autoVoiceSplitStep,
    });
    this.iterationType = iterationType;
    this.limits = limits;
  }

  toDict() {
    const result = super.toDict();
    result.iterationType = this.iterationType;
    result.limits = this.limits.toDict();
    return result;
  }

  static fromDict(data) {
    const baseConfig = BaseConfig.fromDict(data);
    return new WorkoutConfig({
      voice: baseConfig.voice,
      speechRate: baseConfig.speechRate,
      interval: baseConfig.interval,
      splitStepSpeed: baseConfig.splitStepSpeed,
      shotAnnouncementLeadTime: baseConfig.shotAnnouncementLeadTime,
      intervalOffsetType: baseConfig.intervalOffsetType,
      intervalOffset: baseConfig.intervalOffset,
      autoVoiceSplitStep: baseConfig.autoVoiceSplitStep,
      iterationType: data.iterationType || IterationType.IN_ORDER,
      limits: LimitsConfig.fromDict(data.limits || {}),
    });
  }
}

/**
 * Pattern-level configuration.
 */
export class PatternConfig extends BaseConfig {
  constructor({
    voice = 'Default',
    speechRate = 1.0,
    interval = 5.0,
    splitStepSpeed = SplitStepSpeed.AUTO_SCALE,
    shotAnnouncementLeadTime = 2.5,
    intervalOffsetType = IntervalOffsetType.FIXED,
    intervalOffset = new IntervalOffsetConfig(),
    autoVoiceSplitStep = true,
    iterationType = 'in-order',
    limits = null,
    repeatCount = 1,
  } = {}) {
    super({
      voice,
      speechRate,
      interval,
      splitStepSpeed,
      shotAnnouncementLeadTime,
      intervalOffsetType,
      intervalOffset,
      autoVoiceSplitStep,
    });
    this.iterationType = iterationType;
    this.limits = limits;
    this.repeatCount = repeatCount;
  }

  toDict() {
    const result = super.toDict();
    if (this.iterationType !== null && this.iterationType !== undefined) {
      result.iterationType = this.iterationType;
    }
    if (this.limits !== null && this.limits !== undefined) {
      result.limits = this.limits;
    }
    if (this.repeatCount !== null && this.repeatCount !== undefined) {
      // Handle both fixed and random repeat values with consistent format
      if (typeof this.repeatCount === 'object') {
        if (this.repeatCount.type === 'random') {
          result.repeatCount = {
            type: 'random',
            min: this.repeatCount.min,
            max: this.repeatCount.max
          };
        } else if (this.repeatCount.type === 'fixed') {
          result.repeatCount = {
            type: 'fixed',
            count: this.repeatCount.count
          };
        } else {
          // Legacy object without type: preserve as random
          result.repeatCount = {
            type: 'random',
            min: this.repeatCount.min,
            max: this.repeatCount.max
          };
        }
      } else {
        // Fixed repeat: use consistent object format
        result.repeatCount = {
          type: 'fixed',
          count: this.repeatCount
        };
      }
    }
    return result;
  }

  static fromDict(data) {
    const baseConfig = BaseConfig.fromDict(data);
    let repeatCount = 1;
    
    // Handle both fixed and random repeat values with consistent format
    if (data.repeatCount) {
      if (typeof data.repeatCount === 'object') {
        if (data.repeatCount.type === 'random') {
          repeatCount = {
            type: 'random',
            min: data.repeatCount.min !== undefined ? data.repeatCount.min : 1,
            max: data.repeatCount.max !== undefined ? data.repeatCount.max : 1
          };
        } else if (data.repeatCount.type === 'fixed') {
          repeatCount = data.repeatCount.count !== undefined ? data.repeatCount.count : 1;
        } else {
          // Legacy support: if it's an object but no type, assume it's random
          repeatCount = {
            type: 'random',
            min: data.repeatCount.min !== undefined ? data.repeatCount.min : 1,
            max: data.repeatCount.max !== undefined ? data.repeatCount.max : 1
          };
        }
      } else {
        // Legacy support: if it's a number, treat as fixed
        repeatCount = data.repeatCount;
      }
    }
    
    return new PatternConfig({
      voice: baseConfig.voice,
      speechRate: baseConfig.speechRate,
      interval: baseConfig.interval,
      splitStepSpeed: baseConfig.splitStepSpeed,
      shotAnnouncementLeadTime: baseConfig.shotAnnouncementLeadTime,
      intervalOffsetType: baseConfig.intervalOffsetType,
      intervalOffset: baseConfig.intervalOffset,
      autoVoiceSplitStep: baseConfig.autoVoiceSplitStep,
      iterationType: data.iterationType || null,
      limits: data.limits || null,
      repeatCount,
    });
  }
}

/**
 * Shot-level configuration.
 */
export class ShotConfig extends BaseConfig {
  constructor({
    voice = 'Default',
    speechRate = 1.0,
    interval = 5.0,
    splitStepSpeed = SplitStepSpeed.AUTO_SCALE,
    shotAnnouncementLeadTime = 2.5,
    intervalOffsetType = IntervalOffsetType.FIXED,
    intervalOffset = new IntervalOffsetConfig(),
    autoVoiceSplitStep = true,
    repeatCount = 1,
  } = {}) {
    super({
      voice,
      speechRate,
      interval,
      splitStepSpeed,
      shotAnnouncementLeadTime,
      intervalOffsetType,
      intervalOffset,
      autoVoiceSplitStep,
    });
    this.repeatCount = repeatCount;
  }

  toDict() {
    const result = super.toDict();
    if (this.repeatCount !== null && this.repeatCount !== undefined) {
      // Handle both fixed and random repeat values with consistent format
      if (typeof this.repeatCount === 'object') {
        if (this.repeatCount.type === 'random') {
          result.repeatCount = {
            type: 'random',
            min: this.repeatCount.min,
            max: this.repeatCount.max
          };
        } else if (this.repeatCount.type === 'fixed') {
          result.repeatCount = {
            type: 'fixed',
            count: this.repeatCount.count
          };
        } else {
          // Legacy object without type: preserve as random
          result.repeatCount = {
            type: 'random',
            min: this.repeatCount.min,
            max: this.repeatCount.max
          };
        }
      } else {
        // Fixed repeat: use consistent object format
        result.repeatCount = {
          type: 'fixed',
          count: this.repeatCount
        };
      }
    }
    return result;
  }

  static fromDict(data) {
    const baseConfig = BaseConfig.fromDict(data);
    let repeatCount = 1;
    
    // Handle both fixed and random repeat values with consistent format
    if (data.repeatCount) {
      if (typeof data.repeatCount === 'object') {
        if (data.repeatCount.type === 'random') {
          repeatCount = {
            type: 'random',
            min: data.repeatCount.min !== undefined ? data.repeatCount.min : 1,
            max: data.repeatCount.max !== undefined ? data.repeatCount.max : 1
          };
        } else if (data.repeatCount.type === 'fixed') {
          repeatCount = data.repeatCount.count !== undefined ? data.repeatCount.count : 1;
        } else {
          // Legacy support: if it's an object but no type, assume it's random
          repeatCount = {
            type: 'random',
            min: data.repeatCount.min !== undefined ? data.repeatCount.min : 1,
            max: data.repeatCount.max !== undefined ? data.repeatCount.max : 1
          };
        }
      } else {
        // Legacy support: if it's a number, treat as fixed
        repeatCount = data.repeatCount;
      }
    }
    
    return new ShotConfig({
      voice: baseConfig.voice,
      speechRate: baseConfig.speechRate,
      interval: baseConfig.interval,
      splitStepSpeed: baseConfig.splitStepSpeed,
      shotAnnouncementLeadTime: baseConfig.shotAnnouncementLeadTime,
      intervalOffsetType: baseConfig.intervalOffsetType,
      intervalOffset: baseConfig.intervalOffset,
      autoVoiceSplitStep: baseConfig.autoVoiceSplitStep,
      repeatCount,
    });
  }
}

/**
 * Message-level configuration.
 */
export class MessageConfig extends BaseConfig {
  constructor({
    voice = 'Default',
    speechRate = 1.0,
    interval = 5.0,
    splitStepSpeed = SplitStepSpeed.AUTO_SCALE,
    shotAnnouncementLeadTime = 2.5,
    intervalOffsetType = IntervalOffsetType.FIXED,
    intervalOffset = new IntervalOffsetConfig(),
    autoVoiceSplitStep = true,
    message = '',
    messageInterval = '0s',
    skipAtEndOfWorkout = false,
    intervalType = null,
  } = {}) {
    super({
      voice,
      speechRate,
      interval,
      splitStepSpeed,
      shotAnnouncementLeadTime,
      intervalOffsetType,
      intervalOffset,
      autoVoiceSplitStep,
    });
    this.message = message;
    this.messageInterval = messageInterval;
    this.skipAtEndOfWorkout = skipAtEndOfWorkout;
    this.intervalType = intervalType;
  }

  toDict() {
    const result = super.toDict();
    result.message = this.message;
    result.interval = this.messageInterval;
    result.skipAtEndOfWorkout = this.skipAtEndOfWorkout;
    if (this.intervalType !== null && this.intervalType !== undefined) {
      result.intervalType = this.intervalType;
    }
    return result;
  }

  static fromDict(data) {
    const baseConfig = BaseConfig.fromDict(data);
    return new MessageConfig({
      voice: baseConfig.voice,
      speechRate: baseConfig.speechRate,
      interval: baseConfig.interval,
      splitStepSpeed: baseConfig.splitStepSpeed,
      shotAnnouncementLeadTime: baseConfig.shotAnnouncementLeadTime,
      intervalOffsetType: baseConfig.intervalOffsetType,
      intervalOffset: baseConfig.intervalOffset,
      autoVoiceSplitStep: baseConfig.autoVoiceSplitStep,
      message: data.message || '',
      messageInterval: data.interval || '0s',
      skipAtEndOfWorkout: data.skipAtEndOfWorkout || false,
      intervalType: data.intervalType || null,
    });
  }
}

/**
 * Configuration manager for building and managing configurations.
 */
export class ConfigurationManager {
  static getDefaultConfig(_level) {
    switch (_level) {
      case ConfigLevel.WORKOUT:
        return new WorkoutConfig().toDict();
      case ConfigLevel.PATTERN:
        return new PatternConfig().toDict();
      case ConfigLevel.SHOT:
        return new ShotConfig().toDict();
      case ConfigLevel.MESSAGE:
        return new MessageConfig().toDict();
      default:
        throw new Error(`Unknown config level: ${_level}`);
    }
  }

  static buildWorkoutConfig(configData) {
    return WorkoutConfig.fromDict(configData);
  }

  static buildPatternConfig(workoutConfig, patternConfigData = null) {
    const baseConfig = workoutConfig.toDict();
    
    // Don't inherit workout-level iterationType and limits unless explicitly specified
    if (!patternConfigData || !patternConfigData.iterationType) {
      delete baseConfig.iterationType;
    }
    if (!patternConfigData || !patternConfigData.limits) {
      delete baseConfig.limits;
    }
    
    if (patternConfigData) {
      Object.assign(baseConfig, patternConfigData);
    }
    return PatternConfig.fromDict(baseConfig);
  }

  static buildShotConfig(patternConfig, shotConfigData = null) {
    const baseConfig = patternConfig.toDict();
    if (shotConfigData) {
      Object.assign(baseConfig, shotConfigData);
    }
    return ShotConfig.fromDict(baseConfig);
  }

  static buildMessageConfig(patternConfig, messageConfigData = null) {
    const baseConfig = patternConfig.toDict();
    if (messageConfigData) {
      Object.assign(baseConfig, messageConfigData);
    }
    return MessageConfig.fromDict(baseConfig);
  }

  static validateConfig(config, level) {
    const errors = [];

    // Basic validation based on level
    switch (level) {
      case ConfigLevel.WORKOUT:
        if (!config.iterationType) {
          errors.push('Workout config missing iterationType');
        }
        if (!config.limits) {
          errors.push('Workout config missing limits');
        }
        break;
      case ConfigLevel.MESSAGE:
        if (config.interval && config.interval !== '0s' && !config.intervalType) {
          errors.push('Message with interval > 0 must specify intervalType');
        }
        break;
    }

    return errors;
  }

  static mergeConfigs(...configs) {
    return configs.reduce((merged, config) => {
      return { ...merged, ...config };
    }, {});
  }

  static getConfigValue(config, key, defaultValue = null) {
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  static hasConfigValue(config, key) {
    return config[key] !== undefined;
  }
}

// Convenience functions for webapp integration
export function detectConfigChanges(oldConfig, newConfig) {
  const changes = [];
  const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);

  for (const key of allKeys) {
    const oldValue = oldConfig[key];
    const newValue = newConfig[key];

    if (oldValue !== newValue) {
      const affectedElements = getAffectedElementsByField(key);
      changes.push({
        field: key,
        oldValue,
        newValue,
        affectedElements,
        severity: affectedElements.length > 0 ? 'warning' : 'info',
      });
    }
  }

  return changes;
}

export function getAffectedElementsByField(field) {
  const fieldAffects = {
    interval: ['shots', 'messages'],
    voice: ['shots', 'messages'],
    speechRate: ['shots', 'messages'],
    splitStepSpeed: ['shots'],
    iterationType: ['patterns'],
    limits: ['patterns', 'workout'],
    shotAnnouncementLeadTime: ['shots'],
    intervalOffsetType: ['shots'],
    intervalOffset: ['shots'],
    autoVoiceSplitStep: ['shots'],
    repeatCount: ['shots', 'patterns'],
    message: ['messages'],
    intervalType: ['messages'],
    skipAtEndOfWorkout: ['messages'],
  };

  return fieldAffects[field] || [];
}

export function getInheritanceChain(config, _level) {
  const levels = [ConfigLevel.WORKOUT, ConfigLevel.PATTERN, ConfigLevel.SHOT, ConfigLevel.MESSAGE];
  return levels.map(configLevel => ({
    level: configLevel,
    config: configLevel === _level ? config : {},
    isCurrent: configLevel === _level,
  }));
}

export function getEffectiveValue(config, field, inheritanceChain) {
  for (const levelInfo of inheritanceChain) {
    if (levelInfo.config[field] !== undefined) {
      return [levelInfo.config[field], levelInfo.level];
    }
  }

  const defaults = ConfigurationManager.getDefaultConfig(ConfigLevel.WORKOUT);
  return [defaults[field] || null, 'default'];
}

export function validateConfigIncremental(config, _level, changedField = null) {
  const errors = [];

  if (changedField) {
    const fieldErrors = validateSingleField(config, changedField, _level);
    errors.push(...fieldErrors);

    const dependentFields = getDependentFields(changedField);
    for (const depField of dependentFields) {
      if (config[depField] !== undefined) {
        const depErrors = validateSingleField(config, depField, _level);
        errors.push(...depErrors);
      }
    }
  } else {
    const allErrors = ConfigurationManager.validateConfig(config, _level);
    errors.push(...allErrors.map(error => ({ field: 'general', message: error })));
  }

  return errors;
}

export function validateSingleField(config, field, _level) {
  const errors = [];
  const value = config[field];

  if (field === 'interval' && value !== undefined) {
    if (typeof value !== 'number' || value < 0) {
      errors.push({
        field,
        message: 'Interval must be a non-negative number',
        severity: 'error',
        suggestions: ['Use a number >= 0'],
      });
    }
  } else if (field === 'speechRate' && value !== undefined) {
    if (typeof value !== 'number' || value <= 0 || value > 3) {
      errors.push({
        field,
        message: 'Speech rate must be between 0.5 and 1.5',
        severity: 'error',
        suggestions: ['Use a value between 0.5 and 1.5'],
      });
    }
  } else if (field === 'repeatCount' && value !== undefined) {
    if (!Number.isInteger(value) || value < 1) {
      errors.push({
        field,
        message: 'Repeat count must be a positive integer',
        severity: 'error',
        suggestions: ['Use a positive integer'],
      });
    }
  }

  return errors;
}

export function getDependentFields(field) {
  const dependencies = {
    intervalOffsetType: ['intervalOffset'],
    intervalOffset: ['intervalOffsetType'],
    limits: ['iterationType'],
    message: ['intervalType'],
    interval: ['intervalType'],
  };

  return dependencies[field] || [];
}
