// Соответствие фигур и картинок
const pieceMap = {
    p: "bp.png", r: "br.png", n: "bn.png", b: "bb.png", q: "bq.png", k: "bk.png",
    P: "wp.png", R: "wr.png", N: "wn.png", B: "wb.png", Q: "wq.png", K: "wk.png"
};

// Создаём доску в DOM
function createBoard() {
    const boardEl = document.getElementById("board");
    const files = ["a","b","c","d","e","f","g","h"];

    boardEl.innerHTML = "";  // чистим перед созданием

    for (let row = 8; row >= 1; row--) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement("div");
            const color = (row + col) % 2 === 0 ? "white" : "black";
            cell.className = `cell ${color}`;
            cell.dataset.square = files[col] + row;
            boardEl.appendChild(cell);
        }
    }
}

function renderBoard(fen) {
    if (!fen) {
        console.error("FEN не задан!");
        return;
    }

    const cells = document.querySelectorAll(".cell");
    cells.forEach(c => c.innerHTML = "");

    const rows = fen.split(" ")[0].split("/");
    let index = 0;

    for (let row of rows) {
        for (let char of row) {
            if (!isNaN(char)) {
                index += parseInt(char);
            } else {
                const imgName = pieceMap[char];
                if (!imgName) {
                    console.error("Неизвестная фигура в FEN:", char);
                    index++;
                    continue;
                }
                const img = document.createElement("img");
                img.src = `/static/game/img/${imgName}`;
                cells[index].appendChild(img);
                index++;
            }
        }
    }
}

// Загрузка реплея с сервера и проигрывание
async function loadReplay(gameId) {
    const res = await fetch(`/game/${gameId}/replay_data/`);
    if (!res.ok) return alert("Реплей не найден");

    const data = await res.json();
    const moves = data.moves;

    createBoard();
    renderBoard(data.initial_fen);

    let i = 0;
    const interval = setInterval(() => {
        if (i >= moves.length) {
            clearInterval(interval);
            return;
        }

        renderBoard(moves[i].fen);
        i++;
    }, 1000);
}