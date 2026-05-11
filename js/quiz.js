// https://developers.deezer.com/api
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
// https://corsproxy.io/docs/

let quizData = null;
let currentRound = 0;
let score = 0;
let timeLeft = 10;
let maxRounds = 5;
let timerInterval = null;
let selectedOptionId = null;
let countdownInterval = null;

const countdownSound = new Audio('../sounds/countdown.mp3');
countdownSound.volume = 0.5;

const quizAudio = new Audio();
quizAudio.volume = 0.5;

document.getElementById('score').innerHTML = score;
document.getElementById('ronde').innerHTML = currentRound + '/5';

// Start quiz

window.addEventListener('DOMContentLoaded', async () => {
    quizModal.style.display = 'flex';
});

const quizStartBtn = document.getElementById('quiz-start-btn');
const quizModal = document.getElementById('quiz-modal');

if (quizStartBtn) {
    quizStartBtn.addEventListener('click', async () => {
        document.querySelector('.quiz').classList.add('show-quiz');
        const genres = ['rock', 'dance', 'hiphop'];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];

        await fetchQuizData(randomGenre);

        quizModal.style.display = 'none';

        currentRound = 1;
        const question = await generateQuestion();
        loadUI(question);
        document.getElementById('ronde').innerHTML = currentRound + '/5';

        const firstCorrectId = quizData.releases[currentRound - 1].id;
        startCountdown(firstCorrectId);
    })
}

// Fetch data van Deezer API omdat Spotify API previews niet meer werken

async function fetchQuizData(query) {
    try {
        const proxy = 'https://corsproxy.io/?';
        const url = `https://api.deezer.com/search?q=${query}`;
        
        const response = await fetch(proxy + encodeURIComponent(url));

        if (response.status === 403) {
            console.warn(`Genre "${query}" gaf een 403. Andere genre proberen`);
            return await fetchQuizData(randomGenre);
        }

        const data = await response.json();

        quizData = {
            releases: data.data.map(item => ({
                id: item.id,
                artist: item.artist.name,
                songTitle: item.title,
                image: item.album.cover_big,
                preview_url: item.preview
            }))
        };
        
        maxRounds = Math.min(quizData.releases.length, maxRounds); 
    } catch (error) {
        console.error(error);
    }
}

async function nextRound() {
    currentRound++; 

    document.querySelector('.blurred-cover img').style.filter = 'blur(40px)';

    const question = await generateQuestion();
    loadUI(question);
    
    document.getElementById('ronde').innerHTML = currentRound + '/5';

    if (currentRound > 1) {
        startTimer(question.correct.id); 
    }
}

async function generateQuestion() {
    const currentSong = quizData.releases[currentRound - 1];

    const otherSongs = quizData.releases.filter(song => String(song.id) != currentSong.id);

    const shuffledOthers = shuffleAnswers([...otherSongs]);
    const randomWrong = shuffledOthers.slice(0, 3);

    const allOptions = shuffleAnswers([currentSong, ...randomWrong]);
  
    return {
        correct: currentSong,
        options: allOptions
    };
    
}

async function startTimer(correctId) {
    clearInterval(timerInterval);
    
    const currentTrack = quizData.releases[currentRound - 1];

    if (currentTrack.preview_url) {
        quizAudio.src = currentTrack.preview_url;
        quizAudio.play();
    }

    timeLeft = 10;

    document.getElementById('timer').innerHTML = timeLeft + ' seconden';

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerHTML = timeLeft + ' seconden';

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer(selectedOptionId, correctId);
        }
    }, 1000);
}

function shuffleAnswers(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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
        
        button.onclick = (e) => {
            optionButtons.forEach(btn => btn.classList.remove('selected-answer'));
            e.currentTarget.classList.add('selected-answer');
            selectedOptionId = option.id;
        }
    });

    document.querySelector('.blurred-cover img').src = question.correct.image;
}

function startCountdown(correctId) {
    let count = 3;
    const countdown = document.getElementById('countdown');
    const countdownContainer = document.getElementById('countdown-container');

    clearInterval(countdownInterval);

    countdownSound.currentTime = 0; 
    countdownSound.play();
    countdownContainer.style.display = 'flex'; 

    const updateCountdown = (text) => {
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

function checkAnswer(selectedId, correctId) {
    quizAudio.pause();
    quizAudio.currentTime = 0;

    const optionButtons = document.querySelectorAll('.quiz-option');

    document.querySelector('.blurred-cover img').style.filter = 'blur(0px)';

    optionButtons.forEach((button, index) => {
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
        optionButtons.forEach(btn => {
            btn.classList.remove('correct-answer', 'wrong-answer');
        });
        
        if (currentRound < maxRounds) {
            nextRound();
        } else {
            endQuiz();
        }
    }, 3000);
}

function endQuiz() {
    const modalTitle = document.getElementById('modal-title');
    const modalText = document.getElementById('modal-text');
    const quizQuitBtn = document.getElementById('quiz-start-btn');
    
    modalTitle.innerText = `Je score: ${score}/500`;
    
    if (score === 500) {
        modalText.innerHTML =  'Perfecte score!';
    } else if (score > 200) {
        modalText.innerHTML =  'Goed gedaan! ';
    } else {
        modalText.innerHTML = 'Nog even oefenen...';
    }
    
    quizQuitBtn.innerHTML = 'Speel Opnieuw';

    quizQuitBtn.onclick = () => {
        resetQuiz();
    };

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
    quizModal.style.display = 'none';

    startNewGame();
}

async function startNewGame() {
    await nextRound();
    
    const firstCorrectId = quizData.releases[currentRound - 1].id;
    startCountdown(firstCorrectId);
}
