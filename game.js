window.onload = () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const tileSize = 40;
  const tiles = canvas.width / tileSize;
  
  let correctAnswers = 0;
  let snake = [], direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 }; // new: to buffer movement input
  let foodOptions = [], correctAnswer;
  let score = 0, totalAnswered = 0;
  let table = 2, speed = 300, interval;
  let totalTime = 0;
  let lastQuestionTime = 0;
  let currentM = 1;
  let startTime;
  let timerInterval;
  let lastFrameTime = 0; // ✅ used to throttle movement based on speed
  let gameRunning = false; // ✅ NEW: Track if the game is active


  const scoreEl = document.getElementById("score");
  const questionEl = document.getElementById("question");
  const startBtn = document.getElementById("startBtn");

  const startScreen = document.getElementById("startScreen");
  const gameScreen = document.getElementById("gameScreen");
  const endScreen = document.getElementById("endScreen");

  const finalScore = document.getElementById("finalScore");
  const finalAccuracy = document.getElementById("finalAccuracy");
  const feedbackEl = document.getElementById("feedback");

function getLang() {
  return localStorage.getItem('gameLang') || 'en';
}

function getMessage(key) {
  const messages = {
    correct: {
      en: "✅ Correct answer, Bravo!",
      zh: "✅ 答对了，太棒了！"
    },
    wrong: {
      en: "❌ Try Again!",
      zh: "❌ 再试一次！"
    },
    wall: {
      en: "❌ Wall hit!",
      zh: "❌ 撞墙了！"
    }
  };
  return messages[key][getLang()];
}

function startGame() {
    table = parseInt(document.getElementById("levelSelect").value);
    speed = parseInt(document.getElementById("speedSelect").value);

    snake = [{ x: 5, y: 5 }];
    direction = { x: 1, y: 0 };
    score = 0;
    totalAnswered = 0;
    correctAnswers = 0;
    totalTime = 0;

 
    startTime = Date.now();
    document.getElementById("timer").textContent = "Time Left: 60s";
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
   
    startScreen.style.display = "none";
    endScreen.style.display = "none";
    gameScreen.style.display = "block";
    
bgMusic.play().catch(() => {
  console.log("Autoplay failed. User interaction required.");
});

// Set button icon based on current mute state
muteBtn.textContent = bgMusic.muted ? "🔇" : "🔈";

   
    generateQuestion();
    updateScore();

gameRunning = true;
lastFrameTime = 0;
requestAnimationFrame(gameLoop);
  }

function generateQuestion() {
  // Generate a multiplication question within selected table
  currentM = Math.floor(Math.random() * 9) + 1;
  correctAnswer = currentM * table;
  questionEl.textContent = `${currentM} × ${table} = ?`;

  // Create a pool of all valid answers in the selected times table (1×table to 9×table)
  const validAnswers = Array.from({ length: 9 }, (_, i) => (i + 1) * table);

  // Ensure unique options with the correct answer
// Ensure 3 unique answer options including the correct one
const options = new Set();
options.add(correctAnswer);

let attempts = 0;
while (options.size < 3 && attempts < 100) {
  const distractor = validAnswers[Math.floor(Math.random() * validAnswers.length)];
  // Avoid adding the correct answer again or duplicates
  if (!options.has(distractor)) {
    options.add(distractor);
  }
  attempts++;
}


  // Assign answers randomly to tiles
// Assign answers to unique tile positions
const usedPositions = new Set();
foodOptions = [];

Array.from(options).forEach(val => {
  let x, y, key;
  let attempts = 0;
  do {
    x = Math.floor(Math.random() * tiles);
    y = Math.floor(Math.random() * tiles);
    key = `${x},${y}`;
    attempts++;
  } while (usedPositions.has(key) && attempts < 100);

  usedPositions.add(key);
  foodOptions.push({ value: val, x, y });
});

  lastQuestionTime = Date.now();
}

function gameLoop(currentTime) {
  if (!gameRunning) return; // ✅ skip logic if game ended
  requestAnimationFrame(gameLoop);

  if (currentTime - lastFrameTime < speed) return; // move only if enough time passed
  lastFrameTime = currentTime;

  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

  if (
    head.x < 0 || head.y < 0 ||
    head.x >= tiles || head.y >= tiles ||
    snake.some(s => s.x === head.x && s.y === head.y)
  ) {
    score -= 1;
    totalAnswered++;
    showFeedback(getMessage("wall", { q: currentM, t: table, a: correctAnswer }), "#ffffaa");
    if (Date.now() - startTime >= 60000) return endGame();

    snake = [{ x: 5, y: 5 }];
    direction = nextDirection = { x: 1, y: 0 };
    generateQuestion();
    return;
  }

  snake.unshift(head);

  const food = foodOptions.find(f => f.x === head.x && f.y === head.y);
  if (food) {
    totalAnswered++;
    const timeTaken = Date.now() - lastQuestionTime;
    totalTime += timeTaken;
    if (food.value === correctAnswer) {
      score += 10;
      correctAnswers++;
      showFeedback(getMessage("correct"), "#ffffaa");
    } else {
      score -= 1;
      showFeedback(getMessage("wrong", { q: currentM, t: table, a: correctAnswer }), "#ffffaa");
      snake.pop();
    }

    if (totalAnswered >= 20) return endGame();
    generateQuestion();
  } else {
    snake.pop();
  }

  draw();
}


  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let x = 0; x < tiles; x++) {
      for (let y = 0; y < tiles; y++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#a2d18e" : "#92c47a";
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    foodOptions.forEach(f => {
      ctx.fillStyle = "#ffbb33"; // same color for all options
      ctx.fillRect(f.x * tileSize, f.y * tileSize, tileSize, tileSize);
      ctx.fillStyle = "#000";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(f.value, f.x * tileSize + tileSize / 2, f.y * tileSize + tileSize / 2);
    });

    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#0033cc" : "#0066ff";
      ctx.fillRect(s.x * tileSize, s.y * tileSize, tileSize - 2, tileSize - 2);
    });

    updateScore();
  }

