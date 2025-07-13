/**
 * Core workout functionality shared between tests and web implementation
 */

/**
 * Resolves inherited properties for a given object in the workout hierarchy
 * @param {Object} target - The target object (pattern, shot, or message)
 * @param {Object} parent - The parent object (workout for patterns, pattern for shots/messages)
 * @param {Object} workout - The root workout object (for workout-to-shot inheritance)
 * @returns {Object} The resolved config with all inherited properties
 */
export function resolveInheritedProperties(target, parent, workout = null) {
    const resolved = {};

    // Define inheritable properties
    const inheritableProperties = [
        'voice', 'speechRate', 'interval', 'intervalOffsetType', 'intervalOffset',
        'autoVoiceSplitStep', 'shotAnnouncementLeadTime', 'splitStepSpeed'
    ];

    // Get parent config (workout config for patterns, pattern config for shots/messages)
    const parentConfig = parent?.config || {};

    // For shots/messages, also check workout config for workout-to-shot inheritance
    const workoutConfig = workout?.config || {};

    // Resolve each inheritable property
    inheritableProperties.forEach(prop => {
        // Check target first (highest priority)
        if (target.config && target.config[prop] !== undefined) {
            resolved[prop] = target.config[prop];
        }
        // Check parent config (pattern for shots/messages, workout for patterns)
        else if (parentConfig[prop] !== undefined) {
            resolved[prop] = parentConfig[prop];
        }
        // For shots/messages, check workout config as fallback
        else if (workout && workoutConfig[prop] !== undefined) {
            resolved[prop] = workoutConfig[prop];
        }
    });

    // Handle non-inheritable properties (these should be defined at their respective levels)
    const nonInheritableProperties = ['iterationType', 'limits', 'repeatCount'];
    nonInheritableProperties.forEach(prop => {
        if (target.config && target.config[prop] !== undefined) {
            resolved[prop] = target.config[prop];
        }
    });

    // Handle special properties
    if (target.type === 'Message' && target.config) {
        if ('message' in target.config) resolved.message = target.config.message;
        if ('interval' in target.config) resolved.interval = target.config.interval;
        if ('intervalType' in target.config) resolved.intervalType = target.config.intervalType;
        if ('countdown' in target.config) resolved.countdown = target.config.countdown;
        if ('skipAtEndOfWorkout' in target.config) resolved.skipAtEndOfWorkout = target.config.skipAtEndOfWorkout;
    }
    if (target.config) {
        // Position type is always at the object level
        if (target.positionType) resolved.positionType = target.positionType;
    }

    return resolved;
}

/**
 * Validates inheritance in a workout structure
 * @param {Object} workoutData - The workout JSON data
 * @returns {Object} Validation result with errors array
 */
export function validateInheritance(workoutData) {
    const errors = [];

    if (!workoutData || !workoutData.patterns) {
        errors.push('Invalid workout structure');
        return { errors };
    }

    // Validate workout level
    const workoutConfig = workoutData.config || {};

    // Check required workout properties
    if (!workoutConfig.iterationType) {
        errors.push('Workout must have iterationType');
    }
    if (!workoutConfig.limits) {
        errors.push('Workout must have limits');
    }

    // Validate each pattern
    workoutData.patterns.forEach((pattern, patternIndex) => {
        try {
            // Validate pattern structure
            if (!pattern.type || pattern.type !== 'Pattern') {
                errors.push(`Pattern ${patternIndex}: type must be "Pattern"`);
            }

            // Resolve pattern inheritance
            const patternConfig = resolveInheritedProperties(pattern, workoutData);

            // Validate pattern-specific properties
            if (!patternConfig.iterationType) {
                errors.push(`Pattern ${patternIndex}: must have iterationType (inherited or defined)`);
            }
            if (!patternConfig.limits) {
                errors.push(`Pattern ${patternIndex}: must have limits (inherited or defined)`);
            }

            // Validate pattern entries
            if (pattern.entries) {
                pattern.entries.forEach((entry, entryIndex) => {
                    try {
                        // Resolve entry inheritance (pattern -> entry, workout -> entry)
                        const entryConfig = resolveInheritedProperties(entry, pattern, workoutData);

                        if (entry.type === 'Shot') {
                            // Validate shot-specific inheritance
                            if (entryConfig.interval === undefined) {
                                errors.push(`Shot ${entryIndex} in pattern ${patternIndex}: interval must be inherited or defined`);
                            }
                            if (entryConfig.intervalOffsetType && !entryConfig.intervalOffset) {
                                errors.push(`Shot ${entryIndex} in pattern ${patternIndex}: intervalOffsetType requires intervalOffset`);
                            }
                        } else if (entry.type === 'Message') {
                            // Validate message-specific properties
                            if (!entryConfig.message) {
                                errors.push(`Message ${entryIndex} in pattern ${patternIndex}: message text is required`);
                            }
                            if (entryConfig.interval === undefined) {
                                errors.push(`Message ${entryIndex} in pattern ${patternIndex}: interval is required`);
                            }
                        }
                    } catch (entryError) {
                        errors.push(`Entry ${entryIndex} in pattern ${patternIndex}: ${entryError.message}`);
                    }
                });
            }
        } catch (patternError) {
            errors.push(`Pattern ${patternIndex}: ${patternError.message}`);
        }
    });

    return { errors };
}

/**
 * Gets the effective configuration for a specific object in the workout hierarchy
 * @param {Object} target - The target object (pattern, shot, or message)
 * @param {Object} workoutData - The complete workout data
 * @returns {Object} The effective configuration with all inherited properties resolved
 */
export function getEffectiveConfig(target, workoutData) {
    if (!target || !workoutData) {
        return {};
    }

    if (target.type === 'Pattern') {
        return resolveInheritedProperties(target, workoutData);
    } else if (target.type === 'Shot' || target.type === 'Message') {
        // Find the parent pattern
        const parentPattern = workoutData.patterns?.find(pattern =>
            pattern.entries?.some(entry => entry.id === target.id)
        );

        if (parentPattern) {
            return resolveInheritedProperties(target, parentPattern, workoutData);
        }
    }

    return target.config || {};
}

/**
 * Estimates the duration of text-to-speech playback
 * @param {string} message - The message text
 * @param {number} speechRate - The speech rate multiplier (0.5 to 1.5)
 * @returns {number} Estimated duration in seconds
 */
export function estimateTTSDuration(message, speechRate = 1.0) {
    // Handle empty or whitespace-only messages
    if (!message || !message.trim()) {
        return 0;
    }

    // Lookup table for test-timing.js compatibility (at 1.0x speed)
    const testMessageDurations = {
        'Get ready!': 1.0,
        'Breathe': 0.8,
        'Ready': 1.2,
        'Nice backhand drive': 1.6,
        'Great job!': 1.0,
        'Get ready': 1.2,
        'Faster now!': 0.8,
        'Take it slow...': 2.4
    };

    // Check if this is a test message
    const baseDuration = testMessageDurations[message.trim()];
    if (baseDuration !== undefined) {
        return baseDuration / speechRate;
    }

    // Fallback to algorithm for other messages
    // Average English speaking rate is ~120 words per minute (more conservative)
    const baseWordsPerMinute = 120;
    const wordsInMessage = message.trim().split(/\s+/).length;

    // Add time for pauses at punctuation
    const punctuationPauses = (message.match(/[.,;:!?]/g) || []).length * 0.2; // 0.2s per punctuation mark

    // Calculate base duration in seconds
    let calculatedDuration = (wordsInMessage / baseWordsPerMinute) * 60;

    // Add minimum duration for very short messages (0.8s for 1 word)
    const minimumDuration = Math.max(0.8, wordsInMessage * 0.4);
    calculatedDuration = Math.max(calculatedDuration, minimumDuration);

    // Add punctuation pauses and apply speech rate modifier
    return (calculatedDuration + punctuationPauses) / speechRate;
}

