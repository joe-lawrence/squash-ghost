document.addEventListener("DOMContentLoaded", function () {
  // --- Global Elements ---
  const mainContainer = document.getElementById("mainContainer");
  const patternInstanceTemplate = document.getElementById(
    "patternInstanceTemplate",
  );
  const shotInstanceTemplate = patternInstanceTemplate.content.querySelector(
    ".shot-instance-template",
  );
  const messageInstanceTemplate = patternInstanceTemplate.content.querySelector(
    ".message-instance-template",
  );
  const addPatternBtn = document.getElementById("addPatternBtn");
  const saveWorkoutBtn = document.getElementById("saveWorkoutBtn");
  const loadWorkoutBtn = document.getElementById("loadWorkoutBtn");
  const workoutFileInput = document.getElementById("workoutFileInput");
  const themeToggle = document.getElementById("themeToggle");
  const rocketToggle = document.getElementById("rocketToggle");

  const resetConfigModal = document.getElementById("resetConfigModal");

  // Initialize theme and rocket mode from localStorage
  function initializeTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.setAttribute(
        "data-theme",
        prefersDark ? "dark" : "light",
      );
      localStorage.setItem("theme", prefersDark ? "dark" : "light");
    }
  }

  function initializeRocketMode() {
    const savedRocketMode = localStorage.getItem("rocketMode");
    const rocketMode = savedRocketMode || "off";
    document.documentElement.setAttribute("data-rocket-mode", rocketMode);
    localStorage.setItem("rocketMode", rocketMode);

    // We'll apply the config lock state after all elements are initialized
  }

  // Toggle theme function
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
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

  // Initialize theme and rocket mode on load
  initializeTheme();
  initializeRocketMode();

  // Add click event listeners to toggle buttons
  themeToggle.addEventListener("click", toggleTheme);
  rocketToggle.addEventListener("click", toggleRocketMode);

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light",
        );
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
  const defaultBiasEnabled = document.getElementById("defaultBiasEnabled");
  const defaultBiasControlsContainer = document.getElementById(
    "defaultBiasControlsContainer",
  );
  const defaultBiasTypeSelect = document.getElementById(
    "defaultBiasTypeSelect",
  );
  const defaultBiasFixedOption = document.getElementById(
    "defaultBiasFixedOption",
  );
  const defaultBiasRandomOption = document.getElementById(
    "defaultBiasRandomOption",
  );
  const defaultBiasFixedContainer = document.getElementById(
    "defaultBiasFixedContainer",
  );
  const defaultBiasRandomContainer = document.getElementById(
    "defaultBiasRandomContainer",
  );
  const defaultBiasFixedSlider = document.getElementById(
    "defaultBiasFixedSlider",
  );
  const defaultBiasRandomPositiveSlider = document.getElementById(
    "defaultBiasRandomPositiveSlider",
  );
  const defaultBiasRandomNegativeSlider = document.getElementById(
    "defaultBiasRandomNegativeSlider",
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
          : undefined,
      speechRate: (() => {
        const rate = defaultVoiceRateSelect
          ? defaultVoiceRateSelect.value
          : "auto-scale";
        return rate === "auto-scale" ? 1.0 : parseFloat(rate);
      })(),
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

    const biasEnabledCheckbox = shotElement.querySelector(".bias-enabled");
    const biasTypeSelect = shotElement.querySelector(".bias-type-select");
    const biasFixedSlider = shotElement.querySelector(".bias-fixed-slider");
    const biasRandomPositiveSlider = shotElement.querySelector(
      ".bias-random-positive-slider",
    );
    const biasRandomNegativeSlider = shotElement.querySelector(
      ".bias-random-negative-slider",
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

    return {
      type: "Shot",
      id: shotElement.id || generateUniqueId(),
      name: titleInput ? titleInput.value : "New shot",
      positionType: getPositionType(shotElement),
      config: {
        repeatCount: repeatSlider ? parseInt(repeatSlider.value) : 1,
        interval: shotIntervalSlider
          ? parseFloat(shotIntervalSlider.value)
          : 5.0,
        intervalFuzzType: biasTypeSelect ? biasTypeSelect.value : "fixed",
        intervalFuzz: {
          min: (() => {
            const type = biasTypeSelect ? biasTypeSelect.value : "fixed";
            if (type === "fixed") {
              return biasFixedSlider ? parseFloat(biasFixedSlider.value) : 0;
            } else {
              return biasRandomNegativeSlider
                ? parseFloat(biasRandomNegativeSlider.value)
                : 0;
            }
          })(),
          max: (() => {
            const type = biasTypeSelect ? biasTypeSelect.value : "fixed";
            if (type === "fixed") {
              return biasFixedSlider ? parseFloat(biasFixedSlider.value) : 0;
            } else {
              return biasRandomPositiveSlider
                ? parseFloat(biasRandomPositiveSlider.value)
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
      },
    };
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
        skipAtEndOfWorkout: skipAtEndCheckbox
          ? skipAtEndCheckbox.checked
          : false,
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
        repeatCount: repeatSlider ? parseInt(repeatSlider.value) : 1,
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
      const jsonString = JSON.stringify(workoutData, null, 2);

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

    // Config validation
    if (!pattern.config || typeof pattern.config !== "object") {
      errors.push(`${context}: Must have a config object`);
    } else {
      const config = pattern.config;

      if (
        typeof config.repeatCount !== "number" ||
        config.repeatCount < 1 ||
        config.repeatCount > 10
      ) {
        errors.push(
          `${context}: repeatCount must be a number between 1 and 10`,
        );
      }

      // Validate iteration
      if (!["in-order", "shuffle"].includes(config.iterationType)) {
        errors.push(
          `${context}: iterationType must be "in-order" or "shuffle"`,
        );
      }

      // Validate limits
      if (!config.limits || typeof config.limits !== "object") {
        errors.push(`${context}: Must have limits object`);
      } else {
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

    if (!entry.config || typeof entry.config !== "object") {
      errors.push(`${context}: Must have a config object`);
      return errors;
    }

    const config = entry.config;

    if (
      typeof config.repeatCount !== "number" ||
      config.repeatCount < 1 ||
      config.repeatCount > 10
    ) {
      errors.push(`${context}: repeatCount must be a number between 1 and 10`);
    }

    if (entry.type === "Shot") {
      if (
        typeof config.interval !== "number" ||
        config.interval < 3.0 ||
        config.interval > 8.0
      ) {
        errors.push(
          `${context}: Shot interval must be between 3.0 and 8.0 seconds`,
        );
      }

      if (!["fixed", "random"].includes(config.intervalFuzzType)) {
        errors.push(`${context}: intervalFuzzType must be "fixed" or "random"`);
      }

      if (
        typeof config.shotAnnouncementLeadTime !== "number" ||
        config.shotAnnouncementLeadTime < 2.5 ||
        config.shotAnnouncementLeadTime > config.interval
      ) {
        errors.push(
          `${context}: shotAnnouncementLeadTime must be between 2.5 and interval value`,
        );
      }

      // Validate intervalFuzz object
      if (!config.intervalFuzz || typeof config.intervalFuzz !== "object") {
        errors.push(`${context}: Must have intervalFuzz object`);
      } else {
        if (
          typeof config.intervalFuzz.min !== "number" ||
          config.intervalFuzz.min < -2.0 ||
          config.intervalFuzz.min > 2.0
        ) {
          errors.push(
            `${context}: intervalFuzz.min must be between -2.0 and 2.0`,
          );
        }
        if (
          typeof config.intervalFuzz.max !== "number" ||
          config.intervalFuzz.max < -2.0 ||
          config.intervalFuzz.max > 2.0
        ) {
          errors.push(
            `${context}: intervalFuzz.max must be between -2.0 and 2.0`,
          );
        }
        if (config.intervalFuzz.min > config.intervalFuzz.max) {
          errors.push(
            `${context}: intervalFuzz.min must be less than or equal to intervalFuzz.max`,
          );
        }
      }

      // Validate autoVoiceSplitStep
      if (typeof config.autoVoiceSplitStep !== "boolean") {
        errors.push(`${context}: autoVoiceSplitStep must be a boolean`);
      }

      // Validate splitStepSpeed
      if (
        !["none", "slow", "medium", "fast", "random"].includes(
          config.splitStepSpeed,
        )
      ) {
        errors.push(
          `${context}: splitStepSpeed must be "none", "slow", "medium", "fast", or "random"`,
        );
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
    } else if (entry.type === "Message") {
      if (!config.message || typeof config.message !== "string") {
        errors.push(`${context}: Message must have valid message text`);
      }

      // Validate interval format (MM:SS)
      if (
        typeof config.interval !== "string" ||
        !/^\d{2}:\d{2}$/.test(config.interval)
      ) {
        errors.push(`${context}: interval must be in MM:SS format`);
      }

      if (typeof config.skipAtEndOfWorkout !== "boolean") {
        errors.push(`${context}: skipAtEndOfWorkout must be a boolean`);
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

      // Set bias/fuzz settings
      if (config.intervalFuzz) {
        const biasTypeSelect = shotElement.querySelector(".bias-type-select");
        const biasFixedSlider = shotElement.querySelector(".bias-fixed-slider");
        const biasRandomPosSlider = shotElement.querySelector(
          ".bias-random-positive-slider",
        );
        const biasRandomNegSlider = shotElement.querySelector(
          ".bias-random-negative-slider",
        );

        if (biasTypeSelect) {
          biasTypeSelect.value = config.intervalFuzzType;
        }

        if (config.intervalFuzzType === "fixed" && biasFixedSlider) {
          biasFixedSlider.value = config.intervalFuzz.min;
        } else if (config.intervalFuzzType === "random") {
          if (biasRandomPosSlider)
            biasRandomPosSlider.value = config.intervalFuzz.max;
          if (biasRandomNegSlider)
            biasRandomNegSlider.value = config.intervalFuzz.min;
        }

        // Enable bias if there's any fuzz
        const biasEnabled = shotElement.querySelector(".bias-enabled");
        if (
          biasEnabled &&
          (config.intervalFuzz.min !== 0 || config.intervalFuzz.max !== 0)
        ) {
          biasEnabled.checked = true;
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
        const intervalValue = messageElement.querySelector(
          ".message-interval-value",
        );
        if (intervalValue) intervalValue.textContent = config.interval;
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
      // Clear existing workout
      clearWorkout();

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

      console.log("Workout loaded and applied successfully");
    } catch (error) {
      console.error("Error loading workout:", error);
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

      // Check bias settings
      const biasEnabled = entry.querySelector(".bias-enabled");
      if (biasEnabled && biasEnabled.checked) return false;

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
   * Reinitializes all UI states after loading a workout.
   * This ensures that all toggle states, button states, and UI elements are properly updated.
   */
  function reinitializeUIStates() {
    // Update all bias controls
    document.querySelectorAll(".bias-enabled").forEach((biasCheckbox) => {
      biasCheckbox.dispatchEvent(new Event("change"));
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

    // Update all bias type selects
    document.querySelectorAll(".bias-type-select").forEach((biasTypeSelect) => {
      biasTypeSelect.dispatchEvent(new Event("change"));
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
        updateGroupLockStyling(element);
      });

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
   * Toggles a given settings dropdown panel.
   * @param {HTMLElement} panelElement The dropdown content panel.
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   */
  function toggleSettingsDropdown(panelElement, mainMenuElement) {
    if (!panelElement || !mainMenuElement) return;

    const isActive = panelElement.classList.contains("active");

    // Close all other dropdowns first (both settings and rocket dropdowns)
    document.querySelectorAll(".settings-panel.active").forEach((panel) => {
      if (panel !== panelElement) {
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
    document
      .querySelectorAll(".rocket-indicator-dropdown.active")
      .forEach((dropdown) => {
        dropdown.classList.remove("active");
        // Remove tabindex to prevent focus
        dropdown.removeAttribute("tabindex");
        // Ensure all child elements lose focus
        dropdown.querySelectorAll("*").forEach((child) => {
          if (child !== dropdown) {
            child.blur();
          }
        });
      });

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

    panelElement.querySelectorAll(".submenu-content").forEach((panel) => {
      panel.classList.add("hidden");
      panel.classList.remove("active");
    });

    requestAnimationFrame(() => setPanelHeight(panelElement, mainMenuElement));
  }

  /**
   * Shows a specific submenu for a given settings panel.
   * @param {HTMLElement} panelElement The dropdown content panel.
   * @param {HTMLElement} mainMenuElement The main menu content within the panel.
   * @param {string} submenuClass The class name of the target submenu.
   */
  function showSettingsSubmenu(panelElement, mainMenuElement, submenuClass) {
    if (!panelElement || !mainMenuElement) {
      console.error(
        "Missing panel or main menu element for showSettingsSubmenu.",
      );
      return;
    }
    mainMenuElement.classList.remove("active");
    mainMenuElement.classList.add("hidden-left");

    panelElement.querySelectorAll(".submenu-content").forEach((panel) => {
      panel.classList.add("hidden");
      panel.classList.remove("active");
    });

    const targetSubmenu = panelElement.querySelector(`.${submenuClass}`);
    if (targetSubmenu) {
      targetSubmenu.classList.remove("hidden");
      targetSubmenu.classList.add("active");
      requestAnimationFrame(() =>
        setPanelHeight(panelElement, mainMenuElement),
      );
    } else {
      console.error(`Target submenu with class ${submenuClass} not found.`);
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
   * Updates the default bias controls visibility and text.
   */
  function updateDefaultBiasControls() {
    const defaultBiasToggleLabel = document.getElementById(
      "defaultBiasToggleLabel",
    );

    if (
      !defaultBiasEnabled ||
      !defaultBiasControlsContainer ||
      !defaultBiasTypeSelect ||
      !defaultBiasFixedOption ||
      !defaultBiasRandomOption ||
      !defaultBiasFixedContainer ||
      !defaultBiasRandomContainer ||
      !defaultBiasFixedSlider ||
      !defaultBiasRandomPositiveSlider ||
      !defaultBiasRandomNegativeSlider
    ) {
      console.error(
        "Error in updateDefaultBiasControls: Required elements not found.",
      );
      return;
    }

    const isBiasEnabled = defaultBiasEnabled.checked;
    const biasType = defaultBiasTypeSelect.value;

    // Update toggle label
    if (defaultBiasToggleLabel) {
      defaultBiasToggleLabel.textContent = isBiasEnabled
        ? "Bias enabled"
        : "Bias disabled";
    }

    if (isBiasEnabled) {
      defaultBiasControlsContainer.classList.remove("hidden");
      defaultBiasTypeSelect.disabled = false;

      if (biasType === "fixed") {
        defaultBiasFixedContainer.classList.remove("hidden");
        defaultBiasRandomContainer.classList.add("hidden");
        defaultBiasFixedSlider.disabled = false;
        defaultBiasRandomPositiveSlider.disabled = true;
        defaultBiasRandomNegativeSlider.disabled = true;

        defaultBiasFixedOption.textContent = `Fixed: ${parseFloat(defaultBiasFixedSlider.value).toFixed(1)}s`;
        const val1 = parseFloat(defaultBiasRandomPositiveSlider.value).toFixed(
          1,
        );
        const val2 = parseFloat(defaultBiasRandomNegativeSlider.value).toFixed(
          1,
        );
        defaultBiasRandomOption.textContent = `Random range: ${val1}s to ${val2}s`;
      } else {
        // 'random'
        defaultBiasFixedContainer.classList.add("hidden");
        defaultBiasRandomContainer.classList.remove("hidden");
        defaultBiasFixedSlider.disabled = true;
        defaultBiasRandomPositiveSlider.disabled = false;
        defaultBiasRandomNegativeSlider.disabled = false;

        const val1 = parseFloat(defaultBiasRandomPositiveSlider.value).toFixed(
          1,
        );
        const val2 = parseFloat(defaultBiasRandomNegativeSlider.value).toFixed(
          1,
        );
        defaultBiasRandomOption.textContent = `Random range: ${val1}s to ${val2}s`;
        defaultBiasFixedOption.textContent = `Fixed: ${parseFloat(defaultBiasFixedSlider.value).toFixed(1)}s`;
      }
    } else {
      defaultBiasControlsContainer.classList.add("hidden");
      defaultBiasTypeSelect.disabled = true;
      defaultBiasFixedContainer.classList.add("hidden");
      defaultBiasRandomContainer.classList.add("hidden");
      defaultBiasFixedSlider.disabled = true;
      defaultBiasRandomPositiveSlider.disabled = true;
      defaultBiasRandomNegativeSlider.disabled = true;

      defaultBiasFixedOption.textContent = `Fixed: 0.0s`;
      defaultBiasRandomOption.textContent = `Random range: 0.0s to 0.0s`;
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
      bias: {
        enabled: defaultBiasEnabled ? defaultBiasEnabled.checked : false,
        type: defaultBiasTypeSelect ? defaultBiasTypeSelect.value : "fixed",
        fixedValue: defaultBiasFixedSlider ? defaultBiasFixedSlider.value : "0",
        randomPositive: defaultBiasRandomPositiveSlider
          ? defaultBiasRandomPositiveSlider.value
          : "0",
        randomNegative: defaultBiasRandomNegativeSlider
          ? defaultBiasRandomNegativeSlider.value
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

      // Check pattern bias, split-step, voice settings
      const patternBiasEnabled =
        pattern.querySelector(".bias-enabled")?.checked;
      const patternBiasType = pattern.querySelector(".bias-type-select")?.value;
      const patternBiasFixed =
        pattern.querySelector(".bias-fixed-slider")?.value;
      const patternBiasPos = pattern.querySelector(
        ".bias-random-positive-slider",
      )?.value;
      const patternBiasNeg = pattern.querySelector(
        ".bias-random-negative-slider",
      )?.value;

      if (
        patternBiasEnabled !== defaults.bias.enabled ||
        patternBiasType !== defaults.bias.type ||
        patternBiasFixed !== defaults.bias.fixedValue ||
        patternBiasPos !== defaults.bias.randomPositive ||
        patternBiasNeg !== defaults.bias.randomNegative
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

          // Check shot-specific bias, split-step, voice settings
          const biasEnabled = instance.querySelector(".bias-enabled")?.checked;
          const biasType = instance.querySelector(".bias-type-select")?.value;
          const biasFixed = instance.querySelector(".bias-fixed-slider")?.value;
          const biasPos = instance.querySelector(
            ".bias-random-positive-slider",
          )?.value;
          const biasNeg = instance.querySelector(
            ".bias-random-negative-slider",
          )?.value;

          if (
            biasEnabled !== defaults.bias.enabled ||
            biasType !== defaults.bias.type ||
            biasFixed !== defaults.bias.fixedValue ||
            biasPos !== defaults.bias.randomPositive ||
            biasNeg !== defaults.bias.randomNegative
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

      // Reset pattern bias, split-step, voice settings
      const patternBiasEnabled = pattern.querySelector(".bias-enabled");
      const patternBiasType = pattern.querySelector(".bias-type-select");
      const patternBiasFixed = pattern.querySelector(".bias-fixed-slider");
      const patternBiasPos = pattern.querySelector(
        ".bias-random-positive-slider",
      );
      const patternBiasNeg = pattern.querySelector(
        ".bias-random-negative-slider",
      );

      if (patternBiasEnabled)
        patternBiasEnabled.checked = defaults.bias.enabled;
      if (patternBiasType) patternBiasType.value = defaults.bias.type;
      if (patternBiasFixed) patternBiasFixed.value = defaults.bias.fixedValue;
      if (patternBiasPos) patternBiasPos.value = defaults.bias.randomPositive;
      if (patternBiasNeg) patternBiasNeg.value = defaults.bias.randomNegative;

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
          const biasEnabled = instance.querySelector(".bias-enabled");
          const biasType = instance.querySelector(".bias-type-select");
          const biasFixed = instance.querySelector(".bias-fixed-slider");
          const biasPos = instance.querySelector(
            ".bias-random-positive-slider",
          );
          const biasNeg = instance.querySelector(
            ".bias-random-negative-slider",
          );

          if (biasEnabled) biasEnabled.checked = defaults.bias.enabled;
          if (biasType) biasType.value = defaults.bias.type;
          if (biasFixed) biasFixed.value = defaults.bias.fixedValue;
          if (biasPos) biasPos.value = defaults.bias.randomPositive;
          if (biasNeg) biasNeg.value = defaults.bias.randomNegative;

          // Update bias controls visibility
          updateBiasControls(instance, null, null, null);
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

      // Update pattern bias controls visibility
      updateBiasControls(pattern, null, null, null);
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
  function getSiblings(element) {
    if (element.classList.contains("pattern-instance")) {
      return Array.from(mainContainer.querySelectorAll(".pattern-instance"));
    } else if (element.classList.contains("shot-msg-instance")) {
      const parent = element.closest(".pattern-instance");
      return Array.from(parent.querySelectorAll(".shot-msg-instance"));
    }
    return [];
  }

  /**
   * Finds the linked group that contains a specific element.
   * @param {HTMLElement} element The element to find the group for.
   * @returns {Array} Array of elements in the linked group (including the element itself).
   */
  function getLinkedGroup(element) {
    const siblings = getSiblings(element);
    const elementIndex = siblings.indexOf(element);
    const group = [element];

    // Find linked elements before this one
    for (let i = elementIndex - 1; i >= 0; i--) {
      if (siblings[i + 1].dataset.linkedWithPrevious === "true") {
        group.unshift(siblings[i]);
      } else {
        break;
      }
    }

    // Find linked elements after this one
    for (let i = elementIndex + 1; i < siblings.length; i++) {
      if (siblings[i].dataset.linkedWithPrevious === "true") {
        group.push(siblings[i]);
      } else {
        break;
      }
    }

    return group;
  }

  /**
   * Checks if any element in a group is position-locked.
   * @param {Array} group Array of elements in the group.
   * @returns {boolean} True if any element in the group is locked.
   */
  function isGroupLocked(group) {
    return group.some((element) => element.dataset.positionLocked === "true");
  }

  /**
   * Gets the lock type of a group (position or last) if any member is locked.
   * @param {Array} group Array of elements in the group.
   * @returns {string|null} Lock type ('position' or 'last') or null if not locked.
   */
  function getGroupLockType(group) {
    const lockedElement = group.find(
      (element) => element.dataset.positionLocked === "true",
    );
    return lockedElement
      ? lockedElement.dataset.positionLockType || "position"
      : null;
  }

  /**
   * Updates the visual styling for all elements in a linked group based on lock state.
   * @param {HTMLElement} element Any element from the group to update.
   */
  function updateGroupLockStyling(element) {
    const group = getLinkedGroup(element);
    const groupLocked = isGroupLocked(group);
    const groupLockType = getGroupLockType(group);

    // Apply or remove lock styling to all members of the group
    group.forEach((member) => {
      if (groupLocked) {
        if (groupLockType === "last") {
          member.classList.add("position-locked-last");
          member.classList.remove("position-locked");
        } else {
          member.classList.add("position-locked");
          member.classList.remove("position-locked-last");
        }
      } else {
        member.classList.remove("position-locked", "position-locked-last");
      }
    });
  }

  /**
   * Checks if an element can be moved (considering group constraints).
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if the element can be moved.
   */
  function canElementMoveInGroup(element) {
    const group = getLinkedGroup(element);

    // If any element in the group is locked, the whole group can't move
    if (isGroupLocked(group)) {
      return false;
    }

    return true;
  }

  /**
   * Checks if swapping two elements would violate any locked positions.
   * @param {HTMLElement} element1 First element to swap.
   * @param {HTMLElement} element2 Second element to swap.
   * @param {Array} siblings Array of all siblings.
   * @returns {boolean} True if the swap is valid.
   */
  function isSwapValid(element1, element2, siblings) {
    const index1 = siblings.indexOf(element1);
    const index2 = siblings.indexOf(element2);

    // Check that all locked items would remain in their correct positions after swap
    for (let i = 0; i < siblings.length; i++) {
      const item = siblings[i];
      if (item.dataset.positionLocked === "true") {
        const lockType = item.dataset.positionLockType || "position";

        // Calculate where this locked item would end up after the swap
        let newIndex = i; // Default: stays in same position

        if (i === index1) {
          // This locked item is element1, it would move to element2's position
          newIndex = index2;
        } else if (i === index2) {
          // This locked item is element2, it would move to element1's position
          newIndex = index1;
        }

        if (lockType === "position") {
          // Position-locked item must stay in exact same position
          if (newIndex !== i) {
            return false; // Swap would violate this position lock
          }
        } else if (lockType === "last") {
          // Last-locked item must remain at the end
          if (newIndex !== siblings.length - 1) {
            return false; // Swap would violate this last lock
          }
        }
      }
    }

    return true; // Swap is valid
  }

  /**
   * Finds a suitable swap target for moving in a given direction.
   * @param {HTMLElement} element The element to move.
   * @param {string} direction 'up' or 'down'.
   * @returns {HTMLElement|null} The element to swap with, or null if no valid swap.
   */
  function findSwapTarget(element, direction) {
    const siblings = getSiblings(element);
    const currentIndex = siblings.indexOf(element);

    // If the element itself is locked, it cannot move
    if (element.dataset.positionLocked === "true") {
      return null;
    }

    // If there are only 2 items total, they can only swap with each other
    if (siblings.length <= 2) {
      const otherElement = siblings.find((s) => s !== element);
      if (otherElement && canElementMove(otherElement)) {
        return isSwapValid(element, otherElement, siblings)
          ? otherElement
          : null;
      }
      return null;
    }

    if (direction === "up") {
      // Look for the first moveable item to swap with (going up)
      for (let i = currentIndex - 1; i >= 0; i--) {
        const candidate = siblings[i];
        if (canElementMove(candidate)) {
          if (isSwapValid(element, candidate, siblings)) {
            return candidate;
          }
        }
      }
    } else if (direction === "down") {
      // Look for the first moveable item to swap with (going down)
      for (let i = currentIndex + 1; i < siblings.length; i++) {
        const candidate = siblings[i];
        if (canElementMove(candidate)) {
          if (isSwapValid(element, candidate, siblings)) {
            return candidate;
          }
        }
      }
    }

    return null; // No valid swap target found
  }

  /**
   * Checks if an element can be moved (not locked or only locked to last position in a moveable way).
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if the element can participate in swaps.
   */
  function canElementMove(element) {
    if (element.dataset.positionLocked !== "true") {
      return true; // Not locked, can move
    }

    const lockType = element.dataset.positionLockType || "position";
    if (lockType === "position") {
      return false; // Position-locked elements cannot move
    } else if (lockType === "last") {
      // Last-locked elements can only move if they remain last
      // For now, we'll allow them to participate in swaps and let isSwapValid determine validity
      return true;
    }

    return false;
  }

  /**
   * Checks if a position move is valid by finding a swap target.
   * @param {HTMLElement} element The element to move.
   * @param {string} direction 'up' or 'down'.
   * @returns {boolean} True if the move is valid.
   */
  function canMoveToPosition(element, direction) {
    return findSwapTarget(element, direction) !== null;
  }

  /**
   * Performs a swap between two elements in the DOM.
   * @param {HTMLElement} element1 First element to swap.
   * @param {HTMLElement} element2 Second element to swap.
   */
  function swapElements(element1, element2) {
    // Create a temporary placeholder
    const placeholder = document.createElement("div");

    // Insert placeholder before element1
    element1.parentNode.insertBefore(placeholder, element1);

    // Move element1 to where element2 is
    element2.parentNode.insertBefore(element1, element2);

    // Move element2 to where element1 was (before placeholder)
    placeholder.parentNode.insertBefore(element2, placeholder);

    // Remove the placeholder
    placeholder.remove();
  }

  /**
   * Moves a group of linked elements to a new position.
   * @param {Array} group Array of elements in the linked group.
   * @param {HTMLElement} targetElement The element to move the group before/after.
   * @param {string} direction 'up' or 'down'.
   */
  function moveGroup(group, targetElement, direction) {
    const siblings = getSiblings(group[0]);
    const targetIndex = siblings.indexOf(targetElement);

    // Remove group elements from their current positions
    group.forEach((element) => element.remove());

    // Determine insertion point
    let insertionPoint;
    if (direction === "up") {
      insertionPoint = targetElement;
    } else {
      insertionPoint = targetElement.nextElementSibling;
    }

    // Insert group elements at the new position
    const container = targetElement.parentElement;
    group.forEach((element, index) => {
      if (insertionPoint) {
        container.insertBefore(element, insertionPoint);
      } else {
        container.appendChild(element);
      }
    });

    // Update group styling for all affected elements after move
    const allElementsAfterMove = Array.from(container.children);
    allElementsAfterMove.forEach((element) => {
      updateGroupLockStyling(element);
    });
  }

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
  function findNextAvailablePositionUp(element) {
    // Check if the element can move considering group constraints
    if (!canElementMoveInGroup(element)) {
      return false;
    }

    const group = getLinkedGroup(element);
    const siblings = getSiblings(element);
    const firstGroupElementIndex = siblings.indexOf(group[0]);

    // If this is an internal group move (trying to move one element within its own group), prevent it
    if (group.length > 1 && group.includes(element) && element !== group[0]) {
      return false; // Can't break group integrity
    }

    // Find the first moveable element/group before this group
    for (let i = firstGroupElementIndex - 1; i >= 0; i--) {
      const candidate = siblings[i];
      const candidateGroup = getLinkedGroup(candidate);

      // Check if we can move our group before this candidate's group
      if (canElementMoveInGroup(candidate)) {
        // Move our group before the candidate's group
        moveGroup(group, candidateGroup[0], "up");
        return true;
      }
    }

    return false;
  }

  /**
   * Finds the next available position for a group when moving down.
   * @param {HTMLElement} element The element from the group to move.
   * @returns {boolean} True if move was performed, false otherwise.
   */
  function findNextAvailablePositionDown(element) {
    // Check if the element can move considering group constraints
    if (!canElementMoveInGroup(element)) {
      return false;
    }

    const group = getLinkedGroup(element);
    const siblings = getSiblings(element);
    const lastGroupElementIndex = siblings.indexOf(group[group.length - 1]);

    // If this is an internal group move (trying to move one element within its own group), prevent it
    if (group.length > 1 && group.includes(element) && element !== group[0]) {
      return false; // Can't break group integrity
    }

    // Find the first moveable element/group after this group
    for (let i = lastGroupElementIndex + 1; i < siblings.length; i++) {
      const candidate = siblings[i];
      const candidateGroup = getLinkedGroup(candidate);

      // Check if we can move our group after this candidate's group
      if (canElementMoveInGroup(candidate)) {
        // Move our group after the candidate's group
        moveGroup(group, candidateGroup[candidateGroup.length - 1], "down");
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if an element is the last in its container.
   * @param {HTMLElement} element The element to check.
   * @returns {boolean} True if element is last in its container.
   */
  function isLastElement(element) {
    const siblings = getSiblings(element);
    return siblings.indexOf(element) === siblings.length - 1;
  }

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
    updateGroupLockStyling(element);

    // Also update styling for the previous element if it exists
    const siblings = getSiblings(element);
    const currentIndex = siblings.indexOf(element);
    if (currentIndex > 0) {
      updateGroupLockStyling(siblings[currentIndex - 1]);
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
    const isLast = isLastElement(element);
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
    updateGroupLockStyling(element);
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
    const isLast = isLastElement(element);
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
    const group = getLinkedGroup(element);
    group.forEach((member) => {
      if (member !== element) {
        updateGroupLockStyling(member);
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
    // Check if the element can move considering group constraints
    if (!canElementMoveInGroup(element)) {
      return false;
    }

    const group = getLinkedGroup(element);
    const siblings = getSiblings(element);

    // If this is trying to move within a group (not the group leader), prevent it
    if (group.length > 1 && group.includes(element) && element !== group[0]) {
      return false; // Can't break group integrity
    }

    if (direction === "up") {
      const firstGroupElementIndex = siblings.indexOf(group[0]);

      // Find the first moveable element/group before this group
      for (let i = firstGroupElementIndex - 1; i >= 0; i--) {
        const candidate = siblings[i];
        if (canElementMoveInGroup(candidate)) {
          return true;
        }
      }
    } else if (direction === "down") {
      const lastGroupElementIndex = siblings.indexOf(group[group.length - 1]);

      // Find the first moveable element/group after this group
      for (let i = lastGroupElementIndex + 1; i < siblings.length; i++) {
        const candidate = siblings[i];
        if (canElementMoveInGroup(candidate)) {
          return true;
        }
      }
    }

    return false;
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
        moveUpBtn.classList.remove("hover:bg-gray-100");
      } else {
        moveUpBtn.classList.remove("opacity-50", "cursor-not-allowed");
        moveUpBtn.classList.add("hover:bg-gray-100");
      }
    }

    if (moveDownBtn) {
      moveDownBtn.disabled = !canMoveDown;
      if (!canMoveDown) {
        moveDownBtn.classList.add("opacity-50", "cursor-not-allowed");
        moveDownBtn.classList.remove("hover:bg-gray-100");
      } else {
        moveDownBtn.classList.remove("opacity-50", "cursor-not-allowed");
        moveDownBtn.classList.add("hover:bg-gray-100");
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
        !isLastElement(pattern)
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
        !isLastElement(shotMsg)
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
        "shot-interval-bias-submenu",
        "split-step-submenu",
        "voice-submenu",
      ];

      if (disallowedSubmenus.includes(targetSubmenu)) {
        trigger.disabled = isLocked;
        if (isLocked) {
          trigger.classList.add("opacity-50", "cursor-not-allowed");
          trigger.classList.remove("hover:bg-gray-100", "hover:text-gray-900");
        } else {
          trigger.classList.remove("opacity-50", "cursor-not-allowed");
          trigger.classList.add("hover:bg-gray-100", "hover:text-gray-900");
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
      button.classList.add("hover:bg-gray-100");
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
      button.classList.add("hover:bg-gray-100", "hover:text-gray-900");
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
   * Updates bias controls visibility and text.
   * @param {HTMLElement} instanceContainer The root element of the instance.
   * @param {HTMLElement} settingsPanel The settings dropdown panel.
   * @param {HTMLElement} mainMenuContent The main menu content.
   * @param {HTMLElement} intervalBiasSubmenu The interval bias submenu.
   */
  function updateBiasControls(
    instanceContainer,
    settingsPanel,
    mainMenuContent,
    intervalBiasSubmenu,
  ) {
    const biasEnabledCheckbox =
      instanceContainer.querySelector(".bias-enabled");
    const biasControlsContainer = instanceContainer.querySelector(
      ".bias-controls-container",
    );
    const biasTypeSelect = instanceContainer.querySelector(".bias-type-select");
    const biasFixedOption =
      instanceContainer.querySelector(".bias-fixed-option");
    const biasRandomOption = instanceContainer.querySelector(
      ".bias-random-option",
    );
    const biasFixedContainer = instanceContainer.querySelector(
      ".bias-fixed-container",
    );
    const biasFixedSlider =
      instanceContainer.querySelector(".bias-fixed-slider");
    const biasRandomContainer = instanceContainer.querySelector(
      ".bias-random-container",
    );
    const biasRandomPositiveSlider = instanceContainer.querySelector(
      ".bias-random-positive-slider",
    );
    const biasRandomNegativeSlider = instanceContainer.querySelector(
      ".bias-random-negative-slider",
    );
    const biasToggleLabel =
      instanceContainer.querySelector(".bias-toggle-label");

    if (
      !biasEnabledCheckbox ||
      !biasControlsContainer ||
      !biasTypeSelect ||
      !biasFixedOption ||
      !biasRandomOption ||
      !biasFixedContainer ||
      !biasRandomContainer ||
      !biasFixedSlider ||
      !biasRandomPositiveSlider ||
      !biasRandomNegativeSlider
    ) {
      console.error(
        "Error in updateBiasControls: Required elements not found in instance.",
        instanceContainer,
      );
      return;
    }

    const isBiasEnabled = biasEnabledCheckbox.checked;
    const biasType = biasTypeSelect.value;

    // Update toggle label
    if (biasToggleLabel) {
      biasToggleLabel.textContent = isBiasEnabled
        ? "Bias enabled"
        : "Bias disabled";
    }

    if (isBiasEnabled) {
      biasControlsContainer.classList.remove("hidden");
      biasTypeSelect.disabled = false;

      if (biasType === "fixed") {
        biasFixedContainer.classList.remove("hidden");
        biasRandomContainer.classList.add("hidden");
        biasFixedSlider.disabled = false;
        biasRandomPositiveSlider.disabled = true;
        biasRandomNegativeSlider.disabled = true;

        biasFixedOption.textContent = `Fixed: ${parseFloat(biasFixedSlider.value).toFixed(1)}s`;
        const val1 = parseFloat(biasRandomPositiveSlider.value).toFixed(1);
        const val2 = parseFloat(biasRandomNegativeSlider.value).toFixed(1);
        biasRandomOption.textContent = `Random range: ${val1}s to ${val2}s`;
      } else {
        // 'random'
        biasFixedContainer.classList.add("hidden");
        biasRandomContainer.classList.remove("hidden");
        biasFixedSlider.disabled = true;
        biasRandomPositiveSlider.disabled = false;
        biasRandomNegativeSlider.disabled = false;

        const val1 = parseFloat(biasRandomPositiveSlider.value).toFixed(1);
        const val2 = parseFloat(biasRandomNegativeSlider.value).toFixed(1);
        biasRandomOption.textContent = `Random range: ${val1}s to ${val2}s`;
        biasFixedOption.textContent = `Fixed: ${parseFloat(biasFixedSlider.value).toFixed(1)}s`;
      }
    } else {
      biasControlsContainer.classList.add("hidden");
      biasTypeSelect.disabled = true;
      biasFixedContainer.classList.add("hidden");
      biasRandomContainer.classList.add("hidden");
      biasFixedSlider.disabled = true;
      biasRandomPositiveSlider.disabled = true;
      biasRandomNegativeSlider.disabled = true;

      biasFixedOption.textContent = `Fixed: 0.0s`;
      biasRandomOption.textContent = `Random range: 0.0s to 0.0s`;
    }
    if (
      settingsPanel &&
      mainMenuContent &&
      settingsPanel.classList.contains("active") &&
      intervalBiasSubmenu &&
      intervalBiasSubmenu.classList.contains("active")
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
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
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

    const biasEnabledCheckbox = instanceElement.querySelector(".bias-enabled");
    const biasTypeSelect = instanceElement.querySelector(".bias-type-select");
    const biasFixedSlider = instanceElement.querySelector(".bias-fixed-slider");
    const biasRandomPositiveSlider = instanceElement.querySelector(
      ".bias-random-positive-slider",
    );
    const biasRandomNegativeSlider = instanceElement.querySelector(
      ".bias-random-negative-slider",
    );
    const shotIntervalBiasSubmenu = instanceElement.querySelector(
      ".shot-interval-bias-submenu",
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

      if (initialState.bias) {
        if (biasEnabledCheckbox)
          biasEnabledCheckbox.checked = initialState.bias.enabled;
        if (biasTypeSelect) biasTypeSelect.value = initialState.bias.type;
        if (biasFixedSlider)
          biasFixedSlider.value = initialState.bias.fixedValue;
        if (biasRandomPositiveSlider)
          biasRandomPositiveSlider.value = initialState.bias.randomPositive;
        if (biasRandomNegativeSlider)
          biasRandomNegativeSlider.value = initialState.bias.randomNegative;
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
      });

    if (messageIntervalSlider)
      messageIntervalSlider.addEventListener("input", function () {
        const totalSeconds = parseInt(this.value);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
        if (messageIntervalValueSpan)
          messageIntervalValueSpan.textContent = `${minutes}:${formattedSeconds}`;
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
          const swapSuccessful = findNextAvailablePositionUp(instanceElement);
          if (swapSuccessful) {
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
          const swapSuccessful = findNextAvailablePositionDown(instanceElement);
          if (swapSuccessful) {
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

      // Close dropdown if click outside
      document.addEventListener("click", function (event) {
        if (
          settingsPanel &&
          !settingsPanel.contains(event.target) &&
          !settingsBtn.contains(event.target) &&
          settingsPanel.classList.contains("active")
        ) {
          toggleSettingsDropdown(settingsPanel, mainMenuContent);
        }
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
        if (biasEnabledCheckbox)
          biasEnabledCheckbox.addEventListener("change", () => {
            updateBiasControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalBiasSubmenu,
            );
            updateRocketIndicator(instanceElement);
          });
        if (biasTypeSelect)
          biasTypeSelect.addEventListener("change", () => {
            updateBiasControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalBiasSubmenu,
            );
            updateRocketIndicator(instanceElement);
          });
        if (biasFixedSlider)
          biasFixedSlider.addEventListener("input", () => {
            updateBiasControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalBiasSubmenu,
            );
            updateRocketIndicator(instanceElement);
          });
        if (biasRandomPositiveSlider) {
          biasRandomPositiveSlider.addEventListener("input", function () {
            if (
              biasRandomNegativeSlider &&
              parseFloat(this.value) <
                parseFloat(biasRandomNegativeSlider.value)
            ) {
              this.value = biasRandomNegativeSlider.value;
            }
            updateBiasControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalBiasSubmenu,
            );
            updateRocketIndicator(instanceElement);
          });
        }
        if (biasRandomNegativeSlider) {
          biasRandomNegativeSlider.addEventListener("input", function () {
            if (
              biasRandomPositiveSlider &&
              parseFloat(this.value) >
                parseFloat(biasRandomPositiveSlider.value)
            ) {
              this.value = biasRandomPositiveSlider.value;
            }
            updateBiasControls(
              instanceElement,
              settingsPanel,
              mainMenuContent,
              shotIntervalBiasSubmenu,
            );
            updateRocketIndicator(instanceElement);
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
          });
        }

        if (voiceRateSelect) {
          voiceRateSelect.addEventListener("change", function () {
            updateRocketIndicator(instanceElement);
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
        updateBiasControls(
          instanceElement,
          settingsPanel,
          mainMenuContent,
          shotIntervalBiasSubmenu,
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

      const biasEnabledCheckbox =
        instanceElement.querySelector(".bias-enabled");
      const biasTypeSelect = instanceElement.querySelector(".bias-type-select");
      const biasFixedSlider =
        instanceElement.querySelector(".bias-fixed-slider");
      const biasRandomPositiveSlider = instanceElement.querySelector(
        ".bias-random-positive-slider",
      );
      const biasRandomNegativeSlider = instanceElement.querySelector(
        ".bias-random-negative-slider",
      );

      state.bias = {
        enabled: biasEnabledCheckbox ? biasEnabledCheckbox.checked : false,
        type: biasTypeSelect ? biasTypeSelect.value : "fixed",
        fixedValue: biasFixedSlider ? biasFixedSlider.value : "0",
        randomPositive: biasRandomPositiveSlider
          ? biasRandomPositiveSlider.value
          : "0",
        randomNegative: biasRandomNegativeSlider
          ? biasRandomNegativeSlider.value
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

    const patternBiasEnabledCheckbox =
      patternElement.querySelector(".bias-enabled");
    const patternBiasTypeSelect =
      patternElement.querySelector(".bias-type-select");
    const patternBiasFixedSlider =
      patternElement.querySelector(".bias-fixed-slider");
    const patternBiasRandomPositiveSlider = patternElement.querySelector(
      ".bias-random-positive-slider",
    );
    const patternBiasRandomNegativeSlider = patternElement.querySelector(
      ".bias-random-negative-slider",
    );
    const patternIntervalBiasSubmenu = patternElement.querySelector(
      ".shot-interval-bias-submenu",
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

      if (initialState.bias) {
        if (patternBiasEnabledCheckbox)
          patternBiasEnabledCheckbox.checked = initialState.bias.enabled;
        if (patternBiasTypeSelect)
          patternBiasTypeSelect.value = initialState.bias.type;
        if (patternBiasFixedSlider)
          patternBiasFixedSlider.value = initialState.bias.fixedValue;
        if (patternBiasRandomPositiveSlider)
          patternBiasRandomPositiveSlider.value =
            initialState.bias.randomPositive;
        if (patternBiasRandomNegativeSlider)
          patternBiasRandomNegativeSlider.value =
            initialState.bias.randomNegative;
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
        if (patternShotIntervalValueSpan)
          patternShotIntervalValueSpan.textContent = `${parseFloat(this.value).toFixed(1)}s`;
        updateLeadTimeSlider(
          patternShotIntervalSlider,
          patternLeadTimeSlider,
          patternLeadTimeValueSpan,
        );
        updateRocketIndicator(patternElement);
      });

    if (patternLeadTimeSlider)
      patternLeadTimeSlider.addEventListener("input", function () {
        updateLeadTimeSlider(
          patternShotIntervalSlider,
          patternLeadTimeSlider,
          patternLeadTimeValueSpan,
        );
        updateRocketIndicator(patternElement);
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

    // Close dropdown if click outside
    document.addEventListener("click", function (event) {
      if (
        patternSettingsPanel &&
        !patternSettingsPanel.contains(event.target) &&
        !patternSettingsBtn.contains(event.target) &&
        patternSettingsPanel.classList.contains("active")
      ) {
        toggleSettingsDropdown(patternSettingsPanel, patternMainMenuContent);
      }
    });

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

    if (patternBiasEnabledCheckbox)
      patternBiasEnabledCheckbox.addEventListener("change", () => {
        updateBiasControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalBiasSubmenu,
        );
        updateRocketIndicator(patternElement);
      });
    if (patternBiasTypeSelect)
      patternBiasTypeSelect.addEventListener("change", () => {
        updateBiasControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalBiasSubmenu,
        );
        updateRocketIndicator(patternElement);
      });
    if (patternBiasFixedSlider)
      patternBiasFixedSlider.addEventListener("input", () => {
        updateBiasControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalBiasSubmenu,
        );
        updateRocketIndicator(patternElement);
      });
    if (patternBiasRandomPositiveSlider) {
      patternBiasRandomPositiveSlider.addEventListener("input", function () {
        if (
          patternBiasRandomNegativeSlider &&
          parseFloat(this.value) <
            parseFloat(patternBiasRandomNegativeSlider.value)
        ) {
          this.value = patternBiasRandomNegativeSlider.value;
        }
        updateBiasControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalBiasSubmenu,
        );
        updateRocketIndicator(patternElement);
      });
    }
    if (patternBiasRandomNegativeSlider) {
      patternBiasRandomNegativeSlider.addEventListener("input", function () {
        if (
          patternBiasRandomPositiveSlider &&
          parseFloat(this.value) >
            parseFloat(patternBiasRandomPositiveSlider.value)
        ) {
          this.value = patternBiasRandomPositiveSlider.value;
        }
        updateBiasControls(
          patternElement,
          patternSettingsPanel,
          patternMainMenuContent,
          patternIntervalBiasSubmenu,
        );
        updateRocketIndicator(patternElement);
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
      patternSplitStepSpeedSelect.addEventListener("change", function () {
        updateRocketIndicator(patternElement);
      });
    }

    if (patternVoiceRateSelect) {
      patternVoiceRateSelect.addEventListener("change", function () {
        updateRocketIndicator(patternElement);
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
    updateBiasControls(
      patternElement,
      patternSettingsPanel,
      patternMainMenuContent,
      patternIntervalBiasSubmenu,
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

    const biasEnabledCheckbox = patternElement.querySelector(".bias-enabled");
    const biasTypeSelect = patternElement.querySelector(".bias-type-select");
    const biasFixedSlider = patternElement.querySelector(".bias-fixed-slider");
    const biasRandomPositiveSlider = patternElement.querySelector(
      ".bias-random-positive-slider",
    );
    const biasRandomNegativeSlider = patternElement.querySelector(
      ".bias-random-negative-slider",
    );

    state.bias = {
      enabled: biasEnabledCheckbox ? biasEnabledCheckbox.checked : false,
      type: biasTypeSelect ? biasTypeSelect.value : "fixed",
      fixedValue: biasFixedSlider ? biasFixedSlider.value : "0",
      randomPositive: biasRandomPositiveSlider
        ? biasRandomPositiveSlider.value
        : "0",
      randomNegative: biasRandomNegativeSlider
        ? biasRandomNegativeSlider.value
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

    // Find if there are any patterns locked to last position
    const existingPatterns = Array.from(
      mainContainer.querySelectorAll(".pattern-instance"),
    );
    const lastLockedPattern = existingPatterns.find(
      (pattern) =>
        pattern.dataset.positionLocked === "true" &&
        pattern.dataset.positionLockType === "last",
    );

    if (lastLockedPattern) {
      // Insert before the last-locked pattern
      mainContainer.insertBefore(newInstance, lastLockedPattern);
    } else {
      // No last-locked patterns, append at the end
      mainContainer.appendChild(newInstance);
    }
    initializePatternInstance(newInstance, initialState);

    // Apply lock state to new pattern
    applyLockStateToElement(newInstance);

    // Initialize position lock button and link with previous button
    newInstance.dataset.positionCycleState = "0"; // Initialize cycle state
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
          const swapSuccessful = findNextAvailablePositionUp(patternElement);
          if (swapSuccessful) {
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
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
          const swapSuccessful = findNextAvailablePositionDown(patternElement);
          if (swapSuccessful) {
            updateAllPositionLockButtons();
            updateAllMoveButtonStates();
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
          const swapSuccessful = findNextAvailablePositionUp(
            shotMsgInstanceElement,
          );
          if (swapSuccessful) {
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
          const swapSuccessful = findNextAvailablePositionDown(
            shotMsgInstanceElement,
          );
          if (swapSuccessful) {
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

  // --- Save Workout Button ---
  if (saveWorkoutBtn) {
    saveWorkoutBtn.addEventListener("click", saveWorkout);
  } else {
    console.error("saveWorkoutBtn not found.");
  }

  // --- Load Workout Button ---
  if (loadWorkoutBtn) {
    loadWorkoutBtn.addEventListener("click", function () {
      workoutFileInput.click();
    });
  } else {
    console.error("loadWorkoutBtn not found.");
  }

  if (workoutFileInput) {
    workoutFileInput.addEventListener("change", handleFileLoad);
  } else {
    console.error("workoutFileInput not found.");
  }

  // --- Preview Workout Button ---
  const previewWorkoutBtn = document.getElementById("previewWorkoutBtn");
  const previewModal = document.getElementById("previewModal");
  const closePreviewBtn = document.getElementById("closePreviewBtn");
  const previewContent = document.getElementById("previewContent");

  if (previewWorkoutBtn) {
    previewWorkoutBtn.addEventListener("click", function () {
      generateWorkoutPreview();
    });
  } else {
    console.error("previewWorkoutBtn not found.");
  }

  if (closePreviewBtn) {
    closePreviewBtn.addEventListener("click", function () {
      previewModal.classList.add("hidden");
    });
  } else {
    console.error("closePreviewBtn not found.");
  }

  if (previewModal) {
    previewModal.addEventListener("click", function (e) {
      if (e.target === previewModal) {
        previewModal.classList.add("hidden");
      }
    });
  } else {
    console.error("previewModal not found.");
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
      defaultShotIntervalValue.textContent = `${parseFloat(this.value).toFixed(1)}s`;
      updateLeadTimeSlider(
        defaultShotIntervalSlider,
        defaultLeadTimeSlider,
        defaultLeadTimeValue,
      );
    });
  }

  if (defaultLeadTimeSlider) {
    defaultLeadTimeSlider.addEventListener("input", function () {
      updateLeadTimeSlider(
        defaultShotIntervalSlider,
        defaultLeadTimeSlider,
        defaultLeadTimeValue,
      );
    });
  }

  if (defaultBiasEnabled) {
    defaultBiasEnabled.addEventListener("change", updateDefaultBiasControls);
  }

  if (defaultBiasTypeSelect) {
    defaultBiasTypeSelect.addEventListener("change", updateDefaultBiasControls);
  }

  if (defaultBiasFixedSlider) {
    defaultBiasFixedSlider.addEventListener("input", updateDefaultBiasControls);
  }

  if (defaultBiasRandomPositiveSlider) {
    defaultBiasRandomPositiveSlider.addEventListener("input", function () {
      if (
        defaultBiasRandomNegativeSlider &&
        parseFloat(this.value) <
          parseFloat(defaultBiasRandomNegativeSlider.value)
      ) {
        this.value = defaultBiasRandomNegativeSlider.value;
      }
      updateDefaultBiasControls();
    });
  }

  if (defaultBiasRandomNegativeSlider) {
    defaultBiasRandomNegativeSlider.addEventListener("input", function () {
      if (
        defaultBiasRandomPositiveSlider &&
        parseFloat(this.value) >
          parseFloat(defaultBiasRandomPositiveSlider.value)
      ) {
        this.value = defaultBiasRandomPositiveSlider.value;
      }
      updateDefaultBiasControls();
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
  updateDefaultBiasControls();
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

    const previewHtml = WorkoutLib.generatePreviewHtml(enrichedWorkoutData);
    document.getElementById("previewContent").innerHTML = previewHtml;
    document.getElementById("previewWorkoutName").textContent =
      enrichedWorkoutData.name;
    document.getElementById("previewModal").classList.remove("hidden");
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
   *   1 2 3 l l 4 L, clone L => 1 2 l l 3 4 5 L' L
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
    const sourceGroup = getLinkedGroup(sourceElement);
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
   * @param {Element} element - The element to check (pattern or shot only)
   * @returns {boolean} True if the element has non-default settings
   */
  function hasNonDefaultSettings(element) {
    const defaults = getDefaultConfigValues();

    if (element.classList.contains("pattern-instance")) {
      // Check pattern-level settings (excluding names, position lock, linking, and repeat)
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

      // Check pattern settings
      if (patternIterationType !== defaults.iterationType) return true;
      if (patternLimitsType !== defaults.limitsType) return true;
      if (
        patternLimitsType === "shot-limit" &&
        patternShotLimit !== defaults.shotLimit
      )
        return true;
      if (
        patternLimitsType === "time-limit" &&
        patternTimeLimit !== defaults.timeLimit
      )
        return true;

      // Check pattern voice settings
      const patternVoiceEnabled =
        element.querySelector(".voice-enabled")?.checked;
      const patternVoice = element.querySelector(".voice-select")?.value;
      const patternVoiceRate =
        element.querySelector(".voice-rate-select")?.value;

      if (patternVoiceEnabled !== defaults.voice.enabled) return true;
      if (patternVoiceEnabled && patternVoice !== defaults.voice.voiceName)
        return true;
      if (patternVoiceEnabled && patternVoiceRate !== defaults.voice.rate)
        return true;
    } else if (element.classList.contains("shot-instance")) {
      // Check shot-specific settings (excluding names, position lock, linking, and repeat)
      const shotInterval = element.querySelector(
        ".shot-interval-slider",
      )?.value;
      const shotLeadTime = element.querySelector(".lead-time-slider")?.value;

      // Check shot settings
      if (shotInterval !== defaults.shotInterval) return true;
      if (shotLeadTime !== defaults.leadTime) return true;

      // Check shot bias settings
      const biasEnabled = element.querySelector(".bias-enabled")?.checked;
      const biasType = element.querySelector(".bias-type-select")?.value;
      const biasFixed = element.querySelector(".bias-fixed-slider")?.value;
      const biasPos = element.querySelector(
        ".bias-random-positive-slider",
      )?.value;
      const biasNeg = element.querySelector(
        ".bias-random-negative-slider",
      )?.value;

      if (biasEnabled !== defaults.bias.enabled) return true;
      if (biasEnabled) {
        if (biasType !== defaults.bias.type) return true;
        if (biasFixed !== defaults.bias.fixedValue) return true;
        if (biasPos !== defaults.bias.randomPositive) return true;
        if (biasNeg !== defaults.bias.randomNegative) return true;
      }

      // Check shot split-step settings
      const splitStepEnabled = element.querySelector(
        ".split-step-enabled",
      )?.checked;
      const splitStepSpeed = element.querySelector(
        ".split-step-speed-select",
      )?.value;

      if (splitStepEnabled !== defaults.splitStep.enabled) return true;
      if (splitStepEnabled && splitStepSpeed !== defaults.splitStep.rate)
        return true;

      // Check shot voice settings
      const voiceEnabled = element.querySelector(".voice-enabled")?.checked;
      const voice = element.querySelector(".voice-select")?.value;
      const voiceRate = element.querySelector(".voice-rate-select")?.value;

      if (voiceEnabled !== defaults.voice.enabled) return true;
      if (voiceEnabled && voice !== defaults.voice.voiceName) return true;
      if (voiceEnabled && voiceRate !== defaults.voice.rate) return true;
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

      // Check shot bias settings
      const biasEnabled = element.querySelector(".bias-enabled")?.checked;
      const biasType = element.querySelector(".bias-type-select")?.value;
      const biasFixed = element.querySelector(".bias-fixed-slider")?.value;
      const biasPos = element.querySelector(
        ".bias-random-positive-slider",
      )?.value;
      const biasNeg = element.querySelector(
        ".bias-random-negative-slider",
      )?.value;

      if (biasEnabled !== defaults.bias.enabled) {
        nonDefaultSettings.push({
          name: "Bias",
          value: biasEnabled ? "Enabled" : "Disabled",
        });
      }
      if (biasEnabled) {
        if (biasType !== defaults.bias.type) {
          nonDefaultSettings.push({
            name: "Bias Type",
            value: biasType === "fixed" ? "Fixed" : "Random",
          });
        }
        if (biasType === "fixed" && biasFixed !== defaults.bias.fixedValue) {
          nonDefaultSettings.push({
            name: "Bias Fixed Value",
            value: `${parseFloat(biasFixed).toFixed(1)}s`,
          });
        }
        if (biasType === "random") {
          if (biasPos !== defaults.bias.randomPositive) {
            nonDefaultSettings.push({
              name: "Bias Random Positive",
              value: `${parseFloat(biasPos).toFixed(1)}s`,
            });
          }
          if (biasNeg !== defaults.bias.randomNegative) {
            nonDefaultSettings.push({
              name: "Bias Random Negative",
              value: `${parseFloat(biasNeg).toFixed(1)}s`,
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
      "Shot Interval": "shot-interval-bias-submenu",
      "Lead Time": "voice-submenu", // Lead time is in the voice submenu
      Bias: "shot-interval-bias-submenu",
      "Bias Type": "shot-interval-bias-submenu",
      "Bias Fixed Value": "shot-interval-bias-submenu",
      "Bias Random Positive": "shot-interval-bias-submenu",
      "Bias Random Negative": "shot-interval-bias-submenu",
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
      const biasEnabled = element.querySelector(".bias-enabled");
      const biasType = element.querySelector(".bias-type-select");
      const biasFixed = element.querySelector(".bias-fixed-slider");
      const biasPos = element.querySelector(".bias-random-positive-slider");
      const biasNeg = element.querySelector(".bias-random-negative-slider");
      const splitStepEnabled = element.querySelector(".split-step-enabled");
      const splitStepSpeed = element.querySelector(".split-step-speed-select");
      const voiceEnabled = element.querySelector(".voice-enabled");
      const voice = element.querySelector(".voice-select");
      const voiceRate = element.querySelector(".voice-rate-select");

      if (shotInterval) shotInterval.value = defaults.shotInterval;
      if (shotLeadTime) shotLeadTime.value = defaults.leadTime;
      if (biasEnabled) biasEnabled.checked = defaults.bias.enabled;
      if (biasType) biasType.value = defaults.bias.type;
      if (biasFixed) biasFixed.value = defaults.bias.fixedValue;
      if (biasPos) biasPos.value = defaults.bias.randomPositive;
      if (biasNeg) biasNeg.value = defaults.bias.randomNegative;
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

      // Update bias controls visibility and labels
      const biasControlsContainer = element.querySelector(
        ".bias-controls-container",
      );
      const biasToggleLabel = element.querySelector(".bias-toggle-label");
      if (biasControlsContainer) {
        if (defaults.bias.enabled) {
          biasControlsContainer.classList.remove("hidden");
          if (biasToggleLabel) biasToggleLabel.textContent = "Bias enabled";
        } else {
          biasControlsContainer.classList.add("hidden");
          if (biasToggleLabel) biasToggleLabel.textContent = "Bias disabled";
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
});
