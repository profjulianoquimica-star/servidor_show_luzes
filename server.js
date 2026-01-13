const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <style>
                body { background: #1a1a1a; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
                .card { background: #333; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #444; }
                input, button { padding: 12px; margin: 5px; border-radius: 5px; border: none; font-size: 16px; }
                input[type="color"] { width: 60px; height: 50px; cursor: pointer; }
                button { cursor: pointer; font-weight: bold; background: #27ae60; color: white; }
                .btn-stop { background: #c0392b; }
                .btn-manual { background: #2980b9; }
                .list { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Controle do Show</h1>

            <div class="card">
                <h3>1. Comandos Manuais</h3>
                <div class="list">
                    <button class="btn-manual" onclick="enviar('#FF0000')">Vermelho</button>
                    <button class="btn-manual" onclick="enviar('#00FF00')">Verde</button>
                    <button class="btn-manual" onclick="enviar('#0000FF')">Azul</button>
                    <button class="btn-manual" onclick="enviar('#FFFFFF')">Branco</button>
                    <button class="btn-manual" onclick="enviar('#000000')" style="background:#000">Preto (OFF)</button>
                </div>
            </div>

            <div class="card">
                <h3>2. Criar Nova Sequência</h3>
                <p>Escolha as cores e o intervalo (ms):</p>
                <input type="color" id="c1" value="#ff0000">
                <input type="color" id="c2" value="#ffff00">
                <input type="color" id="c3" value="#0000ff">
                <br>
                Intervalo: <input type="number" id="tempo" value="500" style="width: 80px;"> ms
                <br>
                <button onclick="iniciarCustom()">INICIAR SEQUÊNCIA</button>
                <button class="btn-stop" onclick="parar()">PARAR</button>
            </div>

            <script src="/socket.io/socket.io.js"></script>
            <script>
                const socket = io();
                let loop = null;

                function enviar(cor) {
                    socket.emit('comando_admin', { cor: cor, luz: false });
                }

                function parar() {
                    clearInterval(loop);
                    enviar('#000000');
                }

                function iniciarCustom() {
                    parar();
                    const cores = [
                        document.getElementById('c1').value,
                        document.getElementById('c2').value,
                        document.getElementById('c3').value
