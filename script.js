document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  let sequences = [];
  let activeSequenceIndex = -1; // -1 means no sequence is actively being edited
  let selectedPatternId = null; // Store the ID of the selected row for focus tracking
  let isMoveModeOn = false; // State for move mode in the accordion list
  let isDeleteModeOn = false; // State for delete mode in the accordion list
  let workoutOrderMode = 'in-order'; // State for global workout order
  let workoutCountdownTime = 0; // State for workout countdown
  let globalLimitType = 'all'; // 'all', 'shot', or 'time'
  let globalShotLimit = 0;
  let globalTimeLimit = 60;
  let workoutElapsedTime = 0; // Tracks elapsed time in current workout
  let workoutTimerInterval = null; // Interval ID for the workout elapsed time display


  const mainViewContainer = document.getElementById('main-view-container');
  const patternsAccordionContainer = document.getElementById('patterns-accordion-container');
  const patternListItemTemplate = document.getElementById('pattern-list-item-template'); // Template for list items
  const patternEditorContainer = document.getElementById('pattern-editor-container'); // The dedicated editor screen
  const sequencesContainer = document.getElementById('sequences-container'); // Used for the old editor structure
  const sequenceTemplate = document.getElementById('sequence-template'); // Used for the old editor structure

  const appContainer = document.getElementById('app-container');
  const globalControls = document.getElementById('global-controls');
  const movePatternToggleButton = document.getElementById('move-pattern-toggle-btn');
  const deletePatternToggleButton = document.getElementById('delete-pattern-toggle-btn');
  const newPatternBtn = document.getElementById('new-pattern-btn');

  const startWorkoutButton = document.getElementById('start-workout-btn');
  const startWorkoutContainer = document.getElementById('start-workout-container');

  const globalWorkoutOrderOptions = document.getElementById('global-workout-order-options');
  const globalWorkoutOrderRadios = globalWorkoutOrderOptions.querySelectorAll('input[name="globalWorkoutOrder"]');

  // --- Countdown Elements ---
  const workoutCountdownSlider = document.getElementById('workout-countdown-slider');
  const workoutCountdownDisplay = document.getElementById('workout-countdown-display');

  // --- Global Limit Elements ---
  const globalLimitTypeSelect = document.getElementById('global-limit-type');
  const globalShotLimitControls = document.getElementById('global-shot-limit-controls');
  const globalShotLimitSlider = document.getElementById('global-shot-limit-slider');
  const globalShotLimitDisplay = document.getElementById('global-shot-limit-display');
  const globalTimeLimitControls = document.getElementById('global-time-limit-controls');
  const globalTimeLimitSlider = document.getElementById('global-time-limit-slider');
  const globalTimeLimitDisplay = document.getElementById('global-time-limit-display');


  // --- Workout View Elements ---
  const workoutViewContainer = document.getElementById('workout-view-container');
  const stopWorkoutBtn = document.getElementById('stop-workout-btn');
  const pauseResumeWorkoutBtn = document.getElementById('pause-resume-workout-btn');
  const currentShotDisplay = document.getElementById('current-shot-display');
  const progressBar = document.getElementById('progress-bar');
  const workoutElapsedTimeDisplay = document.getElementById('workout-elapsed-time-display'); // Elapsed time display

  const appBanner = document.getElementById('app-banner'); // Reference to the image banner
  const appFooter = document.getElementById('app-footer'); // Reference to the footer image banner


  // --- Web Audio API ---
  let audioContext = null;

  // --- Speech Synthesis API ---
  let synth = null;
  let isRoutineRunning = false;
  let nextSilentUtteranceTimeout = null;

  // --- Speech Voice & Rate state (for global usage during workout) ---
  let globalSpeechVoice = null; // Stores the selected SpeechSynthesisVoice object
  let globalSpeechRate = 1.0;

  // --- SVG Icons ---
  const PAUSE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="4" height="16" x="14" y="4" rx="1"/><rect width="4" height="16" x="6" y="4" rx="1"/></svg>`;
  const PLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m6 3 14 9-14 9z"/></svg>`;
  const STOP_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>`;
  const REPLAY_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;
  const EXIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6M3 3l9 9M3 9V3h6"/></svg>`;


  // --- UTILITY FUNCTIONS ---
  /**
   * Formats a given number of seconds into a MM:SS string.
   * @param {number} totalSeconds - The total number of seconds.
   * @returns {string} Formatted time string (MM:SS).
   */
  const formatTime = (totalSeconds) => {
    const roundedSeconds = Math.round(totalSeconds);
    if (roundedSeconds === 0) return '00:00'; // Ensure 0 is formatted as 00:00
    const minutes = Math.floor(roundedSeconds / 60);
    const seconds = roundedSeconds % 60;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${formattedMinutes}:${formattedSeconds}`;
  };

  /**
   * Returns a new default pattern data object.
   * @returns {object} Default pattern configuration.
   */
  const getNewSequenceData = () => {
    const defaultShotOptions = 'Front left\nFront right\nMid left\nMid right\nBack left\nBack right';
    const defaultMaxShots = 20;
    const defaultMaxTimeSeconds = 120; // 2 minutes
    return {
      id: Date.now() + Math.random(),
      patternName: 'New Pattern',
      shotOptions: defaultShotOptions,
      announceShots: true,
      introMessage: '',
      outroMessage: '',
      seriesOrder: 'in-order',
      shotInterval: 6.0,
      randomOffset: 0.0,
      nextShotAnnouncement: 2.0,
      splitStepHint: 'None',
      limitType: 'shot',
      patternLimit: defaultMaxShots,
      postSequenceRest: 0,
      previousShotLimit: defaultMaxShots,
      previousTimeLimit: defaultMaxTimeSeconds,
      speechRate: 1.0,
      speechVoice: 'default'
    };
  };

  /**
   * Scrolls the app container to the top smoothly.
   */
  const focusOnTop = () => {
    if(appContainer) {
      appContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /**
   * Sanitizes a string for use as a filename.
   * @param {string} name - The original string.
   * @returns {string} The sanitized string.
   */
  const sanitizeFilename = (name) => {
    return name.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-');
  };

  /**
   * Validates if a given object matches the expected pattern configuration structure.
   * @param {object} data - The object to validate.
   * @returns {boolean} True if the object is a valid pattern configuration, false otherwise.
   */
  const isValidPatternConfig = (data) => {
    const requiredProps = [
      'patternName', 'shotOptions', 'announceShots', 'introMessage', 'outroMessage',
      'seriesOrder', 'shotInterval', 'randomOffset', 'nextShotAnnouncement', 'splitStepHint', 'limitType', 'patternLimit',
      'postSequenceRest', 'speechRate', 'speechVoice'
    ];
    const hasAllProps = requiredProps.every(prop => Object.prototype.hasOwnProperty.call(data, prop));
    if (!hasAllProps) return false;
    if (typeof data.patternName !== 'string' ||
        typeof data.shotOptions !== 'string' ||
        typeof data.announceShots !== 'boolean' ||
        typeof data.introMessage !== 'string' ||
        typeof data.outroMessage !== 'string' ||
        !['in-order', 'randomized'].includes(data.seriesOrder) ||
        typeof data.shotInterval !== 'number' ||
        typeof data.randomOffset !== 'number' ||
        typeof data.nextShotAnnouncement !== 'number' ||
        !['None', 'Slow', 'Medium', 'Fast', 'Random'].includes(data.splitStepHint) ||
        !['shot', 'time'].includes(data.limitType) ||
        typeof data.patternLimit !== 'number' ||
        typeof data.postSequenceRest !== 'number' ||
        typeof data.speechRate !== 'number' ||
        typeof data.speechVoice !== 'string') {
        return false;
    }
    return true;
  };

  /**
   * Validates if a given object matches the expected workout file structure.
   * @param {object} data - The object to validate.
   * @returns {boolean} True if the object is a valid workout file, false otherwise.
   */
  const isValidWorkoutFile = (data) => {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
          return false;
      }
      if (!Object.prototype.hasOwnProperty.call(data, 'patterns') || !Object.prototype.hasOwnProperty.call(data, 'globalSettings')) {
          return false;
      }
      return Array.isArray(data.patterns) && data.patterns.every(isValidPatternConfig);
  };

  // Custom Alert Modal elements
  const alertModal = document.getElementById('alert-modal');
  const alertTitle = document.getElementById('alert-title');
  const alertMessage = document.getElementById('alert-message');
  const alertOkBtn = document.getElementById('alert-ok-btn');

  /**
   * Displays a custom alert modal to the user.
   * @param {string} title - The title of the alert.
   * @param {string} message - The message content of the alert.
   */
  const showAlert = (title, message) => {
      alertTitle.textContent = title;
      alertMessage.textContent = message;
      alertModal.classList.remove('hidden');
      alertOkBtn.onclick = () => {
          alertModal.classList.add('hidden');
      };
  };

  /**
   * Sets the interaction mode (move, delete, or none) for the pattern list.
   * Updates UI elements to reflect the active mode.
   * @param {string|null} mode - 'move', 'delete', or null to turn off modes.
   */
  const setInteractionMode = (mode) => {
      const wasMoveModeOn = isMoveModeOn;
      const wasDeleteModeOn = isDeleteModeOn;

      isMoveModeOn = (mode === 'move');
      isDeleteModeOn = (mode === 'delete');

      // Update toggle button visuals
      movePatternToggleButton.classList.toggle('bg-blue-600', isMoveModeOn);
      movePatternToggleButton.classList.toggle('text-white', isMoveModeOn);
      movePatternToggleButton.classList.toggle('bg-gray-200', !isMoveModeOn);
      movePatternToggleButton.classList.toggle('text-gray-700', !isMoveModeOn);
      movePatternToggleButton.classList.toggle('dark:bg-gray-700', !isMoveModeOn);
      movePatternToggleButton.classList.toggle('dark:text-gray-300', !isMoveModeOn);
      movePatternToggleButton.dataset.state = isMoveModeOn ? 'on' : 'off';

      deletePatternToggleButton.classList.toggle('bg-red-600', isDeleteModeOn);
      deletePatternToggleButton.classList.toggle('text-white', isDeleteModeOn);
      deletePatternToggleButton.classList.toggle('bg-gray-200', !isDeleteModeOn);
      deletePatternToggleButton.classList.toggle('text-gray-700', !isDeleteModeOn);
      deletePatternToggleButton.classList.toggle('dark:bg-gray-700', !isDeleteModeOn);
      deletePatternToggleButton.classList.toggle('dark:text-gray-300', !isDeleteModeOn);
      deletePatternToggleButton.dataset.state = isDeleteModeOn ? 'on' : 'off';

      // Re-render accordion if a mode state actually changed to show/hide specific buttons/icons.
      if (wasMoveModeOn !== isMoveModeOn || wasDeleteModeOn !== isDeleteModeOn) {
          renderAccordionView();
      }
      // Apply global disabling for buttons not related to the active mode.
      toggleOtherButtons();
  };

  /**
   * Disables or enables various UI elements based on the current interaction mode (move/delete).
   */
  const toggleOtherButtons = () => {
      const disableGlobalActions = isMoveModeOn || isDeleteModeOn;

      const loadAllBtn = document.getElementById('load-all-btn');
      const saveAllBtn = document.getElementById('save-all-btn');
      const resetAllBtn = document.getElementById('reset-all-btn');
      const startWorkoutBtn = document.getElementById('start-workout-btn');

      const elementsToToggleDisable = [
          newPatternBtn, loadAllBtn, saveAllBtn, startWorkoutBtn
      ];

      // Elements in the editor view
      const backToListBtn = document.getElementById('back-to-list-btn');
      const cloneBtn = document.getElementById('clone-btn');
      const importBtn = document.getElementById('import-btn');
      const saveBtn = document.getElementById('save-btn');
      const resetBtn = document.getElementById('reset-btn');


      elementsToToggleDisable.forEach(element => {
          if (element) {
              element.disabled = disableGlobalActions;
          }
      });

      // Specific handling for mode toggle buttons (mutually exclusive)
      if (movePatternToggleButton) {
          movePatternToggleButton.disabled = isDeleteModeOn;
      }
      if (deletePatternToggleButton) {
          deletePatternToggleButton.disabled = isMoveModeOn;
      }

      // Global Reset button is never disabled by these modes.
      if (resetAllBtn) {
        resetAllBtn.disabled = false;
      }

      // Disable/enable elements inside the *editor* view if it's visible
      if (!patternEditorContainer.classList.contains('hidden')) {
          const currentEl = sequencesContainer.firstChild; // Get the currently active cloned sequence element
          if (currentEl) {
              // Accordion buttons and input fields inside the editor
              currentEl.querySelectorAll('#accordion-color button[data-accordion-target]').forEach(accordionBtn => {
                  accordionBtn.disabled = disableGlobalActions;
                  accordionBtn.classList.toggle('opacity-50', disableGlobalActions);
                  accordionBtn.classList.toggle('cursor-not-allowed', disableGlobalActions);
              });

              currentEl.querySelectorAll('input:not([type="hidden"]), textarea, select').forEach(inputField => {
                  const isInternallyDisabled = (inputField.id === 'nextShotAnnouncement' && !currentEl.querySelector('#announceShots').checked);
                  inputField.disabled = disableGlobalActions || isInternallyDisabled;
                  inputField.classList.toggle('opacity-50', disableGlobalActions || isInternallyDisabled);
                  inputField.classList.toggle('cursor-not-allowed', disableGlobalActions || isInternallyDisabled);
              });

              const editorButtonsToToggle = [backToListBtn, cloneBtn, importBtn, saveBtn, resetBtn];
              editorButtonsToToggle.forEach(element => {
                  if (element) {
                      element.disabled = disableGlobalActions;
                      element.classList.toggle('opacity-50', disableGlobalActions);
                      element.classList.toggle('cursor-not-allowed', disableGlobalActions);
                  }
              });

              const patternNameDisplay = currentEl.querySelector('#pattern-name-display');
              if (patternNameDisplay) {
                if (disableGlobalActions) {
                    patternNameDisplay.classList.remove('cursor-pointer');
                    patternNameDisplay.style.pointerEvents = 'none';
                } else {
                    patternNameDisplay.classList.add('cursor-pointer');
                    patternNameDisplay.style.pointerEvents = 'auto';
                }
              }
          }
      }
  };


  // --- VIEW MANAGEMENT ---
  /**
   * Shows a specific view of the application (main list, editor, or workout).
   * @param {string} view - The view to show ('main', 'editor', or 'workout').
   */
  const showView = (view) => {
      // Reset appContainer styles before applying view-specific ones
      appContainer.classList.remove(
        'max-w-2xl', 'rounded-xl', 'bg-white', 'p-6', 'shadow-lg', 'dark:bg-gray-800',
        'absolute', 'inset-0', 'flex', 'flex-col', 'items-center', 'justify-center'
      );
      document.body.classList.remove('items-center', 'justify-center', 'p-0');

      // Hide all view containers initially
      mainViewContainer.classList.add('hidden');
      startWorkoutContainer.classList.add('hidden');
      globalControls.classList.add('hidden');
      workoutViewContainer.classList.add('hidden');
      patternEditorContainer.classList.add('hidden');
      // App Banner & Footer visibility handling
      document.getElementById('app-banner-container').classList.remove('hidden');
      document.getElementById('app-footer-container').classList.remove('hidden');


      if (view === 'main') {
          appContainer.classList.add('max-w-2xl', 'rounded-xl', 'bg-white', 'p-6', 'shadow-lg', 'dark:bg-gray-800');
          document.body.classList.add('items-center', 'justify-center');
          mainViewContainer.classList.remove('hidden');
          startWorkoutContainer.classList.remove('hidden');
          globalControls.classList.remove('hidden');
          globalWorkoutOrderOptions.classList.remove('hidden');
          renderAccordionView(); // Render the list
          updateGlobalLimitControls();
          calculateTotalWorkoutTime();
          focusOnTop();
          setInteractionMode(null); // Ensure modes are off when entering main view
      } else if (view === 'editor') {
          appContainer.classList.add('max-w-2xl', 'rounded-xl', 'bg-white', 'p-6', 'shadow-lg', 'dark:bg-gray-800');
          document.body.classList.add('items-center', 'justify-center');
          patternEditorContainer.classList.remove('hidden');
          globalWorkoutOrderOptions.classList.add('hidden'); // Hide radios in editor
          renderPatternEditor(); // Populate the editor with activePatternId's data
          focusOnTop();
          // No mode selection in editor, so ensure modes are off
          isMoveModeOn = false;
          isDeleteModeOn = false;
          toggleOtherButtons(); // Update button states based on being in editor
      } else if (view === 'workout') {
          appContainer.classList.add('absolute', 'inset-0', 'flex', 'flex-col');
          document.body.classList.add('p-0');
          workoutViewContainer.classList.remove('hidden');
          document.getElementById('app-banner-container').classList.add('hidden'); // Hide app banner on workout screen
          document.getElementById('app-footer-container').classList.add('hidden'); // Hide app footer on workout screen
          globalWorkoutOrderOptions.classList.add('hidden'); // Hide radios in workout view
          focusOnTop();
      }
  };

  // --- ESTIMATED WORKOUT TIME CALCULATION ---
  /**
   * Calculates and displays the estimated total workout time in the "Start" button.
   */
  const calculateTotalWorkoutTime = () => {
      let totalTime = 0;
      if (globalLimitType === 'time') {
          totalTime = globalTimeLimit;
      } else if (globalLimitType === 'shot') {
          // Calculate average shot interval across all patterns to estimate time for global shot limit
          let totalIntervalSum = 0;
          let patternCountWithShots = 0;
          sequences.forEach(pattern => {
              const shotsInPattern = (pattern.shotOptions || '').trim().split(/[\n,]+/).filter(Boolean).length;
              if (shotsInPattern > 0) {
                  // Average expected interval for this pattern
                  totalIntervalSum += (parseFloat(pattern.shotInterval) + parseFloat(pattern.randomOffset) / 2);
                  patternCountWithShots++;
              }
          });

          if (patternCountWithShots > 0) {
              const averageShotInterval = totalIntervalSum / patternCountWithShots;
              totalTime = globalShotLimit * averageShotInterval;
          } else {
              totalTime = 0; // No patterns with shots, so estimated time for shots is 0
          }
      } else { // globalLimitType === 'all'
          sequences.forEach(pattern => {
              let patternDuration = 0;
              if (pattern.limitType === 'time') {
                  patternDuration = pattern.patternLimit;
              } else if (pattern.limitType === 'shot') {
                  // Use average interval for estimation
                  patternDuration = pattern.patternLimit * (parseFloat(pattern.shotInterval) + parseFloat(pattern.randomOffset) / 2);
              }
              totalTime += patternDuration;
              totalTime += pattern.postSequenceRest;
          });
      }
      startWorkoutButton.textContent = `Start (${formatTime(totalTime)})`;
  };


  // --- ACCORDION LIST VIEW RENDERING ---
  /**
   * Renders or re-renders the accordion list of patterns in the main view.
   */
  const renderAccordionView = () => {
      patternsAccordionContainer.innerHTML = '';
      if (sequences.length === 0) {
          const noPatternsMessage = document.createElement('div');
          noPatternsMessage.classList.add('p-6', 'text-center', 'text-gray-500', 'dark:text-gray-400');
          noPatternsMessage.textContent = 'No patterns configured. Click the "+" button to add one.';
          patternsAccordionContainer.appendChild(noPatternsMessage);
          updateGlobalLimitControls();
          return;
      }

      sequences.forEach((pattern, index) => {
          const newAccordionItem = patternListItemTemplate.content.cloneNode(true).firstElementChild;
          newAccordionItem.dataset.patternId = pattern.id;
          newAccordionItem.dataset.index = index;

          const patternNameDisplay = newAccordionItem.querySelector('.pattern-name-display');
          const deleteToggle = newAccordionItem.querySelector('.delete-toggle');
          const chevronUpToggle = newAccordionItem.querySelector('.chevron-up-toggle');
          const chevronDownToggle = newAccordionItem.querySelector('.chevron-down-toggle');
          const accordionHeader = newAccordionItem.querySelector('.accordion-header');
          const patternSummarySpan = newAccordionItem.querySelector('.pattern-summary');

          patternNameDisplay.textContent = pattern.patternName;

          // Update summary text
          const limitText = pattern.limitType === 'shot' ? `${pattern.patternLimit} shots` : formatTime(pattern.patternLimit);
          let splitStepHintText = pattern.splitStepHint === 'None' ? '' : `, Hint: ${pattern.splitStepHint}`;
          patternSummarySpan.textContent = `Shots: ${(pattern.shotOptions || '').trim().split(/[\n,]+/).filter(Boolean).length}, Limit: ${limitText}, Interval: ${pattern.shotInterval}s${splitStepHintText}`;


          // Set visibility of move/delete icons based on mode
          if (isDeleteModeOn) {
              deleteToggle.classList.remove('hidden');
          } else {
              deleteToggle.classList.add('hidden');
          }
          if (isMoveModeOn) {
              chevronUpToggle.classList.remove('hidden');
              chevronDownToggle.classList.remove('hidden');
          } else {
              chevronDownToggle.classList.add('hidden');
              chevronUpToggle.classList.add('hidden');
          }

          // Disable/enable move arrows based on position
          if (index === 0) {
              chevronUpToggle.classList.add('opacity-30', 'cursor-not-allowed');
          } else {
              chevronUpToggle.classList.remove('opacity-30', 'cursor-not-allowed');
          }
          if (index === sequences.length - 1) {
              chevronDownToggle.classList.add('opacity-30', 'cursor-not-allowed');
          } else {
              chevronDownToggle.classList.remove('opacity-30', 'cursor-not-allowed');
          }

          // Apply 'selected-row' class if this pattern is currently selected in the list.
          // Only apply if no mode is active, otherwise selection is implicit by mode.
          if (selectedPatternId === pattern.id && !isMoveModeOn && !isDeleteModeOn) {
            newAccordionItem.classList.add('selected-row');
          } else {
            newAccordionItem.classList.remove('selected-row');
          }


          // Add click listener for header to navigate to editor or trigger mode action
          accordionHeader.addEventListener('click', (e) => {
              const clickedElement = e.target;
              if (isMoveModeOn) {
                  if (clickedElement.closest('.chevron-up-toggle')) {
                      movePattern(index, 'up');
                  } else if (clickedElement.closest('.chevron-down-toggle')) {
                      movePattern(index, 'down');
                  }
                  e.stopPropagation(); // Prevent navigation/other clicks
              } else if (isDeleteModeOn) {
                  if (clickedElement.closest('.delete-toggle')) {
                      showConfirmationModalForDelete(index);
                  }
                  e.stopPropagation(); // Prevent navigation/other clicks
              } else {
                  // Normal mode: clicking the header (or pattern name) opens the editor
                  if (clickedElement.closest('.pattern-name-display') || clickedElement.closest('.right-chevron')) {
                      activeSequenceIndex = index; // Set the active pattern for the editor
                      showView('editor'); // Navigate to editor view
                      e.stopPropagation(); // Prevent any other clicks from propagating
                  }
              }
          });

          patternsAccordionContainer.appendChild(newAccordionItem);
      });
      toggleOtherButtons(); // Ensure global buttons react to mode changes
      updateGlobalLimitControls();
  };

  /**
   * Renders the editor view with the data of the currently active pattern.
   */
  const renderPatternEditor = () => {
      sequencesContainer.innerHTML = ''; // Clear any previous content in the sequences container
      if (activeSequenceIndex === -1 || sequences.length === 0) {
          showView('main'); // Go back if no active pattern found
          showAlert('Error', 'Could not load pattern editor.');
          return;
      }

      const currentData = sequences[activeSequenceIndex];
      const newSequenceEl = sequenceTemplate.content.cloneNode(true).firstElementChild; // Clone the template content
      newSequenceEl.id = `sequence-${currentData.id}`; // Give the cloned element a unique ID

      sequencesContainer.appendChild(newSequenceEl); // Add the cloned element to the container

      // Get references to elements *within* the newly cloned sequence element
      const patternNameDisplay = newSequenceEl.querySelector('#pattern-name-display');
      const shotOptions = newSequenceEl.querySelector('#shotOptions');
      const announceShots = newSequenceEl.querySelector('#announceShots');
      const introMessage = newSequenceEl.querySelector('#introMessage');
      const outroMessage = newSequenceEl.querySelector('#outroMessage');
      const seriesOrderRadios = newSequenceEl.querySelectorAll('input[name="seriesOrder"]');
      const shotInterval = newSequenceEl.querySelector('#shotInterval');
      const randomOffset = newSequenceEl.querySelector('#randomOffset');
      const nextShotAnnouncement = newSequenceEl.querySelector('#nextShotAnnouncement');
      const splitStepHintSelect = newSequenceEl.querySelector('#splitStepHint');
      const limitTypeSelect = newSequenceEl.querySelector('#limitTypeSelect');
      const patternLimitSlider = newSequenceEl.querySelector('#patternLimitSlider');
      const postSequenceRest = newSequenceEl.querySelector('#postSequenceRest');

      // Speech Rate and Voice elements
      const speechRateSlider = newSequenceEl.querySelector('#speechRate');
      const speechRateValueDisplay = newSequenceEl.querySelector('#speechRateValue');
      const speechVoiceSelect = newSequenceEl.querySelector('#speechVoiceSelect');


      // Set values to editor fields from currentData
      patternNameDisplay.textContent = currentData.patternName;
      shotOptions.value = currentData.shotOptions;
      announceShots.checked = currentData.announceShots;
      introMessage.value = currentData.introMessage;
      outroMessage.value = currentData.outroMessage;
      seriesOrderRadios.forEach(radio => radio.checked = (radio.value === currentData.seriesOrder));
      shotInterval.value = currentData.shotInterval;
      randomOffset.value = currentData.randomOffset;
      nextShotAnnouncement.value = currentData.nextShotAnnouncement;
      splitStepHintSelect.value = currentData.splitStepHint;
      limitTypeSelect.value = currentData.limitType;
      patternLimitSlider.value = currentData.patternLimit;
      postSequenceRest.value = currentData.postSequenceRest;

      // Set speech rate and voice
      speechRateSlider.value = currentData.speechRate;
      speechRateValueDisplay.textContent = currentData.speechRate.toFixed(1);
      populateVoiceList(speechVoiceSelect, currentData.speechVoice); // Pass the specific select element and current voice


      // Apply specific logic for sliders/displays
      handleAnnounceShotsChange(newSequenceEl); // Update nextShotAnnouncement max/disabled state
      handleLimitTypeChange(newSequenceEl); // Update patternLimitSlider min/max/value based on type
      updateAllDisplays(newSequenceEl); // Update all summary texts

      initFlowbite(); // Initialize Flowbite for the new accordion elements
      patternNameDisplay.addEventListener('click', () => editPatternName(currentData, patternNameDisplay));
      toggleOtherButtons(); // Update button states based on being in editor
  };


  /**
   * Saves the current state of the editor's input fields back to the `sequences` array.
   */
  const saveCurrentSequenceState = () => {
      // Only proceed if a pattern is selected and the editor is currently visible
      if (activeSequenceIndex === -1 || sequences.length === 0 || patternEditorContainer.classList.contains('hidden')) {
          console.log('saveCurrentSequenceState: Conditions not met (editor hidden or no active pattern), skipping save.');
          return;
      }

      const currentData = sequences[activeSequenceIndex];
      const currentEl = sequencesContainer.firstChild; // This should be the cloned template element
      if (!currentEl) {
          console.log('saveCurrentSequenceState: currentEl is null, skipping save.');
          return;
      }

      // Get references to elements, adding null checks
      const patternNameDisplay = currentEl.querySelector('#pattern-name-display');
      const shotOptions = currentEl.querySelector('#shotOptions');
      const announceShots = currentEl.querySelector('#announceShots');
      const introMessage = currentEl.querySelector('#introMessage');
      const outroMessage = currentEl.querySelector('#outroMessage');
      const seriesOrderCheckedRadio = currentEl.querySelector('input[name="seriesOrder"]:checked');
      const shotInterval = currentEl.querySelector('#shotInterval');
      const randomOffset = currentEl.querySelector('#randomOffset');
      const nextShotAnnouncement = currentEl.querySelector('#nextShotAnnouncement');
      const splitStepHintSelect = currentEl.querySelector('#splitStepHint');
      const limitTypeSelect = currentEl.querySelector('#limitTypeSelect');
      const patternLimitSlider = currentEl.querySelector('#patternLimitSlider');
      const postSequenceRest = currentEl.querySelector('#postSequenceRest');

      // Speech Rate and Voice elements
      const speechRateSlider = currentEl.querySelector('#speechRate');
      const speechVoiceSelect = currentEl.querySelector('#speechVoiceSelect');


      // Before attempting to access properties, ensure the element exists.
      // If any critical element is null, log an error and exit.
      if (!patternNameDisplay || !shotOptions || !announceShots || !introMessage || !outroMessage ||
          !seriesOrderCheckedRadio || !shotInterval || !randomOffset || !nextShotAnnouncement ||
          !splitStepHintSelect || !limitTypeSelect || !patternLimitSlider || !postSequenceRest ||
          !speechRateSlider || !speechVoiceSelect) {
          console.error('saveCurrentSequenceState: One or more required editor elements are null. Skipping save.');
          return;
      }

      // Save the current patternLimit to the appropriate 'previous' field before updating currentData
      if (currentData.limitType === 'shot') {
          currentData.previousShotLimit = parseInt(patternLimitSlider.value);
      }
      else if (currentData.limitType === 'time') {
          currentData.previousTimeLimit = parseInt(patternLimitSlider.value);
      }

      // Update pattern data from the editor input fields
      currentData.patternName = patternNameDisplay.textContent;
      currentData.shotOptions = shotOptions.value;
      currentData.announceShots = announceShots.checked;
      currentData.introMessage = introMessage.value;
      currentData.outroMessage = outroMessage.value;
      currentData.seriesOrder = seriesOrderCheckedRadio.value;
      currentData.shotInterval = parseFloat(shotInterval.value);
      currentData.randomOffset = parseFloat(randomOffset.value);
      currentData.nextShotAnnouncement = parseFloat(nextShotAnnouncement.value);
      currentData.splitStepHint = splitStepHintSelect.value;
      currentData.limitType = limitTypeSelect.value;
      currentData.patternLimit = parseInt(patternLimitSlider.value);
      currentData.postSequenceRest = parseInt(postSequenceRest.value);
      currentData.speechRate = parseFloat(speechRateSlider.value);
      currentData.speechVoice = speechVoiceSelect.value;

      calculateTotalWorkoutTime();
      updateGlobalLimitControls();
  };

  // --- UI UPDATE FUNCTIONS (for the separate editor screen) ---
  /**
   * Updates all display fields within the pattern editor.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateAllDisplays = (context) => {
      updateShotOptionsDisplay(context);
      updateNarrationDisplay(context);
      updateSequencingDisplay(context);
      updateIntervalDisplay(context);
      updateLimitsDisplay(context);
      updatePostRestDisplay(context);
  }

  /**
   * Updates the display for the number of shot options.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateShotOptionsDisplay = (context) => {
    const shotOptions = context.querySelector('#shotOptions');
    const display = context.querySelector('#optionsCountDisplay');
    if (shotOptions && display) {
        const count = (shotOptions.value || '').trim().split(/[\n,]+/).filter(Boolean).length;
        display.textContent = `${count} shots`;
    }
  };

  /**
   * Updates the display for narration settings.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateNarrationDisplay = (context) => {
    const display = context.querySelector('#narrationDisplay');
    const announceShotsCheckbox = context.querySelector('#announceShots');
    const introMessageTextarea = context.querySelector('#introMessage');
    const outroMessageTextarea = context.querySelector('#outroMessage');

    if (display && announceShotsCheckbox && introMessageTextarea && outroMessageTextarea) {
        const parts = [];
        if (announceShotsCheckbox.checked) parts.push('Shots');
        if (introMessageTextarea.value.trim()) parts.push('Intro');
        if (outroMessageTextarea.value.trim()) parts.push('Outro');
        display.textContent = parts.length ? parts.join(', ') : 'None';
    }
  };

  /**
   * Updates the display for sequencing order.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateSequencingDisplay = (context) => {
      const display = context.querySelector('#sequencingOrderDisplay');
      const seriesOrderRadio = context.querySelector('input[name="seriesOrder"]:checked');
      if (display && seriesOrderRadio) {
          const value = seriesOrderRadio.value;
          display.textContent = value === 'in-order' ? 'In order' : 'Randomized';
      }
  };

  /**
   * Updates the display for interval settings, including next shot announcement and split-step hint.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateIntervalDisplay = (context) => {
    const display = context.querySelector('#intervalCombinedDisplay');
    const shotIntervalInput = context.querySelector('#shotInterval');
    const randomOffsetInput = context.querySelector('#randomOffset');
    const nextShotAnnouncementInput = context.querySelector('#nextShotAnnouncement');
    const announceShotsCheckbox = context.querySelector('#announceShots');
    const splitStepHintSelect = context.querySelector('#splitStepHint');

    if (display && shotIntervalInput && randomOffsetInput && nextShotAnnouncementInput && announceShotsCheckbox && splitStepHintSelect) {
        const interval = parseFloat(shotIntervalInput.value).toFixed(1);
        const offset = parseFloat(randomOffsetInput.value).toFixed(1);
        const nextShotAnnounce = parseFloat(nextShotAnnouncementInput.value).toFixed(1);
        const splitStepHint = splitStepHintSelect.value;

        let text = offset > 0 ? `${interval} sec ± ${offset}` : `${interval} sec`;
        if (announceShotsCheckbox.checked) {
            text += ` (${nextShotAnnounce}s)`;
        }
        if (splitStepHint !== 'None') {
            text += `, Hint: ${splitStepHint}`;
        }
        display.textContent = text;
    }
  };

  /**
   * Handles changes to the "Announce Shots" checkbox, enabling/disabling the next shot announcement slider.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const handleAnnounceShotsChange = (context) => {
      const announceShotsCheckbox = context.querySelector('#announceShots');
      const nextShotAnnouncementSlider = context.querySelector('#nextShotAnnouncement');
      const shotIntervalSlider = context.querySelector('#shotInterval');

      if (!announceShotsCheckbox || !nextShotAnnouncementSlider || !shotIntervalSlider) return;

      nextShotAnnouncementSlider.disabled = !announceShotsCheckbox.checked;

      if (announceShotsCheckbox.checked) {
          const currentShotInterval = parseFloat(shotIntervalSlider.value);
          nextShotAnnouncementSlider.max = Math.max(0.0, currentShotInterval - 0.1);
          if (parseFloat(nextShotAnnouncementSlider.value) > nextShotAnnouncementSlider.max) {
              nextShotAnnouncementSlider.value = nextShotAnnouncementSlider.max;
          }
          // If current value is 0 and it's enabled, set a sensible default if possible
          if (parseFloat(nextShotAnnouncementSlider.value) === 0 && nextShotAnnouncementSlider.max >= 1.25) {
            nextShotAnnouncementSlider.value = 2.0;
          }
      } else {
          nextShotAnnouncementSlider.value = 0;
      }
      updateIntervalDisplay(context);
      updateNarrationDisplay(context);
  };


  /**
   * Handles changes to the pattern limit type (shots or time).
   * Adjusts the slider range and value based on the selected type.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const handleLimitTypeChange = (context) => {
    const select = context.querySelector('#limitTypeSelect');
    const slider = context.querySelector('#patternLimitSlider');

    const currentPattern = sequences[activeSequenceIndex];
    if (!currentPattern || !select || !slider) return;

    const newLimitType = select.value;
    const prevLimitTypeInState = currentPattern.limitType;

    // Save the current patternLimit to the appropriate 'previous' field before updating currentData
    if (prevLimitTypeInState === 'shot') {
        currentPattern.previousShotLimit = parseInt(slider.value);
    } else if (prevLimitTypeInState === 'time') {
        currentPattern.previousTimeLimit = parseInt(slider.value);
    }

    currentPattern.limitType = newLimitType;

    let proposedValue;
    if (newLimitType === 'shot') {
        slider.min = 0;
        slider.max = 100;
        proposedValue = (typeof currentPattern.previousShotLimit === 'number' && currentPattern.previousShotLimit > 0)
                            ? currentPattern.previousShotLimit
                            : ((currentPattern.shotOptions || '').trim().split(/[\n,]+/).filter(Boolean).length);
    } else if (newLimitType === 'time') {
        const shotOptionsCount = ((currentPattern.shotOptions || '').trim().split(/[\n,]+/).filter(Boolean).length);
        const estimatedTimeForOptions = shotOptionsCount * currentPattern.shotInterval;

        slider.min = Math.max(1, Math.round(currentPattern.shotInterval));
        slider.max = 1800; // 30 minutes in seconds

        proposedValue = (typeof currentPattern.previousTimeLimit === 'number' && currentPattern.previousTimeLimit > 0)
                            ? currentPattern.previousTimeLimit
                            : Math.round(estimatedTimeForOptions);
    }

    slider.value = Math.min(Math.max(proposedValue, parseInt(slider.min)), parseInt(slider.max));
    currentPattern.patternLimit = parseInt(slider.value);

    updateLimitsDisplay(context);
    calculateTotalWorkoutTime();
  };

  /**
   * Updates the display for pattern limits (shots or time).
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updateLimitsDisplay = (context) => {
    const display = context.querySelector('#limitsDisplay');
    const typeSelect = context.querySelector('#limitTypeSelect');
    const patternLimitSlider = context.querySelector('#patternLimitSlider');
    if (display && typeSelect && patternLimitSlider) {
        const type = typeSelect.value;
        const value = parseInt(patternLimitSlider.value);
        if (type === 'shot') {
          display.textContent = `${value} shots`;
        } else if (type === 'time') {
          display.textContent = formatTime(value);
        }
    }
  };

  /**
   * Updates the display for post-pattern rest time.
   * @param {HTMLElement} context - The DOM element representing the current pattern editor.
   */
  const updatePostRestDisplay = (context) => {
    const display = context.querySelector('#postSequenceRestDisplay');
    const postSequenceRestInput = context.querySelector('#postSequenceRest');
    if (display && postSequenceRestInput) {
        const value = parseInt(postSequenceRestInput.value);
        display.textContent = formatTime(value);
    }
  };

  // --- Speech Synthesis specific functions ---
  const currentLang = document.documentElement.lang || navigator.language || 'en-US';
  const langCode = currentLang.split('-')[0]; // Get the primary language code (e.g., 'en' from 'en-US')

  /**
   * Detects if the user is on an Apple operating system (macOS, iOS, iPadOS).
   * @returns {boolean} True if on an Apple OS, false otherwise.
   */
  function isAppleOS() {
      const userAgent = navigator.userAgent;
      const isMacOS = navigator.platform.includes('Mac') || userAgent.includes('Macintosh');
      const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
                    (navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1);
      return isMacOS || isIOS;
  }

  /**
   * Populates voice options in a given select dropdown element.
   * @param {HTMLSelectElement} selectElement - The select element to populate.
   * @param {string} selectedVoiceName - The name of the voice to pre-select.
   */
  function populateVoiceList(selectElement, selectedVoiceName) {
        if (!synth) {
            console.warn("Speech synthesis not initialized, cannot populate voice list.");
            return;
        }
        const voices = synth.getVoices();
        selectElement.innerHTML = ''; // Clear existing options

        // Add a default option
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Default System Voice';
        defaultOption.value = 'default';
        selectElement.appendChild(defaultOption);

        let filteredVoices = [];

        // Apply specific filtering for English on iOS
        if (isAppleOS() && langCode === 'en') {
            const iOSVoices = ['Karen', 'Daniel', 'Moira', 'Rishi', 'Samantha'];
            filteredVoices = voices.filter(voice => iOSVoices.includes(voice.name));
        } else {
            // Filter voices by the current document's language for other cases
            filteredVoices = voices.filter(voice => voice.lang.startsWith(langCode));
        }

        // Use a Map to store unique voices based on their name to prevent duplicates
        const uniqueVoicesMap = new Map();
        filteredVoices.forEach(voice => {
            if (!uniqueVoicesMap.has(voice.name)) {
                uniqueVoicesMap.set(voice.name, voice);
            }
        });

        const uniqueFilteredVoices = Array.from(uniqueVoicesMap.values());

        uniqueFilteredVoices.forEach(voice => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            option.value = voice.name;
            selectElement.appendChild(option);
        });

        // Set the selected voice
        if (selectedVoiceName && uniqueFilteredVoices.some(v => v.name === selectedVoiceName)) {
            selectElement.value = selectedVoiceName;
        } else {
            selectElement.value = 'default';
        }
  }


  // --- SEQUENCE MANAGEMENT FUNCTIONS ---
  /**
   * Adds a new default pattern to the sequences array and opens it in the editor.
   */
  const addSequence = () => {
    // If in editor, save current changes before adding new.
    if (!patternEditorContainer.classList.contains('hidden')) {
        saveCurrentSequenceState();
    }

    const newSequence = getNewSequenceData();
    newSequence.patternName = `Pattern ${sequences.length + 1}`;
    sequences.push(newSequence);

    activeSequenceIndex = sequences.length - 1; // Make the new pattern the active one
    selectedPatternId = newSequence.id; // Select the new pattern in the list
    showView('editor'); // Go to editor view
    calculateTotalWorkoutTime();
    focusOnTop();
  };

  /**
   * Creates a clone of the currently active pattern and adds it to the sequences array.
   */
  const cloneSequence = () => {
    if (activeSequenceIndex === -1) {
        showAlert('Clone Error', 'No pattern selected to clone.');
        return;
    }
    saveCurrentSequenceState();

    const clonedData = JSON.parse(JSON.stringify(sequences[activeSequenceIndex]));
    clonedData.id = Date.now() + Math.random();
    clonedData.patternName = `${clonedData.patternName} (Clone)`;

    sequences.splice(activeSequenceIndex + 1, 0, clonedData);
    activeSequenceIndex++; // Move active index to the newly cloned pattern
    selectedPatternId = clonedData.id; // Select the new clone in the list

    renderPatternEditor(); // Re-render editor with cloned data
    calculateTotalWorkoutTime();
    focusOnTop();
  };

  /**
   * Moves a pattern up or down in the sequences array.
   * @param {number} index - The current index of the pattern to move.
   * @param {string} direction - 'up' or 'down'.
   */
  const movePattern = (index, direction) => {
      const patternIdToSelect = sequences[index].id;

      if (direction === 'up' && index > 0) {
          [sequences[index], sequences[index - 1]] = [sequences[index - 1], sequences[index]];
          if (activeSequenceIndex === index) activeSequenceIndex--;
          else if (activeSequenceIndex === index - 1) activeSequenceIndex++;
      } else if (direction === 'down' && index < sequences.length - 1) {
          [sequences[index], sequences[index + 1]] = [sequences[index + 1], sequences[index]];
          if (activeSequenceIndex === index) activeSequenceIndex++;
          else if (activeSequenceIndex === index + 1) activeSequenceIndex--;
      }
      selectedPatternId = patternIdToSelect;
      renderAccordionView(); // Re-render the list to show new order
      calculateTotalWorkoutTime();
  };

  /**
   * Deletes a pattern from the sequences array. If only one pattern remains, it resets it to default.
   * @param {number} indexToDelete - The index of the pattern to delete.
   */
  const deleteSequence = (indexToDelete) => {
      // If only one pattern, clear and reset instead of deleting entirely
      if (sequences.length <= 1) {
          const currentPatternId = sequences.length > 0 ? sequences[0].id : null;
          sequences = [];
          sequences.push(getNewSequenceData());
          sequences[0].patternName = "Pattern 1";
          if (currentPatternId) sequences[0].id = currentPatternId; // Retain original ID if it existed
          activeSequenceIndex = 0; // The single pattern becomes active at index 0
          selectedPatternId = sequences[0].id;
          showAlert('Pattern Reset', 'Last pattern reset to default settings.');
          if (patternEditorContainer.classList.contains('hidden')) {
              showView('main'); // Ensure main view is rendered to show the single pattern
          } else {
              renderPatternEditor(); // Re-render editor with reset pattern
          }
          calculateTotalWorkoutTime();
          return;
      }

      sequences.splice(indexToDelete, 1);

      // Adjust activeSequenceIndex based on the deletion
      if (activeSequenceIndex === indexToDelete) {
          activeSequenceIndex = Math.max(0, indexToDelete - 1);
          if (sequences.length === 0) activeSequenceIndex = -1;
      } else if (activeSequenceIndex > indexToDelete) {
          activeSequenceIndex--;
      }

      selectedPatternId = activeSequenceIndex !== -1 ? sequences[activeSequenceIndex].id : null;

      if (sequences.length === 0 || activeSequenceIndex === -1) {
          showView('main');
      } else if (!patternEditorContainer.classList.contains('hidden') && sequences[activeSequenceIndex]) {
          renderPatternEditor(); // Re-render the new active sequence in editor if still in editor view
      } else {
        showView('main'); // Go back to main accordion view
      }
      calculateTotalWorkoutTime();
      focusOnTop();
  };


  /**
   * Resets the currently active pattern in the editor to its default values.
   */
  const resetCurrentSequence = () => {
      if (activeSequenceIndex === -1 || sequences.length === 0) {
        showAlert('Reset Error', 'No pattern selected to reset.');
        return;
      }
      const currentId = sequences[activeSequenceIndex].id;
      sequences[activeSequenceIndex] = { ...getNewSequenceData(), id: currentId };
      sequences[activeSequenceIndex].patternName = `Pattern ${activeSequenceIndex + 1}`;
      selectedPatternId = sequences[activeSequenceIndex].id;
      renderPatternEditor(); // Re-populate editor with reset data
      calculateTotalWorkoutTime();
  };

  /**
   * Allows editing the pattern name directly in the editor view.
   * @param {object} currentData - The data object for the current pattern.
   * @param {HTMLElement} displayElement - The HTML element displaying the pattern name.
   */
  const editPatternName = (currentData, displayElement) => {
      setInteractionMode(null); // Ensure modes are off

      const inputElement = document.createElement('input');
      inputElement.type = 'text';
      inputElement.value = currentData.patternName;
      inputElement.className = 'text-xl font-bold text-indigo-700 dark:text-indigo-300 w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-1';

      displayElement.parentNode.replaceChild(inputElement, displayElement);
      inputElement.focus();

      const saveAndRevert = () => {
          let newName = inputElement.value.trim();
          if (newName === '') {
              newName = 'Unnamed Pattern';
          }
          currentData.patternName = newName;
          renderPatternEditor(); // Re-render to show updated label
          calculateTotalWorkoutTime();
      };

      inputElement.addEventListener('blur', saveAndRevert);
      inputElement.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
              saveAndRevert();
              inputElement.blur();
          }
      });
  };

  // --- INDIVIDUAL PATTERN IMPORT / SAVE FUNCTIONS (for the separate editor) ---
  /**
   * Saves the current pattern's configuration to a JSON file.
   */
  const savePatternConfig = () => {
    const patternToSave = sequences[activeSequenceIndex];
    if (!patternToSave) {
      showAlert('Save Error', 'No pattern selected to save.');
      return;
    }
    saveCurrentSequenceState(); // Ensure data is synced from editor fields
    const dataStr = JSON.stringify(patternToSave, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitizeFilename(patternToSave.patternName)}.pattern.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('Pattern Saved', `Pattern "${patternToSave.patternName}" saved successfully.`);
    calculateTotalWorkoutTime();
  };

  /**
   * Imports a pattern configuration from a JSON file.
   */
  const importPatternConfig = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.pattern.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
          document.body.removeChild(fileInput);
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          // Provide default values for new properties if not present in old files.
          if (typeof importedData.speechRate === 'undefined') importedData.speechRate = 1.0;
          if (typeof importedData.speechVoice === 'undefined') importedData.speechVoice = 'default';
          if (typeof importedData.splitStepHint === 'undefined') importedData.splitStepHint = 'None';

          if (isValidPatternConfig(importedData)) {
            if (activeSequenceIndex !== -1) {
                sequences[activeSequenceIndex] = { ...importedData, id: sequences[activeSequenceIndex].id };
                renderPatternEditor(); // Re-populate editor with imported data
                showAlert('Pattern Imported', `Pattern "${importedData.patternName}" imported successfully.`);
            } else {
                showAlert('Import Error', 'No active pattern to import into.');
            }
            calculateTotalWorkoutTime();
          } else {
            showAlert('Import Error', 'Invalid pattern configuration file. Please select a valid .pattern.json file.');
          }
        } catch (error) {
          showAlert('Import Error', 'Failed to parse file. Please ensure it is a valid JSON file.');
        } finally {
          document.body.removeChild(fileInput);
        }
      };
      reader.onerror = () => {
        showAlert('Import Error', 'Failed to read file.');
        document.body.removeChild(fileInput);
      };
      reader.readAsText(file);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  };


  // --- GLOBAL WORKOUT (ALL PATTERNS) FUNCTIONS ---
  /**
   * Loads a complete workout configuration from a JSON file.
   */
  const loadWorkout = () => {
    setInteractionMode(null); // Turn off any list modes

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.workout.json';
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', (event) => {
      const file = event.target.files[0];
      if (!file) {
          document.body.removeChild(fileInput);
          return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!isValidWorkoutFile(importedData)) {
                showAlert('Load Error', 'Invalid workout file format. Please select a valid workout file.');
                return;
            }

            sequences = importedData.patterns.map(pattern => {
                // Provide default values for new speech properties if not present in old files
                if (typeof pattern.speechRate === 'undefined') pattern.speechRate = 1.0;
                if (typeof pattern.speechVoice === 'undefined') pattern.speechVoice = 'default';
                if (typeof pattern.splitStepHint === 'undefined') pattern.splitStepHint = 'None';
                return { ...pattern, id: Date.now() + Math.random() };
            });

            const settings = importedData.globalSettings;
            workoutOrderMode = settings.workoutOrderMode || 'in-order';
            workoutCountdownTime = settings.workoutCountdownTime || 0;
            globalLimitType = settings.globalLimitType || 'all';
            globalShotLimit = settings.globalShotLimit || 0;
            globalTimeLimit = settings.globalTimeLimit || 60;

            // Update UI from loaded global settings
            globalWorkoutOrderRadios.forEach(radio => radio.checked = (radio.value === workoutOrderMode));
            workoutCountdownSlider.value = workoutCountdownTime;
            workoutCountdownDisplay.textContent = `${workoutCountdownTime}s`;
            globalLimitTypeSelect.value = globalLimitType;
            globalShotLimitSlider.value = globalShotLimit;
            globalTimeLimitSlider.value = globalTimeLimit;

            activeSequenceIndex = -1; // Go back to main view
            selectedPatternId = null; // Clear selection
            showView('main'); // This will call renderAccordionView, updateGlobalLimitControls, and calculateTotalWorkoutTime
            showAlert('Workout Loaded', `Successfully loaded ${sequences.length} patterns.`);

        } catch (error) {
          showAlert('Load Error', 'Failed to parse workout file. Please ensure it is a valid JSON file.');
        } finally {
          document.body.removeChild(fileInput);
        }
      };
      reader.onerror = () => {
        showAlert('Load Error', 'Failed to read workout file.');
        document.body.removeChild(fileInput);
      };
      reader.readAsText(file);
    });

    document.body.appendChild(fileInput);
    fileInput.click();
  };

  /**
   * Saves the current overall workout configuration (all patterns and global settings) to a JSON file.
   */
  const saveWorkout = () => {
    setInteractionMode(null); // Turn off any list modes
    // If in editor, save current changes before saving all.
    if (!patternEditorContainer.classList.contains('hidden')) {
      saveCurrentSequenceState();
    }

    if (sequences.length === 0) {
        showAlert('Save Error', 'No patterns to save in the workout file.');
        return;
    }

    const workoutData = {
      patterns: sequences,
      globalSettings: {
        workoutOrderMode: workoutOrderMode,
        workoutCountdownTime: workoutCountdownTime,
        globalLimitType: globalLimitType,
        globalShotLimit: globalShotLimit,
        globalTimeLimit: globalTimeLimit
      }
    };

    const dataStr = JSON.stringify(workoutData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `my-workout-${new Date().toISOString().slice(0,10)}.workout.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('Workout Saved', 'Successfully saved workout.');
    calculateTotalWorkoutTime();
  };

  /**
   * Clears all patterns and resets the workout to a single default pattern.
   */
  const clearAllPatterns = () => {
      setInteractionMode(null); // Turn off any list modes

      const modal = document.getElementById('confirmation-modal');
      const modalTitle = document.getElementById('modal-title');
      const modalText = document.getElementById('modal-text');
      const confirmBtn = document.getElementById('confirm-btn');
      const cancelBtn = document.getElementById('cancel-btn');

      modalTitle.textContent = 'Confirm Reset';
      modalText.textContent = 'Are you sure you want to clear all workout patterns? This action cannot be undone.';
      confirmBtn.textContent = 'Reset';
      confirmBtn.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700';
      modal.classList.remove('hidden');

      confirmBtn.replaceWith(confirmBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
      const newConfirmBtn = document.getElementById('confirm-btn');
      const newCancelBtn = document.getElementById('cancel-btn');

      newConfirmBtn.addEventListener('click', () => {
          sequences = [];
          sequences.push(getNewSequenceData());
          sequences[0].patternName = "Pattern 1";
          activeSequenceIndex = -1; // Reset to main view
          selectedPatternId = null; // Clear selection
          showView('main');
          modal.classList.add('hidden');
          calculateTotalWorkoutTime();
      }, { once: true });

      newCancelBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
      }, { once: true });
  };

  /**
   * Shows a confirmation modal before deleting a pattern.
   * @param {number} indexToDelete - The index of the pattern to be deleted.
   */
  const showConfirmationModalForDelete = (indexToDelete) => {
      const modal = document.getElementById('confirmation-modal');
      const modalTitle = document.getElementById('modal-title');
      const modalText = document.getElementById('modal-text');
      const confirmBtn = document.getElementById('confirm-btn');
      const cancelBtn = document.getElementById('cancel-btn');

      modalTitle.textContent = 'Confirm Deletion';
      modalText.textContent = `Are you sure you want to delete pattern "${sequences[indexToDelete].patternName}"? This action cannot be undone.`;
      confirmBtn.textContent = 'Delete';
      confirmBtn.className = 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700';
      modal.classList.remove('hidden');

      confirmBtn.replaceWith(confirmBtn.cloneNode(true));
      cancelBtn.replaceWith(cancelBtn.cloneNode(true));
      const newConfirmBtn = document.getElementById('confirm-btn');
      const newCancelBtn = document.getElementById('cancel-btn');

      newConfirmBtn.addEventListener('click', () => {
          deleteSequence(indexToDelete);
          modal.classList.add('hidden');
          focusOnTop();
      }, { once: true });

      newCancelBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
      }, { once: true });
  };


