/**
 * Error handling module for squash workout parser.
 *
 * This module provides centralized error handling with:
 * - Structured error types
 * - Error context and stack traces
 * - Error recovery strategies
 * - User-friendly error messages
 * - Error reporting and logging
 */

/**
 * Error severity levels.
 */
export const ErrorSeverity = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Types of errors that can occur.
 */
export const ErrorType = {
  VALIDATION_ERROR: 'validation_error',
  PARSING_ERROR: 'parsing_error',
  TIMING_ERROR: 'timing_error',
  CONFIGURATION_ERROR: 'configuration_error',
  RUNTIME_ERROR: 'runtime_error',
  SYSTEM_ERROR: 'system_error',
};

/**
 * Context information for errors.
 */
export class ErrorContext {
  constructor({
    filePath = null,
    lineNumber = null,
    columnNumber = null,
    functionName = null,
    moduleName = null,
    stackTrace = null,
    userData = {},
  } = {}) {
    this.filePath = filePath;
    this.lineNumber = lineNumber;
    this.columnNumber = columnNumber;
    this.functionName = functionName;
    this.moduleName = moduleName;
    this.stackTrace = stackTrace;
    this.userData = userData;
  }

  toDict() {
    return {
      filePath: this.filePath,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      functionName: this.functionName,
      moduleName: this.moduleName,
      stackTrace: this.stackTrace,
      userData: this.userData,
    };
  }
}

/**
 * Represents an error in the workout processing system.
 */
export class WorkoutError {
  constructor({
    errorType,
    message,
    severity = ErrorSeverity.ERROR,
    context = null,
    errorCode = null,
    suggestions = [],
    originalException = null,
    recoverable = false,
  }) {
    this.errorType = errorType;
    this.message = message;
    this.severity = severity;
    this.context = context;
    this.errorCode = errorCode;
    this.suggestions = suggestions;
    this.originalException = originalException;
    this.recoverable = recoverable;
  }

  toDict() {
    return {
      errorType: this.errorType,
      message: this.message,
      severity: this.severity,
      context: this.context ? this.context.toDict() : null,
      errorCode: this.errorCode,
      suggestions: this.suggestions,
      recoverable: this.recoverable,
    };
  }

  toJson() {
    return JSON.stringify(this.toDict(), null, 2);
  }
}

/**
 * Collection of errors with summary information.
 */
export class ErrorReport {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(error) {
    this.errors.push(error);
  }

  addWarning(error) {
    this.warnings.push(error);
  }

  addInfo(error) {
    this.info.push(error);
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasCriticalErrors() {
    return this.errors.some(error => error.severity === ErrorSeverity.CRITICAL);
  }

  getSummary() {
    return {
      totalErrors: this.errors.length,
      totalWarnings: this.warnings.length,
      totalInfo: this.info.length,
      criticalErrors: this.errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
      recoverableErrors: this.errors.filter(e => e.recoverable).length,
    };
  }

  toDict() {
    return {
      errors: this.errors.map(error => error.toDict()),
      warnings: this.warnings.map(error => error.toDict()),
      info: this.info.map(error => error.toDict()),
      summary: this.getSummary(),
    };
  }

  toJson() {
    return JSON.stringify(this.toDict(), null, 2);
  }
}

/**
 * Centralized error handler.
 */
export class ErrorHandler {
  constructor() {
    this.errorCallbacks = [];
    this.recoveryStrategies = new Map();
    this.errorReport = new ErrorReport();
  }

  registerErrorCallback(callback) {
    this.errorCallbacks.push(callback);
  }

  registerRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  createErrorContext(options = {}) {
    return new ErrorContext(options);
  }

