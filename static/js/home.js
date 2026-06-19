/**
* Home Page Module
*/


    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });




// ==========================
// TYPING TEST FULL SCRIPT
// ==========================


// ==========================
// STATE
// ==========================

const state = {
    testActive: false,
    testPaused: false,

    startTime: null,

    currentIndex: 0,

    typedText: '',
    practiceText: '',

    mistakes: {},

    timerInterval: null,

    timeRemaining: 60
};


// ==========================
// ELEMENTS
// ==========================

const elements = {

    // Main
    startBtn: document.getElementById('startBtn'),
    typingZone: document.getElementById('typingZoneX'),
    typingInput: document.getElementById('typingInput'),

    practiceText: document.getElementById('practiceText'),

    timer: document.getElementById('timer'),

    // Stats
    wpmDisplay: document.getElementById('wpmDisplay'),
    accuracyDisplay: document.getElementById('accuracyDisplay'),
    errorsDisplay: document.getElementById('errorsDisplay'),
    charactersDisplay: document.getElementById('charactersDisplay'),

    // Popup
    popup: document.getElementById('loginPopupZ'),

    loginBtn: document.getElementById('loginBtnZ'),
    cancelBtn: document.getElementById('cancelBtnZ'),

    // Results
    resultsScreen: document.getElementById('results-screen'),

    finalWpm: document.getElementById('finalWpm'),
    finalAccuracy: document.getElementById('finalAccuracy'),
    finalErrors: document.getElementById('finalErrors'),
    finalCharacters: document.getElementById('finalCharacters'),

    weakKeysList: document.getElementById('weakKeysList'),

    closeResultsBtn: document.getElementById('closeResultsBtn')
};


// ==========================
// START APP
// ==========================

document.addEventListener('DOMContentLoaded', async () => {

    await loadPracticeText();

    setupEventListeners();

    updateTimerDisplay();

    // SHOW RESULTS AFTER LOGIN
    const fromTest = localStorage.getItem("fromTypingTest");

    if (fromTest === "true") {

        showSavedResults();

        localStorage.removeItem("fromTypingTest");

    }

});


// ==========================
// LOAD TEXT
// ==========================

async function loadPracticeText() {

    try {

        const response =
            await fetch('trainer/api/text?mode=normal');

        const data = await response.json();

        state.practiceText = data.text;

    } catch (error) {



        state.practiceText =
            "The quick brown fox jumps over the lazy dog every morning.
Learning to type faster requires practice and consistency.
Technology continues to change the way people communicate.
A good keyboard can improve comfort during long sessions.
Students often use computers for research and assignments.
Reading books helps expand vocabulary and critical thinking.
The internet connects billions of people around the world.
Programming is a valuable skill in the modern digital age.
Healthy habits contribute to both physical and mental wellness.
Small daily improvements can lead to significant results.
Artificial intelligence is transforming many industries today.
Cloud computing allows access to data from anywhere.
Time management is essential for achieving personal goals.
Curiosity encourages exploration and lifelong learning.
Exercise and proper nutrition support a strong body.
Many successful projects begin with a simple idea.
Creativity helps solve problems in unique and effective ways.
Teamwork often leads to better outcomes than working alone.
Persistence is the key to overcoming difficult challenges.";

    }

    renderPracticeText();

}


// ==========================
// RENDER TEXT
// ==========================

function renderPracticeText() {

    if (!elements.practiceText) return;

    elements.practiceText.innerHTML = '';

    state.practiceText.split('').forEach((char, index) => {

        const span = document.createElement('span');

        span.textContent = char;

        span.id = `char-${index}`;

        if (index === 0) {

            span.classList.add('current');

        }

        elements.practiceText.appendChild(span);

    });

}


// ==========================
// EVENTS
// ==========================

function setupEventListeners() {

    // START BUTTON
elements.startBtn.addEventListener("click", () => {

    document.getElementById(
        "typingOverlay"
    ).style.display = "flex";

    startTest();

});


// =
    // TYPING
    if (elements.typingInput) {

        elements.typingInput.addEventListener('input', handleTyping);

    }

    // LOGIN BUTTON
if (elements.loginBtn) {

    elements.loginBtn.addEventListener('click', () => {

        console.log("LOGIN CLICKED");

        localStorage.setItem(
            "fromTypingTest",
            "true"
        );

        console.log(
            localStorage.getItem("fromTypingTest")
        );

        window.location.href = "/auth/login";

    });

}


document.getElementById(
    "closeTypingBtn"
).addEventListener("click", () => {

    clearInterval(state.timerInterval);

    document.getElementById(
        "typingOverlay"
    ).style.display = "none";

});

    }

    // CANCEL POPUP
    if (elements.cancelBtn) {

        elements.cancelBtn.addEventListener('click', () => {

            elements.popup.style.display = 'none';

        });

    }

    // CLOSE RESULTS
    if (elements.closeResultsBtn) {

        elements.closeResultsBtn.addEventListener('click', () => {

            elements.resultsScreen.style.display = 'none';

        });

    }


// START TEST
// ==========================

function startTest() {

    if (state.testActive) return;

    console.log("TEST STARTED");

    state.testActive = true;

    state.currentIndex = 0;

    state.typedText = '';

    state.mistakes = {};

    state.startTime = Date.now();

    state.timeRemaining = 60;

    // SHOW TYPING AREA
    if (elements.typingZone) {

        elements.typingZone.style.display = 'block';

    }

    // RESET INPUT
    if (elements.typingInput) {

        elements.typingInput.value = '';

        elements.typingInput.focus();

    }

    updateTimerDisplay();

    clearInterval(state.timerInterval);

    startTimer();

}


