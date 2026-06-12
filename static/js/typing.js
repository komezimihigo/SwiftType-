/**
* Typing Test Module
* Handles the typing test logic and real-time feedback
*/

let currentPracticeText = '';
let startTime = null;
let isTestActive = false;
let timerInterval = null;
let selectedMode = 'normal';

// DOM Elements
const typingInput = document.getElementById('typingInput');
const practiceTextEl = document.getElementById('practiceText');
const typedOutputEl = document.getElementById('typedOutput');
const resetBtn = document.getElementById('resetBtn');
const submitBtn = document.getElementById('submitBtn');
const wpmDisplay = document.getElementById('wpmDisplay');
const accuracyDisplay = document.getElementById('accuracyDisplay');
const errorsDisplay = document.getElementById('errorsDisplay');
const timeDisplay = document.getElementById('timeDisplay');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const modeButtons = document.querySelectorAll('.mode-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadPracticeText();

    typingInput.addEventListener('input', handleTyping);
    typingInput.addEventListener('focus', startTest);
    resetBtn.addEventListener('click', resetTest);
    submitBtn.addEventListener('click', submitResult);

    // Mode selector
    modeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            modeButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedMode = e.target.dataset.mode;
            resetTest();
            loadPracticeText();
        });
    });
});

/**
* Load practice text from server
*/
async function loadPracticeText() {
    try {
        const response = await fetch(`/api/practice-text?mode=${selectedMode}`);
        const data = await response.json();
        currentPracticeText = data.text;
        practiceTextEl.textContent = currentPracticeText;
        typedOutputEl.textContent = '';
    } catch (error) {
        console.error('Error loading practice text:', error);
        errorMessage.textContent = 'Failed to load practice text';
        errorMessage.style.display = 'block';
    }
}

/**
* Start the typing test
*/
function startTest() {
    if (!isTestActive && currentPracticeText) {
        isTestActive = true;
        startTime = Date.now();

        // Start timer
        timerInterval = setInterval(updateStats, 100);
        submitBtn.disabled = false;
    }
}

/**
* Handle typing input
*/
function handleTyping(e) {
    if (!isTestActive) {
        startTest();
    }

    const typedText = typingInput.value;

    // Update display
    updateTypedDisplay(typedText);

    // Update statistics
    updateStats();

    // Check if test is complete
    if (typedText.length >= currentPracticeText.length) {
        completeTest();
    }
}

/**
* Update the typed text display with color coding
*/
function updateTypedDisplay(typedText) {
    let display = '';

    for (let i = 0; i < typedText.length; i++) {
        const typedChar = typedText[i];
        const originalChar = currentPracticeText[i];

        if (typedChar === originalChar) {
            display += `<span class="correct">${escapeHtml(typedChar)}</span>`;
        } else {
            display += `<span class="incorrect">${escapeHtml(typedChar)}</span>`;
        }
    }

    typedOutputEl.innerHTML = display;
}

/**
* Update live statistics
*/
function updateStats() {
    if (!isTestActive || !startTime) return;

    const typedText = typingInput.value;
    const timeSeconds = (Date.now() - startTime) / 1000;

    // Calculate WPM
    const characters = typedText.length;
    const minutes = timeSeconds / 60;
    const rawWpm = minutes > 0 ? Math.round((characters / 5) / minutes) : 0;

    // Calculate accuracy
    let correctChars = 0;
    for (let i = 0; i < Math.min(typedText.length, currentPracticeText.length); i++) {
        if (typedText[i] === currentPracticeText[i]) {
            correctChars++;
        }
    }
    const accuracy = currentPracticeText.length > 0
        ? Math.round((correctChars / currentPracticeText.length) * 100)
        : 100;

    // Count errors
    let errors = 0;
    for (let i = 0; i < Math.min(typedText.length, currentPracticeText.length); i++) {
        if (typedText[i] !== currentPracticeText[i]) {
            errors++;
        }
    }
    errors += Math.max(0, typedText.length - currentPracticeText.length);

    // Calculate adjusted WPM
    const adjustedWpm = Math.max(0, rawWpm - Math.round(errors / minutes)) || 0;

    // Update display
    wpmDisplay.textContent = adjustedWpm;
    accuracyDisplay.textContent = accuracy + '%';
    errorsDisplay.textContent = errors;
    timeDisplay.textContent = Math.round(timeSeconds) + 's';
}

/**
* Complete the test
*/
function completeTest() {
    isTestActive = false;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    submitBtn.disabled = false;
}

/**
* Submit test result
*/
async function submitResult() {
    const typedText = typingInput.value;

    if (!typedText) {
        errorMessage.textContent = 'Please type something first';
        errorMessage.style.display = 'block';
        return;
    }

    const timeSeconds = (Date.now() - startTime) / 1000;

    try {
        const response = await fetch('/api/save-result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                typed_text: typedText,
                original_text: currentPracticeText,
                time_seconds: timeSeconds
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = data.result;
            successMessage.innerHTML = `
                <strong>Test Complete!</strong><br>
                WPM: ${result.wpm} | Accuracy: ${result.accuracy}% | Errors: ${result.errors}
            `;
            successMessage.style.display = 'block';

            // Reset after delay
            setTimeout(() => {
                resetTest();
            }, 2000);
        } else {
            errorMessage.textContent = 'Error saving result: ' + data.error;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error submitting result:', error);
        errorMessage.textContent = 'Error saving result';
        errorMessage.style.display = 'block';
    }
}

/**
* Reset the test
*/
function resetTest() {
    isTestActive = false;
    typingInput.value = '';
    typedOutputEl.innerHTML = '';
    startTime = null;
    submitBtn.disabled = true;
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    // Reset stats
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';
    errorsDisplay.textContent = '0';
    timeDisplay.textContent = '0s';

    typingInput.focus();
}

/**
* Escape HTML special characters
*/
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}


