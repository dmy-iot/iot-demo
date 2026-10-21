# 计划：为 iot-demo 添加 Express 数据可视化网页

## 摘要

在现有 MQTT 发布/订阅演示基础上，新增一个 Express Web 服务器（`server.js`）。该服务器以"第二个订阅者"身份接入 MQTT Broker，收集 `publisher.js` 发布的温湿度数据，并通过 SSE 实时推送给浏览器；前端用 ECharts 绘制温湿度实时曲线仪表盘。现有 `publisher.js`、`subscriber.js` 保持不变。

## 现状分析

- [publisher.js](file:///d:/iot-demo/publisher.js)：每 2 秒向主题 `iot/demo/temperature` 发布 JSON `{deviceId, ts, temperature, humidity}`（字符串数值）。
- [subscriber.js](file:///d:/iot-demo/subscriber.js)：订阅同主题并打印。
- [package.json](file:///d:/iot-demo/package.json)：依赖仅 `mqtt ^5.0.0`、`dotenv ^16.0.0`；脚本 `pub`/`sub`。
- [.env](file:///d:/iot-demo/.env)：`MQTT_URL`、`MQTT_USERNAME/PASSWORD`、`TOPIC` 已配置。
- 本地 MQTT Broker 已在 1883 端口运行。
- 项目为扁平结构（脚本都在根目录），无任何 Web 组件。

## 方案（用户跳过选项确认，采用推荐组合）

1. **架构**：新建独立 `server.js` 订阅 MQTT —— 完整保留 发布 → Broker → 订阅 的物联网链路。
2. **实时更新**：SSE（`EventSource`）—— 服务器收到新消息即推送，图表平滑刷新，无需额外依赖。
3. **图表库**：ECharts，npm 安装并由 Express 本地托管 —— 不依赖外网 CDN。

## 变更清单

### 1. 新建 `server.js`（核心）

```text
- require dotenv / express / mqtt
- 连接 Broker（复用 .env 的 MQTT_URL/TOPIC/账号配置，reconnectPeriod: 1000）
- on message：JSON.parse payload，追加到内存环形缓冲（保留最近 100 条），并广播给所有 SSE 客户端
- 路由：
  GET /            → 返回 public/index.html
  GET /api/history → JSON 返回缓冲数据（供页面初始渲染）
  GET /api/stream  → SSE：写 text/event-stream 头，message 事件推送 data: {...}\n\n；
                     每 25 秒发注释行心跳防断连；客户端 close 时清理
  /vendor/echarts/echarts.min.js → 托管 node_modules/echarts/dist/echarts.min.js
- 监听 PORT（默认 3000），启动日志打印访问地址
```

### 2. 新建 `public/index.html`（仪表盘页面）

- 单文件页面（内联 CSS/JS），深色 IoT 风格。
- 顶部状态栏：连接状态指示灯（SSE onopen/onerror 切换）、设备 ID、消息计数。
- 两张 ECharts 折线图：温度（20~25℃ 量程自适应）、湿度（40~50%），X 轴为时间（ts 格式化 HH:mm:ss），窗口随数据滚动。
- 逻辑：先 `fetch /api/history` 渲染历史，再 `new EventSource('/api/stream')` 增量追加。

### 3. 修改 `package.json`

- dependencies 增加：`express ^4.19.0`、`echarts ^5.5.0`
- scripts 增加：`"web": "node server.js"`

### 4. 修改 `.env`

- 追加一行 `PORT=3000`

### 5. 修改 `.vscode/launch.json`

- 增加 "Run Web Server" 调试配置（program: `${workspaceFolder}/server.js`，envFile 同现有）。

### 6. 修改 `README.md`

- 按 README 中"后续补充功能说明、运行方式和验证记录"的既定目标，补充：功能简介、三个终端的启动步骤、验证记录。

## 不做的事（避免过度设计）

- 不做数据库/文件持久化（内存保留最近 100 条即可）。
- 不做鉴权、HTTPS、构建工具、前端框架。
- 不改动 publisher.js / subscriber.js 的现有逻辑。

## 假设与决策

- 数值为字符串（`.toFixed(2)` 产生），前端用 `Number()` 转换后再绘图。
- payload 解析失败时忽略该消息并打印警告，不中断服务。
- SSE 客户端列表用 Set 管理，断开自动剔除。
- ECharts 从 node_modules 直接托管，版本以 npm 实际安装为准。

## 实施步骤

1. `npm install express echarts`
2. 创建 `server.js`
3. 创建 `public/index.html`
4. 更新 `package.json`（scripts/依赖由 install 自动写入）、`.env`、`.vscode/launch.json`
5. 更新 `README.md`

## 验证步骤

1. 确认 Broker 在 1883 端口运行（`Get-NetTCPConnection -State Listen -LocalPort 1883`）。
2. 终端 1：`npm run pub`；终端 2：`npm run web`。
3. 用浏览器打开 `http://localhost:3000`，确认：状态灯为"已连接"、约每 2 秒新增一个数据点、两条曲线滚动、消息计数增长。
4. （可选）用 browser 自动化代理截图核对页面渲染。
5. `git add -A && git commit`（提交信息：`feat: add express web dashboard with sse + echarts`）—— 提交前请用户确认。