  handleError({
    errorType,
    message,
    severity = ErrorSeverity.ERROR,
    errorCode = null,
    suggestions = [],
    recoverable = false,
    originalException = null,
    ...contextOptions
  }) {
    const context = this.createErrorContext(contextOptions);
    const error = new WorkoutError({
      errorType,
      message,
      severity,
      context,
      errorCode,
      suggestions,
      originalException,
      recoverable,
    });

    this.errorReport.addError(error);

    // Notify callbacks
    this.errorCallbacks.forEach(callback => callback(error));

    // Try recovery strategy
    const recoveryStrategy = this.recoveryStrategies.get(errorType);
    if (recoveryStrategy && recoveryStrategy(error)) {
      error.recoverable = true;
    }

    return error;
  }

  handleValidationError(message, field = null, value = null, suggestions = []) {
    return this.handleError({
      errorType: ErrorType.VALIDATION_ERROR,
      message,
      severity: ErrorSeverity.ERROR,
      suggestions,
      context: this.createErrorContext({
        userData: { field, value },
      }),
    });
  }

  handleParsingError(message, filePath = null, lineNumber = null, suggestions = []) {
    return this.handleError({
      errorType: ErrorType.PARSING_ERROR,
      message,
      severity: ErrorSeverity.ERROR,
      suggestions,
      context: this.createErrorContext({
        filePath,
        lineNumber,
      }),
    });
  }

  handleTimingError(message, timingContext = null, suggestions = []) {
    return this.handleError({
      errorType: ErrorType.TIMING_ERROR,
      message,
      severity: ErrorSeverity.WARNING,
      suggestions,
      context: this.createErrorContext({
        userData: { timingContext },
      }),
    });
  }

  handleConfigurationError(message, configPath = null, suggestions = []) {
    return this.handleError({
      errorType: ErrorType.CONFIGURATION_ERROR,
      message,
      severity: ErrorSeverity.WARNING,
      suggestions,
      context: this.createErrorContext({
        userData: { configPath },
      }),
    });
  }

  handleRuntimeError(message, originalException = null, suggestions = []) {
    return this.handleError({
      errorType: ErrorType.RUNTIME_ERROR,
      message,
      severity: ErrorSeverity.ERROR,
      suggestions,
      originalException,
    });
  }

  clearErrors() {
    this.errorReport = new ErrorReport();
  }

  getErrorReport() {
    return this.errorReport;
  }

  /* eslint-disable no-console */
  printErrors(includeWarnings = true, includeInfo = false) {
    console.log('=== Error Report ===');

    if (this.errorReport.errors.length > 0) {
      console.log('\nErrors:');
      this.errorReport.errors.forEach(error => {
        console.log(`[${error.severity.toUpperCase()}] ${error.message}`);
        if (error.suggestions.length > 0) {
          console.log('  Suggestions:', error.suggestions.join(', '));
        }
      });
    }

    if (includeWarnings && this.errorReport.warnings.length > 0) {
      console.log('\nWarnings:');
      this.errorReport.warnings.forEach(error => {
        console.log(`[${error.severity.toUpperCase()}] ${error.message}`);
      });
    }

    if (includeInfo && this.errorReport.info.length > 0) {
      console.log('\nInfo:');
      this.errorReport.info.forEach(error => {
        console.log(`[${error.severity.toUpperCase()}] ${error.message}`);
      });
    }

    console.log('\nSummary:', this.errorReport.getSummary());
  }
  /* eslint-enable no-console */
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export function handleValidationError(message, field = null, value = null, suggestions = []) {
  return errorHandler.handleValidationError(message, field, value, suggestions);
}

export function handleParsingError(message, filePath = null, lineNumber = null, suggestions = []) {
  return errorHandler.handleParsingError(message, filePath, lineNumber, suggestions);
}

export function handleTimingError(message, timingContext = null, suggestions = []) {
  return errorHandler.handleTimingError(message, timingContext, suggestions);
}

export function handleConfigurationError(message, configPath = null, suggestions = []) {
  return errorHandler.handleConfigurationError(message, configPath, suggestions);
}

export function handleRuntimeError(message, originalException = null, suggestions = []) {
  return errorHandler.handleRuntimeError(message, originalException, suggestions);
}

// Default recovery strategies
export function defaultValidationRecovery(error) {
  // Try to fix common validation errors
  if (error.context?.userData?.field === 'repeatCount' && error.context?.userData?.value < 1) {
    error.context.userData.value = 1;
    return true;
  }
  return false;
}

export function defaultParsingRecovery(error) {
  // Try to fix common parsing errors
  if (error.message.includes('missing field')) {
    return true;
  }
  return false;
}

export function defaultTimingRecovery(error) {
  // Try to fix common timing errors
  if (error.message.includes('negative duration')) {
    return true;
  }
  return false;
}

// Register default recovery strategies
errorHandler.registerRecoveryStrategy(ErrorType.VALIDATION_ERROR, defaultValidationRecovery);
errorHandler.registerRecoveryStrategy(ErrorType.PARSING_ERROR, defaultParsingRecovery);
errorHandler.registerRecoveryStrategy(ErrorType.TIMING_ERROR, defaultTimingRecovery);

/**
 * Error formatted for UI display in the webapp.
 */
export class UIError {
  constructor({
    field,
    message,
    severity = 'error',
    suggestions = [],
    canAutoFix = false,
    autoFixAction = null,
  }) {
    this.field = field;
    this.message = message;
    this.severity = severity;
    this.suggestions = suggestions;
    this.canAutoFix = canAutoFix;
    this.autoFixAction = autoFixAction;
  }

