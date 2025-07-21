/**
 * Squash Workout Parser - JavaScript Library
 *
 * A comprehensive library for parsing, validating, and generating squash workout timelines.
 * Designed for integration with the Squash Ghost webapp.
 *
 * @version 1.0.0
 * @author Joe Lawrence
 */

// Import all modules
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

import {
  ConfigLevel,
  SplitStepSpeed,
  IterationType,
  IntervalOffsetType,
  LimitsType,
  IntervalType,
  WorkoutConfig,
  PatternConfig,
  ShotConfig,
  MessageConfig,
  ConfigurationManager,
} from './config.js';

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

import {
  TemplateManager,
  ImportOptions,
  ExportOptions,
  importWorkoutFromJson,
  exportWorkoutToJson,
} from './import-export.js';

import { WorkoutFileHandler, FileOptions } from './file-operations.js';

import { errorHandler, collectUIErrors } from './error-handling.js';

/**
 * Main SquashWorkoutParser class providing a unified API.
 */
export class SquashWorkoutParser {
  constructor() {
    this.version = '1.0.0';
  }

  /**
   * Parses a workout from JSON and generates a timeline.
   */
  parseWorkout(jsonData) {
    try {
      const result = loadWorkoutFromJsonWithValidation(jsonData);

      if (!result.workout) {
        return {
          success: false,
          error: result.error || 'Validation failed',
          validationErrors: result.validationResult.errors,
          workout: null,
          timeline: null,
        };
      }

      const timeline = generateWorkoutTimeline(result.workout);

      return {
        success: true,
        error: null,
        validationErrors: [],
        workout: result.workout,
        timeline,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        validationErrors: [],
        workout: null,
        timeline: null,
      };
    }
  }

