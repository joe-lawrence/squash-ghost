// Squash Ghosting Workout Generator
class WorkoutGenerator {
    constructor() {
        this.entries = [];
        this.entryCounter = 0;
        this.voices = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadVoices();
        this.updateNoEntriesVisibility();
    }

    bindEvents() {
        document.getElementById('addMessageBtn').addEventListener('click', () => this.addEntry('message'));
        document.getElementById('addShotBtn').addEventListener('click', () => this.addEntry('shot'));
        document.getElementById('exportBtn').addEventListener('click', () => this.exportJSON());
    }

    loadVoices() {
        const updateVoices = () => {
            this.voices = speechSynthesis.getVoices();
        };
        
        updateVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = updateVoices;
        }
    }

    addEntry(type, data = null) {
        const entry = {
            id: ++this.entryCounter,
            type: type,
            name: data?.name || `${type === 'message' ? 'Intro message' : 'Shot-name-' + this.entryCounter}`,
            order: this.getNextOrderType(),
            collapsed: true,
            chained: data?.chained || false,
            ...(type === 'message' ? this.getDefaultMessageData(data) : this.getDefaultShotData(data))
        };

        this.entries.push(entry);
        this.renderEntry(entry);
        this.updateNoEntriesVisibility();
        this.updateOrderNumbers();
    }

    getDefaultMessageData(data) {
        return {
            message: data?.message || '',
            restInterval: data?.restInterval || 15,
            skipIfEnd: data?.skipIfEnd || false,
            narrator: data?.narrator || (this.voices[0]?.name || ''),
            speechRate: data?.speechRate || 1.0
        };
    }

    getDefaultShotData(data) {
        return {
            repeatCount: data?.repeatCount || 1,
            intervalFuzz: data?.intervalFuzz || 0,
            fuzzType: data?.fuzzType || 'fixed',
            autoSplitStep: data?.autoSplitStep || false,
            splitStepSpeed: data?.splitStepSpeed || 'none',
            splitStepType: data?.splitStepType || 'fixed',
            narrator: data?.narrator || (this.voices[0]?.name || ''),
            speechRate: data?.speechRate || 1.0
        };
    }

    getNextOrderType() {
        if (this.entries.length === 0) return 'pin';
        return 'number';
    }

    renderEntry(entry) {
        const container = document.getElementById('entriesContainer');
        const entryElement = this.createEntryElement(entry);
        container.appendChild(entryElement);
    }

    createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'bg-white rounded-lg shadow-md border';
        div.dataset.entryId = entry.id;

        const orderIcon = this.getOrderIcon(entry.order, this.entries.indexOf(entry) + 1);
        const chainClass = entry.chained ? 'border-t-0 rounded-t-none' : '';
        
        div.className += ` ${chainClass}`;
        
        div.innerHTML = `
            <div class="border-b border-gray-200 p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <button class="order-btn text-lg hover:bg-gray-100 p-1 rounded" data-entry-id="${entry.id}">
                            ${orderIcon}
                        </button>
                        <input type="text" value="${entry.name}" 
                               class="entry-name font-medium text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
                               data-entry-id="${entry.id}">
                    </div>
                    <button class="collapse-btn text-gray-500 hover:text-gray-700" data-entry-id="${entry.id}">
                        <span class="transform transition-transform ${entry.collapsed ? '' : 'rotate-180'}">▼</span>
                    </button>
                </div>
            </div>
            
            <div class="entry-content ${entry.collapsed ? 'hidden' : ''}" data-entry-id="${entry.id}">
                ${this.createEntryContent(entry)}
            </div>
        `;

        this.bindEntryEvents(div, entry);
        return div;
    }

    createEntryContent(entry) {
        return `
            <div class="p-4">
                <!-- Entry Type Tabs -->
                <div class="flex items-center justify-between mb-4">
                    <div class="flex border-b">
                        <button class="tab-btn px-4 py-2 ${entry.type === 'message' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}" 
                                data-entry-id="${entry.id}" data-type="message">
                            ${entry.type === 'message' ? '*Msg*' : 'Msg'}
                        </button>
                        <button class="tab-btn px-4 py-2 ${entry.type === 'shot' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}" 
                                data-entry-id="${entry.id}" data-type="shot">
                            ${entry.type === 'shot' ? '*Shot*' : 'Shot'}
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm" data-entry-id="${entry.id}">
                            delete
                        </button>
                        <button class="clone-btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" data-entry-id="${entry.id}">
                            clone
                        </button>
                        <button class="up-btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" data-entry-id="${entry.id}">
                            up
                        </button>
                        <button class="down-btn bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm" data-entry-id="${entry.id}">
                            down
                        </button>
                    </div>
                </div>

                <!-- Entry Settings -->
                ${entry.type === 'message' ? this.createMessageSettings(entry) : this.createShotSettings(entry)}
            </div>
        `;
    }

    createMessageSettings(entry) {
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Message:</label>
                    <input type="text" value="${entry.message}" 
                           class="message-input w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           data-entry-id="${entry.id}">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Rest Interval</label>
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-500">0:15s</span>
                        <input type="range" min="15" max="300" value="${entry.restInterval}" 
                               class="rest-interval-slider flex-1 slider-thumb" 
                               data-entry-id="${entry.id}">
                        <span class="text-sm text-gray-500">5:00m</span>
                    </div>
                    <div class="text-center text-sm text-gray-600 mt-1">
                        <span class="rest-interval-value">${this.formatTime(entry.restInterval)}</span>
                    </div>
                </div>

                <div>
                    <label class="flex items-center">
                        <input type="checkbox" ${entry.skipIfEnd ? 'checked' : ''} 
                               class="skip-if-end-checkbox mr-2" data-entry-id="${entry.id}">
                        <span class="text-sm text-gray-700">Skip if end of workout</span>
                    </label>
                </div>

                ${this.createAdvancedSettings(entry, 'message')}
            </div>
        `;
    }

    createShotSettings(entry) {
        return `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Repeat count</label>
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-500">1x</span>
                        <input type="range" min="1" max="10" value="${entry.repeatCount}" 
                               class="repeat-count-slider flex-1 slider-thumb" 
                               data-entry-id="${entry.id}">
                        <span class="text-sm text-gray-500">10x</span>
                    </div>
                    <div class="text-center text-sm text-gray-600 mt-1">
                        <span class="repeat-count-value">${entry.repeatCount}x</span>
                    </div>
                </div>

                ${this.createAdvancedSettings(entry, 'shot')}
            </div>
        `;
    }

    createAdvancedSettings(entry, type) {
        const isMessage = type === 'message';
        const advancedContent = isMessage ? '' : `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Interval fuzz</label>
                    <div class="flex items-center gap-4">
                        <span class="text-sm text-gray-500">0s</span>
                        <input type="range" min="0" max="0.5" step="0.1" value="${entry.intervalFuzz}" 
                               class="interval-fuzz-slider flex-1 slider-thumb" 
                               data-entry-id="${entry.id}">
                        <span class="text-sm text-gray-500">0.5s</span>
                    </div>
                    <div class="text-center text-sm text-gray-600 mt-1">
                        <span class="interval-fuzz-value">${entry.intervalFuzz}s</span>
                    </div>
                    <div class="flex gap-4 mt-2">
                        <label class="flex items-center">
                            <input type="radio" name="fuzz-type-${entry.id}" value="fixed" 
                                   ${entry.fuzzType === 'fixed' ? 'checked' : ''} 
                                   class="fuzz-type-radio mr-2" data-entry-id="${entry.id}">
                            <span class="text-sm">Fixed</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="fuzz-type-${entry.id}" value="random" 
                                   ${entry.fuzzType === 'random' ? 'checked' : ''} 
                                   class="fuzz-type-radio mr-2" data-entry-id="${entry.id}">
                            <span class="text-sm">Random</span>
                        </label>
                    </div>
                    <label class="flex items-center mt-2">
                        <input type="checkbox" ${entry.autoSplitStep ? 'checked' : ''} 
                               class="auto-split-step-checkbox mr-2" data-entry-id="${entry.id}">
                        <span class="text-sm">Auto split-step and narration</span>
                    </label>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Split-step speed</label>
                    <div class="flex gap-4">
                        <select class="split-step-speed-select p-2 border border-gray-300 rounded-md" data-entry-id="${entry.id}">
                            <option value="none" ${entry.splitStepSpeed === 'none' ? 'selected' : ''}>None</option>
                            <option value="slow" ${entry.splitStepSpeed === 'slow' ? 'selected' : ''}>Slow</option>
                            <option value="medium" ${entry.splitStepSpeed === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="fast" ${entry.splitStepSpeed === 'fast' ? 'selected' : ''}>Fast</option>
                        </select>
                    </div>
                    <div class="flex gap-4 mt-2">
                        <label class="flex items-center">
                            <input type="radio" name="split-step-type-${entry.id}" value="fixed" 
                                   ${entry.splitStepType === 'fixed' ? 'checked' : ''} 
                                   class="split-step-type-radio mr-2" data-entry-id="${entry.id}">
                            <span class="text-sm">Fixed</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="split-step-type-${entry.id}" value="random" 
                                   ${entry.splitStepType === 'random' ? 'checked' : ''} 
                                   class="split-step-type-radio mr-2" data-entry-id="${entry.id}">
                            <span class="text-sm">Random</span>
                        </label>
                    </div>
                </div>
            </div>
        `;

        return `
            <div class="border-t pt-4">
                <div class="flex justify-end mb-2">
                    <button class="advanced-toggle text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1" data-entry-id="${entry.id}">
                        Advanced 
                        <span class="transform transition-transform advanced-arrow">▼</span>
                    </button>
                </div>
                <div class="advanced-content hidden bg-gray-50 p-4 rounded-md" data-entry-id="${entry.id}">
                    ${advancedContent}
                    <div class="space-y-4 ${isMessage ? '' : 'border-t pt-4'}">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Narrator</label>
                            <select class="narrator-select w-full p-2 border border-gray-300 rounded-md" data-entry-id="${entry.id}">
                                ${this.voices.map(voice => 
                                    `<option value="${voice.name}" ${voice.name === entry.narrator ? 'selected' : ''}>${voice.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Speech rate</label>
                            <div class="flex items-center gap-4">
                                <span class="text-sm text-gray-500">0.5x</span>
                                <input type="range" min="0.5" max="1.5" step="0.1" value="${entry.speechRate}" 
                                       class="speech-rate-slider flex-1 slider-thumb" 
                                       data-entry-id="${entry.id}">
                                <span class="text-sm text-gray-500">1.5x</span>
                            </div>
                            <div class="text-center text-sm text-gray-600 mt-1">
                                <span class="speech-rate-value">${entry.speechRate}x</span>
                            </div>
                            <div class="text-center mt-2">
                                <button class="test-voice-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm" data-entry-id="${entry.id}">
                                    Test voice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEntryEvents(element, entry) {
        // Collapse toggle
        element.querySelector('.collapse-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.currentTarget.dataset.entryId);
            this.toggleCollapse(entryId);
        });

        // Entry name change
        element.querySelector('.entry-name').addEventListener('input', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            const entry = this.entries.find(e => e.id === entryId);
            if (entry) entry.name = e.target.value;
        });

        // Order button
        element.querySelector('.order-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            this.cycleOrderType(entryId);
        });

        // Tab buttons
        element.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const entryId = parseInt(e.target.dataset.entryId);
                const newType = e.target.dataset.type;
                this.changeEntryType(entryId, newType);
            });
        });

        // Toolbar buttons
        element.querySelector('.delete-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            this.deleteEntry(entryId);
        });

        element.querySelector('.clone-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            this.cloneEntry(entryId);
        });

        element.querySelector('.up-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            this.moveEntry(entryId, -1);
        });

        element.querySelector('.down-btn').addEventListener('click', (e) => {
            const entryId = parseInt(e.target.dataset.entryId);
            this.moveEntry(entryId, 1);
        });

        // Advanced toggle
        element.querySelector('.advanced-toggle').addEventListener('click', (e) => {
            const entryId = parseInt(e.currentTarget.dataset.entryId);
            this.toggleAdvanced(entryId);
        });

        // Form inputs
        this.bindFormInputs(element, entry);
    }

    bindFormInputs(element, entry) {
        const entryId = entry.id;

        // Message inputs
        const messageInput = element.querySelector('.message-input');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) entry.message = e.target.value;
            });
        }

        // Rest interval slider
        const restIntervalSlider = element.querySelector('.rest-interval-slider');
        if (restIntervalSlider) {
            restIntervalSlider.addEventListener('input', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) {
                    entry.restInterval = parseInt(e.target.value);
                    element.querySelector('.rest-interval-value').textContent = this.formatTime(entry.restInterval);
                }
            });
        }

        // Skip if end checkbox
        const skipIfEndCheckbox = element.querySelector('.skip-if-end-checkbox');
        if (skipIfEndCheckbox) {
            skipIfEndCheckbox.addEventListener('change', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) entry.skipIfEnd = e.target.checked;
            });
        }

        // Repeat count slider
        const repeatCountSlider = element.querySelector('.repeat-count-slider');
        if (repeatCountSlider) {
            repeatCountSlider.addEventListener('input', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) {
                    entry.repeatCount = parseInt(e.target.value);
                    element.querySelector('.repeat-count-value').textContent = entry.repeatCount + 'x';
                }
            });
        }

        // Advanced form inputs
        this.bindAdvancedInputs(element, entryId);
    }

    bindAdvancedInputs(element, entryId) {
        // Speech rate slider
        const speechRateSlider = element.querySelector('.speech-rate-slider');
        if (speechRateSlider) {
            speechRateSlider.addEventListener('input', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) {
                    entry.speechRate = parseFloat(e.target.value);
                    element.querySelector('.speech-rate-value').textContent = entry.speechRate + 'x';
                }
            });
        }

        // Narrator select
        const narratorSelect = element.querySelector('.narrator-select');
        if (narratorSelect) {
            narratorSelect.addEventListener('change', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) entry.narrator = e.target.value;
            });
        }

        // Test voice button
        const testVoiceBtn = element.querySelector('.test-voice-btn');
        if (testVoiceBtn) {
            testVoiceBtn.addEventListener('click', () => {
                this.testVoice(entryId);
            });
        }

        // Shot-specific inputs
        const intervalFuzzSlider = element.querySelector('.interval-fuzz-slider');
        if (intervalFuzzSlider) {
            intervalFuzzSlider.addEventListener('input', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) {
                    entry.intervalFuzz = parseFloat(e.target.value);
                    element.querySelector('.interval-fuzz-value').textContent = entry.intervalFuzz + 's';
                }
            });
        }

        // Radio buttons and other inputs
        element.querySelectorAll('.fuzz-type-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const entry = this.entries.find(e => e.id === entryId);
                    if (entry) entry.fuzzType = e.target.value;
                }
            });
        });

        element.querySelectorAll('.split-step-type-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const entry = this.entries.find(e => e.id === entryId);
                    if (entry) entry.splitStepType = e.target.value;
                }
            });
        });

        const autoSplitStepCheckbox = element.querySelector('.auto-split-step-checkbox');
        if (autoSplitStepCheckbox) {
            autoSplitStepCheckbox.addEventListener('change', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) entry.autoSplitStep = e.target.checked;
            });
        }

        const splitStepSpeedSelect = element.querySelector('.split-step-speed-select');
        if (splitStepSpeedSelect) {
            splitStepSpeedSelect.addEventListener('change', (e) => {
                const entry = this.entries.find(e => e.id === entryId);
                if (entry) entry.splitStepSpeed = e.target.value;
            });
        }
    }

    getOrderIcon(orderType, position) {
        switch (orderType) {
            case 'pin': return '📌';
            case 'dice': return '🎲';
            case 'chain': return '🔗';
            default: return position.toString();
        }
    }

    cycleOrderType(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        const types = ['pin', 'number', 'dice', 'chain'];
        const currentIndex = types.indexOf(entry.order);
        const nextIndex = (currentIndex + 1) % types.length;
        entry.order = types[nextIndex];

        // Update chained status
        entry.chained = entry.order === 'chain';

        this.rerenderEntries();
    }

    toggleCollapse(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            entry.collapsed = !entry.collapsed;
            const element = document.querySelector(`[data-entry-id="${entryId}"] .entry-content`);
            const arrow = document.querySelector(`[data-entry-id="${entryId}"] .collapse-btn span`);
            
            if (entry.collapsed) {
                element.classList.add('hidden');
                arrow.classList.remove('rotate-180');
            } else {
                element.classList.remove('hidden');
                arrow.classList.add('rotate-180');
            }
        }
    }

    toggleAdvanced(entryId) {
        const advancedContent = document.querySelector(`[data-entry-id="${entryId}"] .advanced-content`);
        const arrow = document.querySelector(`[data-entry-id="${entryId}"] .advanced-arrow`);
        
        if (advancedContent.classList.contains('hidden')) {
            advancedContent.classList.remove('hidden');
            arrow.classList.add('rotate-180');
        } else {
            advancedContent.classList.add('hidden');
            arrow.classList.remove('rotate-180');
        }
    }

    changeEntryType(entryId, newType) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry || entry.type === newType) return;

        // Preserve common properties and add type-specific defaults
        entry.type = newType;
        if (newType === 'message') {
            Object.assign(entry, this.getDefaultMessageData());
        } else {
            Object.assign(entry, this.getDefaultShotData());
        }

        this.rerenderEntry(entryId);
    }

    deleteEntry(entryId) {
        const index = this.entries.findIndex(e => e.id === entryId);
        if (index !== -1) {
            this.entries.splice(index, 1);
            document.querySelector(`[data-entry-id="${entryId}"]`).remove();
            this.updateNoEntriesVisibility();
            this.updateOrderNumbers();
        }
    }

    cloneEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry) {
            const clonedData = { ...entry };
            delete clonedData.id;
            clonedData.name += ' (copy)';
            this.addEntry(entry.type, clonedData);
        }
    }

    moveEntry(entryId, direction) {
        const index = this.entries.findIndex(e => e.id === entryId);
        if (index === -1) return;

        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.entries.length) return;

        // Swap entries
        [this.entries[index], this.entries[newIndex]] = [this.entries[newIndex], this.entries[index]];
        
        this.rerenderEntries();
        this.updateOrderNumbers();
    }

    testVoice(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        const text = entry.type === 'message' ? entry.message : entry.name;
        if (!text.trim()) return;

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.voices.find(v => v.name === entry.narrator);
        if (voice) utterance.voice = voice;
        utterance.rate = entry.speechRate;

        const startTime = Date.now();
        utterance.onend = () => {
            const duration = Date.now() - startTime;
            console.log(`Voice test completed in ${duration}ms`);
        };

        speechSynthesis.speak(utterance);
    }

    rerenderEntry(entryId) {
        const entry = this.entries.find(e => e.id === entryId);
        if (!entry) return;

        const oldElement = document.querySelector(`[data-entry-id="${entryId}"]`);
        const newElement = this.createEntryElement(entry);
        oldElement.replaceWith(newElement);
    }

    rerenderEntries() {
        const container = document.getElementById('entriesContainer');
        container.innerHTML = '';
        this.entries.forEach(entry => this.renderEntry(entry));
    }

    updateOrderNumbers() {
        this.entries.forEach((entry, index) => {
            if (entry.order === 'number') {
                const orderBtn = document.querySelector(`[data-entry-id="${entry.id}"] .order-btn`);
                if (orderBtn) {
                    orderBtn.textContent = (index + 1).toString();
                }
            }
        });
    }

    updateNoEntriesVisibility() {
        const noEntries = document.getElementById('noEntries');
        noEntries.style.display = this.entries.length === 0 ? 'block' : 'none';
    }

    formatTime(seconds) {
        if (seconds < 60) {
            return `0:${seconds.toString().padStart(2, '0')}s`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}m`;
        }
    }

    exportJSON() {
        const workout = {
            patterns: [{
                entries: this.entries.map(entry => ({
                    id: entry.id,
                    type: entry.type,
                    name: entry.name,
                    order: entry.order,
                    chained: entry.chained,
                    ...(entry.type === 'message' ? {
                        message: entry.message,
                        restInterval: entry.restInterval,
                        skipIfEnd: entry.skipIfEnd,
                        narrator: entry.narrator,
                        speechRate: entry.speechRate
                    } : {
                        repeatCount: entry.repeatCount,
                        intervalFuzz: entry.intervalFuzz,
                        fuzzType: entry.fuzzType,
                        autoSplitStep: entry.autoSplitStep,
                        splitStepSpeed: entry.splitStepSpeed,
                        splitStepType: entry.splitStepType,
                        narrator: entry.narrator,
                        speechRate: entry.speechRate
                    })
                }))
            }],
            metadata: {
                created: new Date().toISOString(),
                version: '1.0'
            }
        };

        const dataStr = JSON.stringify(workout, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'squash-workout.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new WorkoutGenerator();
}); 