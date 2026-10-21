require('dotenv').config();
const path = require('path');
const express = require('express');
const mqtt = require('mqtt');

const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
const topic = process.env.TOPIC || 'iot/demo/temperature';
const port = Number(process.env.PORT) || 3000;

// 内存环形缓冲：保留最近 100 条
const MAX_POINTS = 100;
const history = [];

// SSE 客户端集合
const sseClients = new Set();

const app = express();

app.get('/vendor/echarts/echarts.min.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'echarts', 'dist', 'echarts.min.js'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/history', (req, res) => {
  res.json(history);
});

app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});

function broadcast(data) {
  const chunk = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(chunk);
  }
}

// 心跳，防止代理断开空闲连接
setInterval(() => {
  for (const client of sseClients) {
    client.write(': ping\n\n');
  }
}, 25000);

const mqttClient = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
  reconnectPeriod: 1000,
});

mqttClient.on('connect', () => {
  console.log('[WEB] Connected to broker:', url);
  mqttClient.subscribe(topic, { qos: 0 }, (err) => {
    if (err) {
      console.error('[WEB] Subscribe error:', err);
    } else {
      console.log('[WEB] Subscribed to:', topic);
    }
  });
});

mqttClient.on('message', (t, payload) => {
  try {
    const data = JSON.parse(payload.toString());
    history.push(data);
    if (history.length > MAX_POINTS) {
      history.shift();
    }
    broadcast(data);
  } catch {
    console.warn('[WEB] Ignored non-JSON payload:', payload.toString().slice(0, 120));
  }
});

mqttClient.on('error', (err) => console.error('[WEB] MQTT Error:', err.message));

app.listen(port, () => {
  console.log(`[WEB] Dashboard: http://localhost:${port}`);
});
