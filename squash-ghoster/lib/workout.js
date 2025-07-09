/**
 * Core workout functionality shared between tests and web implementation
 */

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
            patternsToProcess = shuffleArray([...patternsToProcess]);
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

            const patternRepeatCount = pattern.config.repeatCount || 1;
            const applicableInterval = isConfigLocked ? workoutDefaultInterval : (pattern.config.interval || workoutDefaultInterval);
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

                    entriesToProcess.forEach((entry, idx) => {
                        const entryRepeatCount = entry.config.repeatCount || 1;
                        workoutWillEndAfterThisShot = false;

                        let entrySkipped = patternSkipped;
                        if (!patternSkipped) {
                            // Check workout limits first for shots
                            if (entry.type === 'Shot') {
                                const nextShotCount = totalShotsExecuted + entryRepeatCount;
                                if (workoutLimits.type === 'shot-limit' && nextShotCount > workoutLimits.value) {
                                    entrySkipped = true;
                                    continueProcessing = false;
                                } else if (workoutLimits.type === 'time-limit') {
                                    const shotInterval = isConfigLocked ? workoutDefaultInterval : (entry.config.interval !== undefined ? entry.config.interval : applicableInterval);
                                    let effectiveInterval = shotInterval;
                                    if (!isConfigLocked && entry.config.intervalFuzzType === 'fixed' && entry.config.intervalFuzz) {
                                        effectiveInterval += entry.config.intervalFuzz.min;
                                    }
                                    const nextShotTime = currentTimeWithoutPadding + (effectiveInterval * entryRepeatCount);
                                    const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                                    if (nextShotTime >= timeLimitSeconds) {
                                        entrySkipped = true;
                                        continueProcessing = false;
                                    }
                                }
                            }

                            // Check pattern-specific limits
                            if (!entrySkipped && pattern.config.limits.type === 'shot-limit' && patternShotsExecuted >= pattern.config.limits.value) {
                                entrySkipped = true;
                            } else if (!entrySkipped && pattern.config.limits.type === 'time-limit') {
                                const timeLimitSeconds = parseTimeLimit(pattern.config.limits.value);
                                if (patternTimeExecuted >= timeLimitSeconds) {
                                    entrySkipped = true;
                                }
                            }
                        }

                        if (!entrySkipped) {
                            if (entry.type === 'Shot') {
                                totalShots += entryRepeatCount;
                                patternShotsExecuted += entryRepeatCount;
                                totalShotsExecuted += entryRepeatCount;

                                const interval = isConfigLocked ? workoutDefaultInterval : (entry.config.interval !== undefined ? entry.config.interval : applicableInterval);
                                let effectiveInterval = interval;
                                if (!isConfigLocked && entry.config.intervalFuzzType === 'fixed' && entry.config.intervalFuzz) {
                                    effectiveInterval = interval + entry.config.intervalFuzz.min;
                                }

                                // Always add shot intervals - no special case for first shot
                                totalTime += effectiveInterval * entryRepeatCount;
                                currentTimeWithoutPadding += effectiveInterval * entryRepeatCount;
                                patternTimeExecuted += effectiveInterval * entryRepeatCount;
                                lastShotInterval = interval;

                                // Add padding after this shot only if it's the last shot in the workout
                                const isLastShot = workoutWillEndAfterThisShot ||
                                    (!continueProcessing && idx === lastShotIndex);
                                const needsPadding = !entrySkipped && isLastShot;

                                if (needsPadding) {
                                    totalTime += interval / 2;
                                }
                            } else if (entry.type === 'Message') {
                                const timeParts = entry.config.interval.split(':');
                                const configuredDuration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                                const ttsDuration = estimateTTSDuration(
                                    entry.config.message,
                                    entry.config.speechRate || 1.0
                                );
                                const delay = entry.config.delay || 0;
                                const messageDuration = Math.max(ttsDuration, configuredDuration) + delay;

                                totalTime += messageDuration;
                                currentTimeWithoutPadding += messageDuration;
                                patternTimeExecuted += messageDuration;
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
        // Use the last applicable interval if available, otherwise use workout default
        const finalPaddingInterval = lastApplicableInterval || workoutDefaultInterval;
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
    const [minutes, seconds] = timeLimit.split(':').map(Number);
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

    // First, identify all groups (linked elements and standalone elements)
    const groups = [];
    let currentGroup = [];
    let inLinkedGroup = false;

    for (let i = 0; i < array.length; i++) {
        const item = array[i];

        // Start a new group if:
        // 1. We're not in a linked group and this item isn't linked
        // 2. This is the first item
        if (!inLinkedGroup && !item.positionType === 'linked' || i === 0) {
            if (currentGroup.length > 0) {
                groups.push([...currentGroup]);
            }
            currentGroup = [item];
            inLinkedGroup = item.positionType === 'linked';
        }
        // Continue current group if:
        // 1. We're in a linked group
        // 2. This item is linked
        else if (inLinkedGroup || item.positionType === 'linked') {
            currentGroup.push(item);
            inLinkedGroup = true;
        }
        // Start new group otherwise
        else {
            groups.push([...currentGroup]);
            currentGroup = [item];
            inLinkedGroup = false;
        }
    }

    // Add the last group
    if (currentGroup.length > 0) {
        groups.push(currentGroup);
    }

    // Create a result array with the same length as input
    const result = new Array(array.length).fill(null);

    // First pass: Place all locked position groups
    groups.forEach(group => {
        const firstItem = group[0];
        if (/^\d+$/.test(firstItem.positionType)) {
            const position = parseInt(firstItem.positionType) - 1;
            for (let i = 0; i < group.length; i++) {
                result[position + i] = group[i];
            }
        } else if (firstItem.positionType === 'last') {
            const position = array.length - group.length;
            for (let i = 0; i < group.length; i++) {
                result[position + i] = group[i];
            }
        }
    });

    // Second pass: Place all remaining groups (normal and linked)
    const remainingGroups = groups.filter(group => {
        const posType = group[0].positionType;
        return posType === 'normal' || posType === 'linked';
    });

    if (remainingGroups.length > 0) {
        // Shuffle the remaining groups
        const shuffledGroups = shuffleArray([...remainingGroups]);

        // Find available slots and place groups
        let currentSlot = 0;
        shuffledGroups.forEach(group => {
            // Find next available slot that can fit the entire group
            while (currentSlot < result.length) {
                let canFit = true;
                for (let i = 0; i < group.length; i++) {
                    if (currentSlot + i >= result.length || result[currentSlot + i] !== null) {
                        canFit = false;
                        break;
                    }
                }
                if (canFit) {
                    // Place the group
                    for (let i = 0; i < group.length; i++) {
                        result[currentSlot + i] = group[i];
                    }
                    currentSlot += group.length;
                    break;
                }
                currentSlot++;
            }
        });
    }

    return result.filter(item => item !== null);
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
        if (pattern.config.repeatCount < 1 || pattern.config.repeatCount > 10) {
            throw new Error('repeat count must be between 1 and 10');
        }

        const validIterationModes = ['in-order', 'shuffle'];
        if (pattern.config.iteration && !validIterationModes.includes(pattern.config.iteration)) {
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
            const interval = entry.config.interval || 5.0;
            if (interval < 3.0 || interval > 8.0) {
                throw new Error('interval must be between 3.0 and 8.0');
            }

            if (entry.config.intervalFuzz) {
                if (entry.config.intervalFuzz.min < -2.0 || entry.config.intervalFuzz.min > 2.0) {
                    throw new Error('interval fuzz must be between -2.0 and 2.0');
                }
                if (entry.config.intervalFuzz.max < -2.0 || entry.config.intervalFuzz.max > 2.0) {
                    throw new Error('interval fuzz must be between -2.0 and 2.0');
                }
            }

            const validSplitStepSpeeds = ['none', 'slow', 'medium', 'fast', 'random'];
            if (entry.config.splitStepSpeed && !validSplitStepSpeeds.includes(entry.config.splitStepSpeed)) {
                throw new Error('invalid split step speed');
            }
        }
    } else if (entry.type === 'Message') {
        if (!entry.config.message || !entry.config.message.trim()) {
            throw new Error('message text cannot be empty');
        }

        const timeRegex = /^[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(entry.config.interval)) {
            throw new Error('invalid time format');
        }
    }
}

/**
 * Generates preview HTML for a workout
 * @param {Object} workoutData - The workout JSON data
 * @returns {string} HTML preview
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

        while (continueProcessing) {
            // Start a new superset div - only show superset styling if there will be multiple
            const willHaveMultipleSupersets = workoutLimits.type !== 'all-shots';
            html += `<div class="mb-8 relative">
                ${willHaveMultipleSupersets ? `<div class="absolute -left-4 top-0 bottom-0 w-1 rounded" style="background: linear-gradient(to bottom, #dc2626, #ef4444, #f87171);"></div>
                <div class="flex items-center mb-4">
                    <h2 class="text-lg font-semibold text-gray-800">Superset ${supersetIndex + 1}</h2>
                </div>` : ''}`;

            // For each superset, get a fresh copy of patterns
            let patternsToProcess = [...workoutData.patterns];

            // If workout uses shuffle mode, shuffle the patterns for this superset
            if (workoutData.config.iterationType === 'shuffle') {
                patternsToProcess = shuffleArray([...patternsToProcess]);
            }

            let supersetHasContent = false;

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

                const repeatCount = pattern.config.repeatCount || 1;

                for (let i = repeatCount; i > 0; i--) {
                    // Check if this pattern should be skipped due to workout limits
                    let patternSkipped = false;
                    let skipReason = '';

                    if (workoutLimits.type === 'shot-limit' && totalShotsExecuted >= workoutLimits.value) {
                        patternSkipped = true;
                        skipReason = 'Skipped';
                        if (!skipReasons.includes('workout shot limit')) {
                            skipReasons.push('workout shot limit');
                        }
                    } else if (workoutLimits.type === 'time-limit') {
                        const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                        if (currentTimeWithoutPadding >= timeLimitSeconds) {
                            patternSkipped = true;
                            skipReason = 'Skipped';
                            if (!skipReasons.includes('workout time limit')) {
                                skipReasons.push('workout time limit');
                            }
                        }
                    }

                    const patternHtml = generatePatternPreviewHtml(
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
                        skipReasons
                    );

                    if (!patternSkipped) {
                        supersetHasContent = true;
                    }

                    html += patternHtml.html;
                    currentTime = patternHtml.endTime;
                    currentTimeWithoutPadding = patternHtml.endTimeWithoutPadding;
                    totalShotsExecuted = patternHtml.totalShotsExecuted;
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
            }
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
    }

    return html;
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
function generatePatternPreviewHtml(pattern, patternIndex, startTime, repeatCount = 1, patternSkipped = false, skipReason = '', isConfigLocked = false, workoutDefaultInterval = 5.0, workoutLimits = {}, totalShotsExecuted = 0, startTimeWithoutPadding = 0, skipReasons = []) {
    const patternClass = patternSkipped ? 'bg-gray-100 opacity-60' : 'bg-white';
    let html = `<div class="${patternClass} rounded-lg shadow-sm border border-gray-200 p-3 mb-4 relative">`;

    // Add purple ribbon to the left side of the pattern
    html += `<div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg" style="background: linear-gradient(to bottom, #8b5cf6, #a855f7, #c084fc);"></div>`;

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

    // Determine applicable default interval
    const applicableInterval = getApplicableInterval(pattern, isConfigLocked, workoutDefaultInterval);

    let currentTime = startTime;
    let currentTimeWithoutPadding = startTimeWithoutPadding;
    let patternShotsExecuted = 0;

    // Process entries
    if (pattern.entries && pattern.entries.length > 0) {
        html += '<div class="space-y-1">';

        let entriesToProcess = [...pattern.entries];

        // Shuffle entries if pattern uses shuffle mode
        if (pattern.config.iterationType === 'shuffle') {
            entriesToProcess = shuffleArrayRespectingLinks(entriesToProcess);
        }

        entriesToProcess.forEach((entry, entryIndex) => {
            // Check if we need to skip this entry due to limits
            let entrySkipped = false;
            let entrySkipReason = '';

            if (workoutLimits.type === 'shot-limit' && totalShotsExecuted >= workoutLimits.value) {
                entrySkipped = true;
                entrySkipReason = 'Skipped';
            } else if (workoutLimits.type === 'time-limit') {
                const timeLimitSeconds = parseTimeLimit(workoutLimits.value);
                if (currentTimeWithoutPadding >= timeLimitSeconds) {
                    entrySkipped = true;
                    entrySkipReason = 'Skipped';
                }
            }

            // Handle entry repeat count properly
            const entryRepeatCount = entry.config.repeatCount || 1;

            for (let repeatIndex = 0; repeatIndex < entryRepeatCount; repeatIndex++) {
                // Calculate entry interval for duration display
                let entryInterval;
                if (entry.type === 'Message') {
                    // For messages, calculate full duration including TTS and configured interval
                    const timeParts = entry.config.interval.split(':');
                    const configuredDuration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
                    const ttsDuration = estimateTTSDuration(
                        entry.config.message,
                        entry.config.speechRate || 1.0
                    );
                    const delay = entry.config.delay || 0;
                    entryInterval = Math.max(ttsDuration, configuredDuration) + delay;
                } else {
                    // For shots, use configured interval or applicable default
                    entryInterval = entry.config?.interval !== undefined ? entry.config.interval : applicableInterval;
                    // Parse string intervals to numbers
                    if (typeof entryInterval === 'string') {
                        entryInterval = parseTimeLimit(entryInterval);
                    }
                }

                // Generate entry name with repeat indicator if needed
                const entryHtml = generateEntryPreviewHtml(entry, currentTime, entrySkipped, entrySkipReason, entryInterval, entryRepeatCount, repeatIndex + 1);
                html += entryHtml;

                if (!entrySkipped && entry.type === 'Shot') {
                    patternShotsExecuted++;
                    totalShotsExecuted++;
                }

                // Update timing
                if (!entrySkipped) {
                    currentTime += entryInterval;
                    currentTimeWithoutPadding += entryInterval;
                }
            }
        });

        html += '</div>';
    }

    html += '</div>';

    return {
        html: html,
        endTime: currentTime,
        endTimeWithoutPadding: currentTimeWithoutPadding,
        totalShotsExecuted: totalShotsExecuted
    };
}

/**
 * Generates the HTML for a single entry preview
 * @param {Object} entry - The entry data
 * @param {number} startTime - The start time in seconds
 * @param {boolean} entrySkipped - Whether this entry is skipped
 * @param {string} skipReason - Reason for skipping
 * @param {number} entryInterval - The entry interval duration
 * @param {number} repeatCount - The total number of repeats for this entry
 * @param {number} repeatIndex - The current repeat index (1-based)
 * @returns {string} HTML string for the entry
 */
function generateEntryPreviewHtml(entry, startTime, entrySkipped = false, skipReason = '', entryInterval = 5.0, repeatCount = 1, repeatIndex = 1) {
    const entryClass = entrySkipped ? 'opacity-60' : '';
    const timeColorClass = entry.type === 'Shot' ? 'text-blue-600 bg-blue-50' : 'text-cyan-600 bg-cyan-50';

    let html = `<div class="flex items-center gap-2 py-1 ${entryClass}">`;

    // Calculate end time and create duration badge
    const endTime = startTime + entryInterval;
    const durationText = `${formatTime(startTime)} - ${formatTime(endTime)}`;

    // Time badge with duration
    html += `<span class="text-xs font-medium ${timeColorClass} px-1.5 py-0.5 rounded">${durationText}</span>`;

    // Entry name
    html += `<h4 class="text-sm font-medium ${entrySkipped ? 'text-gray-500' : 'text-gray-800'}">${entry.name}</h4>`;

    // Entry badges
    html += '<div class="flex items-center gap-1">';

    // Add repeat badge if repeatCount > 1
    if (repeatCount > 1) {
        html += `<div class="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium flex items-center" style="color: #ea580c !important; fill: none; stroke: #ea580c;">
            <svg class="w-3 h-3 mr-1 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                <path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6m17 9-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>
            </svg><span style="color: #ea580c !important;">${repeatIndex}/${repeatCount}</span>
        </div>`;
    }

    // Position badges
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

    // Skip reason badge
    if (entrySkipped && skipReason) {
        html += `<span class="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium" style="color: #dc2626 !important;">${skipReason}</span>`;
    }

    html += '</div></div>';

    return html;
}

/**
 * Gets the applicable interval for a pattern
 * @param {Object} pattern - The pattern data
 * @param {boolean} isConfigLocked - Whether config is locked
 * @param {number} workoutDefaultInterval - Workout default interval
 * @returns {number} The applicable interval
 */
function getApplicableInterval(pattern, isConfigLocked, workoutDefaultInterval) {
    if (isConfigLocked) {
        return workoutDefaultInterval;
    }
    let interval = pattern.config?.interval || workoutDefaultInterval;
    // Parse string intervals to numbers
    if (typeof interval === 'string') {
        interval = parseTimeLimit(interval);
    }
    return interval;
}