// ==========================
// TIMER
// ==========================

function startTimer() {

    state.timerInterval = setInterval(() => {

        state.timeRemaining--;

        updateTimerDisplay();

        console.log("TIME:", state.timeRemaining);

        // END TEST
        if (state.timeRemaining <= 0) {

            clearInterval(state.timerInterval);

            endTest();

        }

    }, 1000);

}


function updateTimerDisplay() {

    if (!elements.timer) return;

    elements.timer.textContent = state.timeRemaining;

}


// ==========================
// HANDLE TYPING
// ==========================

function handleTyping(e) {

    console.log("input detected");
    console.log(state.currentIndex);
    if (!state.testActive) return;

    const input = e.target.value;

    state.typedText = input;

    const currentChar =
        state.practiceText[state.currentIndex];

    const typedChar =
        input[state.currentIndex];

    // CORRECT
    if (typedChar === currentChar) {
    console.log("typed:", typedChar);
    console.log("expected:", currentChar);
        state.currentIndex++;
        console.log("correct");
        updateHighlighting();


    }

    // WRONG
    else if (typedChar !== undefined) {

        state.mistakes[currentChar] =
            (state.mistakes[currentChar] || 0) + 1;

    }

    updateStats();

}


// ==========================
// HIGHLIGHTING
// ==========================

function updateHighlighting() {

    state.practiceText.split('').forEach((char, index) => {

        const el =
            document.getElementById(`char-${index}`);

        if (!el) return;

        el.classList.remove('correct', 'current');

        if (index < state.currentIndex) {

            el.classList.add('correct');

        }

        else if (index === state.currentIndex) {

            el.classList.add('current');

        }

    });

}


// ==========================
// UPDATE STATS
// ==========================

function updateStats() {

    const seconds =
        (Date.now() - state.startTime) / 1000 || 1;

    const minutes = seconds / 60;

    // WPM
    const wpm =
        Math.round((state.currentIndex / 5) / minutes);

    if (elements.wpmDisplay) {

        elements.wpmDisplay.textContent = wpm || 0;

    }

    // ACCURACY
    let correct = 0;

    for (let i = 0; i < state.typedText.length; i++) {

        if (state.typedText[i] === state.practiceText[i]) {

            correct++;

        }

    }

    const accuracy =
        Math.round(
            (correct / Math.max(state.typedText.length, 1)) * 100
        );

    if (elements.accuracyDisplay) {

        elements.accuracyDisplay.textContent =
            accuracy + '%';

    }

    // ERRORS
    let errors = 0;

    for (let key in state.mistakes) {

        errors += state.mistakes[key];

    }

    if (elements.errorsDisplay) {

        elements.errorsDisplay.textContent = errors;

    }

    // CHARACTERS
    if (elements.charactersDisplay) {

        elements.charactersDisplay.textContent =
            state.currentIndex;

    }

}


// ==========================
// END TEST
// ==========================

function endTest() {

    console.log("TEST ENDED");

    state.testActive = false;

document.getElementById(
    "typingOverlay"
).style.display = "none";

elements.popup.style.display = "flex";
    // HIDE TYPING AREA
    if (elements.typingZone) {

        elements.typingZone.style.display = 'none';

    }

    // SAVE RESULTS
// Calculate values

const seconds =
    (Date.now() - state.startTime) / 1000 || 1;

const minutes = seconds / 60;

const wpm =
    Math.round((state.currentIndex / 5) / minutes);

let correct = 0;

for (let i = 0; i < state.typedText.length; i++) {

    if (state.typedText[i] === state.practiceText[i]) {

        correct++;

    }

}

const accuracy =
    Math.round(
        (correct / Math.max(state.typedText.length, 1)) * 100
    );

let errors = 0;

for (let key in state.mistakes) {

    errors += state.mistakes[key];

}

const characters = state.currentIndex;

// Save results

localStorage.setItem("savedWpm", wpm);
localStorage.setItem("savedAccuracy", accuracy + "%");
localStorage.setItem("savedErrors", errors);
localStorage.setItem("savedCharacters", characters);
    // SHOW LOGIN POPUP
    if (elements.popup) {

        elements.popup.style.display = 'flex';

    }

}


// ==========================
// SHOW RESULTS AFTER LOGIN
// ==========================

function showSavedResults() {

    console.log("SHOW RESULTS");

    if (elements.resultsScreen) {

        elements.resultsScreen.style.display = 'flex';

    }

    if (elements.finalWpm) {

        elements.finalWpm.textContent =
            localStorage.getItem("savedWpm") || "0";

    }

    if (elements.finalAccuracy) {

        elements.finalAccuracy.textContent =
            localStorage.getItem("savedAccuracy") || "0%";

    }

    if (elements.finalErrors) {

        elements.finalErrors.textContent =
            localStorage.getItem("savedErrors") || "0";

    }

    if (elements.finalCharacters) {

        elements.finalCharacters.textContent =
            localStorage.getItem("savedCharacters") || "0";

    }

}

document.addEventListener("keydown", e => {

    if (
        (e.ctrlKey && e.key === "c") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "s") ||
        (e.ctrlKey && e.key === "a")
    ) {
        e.preventDefault();
    }

});
