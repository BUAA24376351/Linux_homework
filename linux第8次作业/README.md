# Tank Battle Online 🎮

基于 Docker、SQLite 和 MCP 的 Web 坦克大战游戏。

## 快速启动

### 方式一：Docker 部署

```bash
docker compose up -d
```

然后访问：http://localhost:8000

### 方式二：直接运行

```bash
# 安装依赖
pip install flask flask-sqlalchemy

# 启动服务
python backend/app.py
```

然后访问：http://localhost:8000

## 操作说明

| 按键 | 功能 |
|------|------|
| W/A/S/D | 移动坦克（上/左/下/右） |
| J | 发射子弹 |

## 游戏规则

- **目标**：消灭所有 5 辆敌军坦克
- **失败条件**：玩家被击毁 或 基地被摧毁
- **计分**：每辆敌军 100 分，时间越短额外奖励越高

## 技术栈

| 模块 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + JavaScript + Canvas |
| 后端 | Python Flask |
| 数据库 | SQLite |
| 部署 | Docker + Docker Compose |
| 加分项 | MCP AI 战术助手 |

## 项目结构

```
tank-battle/
├── backend/
│   ├── app.py        # Flask 主服务
│   ├── database.py   # 数据库初始化
│   └── models.py     # 数据模型
├── frontend/
│   ├── index.html    # 游戏页面
│   ├── css/
│   │   └── style.css # 样式
│   └── js/
│       ├── game.js   # 游戏主循环
│       ├── tank.js   # 坦克类
│       ├── bullet.js # 子弹类
│       └── map.js    # 地图类
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## API 接口

- `GET /api/ranking` — 获取排行榜
- `POST /api/record` — 保存游戏记录
- `POST /api/mcp` — AI 战术指挥官
