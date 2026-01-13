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
    <title>VJ Master - Multi-Setores</title>
    <style>
        body { background: #121212; color: white; font-family: sans-serif; text-align: center; padding: 10px; margin: 0; }
        .card { background: #1e1e1e; padding: 15px; border-radius: 12px; border: 1px solid #333; max-width: 900px; margin: 0 auto; }
        .header-row { display: grid; grid-template-columns: 30px 40px 220px 1fr 80px 60px; gap: 5px; font-size: 10px; color: #888; margin-bottom: 5px; }
        .cor-row { display: grid; grid-template-columns: 30px 40px 220px 1fr 80px 60px; gap: 5px; align-items: center; background: #2a2a2a; margin: 4px 0; padding: 8px; border-radius: 6px; }
        
        .setores-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: #333; padding: 5px; border-radius: 4px; }
        .setor-box { font-size: 10px; display: flex; align-items: center; gap: 2px; }
        
        input[type="number"], select { background: #333; color: white; border: 1px solid #444; padding: 5px; border-radius: 4px; }
        input[type="color"] { width: 100%; height: 35px; cursor: pointer; border: none; }
        
        button { cursor: pointer; font-weight: bold; border: none; border-radius: 8px; transition: 0.2s; }
        .btn-main { background: #27ae60; color: white; width: 100%; font-size: 18px; padding: 15px; margin-top: 10px; }
        .btn-stop { background: #c0392b; color: white; width: 100%; font-size: 18px; padding: 15px; margin-top: 10px; }
        
        .presets-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; background: #222; padding: 10px; border-radius: 8px; }
        .btn-load { background: #2980b9; color: white; padding: 8px; font-size: 10px; width: 100%; }
        .btn-save { background: #444; color: #aaa; padding: 4px; font-size: 9px; width: 100%; margin-top: 2px; }
        
        .active-row { border: 1px solid #27ae60; background: #1b3d2a; }
    </style>
</head>
<body>
    <div class="card">
        <h2 style="color:#27ae60; margin: 10px 0;">VJ CONTROL - MULTI SETORES</h2>

        <div class="presets-grid" id="presets"></div>

        <div class="header-row">
            <span>#</span><span>ON</span><span>SELECIONE OS SETORES</span><span>COR</span><span>MS</span><span>STRB</span>
        </div>
        <div id="cont"></div>

        <div style="margin-top:20px;">
            Repetições: <input type="number" id="reps" value="0" style="width:60px">
        </div>

        <button class="btn-main" onclick="iniciar()">▶ INICIAR SEQUÊNCIA</button>
        <button class="btn-stop" onclick="parar()">■ PARAR TUDO / APAGAR</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let rodando = false;

        // Gerar Presets
        const pres = document.getElementById('presets');
        for(let i=1; i<=5; i++) {
            pres.innerHTML += \`<div><button class="btn-load" onclick="carregar(\${i})">CENA \${i}</button><button class="btn-save" onclick="salvar(\${i})">SALVAR \${i}</button></div>\`;
        }

        // Gerar as 10 linhas
        const cont = document.getElementById('cont');
        for(let i=1; i<=10; i++){
            let setoresHTML = '<div class="setores-grid">';
            for(let s=1; s<=6; s++) {
                setoresHTML += \`<label class="setor-box"><input type="checkbox" class="set-\${i}" value="\${s}">\${s}</label>\`;
            }
            setoresHTML += '</div>';

            cont.innerHTML += \`
            <div class="cor-row" id="row\${i}">
                <span>\${i}</span>
                <input type="checkbox" id="en\${i}" \${i==1?'checked':''}>
                \${setoresHTML}
                <input type="color" id="c\${i}" value="#ffffff">
                <input type="number" id="t\${i}" value="500">
                <input type="checkbox" id="s\${i}">
            </div>\`;
        }

        function salvar(slot) {
            const dados = [];
            for(let i=1; i<=10; i++) {
                const checkSetores = Array.from(document.querySelectorAll('.set-'+i))
                                         .map(cb => cb.checked);
                dados.push({
                    en: document.getElementById('en'+i).checked,
                    sets: checkSetores,
                    c: document.getElementById('c'+i).value,
                    t: document.getElementById('t'+i).value,
                    s: document.getElementById('s'+i).checked
                });
            }
            localStorage.setItem('vj_multi_'+slot, JSON.stringify(dados));
            alert('Cena ' + slot + ' salva!');
        }

        function carregar(slot) {
            const raw = localStorage.getItem('vj_multi_'+slot);
            if(!raw) return alert('Vazio!');
            const dados = JSON.parse(raw);
            dados.forEach((item, idx) => {
                let i = idx + 1;
                document.getElementById('en'+i).checked = item.en;
                document.getElementById('c'+i).value = item.c;
                document.getElementById('t'+i).value = item.t;
                document.getElementById('s'+i).checked = item.s;
                const cbs = document.querySelectorAll('.set-'+i);
                item.sets.forEach((val, sIdx) => cbs[sIdx].checked = val);
            });
        }

        async function executarStrobe(setores, cor, duracao) {
            const start = Date.now();
            while (Date.now() - start < duracao && rodando) {
                socket.emit('comando_admin', { setores, cor });
                await new Promise(r => setTimeout(r, 60));
                socket.emit('comando_admin', { setores, cor: '#000000' });
                await new Promise(r => setTimeout(r, 60));
            }
        }

        async function iniciar() {
            parar();
            rodando = true;
            const lista = [];
            for(let i=1; i<=10; i++){
                if(document.getElementById('en'+i).checked){
                    const setoresAtivos = Array.from(document.querySelectorAll('.set-'+i))
                                               .filter(cb => cb.checked)
                                               .map(cb => cb.value);
                    if(setoresAtivos.length > 0) {
                        lista.push({
                            id: i,
                            setores: setoresAtivos,
                            cor: document.getElementById('c'+i).value,
                            tempo: parseInt(document.getElementById('t'+i).value),
                            strobo: document.getElementById('s'+i).checked
                        });
                    }
                }
            }
            
            let volta = 0;
            const totalReps = parseInt(document.getElementById('reps').value);

            while(rodando) {
                for(let item of lista) {
                    if(!rodando) break;
                    document.querySelectorAll('.cor-row').forEach(r => r.classList.remove('active-row'));
                    document.getElementById('row'+item.id).classList.add('active-row');
                    
                    if(item.strobo) {
                        await executarStrobe(item.setores, item.cor, item.tempo);
                    } else {
                        socket.emit('comando_admin', { setores: item.setores, cor: item.cor });
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
            socket.emit('comando_admin', { setores: ["1","2","3","4","5","6"], cor: '#000000' });
        }
    </script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.on('comando_admin', (data) => io.emit('comando_show', data));
});

server.listen(process.env.PORT || 3000, () => console.log('Servidor Multi-Setor ON'));
