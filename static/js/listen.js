// ================= ELEMENTS =================

const startBtn = document.getElementById("startBtn");
const playBtn = document.getElementById("playBtn");
const replayBtn = document.getElementById("replayBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");

const typingInput = document.getElementById("typingInput");

const textDisplay = document.getElementById("textDisplay");

const scoreEl = document.getElementById("score");
const accuracyEl = document.getElementById("accuracy");

const feedbackSection = document.getElementById("feedbackSection");
const feedbackContent = document.getElementById("feedbackContent");

const timerEl = document.getElementById("timer");

// ================= VARIABLES =================

let items = [];
let currentIndex = 0;
let currentText = "";

let correctAnswers = 0;
let totalAnswers = 0;

let replayTimes = 0;

let seconds = 0;
let timerInterval = null;

// ================= TIMER =================

function startTimer(){

    clearInterval(timerInterval);

    seconds = 0;

    timerInterval = setInterval(() => {

        seconds++;

        let mins = Math.floor(seconds / 60);
        let secs = seconds % 60;

        timerEl.innerText =
            `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    }, 1000);
}

// ================= LOAD VOICES =================

function loadVoices(){

    const voiceSelect = document.getElementById("voice");

    voiceSelect.innerHTML = "";

    const voices = speechSynthesis.getVoices();

    voices.forEach((voice, index) => {

        const option = document.createElement("option");

        option.value = index;
        option.textContent = voice.name;

        voiceSelect.appendChild(option);

    });

}

speechSynthesis.onvoiceschanged = loadVoices;

loadVoices();

// ================= START SESSION =================

startBtn.addEventListener("click", async () => {

    const difficulty = document.getElementById("difficulty").value;

    const itemType = document.getElementById("itemType").value;

    const batchSize = document.getElementById("batchSize").value;

    try {

        const response = await fetch(
            `/listen/api/batch?type=${itemType}&difficulty=${difficulty}&batch_size=${batchSize}`
        );

        const data = await response.json();

        items = data.items;

        currentIndex = 0;

        correctAnswers = 0;
        totalAnswers = 0;

        updateStats();

        startTimer();

        startItem();

    } catch(error){

        console.error(error);

        alert("Failed to load items from server");

    }

});

// ================= START ITEM =================

function startItem(){

    currentText = items[currentIndex];

    typingInput.disabled = false;

    submitBtn.disabled = false;

    playBtn.disabled = false;

    replayBtn.disabled = false;

    typingInput.value = "";

    typingInput.focus();

    textDisplay.classList.add("hidden");

    replayTimes = 0;

    speakText(currentText);

}

// ================= SPEAK =================

function speakText(text){

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = speechSynthesis.getVoices();

    const voiceIndex = document.getElementById("voice").value;

    utterance.voice = voices[voiceIndex];

    utterance.rate =
        parseFloat(document.getElementById("rate").value);

    utterance.pitch =
        parseFloat(document.getElementById("pitch").value);

    speechSynthesis.speak(utterance);

}

// ================= PLAY =================

playBtn.addEventListener("click", () => {

    speakText(currentText);

});

// ================= REPLAY =================

replayBtn.addEventListener("click", () => {

    replayTimes++;

    document.getElementById("replayCount").innerText =
        `(${replayTimes})`;

    speakText(currentText);

});

// ================= SUBMIT =================

submitBtn.addEventListener("click", () => {

    const answer = typingInput.value.trim();

    totalAnswers++;

    textDisplay.classList.remove("hidden");

    textDisplay.innerText = currentText;

    if(answer.toLowerCase() === currentText.toLowerCase()){

        correctAnswers++;

        feedbackContent.innerHTML =
            `<div style="color:green;">✅ Correct</div>`;

    } else {

        feedbackContent.innerHTML =
            `
            <div style="color:red;">
                ❌ Wrong<br><br>
                Correct Answer:<br>
                <strong>${currentText}</strong>
            </div>
            `;

    }

    feedbackSection.style.display = "block";

    updateStats();

    typingInput.disabled = true;

    submitBtn.disabled = true;

    nextBtn.style.display = "inline-block";

});

// ================= NEXT =================

nextBtn.addEventListener("click", () => {

    currentIndex++;

    feedbackSection.style.display = "none";

    nextBtn.style.display = "none";

    if(currentIndex >= items.length){

        endSession();

        return;
    }

    startItem();

});

// ================= UPDATE STATS =================

function updateStats(){

    scoreEl.innerText =
        `${correctAnswers} / ${totalAnswers}`;

    const accuracy =
        totalAnswers === 0
        ? 0
        : Math.round((correctAnswers / totalAnswers) * 100);

    accuracyEl.innerText = `${accuracy}%`;

}

// ================= END SESSION =================

function endSession(){

    clearInterval(timerInterval);

    alert(
        `Session Complete!\n\nScore: ${correctAnswers}/${totalAnswers}`
    );

}

// ================= RESET =================

document.getElementById("resetBtn")
.addEventListener("click", () => {

    location.reload();

});