  toDict() {
    return {
      field: this.field,
      message: this.message,
      severity: this.severity,
      suggestions: this.suggestions,
      canAutoFix: this.canAutoFix,
      autoFixAction: this.autoFixAction,
    };
  }

  static fromDict(data) {
    return new UIError({
      field: data.field,
      message: data.message,
      severity: data.severity,
      suggestions: data.suggestions || [],
      canAutoFix: data.canAutoFix || false,
      autoFixAction: data.autoFixAction,
    });
  }
}

/**
 * Format validation error for UI display.
 */
export function formatValidationErrorForUI(error, _context = null) {
  const field = error.context?.userData?.field || 'unknown';
  const value = error.context?.userData?.value;

  const suggestions = [...error.suggestions];
  let canAutoFix = false;
  let autoFixAction = null;

  // Add context-specific suggestions
  if (field === 'repeatCount' && value < 1) {
    suggestions.push('Set repeat count to 1 or higher');
    canAutoFix = true;
    autoFixAction = 'setRepeatCount';
  } else if (field === 'interval' && value < 0) {
    suggestions.push('Set interval to 0 or higher');
    canAutoFix = true;
    autoFixAction = 'setInterval';
  } else if (field === 'type' && value !== 'Workout') {
    suggestions.push('Change type to "Workout"');
    canAutoFix = true;
    autoFixAction = 'setType';
  }

  return new UIError({
    field,
    message: error.message,
    severity: error.severity,
    suggestions,
    canAutoFix,
    autoFixAction,
  });
}

/**
 * Format configuration change warning for UI.
 */
export function formatConfigChangeWarning(change, affectedElements) {
  const message = `Configuration change affects: ${affectedElements.join(', ')}`;
  const suggestions = [
    'Review the affected elements',
    'Test the workout to ensure it works as expected',
  ];

  return new UIError({
    field: 'config',
    message,
    severity: 'warning',
    suggestions,
    canAutoFix: false,
  });
}

/**
 * Get auto-fix suggestion for UI error.
 */
export function getAutoFixSuggestion(error, currentValue, _context) {
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

/**
 * Collect UI errors from workout errors.
 */
export function collectUIErrors(errors, configChanges = null) {
  const uiErrors = [];

  // Convert workout errors to UI errors
  errors.forEach(error => {
    const uiError = formatValidationErrorForUI(error);
    uiErrors.push(uiError);
  });

  // Add configuration change warnings
  if (configChanges) {
    configChanges.forEach(change => {
      const warning = formatConfigChangeWarning(change, change.affectedElements || []);
      uiErrors.push(warning);
    });
  }

  return uiErrors;
}