// --- Workout Logic Variables ---
let countdownTimer = null;
let currentPatternIndex = 0;
let mainPhaseTimer = null; // Timer for the main shot phase or rest phase
let flashTimer = null;
let nextAnnouncementTimeout = null;
let splitStepPowerUpTimeout = null;
let currentPatternShotCount = 0;
let totalWorkoutShots = 0;
let currentPatternTimeElapsed = 0;
let globalWorkoutTimeElapsed = 0;
let currentShotOptions = [];
let currentShotIndex = 0; // Index for shot options within the *current pattern*
let timePassedInMainPhase = 0; // Tracks time within the current interval phase (for shots)
let effectiveIntervalDuration = 0; // Stores the calculated effective interval (base + random offset)

let isPaused = false;
let pausedCountdownTimeRemaining = 0;
let pausedTimePassedInMainPhase = 0; // Saved state for shot phase
let pausedEffectiveIntervalDuration = 0; // Saved state for shot phase
let pausedRestTimeRemaining = 0; // Saved state for rest phase
let currentWorkoutPhase = 'idle'; // 'idle', 'countdown', 'shot', 'rest', 'paused'
let pausedShotDisplayContent = ''; // Stores content displayed when paused

let isFirstShotOfWorkout = false; // Flag to manage the initial shot sequence special timing
let isToggleDebouncing = false; // Prevents rapid toggling of pause/resume
const DEBOUNCE_TIME = 300;

