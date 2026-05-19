// https://developers.deezer.com/api
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement

let quizData = null;
let currentRound = 0;
let score = 0;
let timeLeft = 10;
let maxRounds = 5;
let timerInterval = null;
let timerCircle = null;
let selectedOptionId = null;
let countdownInterval = null;

let tracks = [];

// Audio

const countdownSound = new Audio('../sounds/countdown.mp3');
const correctSound = new Audio('../sounds/correct-answer.mp3');
const wrongSound = new Audio('../sounds/wrong-answer.mp3');
const quizAudio = new Audio();

[countdownSound, correctSound, wrongSound, quizAudio].forEach(a => a.volume = 0.5);

// Fetch Quiz Data

async function fetchQuizData(selectedTracks) {
  try {
    const fetchPromises = selectedTracks.map(track => 
      fetch(`/api/quiz-data?query=${encodeURIComponent(track.artist + ' ' + track.title)}`)
      .then(res => res.json())
    );

    const results = await Promise.all(fetchPromises);
    
    const mappedReleases = results
      .map(data => data.data && data.data[0])
      .filter(item => item && item.preview)
      .map(item => ({
        id: item.id,
        artist: item.artist.name,
        songTitle: item.title,
        preview_url: item.preview
    }));

    quizData = {
      releases: shuffleAnswers(mappedReleases)
    };
  } catch (error) {
    console.error(error);
  }
} 

// Generate question

async function generateQuestion() {
  const currentSong = quizData.releases[currentRound - 1];
  const correctName = currentSong.artist;

  let optionsSet = new Set();
  optionsSet.add(correctName);

  const wrongAnswers = tracks.filter(track => 
    track.artist.toLowerCase() !== correctName.toLowerCase()
  );

  const shuffledWrong = shuffleAnswers([...wrongAnswers]);

  for (let track of shuffledWrong) {
    if (optionsSet.size < 4) {
      optionsSet.add(track.artist);
    } else {
      break;
    }
  }

  const finalOptions = Array.from(optionsSet).map(name => {
    const inCurrentReleases = quizData.releases.find(s => s.artist === name);
    return {
      id: inCurrentReleases ? inCurrentReleases.id : Math.random(), 
      artist: name
    };
  });

  return {
    correct: currentSong,
    options: shuffleAnswers(finalOptions)
  };
}

function shuffleAnswers(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// UI

function updateScoreUI() {
  const scoreEl = document.getElementById('score').innerHTML = score;
  const rondeEl = document.getElementById('ronde').innerHTML = currentRound + '/5';

  if (scoreEl) scoreEl.innerHTML = score;
  if (rondeEl) rondeEl.innerHTML = `${currentRound}/5`;
}

function loadUI(question) {
    const optionButtons = document.querySelectorAll('.quiz-option');
    selectedOptionId = null;

    optionButtons.forEach(btn => {
        btn.classList.remove('selected-answer', 'correct-answer', 'wrong-answer');
        btn.onclick = null;
        btn.style.display = 'flex';
    });

    question.options.forEach((option, index) => {
        const letter = String.fromCharCode(65 + index);
        const button = optionButtons[index];

        button.innerHTML = `<div>${letter}</div> ${option.artist}`;
        button.dataset.id = option.id;

        button.onclick = e => {
          optionButtons.forEach(btn => btn.classList.remove('selected-answer'));
          e.currentTarget.classList.add('selected-answer');
          selectedOptionId = option.id;
        };
    });
}

// Timer

async function startTimer(correctId) {
  clearInterval(timerInterval);

  const currentTrack = quizData.releases[currentRound - 1];
  timerCircle = document.querySelector('.timer-circle');

  if (currentTrack.preview_url) {
    quizAudio.src = currentTrack.preview_url;
    quizAudio.play();
  }

  const duration = 10000;
  const startTime = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = duration - elapsed;

    const percentage = Math.max((remaining / duration) * 100, 0);
    updateTimerVisual(percentage);

    if (remaining <= 0) {
      clearInterval(timerInterval);
      updateTimerVisual(0);
      timeLeft = 0;
      checkAnswer(selectedOptionId, correctId);
    }
  }, 30);
}

function updateTimerVisual(percentage) {
    timerCircle.style.background = `conic-gradient(#d4ff3f 0%, #d4ff3f ${percentage}%, #333 ${percentage}%)`;
}

// Countdown

function startCountdown(correctId) {
  let count = 3;
  const countdown = document.getElementById('countdown');
  const countdownContainer = document.getElementById('countdown-container');

  clearInterval(countdownInterval);

  countdownSound.currentTime = 0;
  countdownSound.play();
  countdownContainer.style.display = 'flex';

  function updateCountdown(text) {
    countdown.innerText = text;
    countdown.classList.remove('pulse-animation');
    void countdown.offsetWidth;
    countdown.classList.add('pulse-animation');
  }

  updateCountdown(count);

  countdownInterval = setInterval(() => {
    count--;

    if (count > 0) {
      countdown.style.fontSize = '100px';
      updateCountdown(count);
    } else if (count === 0) {
      countdown.style.fontSize = '80px';
      updateCountdown('GO');
    } else {
      clearInterval(countdownInterval);
      countdownContainer.style.display = 'none';
      countdown.classList.remove('pulse-animation');
      startTimer(correctId);
    }
  }, 1000);
}

