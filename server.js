const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });

let players = [];

wss.on('connection', (ws) => {
    console.log('Nuevo jugador intentando conectar...');

    if (players.length >= 2) {
        console.log('Sala llena.');
        ws.close();
        return;
    }

    players.push(ws);

    // Asignación de rol basada en la posición en el arreglo
    const role = (players.indexOf(ws) === 0) ? 'X' : 'O';
    ws.send(JSON.stringify({ type: 'player', player: role }));

    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === 'reset') {
            // Si es reset, avisar a TODOS los jugadores conectados
            players.forEach(player => {
                if (player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify({ type: 'reset' }));
                }
            });
        } else if (data.type === 'move') {
            // Si es movimiento, enviar a los demás (u oponente)
            players.forEach(player => {
                if (player !== ws && player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify(data));
                }
            });
        }
    });

    ws.on('close', () => {
        console.log('Jugador desconectado');
        players = players.filter(p => p !== ws);
    });
});

console.log('Servidor WebSocket corriendo en ws://localhost:3000');