// Stores the patterns for the current workout run (can be shuffled).
let currentWorkoutPatterns = [];

// Global variable for rest period logic
let currentRestOriginalDuration = 0; // To store the total duration of the current rest period for accurate progress bar/resume.


/**
 * Initializes the Web Audio API AudioContext.
 * Attempts to resume if suspended, often necessary due to browser autoplay policies.
 */
function initAudioContext() {
    if (audioContext) return; // Already initialized
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // If the context is suspended, it requires a user gesture to resume.
        // Attach a one-time event listener to resume it on the first user interaction.
        if (audioContext.state === 'suspended') {
            const resumeAudio = () => {
                audioContext.resume().then(() => {
                    console.log('AudioContext resumed successfully by user gesture.');
                    // Clean up the event listeners once resumed.
                    document.removeEventListener('click', resumeAudio);
                    document.removeEventListener('touchend', resumeAudio);
                }).catch(error => console.error("Error resuming AudioContext:", error));
            };
            document.addEventListener('click', resumeAudio, { once: true, passive: true });
            document.addEventListener('touchend', resumeAudio, { once: true, passive: true });
        }
    } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
    }
}

/**
 * Initializes the Speech Synthesis API.
 * Sends a silent utterance to "wake up" the API and populates voice lists.
 */
function initSpeechSynthesis() {
    if ('speechSynthesis' in window) {
        synth = window.speechSynthesis;
        const silentUtterance = new SpeechSynthesisUtterance('');
        silentUtterance.volume = 0;
        silentUtterance.onend = null;
        silentUtterance.onerror = null;
        try {
            // Initial "wake-up" utterance
            synth.speak(silentUtterance);
            console.log('SpeechSynthesis initialized and wake-up utterance sent.');
        } catch (e) {
            console.warn('Initial silent utterance failed (may not be an issue if audio is already active):', e);
        }

        // Ensure voice list is populated when synth is ready
        if (synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = () => {
                // Re-populate voice lists in all active pattern editor instances if open
                if (!patternEditorContainer.classList.contains('hidden')) {
                    const currentEl = sequencesContainer.firstChild;
                    if (currentEl) {
                        const speechVoiceSelect = currentEl.querySelector('#speechVoiceSelect');
                        if (speechVoiceSelect) {
                            const currentData = sequences[activeSequenceIndex];
                            populateVoiceList(speechVoiceSelect, currentData.speechVoice);
                        }
                    }
                }
            };
        }
        // Fallback for browsers that might not fire onvoiceschanged immediately
        setTimeout(() => {
            if (!patternEditorContainer.classList.contains('hidden')) {
                const currentEl = sequencesContainer.firstChild;
                if (currentEl) {
                    const speechVoiceSelect = currentEl.querySelector('#speechVoiceSelect');
                    // Only populate if not already populated.
                    if (speechVoiceSelect && synth.getVoices().length > 0 && speechVoiceSelect.options.length <= 1) {
                        const currentData = sequences[activeSequenceIndex];
                        populateVoiceList(speechVoiceSelect, currentData.speechVoice);
                    }
                }
            }
        }, 500);
    } else {
        console.warn('Speech Synthesis API not supported in this browser.');
    }
}

