/**
 * Import/Export module for squash workout definitions.
 *
 * This module provides comprehensive import/export functionality with:
 * - JSON validation and sanitization
 * - Workout template management
 * - Configuration preset handling
 * - Export format validation
 * - Import/export error handling
 */

import { WorkoutData, WorkoutTemplate } from './data-structures.js';
import { validateWorkout } from './validation.js';
import {
  handleParsingError,
  handleValidationError,
  handleRuntimeError,
  ErrorSeverity,
} from './error-handling.js';

/**
 * Options for workout export.
 */
export class ExportOptions {
  constructor({
    includeMetadata = true,
    includeTemplates = false,
    includeAutoComplete = false,
    formatVersion = '1.0',
    prettyPrint = true,
    validateBeforeExport = true,
  } = {}) {
    this.includeMetadata = includeMetadata;
    this.includeTemplates = includeTemplates;
    this.includeAutoComplete = includeAutoComplete;
    this.formatVersion = formatVersion;
    this.prettyPrint = prettyPrint;
    this.validateBeforeExport = validateBeforeExport;
  }
}

/**
 * Options for workout import.
 */
export class ImportOptions {
  constructor({
    validateOnImport = true,
    autoFixErrors = false,
    preserveMetadata = true,
    mergeWithExisting = false,
    strictMode = false,
  } = {}) {
    this.validateOnImport = validateOnImport;
    this.autoFixErrors = autoFixErrors;
    this.preserveMetadata = preserveMetadata;
    this.mergeWithExisting = mergeWithExisting;
    this.strictMode = strictMode;
  }
}

/**
 * Handles importing workout definitions from various sources.
 */
export class WorkoutImporter {
  constructor(options = null) {
    this.options = options || new ImportOptions();
  }

  /**
   * Import workout from JSON data.
   */
  importFromJson(jsonData) {
    const errors = [];

    try {
      // Parse JSON if it's a string
      let data;
      if (typeof jsonData === 'string') {
        try {
          data = JSON.parse(jsonData);
        } catch {
          errors.push(
            handleParsingError('Invalid JSON format', null, null, [
              'Check that the JSON is properly formatted',
            ]),
          );
          return { workout: null, errors };
        }
      } else {
        data = jsonData;
      }

      // Validate the data structure
      if (!data || typeof data !== 'object') {
        errors.push(
          handleParsingError('Invalid JSON structure: root must be an object', null, null, [
            'Check that the JSON file contains a valid workout object',
          ]),
        );
        return { workout: null, errors };
      }

      // Check for required top-level fields
      if (!data.type || data.type !== 'Workout') {
        errors.push(
          handleParsingError('Missing or invalid workout type', null, null, [
            'Ensure the JSON has "type": "Workout" at the root level',
          ]),
        );
      }

      // Validate the workout if requested
      if (this.options.validateOnImport) {
        const validationResult = validateWorkout(data);
        if (!validationResult.isValid) {
          // Convert ValidationError to WorkoutError
          validationResult.errors.forEach(validationError => {
            errors.push(
              handleValidationError(
                validationError.message,
                validationError.field,
                validationError.value,
                validationError.suggestions,
              ),
            );
          });
        }
      }

      // Auto-fix errors if requested
      if (this.options.autoFixErrors && errors.length > 0) {
        data = this.autoFixWorkoutData(data, errors);
      }

      // If there are critical errors, don't proceed
      if (errors.some(error => error.severity === ErrorSeverity.CRITICAL)) {
        return { workout: null, errors };
      }

      // Create workout object
      try {
        const workout = WorkoutData.fromDict(data);
        return { workout, errors };
      } catch (parseError) {
        errors.push(
          handleParsingError(`Failed to parse workout: ${parseError.message}`, null, null, [
            'Check the workout structure and required fields',
          ]),
        );
        return { workout: null, errors };
      }
    } catch (error) {
      errors.push(handleRuntimeError(`Unexpected error during import: ${error.message}`, error));
      return { workout: null, errors };
    }
  }

