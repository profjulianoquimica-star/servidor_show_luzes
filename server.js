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
    <title>Painel VJ Master - 6 Setores</title>
    <style>
        body { background: #121212; color: white; font-family: sans-serif; text-align: center; padding: 10px; margin: 0; }
        .card { background: #1e1e1e; padding: 15px; border-radius: 12px; border: 1px solid #333; max-width: 850px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header-row { display: grid; grid-template-columns: 30px 40px 100px 1fr 80px 70px; gap: 5px; font-size: 10px; color: #888; margin-bottom: 5px; }
        .cor-row { display: grid; grid-template-columns: 30px 40px 100px 1fr 80px 70px; gap: 5px; align-items: center; background: #2a2a2a; margin: 4px 0; padding: 8px; border-radius: 6px; }
        select, input { background: #333; color: white; border: 1px solid #444; padding: 8px; border-radius: 4px; }
        input[type="color"] { width: 100%; height: 35px; cursor: pointer; border: none; padding: 2px; }
        button { cursor: pointer; font-weight: bold; border: none; border-radius: 8px; transition: 0.2s; }
        
        .btn-main { background: #27ae60; color: white; width: 100%; font-size: 18px; padding: 15px; margin-top: 10px; }
        .btn-stop { background: #c0392b; color: white; width: 100%; font-size: 18px; padding: 15px; margin-top: 10px; }
        
        .section-title { font-size: 12px; color: #27ae60; text-transform: uppercase; margin: 15px 0 10px; letter-spacing: 1px; }
        .presets-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 20px; padding: 10px; background: #252525; border-radius: 8px; }
        
        .btn-load { background: #2980b9; color: white; padding: 10px; font-size: 11px; }
        .btn-save { background: #8e44ad; color: white; padding: 10px; font-size: 11px; }
        
        .active-row { border: 1px solid #27ae60; background: #1b3d2a; transform: scale(1.01); }
    </style>
</head>
<body>
    <div class="card">
        <h2 style="margin:0 0 10px 0; color:#27ae60;">VJ CONTROL MASTER</h2>

        <div class="section-title">Cenários Salvos (Presets)</div>
        <div class="presets-grid">
            <div><button class="btn-load" onclick="carregar(1)">CENA 1</button><br><button class="btn-save" onclick="salvar(1)" style="margin-top:4px; opacity:0.6">Gravar 1</button></div>
            <div><button class="btn-load" onclick="carregar(2)">CENA 2</button><br><button class="btn-save" onclick="salvar(2)" style="margin-top:4px; opacity:0.6">Gravar 2</button></div>
            <div><button class="btn-load" onclick="carregar(3)">CENA 3</button><br><button class="btn-save" onclick="salvar(3)" style="margin-top:4px; opacity:0.6">Gravar 3</button></div>
            <div><button class="btn-load" onclick="carregar(4)">CENA 4</button><br><button class="btn-save" onclick="salvar(4)" style="margin-top:4px; opacity:0.6">Gravar 4</button></div>
            <div><button class="btn-load" onclick="carregar(5)">CENA 5</button><br><button class="btn-save" onclick="salvar(5)" style="margin-top:4px; opacity:0.6">Gravar 5</button></div>
        </div>

        <div class="header-row">
            <span>#</span><span>ON</span><span>SETOR</span><span>COR</span><span>MS</span><span>STRB</span>
        </div>
        <div id="cont"></div>

        <div style="margin-top:20px; display:flex; gap:10px; align-items:center; justify-content:center;">
            Repetições: <input type="number" id="reps" value="0" style="width:60px">
            <small style="color:#888;">(0 = Infinito)</small>
        </div>

        <button class="btn-main" onclick="iniciar()">▶ INICIAR SEQUÊNCIA</button>
        <button class="btn-stop" onclick="parar()">■ PARAR TUDO / APAGAR</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let rodando = false;

        // Gerar as 10 linhas
        const cont = document.getElementById('cont');
        for(let i=1; i<=10; i++){
            cont.innerHTML += \`
            <div class="cor-row" id="row\${i}">
                <span>\${i}</span>
                <input type="checkbox" id="en\${i}" \${i<=3?'checked':''}>
                <select id="set\${i}">
                    <option value="todos">Todos</option>
                    <option value="1">Setor 1</option>
                    <option value="2">Setor 2</option>
                    <option value="3">Setor 3</option>
                    <option value="4">Setor 4</option>
                    <option value="5">Setor 5</option>
                    <option value="6">Setor 6</option>
                </select>
                <input type="color" id="c\${i}" value="#ffffff">
                <input type="number" id="t\${i}" value="500">
                <input type="checkbox" id="s\${i}">
            </div>\`;
        }

        // Funções de Memória (Salvar e Carregar)
        function salvar(slot) {
            const dados = [];
            for(let i=1; i<=10; i++) {
                dados.push({
                    en: document.getElementById('en'+i).checked,
                    set: document.getElementById('set'+i).value,
                    c: document.getElementById('c'+i).value,
                    t: document.getElementById('t'+i).value,
                    s: document.getElementById('s'+i).checked
                });
            }
            localStorage.setItem('cena_'+slot, JSON.stringify(dados));
            alert('Cena ' + slot + ' gravada com sucesso!');
        }

        function carregar(slot) {
            const raw = localStorage.getItem('cena_'+slot);
            if(!raw) return alert('Essa cena está vazia! Configure as linhas e clique em Gravar.');
            const dados = JSON.parse(raw);
            dados.forEach((item, idx) => {
                let id = idx + 1;
                document.getElementById('en'+id).checked = item.en;
                document.getElementById('set'+id).value = item.set;
                document.getElementById('c'+id).value = item.c;
                document.getElementById('t'+id).value = item.t;
                document.getElementById('s'+id).checked = item.s;
            });
        }

        async function executarStrobe(setor, cor, duracao) {
            const start = Date.now();
            while (Date.now() - start < duracao && rodando) {
                socket.emit('comando_admin', { setor: setor, cor: cor });
                await new Promise(r => setTimeout(r, 60));
                socket.emit('comando_admin', { setor: setor, cor: '#000000' });
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
                        setor: document.getElementById('set'+i).value,
                        cor: document.getElementById('c'+i).value,
                        tempo: parseInt(document.getElementById('t'+i).value),
                        strobo: document.getElementById('s'+i).checked
                    });
                }
            }
            if(lista.length === 0) return;
            
            let volta = 0;
            const totalReps = parseInt(document.getElementById('reps').value);

            while(rodando) {
                for(let item of lista) {
                    if(!rodando) break;
                    document.querySelectorAll('.cor-row').forEach(r => r.classList.remove('active-row'));
                    document.getElementById('row'+item.id).classList.add('active-row');
                    
                    if(item.strobo) {
                        await executarStrobe(item.setor, item.cor, item.tempo);
                    } else {
                        socket.emit('comando_admin', { setor: item.setor, cor: item.cor });
                        await new Promise(r => setTimeout(r, item.tempo));
                    }
                }
                volta++;
                if(totalReps > 0 && volta >= totalReps) { parar(); break; }
            }
        }

        function parar() {
            rodando = false;
            document.querySelectorAll('.cor-row').forEach(r => r.classList.remove('active-row'));
            socket.emit('comando_admin', { setor: 'todos', cor: '#000000' });
        }
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('comando_admin', (data) => io.emit('comando_show', data));
});

server.listen(process.env.PORT || 3000, () => console.log('Servidor VJ Master ON'));
