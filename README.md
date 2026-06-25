# 交界地知识库

艾尔登法环中文维基 — 查询武器、防具、魔法、护符、战灰、骨灰，规划你的 Build。

仍在不断完善中。

---

### 功能

- **物品浏览**：武器 · 防具 · 魔法 & 祷告 · 护符 · 战灰 · 骨灰 · 道具，包含 DLC 内容
- **Build 配装器**：自由搭配装备，实时查看属性面板
- **强化计算**：根据当前与目标等级计算所需材料和卢恩
- **物品对比**：并排对比最多 3 件物品
- **全局搜索**：输入名称快速定位
- **活点地图**：交互式地图，浏览赐福点位
- **主题切换**：暗色、白色、淡紫三种选择

### 快速开始

```bash
git clone https://github.com/Aporiyan/EldenRing_wiki.git
cd EldenRing_wiki
npm install
npm run dev
```

打开 `http://localhost:5173` 即可使用。

构建部署：

```bash
npm run build
npm run preview
```

### 项目结构

```
eldenring-wiki/
├── public/
│   ├── data/            # 游戏数据
│   ├── icons/           # 物品图标
│   └── data_backup/
├── src/                 # 前端代码
├── scripts/             # 数据处理脚本
└── data/                # 原始游戏参数
---

*愿赐福指引你。*