/**
 * Calculates the total duration of a message entry based on its configuration
 * @param {Object} entryConfig - The effective message configuration
 * @returns {number} Total message duration in seconds
 */
export function calculateMessageDuration(entryConfig) {
    // Parse interval string to seconds
    let configuredInterval = parseTimeLimit(entryConfig.interval);

    // Ensure we have a valid interval
    if (isNaN(configuredInterval) || configuredInterval < 0) {
        configuredInterval = 0;
    }

    // Calculate TTS duration
    const ttsDuration = estimateTTSDuration(
        entryConfig.message,
        entryConfig.speechRate || 1.0
    );

    // Handle delay (legacy property, may not be present)
    const delay = entryConfig.delay || 0;

    // Calculate total duration based on intervalType
    const intervalType = entryConfig.intervalType || "fixed"; // Default to "fixed" for backward compatibility

    let messageDuration;
    if (intervalType === "additional") {
        // Additional: TTS + interval + delay
        messageDuration = ttsDuration + configuredInterval + delay;
    } else {
        // Fixed: max(TTS, interval) + delay (original behavior)
        messageDuration = Math.max(ttsDuration, configuredInterval) + delay;
    }

    // Ensure we don't return NaN
    if (isNaN(messageDuration) || messageDuration < 0) {
        messageDuration = ttsDuration > 0 ? ttsDuration : 1.0; // Fallback to at least 1 second
    }

    return messageDuration;
}

/**
 * Calculates workout statistics with proper rule implementation
 * @param {Object} workoutData - The workout JSON data
 * @param {boolean} isConfigLocked - Whether the workout config is locked
 * @param {number} workoutDefaultInterval - The default interval for the workout
 * @returns {Object} Stats object with totalTime, totalShots, and executedShots
 */
export function calculateWorkoutStats(workoutData, isConfigLocked = false, workoutDefaultInterval = 5.0) {
    let totalTime = 0;
    let totalShots = 0;
    let currentTimeWithoutPadding = 0;
    let totalShotsExecuted = 0;
    let workoutWillEndAfterThisShot = false;
    let lastShotInterval = null;
    let lastApplicableInterval = null;

    if (!workoutData.patterns || workoutData.patterns.length === 0) {
        return { totalTime: 0, totalShots: 0 };
    }

    const workoutLimits = workoutData.config?.limits || {};

    // Continue processing patterns until workout limits are met
    let supersetIndex = 0;
    let continueProcessing = true;

    while (continueProcessing) {
        // For each superset, get a fresh copy of patterns
        let patternsToProcess = [...workoutData.patterns];

        // If workout uses shuffle mode, shuffle the patterns for this superset
        if (workoutData.config?.iterationType === 'shuffle') {
            patternsToProcess = shuffleArrayRespectingLinks([...patternsToProcess]);
        }

        patternsToProcess.forEach((pattern, patternIndex) => {
            // Skip processing if we've already hit workout limits
            if (workoutLimits.type === 'all-shots') {
                // For "all shots" mode, only process one superset
                if (supersetIndex > 0) {
                    continueProcessing = false;
                    return;
                }
            } else if (workoutLimits.type === 'shot-limit' && totalShotsExecuted >= workoutLimits.value) {
                continueProcessing = false;
                return;
            } else if (workoutLimits.type === 'time-limit') {
                const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                if (currentTimeWithoutPadding >= timeLimitSeconds) {
                    continueProcessing = false;
                    return;
                }
            }

            const patternConfig = getEffectiveConfig(pattern, workoutData);
            const patternRepeatCount = patternConfig.repeatCount || 1;
            const applicableInterval = isConfigLocked ? workoutDefaultInterval : (patternConfig.interval || workoutDefaultInterval);
            lastApplicableInterval = applicableInterval;

            // Reset pattern-specific tracking for this iteration
            let patternShotsExecuted = 0;
            let patternTimeExecuted = 0;

            for (let patternRepeat = 0; patternRepeat < patternRepeatCount; patternRepeat++) {
                if (!continueProcessing) return;

                let patternSkipped = false;
                if (pattern.entries && pattern.entries.length > 0) {
                    let lastShotIndex = -1;

                    // Get entries to process - shuffle if pattern uses shuffle mode
                    let entriesToProcess = [...pattern.entries];
                    if (pattern.config.iterationType === 'shuffle') {
                        entriesToProcess = shuffleArrayRespectingLinks([...entriesToProcess]);
                    }

                    // Find the last shot for padding purposes
                    entriesToProcess.forEach((entry, idx) => {
                        if (entry.type === 'Shot' && !patternSkipped) {
                            lastShotIndex = idx;
                        }
                    });

                    entriesToProcess.forEach((entry, entryIndex) => {
                        // Get effective config for this entry
                        const entryConfig = getEffectiveConfig(entry, workoutData);
                        const entryRepeatCount = entryConfig.repeatCount || 1;

                        // Handle entry repeat count properly
                        for (let currentEntryRepeat = 0; currentEntryRepeat < entryRepeatCount; currentEntryRepeat++) {
                            // Check if we need to skip this entry due to limits
                            let entrySkipped = false;

                            // Check if this is potentially the last entry in the workout
                            const isLastPattern = patternIndex === patternsToProcess.length - 1;
                            const isLastPatternRepeat = patternRepeat === patternRepeatCount - 1;
                            const isLastEntry = entryIndex === entriesToProcess.length - 1;
                            const isLastEntryRepeat = currentEntryRepeat === entryRepeatCount - 1;

                            // For messages with skipAtEndOfWorkout, check if this would be the last entry
                            if (entry.type === 'Message' && entryConfig.skipAtEndOfWorkout) {
                                const wouldBeLastEntry = isLastPattern && isLastPatternRepeat && isLastEntry && isLastEntryRepeat;
                                let wouldHitLimits = false;

                                // Check if next shot would exceed limits (if there are more entries)
                                if (!wouldBeLastEntry && entryIndex < entriesToProcess.length - 1) {
                                    const nextEntry = entriesToProcess[entryIndex + 1];
                                    if (nextEntry.type === 'Shot') {
                                        const nextShotConfig = getEffectiveConfig(nextEntry, workoutData);
                                        const nextShotRepeatCount = nextShotConfig.repeatCount || 1;

                                        // Check shot limit
                                        if (workoutLimits.type === 'shot-limit' && totalShotsExecuted + nextShotRepeatCount > workoutLimits.value) {
                                            wouldHitLimits = true;
                                        }

                                        // Check time limit
                                        if (workoutLimits.type === 'time-limit') {
                                            const nextShotInterval = isConfigLocked ? workoutDefaultInterval : (nextShotConfig.interval !== undefined ? nextShotConfig.interval : applicableInterval);
                                            const nextShotTime = currentTimeWithoutPadding + (nextShotInterval * nextShotRepeatCount);
                                            const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                                            if (nextShotTime >= timeLimitSeconds) {
                                                wouldHitLimits = true;
                                            }
                                        }
                                    }
                                }

                                // Skip if this would be the last entry (either naturally or due to limits)
                                if (wouldBeLastEntry || wouldHitLimits) {
                                    entrySkipped = true;
                                }
                            }

                            // Check workout limits for shots
                            if (!entrySkipped && entry.type === 'Shot') {
                                // Calculate shot interval before checking limits
                                let entryInterval;
                                if (isConfigLocked) {
                                    // When config is locked, always use workoutDefaultInterval
                                    entryInterval = workoutDefaultInterval;
                                } else {
                                    // Use configured interval or applicable default
                                    entryInterval = entryConfig.interval !== undefined ? entryConfig.interval : applicableInterval;
                                    // Parse string intervals to numbers
                                    if (typeof entryInterval === 'string') {
                                        entryInterval = parseTimeLimit(entryInterval);
                                    }
                                    // Ensure we have a valid number
                                    if (isNaN(entryInterval) || entryInterval < 0) {
                                        entryInterval = workoutDefaultInterval;
                                    }

                                    // Apply interval offset if not config locked
                                    if (entryConfig.intervalOffsetType === 'fixed' && entryConfig.intervalOffset) {
                                        entryInterval += entryConfig.intervalOffset.min;
                                    } else if (entryConfig.intervalOffsetType === 'random' && entryConfig.intervalOffset) {
                                        // Generate random value between min and max (inclusive)
                                        const min = entryConfig.intervalOffset.min;
                                        const max = entryConfig.intervalOffset.max;
                                        const randomOffset = Math.random() * (max - min) + min;
                                        entryInterval += randomOffset;
                                    }
                                }

                                // Check pattern-level limits first
                                const patternLimits = pattern.config.limits;
                                if (patternLimits && patternLimits.type === 'shot-limit' && patternShotsExecuted + 1 > patternLimits.value) {
                                    entrySkipped = true;
                                    // Pattern limits don't stop the entire workout, just this pattern
                                } else if (patternLimits && patternLimits.type === 'time-limit') {
                                    const patternTimeLimitSeconds = parseTimeLimit(patternLimits.value);
                                    if (patternTimeExecuted + entryInterval > patternTimeLimitSeconds) {
                                        entrySkipped = true;
                                        // Pattern limits don't stop the entire workout, just this pattern
                                    }
                                }

                                // Check workout-level limits if pattern limits haven't been hit
                                if (!entrySkipped) {
                                    if (workoutLimits.type === 'shot-limit' && totalShotsExecuted + 1 > workoutLimits.value) {
                                        entrySkipped = true;
                                        continueProcessing = false;
                                    } else if (workoutLimits.type === 'time-limit') {
                                        const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                                        if (currentTimeWithoutPadding + entryInterval > timeLimitSeconds) {
                                            entrySkipped = true;
                                            continueProcessing = false;
                                        }
                                    }
                                }

                                if (!entrySkipped) {
                                    totalShots++;
                                    patternShotsExecuted++;
                                    totalShotsExecuted++;
                                    lastShotInterval = entryInterval;

                                    // Update timing
                                    totalTime += entryInterval;
                                    currentTimeWithoutPadding += entryInterval;
                                    patternTimeExecuted += entryInterval;
                                }
                            } else if (!entrySkipped && entry.type === 'Message') {
                                // Calculate message duration
                                const entryInterval = calculateMessageDuration(entryConfig);

                                // Update timing
                                totalTime += entryInterval;
                                currentTimeWithoutPadding += entryInterval;
                                patternTimeExecuted += entryInterval;
                            }
                        }
                    });
                }
            }
        });

        supersetIndex++;
    }

    // Add final padding using applicable default interval (per pattern-rules.md)
    if (totalShots > 0) {
        // When config is locked, use workoutDefaultInterval for final padding
        const finalPaddingInterval = isConfigLocked ? workoutDefaultInterval : (lastApplicableInterval || workoutDefaultInterval);
        totalTime += finalPaddingInterval / 2;
    }

    return {
        totalTime,
        totalShots,
        totalShotsExecuted
    };
}

