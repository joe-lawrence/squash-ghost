/**
 * File operations module for squash workout definitions.
 *
 * This module provides file I/O operations for both Node.js and browser environments:
 * - File reading and writing
 * - File validation and error handling
 * - Browser download functionality
 * - File format detection
 */

import { validateWorkout } from './validation.js';
import { handleParsingError, handleRuntimeError } from './error-handling.js';
import { WorkoutImporter, WorkoutExporter } from './import-export.js';

/**
 * File operation options.
 */
export class FileOptions {
  constructor({
    encoding = 'utf8',
    validateOnLoad = true,
    prettyPrint = true,
    includeMetadata = true,
    autoFixErrors = false,
  } = {}) {
    this.encoding = encoding;
    this.validateOnLoad = validateOnLoad;
    this.prettyPrint = prettyPrint;
    this.includeMetadata = includeMetadata;
    this.autoFixErrors = autoFixErrors;
  }
}

/**
 * File operation result.
 */
export class FileResult {
  constructor({ success = false, data = null, errors = [], warnings = [], fileInfo = null } = {}) {
    this.success = success;
    this.data = data;
    this.errors = errors;
    this.warnings = warnings;
    this.fileInfo = fileInfo;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }

  toDict() {
    return {
      success: this.success,
      data: this.data,
      errors: this.errors.map(error => error.toDict()),
      warnings: this.warnings.map(warning => warning.toDict()),
      fileInfo: this.fileInfo,
    };
  }
}

/**
 * File information.
 */
export class FileInfo {
  constructor({ name = null, size = null, type = null, lastModified = null, path = null } = {}) {
    this.name = name;
    this.size = size;
    this.type = type;
    this.lastModified = lastModified;
    this.path = path;
  }

  toDict() {
    return {
      name: this.name,
      size: this.size,
      type: this.type,
      lastModified: this.lastModified,
      path: this.path,
    };
  }
}

/**
 * Handles file operations for workout definitions.
 */
export class WorkoutFileHandler {
  constructor(options = null) {
    this.options = options || new FileOptions();
    this.importer = new WorkoutImporter({
      validateOnImport: this.options.validateOnLoad,
      autoFixErrors: this.options.autoFixErrors,
    });
    this.exporter = new WorkoutExporter({
      prettyPrint: this.options.prettyPrint,
      includeMetadata: this.options.includeMetadata,
    });
  }