/**
 * Plays a silent utterance to keep the SpeechSynthesis API active in some browsers.
 */
function speakSilent() {
    if (!synth || !isRoutineRunning || isPaused) {
        console.log('speakSilent: Conditions not met. isRoutineRunning:', isRoutineRunning, 'isPaused:', isPaused);
        return;
    }

    if (synth.speaking || synth.pending) {
        console.log('speakSilent: Synth busy, skipping silent utterance for now.');
        nextSilentUtteranceTimeout = setTimeout(() => {
            speakSilent();
        }, 100);
        return;
    }

    const utterance = new SpeechSynthesisUtterance('');
    utterance.lang = 'en-US'; // Default lang for silent utterance
    utterance.volume = 0;

    utterance.onend = () => {
        console.log('speakSilent: Silent utterance ended. Scheduling next...');
        if (isRoutineRunning && !isPaused) {
            nextSilentUtteranceTimeout = setTimeout(() => {
                speakSilent();
            }, 50);
        }
    };

    utterance.onerror = (event) => {
        if (event.error !== 'interrupted') {
            console.error(`speakSilent: Silent speech synthesis error: ${event.error}. Full event:`, event);
            if (isRoutineRunning && !isPaused) {
                nextSilentUtteranceTimeout = setTimeout(() => {
                    speakSilent();
                }, 50);
            }
        } else {
            console.info('speakSilent: Silent SpeechSynthesisUtterance was interrupted, which is expected behavior.');
            if (isRoutineRunning && !isPaused) {
                nextSilentUtteranceTimeout = setTimeout(() => {
                    speakSilent();
                }, 50);
            }
        }
    };

    try {
        synth.speak(utterance);
        console.log('speakSilent: Silent utterance started.');
    } catch (e) {
        console.error("speakSilent: Error speaking silent utterance directly:", e);
        if (isRoutineRunning && !isPaused) {
            nextSilentUtteranceTimeout = setTimeout(() => {
                speakSilent();
            }, 50);
        }
    }
}