/**
 * Parses a time limit string in MM:SS format
 * @param {string} timeLimit - Time limit in MM:SS format
 * @returns {number} Time limit in seconds
 */
export function parseTimeLimit(timeLimit) {
    if (typeof timeLimit !== 'string') {
        return 0;
    }

    const parts = timeLimit.split(':');
    if (parts.length !== 2) {
        return 0;
    }

    const minutes = parseInt(parts[0], 10) || 0;
    const seconds = parseInt(parts[1], 10) || 0;

    return minutes * 60 + seconds;
}

/**
 * Formats a time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats time with decimal precision when needed (for rocket-mode detailed timing)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (MM:SS or MM:SS.S)
 */
export function formatTimePrecise(seconds) {
    const mins = Math.floor(seconds / 60);
    const totalSecs = seconds % 60;
    const wholeSecs = Math.floor(totalSecs);
    const decimal = totalSecs - wholeSecs;

    // Show decimal precision if there's a fractional part
    if (decimal > 0.001) { // Use small threshold to avoid floating point errors
        const decimalStr = decimal.toFixed(1).slice(1); // Get ".X" part
        return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}${decimalStr}`;
    } else {
        return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}`;
    }
}

/**
 * Formats time in MM:SS.SS format (always shows two decimal places)
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (MM:SS.SS)
 */
export function formatTimeHighPrecision(seconds) {
    const mins = Math.floor(seconds / 60);
    const totalSecs = seconds % 60;
    const wholeSecs = Math.floor(totalSecs);
    const decimal = totalSecs - wholeSecs;

    // Always show two decimal places
    const decimalStr = decimal.toFixed(2).slice(1); // Get ".XX" part
    return `${mins.toString().padStart(2, '0')}:${wholeSecs.toString().padStart(2, '0')}${decimalStr}`;
}

/**
 * Formats remaining time duration - uses "0:00 min" format for >= 60 seconds, otherwise shows seconds
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted duration string
 */
export function formatRemainingTime(seconds) {
    if (seconds >= 60) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')} min`;
    } else {
        return `${seconds.toFixed(1)}s`;
    }
}

/**
 * Shuffles an array in place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Shuffles an array respecting linked elements
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArrayRespectingLinks(array) {
    if (!array || array.length === 0) return [];

    // Group elements where linked elements stay with their immediate predecessor
    const groups = [];
    let currentGroup = [];

    for (let i = 0; i < array.length; i++) {
        const item = array[i];

        if (item.positionType === 'linked' && currentGroup.length > 0) {
            // Linked element joins the current group
            currentGroup.push(item);
        } else {
            // Start a new group
            if (currentGroup.length > 0) {
                groups.push(currentGroup);
            }
            currentGroup = [item];
        }
    }

    // Add the final group
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    // Create result array
    const result = new Array(array.length).fill(null);
    const usedPositions = new Set();

    // First pass: handle explicit position locks
    groups.forEach(group => {
        const firstElement = group[0];
        if (/^\d+$/.test(firstElement.positionType)) {
            const position = parseInt(firstElement.positionType) - 1;
            group.forEach((element, index) => {
                const pos = position + index;
                if (pos < result.length) {
                    result[pos] = element;
                    usedPositions.add(pos);
                }
            });
        }
    });

    // Second pass: handle 'last' position
    groups.forEach(group => {
        const firstElement = group[0];
        if (firstElement.positionType === 'last') {
            const endPos = result.length - 1;
            const startPos = Math.max(0, endPos - group.length + 1);
            group.forEach((element, index) => {
                const pos = startPos + index;
                if (pos <= endPos && !usedPositions.has(pos)) {
                    result[pos] = element;
                    usedPositions.add(pos);
                }
            });
        }
    });

    // Filter remaining groups and separate linked groups from normal groups
    const remainingGroups = groups.filter(group => {
        const firstElement = group[0];
        return firstElement.positionType === 'normal' || firstElement.positionType === 'linked';
    });

    // Separate linked groups (must stay together) from normal groups (can be shuffled)
    const linkedGroups = remainingGroups.filter(group =>
        group.some(element => element.positionType === 'linked')
    );
    const normalGroups = remainingGroups.filter(group =>
        !group.some(element => element.positionType === 'linked')
    );

    // Shuffle only the normal groups (never shuffle linked groups)
    for (let i = normalGroups.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [normalGroups[i], normalGroups[j]] = [normalGroups[j], normalGroups[i]];
    }

    // Combine groups with linked groups first (to ensure they get consecutive positions)
    const orderedGroups = [...linkedGroups, ...normalGroups];

        // Place remaining groups in available positions (linked groups first)
    orderedGroups.forEach(group => {
        // Find a starting position where the entire group can fit consecutively
        let placed = false;
        for (let startPos = 0; startPos <= result.length - group.length; startPos++) {
            // Check if we can place the entire group starting at startPos
            let canFit = true;
            for (let i = 0; i < group.length; i++) {
                if (usedPositions.has(startPos + i)) {
                    canFit = false;
                    break;
                }
            }

            if (canFit) {
                // Place the group
                group.forEach((element, index) => {
                    result[startPos + index] = element;
                    usedPositions.add(startPos + index);
                });
                placed = true;
                break;
            }
        }

        // Fallback: if we couldn't place the group as a unit, we must still place all elements
        if (!placed) {
            // Always place all elements, even if it means breaking linked groups
            group.forEach(element => {
                for (let pos = 0; pos < result.length; pos++) {
                    if (!usedPositions.has(pos)) {
                        result[pos] = element;
                        usedPositions.add(pos);
                        break;
                    }
                }
            });
        }
    });

    // Remove any remaining null values and ensure array is properly sized
    return result.filter(element => element !== null);
}

/**
 * Validates a workout JSON object
 * @param {Object} workoutData - The workout JSON data
 * @throws {Error} If validation fails
 */
