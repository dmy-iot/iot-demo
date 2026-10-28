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

- **2026-10-21 功能验证**
  - `npm run pub` + `npm run web` 启动后，Web 服务成功连接 Broker 并订阅 `iot/demo/temperature`。
  - 浏览器打开 `http://localhost:3000` 返回 HTTP 200，连接状态显示"已连接"。
  - 温度/湿度曲线约每 2 秒滚动新增一个数据点，消息计数持续增长。

- **2026-10-28 Broker 离线容错验证**
  - 停止 Mosquitto 后运行 `npm run pub`，修复后的发布端仅输出一条"无法连接 Broker，将自动重连"提示，不再重复刷屏。
  - 错误信息包含错误码，不再出现空白 `[PUB] Error:`。

- **2026-10-28 文档检查**
  - README 中的 Mermaid 架构图代码围栏成对（共 6 个），图表可正常渲染。

```mermaid
flowchart TD
  subgraph exp2["实验报告二"]
    Br2[Web browser]
    subgraph webserver["Web server<br/>http://localhost:3000"]
      I2[index.html]
      Se2[server.js]
    end
    S2[subscriber.js]
    B2[MQTT Broker<br/>localhost:1883]
    P2[publisher.js<br/>(IoT device)]

    P2 --> B2
    B2 --> S2
    B2 --> Se2
    Se2 --> I2
    I2 <--> Br2
  end
  style webserver stroke-dasharray:5 5,fill:none
  style exp2 fill:none
```