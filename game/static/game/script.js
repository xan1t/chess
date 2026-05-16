console.log("SCRIPT LOADED");

let socket;
let gameId = new URLSearchParams(window.location.search).get("game");
let playerColor = null;
let selected = null;
let whiteTime = null;
let blackTime = null;
let currentTurn = true;
let timerInterval = null;
let gameOver = false;
let timerStarted = false;

const pieceMap = {
    p: "bp.png", r: "br.png", n: "bn.png", b: "bb.png", q: "bq.png", k: "bk.png",
    P: "wp.png", R: "wr.png", N: "wn.png", B: "wb.png", Q: "wq.png", K: "wk.png"
};

// ---------------- WebSocket ----------------


function connectToGame(gameId) {
    socket = new WebSocket(`ws://127.0.0.1:8000/ws/game/${gameId}/`);

    socket.onopen = () => console.log("CONNECTED");

    socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        console.log("WS DATA:", data);

        // INIT
        if (data.type === "init") {
            playerColor = data.color;
            currentTurn = data.turn;
            whiteTime = data.white_time;
            blackTime = data.black_time;

            if ((whiteTime === null || whiteTime === 0) && playerColor !== "spectator") {
                document.getElementById("time-setup").style.display = "block";
            } else if (whiteTime !== null && whiteTime > 0 && !timerStarted) {
                renderBoard(data.fen);
                timerStarted = true;
                startTimer();
            }
        }

        // MOVE / обновление
        if (data.move) {
            if (data.fen) renderBoard(data.fen);
            whiteTime = data.white_time;
            blackTime = data.black_time;
            currentTurn = data.turn;

            if (data.game_over) {
                gameOver = true;
                clearInterval(timerInterval);
                setTimeout(() => showGameResult(data.result), 50);
            }
        }
    };
}

function sendMove(move) {
    if (!socket) return;
    socket.send(JSON.stringify({ move }));
}

function goToReplay() {
    window.location.href = `/game/${gameId}/replay/`;
}

function sendTime(seconds) {
    if (!socket) return;
    socket.send(JSON.stringify({ set_time: seconds }));
}

// ---------------- Таймер ----------------
function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (gameOver) return;
        if (whiteTime === null || blackTime === null) return;

        if (currentTurn) whiteTime--;
        else blackTime--;

        updateTimerUI();

        if (whiteTime <= 0 && !gameOver) {
            gameOver = true;
            clearInterval(timerInterval);
            showGameResult("black_win_time");
        } else if (blackTime <= 0 && !gameOver) {
            gameOver = true;
            clearInterval(timerInterval);
            showGameResult("white_win_time");
        }
    }, 1000);
}

function updateTimerUI() {
    const whiteEl = document.getElementById("white-timer");
    const blackEl = document.getElementById("black-timer");
    if (!whiteEl || !blackEl) return;
    whiteEl.innerText = formatTime(whiteTime);
    blackEl.innerText = formatTime(blackTime);
}

function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------- Доска ----------------
function renderBoard(fen) {
    const cells = document.querySelectorAll(".cell");
    if (!cells.length) return;
    cells.forEach(c => c.innerHTML = "");

    const rows = fen.split(" ")[0].split("/");
    let index = 0;

    for (let row of rows) {
        for (let char of row) {
            if (!isNaN(char)) {
                index += parseInt(char);
            } else {
                if (!cells[index]) return;
                const img = document.createElement("img");
                img.src = `/static/game/img/${pieceMap[char]}`;
                img.className = "piece";
                cells[index].appendChild(img);
                index++;
            }
        }
    }
}

// ---------------- Клик по клетке ----------------
function onCellClick(square) {
    if (playerColor === "spectator") return;

    if (!selected) {
        selected = square;
    } else {
        const move = selected + square;
        if (selected !== square) sendMove(move);

        if (!timerStarted && whiteTime !== null && whiteTime > 0) {
            timerStarted = true;
            startTimer();
        }

        selected = null;
    }
}

// ---------------- Результат игры ----------------
function showGameResult(result) {
    let text = "";
    if (result === "checkmate") text = "Мат!";
    else if (result === "stalemate") text = "Пат!";
    else if (result === "white_win_time") text = "Белые победили по времени!";
    else if (result === "black_win_time") text = "Чёрные победили по времени!";
    alert(text);
}

// ---------------- Инициализация доски и времени ----------------
document.addEventListener("DOMContentLoaded", () => {
    const board = document.getElementById("board");
    const files = ["a","b","c","d","e","f","g","h"];

    for (let row = 8; row >= 1; row--) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement("div");
            const color = (row + col) % 2 === 0 ? "white" : "black";
            cell.className = `cell ${color}`;
            const square = files[col] + row;
            cell.dataset.square = square;
            cell.addEventListener("click", () => onCellClick(square));
            board.appendChild(cell);
        }
    }

    // Поле для ввода времени
    const boardContainer = document.getElementById("board-container");
    const timeSetup = document.getElementById("time-setup");
    const timeInput = document.getElementById("time-input");
    const setTimeBtn = document.getElementById("set-time-btn");

    setTimeBtn.addEventListener("click", () => {
        const seconds = parseInt(timeInput.value);
        if (!seconds || seconds <= 0) return alert("Введите корректное число секунд");

        whiteTime = seconds;
        blackTime = seconds;

        timeSetup.style.display = "none";
        boardContainer.style.display = "block";

        renderBoard(initialFen); 
        startTimer();
    });

    // Подключение к игре
    if (!gameId) {
        fetch("/game/new/").then(res => res.json())
            .then(data => window.location.href = `/?game=${data.game_id}`);
    } else connectToGame(gameId);
});