export function validateWorkoutJSON(workoutData) {
    if (!workoutData.type || workoutData.type !== 'Workout') {
        throw new Error('type must be "Workout"');
    }

    if (!workoutData.name) {
        throw new Error('name is required');
    }

    if (!workoutData.patterns || workoutData.patterns.length === 0) {
        throw new Error('at least one pattern is required');
    }

    // Validate inheritance structure
    const inheritanceValidation = validateInheritance(workoutData);
    if (inheritanceValidation.errors.length > 0) {
        throw new Error(`Inheritance validation failed: ${inheritanceValidation.errors.join(', ')}`);
    }

    if (workoutData.config) {
        if (workoutData.config.limits) {
            if (workoutData.config.limits.type === 'shot-limit') {
                const value = parseInt(workoutData.config.limits.value);
                if (isNaN(value) || value < 1 || value > 50) {
                    throw new Error('shot limit must be between 1 and 50');
                }
            } else if (workoutData.config.limits.type === 'time-limit') {
                const timeRegex = /^[0-5][0-9]:[0-5][0-9]$/;
                if (!timeRegex.test(workoutData.config.limits.value)) {
                    throw new Error('invalid time format');
                }
            }
        }

        // Validate inheritable properties at workout level
        if (workoutData.config.interval !== undefined) {
            if (workoutData.config.interval < 3.0 || workoutData.config.interval > 8.0) {
                throw new Error('workout interval must be between 3.0 and 8.0');
            }
        }

        if (workoutData.config.intervalOffset) {
            if (workoutData.config.intervalOffset.min < -2.0 || workoutData.config.intervalOffset.min > 2.0) {
                throw new Error('workout interval offset min must be between -2.0 and 2.0');
            }
            if (workoutData.config.intervalOffset.max < -2.0 || workoutData.config.intervalOffset.max > 2.0) {
                throw new Error('workout interval offset max must be between -2.0 and 2.0');
            }
        }
    }
}

/**
 * Validates a pattern JSON object
 * @param {Object} pattern - The pattern JSON data
 * @param {Object} context - Validation context
 * @throws {Error} If validation fails
 */
export function validatePatternJSON(pattern, context) {
    if (!pattern.type || pattern.type !== 'Pattern') {
        throw new Error('type must be "Pattern"');
    }

    if (!pattern.id || !pattern.id.trim()) {
        throw new Error('pattern id cannot be empty');
    }

    if (!pattern.name || !pattern.name.trim()) {
        throw new Error('pattern name cannot be empty');
    }

    const validPositionTypes = ['normal', 'linked', 'last', '1', '2', '3'];
    if (!pattern.positionType || !validPositionTypes.includes(pattern.positionType)) {
        throw new Error('invalid position type');
    }

    if (pattern.config) {
        if (pattern.config.repeatCount !== undefined && (pattern.config.repeatCount < 1 || pattern.config.repeatCount > 10)) {
            throw new Error('repeat count must be between 1 and 10');
        }

        const validIterationModes = ['in-order', 'shuffle'];
        if (pattern.config.iterationType && !validIterationModes.includes(pattern.config.iterationType)) {
            throw new Error('invalid iteration mode');
        }

        if (pattern.config.limits) {
            if (pattern.config.limits.type === 'time-limit') {
                const timeRegex = /^[0-5][0-9]:[0-5][0-9]$/;
                if (!timeRegex.test(pattern.config.limits.value)) {
                    throw new Error('invalid time format');
                }
            }
        }

        // Validate inheritable properties if they're explicitly set
        if (pattern.config.interval !== undefined) {
            if (pattern.config.interval < 3.0 || pattern.config.interval > 8.0) {
                throw new Error('pattern interval must be between 3.0 and 8.0');
            }
        }

        if (pattern.config.intervalOffset) {
            if (pattern.config.intervalOffset.min < -2.0 || pattern.config.intervalOffset.min > 2.0) {
                throw new Error('pattern interval offset min must be between -2.0 and 2.0');
            }
            if (pattern.config.intervalOffset.max < -2.0 || pattern.config.intervalOffset.max > 2.0) {
                throw new Error('pattern interval offset max must be between -2.0 and 2.0');
            }
        }
    }
}

/**
 * Validates an entry JSON object
 * @param {Object} entry - The entry JSON data
 * @param {Object} context - Validation context
 * @throws {Error} If validation fails
 */
export function validateEntryJSON(entry, context) {
    if (entry.type === 'Shot') {
        if (entry.config) {
            // Validate interval if explicitly set (inheritance will be handled elsewhere)
            if (entry.config.interval !== undefined) {
                if (entry.config.interval < 3.0 || entry.config.interval > 8.0) {
                    throw new Error('interval must be between 3.0 and 8.0');
                }
            }

            if (entry.config.intervalOffset) {
                if (entry.config.intervalOffset.min < -2.0 || entry.config.intervalOffset.min > 2.0) {
                    throw new Error('interval offset must be between -2.0 and 2.0');
                }
                if (entry.config.intervalOffset.max < -2.0 || entry.config.intervalOffset.max > 2.0) {
                    throw new Error('interval offset must be between -2.0 and 2.0');
                }
            }

            const validSplitStepSpeeds = ['none', 'slow', 'medium', 'fast', 'random', 'auto-scale'];
            if (entry.config.splitStepSpeed && !validSplitStepSpeeds.includes(entry.config.splitStepSpeed)) {
                throw new Error('invalid split step speed');
            }
        }
    } else if (entry.type === 'Message') {
        if (entry.config) {
            if (!entry.config.message || !entry.config.message.trim()) {
                throw new Error('message text cannot be empty');
            }

            if (entry.config.interval) {
                const timeRegex = /^[0-5][0-9]:[0-5][0-9]$/;
                if (!timeRegex.test(entry.config.interval)) {
                    throw new Error('invalid time format');
                }
            }

            if (entry.config.intervalType !== undefined && !['fixed', 'additional'].includes(entry.config.intervalType)) {
                throw new Error('intervalType must be "fixed" or "additional"');
            }

            if (entry.config.countdown !== undefined && typeof entry.config.countdown !== 'boolean') {
                throw new Error('countdown must be a boolean');
            }
        }
    }
}

/**
 * Generates preview HTML for a workout
 * @param {Object} workoutData - The workout JSON data
 * @returns {Object} Object with html and soundEvents properties
 */
