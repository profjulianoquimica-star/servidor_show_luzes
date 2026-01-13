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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { background: #1a1a1a; color: white; font-family: sans-serif; text-align: center; padding: 10px; margin: 0; }
        .card { background: #333; padding: 15px; border-radius: 10px; border: 1px solid #444; max-width: 600px; margin: 0 auto; }
        .header-row { display: grid; grid-template-columns: 30px 40px 1fr 80px 70px; gap: 5px; font-size: 10px; margin-bottom: 5px; color: #aaa; }
        .cor-row { display: grid; grid-template-columns: 30px 40px 1fr 80px 70px; gap: 5px; align-items: center; background: #444; margin: 3px 0; padding: 5px; border-radius: 5px; }
        input[type="number"] { width: 100%; padding: 5px; border-radius: 3px; border: none; text-align: center; }
        input[type="color"] { width: 100%; height: 30px; border: none; cursor: pointer; background: none; }
        button { cursor: pointer; font-weight: bold; background: #27ae60; color: white; padding: 15px; border: none; border-radius: 5px; width: 100%; margin-top: 10px; }
        .btn-stop { background: #c0392b; }
        .active-row { border: 2px solid #27ae60; background: #2c5e3f; }
    </style>
</head>
<body>
    <h3>GERENCIADOR DE SEQUÊNCIA PRO</h3>
    <div class="card">
        <div class="header-row">
            <span>#</span><span>ON</span><span>COR</span><span>TEMPO(ms)</span><span>STROBE</span>
        </div>
        <div id="cont"></div>
        <hr>
        Repetições: <input type="number" id="reps" value="0" style="width:60px"> <small>(0=infinito)</small>
        <button onclick="iniciar()">INICIAR SEQUÊNCIA</button>
        <button class="btn-stop" onclick="parar()">PARAR TUDO</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let loopTimeout = null;
        let rodando = false;

        // Gerar 10 linhas
        const cont = document.getElementById('cont');
        for(let i=1; i<=10; i++){
            cont.innerHTML += \`
            <div class="cor-row" id="row\${i}">
                <span>\${i}</span>
                <input type="checkbox" id="en\${i}" \${i<=3?'checked':''}>
                <input type="color" id="c\${i}" value="\${i==1?'#ff0000':i==2?'#ffffff':'#0000ff'}">
                <input type="number" id="t\${i}" value="1000">
                <input type="checkbox" id="s\${i}">
            </div>\`;
        }

        async function executarStrobe(cor, duracao) {
            const start = Date.now();
            while (Date.now() - start < duracao && rodando) {
                socket.emit('comando_admin', { cor: cor, luz: false });
                await new Promise(r => setTimeout(r, 60));
                socket.emit('comando_admin', { cor: '#000000', luz: false });
                await new Promise(r => setTimeout(r, 60));
            }
        }

        async function iniciar() {
            parar();
            rodando = true;
            const lista = [];
            for(let i=1; i<=10; i++){
                if(document.getElementById('en'+i).checked){
                    lista.push({
                        id: i,
                        cor: document.getElementById('c'+i).value,
                        tempo: parseInt(document.getElementById('t'+i).value),
                        strobo: document.getElementById('s'+i).checked
                    });
                }
            }

            if(lista.length === 0) return;
            const totalReps = parseInt(document.getElementById('reps').value);
            let volta = 0;
            
            while(rodando) {
                for(let item of lista) {
                    if(!rodando) break;
                    
                    // Highlight visual na linha ativa
                    document.querySelectorAll('.cor-row').forEach(r => r.classList.remove('active-row'));
                    document.getElementById('row'+item.id).classList.add('active-row');

                    if(item.strobo) {
                        await executarStrobe(item.cor, item.tempo);
                    } else {
                        socket.emit('comando_admin', { cor: item.cor, luz: false });
                        await new Promise(r => setTimeout(r, item.tempo));
                    }
                }
                volta++;
                if(totalReps > 0 && volta >= totalReps) {
                    parar();
                    break;
                }
            }
        }

        function parar() {
            rodando = false;
            clearTimeout(loopTimeout);
            document.querySelectorAll('.cor-row').forEach(r => r.classList.remove('active-row'));
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

server.listen(process.env.PORT || 3000, () => console.log('Servidor Pro v2 OK'));
