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
        body { background: #1a1a1a; color: white; font-family: sans-serif; text-align: center; padding: 10px; }
        .card { background: #333; padding: 15px; border-radius: 10px; border: 1px solid #444; max-width: 500px; margin: 0 auto; }
        .cor-row { display: flex; align-items: center; justify-content: space-between; background: #444; margin: 5px 0; padding: 5px 10px; border-radius: 5px; }
        input[type="number"], input[type="text"] { padding: 8px; border-radius: 5px; border: none; width: 60px; }
        button { cursor: pointer; font-weight: bold; background: #27ae60; color: white; padding: 15px; border: none; border-radius: 5px; width: 100%; margin-top: 10px; }
        .btn-stop { background: #c0392b; }
        label { font-size: 12px; }
    </style>
</head>
<body>
    <h1>SUPER GERENCIADOR</h1>
    <div class="card">
        <h3>Configurar Sequência (Até 10)</h3>
        <div id="cores-container"></div>
        <hr>
        Tempo entre trocas (ms): <input type="number" id="intervalo" value="800"><br><br>
        Repetições (0 = infinito): <input type="number" id="reps" value="0">
        <button onclick="iniciar()">INICIAR SHOW</button>
        <button class="btn-stop" onclick="parar()">PARAR TUDO</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let loop = null;
        const container = document.getElementById('cores-container');

        // Gera os 10 campos de cores
        for(let i=1; i<=10; i++) {
            container.innerHTML += \`
                <div class="cor-row">
                    <span>\${i}</span>
                    <input type="checkbox" id="en\${i}" \${i<=3 ? 'checked' : ''}>
                    <input type="color" id="c\${i}" value="\${i==1?'#ff0000':i==2?'#00ff00':'#0000ff'}">
                    <label><input type="checkbox" id="s\${i}"> Strobo</label>
                </div>\`;
        }

        async function flashStrobo(cor) {
            for(let i=0; i<4; i++) {
                socket.emit('comando_admin', { cor: cor, luz: false });
                await new Promise(r => setTimeout(r, 50));
                socket.emit('comando_admin', { cor: '#000000', luz: false });
                await new Promise(r => setTimeout(r, 50));
            }
        }

        async function iniciar() {
            parar();
            const lista = [];
            for(let i=1; i<=10; i++) {
                if(document.getElementById('en'+i).checked) {
                    lista.push({ 
                        cor: document.getElementById('c'+i).value, 
                        strobo: document.getElementById('s'+i).checked 
                    });
                }
            }
            
            const ms = parseInt(document.getElementById('intervalo').value);
            const totalReps = parseInt(document.getElementById('reps').value);
            let volta = 0;
            let index = 0;

            loop = setInterval(async () => {
                const item = lista[index];
                if(item.strobo) {
                    await flashStrobo(item.cor);
                } else {
                    socket.emit('comando_admin', { cor: item.cor, luz: false });
                }

                index++;
                if(index >= lista.length) {
                    index = 0;
                    volta++;
                    if(totalReps > 0 && volta >= totalReps) parar();
                }
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
    socket.on('comando_admin', (data) => io.emit('comando_show', data));
});

server.listen(process.env.PORT || 3000, () => console.log('Servidor Pro OK'));