  /**
   * Validates a workout JSON without parsing.
   */
  validateWorkout(jsonData) {
    try {
      const result = validateWorkout(jsonData);
      return {
        isValid: result.isValid,
        errors: result.errors.map(error => error.toDict()),
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: 'general',
            message: error.message,
            value: null,
            suggestions: [],
          },
        ],
      };
    }
  }

  /**
   * Converts a workout to JSON format.
   */
  serializeWorkout(workout) {
    try {
      const result = serializeWorkoutToJson(workout);

      if (!result.jsonData) {
        return {
          success: false,
          error: result.error,
          jsonData: null,
        };
      }

      return {
        success: true,
        error: null,
        jsonData: result.jsonData,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        jsonData: null,
      };
    }
  }

  /**
   * Generates timeline from workout data.
   */
  generateTimeline(workout) {
    try {
      if (!(workout instanceof WorkoutData)) {
        throw new Error('Invalid workout: must be a WorkoutData instance');
      }

      const timeline = generateWorkoutTimeline(workout);
      const jsonTimeline = timelineEventsToJson(timeline);

      return {
        success: true,
        error: null,
        timeline,
        jsonTimeline,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timeline: null,
        jsonTimeline: null,
      };
    }
  }

  /**
   * Calculates workout statistics.
   */
  getWorkoutStats(timeline) {
    try {
      if (!Array.isArray(timeline)) {
        throw new Error('Timeline must be an array');
      }

      const stats = calculateWorkoutStats(timeline);

      return {
        success: true,
        error: null,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stats: null,
      };
    }
  }

  /**
   * Gets auto-complete suggestions for the webapp.
   */
  getAutoCompleteData() {
    return new AutoCompleteData().toDict();
  }

  /**
   * Creates a new workout with default configuration.
   */
  createNewWorkout(name = 'New Workout') {
    const workout = new WorkoutData({
      name,
      type: 'Workout',
      config: new WorkoutConfig().toDict(),
      patterns: [],
    });

    return workout;
  }

  /**
   * Creates a new pattern with default configuration.
   */
  createNewPattern(name = 'New Pattern') {
    const pattern = new PatternData({
      name,
      type: 'Pattern',
      config: new PatternConfig().toDict(),
      entries: [],
    });

    return pattern;
  }

  /**
   * Creates a new shot with default configuration.
   */
  createNewShot(name = 'New Shot') {
    const shot = new ShotData({
      name,
      type: 'Shot',
      config: new ShotConfig().toDict(),
    });

    return shot;
  }

  /**
   * Creates a new message with default configuration.
   */
  createNewMessage(message = 'New Message') {
    const messageData = new MessageData({
      name: message,
      type: 'Message',
      config: new MessageConfig({ message }).toDict(),
    });

    return messageData;
  }

  /**
   * Merges configurations with inheritance.
   */
  mergeConfigurations(baseConfig, overrideConfig) {
    return mergeConfigs(baseConfig, overrideConfig);
  }

  /**
   * Gets effective configuration for an entry.
   */
  getEffectiveConfiguration(workoutConfig, patternConfig, entryConfig) {
    return getEffectiveConfig(workoutConfig, patternConfig, entryConfig);
  }

  /**
   * Validates timing consistency in a timeline.
   */
  validateTimelineConsistency(timeline) {
    try {
      const errors = validateTimingConsistency(timeline);

      return {
        success: true,
        error: null,
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        isValid: false,
        errors: [],
      };
    }
  }

  /**
   * Converts seconds to time string format.
   */
  formatTime(seconds) {
    return secondsToTimeStr(seconds);
  }

  /**
   * Parses time string to seconds.
   */
  parseTime(timeStr) {
    return timeStrToSeconds(timeStr);
  }

  /**
   * Parses duration string to seconds.
   */
  parseDuration(durationStr) {
    return parseDuration(durationStr);
  }

  // ===== NEW IMPORT/EXPORT METHODS =====

  /**
   * Import workout from JSON with advanced options.
   */
  importWorkout(jsonData, options = null) {
    const importOptions = options || new ImportOptions();
    const result = importWorkoutFromJson(jsonData, importOptions);

    return {
      success: result.workout !== null,
      workout: result.workout,
      errors: result.errors,
      hasErrors: result.errors.length > 0,
    };
  }

  /**
   * Export workout to JSON with advanced options.
   */
  exportWorkout(workout, options = null) {
    const exportOptions = options || new ExportOptions();
    const result = exportWorkoutToJson(workout, exportOptions);

    return {
      success: result.jsonData !== null,
      jsonData: result.jsonData,
      errors: result.errors,
      hasErrors: result.errors.length > 0,
    };
  }

  /**
   * Load workout from file (Node.js environment).
   */
  async loadFromFile(filepath, options = null) {
    const fileOptions = options || new FileOptions();
    const handler = new WorkoutFileHandler(fileOptions);
    return await handler.loadFromFile(filepath);
  }

  /**
   * Load workout from file input (browser environment).
   */
  async loadFromFileInput(fileInput, options = null) {
    const fileOptions = options || new FileOptions();
    const handler = new WorkoutFileHandler(fileOptions);
    return await handler.loadFromFileInput(fileInput);
  }

  /**
   * Save workout to file (Node.js environment).
   */
  async saveToFile(workout, filepath, options = null) {
    const fileOptions = options || new FileOptions();
    const handler = new WorkoutFileHandler(fileOptions);
    return await handler.saveToFile(workout, filepath);
  }

  /**
   * Save workout to download (browser environment).
   */
  saveToDownload(workout, filename = null, options = null) {
    const fileOptions = options || new FileOptions();
    const handler = new WorkoutFileHandler(fileOptions);
    const suggestedFilename = filename || handler.getSuggestedFilename(workout);
    return handler.saveToDownload(workout, suggestedFilename);
  }

  /**
   * Validate file content without loading.
   */
  validateFileContent(content) {
    const handler = new WorkoutFileHandler();
    return handler.validateFileContent(content);
  }

  // ===== TEMPLATE MANAGEMENT =====

  /**
   * Get template manager instance.
   */
  getTemplateManager() {
    return new TemplateManager();
  }

  /**
   * Add a workout template.
   */
  addTemplate(template) {
    const manager = new TemplateManager();
    manager.addTemplate(template);
    return manager;
  }

  /**
   * Get a template by name.
   */
  getTemplate(name) {
    const manager = new TemplateManager();
    return manager.getTemplate(name);
  }

  /**
   * List all templates.
   */
  listTemplates(category = null) {
    const manager = new TemplateManager();
    return manager.listTemplates(category);
  }

  // ===== ERROR HANDLING =====

  /**
   * Get error handler instance.
   */
  getErrorHandler() {
    return errorHandler;
  }

  /**
   * Get current error report.
   */
  getErrorReport() {
    return errorHandler.getErrorReport();
  }

  /**
   * Clear all errors.
   */
  clearErrors() {
    errorHandler.clearErrors();
  }

  /**
   * Format errors for UI display.
   */
  formatErrorsForUI(errors, configChanges = null) {
    return collectUIErrors(errors, configChanges);
  }

  /**
   * Get auto-fix suggestion for an error.
   */
  getAutoFixSuggestion(error, currentValue, _context) {
    if (!error.canAutoFix) {
      return null;
    }

    switch (error.autoFixAction) {
      case 'setRepeatCount':
        return Math.max(1, currentValue || 1);
      case 'setInterval':
        return Math.max(0, currentValue || 0);
      case 'setType':
        return 'Workout';
      default:
        return null;
    }
  }

  // ===== CONFIGURATION MANAGEMENT =====

  /**
   * Get configuration manager instance.
   */
  getConfigurationManager() {
    return new ConfigurationManager();
  }

  /**
   * Get default configuration for workout level.
   */
  getDefaultWorkoutConfig() {
    const manager = new ConfigurationManager();
    return manager.getDefaultConfig(ConfigLevel.WORKOUT);
  }

  /**
   * Get default configuration for pattern level.
   */
  getDefaultPatternConfig() {
    const manager = new ConfigurationManager();
    return manager.getDefaultConfig(ConfigLevel.PATTERN);
  }

  /**
   * Get default configuration for shot level.
   */
  getDefaultShotConfig() {
    const manager = new ConfigurationManager();
    return manager.getDefaultConfig(ConfigLevel.SHOT);
  }

  /**
   * Get default configuration for message level.
   */
  getDefaultMessageConfig() {
    const manager = new ConfigurationManager();
    return manager.getDefaultConfig(ConfigLevel.MESSAGE);
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if running in browser environment.
   */
  isBrowserEnvironment() {
    return typeof window !== 'undefined';
  }

  /**
   * Check if running in Node.js environment.
   */
  isNodeEnvironment() {
    return typeof window === 'undefined' && typeof process !== 'undefined';
  }

  /**
   * Get library version.
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get library capabilities.
   */
  getCapabilities() {
    return {
      version: this.version,
      environment: this.isBrowserEnvironment() ? 'browser' : 'node',
      features: {
        fileOperations: this.isNodeEnvironment(),
        fileDownloads: this.isBrowserEnvironment(),
        templates: true,
        errorHandling: true,
        validation: true,
        timing: true,
        configuration: true,
      },
    };
  }
}

