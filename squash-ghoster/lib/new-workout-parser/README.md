# Squash Workout Parser - JavaScript Library

A comprehensive JavaScript library for parsing, validating, and generating squash workout timelines. Designed for integration with the [Squash Ghost webapp](https://joe-lawrence.github.io/squash-ghost/squash-ghoster/).

## 🚀 Features

- **Complete Workout Parsing**: Parse and validate workout JSON files
- **Timeline Generation**: Generate detailed workout execution timelines
- **Configuration Management**: Hierarchical configuration system with inheritance
- **Advanced Validation**: Comprehensive validation with detailed error messages
- **File Operations**: Load/save workouts in both Node.js and browser environments
- **Import/Export System**: Advanced import/export with options and error handling
- **Template Management**: Workout template system for reusable configurations
- **Error Handling**: Sophisticated error handling with UI-friendly error formatting
- **Auto-complete Data**: Built-in data for webapp integration
- **ES6 Modules**: Modern JavaScript with full ES6 module support

## 📦 Installation

### Node.js
```bash
npm install squash-workout-parser
```

### Browser
```html
<script type="module">
  import { SquashWorkoutParser } from 'https://unpkg.com/squash-workout-parser@1.1.0/squash-workout-parser.js';
</script>
```

### CDN
```html
<script type="module">
  import { SquashWorkoutParser } from 'https://cdn.jsdelivr.net/npm/squash-workout-parser@1.1.0/squash-workout-parser.js';
</script>
```

## 🎯 Quick Start

```javascript
import { SquashWorkoutParser } from 'squash-workout-parser';

const parser = new SquashWorkoutParser();

// Parse a workout
const workoutData = {
  type: 'Workout',
  name: 'My Workout',
  config: { interval: 5.0 },
  patterns: [{
    entries: [{ type: 'Shot', name: 'Front Left', config: { repeatCount: 5 } }]
  }]
};

const result = parser.parseWorkout(workoutData);
if (result.success) {
  console.log('Timeline generated:', result.timeline);
} else {
  console.log('Errors:', result.validationErrors);
}
```

## 📚 API Reference

### Core Methods

#### `parseWorkout(jsonData)`
Parse workout JSON and generate timeline.

#### `validateWorkout(jsonData)`
Validate workout JSON without generating timeline.

#### `serializeWorkout(workout)`
Convert workout object to JSON.

#### `generateTimeline(workout)`
Generate timeline from workout object.

### File Operations

#### `loadFromFile(filepath, options)` (Node.js)
Load workout from file system.

#### `loadFromFileInput(fileInput, options)` (Browser)
Load workout from file input element.

#### `saveToFile(workout, filepath, options)` (Node.js)
Save workout to file system.

#### `saveToDownload(workout, filename, options)` (Browser)
Save workout as download.

#### `validateFileContent(content)`
Validate file content without loading.

### Import/Export

#### `importWorkout(jsonData, options)`
Import workout with advanced options.

#### `exportWorkout(workout, options)`
Export workout with advanced options.

### Template Management

#### `getTemplateManager()`
Get template manager instance.

#### `addTemplate(template)`
Add a workout template.

#### `getTemplate(name)`
Get template by name.

#### `listTemplates(category)`
List all templates.

### Error Handling

#### `getErrorHandler()`
Get error handler instance.

#### `getErrorReport()`
Get current error report.

#### `clearErrors()`
Clear all errors.

#### `formatErrorsForUI(errors, configChanges)`
Format errors for UI display.

### Configuration

#### `getConfigurationManager()`
Get configuration manager instance.

#### `getDefaultWorkoutConfig()`
Get default workout configuration.

#### `getDefaultPatternConfig()`
Get default pattern configuration.

#### `getDefaultShotConfig()`
Get default shot configuration.

#### `getDefaultMessageConfig()`
Get default message configuration.

## 🔧 Usage Examples

### Basic Workout Parsing

```javascript
const parser = new SquashWorkoutParser();

const workout = {
  type: 'Workout',
  name: 'Basic Workout',
  config: {
    interval: 5.0,
    shotAnnouncementLeadTime: 2.5,
    limits: { type: 'all-shots' }
  },
  patterns: [{
    entries: [
      { type: 'Shot', name: 'Front Left', config: { repeatCount: 3 } },
      { type: 'Shot', name: 'Front Right', config: { repeatCount: 3 } }
    ]
  }]
};

const result = parser.parseWorkout(workout);
console.log('Success:', result.success);
console.log('Timeline events:', result.timeline.length);
```

### File Operations (Node.js)

```javascript
// Load from file
const fileResult = await parser.loadFromFile('./workout.json');
if (fileResult.success) {
  console.log('Workout loaded:', fileResult.data.name);
} else {
  console.log('Errors:', fileResult.errors);
}

// Save to file
const saveResult = await parser.saveToFile(workout, './new-workout.json');
if (saveResult.success) {
  console.log('Workout saved successfully');
}
```

### File Operations (Browser)

```javascript
// Load from file input
const fileInput = document.getElementById('workout-file');
const fileResult = await parser.loadFromFileInput(fileInput);
if (fileResult.success) {
  console.log('Workout loaded:', fileResult.data.name);
}

// Save as download
parser.saveToDownload(workout, 'my-workout.json');
```

### Advanced Import/Export

```javascript
// Import with options
const importOptions = {
  validateOnImport: true,
  autoFixErrors: true,
  strictMode: false
};

const importResult = parser.importWorkout(jsonData, importOptions);
if (importResult.success) {
  console.log('Workout imported successfully');
} else {
  console.log('Import errors:', importResult.errors);
}

// Export with options
const exportOptions = {
  includeMetadata: true,
  includeTemplates: true,
  prettyPrint: true
};

const exportResult = parser.exportWorkout(workout, exportOptions);
if (exportResult.success) {
  console.log('Workout exported:', exportResult.jsonData);
}
```

### Template Management

```javascript
const template = {
  name: 'Basic Template',
  description: 'A simple workout template',
  category: 'beginner',
  config: { interval: 5.0 },
  patterns: [{
    entries: [{ type: 'Shot', name: 'Front Left', config: { repeatCount: 5 } }]
  }]
};

const manager = parser.getTemplateManager();
manager.addTemplate(template);

const templates = manager.listTemplates('beginner');
console.log('Available templates:', templates);
```

### Error Handling

```javascript
// Get detailed error information
const errorHandler = parser.getErrorHandler();
const errorReport = parser.getErrorReport();

if (errorReport.hasErrors()) {
  console.log('Total errors:', errorReport.getSummary().totalErrors);

  // Format errors for UI
  const uiErrors = parser.formatErrorsForUI(errorReport.errors);
  uiErrors.forEach(error => {
    console.log(`${error.field}: ${error.message}`);
    if (error.canAutoFix) {
      console.log('Can auto-fix:', error.autoFixAction);
    }
  });
}
```

### Configuration Management

```javascript
const configManager = parser.getConfigurationManager();

// Get default configurations
const workoutConfig = parser.getDefaultWorkoutConfig();
const patternConfig = parser.getDefaultPatternConfig();
const shotConfig = parser.getDefaultShotConfig();

// Merge configurations
const effectiveConfig = parser.mergeConfigurations(workoutConfig, patternConfig);
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run specific test suites:
```bash
npm run test:data      # Data structures
npm run test:config    # Configuration
npm run test:validation # Validation
npm run test:timing    # Timing calculations
npm run test:parser    # Parser
npm run test:error     # Error handling
npm run test:import    # Import/export
npm run test:file      # File operations
```

## 🔗 Integration with Squash Ghost Webapp

This library is specifically designed to integrate with the [Squash Ghost webapp](https://joe-lawrence.github.io/squash-ghost/squash-ghoster/). It provides:

- **Auto-complete data** for UI components
- **Real-time validation** with UI-friendly error messages
- **File upload/download** capabilities
- **Template system** for reusable workouts
- **Configuration inheritance** for complex setups

### Webapp Integration Example

```javascript
// In your webapp
import { SquashWorkoutParser } from 'squash-workout-parser';

const parser = new SquashWorkoutParser();

// Handle file upload
document.getElementById('file-input').addEventListener('change', async (event) => {
  const fileInput = event.target;
  const result = await parser.loadFromFileInput(fileInput);

  if (result.success) {
    // Update UI with workout data
    updateWorkoutEditor(result.data);
  } else {
    // Display errors in UI
    const uiErrors = parser.formatErrorsForUI(result.errors);
    displayErrors(uiErrors);
  }
});

// Handle save
document.getElementById('save-button').addEventListener('click', () => {
  const workout = getWorkoutFromEditor();
  parser.saveToDownload(workout);
});

// Get auto-complete data
const autoCompleteData = parser.getAutoCompleteData();
populateAutoCompleteFields(autoCompleteData);
```

## 📋 Environment Support

- **Node.js**: Full support for file operations
- **Browser**: File upload/download support
- **ES6 Modules**: Modern JavaScript support
- **No Dependencies**: Zero external dependencies

## 🔄 Version History

### v1.1.0
- Added comprehensive error handling system
- Added import/export functionality with options
- Added file operations for Node.js and browser
- Added template management system
- Added UI-friendly error formatting
- Enhanced configuration management
- Improved documentation and examples

### v1.0.0
- Initial release with core functionality
- Basic parsing and validation
- Timeline generation
- Configuration system

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, please open an issue on the [GitHub repository](https://github.com/joe-lawrence/squash-ghost-python).