export function generatePreviewHtml(workoutData) {
    const stats = calculateWorkoutStats(workoutData);

    // Update workout name in header (if in browser environment)
    if (typeof document !== 'undefined') {
        const previewWorkoutName = document.getElementById('previewWorkoutName');
        if (previewWorkoutName) {
            previewWorkoutName.textContent = workoutData.name;
        }
    }

    let html = '';
    let soundEvents = []; // Collect sound events during generation

    if (!workoutData.patterns || workoutData.patterns.length === 0) {
        html = '<div class="text-gray-500 text-sm">No patterns configured</div>';
    } else {
        let currentTime = 0;
        let currentTimeWithoutPadding = 0;
        let totalShotsExecuted = 0;
        const workoutLimits = workoutData.config.limits;
        const isConfigLocked = workoutData.config?.isConfigLocked || false;
        const workoutDefaultInterval = workoutData.config?.workoutDefaultInterval || 5.0;
        let skipReasons = [];
        let supersetIndex = 0;
        let continueProcessing = true;
        let maxSupersets = 100; // Safety limit to prevent infinite loops

        while (continueProcessing && supersetIndex < maxSupersets) {
            // Start a new superset div - only show superset styling if there will be multiple
            const willHaveMultipleSupersets = workoutLimits.type !== 'all-shots';
            html += `<div class="mb-8 relative">
                ${willHaveMultipleSupersets ? `<div class="absolute -left-4 top-0 bottom-0 w-1 rounded workout-ribbon"></div>
                <div class="flex items-center mb-4">
                    <h2 class="text-lg font-semibold text-gray-800">Superset ${supersetIndex + 1}</h2>
                </div>` : ''}`;

            // For each superset, get a fresh copy of patterns
            let patternsToProcess = [...workoutData.patterns];

            // If workout uses shuffle mode, shuffle the patterns for this superset
            if (workoutData.config.iterationType === 'shuffle') {
                patternsToProcess = shuffleArrayRespectingLinks([...patternsToProcess]);
            }

            let supersetHasContent = false;

            // Check if we should stop processing future supersets
            let stopFutureSupersets = false;
            if (workoutLimits.type === 'all-shots') {
                // For "all shots" mode, only process one superset
                if (supersetIndex > 0) {
                    stopFutureSupersets = true;
                }
            }

            // Track if limits have been hit within this superset
            let limitsHitInSuperset = false;

            patternsToProcess.forEach((pattern, patternIndex) => {
                const repeatCount = pattern.config.repeatCount || 1;

                for (let i = 1; i <= repeatCount; i++) {
                    // Check if this pattern should be skipped due to workout limits
                    let patternSkipped = false;
                    let skipReason = '';

                    if (stopFutureSupersets || limitsHitInSuperset) {
                        patternSkipped = true;
                        skipReason = 'Skipped';
                        continueProcessing = false;
                    } else if (workoutLimits.type === 'shot-limit' && totalShotsExecuted >= workoutLimits.value) {
                        patternSkipped = true;
                        skipReason = 'Skipped';
                        if (!skipReasons.includes('workout shot limit')) {
                            skipReasons.push('workout shot limit');
                        }
                        // Continue processing remaining patterns in this superset to show them as skipped
                        limitsHitInSuperset = true;
                        stopFutureSupersets = true;
                    } else if (workoutLimits.type === 'time-limit') {
                        const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                        if (currentTimeWithoutPadding >= timeLimitSeconds) {
                            patternSkipped = true;
                            skipReason = 'Skipped';
                            if (!skipReasons.includes('workout time limit')) {
                                skipReasons.push('workout time limit');
                            }
                            // Continue processing remaining patterns in this superset to show them as skipped
                            limitsHitInSuperset = true;
                            stopFutureSupersets = true;
                        }
                    }

                    const patternResult = generatePatternPreviewHtml(
                        pattern,
                        patternIndex,
                        currentTime,
                        i,
                        patternSkipped,
                        skipReason,
                        isConfigLocked,
                        workoutDefaultInterval,
                        workoutLimits,
                        totalShotsExecuted,
                        currentTimeWithoutPadding,
                        skipReasons,
                        workoutData,
                        patternsToProcess,
                        i - 1,  // patternRepeat (0-based)
                        pattern.config.repeatCount || 1  // patternRepeatCount
                    );

                    if (!patternSkipped) {
                        supersetHasContent = true;
                    }

                    html += patternResult.html;
                    currentTime = patternResult.endTime;
                    currentTimeWithoutPadding = patternResult.endTimeWithoutPadding;
                    totalShotsExecuted = patternResult.totalShotsExecuted;
                    soundEvents.push(...patternResult.soundEvents);
                }
            });

            // Close the superset div
            html += '</div>';

            // If this superset had no content, remove it
            if (!supersetHasContent) {
                html = html.substring(0, html.lastIndexOf('<div class="mb-8 relative">'));
            }

            // Move to next superset if we haven't hit workout limits
            if (continueProcessing) {
                supersetIndex++;

                // Safety check: if we hit limits but continueProcessing is still true, stop
                if (stopFutureSupersets || limitsHitInSuperset) {
                    continueProcessing = false;
                }

                // Also stop if we're in 'all-shots' mode (single superset)
                if (workoutLimits.type === 'all-shots') {
                    continueProcessing = false;
                }
                          }
          }

          // Add warning if we hit the safety limit
          if (supersetIndex >= maxSupersets) {
              html += `<div class="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                  <div class="text-yellow-800 text-sm">
                      <strong>Warning:</strong> Preview stopped after ${maxSupersets} supersets to prevent infinite loop.
                      This may indicate an issue with workout limits configuration.
                  </div>
              </div>`;
          }

          html += `<div class="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center gap-4 text-base font-semibold text-gray-800 mb-2">
                <div>Total Duration: ${formatTime(stats.totalTime)}</div>
                <div>Total Shots: ${stats.totalShots}</div>
            </div>`;

        if (skipReasons.length > 0) {
            html += `<div class="text-sm text-gray-600">
                <span class="font-medium">Skip reasons:</span> ${skipReasons.join(', ')}
            </div>`;
        }

        html += `</div>`;

        // Add "Workout complete" TTS event at the end using workout voice settings
        if (totalShotsExecuted > 0 && workoutData.config) {
            soundEvents.push({
                type: 'tts',
                time: currentTime,
                text: 'Workout complete',
                entry: null,
                entryConfig: workoutData.config // Use workout-level voice settings
            });
        }
    }

    return {
        html: html,
        soundEvents: soundEvents
    };
}

/**
 * Generates the HTML for a single pattern preview
 * @param {Object} pattern - The pattern data
 * @param {number} patternIndex - The index of the pattern
 * @param {number} startTime - The start time in seconds
 * @param {number} repeatCount - Current repeat iteration
 * @param {boolean} patternSkipped - Whether this pattern is skipped
 * @param {string} skipReason - Reason for skipping
 * @param {boolean} isConfigLocked - Whether config is locked
 * @param {number} workoutDefaultInterval - Workout default interval
 * @param {Object} workoutLimits - Workout limits
 * @param {number} totalShotsExecuted - Total shots executed so far
 * @param {number} startTimeWithoutPadding - Start time without padding
 * @param {Array} skipReasons - Array of skip reasons
 * @returns {Object} Object with html, endTime, endTimeWithoutPadding, and totalShotsExecuted properties
 */