// Export all data structures
export {
  WorkoutData,
  PatternData,
  ShotData,
  MessageData,
  TimelineEventData,
  WorkoutState,
  AutoCompleteData,
  WorkoutTemplate,
};

// Export all configuration classes and enums
export {
  ConfigLevel,
  SplitStepSpeed,
  IterationType,
  IntervalOffsetType,
  LimitsType,
  IntervalType,
  WorkoutConfig,
  PatternConfig,
  ShotConfig,
  MessageConfig,
  ConfigurationManager,
};

// Export all validation classes and functions
export {
  ValidationError,
  ValidationResult,
  validateWorkout,
  validateWorkoutConfig,
  validatePatternConfig,
  validateShotConfig,
  validateMessageConfig,
  validateTimeline,
};

// Export all timing functions
export {
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
};

// Export all parser functions
export {
  loadWorkoutFromJson,
  workoutDataToJson,
  timelineEventsToJson,
  jsonToTimelineEvents,
  generateWorkoutTimeline,
  mergeConfigs,
  getEffectiveConfig,
  loadWorkoutFromJsonWithValidation,
  serializeWorkoutToJson,
};

// Create and export a default instance
export const squashWorkoutParser = new SquashWorkoutParser();

// Export the default instance as the main export
export default squashWorkoutParser;
