const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { background: #1a1a1a; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
                .card { background: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #444; }
                input, button { padding: 12px; margin: 5px; border-radius: 5px; border: none; font-size: 16px; }
                button { cursor: pointer; font-weight: bold; background: #27ae60; color: white; }
                .btn-stop { background: #c0392b; }
            </style>
        </head>
        <body>
            <h1>GERENCIADOR DE SHOW</h1>
            <div class="card">
                <h3>Criar Sequência</h3>
                <input type="color" id="c1" value="#ff0000">
                <input type="color" id="c2" value="#00ff00">
                <input type="color" id="c3" value="#0000ff">
                <br>
                Tempo (ms): <input type="number" id="tempo" value="500" style="width:80px">
                <br>
                <button onclick="iniciar()">INICIAR</button>
                <button class="btn-stop" onclick="parar()">PARAR</button>
            </div>
            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let loop = null;
                function iniciar() {
                    clearInterval(loop);
                    const cores = [document.getElementById('c1').value, document.getElementById('c2').value, document.getElementById('c3').value];
                    const ms = document.getElementById('tempo').value;
                    let i = 0;
                    loop = setInterval(() => {
                        socket.emit('comando_admin', { cor: cores[i % cores.length], luz: false });
                        i++;
                    }, ms);
                }
                function parar() {
                    clearInterval(loop);
                    socket.emit('comando_admin', { cor: '#000000', luz: false });
                }
            </script>
        </body>
        </html>
    `);
});

io.on('connection', (socket) => {
    socket.on('comando_admin', (data) => {
        io.emit('comando_show', data);
    });
});

server.listen(process.env.PORT || 3000, () => console.log('Servidor Rodando'));
