let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = true;
let isAIMode = false;

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function updateInfo() {
    const infoDiv = document.getElementById('info');
    const winner = checkWinner();
    if (winner) {
        infoDiv.textContent = `¡${winner} ganó! 🎉`;
        gameActive = false;
    } else if (board.every(cell => cell !== '')) {
        infoDiv.textContent = 'Empate ';
        gameActive = false;
    } else {
        infoDiv.textContent = `Turno: ${currentPlayer}`;
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
    if (board[index] === '' && gameActive) {
        board[index] = currentPlayer;
        renderBoard();
        
        if (!checkWinner() && !board.every(cell => cell !== '')) {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateInfo();
            
            if (isAIMode && currentPlayer === 'O' && gameActive) {
                setTimeout(makeAIMove, 500);
            }
        } else {
            updateInfo();
        }
    }
}

function makeAIMove() {
    const availableMoves = board
        .map((cell, index) => cell === '' ? index : null)
        .filter(val => val !== null);
    
    if (availableMoves.length > 0) {
        const randomIndex = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        board[randomIndex] = 'O';
        renderBoard();
        
        if (!checkWinner() && !board.every(cell => cell !== '')) {
            currentPlayer = 'X';
        }
        updateInfo();
    }
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

function resetGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    renderBoard();
    updateInfo();
}

function toggleMode() {
    isAIMode = !isAIMode;
    const modeText = document.getElementById('modeText');
    const modeDisplay = document.getElementById('modeDisplay');
    
    if (isAIMode) {
        modeText.textContent = 'IA';
        modeDisplay.textContent = 'Jugador vs IA';
    } else {
        modeText.textContent = 'PvP';
        modeDisplay.textContent = 'Jugador vs Jugador';
    }
    resetGame();
}

document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => {
        makeMove(parseInt(cell.dataset.index));
    });
});

updateInfo();
