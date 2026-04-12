const socket = new WebSocket(`ws://${window.location.hostname}:${window.location.port || 3000}`);

let myPlayer = null;
let isMyTurn = false;
let board = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let isAIMode = false;

const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- GESTIÓN DE MENSAJES RECIBIDOS ---
function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.remove('show'), 2500);
}

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'player') {
        myPlayer = data.player;
        if (Array.isArray(data.board)) board = data.board;
        isMyTurn = (myPlayer === 'X') && board.every(c => c === '');
        renderBoard();
        updateInfo();
        showToast(`Conectado como jugador ${myPlayer}`);
    }

    if (data.type === 'opponent-joined') {
        showToast(`Jugador ${data.player} se ha conectado`);
    }

    if (data.type === 'move') {
        board[data.index] = data.player;
        isMyTurn = (data.player !== myPlayer);
        renderBoard();
        updateInfo();
    }

    if (data.type === 'reset') {
        executeLocalReset();
    }

    if (data.type === 'full') {
        document.getElementById('info').textContent = 'Sala llena (2/2). Intenta más tarde.';
        gameActive = false;
    }

    if (data.type === 'opponent-left') {
        showToast(`Jugador ${data.player || ''} se ha desconectado`);
        document.getElementById('info').textContent = 'Oponente desconectado. Esperando...';
        executeLocalReset();
        isMyTurn = false;
    }
};

socket.onclose = () => {
    document.getElementById('info').textContent = 'Conexión perdida con el servidor.';
    gameActive = false;
};

// --- LÓGICA DEL JUEGO ---
function updateInfo() {
    const infoDiv = document.getElementById('info');
    const winner = checkWinner();

    if (winner) {
        infoDiv.textContent = `!El jugador ${winner} ganó!`;
        gameActive = false;
    } else if (board.every(cell => cell !== '')) {
        infoDiv.textContent = '¡Empate!';
        gameActive = false;
    } else {
        if (myPlayer) {
            infoDiv.textContent = isMyTurn ? `Tu turno (${myPlayer})` : `Espera al oponente...`;
        }
    }
}

function checkWinner() {
    for (let combo of winningCombinations) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function makeMove(index) {
    if (!isMyTurn || board[index] !== '' || !gameActive || isAIMode) return;

    // 1. Marcar localmente
    board[index] = myPlayer;
    renderBoard();
    
    // 2. Notificar al servidor
    socket.send(JSON.stringify({
        type: 'move',
        index: index,
        player: myPlayer
    }));

    // 3. Bloquear turno
    isMyTurn = false;
    updateInfo();
}

function renderBoard() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        cell.textContent = board[index];
        cell.className = 'cell';
        if (board[index] === 'X') cell.classList.add('x');
        if (board[index] === 'O') cell.classList.add('o');
    });
}

// --- FUNCIONES DE REINICIO ---
function resetGame() {
    // Enviar petición de reinicio al servidor
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'reset' }));
    }
}

function executeLocalReset() {
    board = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    isMyTurn = (myPlayer === 'X'); // Siempre inicia X
    renderBoard();
    updateInfo();
}

// --- EVENTOS ---
document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => {
        makeMove(parseInt(cell.dataset.index));
    });
});

function toggleMode() {
    // Desactivamos temporalmente el socket si entras en modo IA 
    // para evitar conflictos, o simplemente mostramos alerta.
    alert("El modo IA es para práctica local solamente.");
}

renderBoard();
updateInfo();