require('dotenv').config();
const mqtt = require('mqtt');

const url = process.env.MQTT_URL || 'mqtt://localhost:1883';
const topic = process.env.TOPIC || 'iot/demo/temperature';

const client = mqtt.connect(url, {
  username: process.env.MQTT_USERNAME || undefined,
  password: process.env.MQTT_PASSWORD || undefined,
});

let brokerOffline = false;

client.on('connect', () => {
  brokerOffline = false;
  console.log('[PUB] Connected:', url);

  // 模拟设备上报温度
  setInterval(() => {
    const data = {
      deviceId: 'sensor-001',
      ts: Date.now(),
      temperature: (20 + Math.random() * 5).toFixed(2),
      humidity: (40 + Math.random() * 10).toFixed(2),
    };
    const payload = JSON.stringify(data);
    client.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) {
        console.error('[PUB] Publish error:', err.message);
      } else {
        console.log('[PUB] Sent:', payload);
      }
    });
  }, 2000);
});

client.on('error', (err) => {
  // Broker 不在线时 mqtt.js 每次重连都会触发 ECONNREFUSED（message 为空），
  // 只提示一次，避免刷屏；恢复连接后由 connect 事件重置标记
  if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
    if (!brokerOffline) {
      brokerOffline = true;
      console.error(`[PUB] 无法连接 Broker (${url})，请确认 Mosquitto 已启动；将自动重连…`);
    }
    return;
  }
  console.error('[PUB] Error:', err.code || err.message);
});