function showFeedback(msg) {
  feedbackEl.textContent = msg;
  feedbackEl.style.color = "black"; // now always black
  setTimeout(() => {
    feedbackEl.textContent = "";
  }, 1500);
}

function updateScore() {
  if (getLang() === 'zh') {
    scoreEl.textContent = `得分：${score}`;
  } else {
    scoreEl.textContent = `Score: ${score}`;
  }
}

function endGame() {
  gameRunning = false; // ✅ stop the animation loop
  clearInterval(interval);
  const snakeBonus = snake.length * 5;
  score += snakeBonus;
  const accuracy = totalAnswered > 0 
  ? Math.round((correctAnswers / totalAnswered) * 100)
  : 0;

  gameScreen.style.display = "none";
  endScreen.style.display = "block";

  const lang = getLang();
  const timePlayed = ((Date.now() - startTime) / 1000).toFixed(1);
  const avgTimeSec = totalAnswered > 0 ? (totalTime / totalAnswered / 1000).toFixed(2) : "0";
  const totalTimeInSeconds = totalTime / 1000;
const speedPerMinute = totalTimeInSeconds > 0 
  ? (totalAnswered * 60) / totalTimeInSeconds 
  : 0;

const accuracyRatio = totalAnswered > 0 
  ? correctAnswers / totalAnswered 
  : 0;

const fluencyRate = Math.round(speedPerMinute * accuracyRatio);

  if (lang === 'zh') {
    finalScore.textContent = `最终得分：${score} 分（包括乘蛇长度奖励 ${snakeBonus} 分）`;
finalAccuracy.innerHTML = `
  游戏时长：${timePlayed} 秒<br>
  回答题数：${totalAnswered} 题<br>
  答对题数：${correctAnswers} 题<br>
  准确率：${accuracy}%<br>
  当前速度设定：${speed} 毫秒<br>
  <strong>答题速度：${speedPerMinute.toFixed(2)} 题/分钟</strong><br>
  <strong>每题平均耗时：${avgTimeSec} 秒</strong><br>
  <strong>流畅率（按公式）：${fluencyRate}</strong>
`;
} else {
    finalScore.textContent = `Final Score: ${score} (including snake length bonus of ${snakeBonus})`; // Add this line
finalAccuracy.innerHTML = `
  Time Played: ${timePlayed} seconds<br>
  Total Questions Answered: ${totalAnswered}<br>
  Correct Answers: ${correctAnswers}<br>
  Accuracy: ${accuracy}%<br>
  Speed Setting: ${speed}ms<br>
  <strong>Speed: ${speedPerMinute.toFixed(2)} answers per minute</strong><br>
  <strong>Average Time per Answer: ${avgTimeSec} sec</strong><br>
  <strong>Fluency Rate (per formula): ${fluencyRate}</strong>
`;
  }
}


function updateTimer() {
  const now = Date.now();
  const secondsLeft = Math.max(0, 60 - Math.floor((now - startTime) / 1000));
  const timerEl = document.getElementById("timer");

  if (getLang() === 'zh') {
    timerEl.textContent = `剩余时间：${secondsLeft}秒`;
  } else {
    timerEl.textContent = `Time Left: ${secondsLeft}s`;
  }

  if (secondsLeft <= 0) {
    clearInterval(timerInterval);
    endGame();
  }
}

  startBtn.addEventListener("click", startGame);
const restartBtn = document.getElementById("restartBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");

// 🔁 Play Again
restartBtn.addEventListener("click", () => {
  // Reset result screen content
  finalScore.textContent = "";
  finalAccuracy.innerHTML = "";

  // Reset key game variables
  correctAnswers = 0;
  totalAnswered = 0;
  score = 0;
  totalTime = 0;
  snake = [{ x: 5, y: 5 }];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  // Show start screen
  startScreen.style.display = "block";
  gameScreen.style.display = "none";
  endScreen.style.display = "none";
});

// 🔙 Back to Menu
backToMenuBtn.addEventListener("click", () => {
  startScreen.style.display = "block";
  gameScreen.style.display = "none";
  endScreen.style.display = "none";

  // Optional: sync speed dropdown to game setting
  document.getElementById("speedSelect").value = speed;
});


document.addEventListener("keydown", (e) => {
  const { x, y } = direction;
  if (e.key === "ArrowUp" && y === 0) nextDirection = { x: 0, y: -1 };
  else if (e.key === "ArrowDown" && y === 0) nextDirection = { x: 0, y: 1 };
  else if (e.key === "ArrowLeft" && x === 0) nextDirection = { x: -1, y: 0 };
  else if (e.key === "ArrowRight" && x === 0) nextDirection = { x: 1, y: 0 };
});

const bgMusic = document.getElementById("bgMusic");
const muteBtn = document.getElementById("muteBtn");

muteBtn.addEventListener("click", () => {
  bgMusic.muted = !bgMusic.muted;

  // 🔇 = sound off / muted
  // 🔈 = sound on / unmuted
  muteBtn.textContent = bgMusic.muted ? "🔇" : "🔈";
});
};