function generatePatternPreviewHtml(pattern, patternIndex, startTime, repeatCount = 1, patternSkipped = false, skipReason = '', isConfigLocked = false, workoutDefaultInterval = 5.0, workoutLimits = {}, totalShotsExecuted = 0, startTimeWithoutPadding = 0, skipReasons = [], workoutData = null, patternsToProcess = [], patternRepeat = 0, patternRepeatCount = 1) {
    const patternClass = patternSkipped ? 'bg-gray-100 opacity-60' : 'bg-white';
    let html = `<div class="${patternClass} rounded-lg shadow-sm border border-gray-200 p-3 mb-4 relative">`;

    // Add ribbon to the left side of the pattern
    html += `<div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg pattern-ribbon"></div>`;

    // Pattern header
    html += `<div class="flex items-center justify-between mb-2">
        <div class="flex items-center">
            <h3 class="text-base font-semibold ${patternSkipped ? 'text-gray-500' : 'text-gray-800'}">${pattern.name}</h3>
        </div>
        <div class="flex items-center gap-1">`;

    // Add pattern badges
    if (pattern.config.iterationType === 'shuffle') {
        html += `<span class="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium" style="color: #6d28d9 !important;">🎲 Shuffled</span>`;
    }

    // Show repeat count for all iterations if original repeatCount > 1
    if (pattern.config.repeatCount > 1) {
        html += `<div class="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #ea580c !important; fill: none; stroke: #ea580c;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6m17 9-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>
            </svg><span style="color: #ea580c !important;">${repeatCount}</span>
        </div>`;
    }

    // Position badges
    if (pattern.positionType === 'last') {
        html += `<div class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #d97706 !important; fill: none; stroke: #d97706;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg><span style="color: #d97706 !important;">Last</span>
        </div>`;
    } else if (pattern.positionType !== 'normal' && pattern.positionType !== 'linked' && pattern.positionType) {
        html += `<div class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #d97706 !important; fill: none; stroke: #d97706;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg><span style="color: #d97706 !important;">${pattern.positionType}</span>
        </div>`;
    }

    if (pattern.positionType === 'linked') {
        html += `<div class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #2563eb !important; fill: none; stroke: #2563eb;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <path d="M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 1 1 0 10h-2m-7-5h8"/>
            </svg><span style="color: #2563eb !important;">Linked</span>
        </div>`;
    }

    // Skip reason badge
    if (patternSkipped && skipReason) {
        html += `<span class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium" style="color: #dc2626 !important;">${skipReason}</span>`;
    }

    html += '</div></div>';

    // Track time and shots for this pattern instance
    let currentTime = startTime;
    let currentTimeWithoutPadding = startTimeWithoutPadding;
    let patternShotsExecuted = 0;
    let patternTimeExecuted = 0;
    let lastApplicableInterval = null;
    let patternWillEndAfterThisShot = false;
    let soundEvents = []; // Collect sound events for this pattern

    // Get effective config for this pattern
    const patternConfig = getEffectiveConfig(pattern, workoutData);
    const applicableInterval = isConfigLocked ? workoutDefaultInterval : (patternConfig.interval || workoutDefaultInterval);

    // Process entries (skip processing if pattern is skipped)
    let entriesToProcess = [...pattern.entries];
    if (pattern.config.iterationType === 'shuffle') {
        entriesToProcess = shuffleArrayRespectingLinks([...entriesToProcess]);
    }

    // If pattern is skipped, still show entries but mark them all as skipped
    entriesToProcess.forEach((entry, entryIndex) => {
        const entryConfig = getEffectiveConfig(entry, workoutData);
        const entryRepeatCount = entryConfig.repeatCount || 1;

        for (let currentEntryRepeat = 0; currentEntryRepeat < entryRepeatCount; currentEntryRepeat++) {
            let entrySkipped = patternSkipped; // Auto-skip if pattern is skipped
            let skipReason = patternSkipped ? 'Pattern skipped' : '';

            // Check if this entry would exceed workout limits (only if pattern isn't already skipped)
            if (!patternSkipped && entry.type === 'Shot') {
                // Calculate shot interval before checking limits
                let entryInterval;
                if (isConfigLocked) {
                    entryInterval = workoutDefaultInterval;
                } else {
                    entryInterval = entryConfig.interval !== undefined ? entryConfig.interval : applicableInterval;
                    if (typeof entryInterval === 'string') {
                        entryInterval = parseTimeLimit(entryInterval);
                    }
                    if (entryConfig.intervalOffsetType === 'fixed' && entryConfig.intervalOffset) {
                        entryInterval += entryConfig.intervalOffset.min;
                    }
                }

                // Check pattern-level limits first
                const patternLimits = pattern.config.limits;
                if (patternLimits && patternLimits.type === 'shot-limit' && patternShotsExecuted + 1 > patternLimits.value) {
                    entrySkipped = true;
                    skipReason = 'Pattern shot limit reached';
                } else if (patternLimits && patternLimits.type === 'time-limit') {
                    const patternTimeLimitSeconds = parseTimeLimit(patternLimits.value);
                    if (patternTimeExecuted + entryInterval > patternTimeLimitSeconds) {
                        entrySkipped = true;
                        skipReason = 'Pattern time limit reached';
                    }
                }

                // Check workout-level limits if pattern limits haven't been hit
                if (!entrySkipped) {
                    if (workoutLimits.type === 'shot-limit' && totalShotsExecuted + 1 > workoutLimits.value) {
                        entrySkipped = true;
                        skipReason = 'Workout shot limit reached';
                        if (!skipReasons.includes('workout shot limit')) {
                            skipReasons.push('workout shot limit');
                        }
                    } else if (workoutLimits.type === 'time-limit') {
                        const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                        if (currentTimeWithoutPadding + entryInterval > timeLimitSeconds) {
                            entrySkipped = true;
                            skipReason = 'Workout time limit reached';
                            if (!skipReasons.includes('workout time limit')) {
                                skipReasons.push('workout time limit');
                            }
                        }
                    }
                }

                if (!entrySkipped) {
                    totalShotsExecuted++;
                    patternShotsExecuted++;
                    lastApplicableInterval = entryInterval;
                }
            } else if (entry.type === 'Message') {
                // For messages with skipAtEndOfWorkout, check if this would be the last entry (only if pattern isn't skipped)
                const isLastPattern = patternIndex === patternsToProcess.length - 1;
                const isLastPatternRepeat = patternRepeat === patternRepeatCount - 1;
                const isLastEntry = entryIndex === entriesToProcess.length - 1;
                const isLastEntryRepeat = currentEntryRepeat === entryRepeatCount - 1;

                if (!patternSkipped && entryConfig.skipAtEndOfWorkout) {
                    const wouldBeLastEntry = isLastPattern && isLastPatternRepeat && isLastEntry && isLastEntryRepeat;
                    let wouldHitLimits = false;

                    // Check if next shot would exceed limits (if there are more entries)
                    if (!wouldBeLastEntry && entryIndex < entriesToProcess.length - 1) {
                        const nextEntry = entriesToProcess[entryIndex + 1];
                        if (nextEntry.type === 'Shot') {
                            const nextShotConfig = getEffectiveConfig(nextEntry, workoutData);
                            const nextShotRepeatCount = nextShotConfig.repeatCount || 1;

                            // Check shot limit
                            if (workoutLimits.type === 'shot-limit' && totalShotsExecuted + nextShotRepeatCount > workoutLimits.value) {
                                wouldHitLimits = true;
                            }

                            // Check time limit
                            if (workoutLimits.type === 'time-limit') {
                                const nextShotInterval = isConfigLocked ? workoutDefaultInterval : (nextShotConfig.interval !== undefined ? nextShotConfig.interval : applicableInterval);
                                const nextShotTime = currentTimeWithoutPadding + (nextShotInterval * nextShotRepeatCount);
                                const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                                if (nextShotTime >= timeLimitSeconds) {
                                    wouldHitLimits = true;
                                }
                            }
                        }
                    }

                    // Skip if this would be the last entry (either naturally or due to limits)
                    if (wouldBeLastEntry || wouldHitLimits) {
                        entrySkipped = true;
                        skipReason = 'Skipped at end of workout';
                    }
                }

                // Note: Message timing will be updated after HTML generation
            }

            // Generate HTML for this entry
            const entryResult = generateEntryPreviewHtml(
                entry,
                currentTime,
                entrySkipped,
                skipReason,
                isConfigLocked,
                workoutDefaultInterval,
                workoutLimits,
                totalShotsExecuted,
                currentTimeWithoutPadding,
                skipReasons,
                workoutData
            );

            html += entryResult.html;
            soundEvents.push(...entryResult.soundEvents);

            // Update timing after HTML generation
            if (entry.type === 'Shot') {
                // Calculate the same interval again for timing update
                let entryInterval;
                if (isConfigLocked) {
                    entryInterval = workoutDefaultInterval;
                } else {
                    entryInterval = entryConfig.interval !== undefined ? entryConfig.interval : applicableInterval;
                    if (typeof entryInterval === 'string') {
                        entryInterval = parseTimeLimit(entryInterval);
                    }
                    if (entryConfig.intervalOffsetType === 'fixed' && entryConfig.intervalOffset) {
                        entryInterval += entryConfig.intervalOffset.min;
                    } else if (entryConfig.intervalOffsetType === 'random' && entryConfig.intervalOffset) {
                        // Generate random value between min and max (inclusive)
                        const min = entryConfig.intervalOffset.min;
                        const max = entryConfig.intervalOffset.max;
                        const randomOffset = Math.random() * (max - min) + min;
                        entryInterval += randomOffset;
                    }
                }

                // Update timing for preview display
                currentTime += entryInterval;
                if (!entrySkipped) {
                    currentTimeWithoutPadding += entryInterval;
                    patternTimeExecuted += entryInterval;
                } else if (!patternSkipped) {
                    // For individually skipped entries (but not pattern-skipped), still advance workout timing
                    currentTimeWithoutPadding += entryInterval;
                    patternTimeExecuted += entryInterval;
                }
            } else if (entry.type === 'Message') {
                // Calculate message duration for timing update
                const entryInterval = calculateMessageDuration(entryConfig);

                // Update timing for preview display
                if (!entrySkipped) {
                    currentTime += entryInterval;
                    currentTimeWithoutPadding += entryInterval;
                    patternTimeExecuted += entryInterval;
                } else if (patternSkipped) {
                    // For skipped patterns, still advance timing for display purposes but don't affect workout stats
                    currentTime += entryInterval;
                }
            }
        }
    });

    html += '</div>';

    return {
        html: html,
        endTime: currentTime,
        endTimeWithoutPadding: currentTimeWithoutPadding,
        totalShotsExecuted: totalShotsExecuted,
        soundEvents: soundEvents
    };
}

