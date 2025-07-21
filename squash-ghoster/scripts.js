// Import movement utilities
import {
  getSiblings,
  getLinkedGroup,
  isGroupLocked,
  getGroupLockType,
  updateGroupLockStyling,
  canElementMoveInGroup,
  isSwapValid,
  findSwapTarget,
  canElementMove,
  canMoveToPosition,
  swapElements,
  moveGroup,
  findNextAvailablePositionUp,
  findNextAvailablePositionDown,
  isLastElement
} from './lib/movement-utils.js';

document.addEventListener("DOMContentLoaded", function () {
  // --- Global Elements ---
  const mainContainer = document.getElementById("mainContainer");
  const patternInstanceTemplate = document.getElementById(
    "patternInstanceTemplate",
  );
  const shotInstanceTemplate = document.querySelector(
    ".shot-instance-template",
  );
  const messageInstanceTemplate = document.querySelector(
    ".message-instance-template",
  );
  const addPatternBtn = document.getElementById("addPatternBtn");
  const workoutFileInput = document.getElementById("workoutFileInput");
  const themeToggle = document.getElementById("themeToggle");
  const rocketToggle = document.getElementById("rocketToggle");
  const duckToggle = document.getElementById("duckToggle");

  const resetConfigModal = document.getElementById("resetConfigModal");

  /**
   * Detects if the current device is a mobile device
   * @returns {boolean} True if the device is mobile
   */
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  }

  /**
   * Mapping of inheritable properties to their UI element selectors
   */
  const INHERITABLE_PROPERTIES = {
    interval: {
      selector: '.shot-interval-slider',
      defaultKey: 'shotInterval',
      displayName: 'Shot Interval',
      formatValue: (value) => `${parseFloat(value).toFixed(1)}s`
    },
    shotAnnouncementLeadTime: {
      selector: '.lead-time-slider',
      defaultKey: 'leadTime',
      displayName: 'Lead Time',
      formatValue: (value) => `${parseFloat(value).toFixed(1)}s`
    },
    voice: {
      selector: '.voice-select',
      defaultKey: 'voice.voiceName',
      displayName: 'Voice',
      formatValue: (value) => value,
      enabledSelector: '.voice-enabled'
    },
    speechRate: {
      selector: '.voice-rate-select',
      defaultKey: 'voice.rate',
      displayName: 'Speech Rate',
      formatValue: (value) => value === 'auto-scale' ? 'Auto-scale' : `${value}x`,
      enabledSelector: '.voice-enabled'
    },
    intervalOffsetEnabled: {
      selector: '.offset-enabled',
      defaultKey: 'offset.enabled',
      displayName: 'Offset',
      formatValue: (value) => value ? 'Enabled' : 'Disabled'
    },
    intervalOffsetType: {
      selector: '.offset-type-select',
      defaultKey: 'offset.type',
      displayName: 'Offset Type',
      formatValue: (value) => value === 'fixed' ? 'Fixed' : 'Random',
      enabledSelector: '.offset-enabled'
    },
    intervalOffsetFixedValue: {
      selector: '.offset-fixed-slider',
      defaultKey: 'offset.fixedValue',
      displayName: 'Offset Fixed Value',
      formatValue: (value) => `${parseFloat(value).toFixed(1)}s`,
      enabledSelector: '.offset-enabled'
    },
    intervalOffsetRandomMinimum: {
      selector: '.offset-random-minimum-slider',
      defaultKey: 'offset.randomMinimum',
      displayName: 'Offset Random Minimum',
      formatValue: (value) => `${parseFloat(value).toFixed(1)}s`,
      enabledSelector: '.offset-enabled'
    },
    intervalOffsetRandomMaximum: {
      selector: '.offset-random-maximum-slider',
      defaultKey: 'offset.randomMaximum',
      displayName: 'Offset Random Maximum',
      formatValue: (value) => `${parseFloat(value).toFixed(1)}s`,
      enabledSelector: '.offset-enabled'
    },
    splitStepSpeed: {
      selector: '.split-step-speed-select',
      defaultKey: 'splitStep.rate',
      displayName: 'Split Step Speed',
      formatValue: (value) => value,
      enabledSelector: '.split-step-enabled'
    }
  };



  function initializeRocketMode() {
    const savedRocketMode = localStorage.getItem("rocketMode");
    const rocketMode = savedRocketMode || "off";
    document.documentElement.setAttribute("data-rocket-mode", rocketMode);
    localStorage.setItem("rocketMode", rocketMode);

    // We'll apply the config lock state after all elements are initialized
  }

  // Theme system data
  const themeSchemes = {
    dark: {
      'blue-ocean': { name: 'Blue Ocean', default: true },
      'purple-nebula': { name: 'Purple Nebula' },
      'forest-night': { name: 'Forest Night' },
      'crimson-shadow': { name: 'Crimson Shadow' },
      'midnight-teal': { name: 'Midnight Teal' }
    },
    light: {
      'cloud-silver': { name: 'Cloud Silver', default: true },
      'warm-sunset': { name: 'Warm Sunset' },
      'fresh-mint': { name: 'Fresh Mint' },
      'rose-gold': { name: 'Rose Gold' },
      'arctic-blue': { name: 'Arctic Blue' },
      'lavender-mist': { name: 'Lavender Mist' }
    }
  };

  // Theme state management
  let themeState = {
    currentTheme: 'dark',
    darkScheme: 'blue-ocean',
    lightScheme: 'cloud-silver'
  };

  // Load theme preferences from localStorage
  function loadThemePreferences() {
    // Determine default theme based on system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = prefersDark ? 'dark' : 'light';

    const savedTheme = localStorage.getItem('theme') || defaultTheme;
    const savedDarkScheme = localStorage.getItem('darkScheme') || 'blue-ocean';
    const savedLightScheme = localStorage.getItem('lightScheme') || 'cloud-silver';

    themeState.currentTheme = savedTheme;
    themeState.darkScheme = savedDarkScheme;
    themeState.lightScheme = savedLightScheme;

    applyTheme();
  }

  // Apply current theme and color scheme
  function applyTheme() {
    const { currentTheme, darkScheme, lightScheme } = themeState;
    const colorScheme = currentTheme === 'dark' ? darkScheme : lightScheme;

    document.documentElement.setAttribute('data-theme', currentTheme);
    document.documentElement.setAttribute('data-color-scheme', colorScheme);

    // Save to localStorage
    localStorage.setItem('theme', currentTheme);
    localStorage.setItem('darkScheme', darkScheme);
    localStorage.setItem('lightScheme', lightScheme);
  }

  // Toggle theme dropdown
  function toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    const isVisible = dropdown.classList.contains('show');

    if (isVisible) {
      hideThemeDropdown();
    } else {
      showThemeDropdown();
    }
  }

  // Show theme dropdown with all options
  function showThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    populateAllThemeOptions();
    dropdown.classList.add('show');

    // Close dropdown when clicking outside
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
  }

  // Hide theme dropdown
  function hideThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    dropdown.classList.remove('show');
    document.removeEventListener('click', handleClickOutside);
  }

  // Handle clicks outside dropdown
  function handleClickOutside(event) {
    const container = document.querySelector('.theme-selector-container');
    if (!container.contains(event.target)) {
      hideThemeDropdown();
    }
  }

  // Populate all theme options in dropdown
  function populateAllThemeOptions() {
    const container = document.getElementById('themeOptions');
    container.innerHTML = '';

    // Add dark themes section
    const darkSection = document.createElement('div');
    darkSection.className = 'theme-section';
    darkSection.innerHTML = '<div class="theme-section-header">Dark Themes</div>';

    Object.entries(themeSchemes.dark).forEach(([schemeId, schemeData]) => {
      const option = createThemeOption('dark', schemeId, schemeData);
      darkSection.appendChild(option);
    });

    container.appendChild(darkSection);

    // Add light themes section
    const lightSection = document.createElement('div');
    lightSection.className = 'theme-section';
    lightSection.innerHTML = '<div class="theme-section-header">Light Themes</div>';

    Object.entries(themeSchemes.light).forEach(([schemeId, schemeData]) => {
      const option = createThemeOption('light', schemeId, schemeData);
      lightSection.appendChild(option);
    });

    container.appendChild(lightSection);
  }

  // Create a theme option element
  function createThemeOption(themeType, schemeId, schemeData) {
    const option = document.createElement('button');
    const isActive = themeState.currentTheme === themeType &&
                    ((themeType === 'dark' && themeState.darkScheme === schemeId) ||
                     (themeType === 'light' && themeState.lightScheme === schemeId));

    option.className = `theme-option ${isActive ? 'active' : ''}`;
    option.innerHTML = `
      <div class="theme-preview ${schemeId}"></div>
      <span class="theme-name">${schemeData.name}</span>
    `;

    option.addEventListener('click', () => {
      selectThemeScheme(themeType, schemeId);
    });

    return option;
  }

  // Select a specific theme scheme
  function selectThemeScheme(themeType, schemeId) {
    if (themeType === 'dark') {
      themeState.darkScheme = schemeId;
    } else {
      themeState.lightScheme = schemeId;
    }

    // Switch to the selected theme if not already active
    if (themeState.currentTheme !== themeType) {
      themeState.currentTheme = themeType;
    }

    applyTheme();
    hideThemeDropdown();
  }

  // Toggle rocket mode function
  function toggleRocketMode() {
    const currentMode = document.documentElement.getAttribute('data-rocket-mode');
    const newMode = currentMode === 'on' ? 'off' : 'on';

    // No confirmation modal, just toggle directly
    if (newMode === 'off') {
        enableRocketModeOff();
    } else {
        document.documentElement.setAttribute('data-rocket-mode', newMode);
        localStorage.setItem('rocketMode', newMode);
        const patternInstances = document.querySelectorAll('.pattern-instance');
        patternInstances.forEach(pattern => {
            applyLockStateToElement(pattern);
            pattern.querySelectorAll('.shot-msg-instance').forEach(shotMsg => {
                applyLockStateToElement(shotMsg);
            });
        });
    }
  }

  function enableRocketModeOff() {
    document.documentElement.setAttribute("data-rocket-mode", "off");
    localStorage.setItem("rocketMode", "off");

    // Update all elements to reflect locked state when rocket mode is off
    const patternInstances = document.querySelectorAll(".pattern-instance");
    patternInstances.forEach((pattern) => {
      applyLockStateToElement(pattern);
      pattern.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
        applyLockStateToElement(shotMsg);
      });
    });
  }

  function initializeDuckMode() {
    // Always start with duck mode off
    document.documentElement.setAttribute("data-duck-mode", "off");
    localStorage.setItem("duckMode", "off");
  }

  function toggleDuckMode() {
    const currentMode = document.documentElement.getAttribute('data-duck-mode');
    const newMode = currentMode === 'on' ? 'off' : 'on';

    document.documentElement.setAttribute('data-duck-mode', newMode);
    localStorage.setItem('duckMode', newMode);

    // Apply or remove constant ducking based on mode
    if (newMode === 'on') {
      // Ensure voices are loaded before starting the heartbeat
      ensureVoicesLoaded().then(() => {
        startDuckingHeartbeat();
      });
    } else {
      // Stop periodic ducking timer
      stopDuckingHeartbeat();
    }
  }

  // --- Periodic Ducking Heartbeat ---
  let duckingHeartbeatInterval = null;
  let synth = null; // Speech Synthesis API instance for ducking keep-alive

  function startDuckingHeartbeat() {
    stopDuckingHeartbeat(); // Always clear any previous timer first

    // Initialize synth if needed
    if (!synth && 'speechSynthesis' in window) {
      synth = window.speechSynthesis;
    }

    duckingHeartbeatInterval = setInterval(() => {
      if (document.documentElement.getAttribute('data-duck-mode') === 'on') {
        if (synth && !synth.speaking && !synth.pending) {
          ensureVoicesLoaded().then(() => {
            const utterance = new SpeechSynthesisUtterance('');
            utterance.lang = 'en-US';
            utterance.volume = 0.0;
            synth.speak(utterance);
          });
        }
      }
    }, 1000); // 1 second interval
  }

  function stopDuckingHeartbeat() {
    if (duckingHeartbeatInterval) {
      clearInterval(duckingHeartbeatInterval);
      duckingHeartbeatInterval = null;
    }
  }

  // Initialize rocket mode on load
  initializeRocketMode();

  // Initialize duck mode on load
  initializeDuckMode();

  // Initialize theme system
  loadThemePreferences();

  // Theme toggle event listeners
  themeToggle.addEventListener("click", toggleThemeDropdown);
  rocketToggle.addEventListener("click", toggleRocketMode);
  duckToggle.addEventListener("click", toggleDuckMode);

  // --- Toolbar Icon Event Listeners ---
  const chevronBtn = document.getElementById("chevronBtn");
  const editorBtn = document.getElementById("editorBtn");
  const executeBtn = document.getElementById("executeBtn");
  const loadBtn = document.getElementById("loadBtn");
  const saveBtn = document.getElementById("saveBtn");

  // Chevron toggle functionality
  if (chevronBtn) {
    chevronBtn.addEventListener("click", function() {
      const buttonGroup = document.querySelector('.fixed.top-4.left-4 > div:last-child');
      const chevronIcon = chevronBtn.querySelector('svg');

      if (buttonGroup) {
        const isHidden = buttonGroup.style.display === 'none';

        if (isHidden) {
          // Show buttons with smooth animation
          buttonGroup.style.display = 'flex';
          buttonGroup.classList.remove('collapsing');
          buttonGroup.style.opacity = '0';
          buttonGroup.style.transform = 'translateY(-20px)';

          // Trigger clockwise spin animation
          chevronBtn.classList.remove('active');
          setTimeout(() => {
            chevronBtn.classList.add('active');
          }, 10);

          // Animate toolbar in
          setTimeout(() => {
            buttonGroup.style.opacity = '1';
            buttonGroup.style.transform = 'translateY(0)';
          }, 50);

          chevronBtn.setAttribute('title', 'Hide toolbar');
          // Set the current scroll position as the focused spot when opening chevron
          lastFocusedScrollY = window.scrollY;
          setToolbarIconsOpacity('1');
        } else {
          // Hide buttons with smooth animation
          // Add collapsing class for right-to-left animation in landscape mode
          buttonGroup.classList.add('collapsing');

          // Trigger counter-clockwise spin animation
          chevronBtn.classList.remove('active');
          chevronBtn.setAttribute('title', 'Show toolbar');
          chevronBtn.blur();

          // Hide toolbar after animation
          setTimeout(() => {
            buttonGroup.style.display = 'none';
            buttonGroup.classList.remove('collapsing');
          }, 500);

          // Fade out all toolbars when manually closed - sync with rotation animation
          setTimeout(() => setToolbarIconsOpacity('0.3'), 500);
        }
      }
    });
  }

  if (editorBtn) {
    editorBtn.addEventListener("click", function() {
      console.log("Editor button clicked");
      // TODO: Implement editor functionality
    });
  }

  if (executeBtn) {
    const executeDropdown = document.getElementById("executeDropdown");
    const previewMenuItem = document.getElementById("previewMenuItem");
    const runMenuItem = document.getElementById("runMenuItem");

    // Toggle dropdown on execute button click
    executeBtn.addEventListener("click", function(event) {
      event.stopPropagation();
      const isActive = executeDropdown.classList.contains("active");
      closeAllDropdowns(executeDropdown);
      if (!isActive) {
        executeDropdown.classList.add("active");
      }
    });

    // Preview menu item click
    if (previewMenuItem) {
      previewMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        executeDropdown.classList.remove("active");
        generateWorkoutPreview();
      });
    }

    // Run menu item click
    if (runMenuItem) {
      runMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        executeDropdown.classList.remove("active");
        startWorkoutExecution();
      });
    }


  }

  if (editorBtn) {
    const editorDropdown = document.getElementById("editorDropdown");
    const autoCompleteMenuItem = document.getElementById("autoCompleteMenuItem");
    const autoCompleteModal = document.getElementById("autoCompleteModal");
    const closeAutoCompleteBtn = document.getElementById("closeAutoCompleteBtn");
    const okAutoCompleteBtn = document.getElementById("okAutoCompleteBtn");
    const defaultsAutoCompleteBtn = document.getElementById("defaultsAutoCompleteBtn");
    const suggestedShotNamesTextarea = document.getElementById("suggestedShotNames");

    // Auto-complete defaults confirmation modal elements
    const autoCompleteDefaultsModal = document.getElementById("autoCompleteDefaultsModal");
    const autoCompleteDefaultsCancelBtn = document.getElementById("autoCompleteDefaultsCancelBtn");
    const autoCompleteDefaultsOkBtn = document.getElementById("autoCompleteDefaultsOkBtn");



  // Update auto-complete suggestions for all shot title inputs
  function updateAllShotTitleAutoComplete() {
    const shotTitleInputs = document.querySelectorAll('.shot-title');
    const suggestions = getAutoCompleteSuggestions();

    shotTitleInputs.forEach(input => {
      const instanceElement = input.closest('.shot-instance');
      if (instanceElement) {
        const datalistId = `shot-suggestions-${instanceElement.id}`;

        // Remove existing datalist if it exists
        const existingDatalist = document.getElementById(datalistId);
        if (existingDatalist) {
          existingDatalist.remove();
        }

        // Create new datalist with updated suggestions
        const datalist = document.createElement('datalist');
        datalist.id = datalistId;

        suggestions.forEach(suggestion => {
          const option = document.createElement('option');
          option.value = suggestion;
          datalist.appendChild(option);
        });

        // Add datalist to document
        document.body.appendChild(datalist);

        // Set the datalist attribute on the input
        input.setAttribute('list', datalistId);
        input.setAttribute('autocomplete', 'on');
      }
    });
  }

    // Load auto-complete text from localStorage on page load
    function loadAutoCompleteText() {
      const savedText = localStorage.getItem("autoCompleteText");
      if (savedText) {
        suggestedShotNamesTextarea.value = savedText;
      } else {
        suggestedShotNamesTextarea.value = DEFAULT_AUTO_COMPLETE_TEXT;
      }
    }

    // Save auto-complete text to localStorage
    function saveAutoCompleteText() {
      localStorage.setItem("autoCompleteText", suggestedShotNamesTextarea.value);
    }

    // Define default auto-complete text
    const DEFAULT_AUTO_COMPLETE_TEXT = "Front Left, Front Right, Mid Left, Mid Right, Back Left, Back Right,\n1L, 1R, 2L, 2R, 3L, 3R, 4L, 4R, 5L, 5R";

    // Initialize auto-complete text
    loadAutoCompleteText();

    // Initialize auto-complete for any existing shot instances
    updateAllShotTitleAutoComplete();

    // Toggle dropdown on editor button click
    editorBtn.addEventListener("click", function(event) {
      event.stopPropagation();
      const isActive = editorDropdown.classList.contains("active");
      closeAllDropdowns(editorDropdown);
      if (!isActive) {
        editorDropdown.classList.add("active");
      }
    });

    // Auto-complete menu item click
    if (autoCompleteMenuItem) {
      autoCompleteMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        editorDropdown.classList.remove("active");
        autoCompleteModal.classList.remove("hidden");
      });
    }

    // Close auto-complete modal
    if (closeAutoCompleteBtn) {
      closeAutoCompleteBtn.addEventListener("click", function() {
        autoCompleteModal.classList.add("hidden");
      });
    }

    // OK button - save and close
    if (okAutoCompleteBtn) {
      okAutoCompleteBtn.addEventListener("click", function() {
        saveAutoCompleteText();
        // Update all existing shot title inputs with new suggestions
        updateAllShotTitleAutoComplete();
        autoCompleteModal.classList.add("hidden");
      });
    }

    // Defaults button - show confirmation modal
    if (defaultsAutoCompleteBtn) {
      defaultsAutoCompleteBtn.addEventListener("click", function() {
        autoCompleteDefaultsModal.classList.remove("hidden");
      });
    }

    // Defaults confirmation modal handlers
    if (autoCompleteDefaultsCancelBtn) {
      autoCompleteDefaultsCancelBtn.addEventListener("click", function() {
        autoCompleteDefaultsModal.classList.add("hidden");
      });
    }

    if (autoCompleteDefaultsOkBtn) {
      autoCompleteDefaultsOkBtn.addEventListener("click", function() {
        suggestedShotNamesTextarea.value = DEFAULT_AUTO_COMPLETE_TEXT;
        saveAutoCompleteText();
        // Update all existing shot title inputs with new suggestions
        updateAllShotTitleAutoComplete();
        autoCompleteDefaultsModal.classList.add("hidden");
      });
    }

    // Close auto-complete modal when clicking outside
    if (autoCompleteModal) {
      autoCompleteModal.addEventListener("click", function(event) {
        if (event.target === autoCompleteModal) {
          autoCompleteModal.classList.add("hidden");
        }
      });
    }

    // Close defaults confirmation modal when clicking outside
    if (autoCompleteDefaultsModal) {
      autoCompleteDefaultsModal.addEventListener("click", function(event) {
        if (event.target === autoCompleteDefaultsModal) {
          autoCompleteDefaultsModal.classList.add("hidden");
        }
      });
    }


  }

  if (loadBtn) {
    const loadDropdown = document.getElementById("loadDropdown");
    const loadFileMenuItem = document.getElementById("loadFileMenuItem");
    const pasteMenuItem = document.getElementById("pasteMenuItem");

    // Toggle dropdown on load button click
    loadBtn.addEventListener("click", function(event) {
      event.stopPropagation();
      const isActive = loadDropdown.classList.contains("active");
      closeAllDropdowns(loadDropdown);
      if (!isActive) {
        loadDropdown.classList.add("active");
      }
    });

    // Load file menu item click
    if (loadFileMenuItem) {
      loadFileMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        loadDropdown.classList.remove("active");
        console.log("Load from file clicked");
        // Trigger file input to open file dialog
        if (workoutFileInput) {
          workoutFileInput.click();
        } else {
          console.error("workoutFileInput not found.");
        }
      });
    }

    // Paste menu item click
    if (pasteMenuItem) {
      pasteMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        loadDropdown.classList.remove("active");
        handlePasteWorkout();
      });
    }


  }

  if (saveBtn) {
    const saveDropdown = document.getElementById("saveDropdown");
    const saveFileMenuItem = document.getElementById("saveFileMenuItem");
    const copyMenuItem = document.getElementById("copyMenuItem");

    // Toggle dropdown on save button click
    saveBtn.addEventListener("click", function(event) {
      event.stopPropagation();
      const isActive = saveDropdown.classList.contains("active");
      closeAllDropdowns(saveDropdown);
      if (!isActive) {
        saveDropdown.classList.add("active");
      }
    });

    // Save file menu item click
    if (saveFileMenuItem) {
      saveFileMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        saveDropdown.classList.remove("active");
        console.log("Save to file clicked");
        saveWorkout();
      });
    }

    // Copy menu item click
    if (copyMenuItem) {
      copyMenuItem.addEventListener("click", function(event) {
        event.stopPropagation();
        saveDropdown.classList.remove("active");
        handleCopyWorkout();
      });
    }


  }

  // --- Centralized Dropdown Management ---

  // Global click handler to close all dropdowns when clicking outside
  document.addEventListener("click", function(event) {
    // Check if click is outside all dropdowns and their trigger buttons
    const toolbarButtons = [
      document.getElementById("executeBtn"),
      document.getElementById("editorBtn"),
      document.getElementById("loadBtn"),
      document.getElementById("saveBtn")
    ];

    const toolbarDropdowns = [
      document.getElementById("executeDropdown"),
      document.getElementById("editorDropdown"),
      document.getElementById("loadDropdown"),
      document.getElementById("saveDropdown")
    ];

    let clickedOnDropdownOrButton = false;

    // Check if clicked on any toolbar button or dropdown
    toolbarButtons.forEach((button, index) => {
      if (button && (button.contains(event.target) ||
          (toolbarDropdowns[index] && toolbarDropdowns[index].contains(event.target)))) {
        clickedOnDropdownOrButton = true;
      }
    });

    // Check if clicked on any settings panel or its trigger
    const settingsBtns = document.querySelectorAll(".settings-btn");
    const settingsPanels = document.querySelectorAll(".settings-panel");

    settingsBtns.forEach(btn => {
      if (btn.contains(event.target)) {
        clickedOnDropdownOrButton = true;
      }
    });

    settingsPanels.forEach(panel => {
      if (panel.contains(event.target)) {
        clickedOnDropdownOrButton = true;
      }
    });

    // Check if clicked on any rocket indicator or its dropdown
    const rocketIndicators = document.querySelectorAll(".rocket-indicator");
    const rocketDropdowns = document.querySelectorAll(".rocket-indicator-dropdown");

    rocketIndicators.forEach(indicator => {
      if (indicator.contains(event.target)) {
        clickedOnDropdownOrButton = true;
      }
    });

    rocketDropdowns.forEach(dropdown => {
      if (dropdown.contains(event.target)) {
        clickedOnDropdownOrButton = true;
      }
    });

    // If click was outside all dropdowns and buttons, close all dropdowns
    if (!clickedOnDropdownOrButton) {
      closeAllDropdowns();
    }
  });

  // Global focus/blur handlers to close dropdowns when focus is lost
  document.addEventListener("focusin", function(event) {
    // Allow focus within dropdowns, but close others when focusing outside
    const toolbarDropdowns = [
      document.getElementById("executeDropdown"),
      document.getElementById("editorDropdown"),
      document.getElementById("loadDropdown"),
      document.getElementById("saveDropdown")
    ];

    let focusedInDropdown = false;

    // Check if focus is within any dropdown or settings panel
    toolbarDropdowns.forEach(dropdown => {
      if (dropdown && dropdown.contains(event.target)) {
        focusedInDropdown = true;
      }
    });

    // Check settings panels and rocket dropdowns
    const settingsPanels = document.querySelectorAll(".settings-panel");
    const rocketDropdowns = document.querySelectorAll(".rocket-indicator-dropdown");

    settingsPanels.forEach(panel => {
      if (panel.contains(event.target)) {
        focusedInDropdown = true;
      }
    });

    rocketDropdowns.forEach(dropdown => {
      if (dropdown.contains(event.target)) {
        focusedInDropdown = true;
      }
    });

    // If focus moved outside all dropdowns, close them
    if (!focusedInDropdown) {
      // Use a small delay to allow for focus transitions within dropdowns
      setTimeout(() => {
        const activeElement = document.activeElement;
        let stillFocusedInDropdown = false;

        toolbarDropdowns.forEach(dropdown => {
          if (dropdown && dropdown.contains(activeElement)) {
            stillFocusedInDropdown = true;
          }
        });

        settingsPanels.forEach(panel => {
          if (panel.contains(activeElement)) {
            stillFocusedInDropdown = true;
          }
        });

        rocketDropdowns.forEach(dropdown => {
          if (dropdown.contains(activeElement)) {
            stillFocusedInDropdown = true;
          }
        });

        if (!stillFocusedInDropdown) {
          closeAllDropdowns();
        }
      }, 50);
    }
  });

  // Close all dropdowns when the window loses focus
  window.addEventListener("blur", function() {
    closeAllDropdowns();
  });

  // Close all dropdowns on escape key
  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
      closeAllDropdowns();
    }
  });

  // --- Distance-based Toolbar Fade Effect ---
  let isToolbarHovered = false;
  let lastFocusedScrollY = 0; // Track the scroll position where toolbar was last fully visible
  let currentScrollOpacity = 1;
  let fadeDistance = 100; // Distance in pixels to fade from focused spot

  function setToolbarIconsOpacity(opacity) {
    const toolbarButtons = document.querySelectorAll('.theme-toggle, .rocket-toggle, .duck-toggle, .toolbar-icon-btn');
    toolbarButtons.forEach(button => {
      button.style.transition = 'opacity 0.3s ease';
      button.style.opacity = opacity;
    });
  }

  function updateToolbarOpacity() {
    const scrollY = window.scrollY;

    // Special case: Full opacity when at the very top of the window
    if (scrollY === 0) {
      lastFocusedScrollY = 0; // Set the top as the focused spot
      currentScrollOpacity = 1;
      if (!isToolbarHovered) {
        setToolbarIconsOpacity(1);
      }
      return;
    }

    const distanceFromFocused = Math.abs(scrollY - lastFocusedScrollY);

    // Calculate opacity based on distance from focused spot
    let opacity = 1;
    if (distanceFromFocused > 0) {
      opacity = Math.max(0.3, 1 - (distanceFromFocused / fadeDistance));
    }
    currentScrollOpacity = opacity;

    // Apply opacity to all toolbar buttons (unless hovered)
    if (!isToolbarHovered) {
      setToolbarIconsOpacity(opacity);
    }

    // Auto-collapse chevron and fade out toolbars when scrolled away from focused spot
    const chevronBtn = document.getElementById("chevronBtn");
    const buttonGroup = document.querySelector('.fixed.top-4.left-4 > div:last-child');

    if (chevronBtn && buttonGroup && distanceFromFocused > 20) { // Collapse after 20px from focused spot
      if (buttonGroup.style.display !== 'none') {
        // Hide buttons with smooth animation
        buttonGroup.style.opacity = '0';
        buttonGroup.style.transform = 'translateY(-20px)';

        // Trigger counter-clockwise spin animation for auto-collapse
        chevronBtn.classList.remove('active');
        chevronBtn.setAttribute('title', 'Show toolbar');
        chevronBtn.blur();

        // Hide toolbar after animation
        setTimeout(() => {
          buttonGroup.style.display = 'none';
        }, 1000);

        // Fade out all toolbars when auto-collapsed - sync with rotation animation
        setTimeout(() => setToolbarIconsOpacity('0.3'), 1000);
      }
    }
  }

  // Add scroll event listener
  window.addEventListener('scroll', updateToolbarOpacity);

  // Add hover/focus effects for toolbar containers
  const leftToolbar = document.querySelector('.fixed.top-4.left-4');
  const rightToolbar = document.querySelector('.fixed.top-4.right-4');

  function handleToolbarEnter() {
    isToolbarHovered = true;
    // Set the current scroll position as the focused spot when hovering
    lastFocusedScrollY = window.scrollY;
    setToolbarIconsOpacity('1');
  }

  function handleToolbarLeave() {
    isToolbarHovered = false;
    // Update opacity based on distance from the focused spot
    updateToolbarOpacity();
  }

  if (leftToolbar) {
    leftToolbar.addEventListener('mouseenter', handleToolbarEnter);
    leftToolbar.addEventListener('mouseleave', handleToolbarLeave);
    leftToolbar.addEventListener('focusin', handleToolbarEnter);
    leftToolbar.addEventListener('focusout', handleToolbarLeave);
  }

  if (rightToolbar) {
    rightToolbar.addEventListener('mouseenter', handleToolbarEnter);
    rightToolbar.addEventListener('mouseleave', handleToolbarLeave);
    rightToolbar.addEventListener('focusin', handleToolbarEnter);
    rightToolbar.addEventListener('focusout', handleToolbarLeave);
  }

  // Initialize opacity on page load
  updateToolbarOpacity();

  // Listen for system theme changes (only if no user preference is saved)
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        themeState.currentTheme = e.matches ? "dark" : "light";
        applyTheme();
      }
    });

  // --- Default Config Elements ---
  const defaultConfigHeader = document.getElementById("defaultConfigHeader");
  const defaultConfigBody = document.getElementById("defaultConfigBody");
  const defaultConfigArrow = document.getElementById("defaultConfigArrow");
  const defaultIterationTypeSelect = document.getElementById(
    "defaultIterationTypeSelect",
  );
  const defaultLimitsTypeSelect = document.getElementById(
    "defaultLimitsTypeSelect",
  );
  const defaultShotLimitContainer = document.getElementById(
    "defaultShotLimitContainer",
  );
  const defaultShotLimitSlider = document.getElementById(
    "defaultShotLimitSlider",
  );
  const defaultShotLimitValue = document.getElementById(
    "defaultShotLimitValue",
  );
  const defaultTimeLimitContainer = document.getElementById(
    "defaultTimeLimitContainer",
  );
  const defaultTimeLimitSlider = document.getElementById(
    "defaultTimeLimitSlider",
  );
  const defaultTimeLimitValue = document.getElementById(
    "defaultTimeLimitValue",
  );
  const defaultShotIntervalSlider = document.getElementById(
    "defaultShotIntervalSlider",
  );
  const defaultShotIntervalValue = document.getElementById(
    "defaultShotIntervalValue",
  );
  const defaultLeadTimeSlider = document.getElementById(
    "defaultLeadTimeSlider",
  );
  const defaultLeadTimeValue = document.getElementById("defaultLeadTimeValue");
  const defaultOffsetEnabled = document.getElementById("defaultOffsetEnabled");
  const defaultOffsetControlsContainer = document.getElementById(
    "defaultOffsetControlsContainer",
  );
  const defaultOffsetTypeSelect = document.getElementById(
    "defaultOffsetTypeSelect",
  );
  const defaultOffsetFixedOption = document.getElementById(
    "defaultOffsetFixedOption",
  );
  const defaultOffsetRandomOption = document.getElementById(
    "defaultOffsetRandomOption",
  );
  const defaultOffsetFixedContainer = document.getElementById(
    "defaultOffsetFixedContainer",
  );
  const defaultOffsetRandomContainer = document.getElementById(
    "defaultOffsetRandomContainer",
  );
  const defaultOffsetFixedSlider = document.getElementById(
    "defaultOffsetFixedSlider",
  );
  const defaultOffsetRandomMaximumSlider = document.getElementById(
    "defaultOffsetRandomMaximumSlider",
  );
  const defaultOffsetRandomMinimumSlider = document.getElementById(
    "defaultOffsetRandomMinimumSlider",
  );
  const defaultSplitStepEnabled = document.getElementById(
    "defaultSplitStepEnabled",
  );
  const defaultSplitStepRateContainer = document.getElementById(
    "defaultSplitStepRateContainer",
  );
  const defaultSplitStepSpeedSelect = document.getElementById(
    "defaultSplitStepSpeedSelect",
  );
  const defaultVoiceEnabled = document.getElementById("defaultVoiceEnabled");
  const defaultVoiceOptionsContainer = document.getElementById(
    "defaultVoiceOptionsContainer",
  );
  const defaultVoiceSelect = document.getElementById("defaultVoiceSelect");
  const defaultVoiceRateSelect = document.getElementById(
    "defaultVoiceRateSelect",
  );
  const modalCancelBtn = document.getElementById("modalCancelBtn");
  const modalOkBtn = document.getElementById("modalOkBtn");
  const deleteModal = document.getElementById("deleteModal");
  const deleteModalTitle = document.getElementById("deleteModalTitle");
  const deleteModalCancelBtn = document.getElementById("deleteModalCancelBtn");
  const deleteModalOkBtn = document.getElementById("deleteModalOkBtn");

  let globalInstanceCounter = 0; // To ensure unique IDs across all patterns and their children

  // --- Workout Saving Functions ---

  /**
   * Generates a unique ID for workout elements.
   * @returns {string} A unique identifier.
   */
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Gets auto-complete suggestions from localStorage.
   * @returns {Array<string>} Array of suggestion strings.
   */
  function getAutoCompleteSuggestions() {
    const savedText = localStorage.getItem("autoCompleteText");
    const text = savedText || "Front Left, Front Right, Mid Left, Mid Right, Back Left, Back Right,\n1L, 1R, 2L, 2R, 3L, 3R, 4L, 4R, 5L, 5R";

    // Parse the text to extract individual suggestions
    // Split by commas and newlines, trim whitespace, and filter out empty strings
    const suggestions = text
      .split(/[,\n]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Return default suggestions if none are found
    if (suggestions.length === 0) {
      return ["Front Left", "Front Right", "Mid Left", "Mid Right", "Back Left", "Back Right"];
    }

    return suggestions;
  }

  /**
   * Gets the appropriate position type based on element's position and link state.
   * @param {HTMLElement} element The element to analyze.
   * @returns {string} The position type: 'normal', 'linked', 'last', or position number.
   */
  function getPositionType(element) {
    const isPositionLocked = element.dataset.positionLocked === "true";
    const isLinkedWithPrevious = element.dataset.linkedWithPrevious === "true";
    const lockType = element.dataset.positionLockType;

    if (isLinkedWithPrevious) {
      return "linked"; // Must follow previous
    }
    if (isPositionLocked) {
      if (lockType === "last") {
        return "last"; // Locked to last position
      } else {
        // For position locks, return the actual current position within the pattern
        return getElementPosition(element).toString();
      }
    }
    return "normal"; // Default in-order execution
  }

  /**
   * Collects global/default configuration values.
   * @returns {Object} Global configuration object.
   */
  function getGlobalConfigValues() {
    return {
      iterationType: defaultIterationTypeSelect
        ? defaultIterationTypeSelect.value
        : "in-order",
      limits: {
        type: defaultLimitsTypeSelect
          ? defaultLimitsTypeSelect.value
          : "all-shots",
        value: (() => {
          const limitsType = defaultLimitsTypeSelect
            ? defaultLimitsTypeSelect.value
            : "all-shots";
          if (limitsType === "shot-limit") {
            return defaultShotLimitSlider
              ? parseInt(defaultShotLimitSlider.value)
              : 1;
          } else if (limitsType === "time-limit") {
            const totalSeconds = defaultTimeLimitSlider
              ? parseInt(defaultTimeLimitSlider.value)
              : 600;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
            return `${minutes.toString().padStart(2, "0")}:${formattedSeconds}`;
          }
          return null;
        })(),
      },
      voice:
        defaultVoiceSelect && defaultVoiceSelect.value
          ? defaultVoiceSelect.value
          : "Default",
      speechRate: (() => {
        const rate = defaultVoiceRateSelect
          ? defaultVoiceRateSelect.value
          : "auto-scale";
        return rate === "auto-scale" ? 1.0 : parseFloat(rate);
      })(),
      interval: defaultShotIntervalSlider
        ? parseFloat(defaultShotIntervalSlider.value)
        : 5.0,
      intervalOffsetType: defaultOffsetTypeSelect
        ? defaultOffsetTypeSelect.value
        : "fixed",
      intervalOffset: {
        min: (() => {
          const type = defaultOffsetTypeSelect ? defaultOffsetTypeSelect.value : "fixed";
          if (type === "fixed") {
            return defaultOffsetFixedSlider ? parseFloat(defaultOffsetFixedSlider.value) : 0.0;
          } else {
            return defaultOffsetRandomMinimumSlider
              ? parseFloat(defaultOffsetRandomMinimumSlider.value)
              : 0.0;
          }
        })(),
        max: (() => {
          const type = defaultOffsetTypeSelect ? defaultOffsetTypeSelect.value : "fixed";
          if (type === "fixed") {
            return defaultOffsetFixedSlider ? parseFloat(defaultOffsetFixedSlider.value) : 0.0;
          } else {
            return defaultOffsetRandomMaximumSlider
              ? parseFloat(defaultOffsetRandomMaximumSlider.value)
              : 0.0;
          }
        })(),
      },
      autoVoiceSplitStep: defaultSplitStepSpeedSelect
        ? defaultSplitStepSpeedSelect.value === "auto-scale"
        : true,
      shotAnnouncementLeadTime: defaultLeadTimeSlider
        ? parseFloat(defaultLeadTimeSlider.value)
        : 2.5,
      splitStepSpeed: defaultSplitStepSpeedSelect
        ? defaultSplitStepSpeedSelect.value
        : "auto-scale",
    };
  }

  /**
   * Converts a shot instance to JSON format.
   * @param {HTMLElement} shotElement The shot instance element.
   * @returns {Object} Shot object in JSON format.
   */
  function shotToJSON(shotElement) {
    const titleInput = shotElement.querySelector(".shot-title");
    const repeatSlider = shotElement.querySelector(".repeat-slider");
    const shotIntervalSlider = shotElement.querySelector(
      ".shot-interval-slider",
    );
    const leadTimeSlider = shotElement.querySelector(".lead-time-slider");

    const offsetEnabledCheckbox = shotElement.querySelector(".offset-enabled");
    const offsetTypeSelect = shotElement.querySelector(".offset-type-select");
    const offsetFixedSlider = shotElement.querySelector(".offset-fixed-slider");
    const offsetRandomMaximumSlider = shotElement.querySelector(
      ".offset-random-maximum-slider",
    );
    const offsetRandomMinimumSlider = shotElement.querySelector(
      ".offset-random-minimum-slider",
    );

    const splitStepEnabledCheckbox = shotElement.querySelector(
      ".split-step-enabled",
    );
    const splitStepSpeedSelect = shotElement.querySelector(
      ".split-step-speed-select",
    );

    const voiceEnabledCheckbox = shotElement.querySelector(".voice-enabled");
    const voiceSelect = shotElement.querySelector(".voice-select");
    const voiceRateSelect = shotElement.querySelector(".voice-rate-select");

    // Check if shot has non-default settings
    const hasNonDefault = hasNonDefaultSettings(shotElement);

    const shotObject = {
      type: "Shot",
      id: shotElement.id || generateUniqueId(),
      name: titleInput ? titleInput.value : "New shot",
      positionType: getPositionType(shotElement),
    };

    // Only include config if there are non-default settings
    if (hasNonDefault) {
      shotObject.config = {
        repeatCount: repeatSlider ? parseInt(repeatSlider.value) : 1,
        interval: shotIntervalSlider
          ? parseFloat(shotIntervalSlider.value)
          : 5.0,
        intervalOffsetType: offsetTypeSelect ? offsetTypeSelect.value : "fixed",
        intervalOffset: {
          min: (() => {
            const type = offsetTypeSelect ? offsetTypeSelect.value : "fixed";
            if (type === "fixed") {
              return offsetFixedSlider ? parseFloat(offsetFixedSlider.value) : 0;
            } else {
              return offsetRandomMinimumSlider
                ? parseFloat(offsetRandomMinimumSlider.value)
                : 0;
            }
          })(),
          max: (() => {
            const type = offsetTypeSelect ? offsetTypeSelect.value : "fixed";
            if (type === "fixed") {
              return offsetFixedSlider ? parseFloat(offsetFixedSlider.value) : 0;
            } else {
              return offsetRandomMaximumSlider
                ? parseFloat(offsetRandomMaximumSlider.value)
                : 0;
            }
          })(),
        },
        autoVoiceSplitStep: splitStepSpeedSelect
          ? splitStepSpeedSelect.value === "auto-scale"
          : true,
        shotAnnouncementLeadTime: leadTimeSlider
          ? parseFloat(leadTimeSlider.value)
          : 2.5,
        splitStepSpeed: (() => {
          if (splitStepEnabledCheckbox && !splitStepEnabledCheckbox.checked)
            return "none";
          const speed = splitStepSpeedSelect
            ? splitStepSpeedSelect.value
            : "auto-scale";
          return speed === "auto-scale" ? "medium" : speed;
        })(),
        voice:
          voiceEnabledCheckbox && voiceEnabledCheckbox.checked && voiceSelect
            ? voiceSelect.value
            : undefined,
        speechRate: (() => {
          if (!voiceEnabledCheckbox || !voiceEnabledCheckbox.checked)
            return undefined;
          const rate = voiceRateSelect ? voiceRateSelect.value : "auto-scale";
          return rate === "auto-scale" ? undefined : parseFloat(rate);
        })(),
      };
    }

    return shotObject;
  }

  /**
   * Converts a message instance to JSON format.
   * @param {HTMLElement} messageElement The message instance element.
   * @returns {Object} Message object in JSON format.
   */
  function messageToJSON(messageElement) {
    const titleInput = messageElement.querySelector(".message-title");
    const repeatSlider = messageElement.querySelector(".repeat-slider");
    const messageInput = messageElement.querySelector(".message-input");
    const messageIntervalSlider = messageElement.querySelector(
      ".message-interval-slider",
    );
    const messageIntervalTypeSelect = messageElement.querySelector(
      ".message-interval-type-select",
    );
    const messageCountdownEnabled = messageElement.querySelector(
      ".message-countdown-enabled",
    );
    const skipAtEndCheckbox = messageElement.querySelector(
      ".skip-at-end-of-workout",
    );

    const voiceEnabledCheckbox = messageElement.querySelector(".voice-enabled");
    const voiceSelect = messageElement.querySelector(".voice-select");
    const voiceRateSelect = messageElement.querySelector(".voice-rate-select");

    return {
      type: "Message",
      id: messageElement.id || generateUniqueId(),
      name: titleInput ? titleInput.value : "New message",
      positionType: getPositionType(messageElement),
      config: {
        repeatCount: repeatSlider ? parseInt(repeatSlider.value) : 1,
        message:
          messageInput && messageInput.value.trim()
            ? messageInput.value
            : "New message",
        interval: (() => {
          const seconds = messageIntervalSlider
            ? parseInt(messageIntervalSlider.value)
            : 0;
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
        })(),
        intervalType: messageIntervalTypeSelect
          ? messageIntervalTypeSelect.value
          : "fixed",
        countdown: messageCountdownEnabled
          ? messageCountdownEnabled.checked
          : false,
        skipAtEndOfWorkout: skipAtEndCheckbox
          ? skipAtEndCheckbox.checked
          : false,
        voice: voiceEnabledCheckbox && voiceEnabledCheckbox.checked && voiceSelect ? voiceSelect.value : undefined,
        speechRate: (() => {
          if (!voiceEnabledCheckbox || !voiceEnabledCheckbox.checked) return undefined;
          const rate = voiceRateSelect ? voiceRateSelect.value : "auto-scale";
          return rate === "auto-scale" ? undefined : parseFloat(rate);
        })(),
      },
    };
  }

  /**
   * Converts a pattern instance to JSON format.
   * @param {HTMLElement} patternElement The pattern instance element.
   * @returns {Object} Pattern object in JSON format.
   */
  function patternToJSON(patternElement) {
    const titleInput = patternElement.querySelector(".pattern-panel-title");
    const repeatSlider = patternElement.querySelector(".repeat-slider");
    const iterationTypeSelect = patternElement.querySelector(
      ".iteration-type-select",
    );
    const limitsTypeSelect = patternElement.querySelector(
      ".limits-type-select",
    );
    const shotLimitSlider = patternElement.querySelector(".shot-limit-slider");
    const timeLimitSlider = patternElement.querySelector(".time-limit-slider");

    const shotIntervalSlider = patternElement.querySelector(".shot-interval-slider");
    const leadTimeSlider = patternElement.querySelector(".lead-time-slider");

    const offsetEnabledCheckbox = patternElement.querySelector(".offset-enabled");
    const offsetTypeSelect = patternElement.querySelector(".offset-type-select");
    const offsetFixedSlider = patternElement.querySelector(".offset-fixed-slider");
    const offsetRandomMaximumSlider = patternElement.querySelector(".offset-random-maximum-slider");
    const offsetRandomMinimumSlider = patternElement.querySelector(".offset-random-minimum-slider");

    const splitStepEnabledCheckbox = patternElement.querySelector(".split-step-enabled");
    const splitStepSpeedSelect = patternElement.querySelector(".split-step-speed-select");

    const voiceEnabledCheckbox = patternElement.querySelector(".voice-enabled");
    const voiceSelect = patternElement.querySelector(".voice-select");
    const voiceRateSelect = patternElement.querySelector(".voice-rate-select");

    // Collect entries (shots and messages)
    const entries = [];
    patternElement
      .querySelectorAll(".shot-msg-instance")
      .forEach((instance) => {
        if (instance.classList.contains("shot-instance")) {
          entries.push(shotToJSON(instance));
        } else if (instance.classList.contains("message-instance")) {
          entries.push(messageToJSON(instance));
        }
      });

    return {
      type: "Pattern",
      id: patternElement.id || generateUniqueId(),
      name: titleInput ? titleInput.value : "New pattern",
      positionType: getPositionType(patternElement),
      config: {
        repeatCount: repeatSlider ? parseInt(repeatSlider.value) : 1,
        iterationType: iterationTypeSelect
          ? iterationTypeSelect.value
          : "in-order",
        limits: {
          type: limitsTypeSelect ? limitsTypeSelect.value : "all-shots",
          value: (() => {
            const limitsType = limitsTypeSelect
              ? limitsTypeSelect.value
              : "all-shots";
            if (limitsType === "shot-limit") {
              return shotLimitSlider ? parseInt(shotLimitSlider.value) : 1;
            } else if (limitsType === "time-limit") {
              const totalSeconds = timeLimitSlider
                ? parseInt(timeLimitSlider.value)
                : 600;
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            }
            return null;
          })(),
        },
        interval: shotIntervalSlider ? parseFloat(shotIntervalSlider.value) : undefined,
        intervalOffsetType: offsetTypeSelect ? offsetTypeSelect.value : undefined,
        intervalOffset: offsetEnabledCheckbox && offsetEnabledCheckbox.checked ? {
          min: (() => {
            const type = offsetTypeSelect ? offsetTypeSelect.value : "fixed";
            if (type === "fixed") {
              return offsetFixedSlider ? parseFloat(offsetFixedSlider.value) : 0;
            } else {
              return offsetRandomMinimumSlider ? parseFloat(offsetRandomMinimumSlider.value) : 0;
            }
          })(),
          max: (() => {
            const type = offsetTypeSelect ? offsetTypeSelect.value : "fixed";
            if (type === "fixed") {
              return offsetFixedSlider ? parseFloat(offsetFixedSlider.value) : 0;
            } else {
              return offsetRandomMaximumSlider ? parseFloat(offsetRandomMaximumSlider.value) : 0;
            }
          })(),
        } : undefined,
        autoVoiceSplitStep: splitStepSpeedSelect ? splitStepSpeedSelect.value === "auto-scale" : undefined,
        shotAnnouncementLeadTime: leadTimeSlider ? parseFloat(leadTimeSlider.value) : undefined,
        splitStepSpeed: (() => {
          if (splitStepEnabledCheckbox && !splitStepEnabledCheckbox.checked) return "none";
          const speed = splitStepSpeedSelect ? splitStepSpeedSelect.value : "auto-scale";
          return speed === "auto-scale" ? undefined : speed;
        })(),
        voice: voiceEnabledCheckbox && voiceEnabledCheckbox.checked && voiceSelect ? voiceSelect.value : undefined,
        speechRate: (() => {
          if (!voiceEnabledCheckbox || !voiceEnabledCheckbox.checked) return undefined;
          const rate = voiceRateSelect ? voiceRateSelect.value : "auto-scale";
          return rate === "auto-scale" ? undefined : parseFloat(rate);
        })(),
      },
      entries: entries,
    };
  }

  /**
   * Collects the complete workout state and converts to JSON format.
   * @returns {Object} Complete workout object in JSON format.
   */
  function getWorkoutJSON() {
    const patterns = [];
    document.querySelectorAll(".pattern-instance").forEach((patternElement) => {
      patterns.push(patternToJSON(patternElement));
    });

    const globalConfig = getGlobalConfigValues();

    const workoutNameInput = document.querySelector(".workout-name");
    return {
      type: "Workout",
      name: workoutNameInput ? workoutNameInput.value : "My Squash Workout",
      config: globalConfig,
      patterns: patterns,
    };
  }

  /**
   * Downloads the workout as a JSON file.
   */
  function saveWorkout() {
    try {
      const workoutData = getWorkoutJSON();
      let jsonString = JSON.stringify(workoutData, null, 2);

      // Post-process the JSON to ensure float values show decimal points
      // This ensures speechRate, interval, and intervalOffset values are always shown as floats
      // Use word boundaries to avoid matching numbers that are already part of decimal values
      jsonString = jsonString.replace(/"speechRate": (\d+)(?!\.)/g, '"speechRate": $1.0');
      jsonString = jsonString.replace(/"interval": (\d+)(?!\.)/g, '"interval": $1.0');
      jsonString = jsonString.replace(/"min": (\d+)(?!\.)/g, '"min": $1.0');
      jsonString = jsonString.replace(/"max": (\d+)(?!\.)/g, '"max": $1.0');
      jsonString = jsonString.replace(/"shotAnnouncementLeadTime": (\d+)(?!\.)/g, '"shotAnnouncementLeadTime": $1.0');

      // Create a blob with the JSON data
      const blob = new Blob([jsonString], { type: "application/json" });

      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `workout_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.workout.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the URL
      URL.revokeObjectURL(url);

      // Log success after download is initiated
      // Note: This indicates the download dialog was shown, but actual save depends on user action
      console.log("Workout download initiated successfully");
      console.log("File will be saved when user confirms the download dialog");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Error saving workout. Please check the console for details.");
    }
  }

  /**
   * Handles copying the current workout to clipboard.
   */
  async function handleCopyWorkout() {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        alert("Clipboard access is not available in this browser or context. Please use the Save option instead.");
        return;
      }

      const workoutData = getWorkoutJSON();
      let jsonString = JSON.stringify(workoutData, null, 2);

      // Post-process the JSON to ensure float values show decimal points
      // This ensures speechRate, interval, and intervalOffset values are always shown as floats
      // Use word boundaries to avoid matching numbers that are already part of decimal values
      jsonString = jsonString.replace(/"speechRate": (\d+)(?!\.)/g, '"speechRate": $1.0');
      jsonString = jsonString.replace(/"interval": (\d+)(?!\.)/g, '"interval": $1.0');
      jsonString = jsonString.replace(/"min": (\d+)(?!\.)/g, '"min": $1.0');
      jsonString = jsonString.replace(/"max": (\d+)(?!\.)/g, '"max": $1.0');
      jsonString = jsonString.replace(/"shotAnnouncementLeadTime": (\d+)(?!\.)/g, '"shotAnnouncementLeadTime": $1.0');

      // Copy to clipboard
      await navigator.clipboard.writeText(jsonString);

      console.log("Workout copied to clipboard successfully");

      // Show a temporary success message (you could also use a toast notification here)
      alert("Workout copied to clipboard successfully!");

    } catch (clipboardError) {
      console.error("Error copying workout to clipboard:", clipboardError);
      alert("Error copying workout to clipboard. Please ensure you have granted clipboard permissions or use the Save option instead.");
    }
  }

  // --- Workout Loading Functions ---

  /**
   * Validates the structure and content of a workout JSON object.
   * @param {Object} workoutData The parsed JSON object to validate.
   * @returns {Object} Validation result with success flag and error messages.
   */
  function validateWorkoutJSON(workoutData) {
    const errors = [];

    // Basic structure validation
    if (!workoutData || typeof workoutData !== "object") {
      return { success: false, errors: ["Invalid JSON structure"] };
    }

    // Required root properties
    if (workoutData.type !== "Workout") {
      errors.push('Root object must have type "Workout"');
    }

    if (!workoutData.name || typeof workoutData.name !== "string") {
      errors.push("Workout must have a valid name");
    }

    // Config validation
    if (!workoutData.config || typeof workoutData.config !== "object") {
      errors.push("Workout must have a config object");
    } else {
      const config = workoutData.config;

      if (!["in-order", "shuffle"].includes(config.iterationType)) {
        errors.push('Config iterationType must be "in-order" or "shuffle"');
      }

      if (!config.limits || typeof config.limits !== "object") {
        errors.push("Config must have limits object");
      } else {
        if (
          !["all-shots", "shot-limit", "time-limit"].includes(
            config.limits.type,
          )
        ) {
          errors.push(
            'Limits type must be "all-shots", "shot-limit", or "time-limit"',
          );
        }

        // Validate limit values
        if (config.limits.type === "shot-limit") {
          if (
            typeof config.limits.value !== "number" ||
            config.limits.value < 1 ||
            config.limits.value > 50
          ) {
            errors.push("Shot limit value must be a number between 1 and 50");
          }
        } else if (config.limits.type === "time-limit") {
          if (
            typeof config.limits.value !== "string" ||
            !/^\d{2}:\d{2}$/.test(config.limits.value)
          ) {
            errors.push("Time limit value must be in MM:SS format");
          }
        } else if (config.limits.type === "all-shots") {
          if (config.limits.value !== null) {
            errors.push("All-shots limit value must be null");
          }
        }
      }

      // Validate voice field (optional)
      if (
        config.voice !== undefined &&
        (typeof config.voice !== "string" || config.voice === "")
      ) {
        errors.push("Voice must be a non-empty string when provided");
      }

      // Validate speechRate field (optional)
      if (
        config.speechRate !== undefined &&
        (typeof config.speechRate !== "number" ||
          config.speechRate < 0.5 ||
          config.speechRate > 1.5)
      ) {
        errors.push(
          "Speech rate must be a number between 0.5 and 1.5 when provided",
        );
      }
    }

    // Patterns validation
    if (
      !Array.isArray(workoutData.patterns) ||
      workoutData.patterns.length === 0
    ) {
      errors.push("Workout must have at least one pattern");
    } else {
      workoutData.patterns.forEach((pattern, index) => {
        const patternErrors = validatePatternJSON(
          pattern,
          `Pattern ${index + 1}`,
        );
        errors.push(...patternErrors);
      });
    }

    return { success: errors.length === 0, errors };
  }

  /**
   * Validates a pattern JSON object.
   * @param {Object} pattern The pattern object to validate.
   * @param {string} context Context for error messages.
   * @returns {Array} Array of error messages.
   */
  function validatePatternJSON(pattern, context) {
    const errors = [];

    if (!pattern || typeof pattern !== "object") {
      return [`${context}: Invalid pattern structure`];
    }

    if (pattern.type !== "Pattern") {
      errors.push(`${context}: Must have type "Pattern"`);
    }

    if (!pattern.name || typeof pattern.name !== "string") {
      errors.push(`${context}: Must have a valid name`);
    }

    if (!pattern.id || typeof pattern.id !== "string") {
      errors.push(`${context}: Must have a valid id`);
    }

    // Validate positionType
    if (pattern.positionType) {
      const validSpecialTypes = ["normal", "linked", "last"];
      const positionNum = parseInt(pattern.positionType);
      const isValidPosition = !isNaN(positionNum) && positionNum > 0;

      if (
        !validSpecialTypes.includes(pattern.positionType) &&
        !isValidPosition
      ) {
        errors.push(
          `${context}: positionType must be "normal", "linked", "last", or a positive integer`,
        );
      }
    } else {
      errors.push(`${context}: positionType is required`);
    }

    // Config validation - config is optional for DRY compatibility
    if (pattern.config && typeof pattern.config === "object") {
      const config = pattern.config;

      // Validate repeatCount if explicitly set (inherits from defaults if not set)
      if (config.repeatCount !== undefined) {
        if (
          typeof config.repeatCount !== "number" ||
          config.repeatCount < 1 ||
          config.repeatCount > 10
        ) {
          errors.push(
            `${context}: repeatCount must be a number between 1 and 10`,
          );
        }
      }

      // Validate iteration if explicitly set
      if (config.iterationType && !["in-order", "shuffle"].includes(config.iterationType)) {
        errors.push(
          `${context}: iterationType must be "in-order" or "shuffle"`,
        );
      }

      // Validate limits if explicitly set
      if (config.limits && typeof config.limits === "object") {
        if (
          !["all-shots", "shot-limit", "time-limit"].includes(
            config.limits.type,
          )
        ) {
          errors.push(
            `${context}: limits type must be "all-shots", "shot-limit", or "time-limit"`,
          );
        }

        // Validate limit values
        if (config.limits.type === "shot-limit") {
          if (
            typeof config.limits.value !== "number" ||
            config.limits.value < 1 ||
            config.limits.value > 50
          ) {
            errors.push(
              `${context}: Shot limit value must be a number between 1 and 50`,
            );
          }
        } else if (config.limits.type === "time-limit") {
          if (
            typeof config.limits.value !== "string" ||
            !/^\d{2}:\d{2}$/.test(config.limits.value)
          ) {
            errors.push(`${context}: Time limit value must be in MM:SS format`);
          }
        } else if (config.limits.type === "all-shots") {
          if (config.limits.value !== null) {
            errors.push(`${context}: All-shots limit value must be null`);
          }
        }
      }

      // Validate optional voice field
      if (
        config.voice !== undefined &&
        (typeof config.voice !== "string" || config.voice === "")
      ) {
        errors.push(
          `${context}: Voice must be a non-empty string when provided`,
        );
      }

      // Validate optional speechRate field
      if (
        config.speechRate !== undefined &&
        (typeof config.speechRate !== "number" ||
          config.speechRate < 0.5 ||
          config.speechRate > 1.5)
      ) {
        errors.push(
          `${context}: Speech rate must be a number between 0.5 and 1.5 when provided`,
        );
      }
    }

    // Entries validation
    if (!Array.isArray(pattern.entries) || pattern.entries.length === 0) {
      errors.push(`${context}: Must have at least one entry`);
    } else {
      pattern.entries.forEach((entry, index) => {
        const entryErrors = validateEntryJSON(
          entry,
          `${context} Entry ${index + 1}`,
        );
        errors.push(...entryErrors);
      });
    }

    return errors;
  }

  /**
   * Validates a shot or message JSON object.
   * @param {Object} entry The entry object to validate.
   * @param {string} context Context for error messages.
   * @returns {Array} Array of error messages.
   */
  function validateEntryJSON(entry, context) {
    const errors = [];

    if (!entry || typeof entry !== "object") {
      return [`${context}: Invalid entry structure`];
    }

    if (!["Shot", "Message"].includes(entry.type)) {
      errors.push(`${context}: Type must be "Shot" or "Message"`);
    }

    if (!entry.name || typeof entry.name !== "string") {
      errors.push(`${context}: Must have a valid name`);
    }

    if (!entry.id || typeof entry.id !== "string") {
      errors.push(`${context}: Must have a valid id`);
    }

    // Validate positionType
    if (entry.positionType) {
      const validSpecialTypes = ["normal", "linked", "last"];
      const positionNum = parseInt(entry.positionType);
      const isValidPosition = !isNaN(positionNum) && positionNum > 0;

      if (!validSpecialTypes.includes(entry.positionType) && !isValidPosition) {
        errors.push(
          `${context}: positionType must be "normal", "linked", "last", or a positive integer`,
        );
      }
    } else {
      errors.push(`${context}: positionType is required`);
    }

    // Config validation - config is optional for DRY compatibility
    const config = entry.config;

    if (config && typeof config === "object") {
      // Validate repeatCount if explicitly set (inherits from pattern defaults if not set)
      if (config.repeatCount !== undefined) {
        if (
          typeof config.repeatCount !== "number" ||
          config.repeatCount < 1 ||
          config.repeatCount > 10
        ) {
          errors.push(`${context}: repeatCount must be a number between 1 and 10`);
        }
      }
    }

    if (entry.type === "Shot") {
      // Validate interval if explicitly set (inherits from pattern/workout if not set)
      if (config && config.interval !== undefined) {
        if (
          typeof config.interval !== "number" ||
          config.interval < 3.0 ||
          config.interval > 8.0
        ) {
          errors.push(
            `${context}: Shot interval must be between 3.0 and 8.0 seconds`,
          );
        }
      }

      // Validate intervalOffsetType if explicitly set
      if (config && config.intervalOffsetType && !["fixed", "random"].includes(config.intervalOffsetType)) {
        errors.push(`${context}: intervalOffsetType must be "fixed" or "random"`);
      }

      // Validate shotAnnouncementLeadTime if explicitly set
      if (config && config.shotAnnouncementLeadTime !== undefined) {
        if (
          typeof config.shotAnnouncementLeadTime !== "number" ||
          config.shotAnnouncementLeadTime < 2.5 ||
          (config.interval && config.shotAnnouncementLeadTime > config.interval)
        ) {
          errors.push(
            `${context}: shotAnnouncementLeadTime must be between 2.5 and interval value`,
          );
        }
      }

      // Validate intervalOffset object if explicitly set
      if (config && config.intervalOffset && typeof config.intervalOffset === "object") {
        if (
          typeof config.intervalOffset.min !== "number" ||
          config.intervalOffset.min < -2.0 ||
          config.intervalOffset.min > 2.0
        ) {
          errors.push(
            `${context}: intervalOffset.min must be between -2.0 and 2.0`,
          );
        }
        if (
          typeof config.intervalOffset.max !== "number" ||
          config.intervalOffset.max < -2.0 ||
          config.intervalOffset.max > 2.0
        ) {
          errors.push(
            `${context}: intervalOffset.max must be between -2.0 and 2.0`,
          );
        }
        if (config.intervalOffset.min > config.intervalOffset.max) {
          errors.push(
            `${context}: intervalOffset.min must be less than or equal to intervalOffset.max`,
          );
        }
      }

      // Validate autoVoiceSplitStep if explicitly set
      if (config && config.autoVoiceSplitStep !== undefined && typeof config.autoVoiceSplitStep !== "boolean") {
        errors.push(`${context}: autoVoiceSplitStep must be a boolean`);
      }

      // Validate splitStepSpeed if explicitly set
      if (config && config.splitStepSpeed && !["none", "slow", "medium", "fast", "random", "auto-scale"].includes(config.splitStepSpeed)) {
        errors.push(
          `${context}: splitStepSpeed must be "none", "slow", "medium", "fast", "random", or "auto-scale"`,
        );
      }

      // Validate optional voice field
      if (
        config && config.voice !== undefined &&
        (typeof config.voice !== "string" || config.voice === "")
      ) {
        errors.push(
          `${context}: Voice must be a non-empty string when provided`,
        );
      }

      // Validate optional speechRate field
      if (
        config && config.speechRate !== undefined &&
        (typeof config.speechRate !== "number" ||
          config.speechRate < 0.5 ||
          config.speechRate > 1.5)
      ) {
        errors.push(
          `${context}: Speech rate must be a number between 0.5 and 1.5 when provided`,
        );
      }
    } else if (entry.type === "Message") {
      // Validate message text if explicitly set (required for messages)
      if (config && config.message !== undefined && (!config.message || typeof config.message !== "string")) {
        errors.push(`${context}: Message must have valid message text`);
      }

      // Validate interval format (MM:SS) if explicitly set
      if (config && config.interval !== undefined) {
        if (
          typeof config.interval !== "string" ||
          !/^\d{2}:\d{2}$/.test(config.interval)
        ) {
          errors.push(`${context}: interval must be in MM:SS format`);
        }
      }

      // Validate intervalType if explicitly set
      if (config && config.intervalType !== undefined && !["fixed", "additional"].includes(config.intervalType)) {
        errors.push(`${context}: intervalType must be "fixed" or "additional"`);
      }

      // Validate countdown if explicitly set
      if (config && config.countdown !== undefined && typeof config.countdown !== "boolean") {
        errors.push(`${context}: countdown must be a boolean`);
      }

      // Validate skipAtEndOfWorkout if explicitly set
      if (config && config.skipAtEndOfWorkout !== undefined && typeof config.skipAtEndOfWorkout !== "boolean") {
        errors.push(`${context}: skipAtEndOfWorkout must be a boolean`);
      }

      // Validate optional voice field
      if (
        config && config.voice !== undefined &&
        (typeof config.voice !== "string" || config.voice === "")
      ) {
        errors.push(
          `${context}: Voice must be a non-empty string when provided`,
        );
      }

      // Validate optional speechRate field
      if (
        config && config.speechRate !== undefined &&
        (typeof config.speechRate !== "number" ||
          config.speechRate < 0.5 ||
          config.speechRate > 1.5)
      ) {
        errors.push(
          `${context}: Speech rate must be a number between 0.5 and 1.5 when provided`,
        );
      }
    }

    return errors;
  }

  /**
   * Clears the current workout and resets to empty state.
   */
  function clearWorkout() {
    // Reset workout name to default
    const workoutNameInput = document.querySelector(".workout-name");
    if (workoutNameInput) {
      workoutNameInput.value = "My Squash Workout";
    }

    // Remove all existing patterns
    const existingPatterns =
      mainContainer.querySelectorAll(".pattern-instance");
    existingPatterns.forEach((pattern) => pattern.remove());
  }

  /**
   * Sets global configuration from loaded workout data.
   * @param {Object} config The global config object from workout JSON.
   */
  function setGlobalConfig(config) {
    if (defaultIterationTypeSelect && config.iterationType) {
      defaultIterationTypeSelect.value = config.iterationType;
    }

    if (config.limits) {
      if (defaultLimitsTypeSelect) {
        defaultLimitsTypeSelect.value = config.limits.type;
        // Trigger change event to show/hide appropriate containers
        defaultLimitsTypeSelect.dispatchEvent(new Event("change"));
      }

      if (
        config.limits.type === "shot-limit" &&
        defaultShotLimitSlider &&
        config.limits.value
      ) {
        defaultShotLimitSlider.value = config.limits.value;
        if (defaultShotLimitValue) {
          defaultShotLimitValue.textContent = config.limits.value;
        }
      }

      if (
        config.limits.type === "time-limit" &&
        defaultTimeLimitSlider &&
        config.limits.value
      ) {
        // Convert MM:SS to seconds
        const timeParts = config.limits.value.split(":");
        const totalSeconds =
          parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        defaultTimeLimitSlider.value = totalSeconds;
        if (defaultTimeLimitValue) {
          defaultTimeLimitValue.textContent = config.limits.value;
        }
      }
    }

    if (defaultVoiceSelect && config.voice) {
      defaultVoiceSelect.value = config.voice;
    }

    if (defaultVoiceRateSelect && config.speechRate) {
      const rateValue =
        config.speechRate === 1.0 ? "auto-scale" : config.speechRate.toString();
      defaultVoiceRateSelect.value = rateValue;
    }
  }

  /**
   * Converts positionType value back to UI data attributes.
   * @param {HTMLElement} element The element to set attributes on.
   * @param {string} positionType The positionType value from JSON.
   */
  function setPositionType(element, positionType) {
    switch (positionType) {
      case "linked":
        element.dataset.positionLocked = "false";
        element.dataset.linkedWithPrevious = "true";
        element.dataset.positionLockType = "position";
        element.dataset.positionCycleState = "0";
        break;
      case "last":
        element.dataset.positionLocked = "true";
        element.dataset.linkedWithPrevious = "false";
        element.dataset.positionLockType = "last";
        element.dataset.positionCycleState = "0";
        break;
      default:
        // Check if it's a numeric position (1, 2, 3, etc.)
        const positionNum = parseInt(positionType);
        if (!isNaN(positionNum) && positionNum > 0) {
          element.dataset.positionLocked = "true";
          element.dataset.linkedWithPrevious = "false";
          element.dataset.positionLockType = "position";
          element.dataset.positionCycleState = (positionNum - 1).toString();
        } else {
          // 'normal' or any other unrecognized value
          element.dataset.positionLocked = "false";
          element.dataset.linkedWithPrevious = "false";
          element.dataset.positionLockType = "position";
          element.dataset.positionCycleState = "0";
        }
        break;
    }
  }

  /**
   * Creates a pattern from JSON data.
   * @param {Object} patternData The pattern JSON object.
   */
  function createPatternFromJSON(patternData) {
    const newPattern = createPatternInstance();

    // Set the ID from JSON data if provided
    if (patternData.id) {
      newPattern.id = patternData.id;
    }

    // Set basic properties
    const titleInput = newPattern.querySelector(".pattern-panel-title");
    if (titleInput && patternData.name) {
      titleInput.value = patternData.name;
    }

    // Set position type
    if (patternData.positionType) {
      setPositionType(newPattern, patternData.positionType);
    } else {
      setPositionType(newPattern, "normal"); // Default to normal if not specified
    }

    // Set configuration
    const config = patternData.config;
    if (config) {
      const repeatSlider = newPattern.querySelector(".repeat-slider");
      const iterationSelect = newPattern.querySelector(
        ".iteration-type-select",
      );
      const limitsSelect = newPattern.querySelector(".limits-type-select");
      const shotLimitSlider = newPattern.querySelector(".shot-limit-slider");
      const timeLimitSlider = newPattern.querySelector(".time-limit-slider");

      if (repeatSlider && config.repeatCount) {
        repeatSlider.value = config.repeatCount;
        const repeatValue = newPattern.querySelector(".repeat-value");
        if (repeatValue) repeatValue.textContent = `${config.repeatCount}x`;
      }

      if (iterationSelect && config.iterationType) {
        iterationSelect.value = config.iterationType;
      }

      if (config.limits) {
        if (limitsSelect) {
          limitsSelect.value = config.limits.type;
          limitsSelect.dispatchEvent(new Event("change"));
        }

        if (
          config.limits.type === "shot-limit" &&
          shotLimitSlider &&
          config.limits.value
        ) {
          shotLimitSlider.value = config.limits.value;
          const shotLimitValue = newPattern.querySelector(".shot-limit-value");
          if (shotLimitValue) shotLimitValue.textContent = config.limits.value;
        }

        if (
          config.limits.type === "time-limit" &&
          timeLimitSlider &&
          config.limits.value
        ) {
          const timeParts = config.limits.value.split(":");
          const totalSeconds =
            parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          timeLimitSlider.value = totalSeconds;
          const timeLimitValue = newPattern.querySelector(".time-limit-value");
          if (timeLimitValue) timeLimitValue.textContent = config.limits.value;
        }
      }

      // Set voice settings if provided
      if (config.voice) {
        const voiceEnabledCheckbox = newPattern.querySelector(".voice-enabled");
        const voiceSelect = newPattern.querySelector(".voice-select");
        if (voiceEnabledCheckbox) voiceEnabledCheckbox.checked = true;
        if (voiceSelect) voiceSelect.value = config.voice;
      }

      if (config.speechRate) {
        const voiceRateSelect = newPattern.querySelector(".voice-rate-select");
        if (voiceRateSelect) {
          voiceRateSelect.value =
            config.speechRate === 1.0
              ? "auto-scale"
              : config.speechRate.toString();
        }
      }

      // Mark inheritable properties as customized if they exist in config
      if (config.interval !== undefined) {
        markPropertyAsCustomized(newPattern, 'interval');
      }
      if (config.shotAnnouncementLeadTime !== undefined) {
        markPropertyAsCustomized(newPattern, 'shotAnnouncementLeadTime');
      }
      if (config.voice !== undefined) {
        markPropertyAsCustomized(newPattern, 'voice');
      }
      if (config.speechRate !== undefined) {
        markPropertyAsCustomized(newPattern, 'speechRate');
      }
      if (config.intervalOffsetType !== undefined) {
        markPropertyAsCustomized(newPattern, 'intervalOffsetType');
      }
      if (config.splitStepSpeed !== undefined) {
        markPropertyAsCustomized(newPattern, 'splitStepSpeed');
      }
    }

    // Remove default shot that gets created automatically
    const defaultShots = newPattern.querySelectorAll(".shot-msg-instance");
    defaultShots.forEach((shot) => shot.remove());

    // Create entries from JSON
    if (patternData.entries && Array.isArray(patternData.entries)) {
      patternData.entries.forEach((entryData) => {
        if (entryData.type === "Shot") {
          createShotFromJSON(newPattern, entryData);
        } else if (entryData.type === "Message") {
          createMessageFromJSON(newPattern, entryData);
        }
      });
    }

    // Update all states
    updatePositionLockButton(newPattern);
    updateLinkWithPreviousButton(newPattern);
    updateMoveButtonsState(newPattern);

    return newPattern;
  }

  /**
   * Creates a shot instance from JSON data.
   * @param {HTMLElement} patternElement The parent pattern element.
   * @param {Object} shotData The shot JSON object.
   */
  function createShotFromJSON(patternElement, shotData) {
    const shotElement = createShotMsgInstance(patternElement, "shot");

    // Set the ID from JSON data if provided
    if (shotData.id) {
      shotElement.id = shotData.id;
    }

    // Set basic properties
    const titleInput = shotElement.querySelector(".shot-title");
    if (titleInput && shotData.name) {
      titleInput.value = shotData.name;
    }

    // Set position type
    if (shotData.positionType) {
      setPositionType(shotElement, shotData.positionType);
    } else {
      setPositionType(shotElement, "normal"); // Default to normal if not specified
    }

    // Set configuration
    const config = shotData.config;
    if (config) {
      const repeatSlider = shotElement.querySelector(".repeat-slider");
      const intervalSlider = shotElement.querySelector(".shot-interval-slider");
      const leadTimeSlider = shotElement.querySelector(".lead-time-slider");

      if (repeatSlider && config.repeatCount) {
        repeatSlider.value = config.repeatCount;
        const repeatValue = shotElement.querySelector(".repeat-value");
        if (repeatValue) repeatValue.textContent = `${config.repeatCount}x`;
      }

      if (intervalSlider && config.interval) {
        intervalSlider.value = parseFloat(config.interval).toFixed(1);
        const intervalValue = shotElement.querySelector(".shot-interval-value");
        if (intervalValue)
          intervalValue.textContent = `${parseFloat(config.interval).toFixed(1)}s`;
      }

      if (leadTimeSlider && config.shotAnnouncementLeadTime) {
        leadTimeSlider.value = parseFloat(
          config.shotAnnouncementLeadTime,
        ).toFixed(1);
        const leadTimeValue = shotElement.querySelector(".lead-time-value");
        if (leadTimeValue)
          leadTimeValue.textContent = `${parseFloat(config.shotAnnouncementLeadTime).toFixed(1)}s`;
      }

      // Set offset/offset settings
      if (config.intervalOffset) {
        const offsetTypeSelect = shotElement.querySelector(".offset-type-select");
        const offsetFixedSlider = shotElement.querySelector(".offset-fixed-slider");
            const offsetRandomMaxSlider = shotElement.querySelector(
      ".offset-random-maximum-slider",
    );
    const offsetRandomMinSlider = shotElement.querySelector(
      ".offset-random-minimum-slider",
    );

        if (offsetTypeSelect) {
          offsetTypeSelect.value = config.intervalOffsetType;
        }

        if (config.intervalOffsetType === "fixed" && offsetFixedSlider) {
          offsetFixedSlider.value = config.intervalOffset.min;
        } else if (config.intervalOffsetType === "random") {
          if (offsetRandomMaxSlider)
            offsetRandomMaxSlider.value = config.intervalOffset.max;
          if (offsetRandomMinSlider)
            offsetRandomMinSlider.value = config.intervalOffset.min;
        }

        // Enable offset if there's any offset
        const offsetEnabled = shotElement.querySelector(".offset-enabled");
        if (
          offsetEnabled &&
          (config.intervalOffset.min !== 0 || config.intervalOffset.max !== 0)
        ) {
          offsetEnabled.checked = true;
        }
      }

      // Set split step settings
      if (config.splitStepSpeed !== undefined) {
        const splitStepEnabled = shotElement.querySelector(
          ".split-step-enabled",
        );
        const splitStepSpeedSelect = shotElement.querySelector(
          ".split-step-speed-select",
        );

        if (splitStepEnabled) {
          splitStepEnabled.checked = config.splitStepSpeed !== "none";
        }

        if (splitStepSpeedSelect && config.splitStepSpeed !== "none") {
          splitStepSpeedSelect.value = config.autoVoiceSplitStep
            ? "auto-scale"
            : config.splitStepSpeed;
        }
      }

      // Set voice settings
      if (config.voice) {
        const voiceEnabledCheckbox =
          shotElement.querySelector(".voice-enabled");
        const voiceSelect = shotElement.querySelector(".voice-select");
        if (voiceEnabledCheckbox) voiceEnabledCheckbox.checked = true;
        if (voiceSelect) voiceSelect.value = config.voice;
      }

      if (config.speechRate) {
        const voiceRateSelect = shotElement.querySelector(".voice-rate-select");
        if (voiceRateSelect) {
          voiceRateSelect.value =
            config.speechRate === 1.0
              ? "auto-scale"
              : config.speechRate.toString();
        }
      }

      // Mark inheritable properties as customized if they exist in config
      if (config.interval !== undefined) {
        markPropertyAsCustomized(shotElement, 'interval');
      }
      if (config.shotAnnouncementLeadTime !== undefined) {
        markPropertyAsCustomized(shotElement, 'shotAnnouncementLeadTime');
      }
      if (config.voice !== undefined) {
        markPropertyAsCustomized(shotElement, 'voice');
      }
      if (config.speechRate !== undefined) {
        markPropertyAsCustomized(shotElement, 'speechRate');
      }
      if (config.intervalOffsetType !== undefined) {
        markPropertyAsCustomized(shotElement, 'intervalOffsetType');
      }
      if (config.splitStepSpeed !== undefined) {
        markPropertyAsCustomized(shotElement, 'splitStepSpeed');
      }
    }

    // Update UI states
    updatePositionLockButton(shotElement);
    updateLinkWithPreviousButton(shotElement);
    updateMoveButtonsState(shotElement);

    return shotElement;
  }

  /**
   * Creates a message instance from JSON data.
   * @param {HTMLElement} patternElement The parent pattern element.
   * @param {Object} messageData The message JSON object.
   */
  function createMessageFromJSON(patternElement, messageData) {
    const messageElement = createShotMsgInstance(patternElement, "msg");

    // Set the ID from JSON data if provided
    if (messageData.id) {
      messageElement.id = messageData.id;
    }

    // Set basic properties
    const titleInput = messageElement.querySelector(".message-title");
    if (titleInput && messageData.name) {
      titleInput.value = messageData.name;
    }

    // Set position type
    if (messageData.positionType) {
      setPositionType(messageElement, messageData.positionType);
    } else {
      setPositionType(messageElement, "normal"); // Default to normal if not specified
    }

    // Set configuration
    const config = messageData.config;
    if (config) {
      const repeatSlider = messageElement.querySelector(".repeat-slider");
      const messageInput = messageElement.querySelector(".message-input");
      const intervalSlider = messageElement.querySelector(
        ".message-interval-slider",
      );
      const intervalTypeSelect = messageElement.querySelector(
        ".message-interval-type-select",
      );
      const countdownEnabled = messageElement.querySelector(
        ".message-countdown-enabled",
      );
      const skipAtEndCheckbox = messageElement.querySelector(
        ".skip-at-end-of-workout",
      );

      if (repeatSlider && config.repeatCount) {
        repeatSlider.value = config.repeatCount;
        const repeatValue = messageElement.querySelector(".repeat-value");
        if (repeatValue) repeatValue.textContent = `${config.repeatCount}x`;
      }

      if (messageInput && config.message) {
        messageInput.value = config.message;
      }

      if (intervalSlider && config.interval) {
        // Convert MM:SS to seconds
        const timeParts = config.interval.split(":");
        const totalSeconds =
          parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        intervalSlider.value = totalSeconds;
        updateMessageIntervalDisplay(messageElement, totalSeconds, config.intervalType || "fixed");
      }

      if (intervalTypeSelect && config.intervalType !== undefined) {
        intervalTypeSelect.value = config.intervalType;
      }

      if (countdownEnabled && config.countdown !== undefined) {
        countdownEnabled.checked = config.countdown;
        const countdownToggleLabel = messageElement.querySelector(".countdown-toggle-label");
        if (countdownToggleLabel) {
          countdownToggleLabel.textContent = config.countdown ? "Countdown: On" : "Countdown: Off";
        }
      }

      if (skipAtEndCheckbox && config.skipAtEndOfWorkout !== undefined) {
        skipAtEndCheckbox.checked = config.skipAtEndOfWorkout;
        const skipToggleLabel =
          messageElement.querySelector(".skip-toggle-label");
        if (skipToggleLabel) {
          skipToggleLabel.textContent = config.skipAtEndOfWorkout
            ? "Skip at end of workout"
            : "Always play message";
        }
      }

      // Set voice settings
      if (config.voice) {
        const voiceEnabledCheckbox =
          messageElement.querySelector(".voice-enabled");
        const voiceSelect = messageElement.querySelector(".voice-select");
        if (voiceEnabledCheckbox) voiceEnabledCheckbox.checked = true;
        if (voiceSelect) voiceSelect.value = config.voice;
      }

      if (config.speechRate) {
        const voiceRateSelect =
          messageElement.querySelector(".voice-rate-select");
        if (voiceRateSelect) {
          voiceRateSelect.value =
            config.speechRate === 1.0
              ? "auto-scale"
              : config.speechRate.toString();
        }
      }
    }

    // Update UI states
    updatePositionLockButton(messageElement);
    updateLinkWithPreviousButton(messageElement);
    updateMoveButtonsState(messageElement);

    return messageElement;
  }

  /**
   * Loads a workout from JSON data.
   * @param {Object} workoutData The validated workout JSON object.
   */
  function loadWorkout(workoutData) {
    try {
      // Check if this is a large workout that needs async loading
      const totalShots = workoutData.patterns ?
        workoutData.patterns.reduce((sum, pattern) => sum + (pattern.entries || []).length, 0) : 0;

      if (totalShots > 50) {
        // Use async loading for large workouts
        loadWorkoutAsync(workoutData);
        return;
      }

      // Use synchronous loading for small workouts
      loadWorkoutSync(workoutData);
    } catch (error) {
      console.error("Error loading workout:", error);
      alert("Error loading workout. Please check the console for details.");
    }
  }

  /**
   * Loads a workout synchronously (original behavior for small workouts)
   */
  function loadWorkoutSync(workoutData) {
    // Clear existing workout
    clearWorkout();

    // Reset the global instance counter to ensure consistent ID generation
    globalInstanceCounter = 0;

    // Set workout name
    const workoutNameInput = document.querySelector(".workout-name");
    if (workoutNameInput && workoutData.name) {
      workoutNameInput.value = workoutData.name;
    }

    // Set global configuration
    setGlobalConfig(workoutData.config);

    // Create patterns
    if (workoutData.patterns && Array.isArray(workoutData.patterns)) {
      workoutData.patterns.forEach((patternData) => {
        createPatternFromJSON(patternData);
      });
    }

    // Update all UI states
    updateAllPositionLockButtons();
    updateAllMoveButtonStates();

    // Reinitialize all UI states and event listeners
    reinitializeUIStates();

    // Apply current lock state to all elements
    const patternInstances = document.querySelectorAll(".pattern-instance");
    patternInstances.forEach((pattern) => {
      applyLockStateToElement(pattern);
      pattern.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
        applyLockStateToElement(shotMsg);
      });
    });

    // Position the add pattern button after the last pattern
    positionAddPatternButton();

    console.log("Workout loaded and applied successfully");
  }

  /**
   * Loads a workout asynchronously with progress indication for large workouts
   */
  function loadWorkoutAsync(workoutData) {
    try {
      // Show loading overlay
      showLoadingOverlay();

      // Clear existing workout
      clearWorkout();

      // Reset the global instance counter to ensure consistent ID generation
      globalInstanceCounter = 0;

      // Set workout name
      const workoutNameInput = document.querySelector(".workout-name");
      if (workoutNameInput && workoutData.name) {
        workoutNameInput.value = workoutData.name;
      }

      // Set global configuration
      setGlobalConfig(workoutData.config);

      // Create patterns asynchronously to prevent UI blocking
      if (workoutData.patterns && Array.isArray(workoutData.patterns)) {
        loadPatternsAsync(workoutData.patterns, 0, () => {
          // Complete loading process after all patterns are created
          finishWorkoutLoading();
        });
      } else {
        finishWorkoutLoading();
      }
    } catch (error) {
      hideLoadingOverlay();
      console.error("Error during async workout loading:", error);
      alert("Error loading workout. Please check the console for details.");
    }
  }

  /**
   * Checks if the current workout is in its default state (no changes made).
   * @returns {boolean} True if the workout is in default state.
   */
  function isWorkoutInDefaultState() {
    const patterns = document.querySelectorAll(".pattern-instance");

    // Must have exactly one pattern
    if (patterns.length !== 1) return false;

    const pattern = patterns[0];

    // Check pattern title
    const patternTitle = pattern.querySelector(".pattern-panel-title");
    if (patternTitle && patternTitle.value !== "New pattern") return false;

    // Check pattern repeat count
    const patternRepeat = pattern.querySelector(".repeat-slider");
    if (patternRepeat && patternRepeat.value !== "1") return false;

    // Check pattern iteration type
    const patternIteration = pattern.querySelector(".iteration-type-select");
    if (patternIteration && patternIteration.value !== "in-order") return false;

    // Check pattern limits type
    const patternLimits = pattern.querySelector(".limits-type-select");
    if (patternLimits && patternLimits.value !== "all-shots") return false;

    // Check pattern position lock and link states
    if (pattern.dataset.positionLocked === "true") return false;
    if (pattern.dataset.linkedWithPrevious === "true") return false;

    // Check shots/messages in the pattern
    const entries = pattern.querySelectorAll(".shot-msg-instance");

    // Default state has exactly 2 shots
    if (entries.length !== 2) return false;

    // Check that both entries are shots with default settings
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Must be a shot (not a message)
      if (!entry.classList.contains("shot-instance")) return false;

      // Check shot title
      const shotTitle = entry.querySelector(".shot-title");
      if (shotTitle && shotTitle.value !== "New shot") return false;

      // Check shot repeat count
      const shotRepeat = entry.querySelector(".repeat-slider");
      if (shotRepeat && shotRepeat.value !== "1") return false;

      // Check shot interval
      const shotInterval = entry.querySelector(".shot-interval-slider");
      if (shotInterval && shotInterval.value !== "5.0") return false;

      // Check shot lead time
      const shotLeadTime = entry.querySelector(".lead-time-slider");
      if (shotLeadTime && shotLeadTime.value !== "2.5") return false;

          // Check offset settings
    const offsetEnabled = entry.querySelector(".offset-enabled");
    if (offsetEnabled && offsetEnabled.checked) return false;

      // Check split step settings
      const splitStepEnabled = entry.querySelector(".split-step-enabled");
      if (splitStepEnabled && !splitStepEnabled.checked) return false;

      const splitStepSpeed = entry.querySelector(".split-step-speed-select");
      if (splitStepSpeed && splitStepSpeed.value !== "auto-scale") return false;

      // Check voice settings
      const voiceEnabled = entry.querySelector(".voice-enabled");
      if (voiceEnabled && !voiceEnabled.checked) return false;

      const voiceRate = entry.querySelector(".voice-rate-select");
      if (voiceRate && voiceRate.value !== "auto-scale") return false;

      // Check position lock and link states
      if (entry.dataset.positionLocked === "true") return false;
      if (entry.dataset.linkedWithPrevious === "true") return false;
    }

    return true;
  }

  /**
   * Handles the file selection and loading process.
   */
  function handleFileLoad() {
    const file = workoutFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const jsonData = JSON.parse(e.target.result);

        // Validate the JSON structure
        const validation = validateWorkoutJSON(jsonData);
        if (!validation.success) {
          const errorMessage =
            "Invalid workout file:\n\n" + validation.errors.join("\n");
          alert(errorMessage);
          console.error("Validation errors:", validation.errors);
          return;
        }

        // Check if current workout is in default state
        const isDefault = isWorkoutInDefaultState();

        // Skip confirmation if workout is in default state, otherwise confirm
        if (
          isDefault ||
          confirm(
            "This will replace your current workout. Are you sure you want to continue?",
          )
        ) {
          loadWorkout(jsonData);
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
        alert("Error: Invalid JSON file. Please select a valid workout file.");
      }
    };

    reader.onerror = function () {
      alert("Error reading file. Please try again.");
    };

    reader.readAsText(file);

    // Reset file input for future loads
    workoutFileInput.value = "";
  }

  /**
   * Handles pasting a workout from clipboard.
   */
  async function handlePasteWorkout() {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.readText) {
        try {
          // Read text from clipboard
          const clipboardText = await navigator.clipboard.readText();

          if (clipboardText && clipboardText.trim() !== "") {
            processClipboardText(clipboardText);
            return;
          } else {
            // Fallback to manual paste if clipboard is empty
            showManualPasteDialog();
            return;
          }
        } catch (clipboardError) {
          console.log("Clipboard API failed, falling back to manual paste:", clipboardError);
          // Fall through to manual paste fallback
        }
      }

      // Fallback for Safari and other browsers with restricted clipboard access
      showManualPasteDialog();

    } catch (error) {
      console.error("Error in handlePasteWorkout:", error);
      showManualPasteDialog();
    }
  }

  /**
   * Shows a manual paste dialog for Safari and other restricted browsers.
   */
  function showManualPasteDialog() {
    const pastedText = prompt(
      "Safari requires manual pasting due to security restrictions.\n\n" +
      "Please paste your workout JSON below:",
      ""
    );

    if (pastedText !== null && pastedText.trim() !== "") {
      processClipboardText(pastedText);
    }
  }

  /**
   * Processes the clipboard/pasted text and loads the workout.
   * @param {string} clipboardText The text to process
   */
  function processClipboardText(clipboardText) {
    try {
      // Parse the clipboard content as JSON
      const jsonData = JSON.parse(clipboardText);

      // Validate the JSON structure
      const validation = validateWorkoutJSON(jsonData);
      if (!validation.success) {
        const errorMessage =
          "Invalid workout JSON:\n\n" + validation.errors.join("\n");
        alert(errorMessage);
        console.error("Validation errors:", validation.errors);
        return;
      }

      // Check if current workout is in default state
      const isDefault = isWorkoutInDefaultState();

      // Skip confirmation if workout is in default state, otherwise confirm
      if (
        isDefault ||
        confirm(
          "This will replace your current workout. Are you sure you want to continue?",
        )
      ) {
        loadWorkout(jsonData);
        console.log("Workout loaded from clipboard successfully");
      }
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      alert("Error: The text does not contain valid JSON. Please copy a valid workout JSON first.");
    }
  }

  // Flag to temporarily disable customization tracking during initialization
  let isInitializing = false;

  // Flag to temporarily disable customization tracking during setting propagation
  let isPropagating = false;

  // Flag to temporarily disable hierarchical checking during cancellation reversion
  let isCancelling = false;

  // Debouncing for hierarchical setting changes to prevent modal interruption during slider interaction
  let hierarchicalChangeTimeout = null;

  // Track original values when users start interacting with sliders to enable proper cancellation
  const sliderOriginalValues = new Map();

  /**
   * Shows a loading overlay with progress indication
   */
  function showLoadingOverlay() {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      // Create loading overlay if it doesn't exist
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      overlay.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Loading Workout</h3>
          <p class="text-gray-600 mb-4">Please wait while we load your workout...</p>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div id="loadingProgress" class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
          <p id="loadingStatus" class="text-sm text-gray-500 mt-2">Starting...</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
  }

  /**
   * Hides the loading overlay
   */
  function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  /**
   * Updates the loading progress
   */
  function updateLoadingProgress(current, total, status) {
    const progressBar = document.getElementById('loadingProgress');
    const statusText = document.getElementById('loadingStatus');

    if (progressBar && statusText) {
      const percentage = (current / total) * 100;
      progressBar.style.width = `${percentage}%`;
      statusText.textContent = status;
    }
  }

  /**
   * Loads patterns asynchronously using requestAnimationFrame to prevent UI blocking
   */
  function loadPatternsAsync(patterns, currentIndex, onComplete) {
    const batchSize = 1; // Process one pattern at a time to maintain responsiveness
    const totalPatterns = patterns.length;

    // Disable expensive global updates during loading
    window.isLoadingWorkout = true;

    function processBatch() {
      const endIndex = Math.min(currentIndex + batchSize, totalPatterns);

      // Process patterns in current batch
      for (let i = currentIndex; i < endIndex; i++) {
        const patternData = patterns[i];
        updateLoadingProgress(i + 1, totalPatterns, `Loading pattern ${i + 1} of ${totalPatterns}: ${patternData.name || 'Unnamed'}`);

        // Create pattern using optimized function that skips expensive updates
        createPatternFromJSONOptimized(patternData);
      }

      // Update current index
      currentIndex = endIndex;

      // Continue processing if there are more patterns
      if (currentIndex < totalPatterns) {
        // Use requestAnimationFrame to yield control back to the browser
        requestAnimationFrame(() => processBatch());
      } else {
        // Re-enable global updates
        window.isLoadingWorkout = false;
        // All patterns loaded, call completion callback
        onComplete();
      }
    }

    // Start processing
    requestAnimationFrame(() => processBatch());
  }

  /**
   * Creates a pattern from JSON data with optimized performance (skips expensive updates)
   */
  function createPatternFromJSONOptimized(patternData) {
    const newPattern = createPatternInstanceOptimized();

    // Set the ID from JSON data if provided
    if (patternData.id) {
      newPattern.id = patternData.id;
    }

    // Set basic properties
    const titleInput = newPattern.querySelector(".pattern-panel-title");
    if (titleInput && patternData.name) {
      titleInput.value = patternData.name;
    }

    // Set position type
    if (patternData.positionType) {
      setPositionType(newPattern, patternData.positionType);
    } else {
      setPositionType(newPattern, "normal");
    }

    // Set configuration (same as original but without expensive updates)
    const config = patternData.config;
    if (config) {
      const repeatSlider = newPattern.querySelector(".repeat-slider");
      const iterationSelect = newPattern.querySelector(".iteration-type-select");
      const limitsSelect = newPattern.querySelector(".limits-type-select");
      const shotLimitSlider = newPattern.querySelector(".shot-limit-slider");
      const timeLimitSlider = newPattern.querySelector(".time-limit-slider");

      if (repeatSlider && config.repeatCount) {
        repeatSlider.value = config.repeatCount;
        const repeatValue = newPattern.querySelector(".repeat-value");
        if (repeatValue) repeatValue.textContent = `${config.repeatCount}x`;
      }

      if (iterationSelect && config.iterationType) {
        iterationSelect.value = config.iterationType;
      }

      if (config.limits) {
        if (limitsSelect) {
          limitsSelect.value = config.limits.type;
          // Skip the expensive dispatchEvent during loading
          if (!window.isLoadingWorkout) {
            limitsSelect.dispatchEvent(new Event("change"));
          }
        }

        if (config.limits.type === "shot-limit" && shotLimitSlider && config.limits.value) {
          shotLimitSlider.value = config.limits.value;
          const shotLimitValue = newPattern.querySelector(".shot-limit-value");
          if (shotLimitValue) shotLimitValue.textContent = config.limits.value;
        }

        if (config.limits.type === "time-limit" && timeLimitSlider && config.limits.value) {
          const timeParts = config.limits.value.split(":");
          const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
          timeLimitSlider.value = totalSeconds;
          const timeLimitValue = newPattern.querySelector(".time-limit-value");
          if (timeLimitValue) timeLimitValue.textContent = config.limits.value;
        }
      }

      // Set voice settings if provided
      if (config.voice) {
        const voiceEnabledCheckbox = newPattern.querySelector(".voice-enabled");
        const voiceSelect = newPattern.querySelector(".voice-select");
        if (voiceEnabledCheckbox) voiceEnabledCheckbox.checked = true;
        if (voiceSelect) voiceSelect.value = config.voice;
      }

      if (config.speechRate) {
        const voiceRateSelect = newPattern.querySelector(".voice-rate-select");
        if (voiceRateSelect) {
          voiceRateSelect.value = config.speechRate === 1.0 ? "auto-scale" : config.speechRate.toString();
        }
      }

      // Mark inheritable properties as customized if they exist in config
      if (config.interval !== undefined) markPropertyAsCustomized(newPattern, 'interval');
      if (config.shotAnnouncementLeadTime !== undefined) markPropertyAsCustomized(newPattern, 'shotAnnouncementLeadTime');
      if (config.voice !== undefined) markPropertyAsCustomized(newPattern, 'voice');
      if (config.speechRate !== undefined) markPropertyAsCustomized(newPattern, 'speechRate');
      if (config.intervalOffsetType !== undefined) markPropertyAsCustomized(newPattern, 'intervalOffsetType');
      if (config.splitStepSpeed !== undefined) markPropertyAsCustomized(newPattern, 'splitStepSpeed');
    }

    // Remove default shot that gets created automatically
    const defaultShots = newPattern.querySelectorAll(".shot-msg-instance");
    defaultShots.forEach((shot) => shot.remove());

    // Create entries from JSON using batch creation
    if (patternData.entries && Array.isArray(patternData.entries)) {
      // Create all entries in a batch to minimize DOM operations
      const fragment = document.createDocumentFragment();
      patternData.entries.forEach((entryData) => {
        let entryElement;
        if (entryData.type === "Shot") {
          entryElement = createShotFromJSONOptimized(newPattern, entryData);
        } else if (entryData.type === "Message") {
          entryElement = createMessageFromJSONOptimized(newPattern, entryData);
        }
        if (entryElement) {
          fragment.appendChild(entryElement);
        }
      });

      // Add all entries at once
      const container = newPattern.querySelector(".shot-msg-instances-container");
      if (container) {
        container.appendChild(fragment);
      }
    }

    // Skip expensive UI updates during loading - these will be done at the end
    if (!window.isLoadingWorkout) {
      updatePositionLockButton(newPattern);
      updateLinkWithPreviousButton(newPattern);
      updateMoveButtonsState(newPattern);
    }

    return newPattern;
  }

  /**
   * Creates a pattern instance with minimal initialization for loading performance
   */
  function createPatternInstanceOptimized() {
    // Use the existing function but skip some expensive operations
    const newPattern = createPatternInstance();
    return newPattern;
  }

  /**
   * Creates a shot from JSON with optimized performance
   */
  function createShotFromJSONOptimized(patternElement, shotData) {
    const shotElement = createShotMsgInstanceOptimized(patternElement, "shot");

    // Set the ID from JSON data if provided
    if (shotData.id) {
      shotElement.id = shotData.id;
    }

    // Set basic properties
    const titleInput = shotElement.querySelector(".shot-title");
    if (titleInput && shotData.name) {
      titleInput.value = shotData.name;
    }

    // Set position type
    if (shotData.positionType) {
      setPositionType(shotElement, shotData.positionType);
    } else {
      setPositionType(shotElement, "normal");
    }

    // Set configuration (same as original but optimized)
    const config = shotData.config;
    if (config) {
      const repeatSlider = shotElement.querySelector(".repeat-slider");
      const intervalSlider = shotElement.querySelector(".shot-interval-slider");
      const leadTimeSlider = shotElement.querySelector(".lead-time-slider");

      if (repeatSlider && config.repeatCount) {
        repeatSlider.value = config.repeatCount;
        const repeatValue = shotElement.querySelector(".repeat-value");
        if (repeatValue) repeatValue.textContent = `${config.repeatCount}x`;
      }

      if (intervalSlider && config.interval) {
        intervalSlider.value = parseFloat(config.interval).toFixed(1);
        const intervalValue = shotElement.querySelector(".shot-interval-value");
        if (intervalValue) intervalValue.textContent = `${parseFloat(config.interval).toFixed(1)}s`;
      }

      if (leadTimeSlider && config.shotAnnouncementLeadTime) {
        leadTimeSlider.value = parseFloat(config.shotAnnouncementLeadTime).toFixed(1);
        const leadTimeValue = shotElement.querySelector(".lead-time-value");
        if (leadTimeValue) leadTimeValue.textContent = `${parseFloat(config.shotAnnouncementLeadTime).toFixed(1)}s`;
      }

      // Set other configuration properties efficiently...
      if (config.intervalOffset) {
        const offsetTypeSelect = shotElement.querySelector(".offset-type-select");
        const offsetFixedSlider = shotElement.querySelector(".offset-fixed-slider");
        const offsetRandomMaxSlider = shotElement.querySelector(".offset-random-maximum-slider");
        const offsetRandomMinSlider = shotElement.querySelector(".offset-random-minimum-slider");

        if (offsetTypeSelect) offsetTypeSelect.value = config.intervalOffsetType;

        if (config.intervalOffsetType === "fixed" && offsetFixedSlider) {
          offsetFixedSlider.value = config.intervalOffset.min;
        } else if (config.intervalOffsetType === "random") {
          if (offsetRandomMaxSlider) offsetRandomMaxSlider.value = config.intervalOffset.max;
          if (offsetRandomMinSlider) offsetRandomMinSlider.value = config.intervalOffset.min;
        }

        const offsetEnabled = shotElement.querySelector(".offset-enabled");
        if (offsetEnabled && (config.intervalOffset.min !== 0 || config.intervalOffset.max !== 0)) {
          offsetEnabled.checked = true;
        }
      }

      if (config.splitStepSpeed !== undefined) {
        const splitStepEnabled = shotElement.querySelector(".split-step-enabled");
        const splitStepSpeedSelect = shotElement.querySelector(".split-step-speed-select");

        if (splitStepEnabled) splitStepEnabled.checked = config.splitStepSpeed !== "none";
        if (splitStepSpeedSelect && config.splitStepSpeed !== "none") {
          splitStepSpeedSelect.value = config.autoVoiceSplitStep ? "auto-scale" : config.splitStepSpeed;
        }
      }

      if (config.voice) {
        const voiceEnabledCheckbox = shotElement.querySelector(".voice-enabled");
        const voiceSelect = shotElement.querySelector(".voice-select");
        if (voiceEnabledCheckbox) voiceEnabledCheckbox.checked = true;
        if (voiceSelect) voiceSelect.value = config.voice;
      }

      if (config.speechRate) {
        const voiceRateSelect = shotElement.querySelector(".voice-rate-select");
        if (voiceRateSelect) {
          voiceRateSelect.value = config.speechRate === 1.0 ? "auto-scale" : config.speechRate.toString();
        }
      }

      // Mark inheritable properties as customized
      if (config.interval !== undefined) markPropertyAsCustomized(shotElement, 'interval');
      if (config.shotAnnouncementLeadTime !== undefined) markPropertyAsCustomized(shotElement, 'shotAnnouncementLeadTime');
      if (config.voice !== undefined) markPropertyAsCustomized(shotElement, 'voice');
      if (config.speechRate !== undefined) markPropertyAsCustomized(shotElement, 'speechRate');
      if (config.intervalOffsetType !== undefined) markPropertyAsCustomized(shotElement, 'intervalOffsetType');
      if (config.splitStepSpeed !== undefined) markPropertyAsCustomized(shotElement, 'splitStepSpeed');
    }

    return shotElement;
  }

  /**
   * Creates a message from JSON with optimized performance
   */
  function createMessageFromJSONOptimized(patternElement, messageData) {
    const messageElement = createShotMsgInstanceOptimized(patternElement, "msg");

    // Set the ID from JSON data if provided
    if (messageData.id) {
      messageElement.id = messageData.id;
    }

    // Set basic properties
    const titleInput = messageElement.querySelector(".message-title");
    if (titleInput && messageData.name) {
      titleInput.value = messageData.name;
    }

    // Set position type
    if (messageData.positionType) {
      setPositionType(messageElement, messageData.positionType);
    } else {
      setPositionType(messageElement, "normal");
    }

    // Set configuration
    const config = messageData.config;
    if (config) {
      const messageInput = messageElement.querySelector(".message-input");
      const intervalSlider = messageElement.querySelector(".message-interval-slider");
      const skipCheckbox = messageElement.querySelector(".skip-at-end-of-workout");

      if (messageInput && config.message) {
        messageInput.value = config.message;
      }

      if (intervalSlider && config.interval) {
        // Convert MM:SS to seconds
        const timeParts = config.interval.split(":");
        const totalSeconds = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        intervalSlider.value = totalSeconds;

        // Update display only during loading, skip expensive updateMessageIntervalDisplay
        if (!window.isLoadingWorkout) {
          updateMessageIntervalDisplay(messageElement, totalSeconds, config.intervalType || "fixed");
        }
      }

      if (config.intervalType !== undefined) {
        const intervalTypeSelect = messageElement.querySelector(".message-interval-type-select");
        if (intervalTypeSelect) {
          intervalTypeSelect.value = config.intervalType;
        }
      }

      if (config.countdown !== undefined) {
        const countdownEnabled = messageElement.querySelector(".message-countdown-enabled");
        if (countdownEnabled) {
          countdownEnabled.checked = config.countdown;
        }
      }

      if (skipCheckbox && config.skipAtEndOfWorkout !== undefined) {
        skipCheckbox.checked = config.skipAtEndOfWorkout;
      }
    }

    return messageElement;
  }

  /**
   * Creates a shot/message instance with minimal initialization during loading
   */
  function createShotMsgInstanceOptimized(parentPatternElement, type) {
    globalInstanceCounter++;

    const template = type === "shot" ? shotInstanceTemplate : messageInstanceTemplate;
    const newInstance = template.content.firstElementChild.cloneNode(true);
    newInstance.id = `${type}Instance_${globalInstanceCounter}`;
    newInstance.dataset.type = type;

    // Update IDs to be unique
    newInstance.querySelectorAll("[id]").forEach((el) => {
      const oldId = el.id;
      const newId = `${oldId}_${globalInstanceCounter}`;
      el.id = newId;
      if (el.hasAttribute("for")) {
        el.setAttribute("for", newId);
      }
    });

    // Set initial title
    const titleSelector = type === "shot" ? ".shot-title" : ".message-title";
    const titleInput = newInstance.querySelector(titleSelector);
    if (titleInput) {
      titleInput.value = type === "shot" ? "New shot" : "New message";
    }

    // Set basic dataset properties without expensive updates
    newInstance.dataset.positionCycleState = "0";
    newInstance.dataset.linkedWithPrevious = "false";

    // Skip expensive operations during loading - they'll be done at the end
    if (!window.isLoadingWorkout) {
      // Do full initialization only when not loading
      initializeShotMsgInstance(newInstance, {});
      applyLockStateToElement(newInstance);
      updatePositionLockButton(newInstance);
      updateLinkWithPreviousButton(newInstance);
      updateMoveButtonsState(newInstance);
      updateAllPositionLockButtons();
      updateAllMoveButtonStates();
    }

    return newInstance;
  }

  /**
   * Completes the workout loading process after all patterns are created
   */
  function finishWorkoutLoading() {
    updateLoadingProgress(100, 100, "Finalizing...");

    // Use setTimeout to allow the "Finalizing..." message to be displayed
    setTimeout(() => {
      // Now do all the expensive operations once at the end
      updateLoadingProgress(100, 100, "Initializing event listeners...");

      // Initialize all shot/message instances that were skipped during loading
      const shotMsgInstances = document.querySelectorAll(".shot-msg-instance");
      shotMsgInstances.forEach((instance) => {
        // Only initialize if not already initialized
        if (!instance.dataset.initialized) {
          initializeShotMsgInstance(instance, {});
          instance.dataset.initialized = "true";
        }

        // Update message interval displays that were skipped during loading
        if (instance.classList.contains("message-instance")) {
          const intervalSlider = instance.querySelector(".message-interval-slider");
          const intervalTypeSelect = instance.querySelector(".message-interval-type-select");
          if (intervalSlider && intervalTypeSelect) {
            const totalSeconds = parseInt(intervalSlider.value || 0);
            const intervalType = intervalTypeSelect.value || "fixed";
            updateMessageIntervalDisplay(instance, totalSeconds, intervalType);
          }
        }
      });

      // Update all UI states in one batch
      updateAllPositionLockButtons();
      updateAllMoveButtonStates();

      // Reinitialize all UI states and event listeners
      reinitializeUIStates();

      // Apply current lock state to all elements
      const patternInstances = document.querySelectorAll(".pattern-instance");
      patternInstances.forEach((pattern) => {
        applyLockStateToElement(pattern);
        pattern.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
          applyLockStateToElement(shotMsg);
        });
      });

      // Position the add pattern button after the last pattern
      positionAddPatternButton();

      // Hide loading overlay
      hideLoadingOverlay();

      console.log("Workout loaded and applied successfully");
    }, 100); // Small delay to show "Finalizing..." message
  }

  /**
   * Debounced version of handleHierarchicalSettingChange to prevent modal interruption during slider interaction
   * @param {Element} parentElement - The parent element
   * @param {string} property - The property being changed
   * @param {*} newValue - The new value
   * @param {*} currentOldValue - The immediate previous value
   * @param {Element} sourceElement - The element that triggered the change
   * @param {number} delay - Delay in milliseconds (default 500ms)
   */
  function debouncedHierarchicalSettingChange(parentElement, property, newValue, currentOldValue, sourceElement, delay = 500) {
    // Skip debounced hierarchical checking during cancellation reversion to prevent double modals
    if (isCancelling) {
      return;
    }

    const sliderKey = `${sourceElement.id || sourceElement.className}_${property}`;

    // Store the original value when first called for this slider interaction
    if (!sliderOriginalValues.has(sliderKey)) {
      sliderOriginalValues.set(sliderKey, currentOldValue);
    }

    // Clear any existing timeout
    if (hierarchicalChangeTimeout) {
      clearTimeout(hierarchicalChangeTimeout);
    }

    // Set a new timeout to trigger the hierarchical check after the delay
    hierarchicalChangeTimeout = setTimeout(() => {
      const originalValue = sliderOriginalValues.get(sliderKey);
      // Use the original starting value for proper cancellation behavior
      handleHierarchicalSettingChange(parentElement, property, newValue, originalValue, sourceElement);
      // Clear the stored original value after processing
      sliderOriginalValues.delete(sliderKey);
      hierarchicalChangeTimeout = null;
    }, delay);
  }

  /**
   * Reinitializes all UI states after loading a workout.
   * This ensures that all toggle states, button states, and UI elements are properly updated.
   */
  function reinitializeUIStates() {
    // Temporarily disable customization tracking during reinitialization
    isInitializing = true;

    // Update all offset controls
    document.querySelectorAll(".offset-enabled").forEach((offsetCheckbox) => {
      offsetCheckbox.dispatchEvent(new Event("change"));
    });

    // Update all split step controls
    document
      .querySelectorAll(".split-step-enabled")
      .forEach((splitStepCheckbox) => {
        splitStepCheckbox.dispatchEvent(new Event("change"));
      });

    // Update all voice controls
    document.querySelectorAll(".voice-enabled").forEach((voiceCheckbox) => {
      voiceCheckbox.dispatchEvent(new Event("change"));
    });

    // Update all limits type selects
    document.querySelectorAll(".limits-type-select").forEach((limitsSelect) => {
      limitsSelect.dispatchEvent(new Event("change"));
    });

    // Update all message interval displays
    document
      .querySelectorAll(".message-interval-slider")
      .forEach((intervalSlider) => {
        intervalSlider.dispatchEvent(new Event("input"));
      });

    // Update all offset type selects
    document.querySelectorAll(".offset-type-select").forEach((offsetTypeSelect) => {
      offsetTypeSelect.dispatchEvent(new Event("change"));
    });

    // Update all skip at end checkboxes
    document
      .querySelectorAll(".skip-at-end-of-workout")
      .forEach((skipCheckbox) => {
        const toggleLabel = skipCheckbox
          .closest(".flex")
          ?.querySelector(".skip-toggle-label");
        if (toggleLabel) {
          toggleLabel.textContent = skipCheckbox.checked
            ? "Skip at end of workout"
            : "Always play message";
        }
      });

    // Update all position lock buttons
    updateAllPositionLockButtons();

    // Update all link with previous buttons
    document
      .querySelectorAll(".pattern-instance, .shot-msg-instance")
      .forEach((element) => {
        updateLinkWithPreviousButton(element);
      });

    // Update all move button states
    updateAllMoveButtonStates();

    // Update group lock styling
    document
      .querySelectorAll(".pattern-instance, .shot-msg-instance")
      .forEach((element) => {
        updateGroupLockStyling(element, mainContainer);
      });

    // Re-enable customization tracking
    isInitializing = false;

    console.log("UI states reinitialized");
  }

  // --- Utility Functions (Generic for any accordion/dropdown) ---

  /**
   * Sets the max-height of a given settings panel based on its currently visible content.
   * @param {HTMLElement} panelElement The dropdown content panel (e.g., settingsPanel).
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   */
  function setPanelHeight(panelElement, mainMenuElement) {
    let targetHeight = 0;
    let activeContentElement = null;

    if (mainMenuElement && mainMenuElement.classList.contains("active")) {
      activeContentElement = mainMenuElement;
    } else {
      panelElement.querySelectorAll(".submenu-content").forEach((panel) => {
        if (panel.classList.contains("active")) {
          activeContentElement = panel;
        }
      });
    }

    if (activeContentElement) {
      const originalDisplay = activeContentElement.style.display;
      const originalVisibility = activeContentElement.style.visibility;
      const originalPosition = activeContentElement.style.position;
      const originalLeft = activeContentElement.style.left;

      activeContentElement.style.display = "block";
      activeContentElement.style.visibility = "hidden";
      activeContentElement.style.position = "absolute";
      activeContentElement.style.left = "-9999px";

      targetHeight = activeContentElement.offsetHeight;

      activeContentElement.style.display = originalDisplay;
      activeContentElement.style.visibility = originalVisibility;
      activeContentElement.style.position = originalPosition;
      activeContentElement.style.left = originalLeft;
    }
    if (panelElement) {
      panelElement.style.maxHeight = targetHeight + "px";
    }
  }

  /**
   * Closes all active dropdowns throughout the application.
   * This ensures only one dropdown can be open at a time.
   * @param {HTMLElement} excludeElement - Optional element to exclude from closing (for toggling)
   */
  function closeAllDropdowns(excludeElement = null) {
    // Close toolbar dropdowns
    const toolbarDropdowns = [
      document.getElementById("executeDropdown"),
      document.getElementById("editorDropdown"),
      document.getElementById("loadDropdown"),
      document.getElementById("saveDropdown")
    ];

    toolbarDropdowns.forEach(dropdown => {
      if (dropdown && dropdown !== excludeElement && dropdown.classList.contains("active")) {
        dropdown.classList.remove("active");
      }
    });

    // Close settings panels
    document.querySelectorAll(".settings-panel.active").forEach((panel) => {
      if (panel !== excludeElement) {
        panel.classList.remove("active");
        // Remove tabindex to prevent focus
        panel.removeAttribute("tabindex");
        // Ensure all child elements lose focus
        panel.querySelectorAll("*").forEach((child) => {
          if (child !== panel) {
            child.blur();
          }
        });
      }
    });

    // Close rocket indicator dropdowns
    document.querySelectorAll(".rocket-indicator-dropdown.active").forEach((dropdown) => {
      if (dropdown !== excludeElement) {
        dropdown.classList.remove("active");
        // Remove tabindex to prevent focus
        dropdown.removeAttribute("tabindex");
        // Ensure all child elements lose focus
        dropdown.querySelectorAll("*").forEach((child) => {
          if (child !== dropdown) {
            child.blur();
          }
        });
      }
    });
  }

  /**
   * Toggles a given settings dropdown panel.
   * @param {HTMLElement} panelElement The dropdown content panel.
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   */
  function toggleSettingsDropdown(panelElement, mainMenuElement) {
    if (!panelElement || !mainMenuElement) return;

    const isActive = panelElement.classList.contains("active");

    // Close all other dropdowns first
    closeAllDropdowns(panelElement);

    if (!isActive) {
      // Opening the dropdown
      panelElement.classList.add("active");
      showSettingsMainMenu(panelElement, mainMenuElement);
      setPanelHeight(panelElement, mainMenuElement);

      // Add focus handling
      panelElement.setAttribute("tabindex", "-1");
      panelElement.focus();

      // Add blur handler
      const handleBlur = (e) => {
        // Check if the new focus target is inside the panel
        if (!panelElement.contains(e.relatedTarget)) {
          panelElement.classList.remove("active");
          panelElement.removeAttribute("tabindex");
          // Ensure all child elements lose focus
          panelElement.querySelectorAll("*").forEach((child) => {
            if (child !== panelElement) {
              child.blur();
            }
          });
          panelElement.removeEventListener("blur", handleBlur);
        }
      };
      panelElement.addEventListener("blur", handleBlur);
    } else {
      panelElement.classList.remove("active");
      panelElement.removeAttribute("tabindex");
      // Ensure all child elements lose focus
      panelElement.querySelectorAll("*").forEach((child) => {
        if (child !== panelElement) {
          child.blur();
        }
      });
    }
  }

  /**
   * Shows the main menu content for a given settings panel.
   * @param {HTMLElement} panelElement The dropdown content panel.
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   */
  function showSettingsMainMenu(panelElement, mainMenuElement) {
    if (!panelElement || !mainMenuElement) {
      console.error(
        "Missing panel or main menu element for showSettingsMainMenu.",
      );
      return;
    }
    mainMenuElement.classList.remove("hidden-left");
    mainMenuElement.classList.add("active");

    // Hide all submenus - look for siblings of the panel, not children
    const parentContainer = panelElement.parentElement;
    if (parentContainer) {
      parentContainer.querySelectorAll(".submenu-content").forEach((panel) => {
        panel.classList.add("hidden");
        panel.classList.remove("active");
      });
    }

    requestAnimationFrame(() => setPanelHeight(panelElement, mainMenuElement));
  }

  /**
   * Shows a specific submenu for a given settings panel.
   * @param {HTMLElement} panelElement The dropdown content panel.
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   * @param {string} submenuClass The class name of the target submenu.
   */
  function showSettingsSubmenu(panelElement, mainMenuElement, submenuClass) {
    if (!panelElement) {
      console.error("showSettingsSubmenu: panelElement is null or undefined!", panelElement, mainMenuElement, submenuClass);
      return;
    }
    if (!mainMenuElement) {
      console.error("showSettingsSubmenu: mainMenuElement is null or undefined!", mainMenuElement);
      return;
    }
    mainMenuElement.classList.remove("active");
    mainMenuElement.classList.add("hidden-left");

    // Hide all submenus - look for siblings of the panel, not children
    const parentContainer = panelElement.parentElement;
    if (parentContainer) {
      parentContainer.querySelectorAll(".submenu-content").forEach((panel) => {
        panel.classList.add("hidden");
        panel.classList.remove("active");
      });
    }

    // Find the target submenu as a sibling of the panel
    const targetSubmenu = panelElement.parentElement?.querySelector(`.${submenuClass}`);
    if (targetSubmenu) {
      targetSubmenu.classList.remove("hidden");
      targetSubmenu.classList.add("active");
      requestAnimationFrame(() =>
        setPanelHeight(panelElement, mainMenuElement),
      );
    } else {
      console.error(`Target submenu with class ${submenuClass} not found.`);
      const parentContainer = panelElement.parentElement;
      if (parentContainer) {
        console.error("Available submenus:", Array.from(parentContainer.querySelectorAll(".submenu-content")).map(el => el.className));
      }
      console.error("Panel element:", panelElement);
    }
  }

  /**
   * Updates the lead time slider based on the interval slider.
   * @param {HTMLElement} intervalSlider
   * @param {HTMLElement} leadTimeSlider
   * @param {HTMLElement} leadTimeValueSpan
   */
  function updateLeadTimeSlider(
    intervalSlider,
    leadTimeSlider,
    leadTimeValueSpan,
  ) {
    if (!intervalSlider || !leadTimeSlider || !leadTimeValueSpan) {
      console.error(
        "Error in updateLeadTimeSlider: Required elements not found.",
      );
      return;
    }
    const intervalValue = parseFloat(intervalSlider.value);
    const minLeadTime = 2.5;
    const maxLeadTime = intervalValue;

    leadTimeSlider.min = minLeadTime;
    leadTimeSlider.max = maxLeadTime;

    if (parseFloat(leadTimeSlider.value) < minLeadTime) {
      leadTimeSlider.value = minLeadTime;
    } else if (parseFloat(leadTimeSlider.value) > maxLeadTime) {
      leadTimeSlider.value = maxLeadTime;
    }

    leadTimeValueSpan.textContent = `${parseFloat(leadTimeSlider.value).toFixed(1)}s`;
  }

  /**
   * Updates the shot limit slider based on the current number of shots in the pattern.
   * @param {HTMLElement} patternElement The pattern element containing the shots.
   */
  function updateShotLimitSlider(patternElement) {
    const shotLimitSlider = patternElement.querySelector(".shot-limit-slider");
    const shotLimitValueSpan =
      patternElement.querySelector(".shot-limit-value");

    if (!shotLimitSlider || !shotLimitValueSpan) return;

    const currentShotCount =
      patternElement.querySelectorAll(".shot-instance").length;
    if (currentShotCount > 0) {
      shotLimitSlider.max = Math.max(50, currentShotCount);
      // If current value is greater than shot count, reset to shot count
      if (parseInt(shotLimitSlider.value) > currentShotCount) {
        shotLimitSlider.value = currentShotCount;
        shotLimitValueSpan.textContent = currentShotCount;
      }
    }
  }

  /**
   * Updates the default offset controls visibility and text.
   */
  function updateDefaultOffsetControls() {
    const defaultOffsetToggleLabel = document.getElementById(
      "defaultOffsetToggleLabel",
    );

    if (
      !defaultOffsetEnabled ||
      !defaultOffsetControlsContainer ||
      !defaultOffsetTypeSelect ||
      !defaultOffsetFixedOption ||
      !defaultOffsetRandomOption ||
      !defaultOffsetFixedContainer ||
      !defaultOffsetRandomContainer ||
      !defaultOffsetFixedSlider ||
      !defaultOffsetRandomMaximumSlider ||
      !defaultOffsetRandomMinimumSlider
    ) {
      console.error(
        "Error in updateDefaultOffsetControls: Required elements not found.",
      );
      return;
    }

    const isOffsetEnabled = defaultOffsetEnabled.checked;
    const offsetType = defaultOffsetTypeSelect.value;

    // Update toggle label
    if (defaultOffsetToggleLabel) {
      defaultOffsetToggleLabel.textContent = isOffsetEnabled
        ? "Offset enabled"
        : "Offset disabled";
    }

    if (isOffsetEnabled) {
      defaultOffsetControlsContainer.classList.remove("hidden");
      defaultOffsetTypeSelect.disabled = false;

      if (offsetType === "fixed") {
        defaultOffsetFixedContainer.classList.remove("hidden");
        defaultOffsetRandomContainer.classList.add("hidden");
        defaultOffsetFixedSlider.disabled = false;
        defaultOffsetRandomMaximumSlider.disabled = true;
        defaultOffsetRandomMinimumSlider.disabled = true;

        defaultOffsetFixedOption.textContent = `Fixed: ${parseFloat(defaultOffsetFixedSlider.value).toFixed(1)}s`;
        const val1 = parseFloat(defaultOffsetRandomMaximumSlider.value).toFixed(
          1,
        );
        const val2 = parseFloat(defaultOffsetRandomMinimumSlider.value).toFixed(
          1,
        );
        defaultOffsetRandomOption.textContent = `Random range: ${val2}s to ${val1}s`;
      } else {
        // 'random'
        defaultOffsetFixedContainer.classList.add("hidden");
        defaultOffsetRandomContainer.classList.remove("hidden");
        defaultOffsetFixedSlider.disabled = true;
        defaultOffsetRandomMaximumSlider.disabled = false;
        defaultOffsetRandomMinimumSlider.disabled = false;

        const val1 = parseFloat(defaultOffsetRandomMaximumSlider.value).toFixed(
          1,
        );
        const val2 = parseFloat(defaultOffsetRandomMinimumSlider.value).toFixed(
          1,
        );
        defaultOffsetRandomOption.textContent = `Random range: ${val2}s to ${val1}s`;
        defaultOffsetFixedOption.textContent = `Fixed: ${parseFloat(defaultOffsetFixedSlider.value).toFixed(1)}s`;
      }
    } else {
      defaultOffsetControlsContainer.classList.add("hidden");
      defaultOffsetTypeSelect.disabled = true;
      defaultOffsetFixedContainer.classList.add("hidden");
      defaultOffsetRandomContainer.classList.add("hidden");
      defaultOffsetFixedSlider.disabled = true;
      defaultOffsetRandomMaximumSlider.disabled = true;
      defaultOffsetRandomMinimumSlider.disabled = true;

      defaultOffsetFixedOption.textContent = `Fixed: 0.0s`;
      defaultOffsetRandomOption.textContent = `Random range: 0.0s to 0.0s`;
    }
  }

  /**
   * Sets the state of default voice options (enabled/disabled).
   */
  function setDefaultVoiceOptionsState() {
    if (
      !defaultVoiceEnabled ||
      !defaultVoiceOptionsContainer ||
      !defaultVoiceSelect ||
      !defaultVoiceRateSelect ||
      !defaultLeadTimeSlider
    ) {
      console.error(
        "Error in setDefaultVoiceOptionsState: Required elements not found.",
      );
      return;
    }

    const isVoiceEnabled = defaultVoiceEnabled.checked;
    const hasVoices =
      defaultVoiceSelect.options.length > 0 &&
      defaultVoiceSelect.options[0].value !== "";

    if (isVoiceEnabled) {
      defaultVoiceOptionsContainer.classList.remove("hidden");
      defaultVoiceSelect.disabled = !hasVoices;
      defaultVoiceRateSelect.disabled = !hasVoices;
      defaultLeadTimeSlider.disabled = false;
    } else {
      defaultVoiceOptionsContainer.classList.add("hidden");
      defaultVoiceSelect.disabled = true;
      defaultVoiceRateSelect.disabled = true;
      defaultLeadTimeSlider.disabled = true;
    }
  }

  /**
   * Updates the message interval display in the dropdown options
   * @param {HTMLElement} messageElement - The message element
   * @param {number} totalSeconds - Total seconds value
   * @param {string} intervalType - Type of interval (fixed or additional)
   */
  function updateMessageIntervalDisplay(messageElement, totalSeconds, intervalType = "fixed") {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

    const fixedOption = messageElement.querySelector(".message-interval-type-fixed-option");
    const additionalOption = messageElement.querySelector(".message-interval-type-additional-option");

    if (fixedOption) {
      fixedOption.textContent = `Fixed: ${formattedTime}`;
    }
    if (additionalOption) {
      additionalOption.textContent = `Additional: ${formattedTime}`;
    }
  }

  /**
   * Gets the default configuration values from the global config.
   * @returns {Object} Default configuration object.
   */
  function getDefaultConfigValues() {
    return {
      repeat: "1",
      shotInterval: defaultShotIntervalSlider
        ? defaultShotIntervalSlider.value
        : "5.0",
      leadTime: defaultLeadTimeSlider ? defaultLeadTimeSlider.value : "2.5",
      iterationType: defaultIterationTypeSelect
        ? defaultIterationTypeSelect.value
        : "in-order",
      limitsType: defaultLimitsTypeSelect
        ? defaultLimitsTypeSelect.value
        : "all-shots",
      shotLimit: defaultShotLimitSlider ? defaultShotLimitSlider.value : "1",
      timeLimit: defaultTimeLimitSlider ? defaultTimeLimitSlider.value : "600",
      offset: {
        enabled: defaultOffsetEnabled ? defaultOffsetEnabled.checked : false,
        type: defaultOffsetTypeSelect ? defaultOffsetTypeSelect.value : "fixed",
        fixedValue: defaultOffsetFixedSlider ? defaultOffsetFixedSlider.value : "0",
        randomMaximum: defaultOffsetRandomMaximumSlider
          ? defaultOffsetRandomMaximumSlider.value
          : "0",
        randomMinimum: defaultOffsetRandomMinimumSlider
          ? defaultOffsetRandomMinimumSlider.value
          : "0",
      },
      splitStep: {
        enabled: defaultSplitStepEnabled
          ? defaultSplitStepEnabled.checked
          : true,
        rate: defaultSplitStepSpeedSelect
          ? defaultSplitStepSpeedSelect.value
          : "auto-scale",
      },
      voice: {
        enabled: defaultVoiceEnabled ? defaultVoiceEnabled.checked : true,
        voiceName: defaultVoiceSelect ? defaultVoiceSelect.value : "Default",
        rate: defaultVoiceRateSelect
          ? defaultVoiceRateSelect.value
          : "auto-scale",
      },
      message: {
        text: "",
        interval: "0",
        skipAtEnd: false,
      },
    };
  }

  /**
   * Checks if any local configurations are different from default values.
   * @returns {boolean} True if any non-default configs exist.
   */
  function hasNonDefaultConfigs() {
    const defaults = getDefaultConfigValues();
    const patternInstances = document.querySelectorAll(".pattern-instance");

    for (const pattern of patternInstances) {
      // Check pattern-level configs
      const patternRepeat = pattern.querySelector(".repeat-slider")?.value;
      const patternShotInterval = pattern.querySelector(
        ".shot-interval-slider",
      )?.value;
      const patternLeadTime = pattern.querySelector(".lead-time-slider")?.value;
      const patternIterationType = pattern.querySelector(
        ".iteration-type-select",
      )?.value;
      const patternLimitsType = pattern.querySelector(
        ".limits-type-select",
      )?.value;
      const patternShotLimit =
        pattern.querySelector(".shot-limit-slider")?.value;
      const patternTimeLimit =
        pattern.querySelector(".time-limit-slider")?.value;

      if (
        patternRepeat !== defaults.repeat ||
        patternShotInterval !== defaults.shotInterval ||
        patternLeadTime !== defaults.leadTime ||
        patternIterationType !== defaults.iterationType ||
        patternLimitsType !== defaults.limitsType ||
        patternShotLimit !== defaults.shotLimit ||
        patternTimeLimit !== defaults.timeLimit
      ) {
        return true;
      }

      // Check pattern offset, split-step, voice settings
      const patternOffsetEnabled =
        pattern.querySelector(".offset-enabled")?.checked;
      const patternOffsetType = pattern.querySelector(".offset-type-select")?.value;
      const patternOffsetFixed =
        pattern.querySelector(".offset-fixed-slider")?.value;
      const patternOffsetMax = pattern.querySelector(
        ".offset-random-maximum-slider",
      )?.value;
      const patternOffsetMin = pattern.querySelector(
        ".offset-random-minimum-slider",
      )?.value;

      if (
        patternOffsetEnabled !== defaults.offset.enabled ||
        patternOffsetType !== defaults.offset.type ||
        patternOffsetFixed !== defaults.offset.fixedValue ||
        patternOffsetMax !== defaults.offset.randomMaximum ||
        patternOffsetMin !== defaults.offset.randomMinimum
      ) {
        return true;
      }

      // Check shots and messages
      const shotMsgInstances = pattern.querySelectorAll(".shot-msg-instance");
      for (const instance of shotMsgInstances) {
        const isShot = instance.classList.contains("shot-instance");
        const instanceRepeat = instance.querySelector(".repeat-slider")?.value;

        if (instanceRepeat !== defaults.repeat) {
          return true;
        }

        if (isShot) {
          const shotInterval = instance.querySelector(
            ".shot-interval-slider",
          )?.value;
          const leadTime = instance.querySelector(".lead-time-slider")?.value;

          if (
            shotInterval !== defaults.shotInterval ||
            leadTime !== defaults.leadTime
          ) {
            return true;
          }

                  // Check shot-specific offset, split-step, voice settings
        const offsetEnabled = instance.querySelector(".offset-enabled")?.checked;
        const offsetType = instance.querySelector(".offset-type-select")?.value;
        const offsetFixed = instance.querySelector(".offset-fixed-slider")?.value;
        const offsetMax = instance.querySelector(
          ".offset-random-maximum-slider",
        )?.value;
        const offsetMin = instance.querySelector(
          ".offset-random-minimum-slider",
        )?.value;

          if (
                      offsetEnabled !== defaults.offset.enabled ||
          offsetType !== defaults.offset.type ||
          offsetFixed !== defaults.offset.fixedValue ||
          offsetMax !== defaults.offset.randomMaximum ||
          offsetMin !== defaults.offset.randomMinimum
          ) {
            return true;
          }
        } else {
          // Check message-specific settings
          const messageText = instance.querySelector(".message-input")?.value;
          const messageInterval = instance.querySelector(
            ".message-interval-slider",
          )?.value;
          const skipAtEnd = instance.querySelector(
            ".skip-at-end-of-workout",
          )?.checked;

          if (
            messageText !== defaults.message.text ||
            messageInterval !== defaults.message.interval ||
            skipAtEnd !== defaults.message.skipAtEnd
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Resets all local configurations to their default values.
   */
  function resetAllConfigsToDefaults() {
    const defaults = getDefaultConfigValues();
    const patternInstances = document.querySelectorAll(".pattern-instance");

    patternInstances.forEach((pattern) => {
      // Reset pattern-level configs
      const patternRepeat = pattern.querySelector(".repeat-slider");
      const patternRepeatValue = pattern.querySelector(".repeat-value");
      const patternShotInterval = pattern.querySelector(
        ".shot-interval-slider",
      );
      const patternShotIntervalValue = pattern.querySelector(
        ".shot-interval-value",
      );
      const patternLeadTime = pattern.querySelector(".lead-time-slider");
      const patternLeadTimeValue = pattern.querySelector(".lead-time-value");
      const patternIterationType = pattern.querySelector(
        ".iteration-type-select",
      );
      const patternLimitsType = pattern.querySelector(".limits-type-select");
      const patternShotLimit = pattern.querySelector(".shot-limit-slider");
      const patternShotLimitValue = pattern.querySelector(".shot-limit-value");
      const patternTimeLimit = pattern.querySelector(".time-limit-slider");
      const patternTimeLimitValue = pattern.querySelector(".time-limit-value");

      if (patternRepeat) {
        patternRepeat.value = defaults.repeat;
        if (patternRepeatValue)
          patternRepeatValue.textContent = `${defaults.repeat}x`;
      }
      if (patternShotInterval) {
        patternShotInterval.value = defaults.shotInterval;
        if (patternShotIntervalValue)
          patternShotIntervalValue.textContent = `${parseFloat(defaults.shotInterval).toFixed(1)}s`;
      }
      if (patternLeadTime) {
        patternLeadTime.value = defaults.leadTime;
        if (patternLeadTimeValue)
          patternLeadTimeValue.textContent = `${parseFloat(defaults.leadTime).toFixed(1)}s`;
      }
      if (patternIterationType)
        patternIterationType.value = defaults.iterationType;
      if (patternLimitsType) patternLimitsType.value = defaults.limitsType;
      if (patternShotLimit) {
        patternShotLimit.value = defaults.shotLimit;
        if (patternShotLimitValue)
          patternShotLimitValue.textContent = defaults.shotLimit;
      }
      if (patternTimeLimit) {
        patternTimeLimit.value = defaults.timeLimit;
        if (patternTimeLimitValue) {
          const totalSeconds = parseInt(defaults.timeLimit);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
          patternTimeLimitValue.textContent = `${minutes}:${formattedSeconds}`;
        }
      }

              // Reset pattern offset, split-step, voice settings
        const patternOffsetEnabled = pattern.querySelector(".offset-enabled");
        const patternOffsetType = pattern.querySelector(".offset-type-select");
        const patternOffsetFixed = pattern.querySelector(".offset-fixed-slider");
        const patternOffsetMax = pattern.querySelector(
          ".offset-random-maximum-slider",
        );
        const patternOffsetMin = pattern.querySelector(
          ".offset-random-minimum-slider",
        );

              if (patternOffsetEnabled)
          patternOffsetEnabled.checked = defaults.offset.enabled;
        if (patternOffsetType) patternOffsetType.value = defaults.offset.type;
        if (patternOffsetFixed) patternOffsetFixed.value = defaults.offset.fixedValue;
        if (patternOffsetMax) patternOffsetMax.value = defaults.offset.randomMaximum;
        if (patternOffsetMin) patternOffsetMin.value = defaults.offset.randomMinimum;

      // Reset shots and messages
      const shotMsgInstances = pattern.querySelectorAll(".shot-msg-instance");
      shotMsgInstances.forEach((instance) => {
        const isShot = instance.classList.contains("shot-instance");
        const instanceRepeat = instance.querySelector(".repeat-slider");
        const instanceRepeatValue = instance.querySelector(".repeat-value");

        if (instanceRepeat) {
          instanceRepeat.value = defaults.repeat;
          if (instanceRepeatValue)
            instanceRepeatValue.textContent = `${defaults.repeat}x`;
        }

        if (isShot) {
          const shotInterval = instance.querySelector(".shot-interval-slider");
          const shotIntervalValue = instance.querySelector(
            ".shot-interval-value",
          );
          const leadTime = instance.querySelector(".lead-time-slider");
          const leadTimeValue = instance.querySelector(".lead-time-value");

          if (shotInterval) {
            shotInterval.value = defaults.shotInterval;
            if (shotIntervalValue)
              shotIntervalValue.textContent = `${parseFloat(defaults.shotInterval).toFixed(1)}s`;
          }
          if (leadTime) {
            leadTime.value = defaults.leadTime;
            if (leadTimeValue)
              leadTimeValue.textContent = `${parseFloat(defaults.leadTime).toFixed(1)}s`;
          }

          // Reset shot-specific settings
                  const offsetEnabled = instance.querySelector(".offset-enabled");
        const offsetType = instance.querySelector(".offset-type-select");
        const offsetFixed = instance.querySelector(".offset-fixed-slider");
        const offsetMax = instance.querySelector(
          ".offset-random-maximum-slider",
        );
        const offsetMin = instance.querySelector(
          ".offset-random-minimum-slider",
        );

        if (offsetEnabled) offsetEnabled.checked = defaults.offset.enabled;
        if (offsetType) offsetType.value = defaults.offset.type;
        if (offsetFixed) offsetFixed.value = defaults.offset.fixedValue;
        if (offsetMax) offsetMax.value = defaults.offset.randomMaximum;
        if (offsetMin) offsetMin.value = defaults.offset.randomMinimum;

                  // Update offset controls visibility
        updateOffsetControls(instance, null, null, null);
        } else {
          // Reset message-specific settings
          const messageInput = instance.querySelector(".message-input");
          const messageInterval = instance.querySelector(
            ".message-interval-slider",
          );
          const messageIntervalValue = instance.querySelector(
            ".message-interval-value",
          );
          const skipAtEnd = instance.querySelector(".skip-at-end-of-workout");

          if (messageInput) messageInput.value = defaults.message.text;
          if (messageInterval) {
            messageInterval.value = defaults.message.interval;
            if (messageIntervalValue) {
              const totalSeconds = parseInt(defaults.message.interval);
              const minutes = Math.floor(totalSeconds / 60);
              const seconds = totalSeconds % 60;
              const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
              messageIntervalValue.textContent = `${minutes}:${formattedSeconds}`;
            }
          }
          if (skipAtEnd) skipAtEnd.checked = defaults.message.skipAtEnd;
        }
      });

      // Update pattern offset controls visibility
      updateOffsetControls(pattern, null, null, null);
    });
  }

  /**
   * Calculates the current position of an element within its parent container.
   * @param {HTMLElement} element The element to get position for.
   * @returns {number} The 1-based position of the element.
   */
  function getElementPosition(element) {
    if (element.classList.contains("pattern-instance")) {
      const patterns = Array.from(
        mainContainer.querySelectorAll(".pattern-instance"),
      );
      return patterns.indexOf(element) + 1;
    } else if (element.classList.contains("shot-msg-instance")) {
      const parent = element.closest(".pattern-instance");
      const siblings = Array.from(
        parent.querySelectorAll(".shot-msg-instance"),
      );
      return siblings.indexOf(element) + 1;
    }
    return 1;
  }

  /**
   * Gets all siblings for an element in the same container.
   * @param {HTMLElement} element The element to get siblings for.
   * @returns {Array} Array of sibling elements.
   */


  /**
   * Finds the linked group that contains a specific element.
   * @param {HTMLElement} element The element to find the group for.
   * @returns {Array} Array of elements in the linked group (including the element itself).
   */


  /**
   * Checks if any element in a group is position-locked.
   * @param {Array} group Array of elements in the group.
   * @returns {boolean} True if any element in the group is locked.
   */


  /**
   * Gets the lock type of a group (position or last) if any member is locked.
   * @param {Array} group Array of elements in the group.
   * @returns {string|null} Lock type ('position' or 'last') or null if not locked.
   */


  /**
   * Updates the visual styling for all elements in a linked group based on lock state.
   * @param {HTMLElement} element Any element from the group to update.
   */


  /**
   * Checks if an element can be moved (considering group constraints).
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if the element can be moved.
   */


  /**
   * Checks if swapping two elements would violate any locked positions.
   * @param {HTMLElement} element1 First element to swap.
   * @param {HTMLElement} element2 Second element to swap.
   * @param {Array} siblings Array of all siblings.
   * @returns {boolean} True if the swap is valid.
   */


  /**
   * Finds a suitable swap target for moving in a given direction.
   * @param {HTMLElement} element The element to move.
   * @param {string} direction 'up' or 'down'.
   * @returns {HTMLElement|null} The element to swap with, or null if no valid swap.
   */


  /**
   * Checks if an element can be moved (not locked or only locked to last position in a moveable way).
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if the element can participate in swaps.
   */


  /**
   * Checks if a position move is valid by finding a swap target.
   * @param {HTMLElement} element The element to move.
   * @param {string} direction 'up' or 'down'.
   * @returns {boolean} True if the move is valid.
   */


  /**
   * Performs a swap between two elements in the DOM.
   * @param {HTMLElement} element1 First element to swap.
   * @param {HTMLElement} element2 Second element to swap.
   */


  /**
   * Moves a group of linked elements to a new position.
   * @param {Array} group Array of elements in the linked group.
   * @param {HTMLElement} targetElement The element to move the group before/after.
   * @param {string} direction 'up' or 'down'.
   */


  /**
   * Scrolls an element to the center of the viewport with smooth animation.
   * @param {HTMLElement} element The element to scroll into view.
   */
  function scrollElementToCenter(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = rect.height;
    const elementTop = rect.top;

    // Calculate the scroll position to center the element
    const targetScrollTop =
      window.pageYOffset + elementTop - windowHeight / 2 + elementHeight / 2;

    // Smooth scroll to the target position
    window.scrollTo({
      top: targetScrollTop,
      behavior: "smooth",
    });
  }

  /**
   * Applies a temporary glow effect to the main bounding box of an accordion.
   * @param {HTMLElement} element The element to highlight.
   */
  function highlightMovedElement(element) {
    if (!element) return;

    // Apply glow to the main bounding box element (the element itself)
    // This will be the shot-instance, message-instance, or pattern-instance

    // Remove any previous glow and clear any existing listeners/timeouts
    element.classList.remove("move-glow");

    // Clear any existing animation end listeners
    if (element._glowAnimationEndListener) {
      element.removeEventListener(
        "animationend",
        element._glowAnimationEndListener,
      );
      element.removeEventListener(
        "webkitAnimationEnd",
        element._glowAnimationEndListener,
      );
    }

    // Clear any existing timeout
    if (element._glowTimeout) {
      clearTimeout(element._glowTimeout);
    }

    // Force a reflow to ensure the pseudo-element is recreated
    element.offsetHeight;

    // Create animation end listener
    const animationEndListener = () => {
      element.classList.remove("move-glow");
      element.removeEventListener("animationend", animationEndListener);
      element.removeEventListener("webkitAnimationEnd", animationEndListener);
      element._glowAnimationEndListener = null;
      if (element._glowTimeout) {
        clearTimeout(element._glowTimeout);
        element._glowTimeout = null;
      }
    };

    // Store the listener reference
    element._glowAnimationEndListener = animationEndListener;

    // Add the glow class to the main bounding box
    element.classList.add("move-glow");

    // Listen for both standard and webkit animation end events
    element.addEventListener("animationend", animationEndListener);
    element.addEventListener("webkitAnimationEnd", animationEndListener);

    // Fallback timeout for mobile browsers (1.1 seconds to be safe)
    element._glowTimeout = setTimeout(() => {
      element.classList.remove("move-glow");
      element._glowTimeout = null;
    }, 1100);
  }

  /**
   * Finds the next available position for a group when moving up.
   * @param {HTMLElement} element The element from the group to move.
   * @returns {boolean} True if move was performed, false otherwise.
   */


  /**
   * Finds the next available position for a group when moving down.
   * @param {HTMLElement} element The element from the group to move.
   * @returns {boolean} True if move was performed, false otherwise.
   */


  /**
   * Checks if an element is the last in its container.
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if element is last in its container.
   */


  /**
   * Updates the "Link with previous" button visibility and text for a given element.
   * @param {HTMLElement} element The shot or message element.
   */
  function updateLinkWithPreviousButton(element) {
    const linkWithPreviousContainer = element.querySelector(
      ".link-with-previous-container",
    );
    const linkWithPreviousBtn = element.querySelector(
      ".link-with-previous-btn",
    );
    const linkWithPreviousText = element.querySelector(
      ".link-with-previous-text",
    );
    const linkWithPreviousCheckmark = element.querySelector(
      ".link-with-previous-checkmark",
    );

    if (
      !linkWithPreviousContainer ||
      !linkWithPreviousBtn ||
      !linkWithPreviousText ||
      !linkWithPreviousCheckmark
    )
      return;

    const currentPosition = getElementPosition(element);
    const isLinked = element.dataset.linkedWithPrevious === "true";

    // Show only for positions greater than 1
    if (currentPosition > 1) {
      linkWithPreviousContainer.classList.remove("hidden");

      if (isLinked) {
        linkWithPreviousText.textContent = "Unlink from previous";
        linkWithPreviousCheckmark.classList.remove("hidden");
        element.classList.add("linked-with-previous");
      } else {
        linkWithPreviousText.textContent = "Link with previous";
        linkWithPreviousCheckmark.classList.add("hidden");
        element.classList.remove("linked-with-previous");
      }
    } else {
      linkWithPreviousContainer.classList.add("hidden");
      element.classList.remove("linked-with-previous");
    }
  }

  /**
   * Toggles the "Link with previous" state for a given element.
   * @param {HTMLElement} element The shot or message element.
   */
  function toggleLinkWithPrevious(element) {
    const isCurrentlyLinked = element.dataset.linkedWithPrevious === "true";
    element.dataset.linkedWithPrevious = isCurrentlyLinked ? "false" : "true";
    updateLinkWithPreviousButton(element);

    // Update group styling since the group membership has changed
    updateGroupLockStyling(element, mainContainer);

    // Also update styling for the previous element if it exists
    const siblings = getSiblings(element, mainContainer);
    const currentIndex = siblings.indexOf(element);
    if (currentIndex > 0) {
      updateGroupLockStyling(siblings[currentIndex - 1], mainContainer);
    }

    updateRocketIndicator(element);
  }

  /**
   * Updates the position lock button text and state for a given element.
   * @param {HTMLElement} element The pattern or shot/message element.
   */
  function updatePositionLockButton(element) {
    const positionLockBtn = element.querySelector(".position-lock-btn");
    const positionLockText = element.querySelector(".position-lock-text");
    const positionLockCheckmark = element.querySelector(
      ".position-lock-checkmark",
    );

    if (!positionLockBtn || !positionLockText || !positionLockCheckmark) return;

    const currentPosition = getElementPosition(element);
    const isLocked = element.dataset.positionLocked === "true";
    const lockType = element.dataset.positionLockType || "position";
    const isLast = isLastElement(element, mainContainer);
    const cycleState = parseInt(element.dataset.positionCycleState) || 0;

    // Update button text and checkmark based on individual lock state
    if (isLocked) {
      if (lockType === "last") {
        positionLockText.textContent = "Unlock from LAST position";
      } else {
        positionLockText.textContent = `Unlock from position ${currentPosition}`;
      }
      positionLockCheckmark.classList.remove("hidden");
    } else {
      if (isLast) {
        // For last elements, alternate between position and last lock options
        if (cycleState === 0 || cycleState === 1) {
          positionLockText.textContent = `Lock into position ${currentPosition}`;
        } else {
          positionLockText.textContent = "Lock into LAST position";
        }
      } else {
        positionLockText.textContent = `Lock into position ${currentPosition}`;
      }
      positionLockCheckmark.classList.add("hidden");
    }

    // Update visual styling for the entire linked group
    updateGroupLockStyling(element, mainContainer);
  }

  /**
   * Toggles the position lock state for a given element.
   * For last elements, cycles through 4 states:
   * 0: unlocked -> "Lock into position N"
   * 1: position locked -> "Unlock from position N"
   * 2: unlocked -> "Lock into LAST position"
   * 3: last locked -> "Unlock from LAST position" -> back to 0
   * For other elements: cycles between unlocked and position locked
   * @param {HTMLElement} element The pattern or shot/message element.
   */
  function togglePositionLock(element) {
    const isCurrentlyLocked = element.dataset.positionLocked === "true";
    const currentLockType = element.dataset.positionLockType || "position";
    const isLast = isLastElement(element, mainContainer);
    const cycleState = parseInt(element.dataset.positionCycleState) || 0;

    if (isLast) {
      // 4-state cycle for last elements
      switch (cycleState) {
        case 0: // unlocked -> position locked
          element.dataset.positionLocked = "true";
          element.dataset.positionLockType = "position";
          element.dataset.positionCycleState = "1";
          break;
        case 1: // position locked -> unlocked
          element.dataset.positionLocked = "false";
          element.dataset.positionLockType = "position";
          element.dataset.positionCycleState = "2";
          break;
        case 2: // unlocked -> last locked
          element.dataset.positionLocked = "true";
          element.dataset.positionLockType = "last";
          element.dataset.positionCycleState = "3";
          break;
        case 3: // last locked -> unlocked (back to start)
          element.dataset.positionLocked = "false";
          element.dataset.positionLockType = "position";
          element.dataset.positionCycleState = "0";
          break;
      }
    } else {
      // 2-state cycle for non-last elements
      if (!isCurrentlyLocked) {
        // unlocked -> position locked
        element.dataset.positionLocked = "true";
        element.dataset.positionLockType = "position";
      } else {
        // position locked -> unlocked
        element.dataset.positionLocked = "false";
        element.dataset.positionLockType = "position";
      }
      // Reset cycle state for consistency
      element.dataset.positionCycleState = "0";
    }

    updatePositionLockButton(element);

    // Update group styling for all linked elements since lock state affects the whole group
    const group = getLinkedGroup(element, mainContainer);
    group.forEach((member) => {
      if (member !== element) {
        updateGroupLockStyling(member, mainContainer);
      }
    });

    // Update all move button states since locking one element affects others
    updateAllMoveButtonStates();
    updateRocketIndicator(element);
  }

  /**
   * Checks if a group can move in a specific direction.
   * @param {HTMLElement} element The element from the group to check.
   * @param {string} direction 'up' or 'down'.
   * @returns {boolean} True if the group can move in that direction.
   */
  function canGroupMoveInDirection(element, direction) {
    // Use the shared module logic to ensure consistency with tests
    const target = findSwapTarget(element, direction, mainContainer);
    return target !== null;
  }

  /**
   * Updates the state of move up/down buttons based on group constraints and available moves.
   * @param {HTMLElement} element The pattern or shot/message element.
   */
  function updateMoveButtonsState(element) {
    const moveUpBtn = element.querySelector(
      ".move-up-btn, .pattern-move-up-btn",
    );
    const moveDownBtn = element.querySelector(
      ".move-down-btn, .pattern-move-down-btn",
    );

    // Check if moves are possible considering group constraints
    const canMoveUp = canGroupMoveInDirection(element, "up");
    const canMoveDown = canGroupMoveInDirection(element, "down");

    if (moveUpBtn) {
      moveUpBtn.disabled = !canMoveUp;
      if (!canMoveUp) {
        moveUpBtn.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        moveUpBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }

    if (moveDownBtn) {
      moveDownBtn.disabled = !canMoveDown;
      if (!canMoveDown) {
        moveDownBtn.classList.add("opacity-50", "cursor-not-allowed");
      } else {
        moveDownBtn.classList.remove("opacity-50", "cursor-not-allowed");
      }
    }
  }

  /**
   * Updates all position lock buttons after elements are moved or added.
   */
  function updateAllPositionLockButtons() {
    // Update all pattern position lock buttons and link with previous buttons
    document.querySelectorAll(".pattern-instance").forEach((pattern) => {
      updatePositionLockButton(pattern);
      updateLinkWithPreviousButton(pattern);
      // If an item is locked to "last" but is no longer last, convert to position lock
      if (
        pattern.dataset.positionLocked === "true" &&
        pattern.dataset.positionLockType === "last" &&
        !isLastElement(pattern, mainContainer)
      ) {
        pattern.dataset.positionLockType = "position";
        pattern.dataset.positionCycleState = "1"; // Set to "locked position" state
      }
    });

    // Update all shot/message position lock buttons and link with previous buttons
    document.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
      updatePositionLockButton(shotMsg);
      updateLinkWithPreviousButton(shotMsg);
      // If an item is locked to "last" but is no longer last, convert to position lock
      if (
        shotMsg.dataset.positionLocked === "true" &&
        shotMsg.dataset.positionLockType === "last" &&
        !isLastElement(shotMsg, mainContainer)
      ) {
        shotMsg.dataset.positionLockType = "position";
        shotMsg.dataset.positionCycleState = "1"; // Set to "locked position" state
      }
    });
  }

  /**
   * Updates all move button states after position locks change.
   */
  function updateAllMoveButtonStates() {
    // Update all pattern move button states
    document.querySelectorAll(".pattern-instance").forEach((pattern) => {
      updateMoveButtonsState(pattern);
    });

    // Update all shot/message move button states
    document.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
      updateMoveButtonsState(shotMsg);
    });
  }

  /**
   * Applies the lock state to settings buttons and content visibility in a given element.
   * @param {HTMLElement} element The element containing settings buttons and content.
   */
  function applyLockStateToElement(element) {
    const currentRocketMode =
      document.documentElement.getAttribute("data-rocket-mode");
    const isLocked = currentRocketMode === "off";

    // Instead of disabling settings buttons, disable specific submenu options
    const submenuTriggers = element.querySelectorAll(".submenu-trigger");

    submenuTriggers.forEach((trigger) => {
      const targetSubmenu = trigger.dataset.targetSubmenuClass;

      // Define which submenus should be disabled when locked
      const disallowedSubmenus = [
        "shot-interval-offset-submenu",
        "split-step-submenu",
        "voice-submenu",
      ];

      if (disallowedSubmenus.includes(targetSubmenu)) {
        trigger.disabled = isLocked;
        if (isLocked) {
          trigger.classList.add("opacity-50", "cursor-not-allowed");
        } else {
          trigger.classList.remove("opacity-50", "cursor-not-allowed");
        }
      }
    });

    // Ensure settings buttons (ellipse icons) are always enabled and accessible
    const settingsButtons = element.querySelectorAll(".settings-btn");
    settingsButtons.forEach((button) => {
      button.disabled = false;
      button.removeAttribute("disabled");
      button.classList.remove(
        "opacity-50",
        "cursor-not-allowed",
        "pointer-events-none",
      );

      button.style.pointerEvents = "auto";
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      // Force override any CSS that might be blocking
      button.style.visibility = "visible";
      button.style.display = "";
    });

    // Ensure position lock buttons are always enabled and accessible
    const positionLockButtons = element.querySelectorAll(".position-lock-btn");
    positionLockButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove("opacity-50", "cursor-not-allowed");

    });

    // Handle content visibility
    const patternContentWrappers = element.querySelectorAll(
      ".pattern-content-wrapper",
    );
    const shotContentWrappers = element.querySelectorAll(
      ".shot-content-wrapper",
    );
    const messageContentWrappers = element.querySelectorAll(
      ".message-content-wrapper",
    );

    // Use CSS class approach for better control
    if (isLocked) {
      element.classList.add("global-locked");
    } else {
      element.classList.remove("global-locked");
    }

    // NOTE: Add buttons are NOT hidden when locked - users can still add shots/messages
  }

  /**
   * Updates offset controls visibility and text.
   * @param {HTMLElement} instanceContainer The root element of the instance.
   * @param {HTMLElement} settingsPanel The settings dropdown panel.
   * @param {HTMLElement} mainMenuContent The main menu content.
   * @param {HTMLElement} intervalOffsetSubmenu The interval offset submenu.
   */
  function updateOffsetControls(
    instanceContainer,
    settingsPanel,
    mainMenuContent,
    intervalOffsetSubmenu,
  ) {
    const offsetEnabledCheckbox =
      instanceContainer.querySelector(".offset-enabled");
    const offsetControlsContainer = instanceContainer.querySelector(
      ".offset-controls-container",
    );
    const offsetTypeSelect = instanceContainer.querySelector(".offset-type-select");
    const offsetFixedOption =
      instanceContainer.querySelector(".offset-fixed-option");
    const offsetRandomOption = instanceContainer.querySelector(
      ".offset-random-option",
    );
    const offsetFixedContainer = instanceContainer.querySelector(
      ".offset-fixed-container",
    );
    const offsetFixedSlider =
      instanceContainer.querySelector(".offset-fixed-slider");
    const offsetRandomContainer = instanceContainer.querySelector(
      ".offset-random-container",
    );
    const offsetRandomMaximumSlider = instanceContainer.querySelector(
      ".offset-random-maximum-slider",
    );
    const offsetRandomMinimumSlider = instanceContainer.querySelector(
      ".offset-random-minimum-slider",
    );
    const offsetToggleLabel =
      instanceContainer.querySelector(".offset-toggle-label");

    if (
      !offsetEnabledCheckbox ||
      !offsetControlsContainer ||
      !offsetTypeSelect ||
      !offsetFixedOption ||
      !offsetRandomOption ||
      !offsetFixedContainer ||
      !offsetRandomContainer ||
      !offsetFixedSlider ||
      !offsetRandomMaximumSlider ||
      !offsetRandomMinimumSlider
    ) {
      console.error(
        "Error in updateOffsetControls: Required elements not found in instance.",
        instanceContainer,
      );
      return;
    }

    const isOffsetEnabled = offsetEnabledCheckbox.checked;
    const offsetType = offsetTypeSelect.value;

    // Update toggle label
    if (offsetToggleLabel) {
      offsetToggleLabel.textContent = isOffsetEnabled
        ? "Offset enabled"
        : "Offset disabled";
    }

    if (isOffsetEnabled) {
      offsetControlsContainer.classList.remove("hidden");
      offsetTypeSelect.disabled = false;

      if (offsetType === "fixed") {
        offsetFixedContainer.classList.remove("hidden");
        offsetRandomContainer.classList.add("hidden");
        offsetFixedSlider.disabled = false;
        offsetRandomMaximumSlider.disabled = true;
        offsetRandomMinimumSlider.disabled = true;

        offsetFixedOption.textContent = `Fixed: ${parseFloat(offsetFixedSlider.value).toFixed(1)}s`;
        const val1 = parseFloat(offsetRandomMaximumSlider.value).toFixed(1);
        const val2 = parseFloat(offsetRandomMinimumSlider.value).toFixed(1);
        offsetRandomOption.textContent = `Random range: ${val2}s to ${val1}s`;
      } else {
        // 'random'
        offsetFixedContainer.classList.add("hidden");
        offsetRandomContainer.classList.remove("hidden");
        offsetFixedSlider.disabled = true;
        offsetRandomMaximumSlider.disabled = false;
        offsetRandomMinimumSlider.disabled = false;

        const val1 = parseFloat(offsetRandomMaximumSlider.value).toFixed(1);
        const val2 = parseFloat(offsetRandomMinimumSlider.value).toFixed(1);
        offsetRandomOption.textContent = `Random range: ${val2}s to ${val1}s`;
        offsetFixedOption.textContent = `Fixed: ${parseFloat(offsetFixedSlider.value).toFixed(1)}s`;
      }
    } else {
      offsetControlsContainer.classList.add("hidden");
      offsetTypeSelect.disabled = true;
      offsetFixedContainer.classList.add("hidden");
      offsetRandomContainer.classList.add("hidden");
      offsetFixedSlider.disabled = true;
      offsetRandomMaximumSlider.disabled = true;
      offsetRandomMinimumSlider.disabled = true;

      offsetFixedOption.textContent = `Fixed: 0.0s`;
      offsetRandomOption.textContent = `Random range: 0.0s to 0.0s`;
    }
    if (
      settingsPanel &&
      mainMenuContent &&
      settingsPanel.classList.contains("active") &&
      intervalOffsetSubmenu &&
      intervalOffsetSubmenu.classList.contains("active")
    ) {
      requestAnimationFrame(() =>
        setPanelHeight(settingsPanel, mainMenuContent),
      );
    }
  }

  /**
   * Populates voice select dropdown for a given instance.
   * @param {HTMLElement} voiceSelectElement
   */
  function populateVoiceSelect(voiceSelectElement) {
    if (!voiceSelectElement) {
      console.error(
        "Error in populateVoiceSelect: Voice select element not found.",
      );
      return;
    }

    // Clear existing options
    voiceSelectElement.innerHTML = "";

    // Add the new default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "Default";
    defaultOption.textContent = "Default";
    voiceSelectElement.appendChild(defaultOption);

    // Get system voices
    const voices = window.speechSynthesis.getVoices();

    // Filter voices based on platform
    // Enhanced iOS detection for iPad Safari
    const userAgent = navigator.userAgent;
    const isIOS = (
      /iPad|iPhone|iPod/.test(userAgent) ||
      (userAgent.includes('Mac') && 'ontouchend' in document) ||
      (userAgent.includes('Safari') && userAgent.includes('Mac') && navigator.maxTouchPoints > 0)
    ) && !window.MSStream;

    const iosVoices = ["Karen", "Daniel", "Moira", "Rishi", "Samantha"];

    let filteredVoices = [];
    if (isIOS) {
      // On iOS, only include the specified voices
      filteredVoices = voices.filter((voice) => iosVoices.includes(voice.name));
    } else {
      // On other platforms, include English voices
      const englishVoices = voices.filter((voice) =>
        voice.lang.startsWith("en-"),
      );
      if (englishVoices.length > 0) {
        filteredVoices = englishVoices;
      } else {
        filteredVoices = voices;
      }
    }

    // Fallback to all voices if no filtered voices found
    if (filteredVoices.length === 0 && voices.length > 0) {
      filteredVoices = voices;
    }

    // Add system voices, ensuring uniqueness
    const addedVoices = new Set(["Default"]); // Track added voices to avoid duplicates

    filteredVoices.forEach((voice) => {
      if (!addedVoices.has(voice.name)) {
        const option = document.createElement("option");
        option.value = voice.name;
        option.textContent = voice.name;
        voiceSelectElement.appendChild(option);
        addedVoices.add(voice.name);
      }
    });

    // If no voices available, show a message
    if (filteredVoices.length === 0) {
      const option = document.createElement("option");
      option.textContent = "No voices available";
      option.value = "";
      voiceSelectElement.appendChild(option);
      voiceSelectElement.disabled = true;
      return;
    }

    // Set default selection
    let defaultVoiceFound = false;
    for (let i = 0; i < voiceSelectElement.options.length; i++) {
      const option = voiceSelectElement.options[i];
      if (option.value === "Default") {
        option.selected = true;
        defaultVoiceFound = true;
        break;
      }
    }

    // If Default not found, select first option
    if (!defaultVoiceFound && voiceSelectElement.options.length > 0) {
      voiceSelectElement.options[0].selected = true;
    }
  }

  /**
   * Sets the state of voice options (enabled/disabled).
   * @param {HTMLElement} instanceContainer The root element of the instance.
   * @param {HTMLElement} settingsPanel The settings dropdown panel.
   * @param {HTMLElement} mainMenuContent The main menu content.
   * @param {HTMLElement} voiceSubmenu The voice submenu.
   */
  function setVoiceOptionsState(
    instanceContainer,
    settingsPanel,
    mainMenuContent,
    voiceSubmenu,
  ) {
    const voiceEnabledCheckbox =
      instanceContainer.querySelector(".voice-enabled");
    const voiceOptionsContainer = instanceContainer.querySelector(
      ".voice-options-container",
    );
    const voiceSelect = instanceContainer.querySelector(".voice-select");
    const voiceRateSelect =
      instanceContainer.querySelector(".voice-rate-select");
    const leadTimeSlider = instanceContainer.querySelector(".lead-time-slider");

    if (
      !voiceEnabledCheckbox ||
      !voiceOptionsContainer ||
      !voiceSelect ||
      !voiceRateSelect ||
      !leadTimeSlider
    ) {
      console.error(
        "Error in setVoiceOptionsState: Required elements not found in instance.",
        instanceContainer,
      );
      return;
    }

    const isVoiceEnabled = voiceEnabledCheckbox.checked;
    const hasVoices =
      voiceSelect.options.length > 0 && voiceSelect.options[0].value !== "";

    if (isVoiceEnabled) {
      voiceOptionsContainer.classList.remove("hidden");
      voiceSelect.disabled = !hasVoices;
      voiceRateSelect.disabled = !hasVoices;
      leadTimeSlider.disabled = false;
    } else {
      voiceOptionsContainer.classList.add("hidden");
      voiceSelect.disabled = true;
      voiceRateSelect.disabled = true;
      leadTimeSlider.disabled = true;
    }
    if (
      settingsPanel &&
      mainMenuContent &&
      settingsPanel.classList.contains("active") &&
      voiceSubmenu &&
      voiceSubmenu.classList.contains("active")
    ) {
      requestAnimationFrame(() =>
        setPanelHeight(settingsPanel, mainMenuContent),
      );
    }
  }

  /**
   * Switches tabs within a given instance.
   * @param {HTMLElement} instanceContainer The root element of the instance.
   * @param {string} tabType 'msg' or 'shot'.
   */

  /**
   * Initializes event listeners and states for a newly created or cloned Shot/Message instance.
   * @param {HTMLElement} instanceElement The root element of the Shot/Message instance.
   * @param {Object} [initialState] Optional state to apply to the instance.
   */
  function initializeShotMsgInstance(instanceElement, initialState = {}) {
    const instanceType = instanceElement.dataset.type;

    // Get elements specific to this instance based on type
    const headerElement = instanceElement.querySelector(
      instanceType === "shot" ? ".shot-header" : ".message-header",
    );
    const bodyElement = instanceElement.querySelector(
      instanceType === "shot" ? ".shot-body" : ".message-body",
    );
    const arrowElement = instanceElement.querySelector(
      instanceType === "shot" ? ".shot-arrow" : ".message-arrow",
    );
    const titleInput = instanceElement.querySelector(
      instanceType === "shot" ? ".shot-title" : ".message-title",
    );

    const repeatSlider = instanceElement.querySelector(".repeat-slider");
    const repeatValueSpan = instanceElement.querySelector(".repeat-value");
    const shotIntervalSlider = instanceElement.querySelector(
      ".shot-interval-slider",
    );
    const shotIntervalValueSpan = instanceElement.querySelector(
      ".shot-interval-value",
    );
    const leadTimeSlider = instanceElement.querySelector(".lead-time-slider");
    const leadTimeValueSpan = instanceElement.querySelector(".lead-time-value");
    const messageIntervalSlider = instanceElement.querySelector(
      ".message-interval-slider",
    );
    const messageIntervalValueSpan = instanceElement.querySelector(
      ".message-interval-value",
    );
    const messageInput = instanceElement.querySelector(".message-input");
    const skipAtEndOfWorkoutCheckbox = instanceElement.querySelector(
      ".skip-at-end-of-workout",
    );

    const settingsBtn = instanceElement.querySelector(".settings-btn");
    const settingsPanel = instanceElement.querySelector(".settings-panel");
    const mainMenuContent = instanceElement.querySelector(".main-menu-content");
    const submenuTriggerButtons =
      instanceElement.querySelectorAll(".submenu-trigger");
    const backButtons = instanceElement.querySelectorAll(".back-btn");

    const offsetEnabledCheckbox = instanceElement.querySelector(".offset-enabled");
    const offsetTypeSelect = instanceElement.querySelector(".offset-type-select");
    const offsetFixedSlider = instanceElement.querySelector(".offset-fixed-slider");
    const offsetRandomMaximumSlider = instanceElement.querySelector(
      ".offset-random-maximum-slider",
    );
    const offsetRandomMinimumSlider = instanceElement.querySelector(
      ".offset-random-minimum-slider",
    );
    const shotIntervalOffsetSubmenu = instanceElement.querySelector(
      ".shot-interval-offset-submenu",
    );

    const splitStepEnabledCheckbox = instanceElement.querySelector(
      ".split-step-enabled",
    );
    const splitStepRateContainer = instanceElement.querySelector(
      ".split-step-rate-container",
    );
    const splitStepSpeedSelect = instanceElement.querySelector(
      ".split-step-speed-select",
    );
    const splitStepSubmenu = instanceElement.querySelector(
      ".split-step-submenu",
    );

    const voiceEnabledCheckbox =
      instanceElement.querySelector(".voice-enabled");
    const voiceSelect = instanceElement.querySelector(".voice-select");
    const voiceRateSelect = instanceElement.querySelector(".voice-rate-select");
    const voiceOptionsContainer = instanceElement.querySelector(
      ".voice-options-container",
    );
    const voiceSubmenu = instanceElement.querySelector(".voice-submenu");

    // Apply initial state if provided (for cloning)
    if (Object.keys(initialState).length > 0) {
      if (initialState.title && titleInput)
        titleInput.value = initialState.title;
      if (initialState.type) instanceElement.dataset.type = initialState.type;

      if (repeatSlider)
        repeatSlider.value = initialState.repeat || repeatSlider.value;
      if (shotIntervalSlider)
        shotIntervalSlider.value =
          initialState.shotInterval || shotIntervalSlider.value;
      if (leadTimeSlider)
        leadTimeSlider.value = initialState.leadTime || leadTimeSlider.value;
      if (messageInput)
        messageInput.value = initialState.message || messageInput.value;
      if (messageIntervalSlider)
        messageIntervalSlider.value =
          initialState.messageInterval || messageIntervalSlider.value;
      if (skipAtEndOfWorkoutCheckbox)
        skipAtEndOfWorkoutCheckbox.checked =
          initialState.skipAtEndOfWorkout !== undefined
            ? initialState.skipAtEndOfWorkout
            : skipAtEndOfWorkoutCheckbox.checked;

      if (initialState.offset) {
        if (offsetEnabledCheckbox)
          offsetEnabledCheckbox.checked = initialState.offset.enabled;
        if (offsetTypeSelect) offsetTypeSelect.value = initialState.offset.type;
        if (offsetFixedSlider)
          offsetFixedSlider.value = initialState.offset.fixedValue;
        if (offsetRandomMaximumSlider)
          offsetRandomMaximumSlider.value = initialState.offset.randomMaximum;
        if (offsetRandomMinimumSlider)
          offsetRandomMinimumSlider.value = initialState.offset.randomMinimum;
      }

      if (initialState.splitStep) {
        if (splitStepEnabledCheckbox)
          splitStepEnabledCheckbox.checked = initialState.splitStep.enabled;
        if (splitStepSpeedSelect)
          splitStepSpeedSelect.value = initialState.splitStep.rate;
      }

      if (initialState.voice) {
        if (voiceEnabledCheckbox)
          voiceEnabledCheckbox.checked = initialState.voice.enabled;
        if (voiceRateSelect) voiceRateSelect.value = initialState.voice.rate;
        // Voice select population happens after DOMContentLoaded, so we might need to set it after voices are loaded
        // For now, assume it's set in the populateVoiceSelect callback or later.
      }

      // Set position lock state if provided
      if (initialState.positionLocked !== undefined) {
        instanceElement.dataset.positionLocked = initialState.positionLocked;
      }
      if (initialState.positionLockType !== undefined) {
        instanceElement.dataset.positionLockType =
          initialState.positionLockType;
      }
      if (initialState.positionCycleState !== undefined) {
        instanceElement.dataset.positionCycleState =
          initialState.positionCycleState;
      }

      // Set link with previous state if provided
      if (initialState.linkedWithPrevious !== undefined) {
        instanceElement.dataset.linkedWithPrevious =
          initialState.linkedWithPrevious;
      }
    }

    // Initial updates for current instance
    if (repeatSlider && repeatValueSpan)
      repeatValueSpan.textContent = `${repeatSlider.value}x`;
    if (shotIntervalSlider && shotIntervalValueSpan)
      shotIntervalValueSpan.textContent = `${parseFloat(shotIntervalSlider.value).toFixed(1)}s`;
    if (messageIntervalSlider && messageIntervalValueSpan) {
      const totalSeconds = parseInt(messageIntervalSlider.value);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
      messageIntervalValueSpan.textContent = `${minutes}:${formattedSeconds}`;
    }

    // Add event listeners specific to this instance
    if (headerElement) {
      headerElement.addEventListener("click", function (event) {
        if (event.target !== titleInput && bodyElement && arrowElement) {
          bodyElement.classList.toggle("hidden");
          arrowElement.classList.toggle("rotate-180");
        }
      });
      headerElement.addEventListener("keydown", function (event) {
        if (
          (event.key === " " || event.key === "Enter") &&
          event.target !== titleInput
        ) {
          event.preventDefault();
          if (bodyElement && arrowElement) {
            bodyElement.classList.toggle("hidden");
            arrowElement.classList.toggle("rotate-180");
          }
        }
      });
    }

    if (repeatSlider)
      repeatSlider.addEventListener("input", function () {
        if (repeatValueSpan) repeatValueSpan.textContent = `${this.value}x`;
        updateRocketIndicator(instanceElement);
      });

    if (shotIntervalSlider)
      shotIntervalSlider.addEventListener("input", function () {
        if (shotIntervalValueSpan)
          shotIntervalValueSpan.textContent = `${parseFloat(this.value).toFixed(1)}s`;
        updateLeadTimeSlider(
          shotIntervalSlider,
          leadTimeSlider,
          leadTimeValueSpan,
        );
        updateRocketIndicator(instanceElement);

        // Mark this element as having customized the interval
        markPropertyAsCustomized(instanceElement, 'interval');
      });

    if (messageIntervalSlider)
      messageIntervalSlider.addEventListener("input", function () {
        const totalSeconds = parseInt(this.value);
        const intervalTypeSelect = instanceElement.querySelector(".message-interval-type-select");
        const intervalType = intervalTypeSelect ? intervalTypeSelect.value : "fixed";
        updateMessageIntervalDisplay(instanceElement, totalSeconds, intervalType);
        updateRocketIndicator(instanceElement);
      });

    // Message interval type dropdown
    const messageIntervalTypeSelect = instanceElement.querySelector(".message-interval-type-select");
    if (messageIntervalTypeSelect)
      messageIntervalTypeSelect.addEventListener("change", function () {
        const totalSeconds = messageIntervalSlider ? parseInt(messageIntervalSlider.value) : 0;
        updateMessageIntervalDisplay(instanceElement, totalSeconds, this.value);
        updateRocketIndicator(instanceElement);
      });

    // Message countdown toggle
    const messageCountdownEnabled = instanceElement.querySelector(".message-countdown-enabled");
    if (messageCountdownEnabled)
      messageCountdownEnabled.addEventListener("change", function () {
        const countdownToggleLabel = instanceElement.querySelector(".countdown-toggle-label");
        if (countdownToggleLabel) {
          countdownToggleLabel.textContent = this.checked ? "Countdown: On" : "Countdown: Off";
        }
        updateRocketIndicator(instanceElement);
      });

    if (leadTimeSlider)
      leadTimeSlider.addEventListener("input", function () {
        updateLeadTimeSlider(
          shotIntervalSlider,
          leadTimeSlider,
          leadTimeValueSpan,
        );
        updateRocketIndicator(instanceElement);

        // Mark this element as having customized the lead time
        markPropertyAsCustomized(instanceElement, 'shotAnnouncementLeadTime');
      });

    // Add toolbar button event listeners
    const deleteBtn = instanceElement.querySelector(".delete-btn");
    const cloneBtn = instanceElement.querySelector(".clone-btn");
    const moveUpBtn = instanceElement.querySelector(".move-up-btn");
    const moveDownBtn = instanceElement.querySelector(".move-down-btn");
    const positionLockBtn = instanceElement.querySelector(".position-lock-btn");

    if (deleteBtn) {
      deleteBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (confirm("Are you sure you want to delete this item?")) {
          const parentPatternElement =
            instanceElement.closest(".pattern-instance");
          const isShot = instanceElement.classList.contains("shot-instance");

          // Check if this is the last shot or message in the pattern
          const totalShotsMsgs =
            parentPatternElement.querySelectorAll(".shot-msg-instance").length;

          if (totalShotsMsgs <= 1) {
            // If this is the last shot/message, create a new default shot first
            createShotMsgInstance(parentPatternElement, "shot");
          }

          instanceElement.remove();

          // Update shot limit slider if this was a shot instance
          if (isShot && parentPatternElement) {
            updateShotLimitSlider(parentPatternElement);
          }

          // Update all position lock buttons since an instance was deleted
          updateAllPositionLockButtons();
          updateAllMoveButtonStates();
        }
      });
    }

    if (cloneBtn) {
      cloneBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        const currentState = getShotMsgInstanceCurrentState(instanceElement);
        const parentPattern = instanceElement.closest(".pattern-instance");
        if (parentPattern) {
          createShotMsgInstance(
            parentPattern,
            instanceType,
            currentState,
            instanceElement,
          );
        }
      });
    }

    if (moveUpBtn) {
      moveUpBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (!this.disabled) {
          const swapTarget = findSwapTarget(instanceElement, 'up', mainContainer);
          if (swapTarget) {
            swapElements(instanceElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();

            // Scroll the moved element to center and highlight it after a brief delay
            setTimeout(() => {
              scrollElementToCenter(instanceElement);
              highlightMovedElement(instanceElement);
            }, 100);
          }
        }
      });
    }

    if (moveDownBtn) {
      moveDownBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (!this.disabled) {
          const swapTarget = findSwapTarget(instanceElement, 'down', mainContainer);
          if (swapTarget) {
            swapElements(instanceElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();

            // Scroll the moved element to center and highlight it after a brief delay
            setTimeout(() => {
              scrollElementToCenter(instanceElement);
              highlightMovedElement(instanceElement);
            }, 100);
          }
        }
      });
    }

    // Skip at end of workout toggle (only for message instances)
    if (instanceType === "msg" && skipAtEndOfWorkoutCheckbox) {
      skipAtEndOfWorkoutCheckbox.addEventListener("change", function () {
        const skipToggleLabel =
          instanceElement.querySelector(".skip-toggle-label");
        if (skipToggleLabel) {
          skipToggleLabel.textContent = this.checked
            ? "Skip at end of workout"
            : "Always play message";
        }
      });
    }

    // Settings functionality (for shot and message instances)
    if (settingsBtn) {
      settingsBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleSettingsDropdown(settingsPanel, mainMenuContent);
      });



      // Position lock button (for all instances with settings)
      const positionLockBtn =
        instanceElement.querySelector(".position-lock-btn");
      if (positionLockBtn) {
        positionLockBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          togglePositionLock(instanceElement);
        });
      }

      // Link with previous button (for shot and message instances only)
      const linkWithPreviousBtn = instanceElement.querySelector(
        ".link-with-previous-btn",
      );
      if (linkWithPreviousBtn) {
        linkWithPreviousBtn.addEventListener("click", function (event) {
          event.stopPropagation();
          toggleLinkWithPrevious(instanceElement);
        });
      }

      submenuTriggerButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          if (!this.disabled) {
            const targetSubmenuClass = this.dataset.targetSubmenuClass;
            showSettingsSubmenu(
              settingsPanel,
              mainMenuContent,
              targetSubmenuClass,
            );
          }
        });
      });

      backButtons.forEach((button) => {
        button.addEventListener("click", function (event) {
          event.stopPropagation();
          showSettingsMainMenu(settingsPanel, mainMenuContent);
        });
      });

      // Shot-specific functionality
      if (instanceType === "shot") {
        if (offsetEnabledCheckbox)
          offsetEnabledCheckbox.addEventListener("change", function () {
            updateOffsetControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalOffsetSubmenu,
            );
            updateRocketIndicator(instanceElement);

            // Mark this shot as having customized the interval offset enabled setting
            markPropertyAsCustomized(instanceElement, 'intervalOffsetEnabled');
          });
        if (offsetTypeSelect)
          offsetTypeSelect.addEventListener("change", function() {
            updateOffsetControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalOffsetSubmenu,
            );
            updateRocketIndicator(instanceElement);

            // Mark this element as having customized the interval offset type
            markPropertyAsCustomized(instanceElement, 'intervalOffsetType');
          });
        if (offsetFixedSlider)
          offsetFixedSlider.addEventListener("input", function () {
            updateOffsetControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalOffsetSubmenu,
            );
            updateRocketIndicator(instanceElement);

            // Mark this shot as having customized the interval offset fixed value
            markPropertyAsCustomized(instanceElement, 'intervalOffsetFixedValue');
          });
        if (offsetRandomMaximumSlider) {
          offsetRandomMaximumSlider.addEventListener("input", function () {
            if (
              offsetRandomMinimumSlider &&
              parseFloat(this.value) <
                parseFloat(offsetRandomMinimumSlider.value)
            ) {
              this.value = offsetRandomMinimumSlider.value;
            }
            updateOffsetControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalOffsetSubmenu,
            );
            updateRocketIndicator(instanceElement);

            // Mark this shot as having customized the interval offset random maximum
            markPropertyAsCustomized(instanceElement, 'intervalOffsetRandomMaximum');
          });
        }
        if (offsetRandomMinimumSlider) {
          offsetRandomMinimumSlider.addEventListener("input", function () {
            if (
              offsetRandomMaximumSlider &&
              parseFloat(this.value) >
                parseFloat(offsetRandomMaximumSlider.value)
            ) {
              this.value = offsetRandomMaximumSlider.value;
            }
            updateOffsetControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalOffsetSubmenu,
            );
            updateRocketIndicator(instanceElement);

            // Mark this shot as having customized the interval offset random minimum
            markPropertyAsCustomized(instanceElement, 'intervalOffsetRandomMinimum');
          });
        }

        if (splitStepEnabledCheckbox) {
          splitStepEnabledCheckbox.addEventListener("change", function () {
            const splitStepToggleLabel = instanceElement.querySelector(
              ".split-step-toggle-label",
            );
            if (splitStepToggleLabel) {
              splitStepToggleLabel.textContent = this.checked
                ? "Enabled"
                : "Disabled";
            }
            if (splitStepRateContainer) {
              if (this.checked) {
                splitStepRateContainer.classList.remove("hidden");
              } else {
                splitStepRateContainer.classList.add("hidden");
              }
            }
            if (
              settingsPanel &&
              mainMenuContent &&
              splitStepSubmenu &&
              settingsPanel.classList.contains("active") &&
              splitStepSubmenu.classList.contains("active")
            ) {
              requestAnimationFrame(() =>
                setPanelHeight(settingsPanel, mainMenuContent),
              );
            }
            updateRocketIndicator(instanceElement);
          });
        }

        if (voiceEnabledCheckbox) {
          voiceEnabledCheckbox.addEventListener("change", function () {
            const voiceToggleLabel = instanceElement.querySelector(
              ".voice-toggle-label",
            );
            if (voiceToggleLabel) {
              voiceToggleLabel.textContent = this.checked
                ? "Enabled"
                : "Disabled";
            }
            setVoiceOptionsState(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              voiceSubmenu,
            );
            updateRocketIndicator(instanceElement);
          });
        }

        // Add event listeners for split step speed and voice rate selects
        if (splitStepSpeedSelect) {
          splitStepSpeedSelect.addEventListener("change", function () {
            updateRocketIndicator(instanceElement);

            // Mark this element as having customized the split step speed
            markPropertyAsCustomized(instanceElement, 'splitStepSpeed');
          });
        }

        if (voiceRateSelect) {
          voiceRateSelect.addEventListener("change", function () {
            updateRocketIndicator(instanceElement);

            // Mark this element as having customized the speech rate
            markPropertyAsCustomized(instanceElement, 'speechRate');
          });
        }

        if (voiceSelect) {
          voiceSelect.addEventListener("change", function () {
            updateRocketIndicator(instanceElement);

            // Mark this element as having customized the voice
            markPropertyAsCustomized(instanceElement, 'voice');
          });
        }

        // Populate voices for this shot instance
        populateVoiceSelect(voiceSelect);

        // Initial state updates for shot instances
        updateLeadTimeSlider(
          shotIntervalSlider,
          leadTimeSlider,
          leadTimeValueSpan,
        );
        updateOffsetControls(
          instanceElement,
          settingsPanel,
          mainMenuContent,
          shotIntervalOffsetSubmenu,
        );
        if (splitStepEnabledCheckbox && splitStepRateContainer) {
          if (splitStepEnabledCheckbox.checked) {
            splitStepRateContainer.classList.remove("hidden");
          } else {
            splitStepRateContainer.classList.add("hidden");
          }
        }
        setVoiceOptionsState(
          instanceElement,
          settingsPanel,
          mainMenuContent,
          voiceSubmenu,
        );
      }
    }

    // Initialize link with previous button for all shot and message instances
    if (!instanceElement.dataset.linkedWithPrevious) {
      instanceElement.dataset.linkedWithPrevious = "false";
    }
    updateLinkWithPreviousButton(instanceElement);

    // Add event listeners specific to this instance
    if (titleInput) {
      // Add auto-complete functionality for shot titles
      if (instanceType === "shot") {
        // Create datalist for auto-complete suggestions
        const suggestions = getAutoCompleteSuggestions();
        const datalistId = `shot-suggestions-${instanceElement.id}`;
        const datalist = document.createElement('datalist');
        datalist.id = datalistId;

        suggestions.forEach(suggestion => {
          const option = document.createElement('option');
          option.value = suggestion;
          datalist.appendChild(option);
        });

        // Add datalist to document if it doesn't exist
        if (!document.getElementById(datalistId)) {
          document.body.appendChild(datalist);
        }

        // Set the datalist attribute on the input
        titleInput.setAttribute('list', datalistId);
        titleInput.setAttribute('autocomplete', 'on');
      }

      titleInput.addEventListener("keydown", function (event) {
        event.stopPropagation();
      });

      titleInput.addEventListener("blur", function () {
        if (!this.value.trim()) {
          // Set appropriate default based on instance type
          this.value = instanceType === "shot" ? "Shot" : "Message";
        }
        updateRocketIndicator(instanceElement);
      });

      titleInput.addEventListener("input", function () {
        updateRocketIndicator(instanceElement);
      });
    }
    if (headerElement && titleInput) {
      headerElement.addEventListener("keydown", function (event) {
        if (
          (event.key === " " || event.key === "Enter") &&
          event.target === titleInput
        ) {
          event.preventDefault();
        }
      });
    }
  }

  /**
   * Creates a new dynamic shot or message instance.
   * @param {HTMLElement} parentPatternElement The pattern instance this shot/msg belongs to.
   * @param {string} type 'shot' or 'msg'.
   * @param {Object} [initialState] Optional state to apply to the new instance.
   */
  function createShotMsgInstance(
    parentPatternElement,
    type,
    initialState = {},
    sourceElement = null,
  ) {
    globalInstanceCounter++;

    const template =
      type === "shot" ? shotInstanceTemplate : messageInstanceTemplate;
    const newInstance = template.content.firstElementChild.cloneNode(true);
    newInstance.id = `${type}Instance_${globalInstanceCounter}`;
    newInstance.dataset.type = type;

    // Update IDs and for/id attributes to be unique within the cloned instance
    newInstance.querySelectorAll("[id]").forEach((el) => {
      const oldId = el.id;
      const newId = `${oldId}_${globalInstanceCounter}`;
      el.id = newId;
      if (el.hasAttribute("for")) {
        el.setAttribute("for", newId);
      }
    });

    // Set initial title based on type
    const titleSelector = type === "shot" ? ".shot-title" : ".message-title";
    const titleInput = newInstance.querySelector(titleSelector);
    if (titleInput) {
      titleInput.value = type === "shot" ? "New shot" : "New message";
    }

    const shotMsgInstancesContainer = parentPatternElement.querySelector(
      ".shot-msg-instances-container",
    );
    if (shotMsgInstancesContainer) {
      let insertBefore = null;
      if (sourceElement) {
        insertBefore = findCloneInsertionPosition(
          sourceElement,
          shotMsgInstancesContainer,
        );
      } else {
        // Find if there are any items locked to last position
        const existingItems = Array.from(
          shotMsgInstancesContainer.querySelectorAll(".shot-msg-instance"),
        );
        const lastLockedItem = existingItems.find(
          (item) =>
            item.dataset.positionLocked === "true" &&
            item.dataset.positionLockType === "last",
        );
        if (lastLockedItem) {
          insertBefore = lastLockedItem;
        }
      }
      if (insertBefore) {
        shotMsgInstancesContainer.insertBefore(newInstance, insertBefore);
      } else {
        shotMsgInstancesContainer.appendChild(newInstance);
      }
      initializeShotMsgInstance(newInstance, initialState);
      applyLockStateToElement(newInstance);
      newInstance.dataset.positionCycleState = "0";
      newInstance.dataset.linkedWithPrevious = "false";
      updatePositionLockButton(newInstance);
      updateLinkWithPreviousButton(newInstance);
      updateMoveButtonsState(newInstance);
      if (type === "shot") {
        updateShotLimitSlider(parentPatternElement);
      }
      updateAllPositionLockButtons();
      updateAllMoveButtonStates();
      updateRocketIndicator(newInstance);
    } else {
      console.error(
        "Shot/Message instances container not found within pattern:",
        parentPatternElement,
      );
    }
    return newInstance;
  }

  /**
   * Gets the current state of a Shot/Message instance for cloning.
   * @param {HTMLElement} instanceElement
   * @returns {Object} The state object.
   */
  function getShotMsgInstanceCurrentState(instanceElement) {
    const state = {};
    state.type = instanceElement.dataset.type;

    // Get title based on type
    const titleSelector =
      state.type === "shot" ? ".shot-title" : ".message-title";
    const titleInput = instanceElement.querySelector(titleSelector);
    if (titleInput) {
      state.title = titleInput.value;
    }

    if (state.type === "shot") {
      // Shot specific settings
      const repeatSlider = instanceElement.querySelector(".repeat-slider");
      const shotIntervalSlider = instanceElement.querySelector(
        ".shot-interval-slider",
      );
      const leadTimeSlider = instanceElement.querySelector(".lead-time-slider");
      if (repeatSlider) state.repeat = repeatSlider.value;
      if (shotIntervalSlider) state.shotInterval = shotIntervalSlider.value;
      if (leadTimeSlider) state.leadTime = leadTimeSlider.value;

      const offsetEnabledCheckbox =
        instanceElement.querySelector(".offset-enabled");
      const offsetTypeSelect = instanceElement.querySelector(".offset-type-select");
      const offsetFixedSlider =
        instanceElement.querySelector(".offset-fixed-slider");
      const offsetRandomMaximumSlider = instanceElement.querySelector(
        ".offset-random-maximum-slider",
      );
      const offsetRandomMinimumSlider = instanceElement.querySelector(
        ".offset-random-minimum-slider",
      );

      state.offset = {
        enabled: offsetEnabledCheckbox ? offsetEnabledCheckbox.checked : false,
        type: offsetTypeSelect ? offsetTypeSelect.value : "fixed",
        fixedValue: offsetFixedSlider ? offsetFixedSlider.value : "0",
        randomMaximum: offsetRandomMaximumSlider
          ? offsetRandomMaximumSlider.value
          : "0",
        randomMinimum: offsetRandomMinimumSlider
          ? offsetRandomMinimumSlider.value
          : "0",
      };

      const splitStepEnabledCheckbox = instanceElement.querySelector(
        ".split-step-enabled",
      );
      const splitStepSpeedSelect = instanceElement.querySelector(
        ".split-step-speed-select",
      );
      state.splitStep = {
        enabled: splitStepEnabledCheckbox
          ? splitStepEnabledCheckbox.checked
          : false,
        rate: splitStepSpeedSelect ? splitStepSpeedSelect.value : "auto-scale",
      };

      const voiceEnabledCheckbox =
        instanceElement.querySelector(".voice-enabled");
      const voiceSelect = instanceElement.querySelector(".voice-select");
      const voiceRateSelect =
        instanceElement.querySelector(".voice-rate-select");
      state.voice = {
        enabled: voiceEnabledCheckbox ? voiceEnabledCheckbox.checked : false,
        voiceName: voiceSelect ? voiceSelect.value : "",
        rate: voiceRateSelect ? voiceRateSelect.value : "1.0",
      };
    } else if (state.type === "msg") {
      // Message specific settings
      const messageInput = instanceElement.querySelector(".message-input");
      const messageIntervalSlider = instanceElement.querySelector(
        ".message-interval-slider",
      );
      const skipAtEndOfWorkoutCheckbox = instanceElement.querySelector(
        ".skip-at-end-of-workout",
      );
      if (messageInput) state.message = messageInput.value;
      if (messageIntervalSlider)
        state.messageInterval = messageIntervalSlider.value;
      if (skipAtEndOfWorkoutCheckbox)
        state.skipAtEndOfWorkout = skipAtEndOfWorkoutCheckbox.checked;
    }

    // Capture position lock state
    state.positionLocked = instanceElement.dataset.positionLocked === "true";
    state.positionLockType =
      instanceElement.dataset.positionLockType || "position";
    state.positionCycleState =
      parseInt(instanceElement.dataset.positionCycleState) || 0;

    // Capture link with previous state
    state.linkedWithPrevious =
      instanceElement.dataset.linkedWithPrevious === "true";

    return state;
  }

  /**
   * Initializes event listeners and states for a newly created or cloned Pattern instance.
   * @param {HTMLElement} patternElement The root element of the pattern instance.
   * @param {Object} [initialState] Optional state to apply to the instance.
   */
  function initializePatternInstance(patternElement, initialState = {}) {
    // Get elements specific to this Pattern instance
    const patternAccordionHeader = patternElement.querySelector(
      ".pattern-accordion-header",
    );
    const patternAccordionBody = patternElement.querySelector(
      ".pattern-accordion-body",
    );
    const patternAccordionArrow = patternElement.querySelector(
      ".pattern-accordion-arrow",
    );
    const patternPanelTitleInput = patternElement.querySelector(
      ".pattern-panel-title",
    );

    const patternRepeatSlider = patternElement.querySelector(".repeat-slider");
    const patternRepeatValueSpan =
      patternElement.querySelector(".repeat-value");
    const patternShotIntervalSlider = patternElement.querySelector(
      ".shot-interval-slider",
    );
    const patternShotIntervalValueSpan = patternElement.querySelector(
      ".shot-interval-value",
    );
    const patternLeadTimeSlider =
      patternElement.querySelector(".lead-time-slider");
    const patternLeadTimeValueSpan =
      patternElement.querySelector(".lead-time-value");

    const iterationTypeSelect = patternElement.querySelector(
      ".iteration-type-select",
    );
    const limitsTypeSelect = patternElement.querySelector(
      ".limits-type-select",
    );
    const shotLimitContainer = patternElement.querySelector(
      ".shot-limit-container",
    );
    const shotLimitSlider = patternElement.querySelector(".shot-limit-slider");
    const shotLimitValueSpan =
      patternElement.querySelector(".shot-limit-value");
    const timeLimitContainer = patternElement.querySelector(
      ".time-limit-container",
    );
    const timeLimitSlider = patternElement.querySelector(".time-limit-slider");
    const timeLimitValueSpan =
      patternElement.querySelector(".time-limit-value");

    const patternSettingsBtn = patternElement.querySelector(".settings-btn");
    const patternSettingsPanel =
      patternElement.querySelector(".settings-panel");
    const patternMainMenuContent =
      patternElement.querySelector(".main-menu-content");
    const patternSubmenuTriggerButtons =
      patternElement.querySelectorAll(".submenu-trigger");
    const patternBackButtons = patternElement.querySelectorAll(".back-btn");

    const patternOffsetEnabledCheckbox =
      patternElement.querySelector(".offset-enabled");
    const patternOffsetTypeSelect =
      patternElement.querySelector(".offset-type-select");
    const patternOffsetFixedSlider =
      patternElement.querySelector(".offset-fixed-slider");
    const patternOffsetRandomMaximumSlider = patternElement.querySelector(
      ".offset-random-maximum-slider",
    );
    const patternOffsetRandomMinimumSlider = patternElement.querySelector(
      ".offset-random-minimum-slider",
    );
    const patternIntervalOffsetSubmenu = patternElement.querySelector(
      ".shot-interval-offset-submenu",
    );

    const patternSplitStepEnabledCheckbox = patternElement.querySelector(
      ".split-step-enabled",
    );
    const patternSplitStepRateContainer = patternElement.querySelector(
      ".split-step-rate-container",
    );
    const patternSplitStepSpeedSelect = patternElement.querySelector(
      ".split-step-speed-select",
    );
    const patternSplitStepSubmenu = patternElement.querySelector(
      ".split-step-submenu",
    );

    const patternVoiceEnabledCheckbox =
      patternElement.querySelector(".voice-enabled");
    const patternVoiceSelect = patternElement.querySelector(".voice-select");
    const patternVoiceRateSelect =
      patternElement.querySelector(".voice-rate-select");
    const patternVoiceOptionsContainer = patternElement.querySelector(
      ".voice-options-container",
    );
    const patternVoiceSubmenu = patternElement.querySelector(".voice-submenu");

    const addShotBtn = patternElement.querySelector(".add-shot-btn");
    const addMsgBtn = patternElement.querySelector(".add-msg-btn");
    const shotMsgInstancesContainer = patternElement.querySelector(
      ".shot-msg-instances-container",
    );
    const patternPositionLockBtn =
      patternElement.querySelector(".position-lock-btn");

    // Apply initial state if provided (for cloning)
    if (Object.keys(initialState).length > 0) {
      if (initialState.title) patternPanelTitleInput.value = initialState.title;
      if (patternRepeatSlider)
        patternRepeatSlider.value =
          initialState.repeat || patternRepeatSlider.value;
      if (patternShotIntervalSlider)
        patternShotIntervalSlider.value =
          initialState.shotInterval || patternShotIntervalSlider.value;
      if (patternLeadTimeSlider)
        patternLeadTimeSlider.value =
          initialState.leadTime || patternLeadTimeSlider.value;

      if (iterationTypeSelect)
        iterationTypeSelect.value =
          initialState.iterationType || iterationTypeSelect.value;
      if (limitsTypeSelect)
        limitsTypeSelect.value =
          initialState.limitsType || limitsTypeSelect.value;
      if (shotLimitSlider)
        shotLimitSlider.value = initialState.shotLimit || shotLimitSlider.value;
      if (timeLimitSlider)
        timeLimitSlider.value = initialState.timeLimit || timeLimitSlider.value;

      if (initialState.offset) {
        if (patternOffsetEnabledCheckbox)
          patternOffsetEnabledCheckbox.checked = initialState.offset.enabled;
        if (patternOffsetTypeSelect)
          patternOffsetTypeSelect.value = initialState.offset.type;
        if (patternOffsetFixedSlider)
          patternOffsetFixedSlider.value = initialState.offset.fixedValue;
        if (patternOffsetRandomMaximumSlider)
          patternOffsetRandomMaximumSlider.value =
            initialState.offset.randomMaximum;
        if (patternOffsetRandomMinimumSlider)
          patternOffsetRandomMinimumSlider.value =
            initialState.offset.randomMinimum;
      }
      if (initialState.splitStep) {
        if (patternSplitStepEnabledCheckbox)
          patternSplitStepEnabledCheckbox.checked =
            initialState.splitStep.enabled;
        if (patternSplitStepSpeedSelect)
          patternSplitStepSpeedSelect.value = initialState.splitStep.rate;
      }
      if (initialState.voice) {
        if (patternVoiceEnabledCheckbox)
          patternVoiceEnabledCheckbox.checked = initialState.voice.enabled;
        if (patternVoiceRateSelect)
          patternVoiceRateSelect.value = initialState.voice.rate;
      }

      // Recreate nested Shot/Message instances
      if (initialState.shotsAndMessages && shotMsgInstancesContainer) {
        initialState.shotsAndMessages.forEach((shotMsgState) => {
          createShotMsgInstance(
            patternElement,
            shotMsgState.type,
            shotMsgState,
          );
        });
      }

      // Set position lock state if provided
      if (initialState.positionLocked !== undefined) {
        patternElement.dataset.positionLocked = initialState.positionLocked;
      }
      if (initialState.positionLockType !== undefined) {
        patternElement.dataset.positionLockType = initialState.positionLockType;
      }
      if (initialState.positionCycleState !== undefined) {
        patternElement.dataset.positionCycleState =
          initialState.positionCycleState;
      }

      // Set link with previous state if provided
      if (initialState.linkedWithPrevious !== undefined) {
        patternElement.dataset.linkedWithPrevious =
          initialState.linkedWithPrevious;
      }
    }

    // Initial updates for current pattern instance
    if (patternRepeatSlider && patternRepeatValueSpan)
      patternRepeatValueSpan.textContent = `${patternRepeatSlider.value}x`;
    if (patternShotIntervalSlider && patternShotIntervalValueSpan)
      patternShotIntervalValueSpan.textContent = `${parseFloat(patternShotIntervalSlider.value).toFixed(1)}s`;

    // Initialize shot limit default value based on current shots
    if (shotLimitSlider && shotLimitValueSpan) {
      const currentShotCount =
        patternElement.querySelectorAll(".shot-instance").length;
      if (currentShotCount > 0) {
        shotLimitSlider.value = currentShotCount;
        shotLimitSlider.max = Math.max(50, currentShotCount);
      }
      shotLimitValueSpan.textContent = shotLimitSlider.value;
    }

    // Initialize time limit display
    if (timeLimitSlider && timeLimitValueSpan) {
      const totalSeconds = parseInt(timeLimitSlider.value);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
      timeLimitValueSpan.textContent = `${minutes}:${formattedSeconds}`;
    }

    // Initialize limits container visibility
    if (limitsTypeSelect && shotLimitContainer && timeLimitContainer) {
      const limitsType = limitsTypeSelect.value;
      if (limitsType === "shot-limit") {
        shotLimitContainer.classList.remove("hidden");
        timeLimitContainer.classList.add("hidden");
      } else if (limitsType === "time-limit") {
        timeLimitContainer.classList.remove("hidden");
        shotLimitContainer.classList.add("hidden");
      } else {
        shotLimitContainer.classList.add("hidden");
        timeLimitContainer.classList.add("hidden");
      }
    }

    // Add event listeners specific to this pattern instance
    if (patternAccordionHeader) {
      patternAccordionHeader.addEventListener("click", function (event) {
        if (
          event.target !== patternPanelTitleInput &&
          patternAccordionBody &&
          patternAccordionArrow
        ) {
          patternAccordionBody.classList.toggle("hidden");
          patternAccordionArrow.classList.toggle("rotate-180");
        }
      });
      patternAccordionHeader.addEventListener("keydown", function (event) {
        if (
          (event.key === " " || event.key === "Enter") &&
          event.target !== patternPanelTitleInput
        ) {
          event.preventDefault();
          if (patternAccordionBody && patternAccordionArrow) {
            patternAccordionBody.classList.toggle("hidden");
            patternAccordionArrow.classList.toggle("rotate-180");
          }
        }
      });
    }

    if (patternRepeatSlider)
      patternRepeatSlider.addEventListener("input", function () {
        if (patternRepeatValueSpan)
          patternRepeatValueSpan.textContent = `${this.value}x`;
        updateRocketIndicator(patternElement);
      });

    if (patternShotIntervalSlider)
      patternShotIntervalSlider.addEventListener("input", function () {
        const newValue = this.value;
        const oldValue = patternShotIntervalValueSpan ? patternShotIntervalValueSpan.textContent.replace('s', '') : '5.0';

        if (patternShotIntervalValueSpan)
          patternShotIntervalValueSpan.textContent = `${parseFloat(newValue).toFixed(1)}s`;
        updateLeadTimeSlider(
          patternShotIntervalSlider,
          patternLeadTimeSlider,
          patternLeadTimeValueSpan,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the interval
        markPropertyAsCustomized(patternElement, 'interval');

        // Trigger hierarchical propagation to child shots/messages (debounced for sliders)
        debouncedHierarchicalSettingChange(patternElement, 'interval', newValue, oldValue, this);
      });

    if (patternLeadTimeSlider)
      patternLeadTimeSlider.addEventListener("input", function () {
        const newValue = this.value;
        const oldValue = patternLeadTimeValueSpan ? patternLeadTimeValueSpan.textContent.replace('s', '') : '2.5';

        updateLeadTimeSlider(
          patternShotIntervalSlider,
          patternLeadTimeSlider,
          patternLeadTimeValueSpan,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the lead time
        markPropertyAsCustomized(patternElement, 'shotAnnouncementLeadTime');

        // Trigger hierarchical propagation to child shots/messages (debounced for sliders)
        debouncedHierarchicalSettingChange(patternElement, 'shotAnnouncementLeadTime', newValue, oldValue, this);
      });

    // Event listeners for new pattern configuration options
    if (limitsTypeSelect) {
      limitsTypeSelect.addEventListener("change", function () {
        const limitsType = this.value;
        if (limitsType === "shot-limit") {
          if (shotLimitContainer) shotLimitContainer.classList.remove("hidden");
          if (timeLimitContainer) timeLimitContainer.classList.add("hidden");
        } else if (limitsType === "time-limit") {
          if (timeLimitContainer) timeLimitContainer.classList.remove("hidden");
          if (shotLimitContainer) shotLimitContainer.classList.add("hidden");
        } else {
          if (shotLimitContainer) shotLimitContainer.classList.add("hidden");
          if (timeLimitContainer) timeLimitContainer.classList.add("hidden");
        }
        updateRocketIndicator(patternElement);
      });
    }

    if (shotLimitSlider) {
      shotLimitSlider.addEventListener("input", function () {
        if (shotLimitValueSpan) shotLimitValueSpan.textContent = this.value;
        updateRocketIndicator(patternElement);
      });
    }

    if (timeLimitSlider) {
      timeLimitSlider.addEventListener("input", function () {
        const totalSeconds = parseInt(this.value);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
        if (timeLimitValueSpan)
          timeLimitValueSpan.textContent = `${minutes}:${formattedSeconds}`;
        updateRocketIndicator(patternElement);
      });
    }

    if (patternSettingsBtn) {
      patternSettingsBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleSettingsDropdown(patternSettingsPanel, patternMainMenuContent);
      });
    }



    patternSubmenuTriggerButtons.forEach((button) => {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        if (!this.disabled) {
          const targetSubmenuClass = this.dataset.targetSubmenuClass;
          showSettingsSubmenu(
            patternSettingsPanel,
            patternMainMenuContent,
            targetSubmenuClass,
          );
        }
      });
    });

    patternBackButtons.forEach((button) => {
      button.addEventListener("click", function (event) {
        event.stopPropagation();
        showSettingsMainMenu(patternSettingsPanel, patternMainMenuContent);
      });
    });

    if (patternOffsetEnabledCheckbox)
      patternOffsetEnabledCheckbox.addEventListener("change", function () {
        const newValue = this.checked;
        const oldValue = !newValue; // Previous value was the opposite

        updateOffsetControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalOffsetSubmenu,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the interval offset enabled setting
        markPropertyAsCustomized(patternElement, 'intervalOffsetEnabled');

        // Trigger hierarchical propagation to child shots/messages
        handleHierarchicalSettingChange(patternElement, 'intervalOffsetEnabled', newValue, oldValue, this);
      });
    if (patternOffsetTypeSelect) {
      let previousPatternOffsetType = patternOffsetTypeSelect.value; // Store initial value
             patternOffsetTypeSelect.addEventListener("change", function() {
         const newValue = this.value;
         const oldValue = previousPatternOffsetType;

         updateOffsetControls(
           patternElement,
           patternSettingsPanel,
           patternMainMenuContent,
           patternIntervalOffsetSubmenu,
         );
         updateRocketIndicator(patternElement);

         // Mark this pattern as having customized the interval offset type
         markPropertyAsCustomized(patternElement, 'intervalOffsetType');

         // Only trigger propagation if offset is enabled (check effective value including inheritance)
         const effectiveOffsetEnabled = getEffectiveValueForProperty(patternElement, 'intervalOffsetEnabled');
         if (effectiveOffsetEnabled) {
           handleHierarchicalSettingChange(patternElement, 'intervalOffsetType', newValue, oldValue, this);
         }

         previousPatternOffsetType = newValue; // Update stored value
       });
    }
    if (patternOffsetFixedSlider)
      patternOffsetFixedSlider.addEventListener("input", function () {
        const newValue = this.value;
        const oldValue = "0"; // We can't easily track the old value for sliders, so use default

        updateOffsetControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalOffsetSubmenu,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the interval offset fixed value
        markPropertyAsCustomized(patternElement, 'intervalOffsetFixedValue');

        // Only trigger propagation if offset is enabled (check effective value including inheritance)
        const effectiveOffsetEnabled = getEffectiveValueForProperty(patternElement, 'intervalOffsetEnabled');
        if (effectiveOffsetEnabled) {
          debouncedHierarchicalSettingChange(patternElement, 'intervalOffsetFixedValue', newValue, oldValue, this);
        }
      });
    if (patternOffsetRandomMaximumSlider) {
      patternOffsetRandomMaximumSlider.addEventListener("input", function () {
        if (
          patternOffsetRandomMinimumSlider &&
          parseFloat(this.value) <
            parseFloat(patternOffsetRandomMinimumSlider.value)
        ) {
          this.value = patternOffsetRandomMinimumSlider.value;
        }

        const newValue = this.value;
        const oldValue = "0"; // We can't easily track the old value for sliders, so use default

        updateOffsetControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalOffsetSubmenu,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the interval offset random maximum
        markPropertyAsCustomized(patternElement, 'intervalOffsetRandomMaximum');

        // Only trigger propagation if offset is enabled (check effective value including inheritance)
        const effectiveOffsetEnabled = getEffectiveValueForProperty(patternElement, 'intervalOffsetEnabled');
        if (effectiveOffsetEnabled) {
          debouncedHierarchicalSettingChange(patternElement, 'intervalOffsetRandomMaximum', newValue, oldValue, this);
        }
      });
    }
    if (patternOffsetRandomMinimumSlider) {
      patternOffsetRandomMinimumSlider.addEventListener("input", function () {
        if (
          patternOffsetRandomMaximumSlider &&
          parseFloat(this.value) >
            parseFloat(patternOffsetRandomMaximumSlider.value)
        ) {
          this.value = patternOffsetRandomMaximumSlider.value;
        }

        const newValue = this.value;
        const oldValue = "0"; // We can't easily track the old value for sliders, so use default

        updateOffsetControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalOffsetSubmenu,
        );
        updateRocketIndicator(patternElement);

        // Mark this pattern as having customized the interval offset random minimum
        markPropertyAsCustomized(patternElement, 'intervalOffsetRandomMinimum');

        // Only trigger propagation if offset is enabled (check effective value including inheritance)
        const effectiveOffsetEnabled = getEffectiveValueForProperty(patternElement, 'intervalOffsetEnabled');
        if (effectiveOffsetEnabled) {
          debouncedHierarchicalSettingChange(patternElement, 'intervalOffsetRandomMinimum', newValue, oldValue, this);
        }
      });
    }

    if (patternSplitStepEnabledCheckbox) {
      patternSplitStepEnabledCheckbox.addEventListener("change", function () {
        const patternSplitStepToggleLabel = patternElement.querySelector(
          ".split-step-toggle-label",
        );
        if (patternSplitStepToggleLabel) {
          patternSplitStepToggleLabel.textContent = this.checked
            ? "Enabled"
            : "Disabled";
        }
        if (patternSplitStepRateContainer) {
          if (this.checked) {
            patternSplitStepRateContainer.classList.remove("hidden");
          } else {
            patternSplitStepRateContainer.classList.add("hidden");
          }
        }
        if (
          patternSettingsPanel &&
          patternMainMenuContent &&
          patternSplitStepSubmenu &&
          patternSettingsPanel.classList.contains("active") &&
          patternSplitStepSubmenu.classList.contains("active")
        ) {
          requestAnimationFrame(() =>
            setPanelHeight(patternSettingsPanel, patternMainMenuContent),
          );
        }
        updateRocketIndicator(patternElement);
      });
    }

    if (patternVoiceEnabledCheckbox) {
      patternVoiceEnabledCheckbox.addEventListener("change", function () {
        const patternVoiceToggleLabel = patternElement.querySelector(
          ".voice-toggle-label",
        );
        if (patternVoiceToggleLabel) {
          patternVoiceToggleLabel.textContent = this.checked
            ? "Enabled"
            : "Disabled";
        }
        setVoiceOptionsState(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternVoiceSubmenu,
        );
        updateRocketIndicator(patternElement);
      });
    }

    // Add event listeners for pattern split step speed and voice rate selects
    if (patternSplitStepSpeedSelect) {
      let previousPatternSplitStepSpeed = patternSplitStepSpeedSelect.value; // Store initial value
             patternSplitStepSpeedSelect.addEventListener("change", function () {
         const newValue = this.value;
         const oldValue = previousPatternSplitStepSpeed;

         updateRocketIndicator(patternElement);

         // Mark this pattern as having customized the split step speed
         markPropertyAsCustomized(patternElement, 'splitStepSpeed');

         // Only trigger propagation if split step is enabled
         const patternSplitStepEnabled = patternElement.querySelector('.split-step-enabled');
         if (patternSplitStepEnabled && patternSplitStepEnabled.checked) {
           handleHierarchicalSettingChange(patternElement, 'splitStepSpeed', newValue, oldValue, this);
         }

         previousPatternSplitStepSpeed = newValue; // Update stored value
       });
    }

    if (patternVoiceRateSelect) {
      let previousPatternVoiceRate = patternVoiceRateSelect.value; // Store initial value
             patternVoiceRateSelect.addEventListener("change", function () {
         const newValue = this.value;
         const oldValue = previousPatternVoiceRate;

         updateRocketIndicator(patternElement);

         // Mark this pattern as having customized the speech rate
         markPropertyAsCustomized(patternElement, 'speechRate');

         // Only trigger propagation if voice is enabled
         const patternVoiceEnabled = patternElement.querySelector('.voice-enabled');
         if (patternVoiceEnabled && patternVoiceEnabled.checked) {
           handleHierarchicalSettingChange(patternElement, 'speechRate', newValue, oldValue, this);
         }

         previousPatternVoiceRate = newValue; // Update stored value
       });
    }

    if (patternVoiceSelect) {
      let previousPatternVoice = patternVoiceSelect.value; // Store initial value
             patternVoiceSelect.addEventListener("change", function () {
         const newValue = this.value;
         const oldValue = previousPatternVoice;

         updateRocketIndicator(patternElement);

         // Mark this pattern as having customized the voice
         markPropertyAsCustomized(patternElement, 'voice');

         // Only trigger propagation if voice is enabled
         const patternVoiceEnabled = patternElement.querySelector('.voice-enabled');
         if (patternVoiceEnabled && patternVoiceEnabled.checked) {
           handleHierarchicalSettingChange(patternElement, 'voice', newValue, oldValue, this);
         }

         previousPatternVoice = newValue; // Update stored value
       });
    }

    // Populate voices for this pattern's voice select
    populateVoiceSelect(patternVoiceSelect);

    // Initial state updates for pattern's own settings
    updateLeadTimeSlider(
      patternShotIntervalSlider,
      patternLeadTimeSlider,
      patternLeadTimeValueSpan,
    );
    updateOffsetControls(
      patternElement,
      patternSettingsPanel,
      patternMainMenuContent,
      patternIntervalOffsetSubmenu,
    );
    if (patternSplitStepEnabledCheckbox && patternSplitStepRateContainer) {
      if (patternSplitStepEnabledCheckbox.checked) {
        patternSplitStepRateContainer.classList.remove("hidden");
      } else {
        patternSplitStepRateContainer.classList.add("hidden");
      }
    }
    setVoiceOptionsState(
      patternElement,
      patternSettingsPanel,
      patternMainMenuContent,
      patternVoiceSubmenu,
    );

    // Add Shot/Message buttons for this pattern
    if (addShotBtn)
      addShotBtn.addEventListener("click", () =>
        createShotMsgInstance(patternElement, "shot"),
      );
    if (addMsgBtn)
      addMsgBtn.addEventListener("click", () =>
        createShotMsgInstance(patternElement, "msg"),
      );

    // Position lock button for this pattern
    if (patternPositionLockBtn) {
      patternPositionLockBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        togglePositionLock(patternElement);
      });
    }

    // Link with previous button for this pattern
    const patternLinkWithPreviousBtn = patternElement.querySelector(
      ".link-with-previous-btn",
    );
    if (patternLinkWithPreviousBtn) {
      patternLinkWithPreviousBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleLinkWithPrevious(patternElement);
      });
    }

    // Initialize link with previous state for patterns
    if (!patternElement.dataset.linkedWithPrevious) {
      patternElement.dataset.linkedWithPrevious = "false";
    }
    updateLinkWithPreviousButton(patternElement);

    // Ensure pattern has at least one shot or message (for cloned patterns with no content)
    const existingShotsMsgs =
      patternElement.querySelectorAll(".shot-msg-instance").length;
    if (existingShotsMsgs === 0) {
      createShotMsgInstance(patternElement, "shot");
    }

    // Add event listeners specific to this pattern instance
    if (patternPanelTitleInput) {
      patternPanelTitleInput.addEventListener("keydown", function (event) {
        event.stopPropagation();
      });

      patternPanelTitleInput.addEventListener("blur", function () {
        if (!this.value.trim()) {
          this.value = "Pattern";
        }
        updateRocketIndicator(patternElement);
      });

      patternPanelTitleInput.addEventListener("input", function () {
        updateRocketIndicator(patternElement);
      });
    }
    if (patternAccordionHeader && patternPanelTitleInput) {
      patternAccordionHeader.addEventListener("keydown", function (event) {
        if (
          (event.key === " " || event.key === "Enter") &&
          event.target === patternPanelTitleInput
        ) {
          event.preventDefault();
        }
      });
    }

    // Note: per-pattern add buttons removed - using global add pattern button instead
  }

  /**
   * Gets the current state of a Pattern instance for cloning.
   * @param {HTMLElement} patternElement
   * @returns {Object} The state object.
   */
  function getPatternInstanceCurrentState(patternElement) {
    const state = {};
    state.type = "pattern"; // Explicitly set type for pattern
    state.title = patternElement.querySelector(".pattern-panel-title").value;

    // Pattern specific settings
    const repeatSlider = patternElement.querySelector(".repeat-slider");
    const shotIntervalSlider = patternElement.querySelector(
      ".shot-interval-slider",
    );
    const leadTimeSlider = patternElement.querySelector(".lead-time-slider");
    const iterationTypeSelect = patternElement.querySelector(
      ".iteration-type-select",
    );
    const limitsTypeSelect = patternElement.querySelector(
      ".limits-type-select",
    );
    const shotLimitSlider = patternElement.querySelector(".shot-limit-slider");
    const timeLimitSlider = patternElement.querySelector(".time-limit-slider");

    if (repeatSlider) state.repeat = repeatSlider.value;
    if (shotIntervalSlider) state.shotInterval = shotIntervalSlider.value;
    if (leadTimeSlider) state.leadTime = leadTimeSlider.value;
    if (iterationTypeSelect) state.iterationType = iterationTypeSelect.value;
    if (limitsTypeSelect) state.limitsType = limitsTypeSelect.value;
    if (shotLimitSlider) state.shotLimit = shotLimitSlider.value;
    if (timeLimitSlider) state.timeLimit = timeLimitSlider.value;

    const offsetEnabledCheckbox = patternElement.querySelector(".offset-enabled");
    const offsetTypeSelect = patternElement.querySelector(".offset-type-select");
    const offsetFixedSlider = patternElement.querySelector(".offset-fixed-slider");
    const offsetRandomMaximumSlider = patternElement.querySelector(
      ".offset-random-maximum-slider",
    );
    const offsetRandomMinimumSlider = patternElement.querySelector(
      ".offset-random-minimum-slider",
    );

    state.offset = {
      enabled: offsetEnabledCheckbox ? offsetEnabledCheckbox.checked : false,
      type: offsetTypeSelect ? offsetTypeSelect.value : "fixed",
      fixedValue: offsetFixedSlider ? offsetFixedSlider.value : "0",
      randomMaximum: offsetRandomMaximumSlider
        ? offsetRandomMaximumSlider.value
        : "0",
      randomMinimum: offsetRandomMinimumSlider
        ? offsetRandomMinimumSlider.value
        : "0",
    };

    const splitStepEnabledCheckbox = patternElement.querySelector(
      ".split-step-enabled",
    );
    const splitStepSpeedSelect = patternElement.querySelector(
      ".split-step-speed-select",
    );
    state.splitStep = {
      enabled: splitStepEnabledCheckbox
        ? splitStepEnabledCheckbox.checked
        : false,
      rate: splitStepSpeedSelect ? splitStepSpeedSelect.value : "auto-scale",
    };

    const voiceEnabledCheckbox = patternElement.querySelector(".voice-enabled");
    const voiceSelect = patternElement.querySelector(".voice-select");
    const voiceRateSelect = patternElement.querySelector(".voice-rate-select");
    state.voice = {
      enabled: voiceEnabledCheckbox ? voiceEnabledCheckbox.checked : false,
      voiceName: voiceSelect ? voiceSelect.value : "",
      rate: voiceRateSelect ? voiceRateSelect.value : "1.0",
    };

    // Get state of all nested Shot/Message instances
    state.shotsAndMessages = [];
    patternElement
      .querySelectorAll(".shot-msg-instance")
      .forEach((shotMsgInstance) => {
        state.shotsAndMessages.push(
          getShotMsgInstanceCurrentState(shotMsgInstance),
        );
      });

    // Capture position lock state
    state.positionLocked = patternElement.dataset.positionLocked === "true";
    state.positionLockType =
      patternElement.dataset.positionLockType || "position";
    state.positionCycleState =
      parseInt(patternElement.dataset.positionCycleState) || 0;

    // Capture link with previous state
    state.linkedWithPrevious =
      patternElement.dataset.linkedWithPrevious === "true";

    return state;
  }

  /**
   * Positions the add pattern button after the last pattern in the container.
   */
  function positionAddPatternButton() {
    const addPatternContainer = document.getElementById('addPatternContainer');
    const patterns = mainContainer.querySelectorAll('.pattern-instance');

    if (addPatternContainer && patterns.length > 0) {
      // Get the last pattern
      const lastPattern = patterns[patterns.length - 1];
      // Insert the add pattern container after the last pattern
      lastPattern.insertAdjacentElement('afterend', addPatternContainer);
    } else if (addPatternContainer) {
      // If no patterns exist, keep it in its default position in mainContainer
      mainContainer.appendChild(addPatternContainer);
    }
  }

  /**
   * Creates a new dynamic Pattern instance.
   * @param {Object} [initialState] Optional state to apply to the new instance.
   */
  function createPatternInstance(initialState = {}) {
    globalInstanceCounter++;
    const newInstance =
      patternInstanceTemplate.content.firstElementChild.cloneNode(true);
    newInstance.id = `patternInstance_${globalInstanceCounter}`;
    newInstance.dataset.type = "pattern"; // Set data-type for patterns

    // Update IDs and for/id attributes to be unique within the cloned instance
    newInstance.querySelectorAll("[id]").forEach((el) => {
      const oldId = el.id;
      const newId = `${oldId}_${globalInstanceCounter}`;
      el.id = newId;
      if (el.hasAttribute("for")) {
        el.setAttribute("for", newId);
      }
    });

    // No longer need to update pattern tab buttons since they were removed

    // Set initial title based on type
    const titleInput = newInstance.querySelector(".pattern-panel-title");
    titleInput.value = "New pattern";

    // Find the correct insertion position using shared logic
    const existingPatterns = Array.from(
      mainContainer.querySelectorAll(".pattern-instance"),
    );

    // Use the shared pattern insertion logic
    const insertBeforeElement = WorkoutLib.findPatternInsertionPositionShared(existingPatterns, {
      isLocked: (pattern) => pattern.dataset.positionLocked === "true",
      getLockType: (pattern) => pattern.dataset.positionLockType
    });

    if (insertBeforeElement) {
      // Insert before the specified element
      mainContainer.insertBefore(newInstance, insertBeforeElement);
    } else {
      // No specific insertion point, append at the end
      mainContainer.appendChild(newInstance);
    }
    initializePatternInstance(newInstance, initialState);

    // Apply lock state to new pattern
    applyLockStateToElement(newInstance);

    // Initialize position lock button and link with previous button
    newInstance.dataset.positionCycleState = "0";

    // Position the add pattern button after the last pattern
    positionAddPatternButton(); // Initialize cycle state
    newInstance.dataset.linkedWithPrevious = "false"; // Initialize link state
    updatePositionLockButton(newInstance);
    updateLinkWithPreviousButton(newInstance);
    updateMoveButtonsState(newInstance);

    // Update all position lock buttons since a new pattern was added
    updateAllPositionLockButtons();
    updateAllMoveButtonStates();
    updateRocketIndicator(newInstance);

    return newInstance;
  }

  // --- Event Delegation for Dynamic Pattern Instances ---
  if (mainContainer) {
    mainContainer.addEventListener("click", function (event) {
      const target = event.target;
      const patternElement = target.closest(".pattern-instance");

      if (!patternElement) return; // Not a click within a pattern instance

      if (target.closest(".pattern-delete-btn")) {
        // Show confirmation modal
        if (deleteModal && deleteModalTitle) {
          deleteModalTitle.textContent = "Delete Pattern";
          deleteModal.classList.remove("hidden");
          // Store the pattern element to be deleted
          deleteModal.dataset.elementToDelete = patternElement.id;
          deleteModal.dataset.deleteType = "pattern";
        }
      } else if (target.closest(".pattern-minimize-btn")) {
        const minimizeBtn = target.closest(".pattern-minimize-btn");
        const minimizeIcon = minimizeBtn.querySelector(".pattern-minimize-icon");
        const expandIcon = minimizeBtn.querySelector(".pattern-expand-icon");
        const shotMsgInstances = patternElement.querySelectorAll(".shot-msg-instance");

        // Toggle between minimize and expand states
        if (minimizeIcon && !minimizeIcon.classList.contains("hidden")) {
          // Currently minimized, switch to expand
          minimizeIcon.classList.add("hidden");
          expandIcon.classList.remove("hidden");
          minimizeBtn.title = "Expand";

          // Hide all shot/message accordion bodies in this pattern
          shotMsgInstances.forEach(instance => {
            const body = instance.querySelector(".shot-body, .message-body");
            if (body) {
              body.classList.add("hidden");
            }
            // Also hide the arrow to indicate collapsed state
            const arrow = instance.querySelector(".shot-arrow, .message-arrow");
            if (arrow) {
              arrow.classList.remove("rotate-180");
            }
          });
        } else {
          // Currently expanded, switch to minimize
          minimizeIcon.classList.remove("hidden");
          expandIcon.classList.add("hidden");
          minimizeBtn.title = "Minimize";

          // Show all shot/message accordion bodies in this pattern
          shotMsgInstances.forEach(instance => {
            const body = instance.querySelector(".shot-body, .message-body");
            if (body) {
              body.classList.remove("hidden");
            }
            // Also show the arrow to indicate expanded state
            const arrow = instance.querySelector(".shot-arrow, .message-arrow");
            if (arrow) {
              arrow.classList.add("rotate-180");
            }
          });
        }
      } else if (target.closest(".pattern-clone-btn")) {
        const currentState = getPatternInstanceCurrentState(patternElement);
        createPatternInstance(currentState);
      } else if (target.closest(".pattern-move-up-btn")) {
        const moveUpBtn = target.closest(".pattern-move-up-btn");
        if (!moveUpBtn.disabled) {
          const swapTarget = findSwapTarget(patternElement, 'up', mainContainer);
          if (swapTarget) {
            swapElements(patternElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
            positionAddPatternButton();
            moveUpBtn.focus(); // Re-focus

            // Scroll the moved pattern to center and highlight it after a brief delay
            setTimeout(() => {
              scrollElementToCenter(patternElement);
              highlightMovedElement(patternElement);
            }, 100);
          }
        }
      } else if (target.closest(".pattern-move-down-btn")) {
        const moveDownBtn = target.closest(".pattern-move-down-btn");
        if (!moveDownBtn.disabled) {
          const swapTarget = findSwapTarget(patternElement, 'down', mainContainer);
          if (swapTarget) {
            swapElements(patternElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
            positionAddPatternButton();
            moveDownBtn.focus(); // Re-focus

            // Scroll the moved pattern to center and highlight it after a brief delay
            setTimeout(() => {
              scrollElementToCenter(patternElement);
              highlightMovedElement(patternElement);
            }, 100);
          }
        }
      }
    });
  } else {
    console.error("mainContainer not found.");
  }

  // --- Event Delegation for Dynamic Shot/Message Instances (within Patterns) ---
  // This listener must be on mainContainer as well to catch clicks on dynamically added elements
  if (mainContainer) {
    mainContainer.addEventListener("click", function (event) {
      const target = event.target;
      const shotMsgInstanceElement = target.closest(".shot-msg-instance");

      if (!shotMsgInstanceElement) return; // Not a click within a shot/msg instance

      const shotMsgInstancesContainer = shotMsgInstanceElement.parentElement;

      if (target.closest(".delete-btn")) {
        const parentPatternElement =
          shotMsgInstanceElement.closest(".pattern-instance");
        const isShot =
          shotMsgInstanceElement.classList.contains("shot-instance");

        // Show confirmation modal
        if (deleteModal && deleteModalTitle) {
          const title = isShot ? "Delete Shot" : "Delete Message";
          deleteModalTitle.textContent = title;
          deleteModal.classList.remove("hidden");
          deleteModal.dataset.elementToDelete = shotMsgInstanceElement.id;
          deleteModal.dataset.deleteType = isShot ? "shot" : "message";
        }
      } else if (target.closest(".clone-btn")) {
        const parentPatternElement =
          shotMsgInstanceElement.closest(".pattern-instance");
        const currentState = getShotMsgInstanceCurrentState(
          shotMsgInstanceElement,
        );
        createShotMsgInstance(
          parentPatternElement,
          currentState.type,
          currentState,
        );
      } else if (target.closest(".move-up-btn")) {
        const moveUpBtn = target.closest(".move-up-btn");
        if (!moveUpBtn.disabled) {
          const swapTarget = findSwapTarget(
            shotMsgInstanceElement,
            'up',
            mainContainer,
          );
          if (swapTarget) {
            swapElements(shotMsgInstanceElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
            moveUpBtn.focus(); // Re-focus

            // Scroll the moved element to center after a brief delay
            setTimeout(() => {
              scrollElementToCenter(shotMsgInstanceElement);
            }, 100);
          }
        }
      } else if (target.closest(".move-down-btn")) {
        const moveDownBtn = target.closest(".move-down-btn");
        if (!moveDownBtn.disabled) {
          const swapTarget = findSwapTarget(
            shotMsgInstanceElement,
            'down',
            mainContainer,
          );
          if (swapTarget) {
            swapElements(shotMsgInstanceElement, swapTarget);
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
            moveDownBtn.focus(); // Re-focus

            // Scroll the moved element to center after a brief delay
            setTimeout(() => {
              scrollElementToCenter(shotMsgInstanceElement);
            }, 100);
          }
        }
      }
    });
  } else {
    console.error("mainContainer not found for shot/msg delegation.");
  }

  // --- Add Pattern Button ---
  if (addPatternBtn) {
    addPatternBtn.addEventListener("click", () => createPatternInstance());
  } else {
    console.error("addPatternBtn not found.");
  }

  // Note: Save and Load functionality now handled by top-left toolbar

  if (workoutFileInput) {
    workoutFileInput.addEventListener("change", handleFileLoad);
  } else {
    console.error("workoutFileInput not found.");
  }

  // --- Preview Modal Elements ---
  const previewModal = document.getElementById("previewModal");
  const closePreviewBtn = document.getElementById("closePreviewBtn");
  const previewContent = document.getElementById("previewContent");
  const playPauseBtn = document.getElementById("playPauseBtn");

  // Note: Preview functionality now handled by top-left toolbar

  if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", function () {
      previewModal.classList.add("hidden");
      // Stop timeline playback and reset when closing
      if (timelinePlayback.isPlaying) {
        pauseTimeline();
      }
      // Reset timeline to beginning
      timelinePlayback.currentTime = 0;
      timelinePlayback.playedSounds.clear();
      // Cancel any ongoing TTS when closing
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        timelinePlayback.activeTTSUtterances.clear();
      }
      clearTimelineHighlights();
    });
  } else {
    console.error("closePreviewBtn not found.");
  }

  if (playPauseBtn) {
    playPauseBtn.addEventListener("click", togglePlayPause);
  } else {
    console.error("playPauseBtn not found.");
  }

  // Present button functionality
  const presentBtn = document.getElementById("presentBtn");
  if (presentBtn) {
    presentBtn.addEventListener("click", presentAtCurrentTime);
  } else {
    console.error("presentBtn not found.");
  }

  if (previewModal) {
    previewModal.addEventListener("click", function (e) {
      if (e.target === previewModal) {
        previewModal.classList.add("hidden");
        // Stop timeline playback and reset when closing
        if (timelinePlayback.isPlaying) {
          pauseTimeline();
        }
        // Reset timeline to beginning
        timelinePlayback.currentTime = 0;
        timelinePlayback.playedSounds.clear();
        // Cancel any ongoing TTS when closing
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
          timelinePlayback.activeTTSUtterances.clear();
        }
        clearTimelineHighlights();
      }
    });
  } else {
    console.error("previewModal not found.");
  }

  // --- Workout Modal Elements ---
  const workoutModal = document.getElementById("workoutModal");
  const closeWorkoutBtn = document.getElementById("closeWorkoutBtn");
  const workoutStartBtn = document.getElementById("workoutStartBtn");
  const workoutPauseBtn = document.getElementById("workoutPauseBtn");

  if (closeWorkoutBtn) {
    closeWorkoutBtn.addEventListener("click", function () {
      // Stop workout and reset when closing
      stopWorkout();
      workoutModal.classList.add("hidden");
    });
  } else {
    console.error("closeWorkoutBtn not found.");
  }

  if (workoutStartBtn) {
    workoutStartBtn.addEventListener("click", function () {
      // Always start/resume the workout when play button is clicked
      if (workoutExecution.isPaused) {
        // Resume from pause
        resumeWorkout();
      } else {
        // Start from beginning (or restart if already running)
        startWorkout();
      }
    });
  } else {
    console.error("workoutStartBtn not found.");
  }

  if (workoutPauseBtn) {
    workoutPauseBtn.addEventListener("click", function () {
      pauseWorkout();
    });
  } else {
    console.error("workoutPauseBtn not found.");
  }

  const workoutReplayBtn = document.getElementById("workoutReplayBtn");
  if (workoutReplayBtn) {
    workoutReplayBtn.addEventListener("click", function () {
      // Restart the workout from the beginning
      stopWorkout(); // Reset state

      // Add small delay to ensure TTS cleanup completes before restart
      setTimeout(() => {
        startWorkout(); // Start fresh
      }, 100);
    });
  } else {
    console.error("workoutReplayBtn not found.");
  }

  if (workoutModal) {
    workoutModal.addEventListener("click", function (e) {
      if (e.target === workoutModal) {
        // Don't auto-close workout modal when clicking outside to prevent accidental closure during workout
        // User must explicitly click close button or stop button
      }
    });
  } else {
    console.error("workoutModal not found.");
  }

  // --- Default Config Event Listeners ---
  if (defaultConfigHeader) {
    defaultConfigHeader.addEventListener("click", function (event) {
      const workoutNameInput =
        defaultConfigHeader.querySelector(".workout-name");
      if (
        event.target !== workoutNameInput &&
        defaultConfigBody &&
        defaultConfigArrow
      ) {
        defaultConfigBody.classList.toggle("hidden");
        defaultConfigArrow.classList.toggle("rotate-180");
      }
    });
    defaultConfigHeader.addEventListener("keydown", function (event) {
      const workoutNameInput =
        defaultConfigHeader.querySelector(".workout-name");
      if (
        (event.key === " " || event.key === "Enter") &&
        event.target !== workoutNameInput
      ) {
        event.preventDefault();
        if (defaultConfigBody && defaultConfigArrow) {
          defaultConfigBody.classList.toggle("hidden");
          defaultConfigArrow.classList.toggle("rotate-180");
        }
      }
    });

    // Add event listeners for the workout name input
    const workoutNameInput = defaultConfigHeader.querySelector(".workout-name");
    if (workoutNameInput) {
      workoutNameInput.addEventListener("keydown", function (event) {
        event.stopPropagation();
      });

      workoutNameInput.addEventListener("blur", function () {
        if (!this.value.trim()) {
          this.value = "My Squash Workout";
        }
      });
    }
  }

  if (
    defaultLimitsTypeSelect &&
    defaultShotLimitContainer &&
    defaultTimeLimitContainer
  ) {
    defaultLimitsTypeSelect.addEventListener("change", function () {
      const limitsType = this.value;
      if (limitsType === "shot-limit") {
        defaultShotLimitContainer.classList.remove("hidden");
        defaultTimeLimitContainer.classList.add("hidden");
      } else if (limitsType === "time-limit") {
        defaultTimeLimitContainer.classList.remove("hidden");
        defaultShotLimitContainer.classList.add("hidden");
      } else {
        defaultShotLimitContainer.classList.add("hidden");
        defaultTimeLimitContainer.classList.add("hidden");
      }
    });
  }

  if (defaultShotLimitSlider && defaultShotLimitValue) {
    defaultShotLimitSlider.addEventListener("input", function () {
      defaultShotLimitValue.textContent = this.value;
    });
  }

  if (defaultTimeLimitSlider && defaultTimeLimitValue) {
    defaultTimeLimitSlider.addEventListener("input", function () {
      const totalSeconds = parseInt(this.value);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
      defaultTimeLimitValue.textContent = `${minutes}:${formattedSeconds}`;
    });
  }

  if (defaultShotIntervalSlider && defaultShotIntervalValue) {
    defaultShotIntervalSlider.addEventListener("input", function () {
      const newValue = this.value;
      const oldValue = defaultShotIntervalValue.textContent.replace('s', ''); // Get old value

      defaultShotIntervalValue.textContent = `${parseFloat(newValue).toFixed(1)}s`;
      updateLeadTimeSlider(
        defaultShotIntervalSlider,
        defaultLeadTimeSlider,
        defaultLeadTimeValue,
      );

      // Trigger hierarchical propagation (debounced for sliders)
      debouncedHierarchicalSettingChange(document, 'interval', newValue, oldValue, this);
    });
  }

  if (defaultLeadTimeSlider) {
    defaultLeadTimeSlider.addEventListener("input", function () {
      const newValue = this.value;
      const oldValue = defaultLeadTimeValue ? defaultLeadTimeValue.textContent.replace('s', '') : '2.5'; // Get old value

      updateLeadTimeSlider(
        defaultShotIntervalSlider,
        defaultLeadTimeSlider,
        defaultLeadTimeValue,
      );

      // Trigger hierarchical propagation (debounced for sliders)
      debouncedHierarchicalSettingChange(document, 'shotAnnouncementLeadTime', newValue, oldValue, this);
    });
  }

  if (defaultOffsetEnabled) {
    defaultOffsetEnabled.addEventListener("change", function () {
      const newValue = this.checked;
      const oldValue = !newValue; // Previous value was the opposite

      updateDefaultOffsetControls();

      // Trigger hierarchical propagation
      handleHierarchicalSettingChange(document, 'intervalOffsetEnabled', newValue, oldValue, this);
    });
  }

  if (defaultOffsetTypeSelect) {
    let previousOffsetType = defaultOffsetTypeSelect.value; // Store initial value
    defaultOffsetTypeSelect.addEventListener("change", function () {
      const newValue = this.value;
      const oldValue = previousOffsetType;

      updateDefaultOffsetControls();

      // Only trigger propagation if offset is enabled
      if (defaultOffsetEnabled && defaultOffsetEnabled.checked) {
        handleHierarchicalSettingChange(document, 'intervalOffsetType', newValue, oldValue, this);
      }

      previousOffsetType = newValue; // Update stored value
    });
  }

  if (defaultOffsetFixedSlider) {
    defaultOffsetFixedSlider.addEventListener("input", function () {
      const newValue = this.value;
      const oldValue = "0"; // We can't easily track the old value for sliders, so use default

      updateDefaultOffsetControls();

      // Only trigger propagation if offset is enabled
      if (defaultOffsetEnabled && defaultOffsetEnabled.checked) {
        debouncedHierarchicalSettingChange(document, 'intervalOffsetFixedValue', newValue, oldValue, this);
      }
    });
  }

  if (defaultOffsetRandomMaximumSlider) {
    defaultOffsetRandomMaximumSlider.addEventListener("input", function () {
      if (
        defaultOffsetRandomMinimumSlider &&
        parseFloat(this.value) <
          parseFloat(defaultOffsetRandomMinimumSlider.value)
      ) {
        this.value = defaultOffsetRandomMinimumSlider.value;
      }

      const newValue = this.value;
      const oldValue = "0"; // We can't easily track the old value for sliders, so use default

      updateDefaultOffsetControls();

      // Only trigger propagation if offset is enabled
      if (defaultOffsetEnabled && defaultOffsetEnabled.checked) {
        debouncedHierarchicalSettingChange(document, 'intervalOffsetRandomMaximum', newValue, oldValue, this);
      }
    });
  }

  if (defaultOffsetRandomMinimumSlider) {
    defaultOffsetRandomMinimumSlider.addEventListener("input", function () {
      if (
        defaultOffsetRandomMaximumSlider &&
        parseFloat(this.value) >
          parseFloat(defaultOffsetRandomMaximumSlider.value)
      ) {
        this.value = defaultOffsetRandomMaximumSlider.value;
      }

      const newValue = this.value;
      const oldValue = "0"; // We can't easily track the old value for sliders, so use default

      updateDefaultOffsetControls();

      // Only trigger propagation if offset is enabled
      if (defaultOffsetEnabled && defaultOffsetEnabled.checked) {
        debouncedHierarchicalSettingChange(document, 'intervalOffsetRandomMinimum', newValue, oldValue, this);
      }
    });
  }

  if (defaultSplitStepEnabled && defaultSplitStepRateContainer) {
    defaultSplitStepEnabled.addEventListener("change", function () {
      const defaultSplitStepToggleLabel = document.getElementById(
        "defaultSplitStepToggleLabel",
      );
      if (defaultSplitStepToggleLabel) {
        defaultSplitStepToggleLabel.textContent = this.checked
          ? "Enabled"
          : "Disabled";
      }
      if (this.checked) {
        defaultSplitStepRateContainer.classList.remove("hidden");
      } else {
        defaultSplitStepRateContainer.classList.add("hidden");
      }
    });
  }

  if (defaultVoiceEnabled) {
    defaultVoiceEnabled.addEventListener("change", function () {
      const defaultVoiceToggleLabel = document.getElementById(
        "defaultVoiceToggleLabel",
      );
      if (defaultVoiceToggleLabel) {
        defaultVoiceToggleLabel.textContent = this.checked
          ? "Enabled"
          : "Disabled";
      }
      setDefaultVoiceOptionsState();
    });
  }

  // Add event listeners for hierarchical propagation of voice settings
  if (defaultVoiceSelect) {
    let previousVoice = defaultVoiceSelect.value; // Store initial value
    defaultVoiceSelect.addEventListener("change", function () {
      const newValue = this.value;
      const oldValue = previousVoice;

      // Only trigger propagation if voice is enabled
      if (defaultVoiceEnabled && defaultVoiceEnabled.checked) {
        handleHierarchicalSettingChange(document, 'voice', newValue, oldValue, this);
      }

      previousVoice = newValue; // Update stored value
    });
  }

  if (defaultVoiceRateSelect) {
    let previousVoiceRate = defaultVoiceRateSelect.value; // Store initial value
    defaultVoiceRateSelect.addEventListener("change", function () {
      const newValue = this.value;
      const oldValue = previousVoiceRate;

      // Only trigger propagation if voice is enabled
      if (defaultVoiceEnabled && defaultVoiceEnabled.checked) {
        handleHierarchicalSettingChange(document, 'speechRate', newValue, oldValue, this);
      }

      previousVoiceRate = newValue; // Update stored value
    });
  }

  if (defaultSplitStepSpeedSelect) {
    let previousSplitStepSpeed = defaultSplitStepSpeedSelect.value; // Store initial value
    defaultSplitStepSpeedSelect.addEventListener("change", function () {
      const newValue = this.value;
      const oldValue = previousSplitStepSpeed;

      // Only trigger propagation if split step is enabled
      if (defaultSplitStepEnabled && defaultSplitStepEnabled.checked) {
        handleHierarchicalSettingChange(document, 'splitStepSpeed', newValue, oldValue, this);
      }

      previousSplitStepSpeed = newValue; // Update stored value
    });
  }

  // Modal event handlers
  function updateModalText(action) {
    const modalTitle = document.getElementById("resetConfigModalTitle");
    const modalText = document.getElementById("resetConfigModalText");
    const modalOkBtn = document.getElementById("modalOkBtn");

    if (action === "rocket-mode-off") {
      modalTitle.textContent = "Disable Advanced Features";
      modalText.textContent =
        "Turning off rocket mode will hide advanced features.";
      modalOkBtn.textContent = "Disable";
    }
  }

  if (modalCancelBtn) {
    modalCancelBtn.addEventListener("click", function () {
      // Hide modal and revert toggle
      if (resetConfigModal) {
        const pendingAction = resetConfigModal.dataset.pendingAction;
        resetConfigModal.classList.add("hidden");
        resetConfigModal.dataset.pendingAction = "";

        if (pendingAction === "rocket-mode-off") {
          // Keep rocket mode on if user cancels
          document.documentElement.setAttribute("data-rocket-mode", "on");
          localStorage.setItem("rocketMode", "on");
        }
      }
    });
  }

  if (modalOkBtn) {
    modalOkBtn.addEventListener("click", function () {
      // Hide modal
      if (resetConfigModal) {
        const pendingAction = resetConfigModal.dataset.pendingAction;
        resetConfigModal.classList.add("hidden");
        resetConfigModal.dataset.pendingAction = "";

        // No longer reset all configs to defaults
        // resetAllConfigsToDefaults();

        if (pendingAction === "rocket-mode-off") {
          // Complete the rocket mode off transition
          enableRocketModeOff();
        }

        // Apply lock state to all existing patterns and their nested instances
        const patternInstances = document.querySelectorAll(".pattern-instance");
        patternInstances.forEach((pattern) => {
          applyLockStateToElement(pattern);
          // Also apply to all shot/message instances within this pattern
          pattern.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
            applyLockStateToElement(shotMsg);
          });
        });
      }
    });
  }

  // Generic deletion modal event handlers
  if (deleteModalCancelBtn) {
    deleteModalCancelBtn.addEventListener("click", function () {
      // Hide modal
      if (deleteModal) {
        deleteModal.classList.add("hidden");
        deleteModal.dataset.elementToDelete = "";
        deleteModal.dataset.deleteType = "";
      }
    });
  }

  if (deleteModalOkBtn) {
    deleteModalOkBtn.addEventListener("click", function () {
      // Hide modal
      if (deleteModal) {
        deleteModal.classList.add("hidden");

        const elementId = deleteModal.dataset.elementToDelete;
        const deleteType = deleteModal.dataset.deleteType;
        const element = document.getElementById(elementId);

        if (element) {
          if (deleteType === "pattern") {
            // Handle pattern deletion
            const totalPatterns =
              mainContainer.querySelectorAll(".pattern-instance").length;

            if (totalPatterns <= 1) {
              // If this is the last pattern, create a new default pattern first
              createPatternInstance();
            }

            element.remove();
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
            positionAddPatternButton();
          } else if (deleteType === "shot" || deleteType === "message") {
            // Handle shot/message deletion
            const parentPatternElement = element.closest(".pattern-instance");

            // Check if this is the last shot or message in the pattern
            const totalShotsMsgs =
              parentPatternElement.querySelectorAll(".shot-msg-instance").length;

            if (totalShotsMsgs <= 1) {
              // If this is the last shot/message, create a new default shot first
              createShotMsgInstance(parentPatternElement, "shot");
            }

            element.remove();

            // Update shot limit slider if this was a shot instance
            if (deleteType === "shot" && parentPatternElement) {
              updateShotLimitSlider(parentPatternElement);
            }

            // Update all position lock buttons since an instance was deleted
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
          }
        }

        deleteModal.dataset.elementToDelete = "";
        deleteModal.dataset.deleteType = "";
      }
    });
  }



  // --- Modal Click Outside to Close Handlers ---
  if (deleteModal) {
    deleteModal.addEventListener("click", function (e) {
      if (e.target === deleteModal) {
        deleteModal.classList.add("hidden");
        deleteModal.dataset.elementToDelete = "";
        deleteModal.dataset.deleteType = "";
      }
    });
  }

  // --- Initializations ---
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      // Populate voices for all existing and future instances
      document
        .querySelectorAll(".voice-select")
        .forEach((select) => populateVoiceSelect(select));
      // Also populate default config voice select
      if (defaultVoiceSelect) {
        populateVoiceSelect(defaultVoiceSelect);
        setDefaultVoiceOptionsState();
      }
    };
  }
  // Populate voices for initially loaded (static) elements
  document
    .querySelectorAll(".voice-select")
    .forEach((select) => populateVoiceSelect(select));

  // Initialize default config
  if (defaultVoiceSelect) {
    populateVoiceSelect(defaultVoiceSelect);
  }

  // Initialize default time limit display
  if (defaultTimeLimitSlider && defaultTimeLimitValue) {
    const totalSeconds = parseInt(defaultTimeLimitSlider.value);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    defaultTimeLimitValue.textContent = `${minutes}:${formattedSeconds}`;
  }

  updateLeadTimeSlider(
    defaultShotIntervalSlider,
    defaultLeadTimeSlider,
    defaultLeadTimeValue,
  );
  updateDefaultOffsetControls();
  setDefaultVoiceOptionsState();

  try {
    // Create an initial Pattern instance when the page loads
    createPatternInstance();

    // Ensure the first pattern has at least one shot
    const firstPattern = mainContainer.querySelector(".pattern-instance");
    if (firstPattern) {
      createShotMsgInstance(firstPattern, "shot");
    }

    // Initialize all position lock buttons
    updateAllPositionLockButtons();
    updateAllMoveButtonStates();

    // Position the add pattern button after the last pattern
    positionAddPatternButton();

    // Initialize lock state based on rocket mode
    const currentRocketMode =
      document.documentElement.getAttribute("data-rocket-mode");

    // Apply lock state to all elements
    const patternInstances = document.querySelectorAll(".pattern-instance");
    patternInstances.forEach((pattern) => {
      applyLockStateToElement(pattern);
      pattern.querySelectorAll(".shot-msg-instance").forEach((shotMsg) => {
        applyLockStateToElement(shotMsg);
      });
    });

    // Initialize rocket indicators for all elements
    updateAllRocketIndicators();

    // Additional failsafe: Force enable all settings buttons
    setTimeout(() => {
      document.querySelectorAll(".settings-btn").forEach((btn) => {
        btn.disabled = false;
        btn.style.pointerEvents = "auto";
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
        btn.removeAttribute("disabled");
      });
    }, 100);
  } catch (e) {
    console.error("Error during initial updates:", e);
    if (e instanceof ReferenceError) {
      console.error(
        "ReferenceError: Variable might not be declared or is out of scope. Check variable declaration and scope.",
      );
    } else if (e instanceof TypeError) {
      console.error(
        "TypeError: Attempted to access property on null or undefined. Check if DOM element was found.",
      );
    }
  }

  // --- Preview Functions ---



  /**
   * Generates and displays the workout preview
   */
  function generateWorkoutPreview() {
    const workoutData = getWorkoutJSON();

    // Determine the current config state from the UI
    const isConfigLocked =
      document.documentElement.getAttribute("data-rocket-mode") === "off";
    const workoutDefaultInterval = defaultShotIntervalSlider
      ? parseFloat(defaultShotIntervalSlider.value)
      : 5.0;

    // Enrich workout data with current UI config state before generating preview
    const enrichedWorkoutData = {
      ...workoutData,
      config: {
        ...workoutData.config,
        isConfigLocked: isConfigLocked,
        workoutDefaultInterval: workoutDefaultInterval,
      },
    };

    const previewResult = WorkoutLib.generatePreviewHtml(enrichedWorkoutData);
    document.getElementById("previewContent").innerHTML = previewResult.html;
    document.getElementById("previewWorkoutName").textContent =
      enrichedWorkoutData.name;
    document.getElementById("previewModal").classList.remove("hidden");

    // Use sound events from the golden source
    timelinePlayback.soundEvents = previewResult.soundEvents;

    // Initialize timeline playback
    initializeTimelinePlayback();
  }

  // --- Timeline Playback Functions ---
  let timelinePlayback = {
    isPlaying: false,
    currentTime: 0,
    startTime: null,
    timingBadges: [],
    soundEvents: [], // Store calculated sound events from workout data
    maxTime: 0,
    animationFrame: null,
    ghostProgress: 0, // Track the furthest timestamp the ghost has visited
    playedSounds: new Set(), // Track which sounds have been played to avoid duplicates
    activeTTSUtterances: new Set() // Track active TTS utterances for pause/resume handling
  };

  // --- Sound Effects System ---
  let audioContext;

  /**
   * Initializes the Web Audio API AudioContext.
   * Attempts to resume if suspended, often necessary due to browser autoplay policies.
   */
  function initializeAudioContext() {
    try {
      // Create AudioContext if it doesn't exist
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Always check if the context needs to be resumed
      if (audioContext.state === 'suspended') {
        // Try immediate resume first (works if user has already interacted)
        audioContext.resume().then(() => {
          // Resumed successfully
        }).catch(error => {
          // If immediate resume fails, set up user interaction listeners
          const resumeAudio = () => {
            audioContext.resume().then(() => {
              // Clean up the event listeners once resumed.
              document.removeEventListener('click', resumeAudio);
              document.removeEventListener('touchend', resumeAudio);
            }).catch(error => console.error("Error resuming AudioContext:", error));
          };
          document.addEventListener('click', resumeAudio, { once: true, passive: true });
          document.addEventListener('touchend', resumeAudio, { once: true, passive: true });
        });
      }
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  /**
   * Plays a two-tone beep sound.
   */
  function playTwoToneBeep() {
    try {
      if (!audioContext || audioContext.state !== 'running') {
        // Attempt to resume it one last time.
        if(audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            // Retry the beep after a short delay
            setTimeout(() => playTwoToneBeep(), 50);
          }).catch(error => {
            console.error("Failed to resume AudioContext for beep:", error);
          });
        }
        return;
      }

      const duration = 0.15;
      const frequency1 = 800;
      const frequency2 = 1200;
      const volume = 4.0;

      const now = audioContext.currentTime;

      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(frequency1, now);
      gainNode1.gain.setValueAtTime(volume, now);
      oscillator1.start(now);
      gainNode1.gain.exponentialRampToValueAtTime(0.00001, now + duration);
      oscillator1.stop(now + duration);

      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(frequency2, now + duration);
      gainNode2.gain.setValueAtTime(volume, now + duration);
      oscillator2.start(now + duration);
      gainNode2.gain.exponentialRampToValueAtTime(0.00001, now + duration * 2);
      oscillator2.stop(now + duration * 2);

    } catch (error) {
      console.error("playTwoToneBeep: Error playing two-tone beep:", error);
    }
  }

  /**
   * Plays a "power-up" sound effect for split-step hint.
   * @param {string} speed - 'Slow', 'Medium', or 'Fast'.
   * @param {string} [pitch='medium'] - 'low', 'medium', or 'high'.
   */
  function playSplitStepPowerUp(speed, pitch = 'medium') {
    try {
      if (!audioContext || audioContext.state !== 'running') {
        if(audioContext && audioContext.state === 'suspended') {
          audioContext.resume().then(() => {
            // Retry the split-step after a short delay
            setTimeout(() => playSplitStepPowerUp(speed, pitch), 50);
          }).catch(error => {
            console.error("Failed to resume AudioContext for split-step:", error);
          });
        }
        return;
      }

      let baseFrequency;
      // Determine base frequency based on pitch
      switch (pitch) {
        case 'low':
          baseFrequency = 220; // A3
          break;
        case 'medium':
          baseFrequency = 440; // A4 (standard)
          break;
        case 'high':
          baseFrequency = 880; // A5
          break;
        default:
          baseFrequency = 440;
      }

      let durationPerStep;
      // Determine speed (handle both lowercase and capitalized)
      const normalizedSpeed = speed.toLowerCase();
      switch (normalizedSpeed) {
        case 'slow':
          durationPerStep = 0.08;
          break;
        case 'medium':
          durationPerStep = 0.06;
          break;
        case 'fast':
          durationPerStep = 0.04;
          break;
        default:
          return; // Don't play if speed is not recognized or 'None'
      }

      const numberOfSteps = 8;
      const attack = 0.01; // Attack phase duration for each step
      const decay = 0.05;  // Decay phase duration for each step
      const oscillatorType = 'triangle'; // Triangle wave for a distinct sound
      const volume = 0.8; // 80% volume

      const now = audioContext.currentTime;

      for (let i = 0; i < numberOfSteps; i++) {
        const startTime = now + (i * durationPerStep);
        const frequency = baseFrequency * Math.pow(1.15, i); // Exponential increase for rising sound

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination); // Connect directly to audio context destination

        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // ADSR envelope for each step (simplified to A and D here)
        gainNode.gain.setValueAtTime(0, startTime); // Start from 0 volume
        gainNode.gain.linearRampToValueAtTime(volume, startTime + attack); // Ramp up to 80% volume
        gainNode.gain.linearRampToValueAtTime(0, startTime + attack + decay); // Ramp down to 0 volume

        oscillator.start(startTime);
        // Stop the oscillator after its full step duration, allowing the ADSR to complete within it
        oscillator.stop(startTime + durationPerStep);

        // Clean up nodes after they are no longer needed
        oscillator.onended = () => {
          oscillator.disconnect();
          gainNode.disconnect();
        };
      }
    } catch (error) {
      console.error("playSplitStepPowerUp: Error playing split-step power-up sound:", error);
    }
  }

  /**
   * Ensures voices are loaded for the Speech Synthesis API
   */
  function ensureVoicesLoaded() {
    return new Promise((resolve) => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // Wait for voices to be loaded
        speechSynthesis.addEventListener('voiceschanged', () => {
          resolve(speechSynthesis.getVoices());
        }, { once: true });
      }
    });
  }

  /**
   * Plays text-to-speech using the Web Speech API
   * @param {string} text - The text to speak
   * @param {Object} entryConfig - The entry configuration containing voice settings
   */
  function playTTS(text, entryConfig) {
    try {
      // Check if Speech Synthesis API is available
      if (!('speechSynthesis' in window)) {
        console.warn('Speech Synthesis API not supported in this browser');
        return;
      }

      // Clean up text for speech
      const cleanText = text.trim();
      if (!cleanText) {
        return;
      }

      // Create speech utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Set voice if specified and not "Default"
      if (entryConfig.voice && entryConfig.voice !== 'Default') {
        ensureVoicesLoaded().then(voices => {
          const selectedVoice = voices.find(voice => voice.name === entryConfig.voice);
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
          speakUtterance(utterance, entryConfig);
        });
      } else {
        speakUtterance(utterance, entryConfig);
      }

    } catch (error) {
      console.error("playTTS: Error playing text-to-speech:", error);
    }
  }

  /**
   * Helper function to configure and speak an utterance
   * @param {SpeechSynthesisUtterance} utterance - The utterance to speak
   * @param {Object} entryConfig - The entry configuration containing voice settings
   */
  function speakUtterance(utterance, entryConfig) {
    try {
      // Set speech rate with proper inheritance defaults
      if (entryConfig.speechRate && entryConfig.speechRate !== 'auto-scale') {
        const rate = parseFloat(entryConfig.speechRate);
        if (!isNaN(rate) && rate >= 0.5 && rate <= 1.5) {
          utterance.rate = rate;
        }
      } else {
        utterance.rate = 1.0; // Default rate
      }

      // Set other properties for better speech quality
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      // Track active TTS for pause/resume handling
      timelinePlayback.activeTTSUtterances.add(utterance);

      // Clean up when utterance ends or errors
      const cleanup = () => {
        timelinePlayback.activeTTSUtterances.delete(utterance);
      };

      utterance.addEventListener('end', cleanup);
      utterance.addEventListener('error', cleanup);

      // Speak the text
      speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("speakUtterance: Error speaking utterance:", error);
    }
  }

  function initializeTimelinePlayback() {
    try {
      // Clean up existing event listeners to prevent memory leaks
      if (timelinePlayback.timingBadges && timelinePlayback.timingBadges.length > 0) {
        timelinePlayback.timingBadges.forEach(badge => {
          if (badge.element && badge.clickHandler) {
            badge.element.removeEventListener('click', badge.clickHandler);
            badge.element.style.cursor = '';
            badge.element.title = '';
          }
        });
      }

      // Reset playback state
      timelinePlayback.isPlaying = false;
      timelinePlayback.currentTime = 0;
      timelinePlayback.startTime = null;
      timelinePlayback.timingBadges = [];
      timelinePlayback.maxTime = 0;
      timelinePlayback.ghostProgress = 0;
      timelinePlayback.playedSounds = new Set();

      // Cancel any ongoing TTS
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        timelinePlayback.activeTTSUtterances.clear();
      }

      // Clear any existing animation
      if (timelinePlayback.animationFrame) {
        cancelAnimationFrame(timelinePlayback.animationFrame);
        timelinePlayback.animationFrame = null;
      }

      // Initialize audio context
      initializeAudioContext();

      // Get all timing badges and their time ranges (main timeline badges and rocket-mode sub-badges)
      const badges = document.querySelectorAll('.timing-badge, .rocket-timing-badge');

      timelinePlayback.timingBadges = Array.from(badges)
        .map((badge, index) => {
          const startTime = parseFloat(badge.dataset.startTime);
          const endTime = parseFloat(badge.dataset.endTime);
          const isRocketMode = badge.classList.contains('rocket-timing-badge');

          // Skip badges with invalid timing data
          if (isNaN(startTime) || isNaN(endTime) || !isFinite(startTime) || !isFinite(endTime)) {
            console.warn('Skipping badge with invalid timing data:', badge);
            return null;
          }

          // Find the appropriate container - try multiple selectors
          let container = badge.closest('.flex.items-center.gap-2');
          if (!container) {
            container = badge.closest('div'); // Fallback to any parent div
          }
          if (!container) {
            container = badge.parentElement; // Ultimate fallback
          }

          // Add click handler for timeline scrubbing
          const clickHandler = function(event) {
            // Only allow scrubbing when timeline is not playing
            if (!timelinePlayback.isPlaying) {
              event.preventDefault();
              event.stopPropagation();

              // Jump to the start time of this badge
              timelinePlayback.currentTime = startTime;
              timelinePlayback.ghostProgress = startTime;

              // Clear played sounds for times at or after this position
              const soundsToKeep = new Set();
              timelinePlayback.playedSounds.forEach(soundKey => {
                const timeMatch = soundKey.match(/-([\d.]+)$/);
                if (timeMatch) {
                  const soundTime = parseFloat(timeMatch[1]);
                  if (soundTime < startTime) {
                    soundsToKeep.add(soundKey);
                  }
                }
              });
              timelinePlayback.playedSounds = soundsToKeep;

              // Update display
              updateTimelineHighlights();

              // Add visual feedback
              badge.style.transform = 'scale(0.95)';
              setTimeout(() => {
                badge.style.transform = '';
              }, 150);
            }
          };

          // Add click event listener and store reference for cleanup
          badge.addEventListener('click', clickHandler);
          badge._timelineClickHandler = clickHandler;

          // Add cursor pointer when not playing
          badge.style.cursor = 'pointer';
          badge.title = `Click to jump to ${WorkoutLib.formatTimeHighPrecision(startTime)} (when paused)`;

          return {
            element: badge,
            startTime: startTime,
            endTime: endTime,
            container: container,
            isRocketMode: isRocketMode,
            clickHandler: clickHandler
          };
        })
        .filter(badge => badge !== null);

      // Find the maximum time
      const endTimes = timelinePlayback.timingBadges.map(b => b.endTime).filter(time => !isNaN(time) && isFinite(time));
      timelinePlayback.maxTime = endTimes.length > 0 ? Math.max(...endTimes) : 0;

      // Reset UI state
      updatePlayPauseButton(false);
      clearTimelineHighlights();
    } catch (error) {
      console.error('Error initializing timeline playback:', error);
      // Reset to safe state
      timelinePlayback.isPlaying = false;
      timelinePlayback.currentTime = 0;
      timelinePlayback.timingBadges = [];
      timelinePlayback.maxTime = 0;
    }
  }

  function updatePlayPauseButton(isPlaying) {
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');

    if (isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }

    // Update cursor style for timing badges based on playback state
    timelinePlayback.timingBadges.forEach(badge => {
      if (badge.element) {
        badge.element.style.cursor = isPlaying ? 'default' : 'pointer';
        badge.element.title = isPlaying ?
          'Pause to enable timeline scrubbing' :
          `Click to jump to ${WorkoutLib.formatTimeHighPrecision(badge.startTime)} (when paused)`;
      }
    });
  }

  function clearTimelineHighlights() {
    timelinePlayback.timingBadges.forEach(badge => {
      badge.element.classList.remove('timeline-current', 'timeline-past', 'timeline-future');

      // Remove any timeline icons from container element
      const existingIcon = badge.container?.querySelector('.timeline-current-icon');
      if (existingIcon) {
        existingIcon.remove();
      }
    });

    // Reset timer display
    const timer = document.getElementById('timelineTimer');
    if (timer) {
      timer.textContent = '00:00.00';
    }
  }

  function updateTimelineHighlights() {
    try {
      let currentBadge = null;
      let latestCurrentBadge = null;
      const currentTime = timelinePlayback.currentTime;

      // Update timer display
      const timer = document.getElementById('timelineTimer');
      if (timer) {
        timer.textContent = WorkoutLib.formatTimeHighPrecision(currentTime);
      }

      // First pass: classify all badges and collect current ones
      const currentMainBadges = [];
      const currentRocketBadges = [];

      timelinePlayback.timingBadges.forEach(badge => {
        const { element, startTime, endTime, container, isRocketMode } = badge;

        // Remove existing classes
        element.classList.remove('timeline-current', 'timeline-past', 'timeline-future');

        // Simple duration logic: use original end times
        const isCurrentActive = currentTime >= startTime && currentTime < endTime;

        if (isCurrentActive) {
          // Current active badge
          element.classList.add('timeline-current');

          // Check if this is a remaining time badge (by checking next sibling text)
          const isRemainingTimeBadge = element.nextElementSibling?.textContent?.includes('Remaining time');
          if (isRemainingTimeBadge) {
            element.classList.add('remaining-time-override');
          }

          // Separate current badges by type for priority handling
          if (isRocketMode) {
            currentRocketBadges.push(badge);
          } else {
            currentMainBadges.push(badge);
            // Only use main timeline badges for auto-scrolling
            currentBadge = badge;
          }
        } else if (currentTime >= endTime) {
          // Past badge
          element.classList.add('timeline-past');
        } else {
          // Future badge - fade out
          element.classList.add('timeline-future');
        }
      });

      // Simplified: Only use main timeline badges (Shot/Message), ignore rocket-mode sub-entries
      if (currentMainBadges.length > 0) {
        // Only consider main badges that have started and don't go backwards
        const forwardMainBadges = currentMainBadges
          .filter(badge => badge.startTime <= currentTime && badge.startTime >= timelinePlayback.ghostProgress);

        if (forwardMainBadges.length > 0) {
          // Pick the most recent main badge (highest startTime)
          latestCurrentBadge = forwardMainBadges
            .sort((a, b) => b.startTime - a.startTime)[0];

          // Update ghost progress to prevent going backwards
          timelinePlayback.ghostProgress = Math.max(timelinePlayback.ghostProgress, latestCurrentBadge.startTime);

          // Ghost tracking without debugging
        } else {
          // No forward badges available, keep ghost where it is
          latestCurrentBadge = null;
        }
      } else {
        latestCurrentBadge = null;
      }

      // Only update ghost if the badge has changed (prevent animation interruption)
      const currentGhostContainer = document.querySelector('.timeline-current-icon')?.parentElement;
      const newGhostContainer = latestCurrentBadge?.container;

      if (currentGhostContainer !== newGhostContainer) {
        // Remove ALL existing ghost icons immediately
        document.querySelectorAll('.timeline-current-icon').forEach(icon => icon.remove());

        // Add new ghost with fresh animation (starts at left, original orientation)
        if (latestCurrentBadge) {
          const { element, container, isRocketMode } = latestCurrentBadge;

          // Detect theme mode (check if we're in dark mode)
          const isDarkMode = detectDarkMode();
          const ghostImage = isDarkMode ? 'images/ghost-black.png' : 'images/ghost-white.png';

          // Create ghost icon after the entire entry (after the label)
          const icon = document.createElement('span');
          icon.className = 'timeline-current-icon';
          // Larger ghost size (main timeline entries only now)
          const iconSize = 22;
          icon.innerHTML = `<img src="${ghostImage}" width="${iconSize}" height="${iconSize}" alt="Current">`;

          // Insert into the flex container (not after it)
          if (container) {
            container.appendChild(icon);

            // Calculate available space and adjust ghost movement range
            setTimeout(() => {
              adjustGhostMovementRange(icon, container);
            }, 50); // Small delay to ensure DOM is updated
          }
        }
      }

      // Check for sound effects using extracted sound events data
       if (audioContext && timelinePlayback.soundEvents) {
         timelinePlayback.soundEvents.forEach(soundEvent => {
           // Check if this sound event should trigger at the current time
           // Use a small tolerance (50ms) to account for timing precision
           const tolerance = 0.05;
           const isEventTime = Math.abs(currentTime - soundEvent.time) < tolerance;

           if (isEventTime) {
             const soundKey = `${soundEvent.type}-${soundEvent.time.toFixed(3)}`;

             // Only play sound once per event
             if (!timelinePlayback.playedSounds.has(soundKey)) {
               if (soundEvent.type === 'splitStep') {
                 playSplitStepPowerUp(soundEvent.speed);
                 timelinePlayback.playedSounds.add(soundKey);
               } else if (soundEvent.type === 'beep') {
                 playTwoToneBeep();
                 triggerBeepFlash(soundEvent.time);
                 timelinePlayback.playedSounds.add(soundKey);
                               } else if (soundEvent.type === 'tts') {
                  playTTS(soundEvent.text, soundEvent.entryConfig);
                  timelinePlayback.playedSounds.add(soundKey);
               }
             }
           }
         });
       }

       // Auto-scroll removed to prevent interference with pause control
     } catch (error) {
       console.error('Error updating timeline highlights:', error);
       // Stop playback on error to prevent further issues
       if (timelinePlayback.isPlaying) {
         pauseTimeline();
       }
     }
   }

  // Detect if we're in dark mode
  function detectDarkMode() {
    // Check for dark mode class on body or html
    if (document.body.classList.contains('dark') || document.documentElement.classList.contains('dark')) {
      return true;
    }

    // Check for dark mode media query
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }

    // Check computed background color of body (if it's dark)
    const bodyStyle = window.getComputedStyle(document.body);
    const bgColor = bodyStyle.backgroundColor;

    // Parse RGB values to determine if background is dark
    if (bgColor.startsWith('rgb')) {
      const rgbValues = bgColor.match(/\d+/g);
      if (rgbValues && rgbValues.length >= 3) {
        const r = parseInt(rgbValues[0]);
        const g = parseInt(rgbValues[1]);
        const b = parseInt(rgbValues[2]);
        // Calculate luminance - if less than 128, consider it dark
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        return luminance < 128;
      }
    }

    // Default to light mode
    return false;
  }

    function adjustGhostMovementRange(ghostIcon, container) {
    try {
      // For right-justified ghost, use a smaller, fixed range since it's positioned at the edge
      const maxMovementWidth = 15; // Conservative range for right-positioned ghost

      // Create custom CSS animation with adjusted range
      const customAnimationName = `timeline-ghost-movement-${maxMovementWidth}`;

      // Check if this animation already exists
      if (!document.querySelector(`#ghost-animation-${maxMovementWidth}`)) {
        const style = document.createElement('style');
        style.id = `ghost-animation-${maxMovementWidth}`;
        style.textContent = `
          @keyframes ${customAnimationName} {
            0% {
              transform: translateX(-${maxMovementWidth}px) translateY(0px);
            }
            25% {
              transform: translateX(-${Math.floor(maxMovementWidth/2)}px) translateY(-2px);
            }
            50% {
              transform: translateX(${maxMovementWidth}px) translateY(0px);
            }
            75% {
              transform: translateX(-${Math.floor(maxMovementWidth/2)}px) translateY(-2px);
            }
            100% {
              transform: translateX(-${maxMovementWidth}px) translateY(0px);
            }
          }
        `;
        document.head.appendChild(style);
      }

      // Apply the custom animation to the container, flipping to the image
      ghostIcon.style.animation = `${customAnimationName} 3s linear infinite`;
      const ghostImg = ghostIcon.querySelector('img');
      if (ghostImg) {
        ghostImg.style.animation = 'timeline-ghost-flip 3s linear infinite';
      }

      // Debug info (can be removed)


    } catch (error) {
      console.warn('Failed to adjust ghost movement range:', error);
      // Fallback to default animation
      ghostIcon.style.animation = 'timeline-ghost-movement 3s linear infinite';
      const ghostImg = ghostIcon.querySelector('img');
      if (ghostImg) {
        ghostImg.style.animation = 'timeline-ghost-flip 3s linear infinite';
      }
    }
  }

  function playTimeline() {
    if (timelinePlayback.isPlaying) return;

    // Ensure we have valid timing data
    if (!timelinePlayback.timingBadges || timelinePlayback.timingBadges.length === 0) {
      console.warn('No valid timing badges found, cannot start timeline playback');
      return;
    }

    if (!timelinePlayback.maxTime || timelinePlayback.maxTime <= 0) {
      console.warn('Invalid max time, cannot start timeline playback');
      return;
    }

    // Initialize audio context on user interaction
    initializeAudioContext();

    timelinePlayback.isPlaying = true;
    // Start from current time (respects scrubbed position)
    timelinePlayback.startTime = performance.now() - (timelinePlayback.currentTime * 1000);
    updatePlayPauseButton(true);

    function animate() {
      if (!timelinePlayback.isPlaying) return;

      const elapsed = (performance.now() - timelinePlayback.startTime) / 1000;
      timelinePlayback.currentTime = elapsed;

      // Safety check to prevent runaway animations
      if (timelinePlayback.currentTime > timelinePlayback.maxTime + 5) {
        console.warn('Timeline exceeded expected duration, stopping playback');
        pauseTimeline();
        return;
      }

      updateTimelineHighlights();

      // Stop if we've reached the end and reset for replay
      if (timelinePlayback.currentTime >= timelinePlayback.maxTime) {
        // Reset timeline for replay
        timelinePlayback.isPlaying = false;
        timelinePlayback.currentTime = 0;
        timelinePlayback.startTime = null;
        timelinePlayback.ghostProgress = 0;
        timelinePlayback.playedSounds.clear();

        // Cancel any ongoing TTS at end of workout
        if ('speechSynthesis' in window) {
          speechSynthesis.cancel();
          timelinePlayback.activeTTSUtterances.clear();
        }

        // Update UI to show play button
        updatePlayPauseButton(false);

        // Clear highlights and reset to start
        clearTimelineHighlights();

        // Update timer display
        const timer = document.getElementById('timelineTimer');
        if (timer) {
          timer.textContent = '00:00.00';
        }

        // Clean up animation frame
        if (timelinePlayback.animationFrame) {
          cancelAnimationFrame(timelinePlayback.animationFrame);
          timelinePlayback.animationFrame = null;
        }

        return;
      }

      timelinePlayback.animationFrame = requestAnimationFrame(animate);
    }

    animate();
  }

  function pauseTimeline() {
    timelinePlayback.isPlaying = false;
    updatePlayPauseButton(false);

    if (timelinePlayback.animationFrame) {
      cancelAnimationFrame(timelinePlayback.animationFrame);
      timelinePlayback.animationFrame = null;
    }

    // Cancel all ongoing TTS to prevent weird behavior when pausing
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      timelinePlayback.activeTTSUtterances.clear();
    }
  }

  /**
   * Triggers a visual flash effect on the shot when a beep sound plays
   * @param {number} beepTime - The time when the beep occurs
   */
  function triggerBeepFlash(beepTime) {
    try {
      // Find timing badges that match this beep time (within small tolerance)
      const tolerance = 0.01; // 10ms tolerance for exact timing
      const matchingBadges = timelinePlayback.timingBadges.filter(badge => {
        const endTime = badge.endTime;
        return badge.element.classList.contains('timing-badge') &&
               Math.abs(endTime - beepTime) < tolerance;
      });

             matchingBadges.forEach(badge => {
         const timingBadge = badge.element;

         if (timingBadge) {
           // Apply flash effect only to timing badge
           timingBadge.classList.add('beep-flash');

           // Remove the effect after animation completes (500ms)
           setTimeout(() => {
             timingBadge.classList.remove('beep-flash');
           }, 500);
         }
       });
    } catch (error) {
      console.error('Error triggering beep flash effect:', error);
    }
  }

  function togglePlayPause() {
    if (timelinePlayback.isPlaying) {
      pauseTimeline();
    } else {
      playTimeline();
    }
  }

  /**
   * Presents the workout at the current preview timestamp
   * Closes the preview window and opens the workout play window at the current time
   */
  function presentAtCurrentTime() {
    const currentTime = timelinePlayback.currentTime;

    // Close the preview modal
    const previewModal = document.getElementById("previewModal");
    if (previewModal) {
      previewModal.classList.add("hidden");
    }

    // Stop timeline playback and reset when closing
    if (timelinePlayback.isPlaying) {
      pauseTimeline();
    }

    // Cancel any ongoing TTS when closing
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      timelinePlayback.activeTTSUtterances.clear();
    }

    clearTimelineHighlights();

    // Start workout execution with the current preview time (paused)
    startWorkoutExecutionAtTime(currentTime, true);
  }

  // --- Workout Execution Functions ---
  let workoutExecution = {
    isRunning: false,
    isPaused: false,
    currentTime: 0,
    startTime: null,
    workoutData: null,
    soundEvents: [],
    maxTime: 0,
    animationFrame: null,
    playedSounds: new Set(),
    activeTTSUtterances: new Set(),
    currentEntryIndex: 0,
    currentPatternIndex: 0,
    totalShots: 0,
    shotsCompleted: 0,
    countdownInterval: null,
    currentCountdown: 0
  };

  function startWorkoutExecution() {
    startWorkoutExecutionAtTime(0, false); // Start immediately when running from main interface
  }

  /**
   * Starts workout execution at a specific time
   * @param {number} startTime - The time in seconds to start the workout from
   * @param {boolean} startPaused - Whether to start in paused state (default: false)
   */
  function startWorkoutExecutionAtTime(startTime, startPaused = false) {
    const workoutData = getWorkoutJSON();

    // Validate workout before starting
    try {
      WorkoutLib.validateWorkoutJSON(workoutData);
    } catch (error) {
      alert(`Cannot start workout: ${error.message}`);
      return;
    }

    // Determine the current config state from the UI
    const isConfigLocked = document.documentElement.getAttribute("data-rocket-mode") === "off";
    const workoutDefaultInterval = defaultShotIntervalSlider ? parseFloat(defaultShotIntervalSlider.value) : 5.0;

    // Enrich workout data with current UI config state
    const enrichedWorkoutData = {
      ...workoutData,
      config: {
        ...workoutData.config,
        isConfigLocked: isConfigLocked,
        workoutDefaultInterval: workoutDefaultInterval,
      },
    };

    // Calculate workout stats and generate sound events
    const stats = WorkoutLib.calculateWorkoutStats(enrichedWorkoutData);
    const previewResult = WorkoutLib.generatePreviewHtml(enrichedWorkoutData);

    // Reset and initialize workout execution state
    workoutExecution.workoutData = enrichedWorkoutData;
    workoutExecution.soundEvents = previewResult.soundEvents;
    workoutExecution.maxTime = stats.totalTime;
    workoutExecution.totalShots = stats.totalShots;
    workoutExecution.shotsCompleted = 0;
    workoutExecution.currentTime = startTime; // Start at the specified time

    // Set initial state based on entry method
    if (startTime > 0 && startPaused) {
      // Entering from preview at non-zero time - start paused
      workoutExecution.isRunning = true;
      workoutExecution.isPaused = true;
    } else {
      // Normal entry - start stopped
      workoutExecution.isRunning = false;
      workoutExecution.isPaused = false;
    }
    workoutExecution.playedSounds = new Set();
    workoutExecution.completionTriggered = false;
    workoutExecution.glowTriggered = false;
    workoutExecution.currentPattern = null;
    workoutExecution.activeTTSUtterances = new Set();
    workoutExecution.timelineIndex = null; // Reset timeline index
    workoutExecution.lastProgressPercentage = 0;
    workoutExecution.lastShotTitle = null;
    workoutExecution.lastProgress = 0;
    workoutExecution.lastBgPosition = 0;
    workoutExecution.fadeTriggered = false;
    workoutExecution.isCompleted = false;
    workoutExecution.lastShotCompleted = false;
    workoutExecution.lastCountdownNumber = null;
    workoutExecution.lastEntryId = null;

    // Mark sounds as played up to the start time to avoid replaying them
    if (startTime > 0) {
      workoutExecution.soundEvents.forEach(soundEvent => {
        if (soundEvent.time < startTime) {
          const soundKey = `${soundEvent.type}-${soundEvent.time.toFixed(3)}`;
          workoutExecution.playedSounds.add(soundKey);

          // Count completed shots up to the start time
          if (soundEvent.type === 'beep' && soundEvent.entry && soundEvent.entry.type === 'Shot' && !soundEvent.isCountdown) {
            workoutExecution.shotsCompleted++;
          }
        }
      });
    }

    // Initialize UI
    updateWorkoutUI();

    // Clear any previous effects
    const shotTitleElement = document.getElementById("workoutShotTitle");
    if (shotTitleElement) {
      shotTitleElement.classList.remove("glow-pulse", "fade-out");
    }

    // Show workout modal
    document.getElementById("workoutExecutionName").textContent = workoutData.name;
    document.getElementById("workoutModal").classList.remove("hidden");

    // Initialize audio context
    initializeAudioContext();
  }

  function updateWorkoutUI() {
    const { isRunning, isPaused, currentTime, maxTime, totalShots, shotsCompleted } = workoutExecution;

    // Update status indicator
    const statusIndicator = document.getElementById("workoutStatusIndicator");
    const statusGhostImage = document.getElementById("workoutStatusGhostImage");

    // Update ghost image based on theme
    const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
    const ghostSrc = isDarkMode ? "images/ghost-black.png" : "images/ghost-white.png";

    if (statusGhostImage.src !== window.location.origin + "/" + ghostSrc) {
      statusGhostImage.src = ghostSrc;
    }

    // Update ghost behavior - preserve flipped state
    const wasFlipped = statusIndicator.classList.contains("flipped");
    statusIndicator.className = "workout-status-ghost";
    if (wasFlipped) {
      statusIndicator.classList.add("flipped");
    }

    if (isRunning && !isPaused) {
      statusIndicator.classList.add("running");
    } else if (isPaused) {
      // When paused, just bob up and down (no flip)
      statusIndicator.classList.remove("running");
    } else {
      // When stopped, just bob up and down (no flip)
      statusIndicator.classList.remove("running");
    }



    // Update control buttons
    const startBtn = document.getElementById("workoutStartBtn");
    const pauseBtn = document.getElementById("workoutPauseBtn");
    const replayBtn = document.getElementById("workoutReplayBtn");

    if (workoutExecution.isCompleted) {
      // At the end of the workout, it becomes a replay
      startBtn.classList.add("hidden");
      pauseBtn.classList.add("hidden");
      replayBtn.classList.remove("hidden");
    } else if (isRunning && !isPaused) {
      // Once the play button is pressed, it should change to pause
      startBtn.classList.add("hidden");
      pauseBtn.classList.remove("hidden");
      replayBtn.classList.add("hidden");
    } else {
      // When entering workout mode, show play button (unless from preview at non-zero time)
      startBtn.classList.remove("hidden");
      pauseBtn.classList.add("hidden");
      replayBtn.classList.add("hidden");

      // Update start button style based on state
      if (isPaused && currentTime > 0) {
        // If entering from preview AND not at 00:00, then start with pause icon
        startBtn.classList.remove("workout-btn-start");
        startBtn.classList.add("workout-btn-resume");
      } else {
        // Normal entry - show play icon
        startBtn.classList.remove("workout-btn-resume");
        startBtn.classList.add("workout-btn-start");
      }
    }

    // Update timer
    const timerElement = document.getElementById("workoutTimer");
    timerElement.textContent = WorkoutLib.formatTime(currentTime);

    // Update shots counter
    document.getElementById("workoutShotsCounter").textContent = `${shotsCompleted} / ${totalShots}`;

    // Update shot title and progress meter
    updateShotDisplay();
  }

  function updateShotDisplay() {
    const { currentTime, soundEvents, isRunning, isPaused } = workoutExecution;

    let shotTitle = "";  // Don't show "Get Ready" initially
    let currentPattern = "--";
    let progressText = ""; // Remove smaller text
    let progressPercentage = workoutExecution.lastProgressPercentage || 0; // Maintain previous value
    let progressPhase = "ready";
    let activeEventType = null;
    let currentEntryId = null;

    if (isPaused && currentTime > 0) {
      shotTitle = "Paused";
      ensureTextVisible(); // Make sure text is visible when paused
      progressText = ""; // Remove smaller text
    } else if (isRunning) {
      // Check for workout completion first (by time or by last shot completion)
      const isTimeComplete = currentTime >= workoutExecution.maxTime;
      const isLastShotComplete = workoutExecution.lastShotCompleted;

      if (isTimeComplete || isLastShotComplete) {
        // Only trigger completion once
        if (!workoutExecution.completionTriggered) {
          workoutExecution.completionTriggered = true;
          workoutExecution.isCompleted = true; // Mark as completed for UI
          completeWorkout();
        }

        return; // Exit early to prevent other logic from overriding
      } else {
        // Use deterministic timeline lookup instead of searching
        let activeEvent = null;

        // Initialize timeline index if needed
        if (!workoutExecution.timelineIndex) {
          workoutExecution.timelineIndex = buildTimelineIndex(soundEvents);
        }

        // Find active event using timeline index
        const timelineData = workoutExecution.timelineIndex;
        activeEvent = findActiveEvent(currentTime, timelineData);

        if (activeEvent) {
          activeEventType = activeEvent.type;
          // console.log(`Active event: ${activeEvent.type} - ${activeEvent.description}`);

          // Get the current entry ID for ghost flip tracking
          if (activeEvent.data && activeEvent.data.entry) {
            currentEntryId = activeEvent.data.entry.id;
          }

          // Track current entry for other purposes (but don't flip here)
          if (currentEntryId && currentEntryId !== workoutExecution.lastEntryId) {
            workoutExecution.lastEntryId = currentEntryId;
          }
        }

                 // Handle active event using new timeline system
         if (activeEvent && activeEventType === 'message_tts') {
           shotTitle = activeEvent.data.text || "Message";
           ensureTextVisible(); // Make sure text is visible for messages
           progressText = ""; // Remove smaller text

           // Don't touch progress meter during TTS - keep previous value
           // progressPercentage remains as initialized above
           progressPhase = "message";

           // Find pattern name - prefer stored pattern to avoid flickering
           if (workoutExecution.currentPattern) {
             currentPattern = workoutExecution.currentPattern;
           } else if (workoutExecution.workoutData && workoutExecution.workoutData.patterns) {
             const pattern = workoutExecution.workoutData.patterns.find(p =>
               p.entries && p.entries.some(e => e.id === activeEvent.data.entry.id)
             );
             if (pattern) {
               currentPattern = pattern.name;
               workoutExecution.currentPattern = pattern.name;
             }
           }
         }
         else if (activeEvent && activeEventType === 'message_countdown') {
           const message = activeEvent.data;
           const countdownDuration = message.endTime - message.ttsEndTime;
           const countdownElapsed = currentTime - message.ttsEndTime;

           if (countdownDuration > 1.0) {
             // Delay countdown display to sync with TTS (add ~0.8s delay)
             const adjustedRemaining = activeEvent.countdownRemaining + 0.8;
             if (adjustedRemaining > 0) {
               const countdownNumber = Math.round(adjustedRemaining);
               shotTitle = `${countdownNumber}`;
               ensureTextVisible(); // Make sure countdown text is visible

               // Add pulse effect for numbers 10 and lower
               const shotTitleElement = document.getElementById("workoutShotTitle");
               if (shotTitleElement) {
                 if (countdownNumber <= 10) {
                   // Check if this is a new digit (different from last displayed)
                   if (countdownNumber !== workoutExecution.lastCountdownNumber) {
                     // Remove any existing animation first
                     shotTitleElement.classList.remove("countdown-pulse");

                     // Force a reflow to ensure the animation can restart
                     shotTitleElement.offsetHeight;

                     // Add the animation class
                     shotTitleElement.classList.add("countdown-pulse");

                     // Remove the class after animation completes (250ms)
                     setTimeout(() => {
                       shotTitleElement.classList.remove("countdown-pulse");
                     }, 250);

                     // Store the current number to detect changes
                     workoutExecution.lastCountdownNumber = countdownNumber;
                   }
                 } else {
                   shotTitleElement.classList.remove("countdown-pulse");
                   workoutExecution.lastCountdownNumber = null;
                 }
               }
             } else {
               shotTitle = "";
               // Remove pulse effect when countdown ends
               const shotTitleElement = document.getElementById("workoutShotTitle");
               if (shotTitleElement) {
                 shotTitleElement.classList.remove("countdown-pulse");
               }
               workoutExecution.lastCountdownNumber = null;
             }
             progressText = ""; // Remove smaller text

             // Progress meter ascends from 0% to 100% during countdown
             const countdownProgress = countdownElapsed / countdownDuration;
             progressPercentage = Math.min(Math.max(countdownProgress * 100, 0), 100);
           } else {
             // Very short countdown, just show message completion
             shotTitle = message.text || "Message";
             ensureTextVisible(); // Make sure message completion text is visible
             progressText = ""; // Remove smaller text
             progressPercentage = 100;
           }
           progressPhase = "message";

           // Find pattern name - prefer stored pattern to avoid flickering
           if (workoutExecution.currentPattern) {
             currentPattern = workoutExecution.currentPattern;
           } else if (workoutExecution.workoutData && workoutExecution.workoutData.patterns) {
             const pattern = workoutExecution.workoutData.patterns.find(p =>
               p.entries && p.entries.some(e => e.id === message.entry.id)
             );
             if (pattern) {
               currentPattern = pattern.name;
               workoutExecution.currentPattern = pattern.name;
             }
           }
         }
         else if (activeEvent && activeEventType === 'shot_preparing') {
           const shot = activeEvent.data;
           shotTitle = shot.name || "Shot";
           ensureTextVisible(); // Make sure shot text is visible during preparation

           const prepareProgress = (currentTime - shot.ttsTime) / (shot.beepTime - shot.ttsTime);
           // Progress meter ascends from 0% to 100%
           progressPercentage = Math.min(Math.max(prepareProgress * 100, 0), 100);

           // No glow effect in preparing phase anymore

           progressText = ""; // Remove smaller text
           progressPhase = "preparing";

           // Find pattern name
           if (workoutExecution.workoutData && workoutExecution.workoutData.patterns) {
             const pattern = workoutExecution.workoutData.patterns.find(p =>
               p.entries && p.entries.some(e => e.id === shot.entry.id)
             );
             if (pattern) {
               currentPattern = pattern.name;
               workoutExecution.currentPattern = pattern.name; // Store for persistence
             }
           }
         }
         else if (activeEvent && activeEventType === 'shot_executing') {
           const shot = activeEvent.data;
           progressText = ""; // Remove smaller text

           const timeSinceBeep = currentTime - shot.beepTime;
           const pauseDuration = 0.2; // 0.2 second pause at 100%

           if (timeSinceBeep <= pauseDuration) {
             // Pause at 100% for 0.2 seconds
             progressPercentage = 100;
             shotTitle = shot.name || "Shot"; // Keep shot name during pause
             ensureTextVisible(); // Make sure shot text is visible during beep pause

             // Trigger glow effect on shot text when beep first hits
             if (timeSinceBeep <= 0.05 && !workoutExecution.glowTriggered) {
               const shotTitleElement = document.getElementById("workoutShotTitle");
               if (shotTitleElement) {
                 shotTitleElement.classList.add("glow-pulse");
                 workoutExecution.glowTriggered = true;

                 // Remove glow after animation
                 setTimeout(() => {
                   shotTitleElement.classList.remove("glow-pulse");
                 }, 250);
               }
             }
                        } else {
               // Descend from 100% to 0% for the remaining time
               // Find next shot to time the descent
               const timelineData = workoutExecution.timelineIndex;
               const nextShot = timelineData ? timelineData.shots.find(s => s.ttsTime > shot.ttsTime) : null;

               if (nextShot) {
                 const descentStartTime = shot.beepTime + pauseDuration;
                 const descentDuration = nextShot.ttsTime - descentStartTime;
                 if (descentDuration > 0) {
                   const descentProgress = (currentTime - descentStartTime) / descentDuration;
                   progressPercentage = Math.min(Math.max(100 - (descentProgress * 100), 0), 100);
                 } else {
                   progressPercentage = 0; // Next shot is too close, go to 0%
                 }

                 // Reset glow trigger for next shot when getting close
                 if (progressPercentage < 20) {
                   workoutExecution.glowTriggered = false;
                 }
               } else {
                 // No next shot - this is the last shot, mark as complete when execution ends
                 const remainingTime = shot.endTime - (shot.beepTime + pauseDuration);
                 if (remainingTime > 0) {
                   const descentProgress = (timeSinceBeep - pauseDuration) / remainingTime;
                   progressPercentage = Math.min(Math.max(100 - (descentProgress * 100), 0), 100);

                   // Check if last shot execution is complete
                   if (currentTime >= shot.endTime && !workoutExecution.lastShotCompleted) {
                     workoutExecution.lastShotCompleted = true;
                   }
                 } else {
                   progressPercentage = 0; // No time left, go to 0%
                   workoutExecution.lastShotCompleted = true; // Mark as complete
                 }
               }

             // Smoothly fade out shot title when progress meter descends to 50%
             if (progressPercentage <= 50) {
               if (!workoutExecution.fadeTriggered) {
                 const shotTitleElement = document.getElementById("workoutShotTitle");
                 if (shotTitleElement) {
                   shotTitleElement.classList.add("fade-out");
                   workoutExecution.fadeTriggered = true;
                 }
               }
               shotTitle = "\u00A0"; // Non-breaking space to maintain layout
             } else {
               shotTitle = shot.name || "Shot";
               ensureTextVisible(); // Make sure shot text is visible before fade threshold
             }
           }

           progressPhase = "executing";

           // Find pattern name - use stored pattern for consistency
           if (workoutExecution.currentPattern) {
             currentPattern = workoutExecution.currentPattern;
           } else if (workoutExecution.workoutData && workoutExecution.workoutData.patterns) {
             const pattern = workoutExecution.workoutData.patterns.find(p =>
               p.entries && p.entries.some(e => e.id === shot.entry.id)
             );
             if (pattern) {
               currentPattern = pattern.name;
               workoutExecution.currentPattern = pattern.name;
             }
           }
         }
         else {
           // No active event - show invisible placeholder to maintain UI layout
           activeEventType = null;
           shotTitle = "\u00A0"; // Non-breaking space - invisible but maintains layout
           progressText = ""; // Remove smaller text
           progressPercentage = 0;
           progressPhase = "ready";

           // Maintain current pattern to avoid flickering
           if (workoutExecution.currentPattern) {
             currentPattern = workoutExecution.currentPattern;
           }
         }
      }
    }

    // Update UI elements with stability check
    const shotTitleElement = document.getElementById("workoutShotTitle");
    const patternElement = document.getElementById("workoutCurrentPattern");
    const progressTextElement = document.getElementById("workoutShotProgressText");

    // Only update if content actually changed to prevent flicker
    if (shotTitleElement.textContent !== shotTitle) {
      shotTitleElement.textContent = shotTitle;
    }

    // Remove pulse effect when not in countdown mode
    if (activeEventType !== 'message_countdown') {
      shotTitleElement.classList.remove("countdown-pulse");
      workoutExecution.lastCountdownNumber = null;
    }
    if (patternElement.textContent !== currentPattern) {
      patternElement.textContent = currentPattern;
    }
    // Hide progress text element completely
    if (progressTextElement.textContent !== "") {
      progressTextElement.textContent = "";
    }

    // Update progress bar
    const progressBar = document.getElementById("workoutShotProgressBar");
    progressBar.style.setProperty('--progress', `${progressPercentage}%`);

    // Track changes for stability
    const progressChanged = Math.abs(progressPercentage - (workoutExecution.lastProgress || 0)) > 5;
    if ((shotTitle && shotTitle !== workoutExecution.lastShotTitle) || progressChanged) {
      workoutExecution.lastShotTitle = shotTitle;
      workoutExecution.lastProgress = progressPercentage;
    }

    // Save progress percentage for next frame
    workoutExecution.lastProgressPercentage = progressPercentage;

    // Update progress bar color based on phase
    let bgPosition = 0;
    if (progressPhase === "preparing") {
      // For ascending progress (0% to 100%), normal color mapping
      // When progress is 0% (start), show green (bgPosition 0%)
      // When progress is 100% (end), show red (bgPosition 100%)
      bgPosition = progressPercentage;
    } else if (progressPhase === "executing") {
      // For executing phase, match the progress percentage
      // During pause (100%), stays red
      // During descent (100% to 0%), goes from red to green
      bgPosition = progressPercentage;
    } else if (progressPhase === "message") {
      if (activeEventType === 'message_countdown') {
        // For countdown, use ascending logic (0% to 100%)
        // When progress is 0% (start), show green (bgPosition 0%)
        // When progress is 100% (end), show red (bgPosition 100%)
        bgPosition = progressPercentage;
      } else {
        // For TTS, don't change colors, keep previous color
        bgPosition = workoutExecution.lastBgPosition || 0;
      }
    } else if (progressPhase === "complete") {
      bgPosition = 0; // Green for completion
    } else {
      bgPosition = 0; // Green for ready state
    }

    // Save background position for next frame
    workoutExecution.lastBgPosition = bgPosition;

    progressBar.style.setProperty('--bg-position', `${bgPosition}%`);
  }

  function calculateMessageDuration(entryConfig) {
    // Use the existing WorkoutLib function
    return WorkoutLib.calculateMessageDuration ?
           WorkoutLib.calculateMessageDuration(entryConfig) :
           parseTimeLimit(entryConfig.interval || "00:03");
  }

  function estimateTTSDuration(message, speechRate = 1.0) {
    // Use the existing WorkoutLib function
    if (WorkoutLib.estimateTTSDuration) {
      return WorkoutLib.estimateTTSDuration(message, speechRate);
    }

    // Fallback estimation
    if (!message || !message.trim()) return 0;

    // Average speaking rate ~150 words per minute
    const wordsPerMinute = 150;
    const wordsInMessage = message.trim().split(/\s+/).length;
    const baseDuration = (wordsInMessage / wordsPerMinute) * 60;

    // Minimum duration for very short messages
    const minimumDuration = Math.max(0.8, wordsInMessage * 0.3);

    return Math.max(baseDuration, minimumDuration) / speechRate;
  }

  function parseTimeLimit(timeLimit) {
    if (typeof timeLimit === 'number') return timeLimit;
    if (typeof timeLimit !== 'string') return 3;

    const parts = timeLimit.split(':');
    if (parts.length !== 2) return 3;

    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;

    return minutes * 60 + seconds;
  }

  function buildTimelineIndex(soundEvents) {
    const shots = [];
    const messages = [];

    // Group events by entry to understand relationships
    const eventsByEntry = new Map();

    soundEvents.forEach(event => {
      if (!event.entry) return;

      const entryId = event.entry.id || `${event.entry.type}_${event.time}`;
      if (!eventsByEntry.has(entryId)) {
        eventsByEntry.set(entryId, {
          entry: event.entry,
          events: []
        });
      }
      eventsByEntry.get(entryId).events.push(event);
    });

    // Process each entry to create timeline segments
    eventsByEntry.forEach((data, entryId) => {
      const { entry, events } = data;

      if (entry.type === 'Shot') {
        const ttsEvent = events.find(e => e.type === 'tts');
        const beepEvent = events.find(e => e.type === 'beep');

        if (ttsEvent && beepEvent) {
          shots.push({
            name: entry.name,
            ttsTime: ttsEvent.time,
            beepTime: beepEvent.time,
            endTime: beepEvent.time + 3.0, // 3 seconds after beep
            entry: entry,
            ttsEvent: ttsEvent,
            beepEvent: beepEvent
          });
        }
      } else if (entry.type === 'Message') {
        const mainTTS = events.find(e => e.type === 'tts' && !e.isCountdown);
        const countdownEvents = events.filter(e => e.type === 'tts' && e.isCountdown);

        if (mainTTS) {
          const messageDuration = calculateMessageDuration(mainTTS.entryConfig);
          const ttsDuration = estimateTTSDuration(mainTTS.text, mainTTS.entryConfig?.speechRate || 1.0);

          messages.push({
            text: mainTTS.text,
            startTime: mainTTS.time,
            ttsEndTime: mainTTS.time + ttsDuration,
            endTime: mainTTS.time + messageDuration,
            countdownEvents: countdownEvents.sort((a, b) => a.time - b.time),
            entry: entry,
            mainTTS: mainTTS
          });
        }
      }
    });

    // Sort by start time
    shots.sort((a, b) => a.ttsTime - b.ttsTime);
    messages.sort((a, b) => a.startTime - b.startTime);

    return { shots, messages };
  }

  function findActiveEvent(currentTime, timelineData) {
    const { shots, messages } = timelineData;

    // Check messages first (they take priority)
    for (const message of messages) {
      if (currentTime >= message.startTime && currentTime < message.endTime) {
        if (currentTime < message.ttsEndTime) {
          // TTS phase
          return {
            type: 'message_tts',
            description: `Message TTS: ${message.text}`,
            message: message,
            data: message
          };
        } else {
          // Countdown phase
          const countdownRemaining = message.endTime - currentTime;
          return {
            type: 'message_countdown',
            description: `Message countdown: ${Math.round(countdownRemaining)}s remaining`,
            message: message,
            data: message,
            countdownRemaining: countdownRemaining
          };
        }
      }
    }

    // Check shots
    for (const shot of shots) {
      if (currentTime >= shot.ttsTime && currentTime < shot.endTime) {
        if (currentTime < shot.beepTime) {
          // Preparing phase
          return {
            type: 'shot_preparing',
            description: `Shot preparing: ${shot.name}`,
            shot: shot,
            data: shot
          };
        } else {
          // Executing phase
          return {
            type: 'shot_executing',
            description: `Shot executing: ${shot.name}`,
            shot: shot,
            data: shot
          };
        }
      }
    }

    return null; // No active event
  }

  function ensureTextVisible() {
    // Helper function to ensure shot text is visible (remove fade-out)
    const shotTitleElement = document.getElementById("workoutShotTitle");
    if (shotTitleElement && shotTitleElement.classList.contains("fade-out")) {
      shotTitleElement.classList.remove("fade-out");
      workoutExecution.fadeTriggered = false;
    }
  }

  function startWorkout() {
    // If workout is already running and not paused, just ensure it's running properly
    if (workoutExecution.isRunning && !workoutExecution.isPaused) {
      // Workout is already running, just update UI and ensure animation is active
      updateWorkoutUI();

      // If animation frame is not active, restart it
      if (!workoutExecution.animationFrame) {
        function animate() {
          if (!workoutExecution.isRunning) return;

          // Check pause state inside the animation loop
          if (workoutExecution.isPaused) {
            // Save current animation frame reference and exit
            if (workoutExecution.animationFrame) {
              cancelAnimationFrame(workoutExecution.animationFrame);
              workoutExecution.animationFrame = null;
            }
            return;
          }

          const elapsed = (performance.now() - workoutExecution.startTime) / 1000;
          workoutExecution.currentTime = elapsed;

          // Process sound events
          processSoundEvents();

          // Update UI
          updateWorkoutUI();

          // Check if workout is complete
          if (workoutExecution.currentTime >= workoutExecution.maxTime) {
            completeWorkout();
            return;
          }

          workoutExecution.animationFrame = requestAnimationFrame(animate);
        }
        animate();
      }
      return;
    }

    // Ensure clean TTS state for fresh start
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      workoutExecution.activeTTSUtterances.clear();
    }

    workoutExecution.isRunning = true;
    workoutExecution.isPaused = false;
    workoutExecution.completionTriggered = false; // Reset completion flag
    workoutExecution.glowTriggered = false; // Reset glow flag
    workoutExecution.fadeTriggered = false; // Reset fade flag
    workoutExecution.isCompleted = false; // Reset completed flag
    workoutExecution.lastShotCompleted = false; // Reset last shot completed flag

    // Show workout main for fresh start
    showWorkoutMain();

    // Set start time to account for any existing elapsed time (for resume functionality)
    workoutExecution.startTime = performance.now() - (workoutExecution.currentTime * 1000);

    // Reinitialize audio context for clean start
    initializeAudioContext();

    updateWorkoutUI();

    function animate() {
      if (!workoutExecution.isRunning) return;

      // Check pause state inside the animation loop
      if (workoutExecution.isPaused) {
        // Save current animation frame reference and exit
        if (workoutExecution.animationFrame) {
          cancelAnimationFrame(workoutExecution.animationFrame);
          workoutExecution.animationFrame = null;
        }
        return;
      }

      const elapsed = (performance.now() - workoutExecution.startTime) / 1000;
      workoutExecution.currentTime = elapsed;

      // Process sound events
      processSoundEvents();

      // Update UI
      updateWorkoutUI();

      // Check if workout is complete
      if (workoutExecution.currentTime >= workoutExecution.maxTime) {
        completeWorkout();
        return;
      }

      workoutExecution.animationFrame = requestAnimationFrame(animate);
    }

    animate();
  }

  function pauseWorkout() {
    if (!workoutExecution.isRunning || workoutExecution.isPaused) return;

    workoutExecution.isPaused = true;

    // Cancel animation frame
    if (workoutExecution.animationFrame) {
      cancelAnimationFrame(workoutExecution.animationFrame);
      workoutExecution.animationFrame = null;
    }

    // Cancel ongoing TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      workoutExecution.activeTTSUtterances.clear();
    }

    updateWorkoutUI();
  }

  function resumeWorkout() {
    if (!workoutExecution.isRunning || !workoutExecution.isPaused) return;

    workoutExecution.isPaused = false;

    // Restart the timing from current position
    workoutExecution.startTime = performance.now() - (workoutExecution.currentTime * 1000);

    updateWorkoutUI();

    // Restart animation loop
    function animate() {
      if (!workoutExecution.isRunning) return;

      if (workoutExecution.isPaused) {
        if (workoutExecution.animationFrame) {
          cancelAnimationFrame(workoutExecution.animationFrame);
          workoutExecution.animationFrame = null;
        }
        return;
      }

      const elapsed = (performance.now() - workoutExecution.startTime) / 1000;
      workoutExecution.currentTime = elapsed;

      // Process sound events
      processSoundEvents();

      // Update UI
      updateWorkoutUI();

      // Check if workout is complete
      if (workoutExecution.currentTime >= workoutExecution.maxTime) {
        completeWorkout();
        return;
      }

      workoutExecution.animationFrame = requestAnimationFrame(animate);
    }

    animate();
  }

  function stopWorkout() {
    workoutExecution.isRunning = false;
    workoutExecution.isPaused = false;
    workoutExecution.currentTime = 0;
    workoutExecution.shotsCompleted = 0;
    workoutExecution.playedSounds.clear();
    workoutExecution.completionTriggered = false;
    workoutExecution.glowTriggered = false;
    workoutExecution.fadeTriggered = false;
    workoutExecution.currentPattern = null;
    workoutExecution.isCompleted = false;
    workoutExecution.lastShotCompleted = false;

    if (workoutExecution.animationFrame) {
      cancelAnimationFrame(workoutExecution.animationFrame);
      workoutExecution.animationFrame = null;
    }

    // Cancel ongoing TTS
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      workoutExecution.activeTTSUtterances.clear();
    }

    updateWorkoutUI();
  }

  function completeWorkout() {
    workoutExecution.isRunning = false;
    workoutExecution.isPaused = false;

    if (workoutExecution.animationFrame) {
      cancelAnimationFrame(workoutExecution.animationFrame);
      workoutExecution.animationFrame = null;
    }

    // Don't play additional TTS - the timeline already has "Workout complete" event
    updateWorkoutUI();

    // Hide workout-main immediately after completion
    hideWorkoutMain();
  }

  function hideWorkoutMain() {
    const workoutMainElement = document.querySelector(".workout-main");
    if (workoutMainElement) {
      workoutMainElement.style.display = "none";
    }
  }



  function showWorkoutMain() {
    const workoutMainElement = document.querySelector(".workout-main");
    if (workoutMainElement) {
      workoutMainElement.style.display = "";

      // Reset UI elements to initial state
      const shotTitleElement = document.getElementById("workoutShotTitle");
      const progressBarElement = document.getElementById("workoutShotProgressBar");
      const progressTextElement = document.getElementById("workoutShotProgressText");
      const patternElement = document.getElementById("workoutCurrentPattern");
      const shotsCounterElement = document.getElementById("workoutShotsCounter");

      if (shotTitleElement) {
        shotTitleElement.innerHTML = "&nbsp;"; // Use non-breaking space to maintain layout
        shotTitleElement.classList.remove("glow-pulse", "countdown-pulse", "fade-out");
      }
      if (progressBarElement) {
        progressBarElement.style.setProperty('--progress', '0%');
      }
      if (progressTextElement) {
        progressTextElement.textContent = "Ready";
      }
      if (patternElement) {
        patternElement.textContent = "--";
      }
      if (shotsCounterElement) {
        shotsCounterElement.textContent = "0 / 0";
      }
    }
  }

  function processSoundEvents() {
    const { currentTime, soundEvents, playedSounds } = workoutExecution;

    soundEvents.forEach(soundEvent => {
      const tolerance = 0.05;
      const isEventTime = Math.abs(currentTime - soundEvent.time) < tolerance;

      if (isEventTime) {
        const soundKey = `${soundEvent.type}-${soundEvent.time.toFixed(3)}`;

        if (!playedSounds.has(soundKey)) {
          if (soundEvent.type === 'splitStep') {
            playSplitStepPowerUp(soundEvent.speed);
            playedSounds.add(soundKey);
          } else if (soundEvent.type === 'beep') {
            playTwoToneBeep();
            triggerWorkoutFlash();
            playedSounds.add(soundKey);

            // Count completed shots and flip ghost (only for shot beeps, not countdown beeps)
            if (soundEvent.entry && soundEvent.entry.type === 'Shot' && !soundEvent.isCountdown) {
              workoutExecution.shotsCompleted++;

              // Flip ghost at the end of shot intervals
              const statusIndicator = document.getElementById("workoutStatusIndicator");
              if (statusIndicator) {
                const wasFlipped = statusIndicator.classList.contains("flipped");
                statusIndicator.classList.toggle("flipped");
                const isNowFlipped = statusIndicator.classList.contains("flipped");
              }
            }
          } else if (soundEvent.type === 'tts') {
            playTTS(soundEvent.text, soundEvent.entryConfig);
            playedSounds.add(soundKey);
          }
        }
      }
    });
  }

  function triggerWorkoutFlash() {
    const mainContent = document.querySelector('#workoutModal .flex-1');
    if (mainContent) {
      mainContent.classList.add('workout-flash');
      setTimeout(() => {
        mainContent.classList.remove('workout-flash');
      }, 300);
    }

    // Add mobile-specific background flash effect (copied from squash-ghost app)
    if (isMobileDevice()) {
      // Get theme-aware glow color (same as text glow)
      const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";
      const glowColor = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(239, 68, 68, 0.8)';

      // Create a bright flash overlay that covers the entire screen (like squash-ghost app)
      const flashOverlay = document.createElement('div');
      flashOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: ${glowColor};
        z-index: 99999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.1s ease-out;
      `;

      document.body.appendChild(flashOverlay);

      // Trigger the flash effect - simple fade in/out like squash-ghost app
      requestAnimationFrame(() => {
        flashOverlay.style.opacity = '1';
        setTimeout(() => {
          flashOverlay.style.opacity = '0';
          setTimeout(() => {
            if (flashOverlay.parentNode) {
              flashOverlay.parentNode.removeChild(flashOverlay);
            }
          }, 100);
        }, 100);
      });
    }
  }

  // --- Initial Load ---
  // Load a default workout from file on initial page load
  fetch("default.workout.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      loadWorkout(data);
    })
    .catch((e) => {
      console.error("Error loading default workout:", e);
      // If loading fails, create a default empty pattern
      createPatternInstance();
    });

  /**
   * Finds the correct insertion position for a cloned element, considering linked groups and position locks.
   *
   * Logic:
   * - The clone should be inserted after the source element (or its linked group),
   *   but before the first position-locked element that follows.
   * - If there are no position-locked elements after the source group, the clone is appended at the end.
   *
   * Examples:
   *   1 2 3 l l 4 5, clone 3 => 1 2 3 l l 3' 4 5
   *   1 2 3 l l 4 5, clone 2 => 1 2 2' l l 3 4 5
   *   1 2 3 l l 4 5, clone L => 1 2 l l 3 4 5 L' L
   *   1 2 l 3 4 l 5, clone 2 => 1 2 2' l 3 4 l 5
   *   l 1 2 l 4 L, clone first l => l l' 1 2 l 4 L
   *
   * @param {HTMLElement} sourceElement The element being cloned.
   * @param {HTMLElement} container The container holding all instances.
   * @returns {HTMLElement|null} The element to insert before, or null to append at end.
   */
  function findCloneInsertionPosition(sourceElement, container) {
    const siblings = Array.from(
      container.querySelectorAll(".shot-msg-instance"),
    );
    const sourceIndex = siblings.indexOf(sourceElement);

    if (sourceIndex === -1) return null;

    // Get the linked group of the source element
    const sourceGroup = getLinkedGroup(sourceElement, mainContainer);
    const lastGroupElement = sourceGroup[sourceGroup.length - 1];
    const lastGroupIndex = siblings.indexOf(lastGroupElement);

    // Look for the first position-locked element after the group
    for (let i = lastGroupIndex + 1; i < siblings.length; i++) {
      if (siblings[i].dataset.positionLocked === "true") {
        return siblings[i];
      }
    }
    // Otherwise, append at the end
    return null;
  }

  /**
   * Checks if a specific element has non-default settings.
   * Now uses hierarchical inheritance system to check for explicitly customized properties.
   * @param {Element} element - The element to check (pattern or shot only)
   * @returns {boolean} True if the element has explicitly customized settings
   */
  function hasNonDefaultSettings(element) {
    // Use hierarchical inheritance system to check for explicitly customized properties
    // This ensures rocket indicators only appear for truly customized settings, not inherited values

    // Check all inheritable properties for explicit customization flags
    for (const property of Object.keys(INHERITABLE_PROPERTIES)) {
      if (hasCustomizedProperty(element, property)) {
        return true;
      }
    }

    // Also check non-inheritable properties that should still show rocket indicators
    const defaults = getDefaultConfigValues();

    if (element.classList.contains("pattern-instance")) {
      // Check pattern-only non-inheritable settings
      const patternIterationType = element.querySelector(".iteration-type-select")?.value;
      const patternLimitsType = element.querySelector(".limits-type-select")?.value;
      const patternShotLimit = element.querySelector(".shot-limit-slider")?.value;
      const patternTimeLimit = element.querySelector(".time-limit-slider")?.value;

      if (patternIterationType !== defaults.iterationType) return true;
      if (patternLimitsType !== defaults.limitsType) return true;
      if (patternLimitsType === "shot-limit" && patternShotLimit !== defaults.shotLimit) return true;
      if (patternLimitsType === "time-limit" && patternTimeLimit !== defaults.timeLimit) return true;
    } else if (element.classList.contains("shot-instance")) {
      // Check shot-only non-inheritable settings
      // Note: offset and split-step are now part of the hierarchical inheritance system
      const offsetEnabled = element.querySelector(".offset-enabled")?.checked;
      const offsetFixed = element.querySelector(".offset-fixed-slider")?.value;
      const offsetMax = element.querySelector(".offset-random-maximum-slider")?.value;
      const offsetMin = element.querySelector(".offset-random-minimum-slider")?.value;
      const splitStepEnabled = element.querySelector(".split-step-enabled")?.checked;

      // Only check non-inheritable offset/split-step properties
      if (offsetEnabled !== defaults.offset.enabled) return true;
      if (offsetEnabled) {
        if (offsetFixed !== defaults.offset.fixedValue) return true;
        if (offsetMax !== defaults.offset.randomMaximum) return true;
        if (offsetMin !== defaults.offset.randomMinimum) return true;
      }
      if (splitStepEnabled !== defaults.splitStep.enabled) return true;
    }

    // Messages never get rocket indicators
    return false;
  }

  /**
   * Gets a list of non-default settings for an element with their current values.
   * @param {Element} element - The element to check
   * @returns {Array} Array of objects with setting name and value
   */
  function getNonDefaultSettingsList(element) {
    const defaults = getDefaultConfigValues();
    const nonDefaultSettings = [];

    if (element.classList.contains("pattern-instance")) {
      // Check pattern-level settings
      const patternIterationType = element.querySelector(
        ".iteration-type-select",
      )?.value;
      const patternLimitsType = element.querySelector(
        ".limits-type-select",
      )?.value;
      const patternShotLimit =
        element.querySelector(".shot-limit-slider")?.value;
      const patternTimeLimit =
        element.querySelector(".time-limit-slider")?.value;

      if (patternIterationType !== defaults.iterationType) {
        nonDefaultSettings.push({
          name: "Iteration Type",
          value: patternIterationType,
        });
      }
      if (patternLimitsType !== defaults.limitsType) {
        nonDefaultSettings.push({
          name: "Limits Type",
          value:
            patternLimitsType === "shot-limit"
              ? "Shot Limit"
              : patternLimitsType === "time-limit"
                ? "Time Limit"
                : "No Limits",
        });
      }
      if (
        patternLimitsType === "shot-limit" &&
        patternShotLimit !== defaults.shotLimit
      ) {
        nonDefaultSettings.push({
          name: "Shot Limit",
          value: `${patternShotLimit} shots`,
        });
      }
      if (
        patternLimitsType === "time-limit" &&
        patternTimeLimit !== defaults.timeLimit
      ) {
        const minutes = Math.floor(parseInt(patternTimeLimit) / 60);
        const seconds = parseInt(patternTimeLimit) % 60;
        const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
        nonDefaultSettings.push({
          name: "Time Limit",
          value: `${minutes}:${formattedSeconds}`,
        });
      }

      // Check pattern voice settings
      const patternVoiceEnabled =
        element.querySelector(".voice-enabled")?.checked;
      const patternVoice = element.querySelector(".voice-select")?.value;
      const patternVoiceRate =
        element.querySelector(".voice-rate-select")?.value;

      if (patternVoiceEnabled !== defaults.voice.enabled) {
        nonDefaultSettings.push({
          name: "Voice",
          value: patternVoiceEnabled ? "Enabled" : "Disabled",
        });
      }
      if (patternVoiceEnabled && patternVoice !== defaults.voice.voiceName) {
        nonDefaultSettings.push({
          name: "Voice Name",
          value: patternVoice,
        });
      }
      if (patternVoiceEnabled && patternVoiceRate !== defaults.voice.rate) {
        nonDefaultSettings.push({
          name: "Voice Rate",
          value: patternVoiceRate,
        });
      }
    } else if (element.classList.contains("shot-instance")) {
      // Check shot-specific settings
      const shotInterval = element.querySelector(
        ".shot-interval-slider",
      )?.value;
      const shotLeadTime = element.querySelector(".lead-time-slider")?.value;

      if (shotInterval !== defaults.shotInterval) {
        nonDefaultSettings.push({
          name: "Shot Interval",
          value: `${parseFloat(shotInterval).toFixed(1)}s`,
        });
      }
      if (shotLeadTime !== defaults.leadTime) {
        nonDefaultSettings.push({
          name: "Lead Time",
          value: `${parseFloat(shotLeadTime).toFixed(1)}s`,
        });
      }

      // Check shot offset settings
      const offsetEnabled = element.querySelector(".offset-enabled")?.checked;
      const offsetType = element.querySelector(".offset-type-select")?.value;
      const offsetFixed = element.querySelector(".offset-fixed-slider")?.value;
      const offsetMax = element.querySelector(
        ".offset-random-maximum-slider",
      )?.value;
      const offsetMin = element.querySelector(
        ".offset-random-minimum-slider",
      )?.value;

      if (offsetEnabled !== defaults.offset.enabled) {
        nonDefaultSettings.push({
          name: "Offset",
          value: offsetEnabled ? "Enabled" : "Disabled",
        });
      }
      if (offsetEnabled) {
        if (offsetType !== defaults.offset.type) {
          nonDefaultSettings.push({
            name: "Offset Type",
            value: offsetType === "fixed" ? "Fixed" : "Random",
          });
        }
        if (offsetType === "fixed" && offsetFixed !== defaults.offset.fixedValue) {
          nonDefaultSettings.push({
            name: "Offset Fixed Value",
            value: `${parseFloat(offsetFixed).toFixed(1)}s`,
          });
        }
        if (offsetType === "random") {
          if (offsetMax !== defaults.offset.randomMaximum) {
            nonDefaultSettings.push({
              name: "Offset Random Maximum",
              value: `${parseFloat(offsetMax).toFixed(1)}s`,
            });
          }
          if (offsetMin !== defaults.offset.randomMinimum) {
            nonDefaultSettings.push({
              name: "Offset Random Minimum",
              value: `${parseFloat(offsetMin).toFixed(1)}s`,
            });
          }
        }
      }

      // Check shot split-step settings
      const splitStepEnabled = element.querySelector(
        ".split-step-enabled",
      )?.checked;
      const splitStepSpeed = element.querySelector(
        ".split-step-speed-select",
      )?.value;

      if (splitStepEnabled !== defaults.splitStep.enabled) {
        nonDefaultSettings.push({
          name: "Split Step",
          value: splitStepEnabled ? "Enabled" : "Disabled",
        });
      }
      if (splitStepEnabled && splitStepSpeed !== defaults.splitStep.rate) {
        nonDefaultSettings.push({
          name: "Split Step Speed",
          value: splitStepSpeed,
        });
      }

      // Check shot voice settings
      const voiceEnabled = element.querySelector(".voice-enabled")?.checked;
      const voice = element.querySelector(".voice-select")?.value;
      const voiceRate = element.querySelector(".voice-rate-select")?.value;

      if (voiceEnabled !== defaults.voice.enabled) {
        nonDefaultSettings.push({
          name: "Voice",
          value: voiceEnabled ? "Enabled" : "Disabled",
        });
      }
      if (voiceEnabled && voice !== defaults.voice.voiceName) {
        nonDefaultSettings.push({
          name: "Voice Name",
          value: voice,
        });
      }
      if (voiceEnabled && voiceRate !== defaults.voice.rate) {
        nonDefaultSettings.push({
          name: "Voice Rate",
          value: voiceRate,
        });
      }
    }

    return nonDefaultSettings;
  }

  /**
   * Toggles the rocket indicator dropdown.
   * @param {Event} event - The click event
   * @param {Element} rocketIndicator - The rocket indicator element
   * @param {Element} header - The accordion header element
   */
  function toggleRocketIndicatorDropdown(event, rocketIndicator, header) {
    event.stopPropagation();

    const dropdown = header.querySelector(".rocket-indicator-dropdown");
    if (!dropdown) return;

    const isActive = dropdown.classList.contains("active");

    // Close all other dropdowns first (both rocket and settings dropdowns)
    document
      .querySelectorAll(".rocket-indicator-dropdown.active")
      .forEach((d) => {
        if (d !== dropdown) {
          d.classList.remove("active");
          // Remove tabindex to prevent focus
          d.removeAttribute("tabindex");
          // Ensure all child elements lose focus
          d.querySelectorAll("*").forEach((child) => {
            if (child !== d) {
              child.blur();
            }
          });
        }
      });
    document.querySelectorAll(".settings-panel.active").forEach((panel) => {
      panel.classList.remove("active");
      // Remove tabindex to prevent focus
      panel.removeAttribute("tabindex");
      // Ensure all child elements lose focus
      panel.querySelectorAll("*").forEach((child) => {
        if (child !== panel) {
          child.blur();
        }
      });
    });

    if (!isActive) {
      dropdown.classList.add("active");

      // Add focus handling
      dropdown.setAttribute("tabindex", "-1");
      dropdown.focus();

      // Add blur handler
      const handleBlur = (e) => {
        // Check if the new focus target is inside the dropdown
        if (!dropdown.contains(e.relatedTarget)) {
          dropdown.classList.remove("active");
          dropdown.removeAttribute("tabindex");
          // Ensure all child elements lose focus
          dropdown.querySelectorAll("*").forEach((child) => {
            if (child !== dropdown) {
              child.blur();
            }
          });
          dropdown.removeEventListener("blur", handleBlur);
        }
      };
      dropdown.addEventListener("blur", handleBlur);
    } else {
      dropdown.classList.remove("active");
      dropdown.removeAttribute("tabindex");
      // Ensure all child elements lose focus
      dropdown.querySelectorAll("*").forEach((child) => {
        if (child !== dropdown) {
          child.blur();
        }
      });
    }
  }

  /**
   * Gets the submenu class for a given setting name.
   * @param {string} settingName - The name of the setting
   * @returns {string} The submenu class name
   */
  function getSubmenuForSetting(settingName) {
    const settingToSubmenuMap = {
      // Pattern settings
      "Iteration Type": null, // No submenu, just a select
      "Limits Type": null, // No submenu, just a select
      "Shot Limit": null, // No submenu, just a slider
      "Time Limit": null, // No submenu, just a slider
      Voice: "voice-submenu",
      "Voice Name": "voice-submenu",
      "Voice Rate": "voice-submenu",

      // Shot settings
      "Shot Interval": "shot-interval-offset-submenu",
      "Lead Time": "voice-submenu", // Lead time is in the voice submenu
      Offset: "shot-interval-offset-submenu",
      "Offset Type": "shot-interval-offset-submenu",
      "Offset Fixed Value": "shot-interval-offset-submenu",
      "Offset Random Positive": "shot-interval-offset-submenu",
      "Offset Random Negative": "shot-interval-offset-submenu",
      "Split Step": "split-step-submenu",
      "Split Step Speed": "split-step-submenu",
    };

    return settingToSubmenuMap[settingName] || null;
  }

  /**
   * Opens the ellipse dropdown and navigates to the appropriate submenu for a setting.
   * @param {Element} element - The element containing the setting
   * @param {Element} header - The accordion header element
   * @param {string} settingName - The name of the setting
   */
  function openSettingSubmenu(element, header, settingName) {
    const submenuClass = getSubmenuForSetting(settingName);

    // First, ensure the rocket dropdown is properly closed
    const rocketDropdown = header.querySelector(".rocket-indicator-dropdown");
    if (rocketDropdown) {
      rocketDropdown.classList.remove("active");
    }

    if (!submenuClass) {
      // For settings without submenus, just open the main settings dropdown
      const settingsBtn = header.querySelector(".settings-btn");
      if (settingsBtn) {
        settingsBtn.click();
      }
      return;
    }

    // Find the settings panel and main menu content
    const settingsPanel = element.querySelector(".settings-panel");
    const mainMenuContent = settingsPanel?.querySelector(".main-menu-content");

    if (settingsPanel && mainMenuContent) {
      // Open the settings dropdown
      toggleSettingsDropdown(settingsPanel, mainMenuContent);

      // Navigate to the specific submenu
      setTimeout(() => {
        showSettingsSubmenu(settingsPanel, mainMenuContent, submenuClass);
      }, 100);
    }
  }

  /**
   * Restores an element's settings to workout defaults after user confirmation.
   * @param {Element} element - The element to restore
   * @param {Element} header - The accordion header element
   */
  function restoreElementToDefaults(element, header) {
    const defaults = getDefaultConfigValues();
    const elementType = element.classList.contains("pattern-instance")
      ? "Pattern"
      : "Shot";

    // Confirm with user
    if (
      !confirm(
        `Are you sure you want to restore this ${elementType.toLowerCase()} to workout defaults? This will reset all custom settings.`,
      )
    ) {
      return;
    }

    if (element.classList.contains("pattern-instance")) {
      // Restore pattern-level settings
      const patternIterationType = element.querySelector(
        ".iteration-type-select",
      );
      const patternLimitsType = element.querySelector(".limits-type-select");
      const patternShotLimit = element.querySelector(".shot-limit-slider");
      const patternTimeLimit = element.querySelector(".time-limit-slider");
      const patternVoiceEnabled = element.querySelector(".voice-enabled");
      const patternVoice = element.querySelector(".voice-select");
      const patternVoiceRate = element.querySelector(".voice-rate-select");

      if (patternIterationType)
        patternIterationType.value = defaults.iterationType;
      if (patternLimitsType) patternLimitsType.value = defaults.limitsType;
      if (patternShotLimit) patternShotLimit.value = defaults.shotLimit;
      if (patternTimeLimit) patternTimeLimit.value = defaults.timeLimit;
      if (patternVoiceEnabled)
        patternVoiceEnabled.checked = defaults.voice.enabled;
      if (patternVoice) patternVoice.value = defaults.voice.voiceName;
      if (patternVoiceRate) patternVoiceRate.value = defaults.voice.rate;

      // Update UI elements that depend on these values
      if (patternShotLimit && element.querySelector(".shot-limit-value")) {
        element.querySelector(".shot-limit-value").textContent =
          defaults.shotLimit;
      }
      if (patternTimeLimit && element.querySelector(".time-limit-value")) {
        const minutes = Math.floor(parseInt(defaults.timeLimit) / 60);
        const seconds = parseInt(defaults.timeLimit) % 60;
        const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
        element.querySelector(".time-limit-value").textContent =
          `${minutes}:${formattedSeconds}`;
      }

      // Update limits containers visibility
      const shotLimitContainer = element.querySelector(".shot-limit-container");
      const timeLimitContainer = element.querySelector(".time-limit-container");
      if (shotLimitContainer && timeLimitContainer) {
        if (defaults.limitsType === "shot-limit") {
          shotLimitContainer.classList.remove("hidden");
          timeLimitContainer.classList.add("hidden");
        } else if (defaults.limitsType === "time-limit") {
          timeLimitContainer.classList.remove("hidden");
          shotLimitContainer.classList.add("hidden");
        } else {
          shotLimitContainer.classList.add("hidden");
          timeLimitContainer.classList.add("hidden");
        }
      }
    } else if (element.classList.contains("shot-instance")) {
      // Restore shot-specific settings
      const shotInterval = element.querySelector(".shot-interval-slider");
      const shotLeadTime = element.querySelector(".lead-time-slider");
      const offsetEnabled = element.querySelector(".offset-enabled");
      const offsetType = element.querySelector(".offset-type-select");
      const offsetFixed = element.querySelector(".offset-fixed-slider");
      const offsetMax = element.querySelector(".offset-random-maximum-slider");
      const offsetMin = element.querySelector(".offset-random-minimum-slider");
      const splitStepEnabled = element.querySelector(".split-step-enabled");
      const splitStepSpeed = element.querySelector(".split-step-speed-select");
      const voiceEnabled = element.querySelector(".voice-enabled");
      const voice = element.querySelector(".voice-select");
      const voiceRate = element.querySelector(".voice-rate-select");

      if (shotInterval) shotInterval.value = defaults.shotInterval;
      if (shotLeadTime) shotLeadTime.value = defaults.leadTime;
      if (offsetEnabled) offsetEnabled.checked = defaults.offset.enabled;
      if (offsetType) offsetType.value = defaults.offset.type;
      if (offsetFixed) offsetFixed.value = defaults.offset.fixedValue;
      if (offsetMax) offsetMax.value = defaults.offset.randomMaximum;
      if (offsetMin) offsetMin.value = defaults.offset.randomMinimum;
      if (splitStepEnabled)
        splitStepEnabled.checked = defaults.splitStep.enabled;
      if (splitStepSpeed) splitStepSpeed.value = defaults.splitStep.rate;
      if (voiceEnabled) voiceEnabled.checked = defaults.voice.enabled;
      if (voice) voice.value = defaults.voice.voiceName;
      if (voiceRate) voiceRate.value = defaults.voice.rate;

      // Update UI elements that depend on these values
      if (shotInterval && element.querySelector(".shot-interval-value")) {
        element.querySelector(".shot-interval-value").textContent =
          `${parseFloat(defaults.shotInterval).toFixed(1)}s`;
      }
      if (shotLeadTime && element.querySelector(".lead-time-value")) {
        element.querySelector(".lead-time-value").textContent =
          `${parseFloat(defaults.leadTime).toFixed(1)}s`;
      }

      // Update offset controls visibility and labels
      const offsetControlsContainer = element.querySelector(
        ".offset-controls-container",
      );
      const offsetToggleLabel = element.querySelector(".offset-toggle-label");
      if (offsetControlsContainer) {
        if (defaults.offset.enabled) {
          offsetControlsContainer.classList.remove("hidden");
          if (offsetToggleLabel) offsetToggleLabel.textContent = "Offset enabled";
        } else {
          offsetControlsContainer.classList.add("hidden");
          if (offsetToggleLabel) offsetToggleLabel.textContent = "Offset disabled";
        }
      }

      // Update split-step controls visibility
      const splitStepRateContainer = element.querySelector(
        ".split-step-rate-container",
      );
      const splitStepToggleLabel = element.querySelector(
        ".split-step-toggle-label",
      );
      if (splitStepRateContainer) {
        if (defaults.splitStep.enabled) {
          splitStepRateContainer.classList.remove("hidden");
          if (splitStepToggleLabel)
            splitStepToggleLabel.textContent = "Enabled";
        } else {
          splitStepRateContainer.classList.add("hidden");
          if (splitStepToggleLabel)
            splitStepToggleLabel.textContent = "Disabled";
        }
      }

      // Update voice controls visibility
      const voiceOptionsContainer = element.querySelector(
        ".voice-options-container",
      );
      const voiceToggleLabel = element.querySelector(".voice-toggle-label");
      if (voiceOptionsContainer) {
        if (defaults.voice.enabled) {
          voiceOptionsContainer.classList.remove("hidden");
          if (voiceToggleLabel) voiceToggleLabel.textContent = "Enabled";
        } else {
          voiceOptionsContainer.classList.add("hidden");
          if (voiceToggleLabel) voiceToggleLabel.textContent = "Disabled";
        }
      }
    }

    // Close the dropdown
    const dropdown = header.querySelector(".rocket-indicator-dropdown");
    if (dropdown) {
      dropdown.classList.remove("active");
    }

    // Update the rocket indicator (should disappear since no non-default settings)
    updateRocketIndicator(element);
  }

  /**
   * Updates the rocket indicator for an element based on its settings.
   * @param {Element} element - The element to update
   */
  function updateRocketIndicator(element) {
    const header = element.querySelector(
      ".pattern-accordion-header, .shot-header, .message-header",
    );
    if (!header) return;

    let rocketIndicator = header.querySelector(".rocket-indicator");
    const hasNonDefault = hasNonDefaultSettings(element);

    if (hasNonDefault) {
      if (!rocketIndicator) {
        rocketIndicator = document.createElement("div");
        rocketIndicator.className = "rocket-indicator mr-2 flex items-center";

        // Get the non-default settings for the dropdown
        const nonDefaultSettings = getNonDefaultSettingsList(element);
        const elementType = element.classList.contains("pattern-instance")
          ? "Pattern"
          : "Shot";

        // Create dropdown HTML with same structure as settings panel
        const dropdownHtml = `
                            <div class="rocket-indicator-dropdown">
                                <div class="py-1">
                                    <div class="px-4 py-2 text-sm font-medium border-b border-gray-200 cursor-pointer hover:bg-gray-100 restore-defaults-btn text-gray-900 hover:text-gray-900">
                                        Restore workout defaults
                                    </div>
                                    ${nonDefaultSettings
                                      .map(
                                        (setting) => `
                                        <div class="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer setting-item text-gray-900 hover:text-gray-900" data-setting="${setting.name}">
                                            <div class="flex justify-between items-center">
                                                <span>${setting.name}</span>
                                                <span class="text-gray-900">${setting.value}</span>
                                            </div>
                                        </div>
                                    `,
                                      )
                                      .join("")}
                                </div>
                            </div>
                        `;

        rocketIndicator.innerHTML = `
                            <svg class="w-4 h-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 26 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2"/>
                                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0m1 7v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                            </svg>
                        `;

        rocketIndicator.title = "Click to view non-default settings";

        // Add click event listener
        rocketIndicator.addEventListener("click", (event) => {
          toggleRocketIndicatorDropdown(event, rocketIndicator, header);
        });

        // Always insert as the first child of the header
        header.insertBefore(rocketIndicator, header.firstChild);

        // Add the dropdown to the header, not the rocket indicator
        header.insertAdjacentHTML("beforeend", dropdownHtml);

        // Add event listener for the restore button
        const dropdown = header.querySelector(".rocket-indicator-dropdown");
        const restoreBtn = dropdown.querySelector(".restore-defaults-btn");
        if (restoreBtn) {
          restoreBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            restoreElementToDefaults(element, header);
          });
        }

        // Add click handlers for setting items
        const settingItems = dropdown.querySelectorAll(".setting-item");
        settingItems.forEach((item) => {
          item.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            const settingName = item.dataset.setting;
            openSettingSubmenu(element, header, settingName);

            // Close the rocket indicator dropdown
            dropdown.classList.remove("active");
          });
        });
      } else {
        // Update existing dropdown content
        const dropdown = header.querySelector(".rocket-indicator-dropdown");
        if (dropdown) {
          const nonDefaultSettings = getNonDefaultSettingsList(element);

          dropdown.innerHTML = `
                                    <div class="py-1">
                                        <div class="px-4 py-2 text-sm font-medium border-b border-gray-200 cursor-pointer hover:bg-gray-100 restore-defaults-btn text-gray-900 hover:text-gray-900">
                                            Restore workout defaults
                                        </div>
                                        ${nonDefaultSettings
                                          .map(
                                            (setting) => `
                                            <div class="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer setting-item text-gray-900 hover:text-gray-900" data-setting="${setting.name}">
                                                <div class="flex justify-between items-center">
                                                    <span>${setting.name}</span>
                                                    <span class="text-gray-900">${setting.value}</span>
                                                </div>
                                            </div>
                                        `,
                                          )
                                          .join("")}
                                    </div>
                                `;

          // Re-add event listener for the restore button
          const restoreBtn = dropdown.querySelector(".restore-defaults-btn");
          if (restoreBtn) {
            restoreBtn.addEventListener("click", (event) => {
              event.stopPropagation();
              restoreElementToDefaults(element, header);
            });
          }

          // Re-add click handlers for setting items
          const settingItems = dropdown.querySelectorAll(".setting-item");
          settingItems.forEach((item) => {
            item.addEventListener("click", (event) => {
              event.preventDefault();
              event.stopPropagation();
              event.stopImmediatePropagation();
              const settingName = item.dataset.setting;
              openSettingSubmenu(element, header, settingName);

              // Close the rocket indicator dropdown
              dropdown.classList.remove("active");
            });
          });
        }
      }
    } else {
      if (rocketIndicator) {
        rocketIndicator.remove();
      }
      // Also remove the dropdown if it exists
      const dropdown = header.querySelector(".rocket-indicator-dropdown");
      if (dropdown) {
        dropdown.remove();
      }
    }
  }

  /**
   * Updates rocket indicators for all elements.
   */
  function updateAllRocketIndicators() {
    // Update patterns
    document.querySelectorAll(".pattern-instance").forEach((pattern) => {
      updateRocketIndicator(pattern);
    });

    // Update shots only (messages don't get rocket indicators)
    document.querySelectorAll(".shot-instance").forEach((instance) => {
      updateRocketIndicator(instance);
    });
  }

  /**
   * Global click handler to prevent clicks on inactive dropdowns.
   */
  document.addEventListener(
    "click",
    (event) => {
      // Check if the clicked element is inside an inactive dropdown
      const clickedElement = event.target;

      // Check for inactive settings panels - only if the element is actually inside the panel
      const inactiveSettingsPanel = clickedElement.closest(
        ".settings-panel:not(.active)",
      );
      if (
        inactiveSettingsPanel &&
        inactiveSettingsPanel.contains(clickedElement)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }

      // Check for inactive rocket dropdowns - only if the element is actually inside the dropdown
      const inactiveRocketDropdown = clickedElement.closest(
        ".rocket-indicator-dropdown:not(.active)",
      );
      if (
        inactiveRocketDropdown &&
        inactiveRocketDropdown.contains(clickedElement)
      ) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    },
    true,
  ); // Use capture phase to catch events early

  // ============================================================================
  // HIERARCHICAL SETTINGS PROPAGATION SYSTEM
  // ============================================================================

  /**
   * Gets the default value for a specific property
   * @param {string} property - The property name
   * @returns {*} The default value
   */
  function getDefaultValueForProperty(property) {
    const defaults = getDefaultConfigValues();
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return null;

    const keys = propConfig.defaultKey.split('.');
    let value = defaults;
    for (const key of keys) {
      value = value[key];
      if (value === undefined) return null;
    }
    return value;
  }

  /**
   * Gets the effective value for a specific property on an element, considering inheritance
   * @param {Element} element - The element to get the value from
   * @param {string} property - The property name
   * @returns {*} The effective value (inherited or explicit)
   */
  function getEffectiveValueForProperty(element, property) {
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return null;

    const targetElement = element.querySelector(propConfig.selector);
    if (!targetElement) return null;

    // If this element has customized this property, return its value
    if (hasCustomizedProperty(element, property)) {
      if (targetElement.type === 'checkbox') {
        return targetElement.checked;
      } else {
        return targetElement.value;
      }
    }

    // Otherwise, get the value from the parent hierarchy
    if (element.classList.contains('shot-msg-instance')) {
      // For shots/messages, check the parent pattern first
      const parentPattern = element.closest('.pattern-instance');
      if (parentPattern) {
        const parentValue = getEffectiveValueForProperty(parentPattern, property);
        if (parentValue !== null) return parentValue;
      }
    }

    if (element.classList.contains('pattern-instance') || element.classList.contains('shot-msg-instance')) {
      // Check the default config (workout level)
      return getDefaultValueForProperty(property);
    }

    return null;
  }

  /**
   * Checks if a specific element has customized a specific inheritable property
   * @param {Element} element - The element to check
   * @param {string} property - The property name (e.g., 'interval', 'voice')
   * @returns {boolean} True if the element has customized this property
   */
  function hasCustomizedProperty(element, property) {
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return false;

    // Check if this element has been explicitly customized by user interaction
    // This is tracked via data attributes set when user changes values
    const customizedKey = `customized${property.charAt(0).toUpperCase() + property.slice(1)}`;
    return element.dataset[customizedKey] === 'true';
  }

  /**
   * Marks an element as having customized a specific property
   * @param {Element} element - The element to mark
   * @param {string} property - The property name
   */
  function markPropertyAsCustomized(element, property) {
    // Skip marking as customized during initialization or propagation to avoid false positives
    if (isInitializing || isPropagating) {
      return;
    }

    const customizedKey = `customized${property.charAt(0).toUpperCase() + property.slice(1)}`;
    element.dataset[customizedKey] = 'true';
  }

  /**
   * Clears the customization flag for a property on an element
   * @param {Element} element - The element to clear
   * @param {string} property - The property name
   */
  function clearPropertyCustomization(element, property) {
    const customizedKey = `customized${property.charAt(0).toUpperCase() + property.slice(1)}`;
    delete element.dataset[customizedKey];
  }

  /**
   * Clears all customization flags on an element
   * @param {Element} element - The element to clear
   */
  function clearAllCustomizations(element) {
    Object.keys(INHERITABLE_PROPERTIES).forEach(property => {
      clearPropertyCustomization(element, property);
    });
  }

  /**
   * Gets all child elements that have customized a specific property
   * @param {Element} parentElement - The parent element (workout for patterns, pattern for shots)
   * @param {string} property - The property name
   * @param {boolean} includeGrandchildren - Whether to include grandchildren (shots in patterns when changing workout settings)
   * @returns {Array} Array of objects with element and current value
   */
  function getChildrenWithCustomizedProperty(parentElement, property, includeGrandchildren = false) {
    const customizedChildren = [];
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return customizedChildren;

    let directChildren = [];

    if (parentElement === document) {
      // Workout level - get all patterns
      directChildren = Array.from(document.querySelectorAll('.pattern-instance'));
    } else if (parentElement.classList.contains('pattern-instance')) {
      // Pattern level - get all shots/messages in this pattern
      directChildren = Array.from(parentElement.querySelectorAll('.shot-msg-instance'));
    }

    // Check direct children
    directChildren.forEach(child => {
      if (hasCustomizedProperty(child, property)) {
        const currentElement = child.querySelector(propConfig.selector);
        const elementName = getElementDisplayName(child);
        customizedChildren.push({
          element: child,
          name: elementName,
          currentValue: currentElement ? propConfig.formatValue(currentElement.value) : 'Unknown'
        });
      }
    });

    // Check grandchildren if requested (e.g., workout → shot inheritance)
    if (includeGrandchildren && parentElement === document) {
      const patterns = document.querySelectorAll('.pattern-instance');
      patterns.forEach(pattern => {
        const shots = pattern.querySelectorAll('.shot-msg-instance');
        shots.forEach(shot => {
          if (hasCustomizedProperty(shot, property)) {
            const currentElement = shot.querySelector(propConfig.selector);
            const patternName = getElementDisplayName(pattern);
            const shotName = getElementDisplayName(shot);
            const elementName = `${patternName} → ${shotName}`;
            customizedChildren.push({
              element: shot,
              name: elementName,
              currentValue: currentElement ? propConfig.formatValue(currentElement.value) : 'Unknown'
            });
          }
        });
      });
    }

    return customizedChildren;
  }

  /**
   * Gets a display name for an element
   * @param {Element} element - The element
   * @returns {string} The display name
   */
  function getElementDisplayName(element) {
    if (element.classList.contains('pattern-instance')) {
      const titleInput = element.querySelector('.pattern-panel-title');
      return titleInput ? titleInput.value || 'Unnamed Pattern' : 'Pattern';
    } else if (element.classList.contains('shot-instance')) {
      const titleInput = element.querySelector('.shot-title-input');
      return titleInput ? titleInput.value || 'Unnamed Shot' : 'Shot';
    } else if (element.classList.contains('message-instance')) {
      const titleInput = element.querySelector('.message-title-input');
      return titleInput ? titleInput.value || 'Unnamed Message' : 'Message';
    }
    return 'Element';
  }

  /**
   * Propagates a setting value to child elements
   * @param {Element} parentElement - The parent element (workout for patterns, pattern for shots)
   * @param {string} property - The property name
   * @param {*} newValue - The new value to propagate
   * @param {Array} elementsToUpdate - Optional array of specific elements to update
   * @param {boolean} includeGrandchildren - Whether to include grandchildren
   */
  function propagateSettingToChildren(parentElement, property, newValue, elementsToUpdate = null, includeGrandchildren = false) {
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return;

    let targetElements = [];

    if (elementsToUpdate) {
      // Update only specified elements
      targetElements = elementsToUpdate;
    } else {
      // Update all children that don't have custom values
      let directChildren = [];

      if (parentElement === document) {
        directChildren = Array.from(document.querySelectorAll('.pattern-instance'));
      } else if (parentElement.classList.contains('pattern-instance')) {
        directChildren = Array.from(parentElement.querySelectorAll('.shot-msg-instance'));
      }

      // Add children that don't have custom values
      directChildren.forEach(child => {
        if (!hasCustomizedProperty(child, property)) {
          targetElements.push(child);
        }
      });

      // Add grandchildren if requested
      if (includeGrandchildren && parentElement === document) {
        const patterns = document.querySelectorAll('.pattern-instance');
        patterns.forEach(pattern => {
          const shots = pattern.querySelectorAll('.shot-msg-instance');
          shots.forEach(shot => {
            if (!hasCustomizedProperty(shot, property)) {
              targetElements.push(shot);
            }
          });
        });
      }
    }

    // Update the target elements
    targetElements.forEach(element => {
      updateElementProperty(element, property, newValue);
    });
  }

  /**
   * Updates a specific property on an element
   * @param {Element} element - The element to update
   * @param {string} property - The property name
   * @param {*} newValue - The new value
   * @param {boolean} clearCustomization - Whether to clear customization flag (default true)
   */
  function updateElementProperty(element, property, newValue, clearCustomization = true) {
    const propConfig = INHERITABLE_PROPERTIES[property];
    if (!propConfig) return;

    const targetElement = element.querySelector(propConfig.selector);
    if (!targetElement) return;

    // Set propagating flag to prevent event listeners from marking as customized
    isPropagating = true;

    // Update the value (handle checkboxes specially)
    if (targetElement.type === 'checkbox') {
      targetElement.checked = newValue;
    } else {
      targetElement.value = newValue;
    }

    // Clear customization flag if this is a propagated update
    if (clearCustomization) {
      clearPropertyCustomization(element, property);
    }

    // Trigger change/input event to update UI
    const event = new Event(targetElement.type === 'range' || targetElement.type === 'number' ? 'input' : 'change', { bubbles: true });
    targetElement.dispatchEvent(event);

    // Update related UI elements (like value displays)
    updateRelatedUIElements(element, property, newValue);

    // Clear propagating flag
    isPropagating = false;
  }

  /**
   * Updates related UI elements when a property changes
   * @param {Element} element - The element containing the property
   * @param {string} property - The property name
   * @param {*} newValue - The new value
   */
  function updateRelatedUIElements(element, property, newValue) {
    if (property === 'interval') {
      const valueDisplay = element.querySelector('.shot-interval-value');
      if (valueDisplay) {
        valueDisplay.textContent = `${parseFloat(newValue).toFixed(1)}s`;
      }
    } else if (property === 'shotAnnouncementLeadTime') {
      const valueDisplay = element.querySelector('.lead-time-value');
      if (valueDisplay) {
        valueDisplay.textContent = `${parseFloat(newValue).toFixed(1)}s`;
      }
    } else if (property === 'intervalOffsetEnabled') {
      // Update offset controls visibility and labels for all levels
      if (element === document) {
        // Default config level
        updateDefaultOffsetControls();
      } else if (element.classList.contains('pattern-instance')) {
        // Pattern level - find the correct submenu
        const settingsPanel = element.querySelector('.settings-panel');
        const mainMenuContent = element.querySelector('.main-menu-content');
        const intervalOffsetSubmenu = element.querySelector('.shot-interval-offset-submenu');
        updateOffsetControls(element, settingsPanel, mainMenuContent, intervalOffsetSubmenu);
      } else if (element.classList.contains('shot-instance')) {
        // Shot level - find the correct submenu
        const settingsPanel = element.querySelector('.settings-panel');
        const mainMenuContent = element.querySelector('.main-menu-content');
        const intervalOffsetSubmenu = element.querySelector('.shot-interval-offset-submenu');
        updateOffsetControls(element, settingsPanel, mainMenuContent, intervalOffsetSubmenu);
      }
    }

    // Update rocket indicator
    updateRocketIndicator(element);
  }

  /**
   * Shows the settings propagation modal
   * @param {string} property - The property being changed
   * @param {*} newValue - The new value
   * @param {Array} conflictingElements - Array of elements with custom settings
   * @param {Function} onConfirm - Callback when user confirms
   * @param {Function} onCancel - Callback when user cancels
   */
  function showSettingsPropagationModal(property, newValue, conflictingElements, onConfirm, onCancel, sourceElement = null) {
    const modal = document.getElementById('settingsPropagationModal');
    const title = document.getElementById('propagationModalTitle');
    const text = document.getElementById('propagationModalText');
    const conflictList = document.getElementById('propagationConflictList');

    const propConfig = INHERITABLE_PROPERTIES[property];
    const displayName = propConfig ? propConfig.displayName : property;
    const formattedValue = propConfig ? propConfig.formatValue(newValue) : newValue;

    title.textContent = `${displayName} Change Detected`;
    text.textContent = `You've changed the ${displayName.toLowerCase()} to ${formattedValue}. Some child elements have customized this setting.`;

    // Populate conflict list
    conflictList.innerHTML = '';
    conflictingElements.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name}: ${item.currentValue}`;
      conflictList.appendChild(li);
    });

    // Store slider key information for cleanup
    if (sourceElement) {
      const sliderKey = `${sourceElement.id || sourceElement.className}_${property}`;
      modal.dataset.sliderKey = sliderKey;
    }

    // Set up event listeners
    const cancelBtn = document.getElementById('propagationCancelBtn');
    const keepCustomBtn = document.getElementById('propagationKeepCustomBtn');
    const overrideBtn = document.getElementById('propagationOverrideBtn');

    // Remove existing listeners
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newKeepCustomBtn = keepCustomBtn.cloneNode(true);
    const newOverrideBtn = overrideBtn.cloneNode(true);

    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    keepCustomBtn.parentNode.replaceChild(newKeepCustomBtn, keepCustomBtn);
    overrideBtn.parentNode.replaceChild(newOverrideBtn, overrideBtn);

    newCancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      // Clear modal content
      title.textContent = 'Setting Change Detected';
      text.textContent = '';
      conflictList.innerHTML = '';
      // Clean up any stored original values since interaction is complete
      if (modal.dataset.sliderKey) {
        sliderOriginalValues.delete(modal.dataset.sliderKey);
        delete modal.dataset.sliderKey;
      }
      if (onCancel) onCancel();
    });

    newKeepCustomBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      // Clear modal content
      title.textContent = 'Setting Change Detected';
      text.textContent = '';
      conflictList.innerHTML = '';
      // Clean up any stored original values since interaction is complete
      if (modal.dataset.sliderKey) {
        sliderOriginalValues.delete(modal.dataset.sliderKey);
        delete modal.dataset.sliderKey;
      }
      if (onConfirm) onConfirm(false); // Don't override custom settings
    });

    newOverrideBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      // Clear modal content
      title.textContent = 'Setting Change Detected';
      text.textContent = '';
      conflictList.innerHTML = '';
      // Clean up any stored original values since interaction is complete
      if (modal.dataset.sliderKey) {
        sliderOriginalValues.delete(modal.dataset.sliderKey);
        delete modal.dataset.sliderKey;
      }
      if (onConfirm) onConfirm(true); // Override custom settings
    });

    // Show modal
    modal.classList.remove('hidden');
  }

  /**
   * Handles a hierarchical setting change
   * @param {Element} parentElement - The parent element (document for workout, pattern for pattern-level)
   * @param {string} property - The property being changed
   * @param {*} newValue - The new value
   * @param {*} oldValue - The old value (to revert if cancelled)
   * @param {Element} sourceElement - The element that triggered the change
   */
  function handleHierarchicalSettingChange(parentElement, property, newValue, oldValue, sourceElement) {
    // Skip hierarchical checking during cancellation reversion to prevent infinite loops
    if (isCancelling) {
      return;
    }

    const includeGrandchildren = (parentElement === document);
    const conflictingElements = getChildrenWithCustomizedProperty(parentElement, property, includeGrandchildren);

    if (conflictingElements.length === 0) {
      // No conflicts, just propagate to non-customized children
      propagateSettingToChildren(parentElement, property, newValue, null, includeGrandchildren);
      // Clean up any stored original values since no modal/cancellation is possible
      const sliderKey = `${sourceElement.id || sourceElement.className}_${property}`;
      sliderOriginalValues.delete(sliderKey);
    } else {
      // Show confirmation modal
      showSettingsPropagationModal(
        property,
        newValue,
        conflictingElements,
        (overrideCustom) => {
          if (overrideCustom) {
            // Override all children (including custom ones)
            const allChildren = [];

            if (parentElement === document) {
              allChildren.push(...document.querySelectorAll('.pattern-instance'));
              allChildren.push(...document.querySelectorAll('.shot-msg-instance'));
            } else if (parentElement.classList.contains('pattern-instance')) {
              allChildren.push(...parentElement.querySelectorAll('.shot-msg-instance'));
            }

            propagateSettingToChildren(parentElement, property, newValue, allChildren, false);
          } else {
            // Only update non-customized children
            propagateSettingToChildren(parentElement, property, newValue, null, includeGrandchildren);
          }
        },
        () => {
          // User cancelled, revert the change
          isCancelling = true;

          // Clear any pending hierarchical timeouts to prevent double processing
          if (hierarchicalChangeTimeout) {
            clearTimeout(hierarchicalChangeTimeout);
            hierarchicalChangeTimeout = null;
          }

          sourceElement.value = oldValue;
          const event = new Event(sourceElement.type === 'range' || sourceElement.type === 'number' ? 'input' : 'change', { bubbles: true });
          sourceElement.dispatchEvent(event);
          isCancelling = false;
        },
        sourceElement
      );
    }
  }

});
