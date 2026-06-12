/**
* Timer Module
* Handles timing functionality for typing tests
*/

let testStartTime = null;
let timerDisplay = null;

/**
* Start the test timer
*/
function startTimer() {
    testStartTime = Date.now();
    updateTimer();
}

/**
* Update the timer display
*/
function updateTimer() {
    if (!testStartTime) return;

    const elapsed = Math.floor((Date.now() - testStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    return {
        minutes,
        seconds,
        total: elapsed
    };
}

/**
* Format time as MM:SS
*/
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}