  /**
   * Load workout from file (Node.js environment).
   */
  async loadFromFile(filepath) {
    const errors = [];

    try {
      // Check if we're in a Node.js environment
      if (typeof window !== 'undefined') {
        errors.push(
          handleRuntimeError('File loading not supported in browser environment', null, [
            'Use loadFromFileInput or loadFromJson instead',
          ]),
        );
        return new FileResult({ errors });
      }

      // Node.js implementation
      const fs = await import('fs');
      const path = await import('path');

      // Check if file exists
      if (!fs.existsSync(filepath)) {
        errors.push(
          handleRuntimeError(`File not found: ${filepath}`, null, [
            'Check the file path and ensure the file exists',
          ]),
        );
        return new FileResult({ errors });
      }

      // Read file
      const content = await fs.promises.readFile(filepath, this.options.encoding);
      const fileInfo = new FileInfo({
        name: path.basename(filepath),
        path: filepath,
        size: content.length,
        type: 'application/json',
        lastModified: new Date().toISOString(),
      });

      // Parse and validate
      const result = this.importer.importFromJson(content);

      return new FileResult({
        success: result.workout !== null && result.errors.length === 0,
        data: result.workout,
        errors: result.errors,
        fileInfo,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to load file ${filepath}: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Load workout from file input (browser environment).
   */
  async loadFromFileInput(fileInput) {
    const errors = [];

    try {
      if (typeof window === 'undefined') {
        errors.push(
          handleRuntimeError('File input loading not supported in Node.js environment', null, [
            'Use loadFromFile instead',
          ]),
        );
        return new FileResult({ errors });
      }

      const file = fileInput.files[0];
      if (!file) {
        errors.push(handleRuntimeError('No file selected', null, ['Please select a workout file']));
        return new FileResult({ errors });
      }

      // Validate file type
      if (!file.name.endsWith('.json')) {
        errors.push(handleRuntimeError('Invalid file type', null, ['Please select a JSON file']));
        return new FileResult({ errors });
      }

      // Read file content
      const content = await this.readFileAsText(file);
      const fileInfo = new FileInfo({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
      });

      // Parse and validate
      const result = this.importer.importFromJson(content);

      return new FileResult({
        success: result.workout !== null && result.errors.length === 0,
        data: result.workout,
        errors: result.errors,
        fileInfo,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to load file: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Load workout from JSON string.
   */
  loadFromJson(jsonString, filename = 'workout.json') {
    const errors = [];

    try {
      const fileInfo = new FileInfo({
        name: filename,
        size: jsonString.length,
        type: 'application/json',
        lastModified: new Date().toISOString(),
      });

      const result = this.importer.importFromJson(jsonString);

      return new FileResult({
        success: result.workout !== null && result.errors.length === 0,
        data: result.workout,
        errors: result.errors,
        fileInfo,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to load JSON: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Save workout to file (Node.js environment).
   */
  async saveToFile(workout, filepath) {
    const errors = [];

    try {
      // Check if we're in a Node.js environment
      if (typeof window !== 'undefined') {
        errors.push(
          handleRuntimeError('File saving not supported in browser environment', null, [
            'Use saveToDownload instead',
          ]),
        );
        return new FileResult({ errors });
      }

      // Export workout to JSON
      const exportResult = this.exporter.exportToJson(workout);
      if (exportResult.errors.length > 0) {
        return new FileResult({ errors: exportResult.errors });
      }

      // Node.js implementation
      const fs = await import('fs');
      const path = await import('path');

      // Create directory if it doesn't exist
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      // Write file
      await fs.promises.writeFile(filepath, exportResult.jsonData, this.options.encoding);

      const fileInfo = new FileInfo({
        name: path.basename(filepath),
        path: filepath,
        size: exportResult.jsonData.length,
        type: 'application/json',
        lastModified: new Date().toISOString(),
      });

      return new FileResult({
        success: true,
        data: workout,
        fileInfo,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to save file ${filepath}: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Save workout to download (browser environment).
   */
  saveToDownload(workout, filename = 'workout.json') {
    const errors = [];

    try {
      if (typeof window === 'undefined') {
        errors.push(
          handleRuntimeError('Download not supported in Node.js environment', null, [
            'Use saveToFile instead',
          ]),
        );
        return new FileResult({ errors });
      }

      // Export workout to JSON
      const exportResult = this.exporter.exportToJson(workout);
      if (exportResult.errors.length > 0) {
        return new FileResult({ errors: exportResult.errors });
      }

      // Trigger download
      this.exporter.downloadFile(exportResult.jsonData, filename);

      const fileInfo = new FileInfo({
        name: filename,
        size: exportResult.jsonData.length,
        type: 'application/json',
        lastModified: new Date().toISOString(),
      });

      return new FileResult({
        success: true,
        data: workout,
        fileInfo,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to save download: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Validate file content without loading.
   */
  validateFileContent(content) {
    const errors = [];

    try {
      // Try to parse JSON
      let data;
      try {
        data = typeof content === 'string' ? JSON.parse(content) : content;
      } catch {
        errors.push(
          handleParsingError('Invalid JSON format', null, null, [
            'Check that the JSON is properly formatted',
          ]),
        );
        return new FileResult({ errors });
      }

      // Validate workout structure
      const validationResult = validateWorkout(data);
      if (!validationResult.isValid) {
        validationResult.errors.forEach(validationError => {
          errors.push(
            handleParsingError(validationError.message, null, null, validationError.suggestions),
          );
        });
      }

      return new FileResult({
        success: errors.length === 0,
        data,
        errors,
      });
    } catch (error) {
      errors.push(handleRuntimeError(`Failed to validate file content: ${error.message}`, error));
      return new FileResult({ errors });
    }
  }

  /**
   * Read file as text (browser helper).
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => resolve(event.target.result);
      reader.onerror = error => reject(error);
      reader.readAsText(file, this.options.encoding);
    });
  }

  /**
   * Get file extension from filename.
   */
  getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Check if file is a valid workout file.
   */
  isValidWorkoutFile(filename) {
    const extension = this.getFileExtension(filename);
    return extension === 'json';
  }

  /**
   * Get suggested filename for workout.
   */
  getSuggestedFilename(workout) {
    if (!workout || !workout.name) {
      return 'workout.json';
    }

    // Sanitize filename
    const sanitizedName = workout.name
      .replace(/[^a-zA-Z0-9\s-_]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase();

    return `${sanitizedName}.json`;
  }
}

// Convenience functions
export function loadWorkoutFromFile(filepath, options = null) {
  const handler = new WorkoutFileHandler(options);
  return handler.loadFromFile(filepath);
}

export function saveWorkoutToFile(workout, filepath, options = null) {
  const handler = new WorkoutFileHandler(options);
  return handler.saveToFile(workout, filepath);
}

export function loadWorkoutFromJson(jsonString, filename = 'workout.json', options = null) {
  const handler = new WorkoutFileHandler(options);
  return handler.loadFromJson(jsonString, filename);
}

export function saveWorkoutToDownload(workout, filename = null, options = null) {
  const handler = new WorkoutFileHandler(options);
  const suggestedFilename = filename || handler.getSuggestedFilename(workout);
  return handler.saveToDownload(workout, suggestedFilename);
}

export function validateWorkoutFile(content) {
  const handler = new WorkoutFileHandler();
  return handler.validateFileContent(content);
}
