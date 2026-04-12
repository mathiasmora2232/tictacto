const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const os = require('os');

const PORT = 3000;
const HOST = '0.0.0.0';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(__dirname, urlPath);
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403); return res.end('Forbidden');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404); return res.end('Not found');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server });

let players = [];
let board = ['', '', '', '', '', '', '', '', ''];

function broadcast(msg, except) {
    players.forEach(p => {
        if (p !== except && p.readyState === WebSocket.OPEN) {
            p.send(JSON.stringify(msg));
        }
    });
}

function resetBoard() {
    board = ['', '', '', '', '', '', '', '', ''];
}

wss.on('connection', (ws) => {
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        ws.close();
        return;
    }

    players.push(ws);
    const role = players.length === 1 ? 'X' : 'O';
    ws.role = role;
    ws.send(JSON.stringify({ type: 'player', player: role, board }));
    broadcast({ type: 'opponent-joined', player: role }, ws);
    console.log(`Jugador ${role} conectado (${players.length}/2)`);

    ws.on('message', (message) => {
        let data;
        try { data = JSON.parse(message.toString()); } catch { return; }

        if (data.type === 'reset') {
            resetBoard();
            broadcast({ type: 'reset' });
        } else if (data.type === 'move') {
            const i = data.index;
            if (typeof i !== 'number' || i < 0 || i > 8) return;
            if (board[i] !== '') return;
            if (data.player !== ws.role) return;
            board[i] = ws.role;
            broadcast(data, ws);
        }
    });

    ws.on('close', () => {
        players = players.filter(p => p !== ws);
        resetBoard();
        broadcast({ type: 'opponent-left', player: ws.role });
        console.log(`Jugador ${ws.role} desconectado`);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    const nets = os.networkInterfaces();
    console.log('Accesible desde:');
    console.log(`  http://localhost:${PORT}`);
    Object.values(nets).flat().forEach(n => {
        if (n && n.family === 'IPv4' && !n.internal) {
            console.log(`  http://${n.address}:${PORT}`);
        }
    });
});