  /**
   * Import workout from file (for Node.js environments).
   */
  async importFromFile(filepath) {
    const errors = [];

    try {
      // This would require Node.js fs module
      // For browser environments, this would be handled differently
      if (typeof window !== 'undefined') {
        errors.push(
          handleRuntimeError('File import not supported in browser environment', null, [
            'Use importFromJson with file content instead',
          ]),
        );
        return { workout: null, errors };
      }

      // Node.js implementation would go here
      // const fs = await import('fs');
      // const content = await fs.promises.readFile(filepath, 'utf8');
      // return this.importFromJson(content);
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to read file ${filepath}: ${error.message}`, error));
      return { workout: null, errors };
    }
  }

  /**
   * Auto-fix common workout data issues.
   */
  autoFixWorkoutData(data, _errors) {
    const fixedData = { ...data };

    // Fix missing type
    if (!fixedData.type) {
      fixedData.type = 'Workout';
    }

    // Fix missing patterns array
    if (!Array.isArray(fixedData.patterns)) {
      fixedData.patterns = [];
    }

    // Fix missing config
    if (!fixedData.config) {
      fixedData.config = {
        limits: { type: 'all-shots' },
      };
    }

    // Fix missing limits in config
    if (!fixedData.config.limits) {
      fixedData.config.limits = { type: 'all-shots' };
    }

    // Fix pattern entries
    if (fixedData.patterns) {
      fixedData.patterns = fixedData.patterns.map(pattern => {
        if (!pattern.entries || !Array.isArray(pattern.entries)) {
          pattern.entries = [];
        }
        return pattern;
      });
    }

    return fixedData;
  }
}

/**
 * Handles exporting workout definitions to various formats.
 */
export class WorkoutExporter {
  constructor(options = null) {
    this.options = options || new ExportOptions();
  }

  /**
   * Export workout to JSON.
   */
  exportToJson(workout) {
    const errors = [];

    try {
      if (!(workout instanceof WorkoutData)) {
        errors.push(
          handleValidationError(
            'Invalid workout: must be a WorkoutData instance',
            'workout',
            workout,
          ),
        );
        return { jsonData: null, errors };
      }

      // Validate before export if requested
      if (this.options.validateBeforeExport) {
        const validationResult = validateWorkout(workout.toDict());
        if (!validationResult.isValid) {
          validationResult.errors.forEach(validationError => {
            errors.push(
              handleValidationError(
                validationError.message,
                validationError.field,
                validationError.value,
                validationError.suggestions,
              ),
            );
          });
        }
      }

      // Prepare export data
      const exportData = {
        ...workout.toDict(),
        _metadata: this.options.includeMetadata
          ? {
              exportedAt: new Date().toISOString(),
              formatVersion: this.options.formatVersion,
              exportedBy: 'SquashWorkoutParser',
            }
          : undefined,
      };

      // Add templates if requested
      if (this.options.includeTemplates) {
        exportData._templates = this.getDefaultTemplates();
      }

      // Add auto-complete data if requested
      if (this.options.includeAutoComplete) {
        exportData._autoComplete = this.getAutoCompleteData();
      }

      // Remove undefined values
      Object.keys(exportData).forEach(key => {
        if (exportData[key] === undefined) {
          delete exportData[key];
        }
      });

      // Convert to JSON string
      const jsonString = this.options.prettyPrint
        ? JSON.stringify(exportData, null, 2)
        : JSON.stringify(exportData);

      return { jsonData: jsonString, errors };
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to export workout: ${error.message}`, error));
      return { jsonData: null, errors };
    }
  }

  /**
   * Export workout to file (for Node.js environments).
   */
  async exportToFile(workout, filepath) {
    const errors = [];

    try {
      const result = this.exportToJson(workout);
      if (result.errors.length > 0) {
        return result.errors;
      }

      // This would require Node.js fs module
      // For browser environments, this would trigger a download
      if (typeof window !== 'undefined') {
        // Browser implementation - trigger download
        this.downloadFile(result.jsonData, filepath);
        return [];
      }

      // Node.js implementation would go here
      // const fs = await import('fs');
      // await fs.promises.writeFile(filepath, result.jsonData, 'utf8');
      // return [];
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to write file ${filepath}: ${error.message}`, error));
      return errors;
    }
  }

  /**
   * Download file in browser environment.
   */
  downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Get default templates for export.
   */
  getDefaultTemplates() {
    return [
      {
        name: 'Basic Workout',
        description: 'A simple workout with basic shots',
        category: 'beginner',
        config: {
          interval: 5.0,
          shotAnnouncementLeadTime: 2.5,
          limits: { type: 'all-shots' },
        },
        patterns: [
          {
            entries: [
              { type: 'Shot', name: 'Front Left', config: { repeatCount: 5 } },
              { type: 'Shot', name: 'Front Right', config: { repeatCount: 5 } },
            ],
          },
        ],
      },
    ];
  }

  /**
   * Get auto-complete data for export.
   */
  getAutoCompleteData() {
    return {
      shotNames: [
        'Front Left',
        'Front Right',
        'Mid Left',
        'Mid Right',
        'Back Left',
        'Back Right',
        '1L',
        '1R',
        '2L',
        '2R',
        '3L',
        '3R',
        '4L',
        '4R',
        '5L',
        '5R',
      ],
      positionTypes: ['normal', 'locked', 'linked'],
      voiceOptions: ['Default', 'Male', 'Female', 'Fast', 'Slow'],
      splitStepSpeeds: ['none', 'slow', 'medium', 'fast', 'random', 'auto-scale'],
      iterationTypes: ['in-order', 'shuffle'],
      intervalTypes: ['fixed', 'additional'],
      limitTypes: ['all-shots', 'shot-limit', 'time-limit'],
    };
  }
}

/**
 * Template management system.
 */
export class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.presets = new Map();
  }

  /**
   * Add a template.
   */
  addTemplate(template) {
    if (!(template instanceof WorkoutTemplate)) {
      template = new WorkoutTemplate(template);
    }
    this.templates.set(template.name, template);
  }

  /**
   * Get a template by name.
   */
  getTemplate(name) {
    return this.templates.get(name);
  }

  /**
   * List all templates, optionally filtered by category.
   */
  listTemplates(category = null) {
    const templates = Array.from(this.templates.values());
    if (category) {
      return templates.filter(template => template.category === category);
    }
    return templates;
  }

  /**
   * Add a configuration preset.
   */
  addPreset(name, preset) {
    this.presets.set(name, preset);
  }

  /**
   * Get a preset by name.
   */
  getPreset(name) {
    return this.presets.get(name);
  }

  /**
   * List all preset names.
   */
  listPresets() {
    return Array.from(this.presets.keys());
  }

  /**
   * Export all templates and presets.
   */
  exportTemplates() {
    return {
      templates: Array.from(this.templates.values()).map(t => t.toDict()),
      presets: Object.fromEntries(this.presets),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Import templates and presets.
   */
  importTemplates(data) {
    const errors = [];

    try {
      if (data.templates) {
        data.templates.forEach(templateData => {
          try {
            const template = new WorkoutTemplate(templateData);
            this.templates.set(template.name, template);
          } catch (error) {
            errors.push(
              handleValidationError(
                `Failed to import template ${templateData.name}: ${error.message}`,
                'template',
                templateData,
              ),
            );
          }
        });
      }

      if (data.presets) {
        Object.entries(data.presets).forEach(([name, preset]) => {
          this.presets.set(name, preset);
        });
      }
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to import templates: ${error.message}`, error));
    }

    return errors;
  }
}

// Convenience functions
export function importWorkoutFromJson(jsonData, options = null) {
  const importer = new WorkoutImporter(options);
  return importer.importFromJson(jsonData);
}

export function exportWorkoutToJson(workout, options = null) {
  const exporter = new WorkoutExporter(options);
  return exporter.exportToJson(workout);
}

export function validateImportExportCompatibility(sourceData, targetFormat) {
  const errors = [];

  try {
    // Check if source data has required fields for target format
    if (targetFormat === '1.0') {
      if (!sourceData.type || sourceData.type !== 'Workout') {
        errors.push(
          handleValidationError(
            'Source data missing required "type" field',
            'type',
            sourceData.type,
            ['Ensure source data has "type": "Workout"'],
          ),
        );
      }

      if (!Array.isArray(sourceData.patterns)) {
        errors.push(
          handleValidationError(
            'Source data missing required "patterns" array',
            'patterns',
            sourceData.patterns,
            ['Ensure source data has a "patterns" array'],
          ),
        );
      }
    }
  } catch (error) {
    errors.push(handleRuntimeError(`Failed to validate compatibility: ${error.message}`, error));
  }

  return errors;
}
