const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 1. Seu Painel de Controle (Aparecerá quando você acessar o link do Render)
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#222; color:white; font-family:sans-serif; text-align:center;">
            <h1>PAINEL DO DJ - SHOW DE LUZES</h1>
            <button onclick="enviar('#FF0000', true)" style="background:red; padding:20px;">VERMELHO + LUZ</button>
            <button onclick="enviar('#0000FF', true)" style="background:blue; padding:20px; color:white;">AZUL + LUZ</button>
            <button onclick="enviar('#000000', false)" style="background:black; padding:20px; color:white;">APAGAR TUDO</button>
            <hr>
            <button onclick="strobe()" style="background:white; padding:20px;">EFEITO STROBE</button>
            
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                function enviar(cor, luz) {
                    socket.emit('comando_admin', { cor, luz });
                }
                function strobe() {
    let on = true;
    let count = 0;
    let i = setInterval(() => {
        enviar(on ? '#FFFFFF' : '#000000', on);
        on = !on;
        if(count++ > 10) clearInterval(i); // Reduzi para 10 piscadas mais lentas
    }, 200); // Mudei de 100 para 200ms
}
            </script>
        </body>
    `);
});

// 2. Lógica que repassa o comando para o público
io.on('connection', (socket) => {
    socket.on('comando_admin', (data) => {
        io.emit('comando_show', data); // Envia para todos os celulares no GitHub
    });
});


server.listen(process.env.PORT || 3000, () => console.log('Servidor rodando!'));