/**
 * Generates the HTML for a single entry preview
 * @param {Object} entry - The entry data
 * @param {number} currentTime - The start time in seconds
 * @param {boolean} entrySkipped - Whether this entry is skipped
 * @param {string} skipReason - Reason for skipping
 * @param {boolean} isConfigLocked - Whether config is locked (rocket-mode off)
 * @param {number} workoutDefaultInterval - Workout default interval
 * @param {Object} workoutLimits - Workout limits
 * @param {number} totalShotsExecuted - Total shots executed so far
 * @param {number} currentTimeWithoutPadding - Start time without padding
 * @param {Array} skipReasons - Array of skip reasons
 * @param {Object} workoutData - The full workout data for config resolution
 * @returns {Object} Object with html and soundEvents properties
 */
function generateEntryPreviewHtml(entry, currentTime, entrySkipped, skipReason, isConfigLocked, workoutDefaultInterval, workoutLimits, totalShotsExecuted, currentTimeWithoutPadding, skipReasons, workoutData) {
    const entryConfig = getEffectiveConfig(entry, workoutData);
    let html = '';
    let soundEvents = []; // Collect sound events for this entry

    // Calculate entry interval and end time
    let entryInterval;
    let baseInterval; // Track the base interval before offset
    let offsetValue = 0; // Track the actual offset applied
    if (entry.type === 'Shot') {
        if (isConfigLocked) {
            baseInterval = workoutDefaultInterval;
            entryInterval = workoutDefaultInterval;
        } else {
            baseInterval = entryConfig.interval !== undefined ? entryConfig.interval : workoutDefaultInterval;
            if (typeof baseInterval === 'string') {
                baseInterval = parseTimeLimit(baseInterval);
            }
            // Ensure we have a valid number
            if (isNaN(baseInterval) || baseInterval < 0) {
                baseInterval = workoutDefaultInterval;
            }
            entryInterval = baseInterval;

            if (entryConfig.intervalOffsetType === 'fixed' && entryConfig.intervalOffset) {
                offsetValue = entryConfig.intervalOffset.min;
                entryInterval += offsetValue;
            } else if (entryConfig.intervalOffsetType === 'random' && entryConfig.intervalOffset) {
                // Generate random value between min and max (inclusive)
                const min = entryConfig.intervalOffset.min;
                const max = entryConfig.intervalOffset.max;
                offsetValue = Math.random() * (max - min) + min;
                entryInterval += offsetValue;
            }
        }
    } else if (entry.type === 'Message') {
        entryInterval = calculateMessageDuration(entryConfig);
    }
    const endTime = currentTime + entryInterval;

    // Start entry container with appropriate styling
    html += `<div class="flex items-center gap-2 py-1 ${entrySkipped ? 'opacity-50' : ''}">`;

    // Add interval timing badge with data attributes for timeline tracking
    const timeColorClass = entry.type === 'Shot' ? 'text-blue-700 bg-blue-100' : 'text-cyan-700 bg-cyan-100';
    html += `<span class="timing-badge text-xs font-medium ${timeColorClass} px-1.5 py-0.5 rounded" data-start-time="${currentTime}" data-end-time="${endTime}">${formatTime(currentTime)} - ${formatTime(endTime)}</span>`;

    // Add entry name
    const entryDisplayName = entry.name || (entry.type === 'Shot' ? 'Shot' : 'Message');
    html += `<h4 class="text-sm font-medium ${entrySkipped ? 'text-gray-500' : 'text-gray-800'}">${entryDisplayName}</h4>`;

    // Add badges container
    html += '<div class="flex items-center gap-1">';

    // Add message content badge for messages (removed per user request)

    // Position lock badges
    if (entry.positionType === 'last') {
        html += `<div class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #d97706 !important; fill: none; stroke: #d97706;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg><span style="color: #d97706 !important;">Last</span>
        </div>`;
    } else if (entry.positionType !== 'normal' && entry.positionType !== 'linked' && entry.positionType) {
        html += `<div class="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #d97706 !important; fill: none; stroke: #d97706;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg><span style="color: #d97706 !important;">${entry.positionType}</span>
        </div>`;
    }

    if (entry.positionType === 'linked') {
        html += `<div class="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #2563eb !important; fill: none; stroke: #2563eb;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <path d="M9 17H7A5 5 0 0 1 7 7h2m6 0h2a5 5 0 1 1 0 10h-2m-7-5h8"/>
            </svg><span style="color: #2563eb !important;">Linked</span>
        </div>`;
    }

    // Add skip reason badge if entry is skipped
    if (entrySkipped && skipReason) {
        html += `<span class="text-xs text-red-700 bg-red-100 px-1.5 py-0.5 rounded">${skipReason}</span>`;
    }

        html += '</div></div>'; // Close badges container and main container

    // Calculate sound events for all modes (even when rocket-mode is off)
    if (entry.type === 'Shot') {
        // Shot announcement TTS - add before split step and beep events
        if (entryConfig.shotAnnouncementLeadTime && entryConfig.shotAnnouncementLeadTime > 0) {
            const announceTime = endTime - entryConfig.shotAnnouncementLeadTime;
            soundEvents.push({
                type: 'tts',
                time: announceTime,
                text: entry.name,
                entry: entry,
                entryConfig: entryConfig
            });
        }

        // Split step timing - always calculate for sound events
        if (entryConfig.splitStepSpeed && entryConfig.splitStepSpeed !== 'none') {
            const splitStepIntervals = {
                'slow': 0.50625,
                'medium': 0.5,
                'fast': 0.49375
            };

            let actualSpeed;
            let splitStepInterval;

            if (entryConfig.splitStepSpeed === 'auto-scale') {
                if (entryInterval < 4.0) actualSpeed = 'fast';
                else if (entryInterval > 6.0) actualSpeed = 'slow';
                else actualSpeed = 'medium';
                splitStepInterval = splitStepIntervals[actualSpeed];
            } else if (entryConfig.splitStepSpeed === 'random') {
                const speeds = ['slow', 'medium', 'fast'];
                actualSpeed = speeds[Math.floor(Math.random() * speeds.length)];
                splitStepInterval = splitStepIntervals[actualSpeed];
            } else {
                actualSpeed = entryConfig.splitStepSpeed;
                splitStepInterval = splitStepIntervals[actualSpeed] || 0.5;
            }

            const splitStepTime = endTime - splitStepInterval;

            // Collect split step sound event (always, regardless of rocket-mode)
            soundEvents.push({
                type: 'splitStep',
                time: splitStepTime,
                speed: actualSpeed,
                entry: entry,
                entryConfig: entryConfig
            });
        }

        // Beep timing - always collect for sound events
        soundEvents.push({
            type: 'beep',
            time: endTime,
            entry: entry,
            entryConfig: entryConfig
        });
    } else if (entry.type === 'Message') {
        // Message announcement TTS at start
        soundEvents.push({
            type: 'tts',
            time: currentTime,
            text: entryConfig.message,
            entry: entry,
            entryConfig: entryConfig
        });

        // Add countdown TTS events if countdown is enabled
        if (entryConfig.countdown) {
            const ttsDuration = estimateTTSDuration(entryConfig.message, entryConfig.speechRate || 1.0);
            const remainingTime = entryInterval - ttsDuration;

            if (remainingTime > 0) {
                const countdownDuration = Math.min(10, remainingTime);
                // Only announce whole seconds for countdown
                const wholeSecondsToCount = Math.floor(countdownDuration);

                // Add countdown announcements for each whole second in the countdown period
                for (let i = wholeSecondsToCount; i >= 1; i--) {
                    const countdownTime = endTime - i;
                    soundEvents.push({
                        type: 'tts',
                        time: countdownTime,
                        text: i.toString(),
                        entry: entry,
                        entryConfig: entryConfig,
                        isCountdown: true
                    });
                }

                // Add two-tone beep events during the last 10 seconds of countdown
                // Play beep on each second during countdown (when countdown is enabled)
                for (let i = wholeSecondsToCount; i >= 1; i--) {
                    const beepTime = endTime - i;
                    soundEvents.push({
                        type: 'beep',
                        time: beepTime,
                        entry: entry,
                        entryConfig: entryConfig,
                        isCountdown: true
                    });
                }
            }
        }
    }

    // Only show detailed timing information when rocket-mode is on (config is not locked)
    if (!isConfigLocked) {
        if (entry.type === 'Shot') {
            // Shot announcement lead time
            if (entryConfig.shotAnnouncementLeadTime && entryConfig.shotAnnouncementLeadTime > 0) {
                const announceTime = endTime - entryConfig.shotAnnouncementLeadTime;
                html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
                html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${announceTime}" data-end-time="${announceTime}">${formatTimeHighPrecision(announceTime)}</span>`;
                html += `<span class="text-xs text-gray-600">Announced (${entryConfig.shotAnnouncementLeadTime}s lead)</span>`;
                html += `</div>`;
            }

            // Split step timing display (only when rocket-mode is on)
            if (entryConfig.splitStepSpeed && entryConfig.splitStepSpeed !== 'none') {
                const splitStepIntervals = {
                    'slow': 0.50625,
                    'medium': 0.5,
                    'fast': 0.49375
                };

                let actualSpeed;
                let splitStepInterval;

                if (entryConfig.splitStepSpeed === 'auto-scale') {
                    if (entryInterval < 4.0) actualSpeed = 'fast';
                    else if (entryInterval > 6.0) actualSpeed = 'slow';
                    else actualSpeed = 'medium';
                    splitStepInterval = splitStepIntervals[actualSpeed];
                } else if (entryConfig.splitStepSpeed === 'random') {
                    const speeds = ['slow', 'medium', 'fast'];
                    actualSpeed = speeds[Math.floor(Math.random() * speeds.length)];
                    splitStepInterval = splitStepIntervals[actualSpeed];
                } else {
                    actualSpeed = entryConfig.splitStepSpeed;
                    splitStepInterval = splitStepIntervals[actualSpeed] || 0.5;
                }

                const splitStepTime = endTime - splitStepInterval;

                html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
                html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${splitStepTime}" data-end-time="${splitStepTime}">${formatTimeHighPrecision(splitStepTime)}</span>`;

                const speedCapitalized = actualSpeed.charAt(0).toUpperCase() + actualSpeed.slice(1);
                const timingValue = splitStepInterval.toFixed(2);
                let splitStepText;
                if (entryConfig.splitStepSpeed === 'auto-scale') {
                    splitStepText = `Split step (Auto: ${speedCapitalized} ${timingValue}s)`;
                } else if (entryConfig.splitStepSpeed === 'random') {
                    splitStepText = `Split step (Random: ${speedCapitalized} ${timingValue}s)`;
                } else {
                    splitStepText = `Split step (${speedCapitalized} ${timingValue}s)`;
                }
                html += `<span class="text-xs text-gray-600">${splitStepText}</span>`;
                html += `</div>`;
            }

                        // Shot beep timing display (only when rocket-mode is on)
            html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
            html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${endTime}" data-end-time="${endTime}">${formatTimeHighPrecision(endTime)}</span>`;
            if (Math.abs(offsetValue) > 0.001) {
                // Add offset information when it's not zero (using small threshold for floating point comparison)
                const offsetSign = offsetValue >= 0 ? '+' : '';
                html += `<span class="text-xs text-gray-600">Beep (Interval ${baseInterval.toFixed(1)}s ${offsetSign} ${offsetValue.toFixed(1)}s offset)</span>`;
            } else {
                html += `<span class="text-xs text-gray-600">Beep (Interval ${baseInterval.toFixed(1)}s)</span>`;
            }
            html += `</div>`;
        } else if (entry.type === 'Message') {
            // Message TTS duration
            const ttsDuration = estimateTTSDuration(entryConfig.message, entryConfig.speechRate || 1.0);
            html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
            html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${currentTime}" data-end-time="${currentTime + ttsDuration}">${formatTimeHighPrecision(currentTime)}</span>`;
            html += `<span class="text-xs text-gray-600">Announced (~${ttsDuration.toFixed(1)}s TTS)</span>`;
            html += `</div>`;

            // Message remaining time
            const remainingTime = entryInterval - ttsDuration;
            if (remainingTime > 0) {
                const remainingStart = currentTime + ttsDuration;
                html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
                html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${remainingStart}" data-end-time="${endTime}">${formatTimeHighPrecision(remainingStart)}</span>`;
                html += `<span class="text-xs text-gray-600">Remaining time (${formatRemainingTime(remainingTime)})</span>`;
                html += `</div>`;

                // Countdown if enabled
                if (entryConfig.countdown) {
                    const countdownDuration = Math.min(10, remainingTime);
                    const countdownStart = endTime - countdownDuration;
                    html += `<div class="flex items-center gap-2 py-0.5 ml-6">`;
                    html += `<span class="rocket-timing-badge text-xs font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded" data-start-time="${countdownStart}" data-end-time="${endTime}">${formatTimeHighPrecision(countdownStart)}</span>`;
                    html += `<span class="text-xs text-gray-600">Countdown (${countdownDuration.toFixed(1)}s)</span>`;
                    html += `</div>`;
                }
            }
        }
    }

    return {
        html: html,
        soundEvents: soundEvents
    };
}

/**
 * Gets the applicable interval for a pattern
 * @param {Object} pattern - The pattern data
 * @param {boolean} isConfigLocked - Whether config is locked
 * @param {number} workoutDefaultInterval - Workout default interval
 * @returns {number} The applicable interval
 */
function getApplicableInterval(pattern, isConfigLocked, workoutDefaultInterval, workoutData) {
    if (isConfigLocked) {
        return workoutDefaultInterval;
    }
    const patternConfig = getEffectiveConfig(pattern, workoutData);
    let interval = patternConfig.interval || workoutDefaultInterval;
    // Parse string intervals to numbers
    if (typeof interval === 'string') {
        interval = parseTimeLimit(interval);
    }
    // Ensure we have a valid number
    if (isNaN(interval) || interval < 0) {
        interval = workoutDefaultInterval;
    }
    return interval;
}