/**
 * Starts the continuous silent utterance chain to keep speech synthesis active.
 */
function startSpeechKeepAlive() {
    if (!synth) {
        console.warn('startSpeechKeepAlive: SpeechSynthesis not available for keep-alive.');
        return;
    }
    stopSpeechKeepAlive(); // Clear any existing chain before starting a new one.
    console.log('startSpeechKeepAlive: Initiating speech keep-alive chain...');
    speakSilent();
}

/**
 * Stops the continuous silent utterance chain and cancels any pending speech.
 */
function stopSpeechKeepAlive() {
    if (nextSilentUtteranceTimeout) {
        clearTimeout(nextSilentUtteranceTimeout);
        nextSilentUtteranceTimeout = null;
        console.log('stopSpeechKeepAlive: Cleared nextSilentUtteranceTimeout.');
    }
    if (synth && (synth.speaking || synth.pending)) {
        synth.cancel();
        console.log('stopSpeechKeepAlive: Cancelled existing speech.');
    }
    console.log('stopSpeechKeepAlive: Speech keep-alive stopped and cancelled.');
}

/**
 * Plays a two-tone beep sound.
 */
function playTwoToneBeep() {
    try {
        if (!audioContext || audioContext.state !== 'running') {
            console.warn("playTwoToneBeep: AudioContext not ready for two-tone beep. State:", audioContext ? audioContext.state : 'null');
            // Attempt to resume it one last time.
            if(audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
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
            console.warn("playSplitStepPowerUp: AudioContext not ready. State:", audioContext ? audioContext.state : 'null');
            if(audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
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
        // Determine speed
        switch (speed) {
            case 'Slow':
                durationPerStep = 0.08;
                break;
            case 'Medium':
                durationPerStep = 0.06;
                break;
            case 'Fast':
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
 * Speaks the given text.
 * Cancels any existing speech before speaking a new message.
 * @param {string} text - The text to speak.
 * @param {boolean} [defaultVoice=true] - Use default or pattern-specific voice and rate.
 * @param {boolean} [isResume=false] - True if this call is part of a resume operation.
 * @param {number} [rate=null] - Optional specific speech rate to use. If null, globalSpeechRate is used.
 * @returns {Promise<void>} A promise that resolves when speech ends or rejects on error.
 */
function speak(text, defaultVoice = true, isResume = false, rate = null) {
    return new Promise((resolve, reject) => {
        if (!synth) {
            console.warn('speak: Speech Synthesis API not supported or not initialized.');
            reject('Speech Synthesis API not available');
            return;
        }

        if (synth.speaking || synth.pending) {
            synth.cancel();
            // Clear related timeouts as new speech will take precedence
            if (nextSilentUtteranceTimeout) {
                clearTimeout(nextSilentUtteranceTimeout);
                nextSilentUtteranceTimeout = null;
            }
            if (nextAnnouncementTimeout) {
                clearTimeout(nextAnnouncementTimeout);
                nextAnnouncementTimeout = null;
            }
            console.log("speak: Cancelled existing speech for new audible message.");
        }

        if (text.trim() === '') {
            resolve(); // Resolve immediately if no text to speak
            return;
        }

        // If resuming and the text to speak is the same as what was displayed before pause,
        // assume it was already announced and skip re-announcement.
        if (isResume && pausedShotDisplayContent && pausedShotDisplayContent.trim() === text.trim()) {
            console.log(`speak: Resuming, skipping re-announcement of "${text}" as it was already displayed.`);
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);

        if (defaultVoice || !globalSpeechVoice) {
            // System default voice and rate
            utterance.lang = 'en-US';
            utterance.voice = null;
            utterance.rate = 1.0;
            utterance.volume = 1;
        } else {
            // Apply voice and rate from the current pattern being executed
            utterance.voice = globalSpeechVoice;
            utterance.lang = globalSpeechVoice.lang;
            utterance.rate = (rate !== null) ? rate : globalSpeechRate;
	    utterance.volume = 1;
        }

        utterance.onend = () => {
            console.log(`speak: Finished speaking: "${text}". Re-initiating silent keep-alive.`);
            if (isRoutineRunning && !isPaused) {
                startSpeechKeepAlive();
            }
            resolve();
        };
        utterance.onerror = (event) => {
            if (event.error !== 'interrupted') {
                console.error(`speak: Audible speech synthesis error: ${event.error}. Full event:`, event);
                // Only re-initiate keep-alive if the routine is still running and not paused.
                if (isRoutineRunning && !isPaused) {
                    startSpeechKeepAlive();
                }
                reject(new Error(event.error || 'Speech synthesis error'));
            } else {
                console.info('speak: Audible SpeechSynthesisUtterance was interrupted, which is expected behavior.');
                // For 'interrupted', still re-schedule keep-alive if routine is running.
                if (isRoutineRunning && !isPaused) {
                    startSpeechKeepAlive();
                }
                resolve();
            }
        };
        try {
            synth.speak(utterance);
            console.log(`speak: Speaking: "${text}"`);
        } catch (e) {
            console.error("speak: Error speaking audible utterance directly:", e);
            if (isRoutineRunning && !isPaused) {
                startSpeechKeepAlive();
            }
            reject(e);
        }
    });
}

/**
 * Initiates the workout routine.
 */
async function startWorkout() {
    if (sequences.length === 0) {
        showAlert('Workout Error', 'Please create at least one workout pattern first!');
        return;
    }
    // Save any unsaved changes in the editor before starting.
    if (!patternEditorContainer.classList.contains('hidden')) {
        saveCurrentSequenceState();
    }
    initAudioContext(); // Ensure it's initialized
    initSpeechSynthesis();
    isRoutineRunning = true;
    startSpeechKeepAlive();
    isFirstShotOfWorkout = true; // Flag for special timing of the very first shot.

    // Explicitly try to resume the AudioContext, crucial for iOS reliability.
    if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    // Determine workout pattern order (in-order or randomized).
    if (workoutOrderMode === 'randomized') {
        currentWorkoutPatterns = shuffleArray(sequences);
    } else {
        currentWorkoutPatterns = [...sequences];
    }
    showView('workout');
    currentPatternIndex = 0;
    globalWorkoutTimeElapsed = 0;
    totalWorkoutShots = 0;
    workoutElapsedTime = 0; // Reset elapsed workout time
    workoutElapsedTimeDisplay.textContent = formatTime(workoutElapsedTime); // Update display

    isPaused = false;
    timePassedInMainPhase = 0; // Reset for a fresh start
    currentRestOriginalDuration = 0; // Reset rest duration tracker
    pausedShotDisplayContent = ''; // Reset for a fresh start

    // Configure workout control buttons.
    stopWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${STOP_ICON}</span>`;
    stopWorkoutBtn.onclick = stopWorkout;
    stopWorkoutBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'bg-gray-600', 'hover:bg-gray-700');
    stopWorkoutBtn.classList.add('bg-red-600', 'hover:bg-red-700');

    pauseResumeWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${PAUSE_ICON}</span>`;
    pauseResumeWorkoutBtn.onclick = togglePauseResume;
    pauseResumeWorkoutBtn.classList.remove('hidden');

    // Start the overall workout timer
    workoutTimerInterval = setInterval(() => {
        workoutElapsedTime++;
        workoutElapsedTimeDisplay.textContent = formatTime(workoutElapsedTime);
    }, 1000);


    // Start countdown or directly run patterns.
    if (workoutCountdownTime > 0) {
        currentWorkoutPhase = 'countdown'; // Set phase
        startCountdown(workoutCountdownTime);
    } else {
        currentWorkoutPhase = 'shot'; // Set phase
        // When starting the workout, `currentPatternIndex` is 0.
        // `runCurrentPattern` handles setting `currentShotOptions` and `currentShotIndex`.
        runCurrentPattern();
    }
}

/**
 * Manages the initial workout countdown.
 * @param {number} timeRemaining - The initial countdown time in seconds.
 */
function startCountdown(timeRemaining) {
    let countdown = timeRemaining;
    currentWorkoutPhase = 'countdown'; // Ensure phase is set

    const updateCountdownDisplay = () => {
        currentShotDisplay.textContent = countdown;
        progressBar.style.width = `${((timeRemaining - countdown) / timeRemaining) * 100}%`;

        // Announce specific countdown numbers.
        if (countdown === 10) {
            speak(countdown.toString()).catch(e => console.error('Countdown speech error:', e));
        } else if (countdown > 10) {
            if (countdown % 10 === 0) {
                speak(countdown.toString()).catch(e => console.error('Countdown speech error:', e));
            }
        } else { // countdown < 10
            speak(countdown.toString()).catch(e => console.error('Countdown speech error:', e));
        }
    };

    // Initial display and announcement.
    updateCountdownDisplay();

    countdownTimer = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            updateCountdownDisplay(); // Update and announce next number
        } else {
            clearInterval(countdownTimer);
            countdownTimer = null;
            currentShotDisplay.textContent = 'Go!';
            progressBar.style.width = '100%';
            speak('Go!').catch(e => console.error('Go! speech error:', e));
            setTimeout(() => {
                currentWorkoutPhase = 'shot'; // Set phase before running patterns
                runCurrentPattern();
            }, 1000); // Start patterns after "Go!"
        }
    }, 1000);
}

/**
 * Stops the current workout, clearing all timers and returning to the main view.
 */
function stopWorkout() {
    console.log('stopWorkout: Stopping workout...');
    // Clear all relevant timers and timeouts.
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (mainPhaseTimer) { clearInterval(mainPhaseTimer); mainPhaseTimer = null; }
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
    if (nextAnnouncementTimeout) { clearTimeout(nextAnnouncementTimeout); nextAnnouncementTimeout = null; }
    if (splitStepPowerUpTimeout) { clearTimeout(splitStepPowerUpTimeout); splitStepPowerUpTimeout = null; }
    // Clear workout elapsed time interval
    if (workoutTimerInterval) { clearInterval(workoutTimerInterval); workoutTimerInterval = null; }
    workoutElapsedTime = 0; // Reset elapsed time
    workoutElapsedTimeDisplay.textContent = formatTime(workoutElapsedTime); // Update display to 00:00

    // Reset rest flags
    currentRestOriginalDuration = 0;
    pausedShotDisplayContent = ''; // Clear paused content

    // Revert body background and stop speech synthesis.
    document.body.style.backgroundColor = ''; // Clear inline style
    isRoutineRunning = false;
    stopSpeechKeepAlive();
    if(synth) synth.cancel();

    currentWorkoutPhase = 'idle'; // Reset phase
    showView('main'); // Return to main view.
    calculateTotalWorkoutTime(); // Recalculate estimated time for start button.
    console.log('stopWorkout: Workout stopped.');
}

/**
 * Toggles the workout between paused and resumed states.
 */
function togglePauseResume() {
    // Debounce to prevent rapid clicks.
    if (isToggleDebouncing) return;
    isToggleDebouncing = true;
    setTimeout(() => { isToggleDebouncing = false; }, DEBOUNCE_TIME);

    if (isPaused) {
        resumeWorkout();
    } else {
        pauseWorkout();
    }
}

/**
 * Pauses the ongoing workout, stopping timers and saving state.
 */
function pauseWorkout() {
    console.log('pauseWorkout: Pausing workout...');
    isPaused = true;

    // Clear all timers and timeouts regardless of phase, for a clean pause.
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (mainPhaseTimer) { clearInterval(mainPhaseTimer); mainPhaseTimer = null; }
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
    if (nextAnnouncementTimeout) { clearTimeout(nextAnnouncementTimeout); nextAnnouncementTimeout = null; }
    if (splitStepPowerUpTimeout) { clearTimeout(splitStepPowerUpTimeout); splitStepPowerUpTimeout = null; }
    if (workoutTimerInterval) { clearInterval(workoutTimerInterval); workoutTimerInterval = null; }

    stopSpeechKeepAlive(); // Stop silent speech loop.
    document.body.style.backgroundColor = ''; // Clear inline style
    if(synth) synth.cancel(); // Cancel any active speech.

    // Store remaining time based on current phase *before* setting phase to 'paused'.
    if (currentWorkoutPhase === 'countdown') {
        pausedCountdownTimeRemaining = parseInt(currentShotDisplay.textContent) || 0; // Capture displayed number
    } else if (currentWorkoutPhase === 'shot') {
        pausedTimePassedInMainPhase = timePassedInMainPhase;
        pausedEffectiveIntervalDuration = effectiveIntervalDuration;
    } else if (currentWorkoutPhase === 'rest') {
        // pausedRestTimeRemaining is already being updated by resumeRestInterval, so it's correct.
        // No need to re-assign it here.
    }

    pauseResumeWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${PLAY_ICON}</span>`; // Change to Play icon.
    // Store current display content and set to 'Paused'.
    pausedShotDisplayContent = currentShotDisplay.textContent;
    currentShotDisplay.textContent = 'Paused';

    currentWorkoutPhase = 'paused'; // Set global phase to 'paused'
    console.log('pauseWorkout: Workout paused. Phase:', currentWorkoutPhase);
}

/**
 * Resumes the workout from a paused state.
 */
function resumeWorkout() {
    console.log('resumeWorkout: Resuming workout...');
    isPaused = false;
    pauseResumeWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${PAUSE_ICON}</span>`;
    startSpeechKeepAlive(); // Re-initiate silent speech loop.

    // Resume the overall workout timer
    workoutTimerInterval = setInterval(() => {
        workoutElapsedTime++;
        workoutElapsedTimeDisplay.textContent = formatTime(workoutElapsedTime);
    }, 1000);

    if (currentWorkoutPhase === 'paused') { // Ensure we are actually resuming from a paused state
        if (pausedCountdownTimeRemaining > 0) {
            currentWorkoutPhase = 'countdown';
            startCountdown(pausedCountdownTimeRemaining);
            pausedCountdownTimeRemaining = 0; // Reset
        } else if (pausedRestTimeRemaining > 0) { // If it was paused during post-pattern rest
            currentWorkoutPhase = 'rest'; // Set phase to rest
            resumeRestInterval(pausedRestTimeRemaining);
            pausedRestTimeRemaining = 0; // Reset
        } else { // If it was paused during a main shot phase
            currentWorkoutPhase = 'shot'; // Set phase to shot
            const pattern = currentWorkoutPatterns[currentPatternIndex]; // The pattern that was active.
            if (pattern) {
                // The `shotToAnnounce` should be for the *next* shot (which was `currentShotOptions[currentShotIndex]` before the pause).
                const nextShotText = currentShotOptions[currentShotIndex];

                // Use the captured time passed and effective interval to resume the phase accurately.
                // Pass `true` for `isResume` to the `speak` function.
                startMainShotPhase(pattern, isFirstShotOfWorkout, nextShotText, pausedTimePassedInMainPhase, pausedEffectiveIntervalDuration, true);

                // Reset relevant paused states.
                pausedTimePassedInMainPhase = 0;
                pausedEffectiveIntervalDuration = 0;
            } else {
                console.error("No active pattern found to resume workout interval from pause.");
                stopWorkout(); // Fallback to stop if context is lost.
            }
        }
    } else {
        console.warn("resumeWorkout called but not in 'paused' state. This might indicate an issue.");
        // If resume is called unexpectedly, go to main view as a fallback.
        stopWorkout();
    }
    pausedShotDisplayContent = ''; // Clear after use
}

/**
 * Runs the current pattern in the workout sequence.
 * Handles pattern progression, shuffling, and global limits.
 */
async function runCurrentPattern() {
    if (isPaused) {
        console.log('runCurrentPattern: PAUSED, returning immediately.');
        return;
    }

    // Reset rest flag when moving to a new pattern
    currentRestOriginalDuration = 0;

    // Check if all patterns have been processed.
    if (currentPatternIndex >= currentWorkoutPatterns.length) {
        // Check if a global limit is set and not yet reached, requiring a loop.
        const needsToLoop = (globalLimitType === 'shot' && totalWorkoutShots < globalShotLimit) ||
                            (globalLimitType === 'time' && globalWorkoutTimeElapsed < globalTimeLimit);

        if (needsToLoop) {
            console.log("Global limit not reached. Looping patterns.");
            currentPatternIndex = 0; // Reset index to loop from the beginning.
            if (workoutOrderMode === 'randomized') {
                currentWorkoutPatterns = shuffleArray(sequences); // Re-shuffle for the next loop.
                console.log("Re-shuffled patterns for next loop.");
            }
            // Continue to run with index 0.
        } else {
            // No more loops needed, workout is complete.
            console.log('runCurrentPattern: All patterns completed and global limit met (or not set). Ending workout.');
            await handleWorkoutCompletion();
            return; // Exit function.
        }
    }

    const pattern = currentWorkoutPatterns[currentPatternIndex];

    // Set global speech properties from the current pattern for workout routines.
    globalSpeechRate = pattern.speechRate || 1.0;
    const selectedVoiceName = pattern.speechVoice;
    const voices = synth.getVoices();
    globalSpeechVoice = (selectedVoiceName && selectedVoiceName !== 'default') ?
                        voices.find(voice => voice.name === selectedVoiceName) : null;


    // Check if the current pattern is valid and has shots.
    if (pattern && typeof pattern.shotOptions === 'string') {
        currentShotOptions = pattern.shotOptions.split('\n').filter(option => option.trim() !== '');
        if (currentShotOptions.length > 0) {
            if (pattern.seriesOrder === 'randomized') {
                currentShotOptions = shuffleArray(currentShotOptions);
            }
            currentPatternShotCount = 0; // Reset for each new pattern.
            currentPatternTimeElapsed = 0; // Reset for each new pattern.
            currentShotIndex = 0; // Reset shot index for the new pattern.

            console.log(`runCurrentPattern: Starting pattern ${currentPatternIndex}: "${pattern.patternName}"`);
            if (pattern.announceShots && pattern.introMessage.trim()) {
                currentShotDisplay.textContent = 'Intro'; // Display message during intro.
                progressBar.style.width = '0%'; // Reset progress bar for next pattern.
                await speak(pattern.introMessage, false).catch(e => console.error('Intro message speech error:', e)); // Wait for intro message to finish.
                if (isPaused) return;
            }

            currentWorkoutPhase = 'shot'; // Set phase to shot before starting.
            // Start the main shot phase. `isFirstShotOfWorkout` determines the timing variant.
            // The `shotToAnnounce` for the very first shot of the workout is `currentShotOptions[0]`.
            startMainShotPhase(pattern, isFirstShotOfWorkout, currentShotOptions[currentShotIndex]);
            isFirstShotOfWorkout = false; // After the very first shot sequence starts, subsequent will be regular.
            return; // Exit, the pattern is now running.
        }
    }

    // If pattern is invalid or has no shots, skip to the next one.
    console.log(`runCurrentPattern: Skipping pattern ${currentPatternIndex} as it is invalid or has no shots.`);
    currentPatternIndex++;

    if (isRoutineRunning)
        runCurrentPattern(); // Recursively call to process the next index.
}


/**
 * Manages a single shot interval.
 * Handles progress bar, beep/flash, and next shot announcement timing.
 * @param {object} pattern - The current pattern data.
 * @param {boolean} isInitialWorkoutShot - True if this is the very first shot of the entire workout.
 * @param {string} shotToAnnounce - The shot text to announce *during* this interval (for the *next* shot's preparation).
 * @param {number} [initialTimePassed=0] - Time already passed in this interval (for resuming from pause).
 * @param {number} [predefinedEffectiveInterval=0] - A predefined effective interval (for resuming from pause).
 * @param {boolean} [isResume=false] - True if this call is part of a resume operation.
 */
function startMainShotPhase(pattern, isInitialWorkoutShot, shotToAnnounce, initialTimePassed = 0, predefinedEffectiveInterval = 0, isResume = false) {
    if (isPaused) return;

    currentWorkoutPhase = 'shot'; // Ensure phase is set to shot.

    // Clear any previous timers/timeouts for this phase.
    if (mainPhaseTimer) clearInterval(mainPhaseTimer);
    if (flashTimer) clearTimeout(flashTimer);
    if (nextAnnouncementTimeout) clearTimeout(nextAnnouncementTimeout);
    if (splitStepPowerUpTimeout) clearTimeout(splitStepPowerUpTimeout);


    // Calculate effective interval, including random offset.
    const baseInterval = parseFloat(pattern.shotInterval);
    const randomOffset = parseFloat(pattern.randomOffset);
    effectiveIntervalDuration = (predefinedEffectiveInterval > 0) ? predefinedEffectiveInterval : (baseInterval + (Math.random() * randomOffset));

    timePassedInMainPhase = initialTimePassed; // Reset or continue from paused state.

    // Clear display and reset progress bar at t=0s of this phase.
    if (timePassedInMainPhase === 0) { // Only reset display if truly starting fresh
        currentShotDisplay.textContent = '\u00A0'; // Non-breaking space to retain vertical spacing.
        progressBar.style.width = '0%';
    }


    // --- Schedule Events within this `effectiveIntervalDuration` cycle ---

    // 1. Beep and Flash (at effectiveIntervalDuration / 2)
    const flashBeepTime = effectiveIntervalDuration / 2;
    if (flashBeepTime >= timePassedInMainPhase) {
        flashTimer = setTimeout(() => {
            if (!isPaused) {
                playTwoToneBeep();
                flashScreenRed();
            }
        }, (flashBeepTime - timePassedInMainPhase) * 1000);
    }

    // 2. Split-step Hint Power-Up Beep
    if (pattern.splitStepHint !== 'None') {
        let selectedSpeed = pattern.splitStepHint;
        if (selectedSpeed === 'Random') {
            const speeds = ['Slow', 'Medium', 'Fast'];
            selectedSpeed = speeds[Math.floor(Math.random() * speeds.length)];
        }

        const powerUpDurations = {
            'Slow': 0.50625,
            'Medium': 0.5,
            'Fast': 0.49375
        };
        const powerUpDuration = powerUpDurations[selectedSpeed];
        // Power-up beep should play `powerUpDuration` seconds before the two-tone beep.
        const powerUpTime = flashBeepTime - powerUpDuration;

        if (powerUpTime >= timePassedInMainPhase) {
            splitStepPowerUpTimeout = setTimeout(() => {
                if (!isPaused) {
                    playSplitStepPowerUp(selectedSpeed);
                }
            }, (powerUpTime - timePassedInMainPhase) * 1000);
        } else {
            // If power-up time has already passed but two-tone hasn't, play it immediately.
            // This can happen if resuming from a pause point.
            if (flashBeepTime >= timePassedInMainPhase && !isPaused) {
                 playSplitStepPowerUp(selectedSpeed);
            }
        }
    }


    // 3. Next Shot Announcement (timing depends on isInitialWorkoutShot).
    if (pattern.announceShots && shotToAnnounce.trim() !== '') {
        let announcementTime;
        if (isInitialWorkoutShot) {
            // For the very first shot (N=1), announcement happens in the first half of the interval before the beep/flash.
            announcementTime = (baseInterval / 2) - parseFloat(pattern.nextShotAnnouncement);
        } else {
            // For subsequent shots (N > 1), announcement for the *next* shot occurs `nextShotAnnouncement` seconds
            // *before* the beep/flash of the *current* shot's interval.
            announcementTime = (effectiveIntervalDuration / 2) - parseFloat(pattern.nextShotAnnouncement);
        }

        // Only schedule if event time hasn't passed and if it's not a resume where the text was already announced.
        const shouldAnnounceNow = (announcementTime < timePassedInMainPhase) && !(isResume && pausedShotDisplayContent === shotToAnnounce);
        const shouldSchedule = (announcementTime >= timePassedInMainPhase);


        if (shouldSchedule) {
            nextAnnouncementTimeout = setTimeout(() => {
                if (!isPaused) {
                    currentShotDisplay.textContent = shotToAnnounce;
                    speak(shotToAnnounce, false).catch(e => console.error('Shot announcement speech error:', e));
                }
            }, (announcementTime - timePassedInMainPhase) * 1000);
        } else if (shouldAnnounceNow) { // Only announce immediately if conditions met (e.g., resuming past announcement time)
            if (!isPaused) {
                currentShotDisplay.textContent = shotToAnnounce;
                speak(shotToAnnounce, false, isResume).catch(e => console.error('Shot announcement speech error:', e));
            }
        }
    }


    // Main interval timer for progress bar updates and checking for end of interval.
    const intervalStep = 100; // 0.1 seconds.
    mainPhaseTimer = setInterval(() => {
        if (isPaused) {
            clearInterval(mainPhaseTimer);
            return;
        }
        timePassedInMainPhase += (intervalStep / 1000);
        currentPatternTimeElapsed += (intervalStep / 1000);
        globalWorkoutTimeElapsed += (intervalStep / 1000);

        // Update progress bar.
        const progress = (timePassedInMainPhase / effectiveIntervalDuration) * 100;
        progressBar.style.width = `${progress}%`;

        // Check global time limit.
        if (globalLimitType === 'time' && globalWorkoutTimeElapsed >= globalTimeLimit) {
            clearInterval(mainPhaseTimer);
            handleWorkoutCompletion();
            return;
        }

        // Check if this interval has completed.
        if (timePassedInMainPhase >= effectiveIntervalDuration) {
            clearInterval(mainPhaseTimer); // Stop this interval timer.
            currentPatternShotCount++;
            totalWorkoutShots++;

            // Check if pattern/workout should end after this completed interval.
            if (shouldEndPattern(pattern)) {
                endPattern(pattern);
                return;
            }

            // Prepare for the next shot in the sequence.
            currentShotIndex = (currentShotIndex + 1) % currentShotOptions.length;
            if (pattern.seriesOrder === 'randomized' && currentShotIndex === 0) {
                currentShotOptions = shuffleArray(currentShotOptions);
            }
            const nextShotInSequence = currentShotOptions[currentShotIndex];

            // Start the next regular shot interval.
            startMainShotPhase(pattern, false, nextShotInSequence);
        }
    }, intervalStep);
}

/**
 * Determines if the current pattern or the entire workout should end based on limits.
 * @param {object} pattern - The current pattern data.
 * @returns {boolean} True if the pattern or workout should end, false otherwise.
 */
function shouldEndPattern(pattern) {
    if (globalLimitType === 'shot' && totalWorkoutShots >= globalShotLimit) {
        return true;
    }
    if (pattern.limitType === 'shot' && currentPatternShotCount >= pattern.patternLimit) {
        return true;
    }
    if (pattern.limitType === 'time' && currentPatternTimeElapsed >= pattern.patternLimit) {
        return true;
    }
    return false;
}

/**
 * Manages the rest interval countdown, beeps, and flashes.
 * @param {number} initialRemainingTime - The current time remaining in the rest interval.
 */
function resumeRestInterval(initialRemainingTime) {
    if (isPaused) return;

    currentWorkoutPhase = 'rest'; // Ensure phase is set to rest.

    // Clear any existing timer to prevent duplicates.
    if (mainPhaseTimer) clearInterval(mainPhaseTimer);

    let restRemaining = initialRemainingTime;
    pausedRestTimeRemaining = restRemaining; // Keep updated for potential re-pause.

    // Initial display update: display 'N'
    currentShotDisplay.textContent = restRemaining;

    // Progress bar update based on current remaining time vs original total rest duration
    // currentRestOriginalDuration must be correctly set in endPattern before this is called
    progressBar.style.width = `${((currentRestOriginalDuration - restRemaining) / currentRestOriginalDuration) * 100}%`;

    // Announce rest countdown numbers (10 seconds and below)
    if (restRemaining > 0 && restRemaining <= 10) {
        speak(restRemaining.toString(), false, false, 1.0).catch(e => console.error('Rest countdown speech error:', e)); // Force rate 1.0
    }

    mainPhaseTimer = setInterval(() => {
        if (isPaused) {
            clearInterval(mainPhaseTimer);
            return;
        }
        restRemaining--;
        globalWorkoutTimeElapsed++;
        pausedRestTimeRemaining = restRemaining; // Update for potential mid-rest pause.

        // Update display: "N" only, or "0" on final second
        currentShotDisplay.textContent = restRemaining > 0 ? restRemaining : '0';

        // Update progress bar
        progressBar.style.width = `${((currentRestOriginalDuration - restRemaining) / currentRestOriginalDuration) * 100}%`;

        // Beep and flash logic (for the last 10 seconds of rest)
        if (restRemaining > 0 && restRemaining <= 10) {
            playTwoToneBeep();
            flashScreenRed();
            // Announce rest countdown numbers (10 seconds and below)
            speak(restRemaining.toString(), false, false, 1.0).catch(e => console.error('Rest countdown speech error:', e)); // Force rate 1.0
        }


        // Check global time limit.
        if (globalLimitType === 'time' && globalWorkoutTimeElapsed >= globalTimeLimit) {
            clearInterval(mainPhaseTimer);
            handleWorkoutCompletion();
            return;
        }

        // Check if rest period has ended.
        if (restRemaining <= 0) {
            clearInterval(mainPhaseTimer);
            mainPhaseTimer = null;
            currentPatternIndex++;
            currentWorkoutPhase = 'shot';
            runCurrentPattern();
        }
    }, 1000);
}

/**
 * Converts a number into its word representation for numbers up to 59.
 * @param {number} num - The number to convert.
 * @param {Array<string>} singleWords - Array for numbers 0-19.
 * @param {Array<string>} tensWords - Array for tens (20, 30, 40, 50).
 * @returns {string} Word representation of the number.
 */
function getNumberWord(num, singleWords, tensWords) {
    if (num < 20) {
        return singleWords[num];
    } else {
        const tens = Math.floor(num / 10);
        const units = num % 10;
        return tensWords[tens] + (units > 0 ? "-" + singleWords[units] : "");
    }
}

/**
 * Converts a number of seconds into a friendly spoken time string.
 * @param {number} totalSeconds - The total number of seconds.
 * @returns {string} A friendly spoken representation (e.g., "thirty seconds", "one minute, five seconds", "one minute and a half").
 */
function getFriendlyTimeAnnouncement(totalSeconds) {
    if (totalSeconds === 0) return "zero seconds";
    if (totalSeconds < 0) return ""; // Should not happen for rest time

    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const numToWordsSingle = [
        "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    ];
    const numToWordsTens = [
        "", "", "twenty", "thirty", "forty", "fifty"
    ];

    let result = "";

    if (minutes > 0) {
        if (minutes === 1) {
            result += "one minute";
        } else {
            result += getNumberWord(minutes, numToWordsSingle, numToWordsTens) + " minutes";
        }

        if (seconds > 0) {
            if (seconds === 30) {
                result += " and a half";
            } else if (seconds < 10) { // For "a minute, five" instead of "a minute, five seconds"
                result += ", " + getNumberWord(seconds, numToWordsSingle, numToWordsTens);
            } else {
                result += ", " + getNumberWord(seconds, numToWordsSingle, numToWordsTens) + " seconds";
            }
        }
    } else { // Only seconds
        result += getNumberWord(seconds, numToWordsSingle, numToWordsTens) + " seconds";
    }

    return result;
}


/**
 * Ends the current pattern, handles outro messages and post-pattern rest.
 * @param {object} pattern - The pattern that just ended.
 */
async function endPattern(pattern) {
    // Clear all timers and timeouts associated with the current pattern.
    if (mainPhaseTimer) { clearInterval(mainPhaseTimer); mainPhaseTimer = null; }
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
    if (nextAnnouncementTimeout) { clearTimeout(nextAnnouncementTimeout); nextAnnouncementTimeout = null; }
    if (splitStepPowerUpTimeout) { clearTimeout(splitStepPowerUpTimeout); splitStepPowerUpTimeout = null; }
    document.body.style.backgroundColor = ''; // Clear inline style.
    if(synth) synth.cancel();

    // Add a small, guaranteed delay after the last shot's interval ends.
    await new Promise(resolve => setTimeout(resolve, 500));

    // Play outro message if configured.
    if (pattern.announceShots && pattern.outroMessage.trim()) {
        currentShotDisplay.textContent = 'Outro'; // Display message during outro.
        progressBar.style.width = '100%'; // Mark pattern as complete visually.
        await speak(pattern.outroMessage, false).catch(e => console.error('Outro message speech error:', e)); // Wait for outro message to finish.
    }

    const postRestTime = parseInt(pattern.postSequenceRest);
    if (postRestTime > 0) {
        currentRestOriginalDuration = postRestTime; // Store original duration for progress bar
        currentWorkoutPhase = 'rest'; // IMPORTANT: Set phase to rest BEFORE any speech or timer starts
        progressBar.style.width = '0%'; // IMPORTANT: Reset progress bar to 0% at the start of rest

        // CRITICAL: Initialize pausedRestTimeRemaining here, before any awaits or delays that might allow a pause.
        // At this point, the rest technically *starts*, even if speech is happening.
        pausedRestTimeRemaining = postRestTime;

        let restAnnouncementText = "Rest";
        if (postRestTime >= 30) { // Add friendly time if rest is 30 seconds or more
            const friendlyTime = getFriendlyTimeAnnouncement(postRestTime);
            restAnnouncementText += ` for ${friendlyTime}`;
        }

        // The text display should still simply say "Rest" or the countdown number.
        // So, `currentShotDisplay.textContent` is not changed here based on `restAnnouncementText`.
        // Instead, `resumeRestInterval` handles the number display.
        currentShotDisplay.textContent = "Rest"; // Display "Rest" initially

        // Use speak() to ensure the pattern's voice is used, but force rate 1.0 for rest announcement
        await speak(restAnnouncementText, false, false, 1.0).catch(e => console.error('Rest announcement speech error:', e)); // Force rate 1.0


        // After optional speech, start the actual countdown or immediately proceed if paused during speech
        if (!isPaused) { // Only start timer if not already paused during the speech above
            resumeRestInterval(pausedRestTimeRemaining); // Start countdown with whatever time is left (initially full)
        } else {
            // If we paused during the "Rest" announcement, the phase is 'rest' and pausedRestTimeRemaining is set.
            // The `resumeWorkout` function will pick it up from here.
            console.log("Workout paused during 'Rest' announcement. Waiting for resume to start timer.");
        }
    } else {
        currentPatternIndex++;
        currentWorkoutPhase = 'shot';
        runCurrentPattern();
    }
}

/**
 * Handles the completion of the entire workout routine.
 */
async function handleWorkoutCompletion() {
    // Clear all timers and timeouts.
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (mainPhaseTimer) { clearInterval(mainPhaseTimer); mainPhaseTimer = null; }
    if (flashTimer) { clearTimeout(flashTimer); flashTimer = null; }
    if (nextAnnouncementTimeout) { clearTimeout(nextAnnouncementTimeout); nextAnnouncementTimeout = null; }
    if (splitStepPowerUpTimeout) { clearTimeout(splitStepPowerUpTimeout); splitStepPowerUpTimeout = null; }
    // Clear workout elapsed time interval and reset display
    if (workoutTimerInterval) { clearInterval(workoutTimerInterval); workoutTimerInterval = null; }
    workoutElapsedTime = 0; // Reset elapsed time
    workoutElapsedTimeDisplay.textContent = formatTime(workoutElapsedTime); // Update display to 00:00

    document.body.style.backgroundColor = ''; // Clear inline style.

    isRoutineRunning = false;
    stopSpeechKeepAlive(); // Stop silent speech loop.
    if(synth) synth.cancel(); // Cancel any active speech.

    // Reset rest flags
    currentRestOriginalDuration = 0;
    pausedShotDisplayContent = ''; // Clear paused content

    await speak('Workout complete').catch(e => console.error('Workout complete speech error:', e)); // Wait for workout completion announcement.

    currentShotDisplay.textContent = 'Done';
    progressBar.style.width = '100%';

    // Configure pause/resume button for replay, and stop button for exit.
    pauseResumeWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${REPLAY_ICON}</span>`;
    pauseResumeWorkoutBtn.onclick = null; // Remove previous click handler.
    pauseResumeWorkoutBtn.addEventListener('click', () => {
        currentPatternIndex = 0;
        // Re-shuffle patterns for replay if randomized mode is active.
        if (workoutOrderMode === 'randomized') {
            currentWorkoutPatterns = shuffleArray(sequences);
        } else {
            currentWorkoutPatterns = [...sequences];
        }
        startWorkout(); // Restart the workout.
    }, { once: true }); // Ensure this listener is only active once per completion.
    pauseResumeWorkoutBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    pauseResumeWorkoutBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');

    stopWorkoutBtn.innerHTML = `<span class="flex items-center justify-center">${EXIT_ICON}</span>`;
    stopWorkoutBtn.onclick = null; // Remove previous click handler.
    stopWorkoutBtn.addEventListener('click', stopWorkout, { once: true }); // Stop workout completely and go to main view.
    stopWorkoutBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
    stopWorkoutBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');

    currentWorkoutPhase = 'idle'; // Reset phase to idle
}

/**
 * Briefly flashes the screen red to provide visual feedback for a shot.
 */
function flashScreenRed() {
    if (isPaused) { return; }

    // Apply the flash color directly using the Tailwind red-500 hex value.
    document.body.style.backgroundColor = '#ef4444';

    // Clear any existing flash timer to prevent conflicts.
    if (flashTimer) clearTimeout(flashTimer);

    // Schedule restoration of the original background after a short flash duration.
    const flashDurationMs = 150;
    flashTimer = setTimeout(() => {
        // Clear the inline style to let the original Tailwind classes re-apply.
        document.body.style.backgroundColor = '';
        flashTimer = null;
    }, flashDurationMs);
}

/**
 * Shuffles the elements of an array randomly.
 * @param {Array} array - The array to shuffle.
 * @returns {Array} A new array with shuffled elements.
 */
function shuffleArray(array) {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
}

  // --- THEME-BASED BANNER FOOTER IMAGE LOGIC ---
  /**
   * Updates the source of the banner and footer images based on the current theme (light/dark mode).
   */
  const updateImages = () => {
      const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches || document.body.classList.contains('dark');
      if (isDarkMode) {
          appBanner.src = 'banner-black.png';
          appFooter.src = 'footer-black.png';
      } else {
          appBanner.src = 'banner-white.png';
          appFooter.src = 'footer-white.png';
      }
  };

  // Observe changes to system color scheme.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      updateImages();
  });
  // Observe changes to the 'dark' class on the body for manual theme toggling.
  const bodyClassObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
              updateImages();
          }
      }
  });
  bodyClassObserver.observe(document.body, { attributes: true });


  // --- EVENT LISTENERS ---

  /**
   * Updates the visibility and values of global workout limit controls based on selected type.
   */
  const updateGlobalLimitControls = () => {
    globalLimitType = globalLimitTypeSelect.value;
    globalShotLimitControls.classList.toggle('hidden', globalLimitType !== 'shot');
    globalTimeLimitControls.classList.toggle('hidden', globalLimitType !== 'time');

    if (globalLimitType === 'shot') {
        // Recalculate minimum shot limit based on accumulated pattern shots if individual limits are shot-based.
        const minShots = sequences.reduce((sum, p) => sum + (p.limitType === 'shot' ? p.patternLimit : 0), 0);
        globalShotLimitSlider.min = minShots;
        if (globalShotLimit < minShots) {
            globalShotLimit = minShots;
        }
        globalShotLimitSlider.value = globalShotLimit;
        globalShotLimitDisplay.textContent = `${globalShotLimit} shots`;
    } else if (globalLimitType === 'time') {
        // Recalculate minimum time limit based on accumulated pattern times if individual limits are time-based.
        const minTime = sequences.reduce((sum, p) => sum + (p.limitType === 'time' ? p.patternLimit : 0), 0);
        globalTimeLimitSlider.min = minTime > 0 ? minTime : 60; // Ensure minimum of 60 seconds if no time-based patterns.
        if (globalTimeLimit < globalTimeLimitSlider.min) {
            globalTimeLimit = parseInt(globalTimeLimitSlider.min);
        }
        globalTimeLimitSlider.value = globalTimeLimit;
        globalTimeLimitDisplay.textContent = formatTime(globalTimeLimit);
    }
    calculateTotalWorkoutTime();
  };

  // Event listener for workout countdown slider.
  workoutCountdownSlider.addEventListener('input', (e) => {
    workoutCountdownTime = parseInt(e.target.value);
    workoutCountdownDisplay.textContent = `${workoutCountdownTime}s`;
    calculateTotalWorkoutTime();
  });

  // Event listeners for global limit controls.
  globalLimitTypeSelect.addEventListener('change', updateGlobalLimitControls);
  globalShotLimitSlider.addEventListener('input', (e) => {
      globalShotLimit = parseInt(e.target.value);
      globalShotLimitDisplay.textContent = `${globalShotLimit} shots`;
      calculateTotalWorkoutTime(); // Update total time on shot limit change.
  });
  globalTimeLimitSlider.addEventListener('input', (e) => {
      globalTimeLimit = parseInt(e.target.value);
      globalTimeLimitDisplay.textContent = formatTime(globalTimeLimit);
      calculateTotalWorkoutTime();
  });

  // Global click listener to turn off interaction modes if an unrelated element is clicked.
  document.addEventListener('click', (e) => {
      if (isMoveModeOn || isDeleteModeOn) {
          if (
              !movePatternToggleButton.contains(e.target) &&
              !deletePatternToggleButton.contains(e.target) &&
              !patternsAccordionContainer.contains(e.target) &&
              !e.target.closest('#confirmation-modal') &&
              !e.target.closest('#alert-modal') &&
              e.target !== startWorkoutButton &&
              !startWorkoutButton.contains(e.target) &&
              !workoutViewContainer.contains(e.target)
          ) {
              setInteractionMode(null);
          }
      }
  });


  // Main Action Buttons (New, Move Toggle, Delete Toggle).
  newPatternBtn.addEventListener('click', () => {
    addSequence();
  });

  movePatternToggleButton.addEventListener('click', () => {
      setInteractionMode(isMoveModeOn ? null : 'move');
  });

  deletePatternToggleButton.addEventListener('click', () => {
      setInteractionMode(isDeleteModeOn ? null : 'delete');
  });


  // Event delegation for accordion container clicks (List View).
  patternsAccordionContainer.addEventListener('click', (e) => {
      const accordionItem = e.target.closest('.accordion-item');
      if (!accordionItem) return;

      const patternId = parseFloat(accordionItem.dataset.patternId);
      const patternIndex = sequences.findIndex(p => p.id === patternId);
      if (patternIndex === -1) return;

      if (isMoveModeOn) {
          if (e.target.closest('.chevron-up-toggle')) {
              movePattern(patternIndex, 'up');
          } else if (e.target.closest('.chevron-down-toggle')) {
              movePattern(patternIndex, 'down');
          }
          e.stopPropagation();
      } else if (isDeleteModeOn) {
          if (e.target.closest('.delete-toggle')) {
              showConfirmationModalForDelete(patternIndex);
          }
          e.stopPropagation();
      } else {
          // Normal mode: clicking the header (or pattern name) opens the editor.
          if (e.target.closest('.pattern-name-display') || e.target.closest('.right-chevron')) {
              activeSequenceIndex = patternIndex; // Set the active pattern for the editor.
              showView('editor'); // Navigate to editor view.
              e.stopPropagation(); // Prevent any other clicks from propagating.
          }
      }
  });


  // Back to List button in editor.
  document.getElementById('back-to-list-btn').addEventListener('click', () => {
      saveCurrentSequenceState(); // Save changes from editor.
      activeSequenceIndex = -1; // Clear active pattern.
      showView('main'); // Go back to main accordion view.
  });

  // Event listeners for inputs/changes within the currently rendered editor screen (delegated to sequencesContainer).
  sequencesContainer.addEventListener('input', (e) => {
      if (!patternEditorContainer.classList.contains('hidden') && sequencesContainer.contains(e.target)) {
          const currentEl = sequencesContainer.firstChild; // Get the currently active cloned sequence element.
          if (!currentEl) return;

          if (e.target.closest('#limitTypeSelect')) {
              handleLimitTypeChange(currentEl);
          } else {
              saveCurrentSequenceState();
          }

          if (e.target.closest('#shotOptions')) updateShotOptionsDisplay(currentEl);
          else if (e.target.closest('#introMessage') || e.target.closest('#outroMessage') || e.target.closest('#announceShots')) updateNarrationDisplay(currentEl);
          else if (e.target.closest('#shotInterval') || e.target.closest('#randomOffset') || e.target.closest('#nextShotAnnouncement') || e.target.closest('#splitStepHint')) {
              updateIntervalDisplay(currentEl);
              // Recalculate limit if type is time and interval changed.
              if (sequences[activeSequenceIndex].limitType === 'time') {
                 handleLimitTypeChange(currentEl); // This will re-evaluate patternLimit based on new interval.
              }
              // Also re-evaluate nextShotAnnouncement max if shotInterval changes.
              if (e.target.closest('#shotInterval')) {
                handleAnnounceShotsChange(currentEl); // Update max for nextShotAnnouncement based on new interval.
              }
          }
          else if (e.target.closest('#patternLimitSlider')) updateLimitsDisplay(currentEl);
          else if (e.target.closest('#postSequenceRest')) updatePostRestDisplay(currentEl);
          else if (e.target.closest('#speechRate')) {
              const speechRateValueDisplay = currentEl.querySelector('#speechRateValue');
              if (speechRateValueDisplay) {
                  speechRateValueDisplay.textContent = parseFloat(e.target.value).toFixed(1);
              }
              saveCurrentSequenceState(); // Save after updating display.
          }
      }
  });
  sequencesContainer.addEventListener('change', (e) => {
      if (!patternEditorContainer.classList.contains('hidden') && sequencesContainer.contains(e.target)) {
          const currentEl = sequencesContainer.firstChild;
          if (!currentEl) return;

          if (e.target.closest('#limitTypeSelect')) {
              handleLimitTypeChange(currentEl);
          } else {
              saveCurrentSequenceState();
          }

          if (e.target.name === 'seriesOrder') updateSequencingDisplay(currentEl);
          if (e.target.closest('#announceShots')) handleAnnounceShotsChange(currentEl);
          if (e.target.closest('#speechVoiceSelect')) {
              saveCurrentSequenceState(); // Save the selected voice.
          }
          if (e.target.closest('#splitStepHint')) {
              saveCurrentSequenceState();
              updateIntervalDisplay(currentEl); // Update interval display to show hint.
          }
      }
  });

  // Individual pattern action buttons in the editor.
  document.getElementById('clone-btn').addEventListener('click', cloneSequence);
  document.getElementById('import-btn').addEventListener('click', importPatternConfig);
  document.getElementById('save-btn').addEventListener('click', savePatternConfig);
  document.getElementById('reset-btn').addEventListener('click', resetCurrentSequence);


  // Global buttons for all patterns.
  document.getElementById('load-all-btn').addEventListener('click', loadWorkout);
  document.getElementById('save-all-btn').addEventListener('click', saveWorkout);
  document.getElementById('reset-all-btn').addEventListener('click', clearAllPatterns);

  // --- Workout Buttons Event Listeners ---
  startWorkoutButton.addEventListener('click', startWorkout);
  pauseResumeWorkoutBtn.addEventListener('click', togglePauseResume);

  // Event listener for global workout order radio buttons.
  globalWorkoutOrderRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
          workoutOrderMode = e.target.value;
          console.log('Global workout order mode changed to:', workoutOrderMode);
      });
  });


  // --- INITIALIZATION ---
  /**
   * Initializes the application state and UI on DOM content loaded.
   */
  const initialize = () => {
    if (sequences.length === 0) {
        sequences.push(getNewSequenceData());
        sequences[0].patternName = "Pattern 1";
    }
    activeSequenceIndex = -1; // Start with no pattern active in editor.
    selectedPatternId = sequences[0].id; // Select the first pattern by default.
    showView('main'); // Start with the main accordion list view.
    calculateTotalWorkoutTime();

    // Set initial state of global workout order radios.
    globalWorkoutOrderRadios.forEach(radio => {
        if (radio.value === workoutOrderMode) {
            radio.checked = true;
        }
    });

    initAudioContext();
    initSpeechSynthesis();
    updateImages(); // Set initial banner and footer image.
  };

  initialize();
});
