# iot-demo

物联网设计与创新课程实践项目。模拟传感器通过 MQTT 上报温湿度数据，并提供 Express 网页仪表盘实时可视化。

## 功能

- **publisher.js**：模拟设备 `sensor-001`，每 2 秒向主题 `iot/demo/temperature` 发布 JSON 温湿度数据。
- **subscriber.js**：订阅同主题，打印接收到的消息。
- **server.js**：Express Web 服务器，以第二个订阅者身份收集数据，内存保留最近 100 条，并通过 SSE 推送到浏览器。
- **public/index.html**：ECharts 实时仪表盘，展示温度/湿度折线图、连接状态、设备 ID 与消息计数。

## 运行方式

前置条件：本地 MQTT Broker（如 Mosquitto）监听 `localhost:1883`，配置见 `.env`。

```powershell
npm install   # 首次运行
```

开三个终端分别执行：

```powershell
npm run pub   # 终端 1：模拟传感器发布数据
npm run sub   # 终端 2：命令行订阅端（可选）
npm run web   # 终端 3：Web 仪表盘
```

浏览器访问 http://localhost:3000 查看实时曲线。

## 验证记录

- 2026-10-21：`npm run pub` + `npm run web` 启动后，页面连接状态显示"已连接"，温度/湿度曲线约每 2 秒滚动新增一个数据点，消息计数持续增长。
测试图形化提交
测试图形化提交练习