// Check answer

function checkAnswer(selectedId, correctId) {
  if (selectedId === correctId) {
        correctSound.play();
    } else {
        wrongSound.play();
  }

  quizAudio.pause();
  quizAudio.currentTime = 0;
  clearInterval(timerInterval);

  const optionButtons = document.querySelectorAll('.quiz-option');

  optionButtons.forEach(button => {
    button.onclick = null;
    const buttonId = Number(button.dataset.id);

    if (buttonId == correctId) {
      button.classList.add('correct-answer');
    } 
    if (selectedId !== null && buttonId === selectedId && selectedId !== correctId) {
      button.classList.add('wrong-answer');
    }
  });

  if (selectedId === correctId) {
    score += 100;
    document.getElementById('score').innerHTML = score;
  }

  setTimeout(() => {
    optionButtons.forEach(btn => btn.classList.remove('correct-answer', 'wrong-answer'));

    if (currentRound < maxRounds) {
      nextRound();
    } else {
      endQuiz();
    }
  }, 3000);
}

// Rounds

async function nextRound() {
  currentRound++;

  const question = await generateQuestion();
  loadUI(question);
  document.getElementById('ronde').innerHTML = currentRound + '/5';

  if (currentRound > 1) {
    startTimer(question.correct.id);
  }
}

// Endgame & Reset

function endQuiz(finalScore) {
  const highScore = localStorage.getItem('quizHighScore') || 0;

  if (finalScore > parseInt(highScore)) {
        localStorage.setItem('quizHighScore', finalScore);
  }

  const quizRestartBtn = document.getElementById('quiz-restart-btn');

  const modalTitle = document.getElementById('modal-title');
  const modalText = document.getElementById('modal-text');

  modalTitle.innerText = `Je score: ${score}/500`;

  if (score === 500) {
    modalText.innerHTML = 'Perfecte score!';
  } else if (score > 200) {
    modalText.innerHTML = 'Goed gedaan!';
  } else {
    modalText.innerHTML = 'Nog even oefenen...';
  }

  quizRestartBtn.innerHTML = 'Speel Opnieuw';
  quizRestartBtn.onclick = () => resetQuiz();

  document.getElementById('quiz-modal').style.display = 'flex';
}

function resetQuiz() {
  clearInterval(timerInterval);
  clearInterval(countdownInterval);

  score = 0;
  currentRound = 0;
  timeLeft = 10;

  document.getElementById('score').innerHTML = score;
  document.getElementById('ronde').innerHTML = '0/5';
  document.getElementById('countdown-container').style.display = 'none';

  quizLobby.style.display = 'none';
  startNewGame();
}

// Event listeners 

function setupQuizListeners() {
  const quizStartBtn = document.getElementById('quiz-start-btn');
  const quizLobby = document.getElementById('quiz-lobby');
  const quizGame = document.getElementById('quiz-game');

  quizStartBtn.addEventListener('click', async () => {
    quizStartBtn.innerHTML = 'Laden...';
    quizStartBtn.disabled = true;

    try {
      const jsonResponse = await fetch('../json/tracks.json');
      const jsonData = await jsonResponse.json();
      tracks = jsonData.tracks;

      const shuffled = [...tracks].sort(() => 0.5 - Math.random());
      const selection = shuffled.slice(0, 10);
      await fetchQuizData(selection);

      quizLobby.style.display = 'none';
      document.getElementById('quiz-game').classList.add('show-quiz');

      currentRound = 1;
      const question = await generateQuestion();
      loadUI(question);
      
      document.getElementById('ronde').innerHTML = `${currentRound}/${quizData.releases.length}`;
      
      const firstCorrectId = quizData.releases[currentRound - 1].id;
      startCountdown(firstCorrectId);

    } catch (error){
      console.log('Fout bij het laden van de tracks:', error);
    }
  });
}

// Scoreboard

function updateScoreboard() {
    const highScore = localStorage.getItem('quizHighScore') || 0;
    const userName = localStorage.getItem('userName'); 

    const topPlayerContainer = document.querySelector('.player-score-container');
    
    if (topPlayerContainer) {
        topPlayerContainer.querySelector('.username').textContent = userName;
        topPlayerContainer.querySelector('.score p').textContent = `${highScore} pt`;
    }
}

async function startNewGame() {
  await nextRound();
  const firstCorrectId = quizData.releases[currentRound - 1].id;
  startCountdown(firstCorrectId);
}

// Init

export function initQuiz() {
  setupQuizListeners();
  updateScoreboard();
  updateScoreUI();
}

document.addEventListener('DOMContentLoaded', initQuiz);
