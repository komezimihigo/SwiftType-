  // ==================== STATE MANAGEMENT ====================
        const state = {
            mode: 'normal', // normal, no-backspace, ai
            difficulty: 'easy', // easy(60), normal(50), hard(40)
            testActive: false,
            testPaused: false,
            startTime: null,
            currentIndex: 0,
            typedText: '',
            practiceText: '',
            mistakes: {}, // Track mistakes per letter
            combo: 0,
            timerInterval: null,
            timeRemaining: 60,
            fingerMapping: {},
            weakKeys: [],
        };

        // ==================== DOM ELEMENTS ====================
        const elements = {
            timer: document.getElementById('timer'),
            practiceText: document.getElementById('practiceText'),
            typingInput: document.getElementById('typingInput'),
            wpmDisplay: document.getElementById('wpmDisplay'),
            accuracyDisplay: document.getElementById('accuracyDisplay'),
            errorsDisplay: document.getElementById('errorsDisplay'),
            charactersDisplay: document.getElementById('charactersDisplay'),
            comboDisplay: document.getElementById('comboDisplay'),
            keyboard: document.getElementById('keyboard'),
            leftFingerName: document.getElementById('leftFingerName'),
            rightFingerName: document.getElementById('rightFingerName'),
            startBtn: document.getElementById('startBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            newTextBtn: document.getElementById('newTextBtn'),
            resultsScreen: document.getElementById('resultsScreen'),
            finalWpm: document.getElementById('finalWpm'),
            finalAccuracy: document.getElementById('finalAccuracy'),
            finalErrors: document.getElementById('finalErrors'),
            finalCharacters: document.getElementById('finalCharacters'),
            weakKeysList: document.getElementById('weakKeysList'),
            retryBtn: document.getElementById('retryBtn'),
            aiTrainBtn: document.getElementById('aiTrainBtn'),
        };

        // Keyboard layout
        const keyboardLayout = [

        ];

        // ==================== INITIALIZATION ====================
        document.addEventListener('DOMContentLoaded', async () => {
            await initializeApp();
        });

        async function initializeApp() {
            // Load finger mapping
            try {
                const response = await fetch('/api/finger-mapping');
                state.fingerMapping = await response.json();
            } catch (error) {
                console.error('Error loading finger mapping:', error);
            }

            // Build keyboard
            buildKeyboard();

            // Load practice text
            await loadPracticeText();

            // Setup event listeners
            setupEventListeners();

            // Get weak keys from localStorage if available
            const savedWeakKeys = localStorage.getItem('weakKeys');
            if (savedWeakKeys) {
                state.weakKeys = JSON.parse(savedWeakKeys);
            }
        }

        // ==================== TEXT LOADING ====================
        async function loadPracticeText() {
            try {
                const params = new URLSearchParams();
                params.append('mode', state.mode);

                if (state.mode === 'ai' && state.weakKeys.length > 0) {
                    params.append('weak_keys', JSON.stringify(state.weakKeys.slice(0, 3)));
                }

                const response = await fetch(`/api/text?${params}`);
                const data = await response.json();
                state.practiceText = data.text;
                renderPracticeText();
            } catch (error) {
                console.error('Error loading text:', error);
                state.practiceText = 'Failed to load text. Please try againghhhh.','jhgghj';
                renderPracticeText();
            }
        }



        // ==================== KEYBOARD BUILDING ====================
        function buildKeyboard() {
            elements.keyboard.innerHTML = '';

            keyboardLayout.forEach(row => {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'keyboard-row';

                row.forEach(key => {
                    const keyDiv = document.createElement('div');
                    keyDiv.className = 'key';
                    keyDiv.textContent = key === ' ' ? '⎵' : key.toUpperCase();
                    keyDiv.id = `key-${key}`;
                    rowDiv.appendChild(keyDiv);
                });

                elements.keyboard.appendChild(rowDiv);
            });
        }

        // ==================== TEXT RENDERING ====================
        function renderPracticeText() {
            elements.practiceText.innerHTML = '';

            state.practiceText.split('').forEach((char, index) => {
                const span = document.createElement('span');
                span.className = 'practice-text char';
                span.textContent = char;
                span.id = `char-${index}`;

                if (index < state.currentIndex) {
                    span.classList.add('correct');
                } else if (index === state.currentIndex) {
                    span.classList.add('current');
                } else {
                    span.classList.add('pending');
                }

                elements.practiceText.appendChild(span);
            });
        }

        // ==================== EVENT LISTENERS ====================
        function setupEventListeners() {
            // Mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    state.mode = e.target.dataset.mode;
                    reset();
                    loadPracticeText();
                });
            });

            // Difficulty buttons
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    state.difficulty = e.target.dataset.difficulty;

                    const difficultyMap = { easy: 60, normal: 50, hard: 40 };
                    state.timeRemaining = difficultyMap[state.difficulty];
                    updateTimerDisplay();

                    reset();
                });
            });

            // Typing input
            elements.typingInput.addEventListener('input', (e) => {
                if (!state.testActive) return;

                const input = e.target.value;
                handleTypingInput(input);
            });

            // Prevent backspace if needed
            elements.typingInput.addEventListener('keydown', (e) => {
                if (state.mode === 'no-backspace' && e.key === 'Backspace') {
                    e.preventDefault();
                }
            });

            // Focus on input when test starts
            elements.typingInput.addEventListener('focus', () => {
                if (!state.testActive && state.practiceText) {
                    startTest();
                }
            });

            // Buttons
            elements.startBtn.addEventListener('click', startTest);
            elements.pauseBtn.addEventListener('click', togglePause);
            elements.resetBtn.addEventListener('click', reset);
            elements.newTextBtn.addEventListener('click', async () => {
                await loadPracticeText();
                reset();
            });
            elements.retryBtn.addEventListener('click', () => {
                elements.resultsScreen.classList.remove('show');
                reset();
                startTest();
            });
            elements.aiTrainBtn.addEventListener('click', () => {
                elements.resultsScreen.classList.remove('show');
                state.mode = 'ai';
                document.querySelectorAll('.mode-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.mode === 'ai') btn.classList.add('active');
                });
                reset();
                loadPracticeText();
            });
        }

        // ==================== TEST CONTROL ====================
        function startTest() {
            if (state.testActive) return;

            state.testActive = true;
            state.testPaused = false;
            state.startTime = Date.now();
            state.currentIndex = 0;
            state.typedText = '';
            state.combo = 0;
            state.mistakes = {};

            const difficultyMap = { easy: 60, normal: 50, hard: 40 };
            state.timeRemaining = difficultyMap[state.difficulty];

            elements.typingInput.focus();
            elements.startBtn.disabled = true;
            elements.pauseBtn.disabled = false;

            startTimer();
            renderPracticeText();
        }

        function togglePause() {
            state.testPaused = !state.testPaused;

            if (state.testPaused) {
                clearInterval(state.timerInterval);
                elements.pauseBtn.textContent = 'Resume';
            } else {
                startTimer();
                elements.pauseBtn.textContent = 'Pause';
            }
        }

        function reset() {
            state.testActive = false;
            state.testPaused = false;
            state.currentIndex = 0;
            state.typedText = '';
            state.combo = 0;
            state.mistakes = {};

            clearInterval(state.timerInterval);

            elements.typingInput.value = '';
            elements.typingInput.disabled = false;
            elements.startBtn.disabled = false;
            elements.pauseBtn.disabled = true;
            elements.pauseBtn.textContent = 'Pause';

            const difficultyMap = { easy: 60, normal: 50, hard: 40 };
            state.timeRemaining = difficultyMap[state.difficulty];

            updateTimerDisplay();
            renderPracticeText();
            updateStats();
            clearKeyboardHighlight();
        }

        // ==================== TIMER ====================
        function startTimer() {
            state.timerInterval = setInterval(() => {
                if (state.testPaused) return;

                state.timeRemaining--;
                updateTimerDisplay();

                if (state.timeRemaining <= 0) {
                    endTest();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            elements.timer.textContent = state.timeRemaining;

            if (state.timeRemaining <= 10) {
                elements.timer.classList.add('danger');
            } else if (state.timeRemaining <= 20) {
                elements.timer.classList.add('warning');
                elements.timer.classList.remove('danger');
            } else {
                elements.timer.classList.remove('warning', 'danger');
            }
        }

        // ==================== TYPING INPUT HANDLING ====================
        function handleTypingInput(input) {
            state.typedText = input;

            let currentChar = state.practiceText[state.currentIndex];

            if (input[state.currentIndex] !== undefined) {
                const typedChar = input[state.currentIndex];

                if (typedChar === currentChar) {
                    // Correct character
                    state.currentIndex++;
                    state.combo++;
                    updateComboDisplay();
                } else {
                    // Incorrect character
                    state.combo = 0;
                    elements.comboDisplay.style.display = 'none';

                    // Track mistake
                    state.mistakes[currentChar] = (state.mistakes[currentChar] || 0) + 1;

                    // Shake effect
                    animateKeyError(currentChar);
                }
            }

            updateHighlighting();
            updateStats();
            updateKeyboardHighlight();
            updateHandsDisplay();
        }

        // ==================== VISUAL UPDATES ====================
        function updateHighlighting() {
            for (let i = 0; i < state.practiceText.length; i++) {
                const charEl = document.getElementById(`char-${i}`);
                if (!charEl) continue;

                charEl.classList.remove('correct', 'incorrect', 'current', 'pending');

                if (i < state.currentIndex) {
                    charEl.classList.add('correct');
                } else if (i === state.currentIndex) {
                    charEl.classList.add('current');
                    charEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else {
                    charEl.classList.add('pending');
                }
            }
        }

        function updateKeyboardHighlight() {
            clearKeyboardHighlight();

            if (state.currentIndex < state.practiceText.length) {
                const nextChar = state.practiceText[state.currentIndex];
                const keyEl = document.getElementById(`key-${nextChar}`);

                if (keyEl) {
                    const typedChar = state.typedText[state.currentIndex];

                    if (typedChar === undefined) {
                        keyEl.classList.add('current');
                    } else if (typedChar === nextChar) {
                        keyEl.classList.add('correct');
                    } else {
                        keyEl.classList.add('error');
                    }
                }
            }
        }

        function clearKeyboardHighlight() {
            document.querySelectorAll('.key').forEach(key => {
                key.classList.remove('current', 'error', 'correct');
            });
        }

        function updateHandsDisplay() {
            if (state.currentIndex < state.practiceText.length) {
                const nextChar = state.practiceText[state.currentIndex];
                const finger = state.fingerMapping[nextChar] || 'unknown';

                if (finger.includes('left')) {
                    elements.leftFingerName.textContent = formatFingerName(finger);
                    elements.rightFingerName.textContent = '—';
                } else if (finger.includes('right')) {
                    elements.rightFingerName.textContent = formatFingerName(finger);
                    elements.leftFingerName.textContent = '—';
                } else if (finger === 'thumbs') {
                    elements.leftFingerName.textContent = 'SPACE';
                    elements.rightFingerName.textContent = 'SPACE';
                } else {
                    elements.leftFingerName.textContent = '—';
                    elements.rightFingerName.textContent = '—';
                }
            }
        }

        function formatFingerName(finger) {
            const names = {
                'left_pinky': 'Pinky',
                'left_ring': 'Ring',
                'left_middle': 'Middle',
                'left_index': 'Index',
                'right_index': 'Index',
                'right_middle': 'Middle',
                'right_ring': 'Ring',
                'right_pinky': 'Pinky',
                'thumbs': 'Thumb',
            };
            return names[finger] || '—';
        }

        function updateComboDisplay() {
            if (state.combo > 5) {
                elements.comboDisplay.style.display = 'block';
                elements.comboDisplay.textContent = `🔥 ${state.combo} combo!`;
            }
        }

        function updateStats() {
            const timeSeconds = (Date.now() - state.startTime) / 1000 || 1;
            const timeMinutes = timeSeconds / 60;

            // WPM calculation
            const wpm = Math.round((state.currentIndex / 5) / timeMinutes);
            elements.wpmDisplay.textContent = wpm || 0;

            // Accuracy
            let correctChars = 0;
            for (let i = 0; i < Math.min(state.typedText.length, state.practiceText.length); i++) {
                if (state.typedText[i] === state.practiceText[i]) {
                    correctChars++;
                }
            }
            const accuracy = Math.round((correctChars / Math.max(state.currentIndex, 1)) * 100);
            elements.accuracyDisplay.textContent = accuracy + '%';

            // Errors
            let errors = 0;
            for (let char in state.mistakes) {
                errors += state.mistakes[char];
            }
            elements.errorsDisplay.textContent = errors;

            // Characters typed
            elements.charactersDisplay.textContent = state.currentIndex;
        }

        function animateKeyError(char) {
            const keyEl = document.getElementById(`key-${char}`);
            if (keyEl) {
                keyEl.classList.add('error');
                setTimeout(() => {
                    keyEl.classList.remove('error');
                }, 300);
            }
        }

        // ==================== TEST COMPLETION ====================
        function endTest() {
            clearInterval(state.timerInterval);
            state.testActive = false;

            const timeSeconds = (Date.now() - state.startTime) / 1000;
            const timeMinutes = timeSeconds / 60;

            const wpm = Math.round((state.currentIndex / 5) / timeMinutes);

            let correctChars = 0;
            for (let i = 0; i < Math.min(state.typedText.length, state.practiceText.length); i++) {
                if (state.typedText[i] === state.practiceText[i]) {
                    correctChars++;
                }
            }
            const accuracy = Math.round((correctChars / Math.max(state.currentIndex, 1)) * 100);

            let totalErrors = 0;
            for (let char in state.mistakes) {
                totalErrors += state.mistakes[char];
            }

            // Get weak keys
            const sortedMistakes = Object.entries(state.mistakes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            state.weakKeys = sortedMistakes.map(item => item[0]);
            localStorage.setItem('weakKeys', JSON.stringify(state.weakKeys));

            // Show results
            showResults(wpm, accuracy, totalErrors, state.currentIndex, sortedMistakes);
        }

        function showResults(wpm, accuracy, errors, characters, weakKeys) {
            elements.finalWpm.textContent = wpm;
            elements.finalAccuracy.textContent = accuracy + '%';
            elements.finalErrors.textContent = errors;
            elements.finalCharacters.textContent = characters;

            // Weak keys display
            elements.weakKeysList.innerHTML = '';
            weakKeys.forEach(([char, count]) => {
                const div = document.createElement('div');
                div.className = 'weak-key';
                div.textContent = `"${char}" (${count} errors)`;
                elements.weakKeysList.appendChild(div);
            });

            if (weakKeys.length === 0) {
                const div = document.createElement('div');
                div.style.color = 'var(--success)';
                div.textContent = '✨ Perfect! No weak keys detected.';
                elements.weakKeysList.appendChild(div);
            }

            elements.resultsScreen.classList.add('show');
        }
