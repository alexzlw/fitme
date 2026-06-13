<div align="center">

# FitMe

#### 一个给 Agent 用的本地减脂记录 Skill

[![License](https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge)](./LICENSE)
[![AgentSkills](https://img.shields.io/badge/AgentSkills-Standard-8B5CF6?style=for-the-badge)](https://agentskills.io)
[![Local First](https://img.shields.io/badge/Local_First-Health_Log-10B981?style=for-the-badge)](#-数据和隐私)

![Codex](https://img.shields.io/badge/Codex-Skill-10B981?style=flat-square&logo=openai&logoColor=white)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skill-D97706?style=flat-square&logo=anthropic&logoColor=white)
![OpenCode](https://img.shields.io/badge/OpenCode-Skill-3B82F6?style=flat-square)
![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-8B5CF6?style=flat-square)
![macOS](https://img.shields.io/badge/macOS-LaunchAgent-111827?style=flat-square&logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-Startup-2563EB?style=flat-square&logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-systemd-16A34A?style=flat-square&logo=linux&logoColor=white)

</div>

我自己减脂记录用的一套东西。

不是那种“给你一个热量表然后自己填”的工具，也不要求你每顿称重、算克数、写一大段描述。它更像一个生活化减脂记录员：你随手发图、发一句话，Agent 自己去估热量、蛋白和缺口，再把记录落到本地页面里。

你可以很随意地记：

```text
早上一个贝果和燕麦拿铁
中午吃了这个
晚饭这份吃完了
刚才喝了杯无糖可乐
```

发文字可以，发照片也可以；不知道重量也没关系，懒得描述也没关系。Agent 会根据包装、订单截图、餐食照片、常见食物数据库和上下文估算。

它应该能做三件事：

1. 判断这到底算不算已经吃了。
2. 估热量、蛋白、缺口，写入本地 JSON。
3. 打开一个本地 Web 面板，把每天每餐、图片、文字、热量都沉淀下来。

当然，它不会很精确。它适合的是“我想持续减脂，但不想被记录这件事绑架”的人，不适合需要精密营养管理的人。

---

## 它解决什么

减脂记录最烦的是三件事：

- 每天手动记，三天就懒了。
- 外卖和连锁餐热量不好查，估多估少都焦虑。
- 聊天里说过的饮食记录很快就淹没了，第二天没人记得。
- 每顿称重和精确录入太反人性，生活里很难长期坚持。

FitMe 的思路很简单：  
**让 Agent 负责记录和判断，让本地 Web 页面负责长期沉淀。**

它会生成一个跑在 `127.0.0.1` 的本地页面，所有数据都在你电脑上：

- 每日摄入
- 蛋白质范围
- 运动消耗
- 热量缺口
- 长期缺口日历
- 每日每餐明细
- 餐食图片
- 食物来源和估算依据

它也会把本地页面注册成稳定后台服务：

- macOS：LaunchAgent，`RunAtLoad + KeepAlive`
- Linux：user systemd，`Restart=always`
- Windows：任务计划程序，登录启动并配置失败重启

---

## 页面长什么样

FitMe 自带一个轻量 Web Dashboard：

- iOS Liquid Glass 风格的半透明面板
- 顶部展示今日摄入、蛋白、运动、累计缺口
- 长期热量缺口日历：每天一个小方格，颜色越深缺口越大
- 热量缺口趋势
- 每日餐食模块：可以展开每一天，看每餐图片、文字、热量、蛋白和来源
- 支持按早餐 / 午餐 / 晚餐 / 加餐筛选

它不是医疗软件，也不是精密营养秤。它的定位是：  
**帮你做持续决策，而不是制造精确幻觉。**

---

## 安装方式

在支持 `SKILL.md` / Agent Skills 结构的 Agent 里直接说：

```text
帮我安装这个 skill：https://github.com/Stormycry-cryp/Fitme/tree/main/fitme
```

如果你的 Agent 能自动安装，它应该会自己 clone 到对应目录。  
如果要手动安装，常见目录如下：

| Agent | 常见安装目录 |
|---|---|
| Codex | `~/.codex/skills/fitme` |
| Claude Code | `~/.claude/skills/fitme` |
| OpenCode | `~/.config/opencode/skills/fitme` |
| OpenClaw | `~/.openclaw/skills/fitme` |
| 其他 Agent | 放到它能扫描 `SKILL.md` 的 skills 目录 |

macOS / Linux 示例：

```bash
git clone https://github.com/Stormycry-cryp/Fitme.git
mkdir -p ~/.codex/skills
cp -R Fitme/fitme ~/.codex/skills/fitme
```

Windows PowerShell 示例：

```powershell
git clone https://github.com/Stormycry-cryp/Fitme.git
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills" | Out-Null
Copy-Item -Recurse -Force .\Fitme\fitme "$env:USERPROFILE\.codex\skills\fitme"
```

如果你用的不是 Codex，把上面的 `.codex\skills` 换成对应 Agent 的 skills 目录即可。

---

## 怎么用

第一次使用，跟 Agent 说：

```text
用 fitme 给我初始化健康记录页面，我是男，30 岁，175cm，70kg
```

Agent 会调用：

```bash
node <fitme-skill-folder>/scripts/fitme.js setup \
  --sex=male \
  --age=30 \
  --heightCm=175 \
  --weightKg=70 \
  --service
```

然后打开：

```text
http://127.0.0.1:8787/health_progress_dashboard.html
```

之后你只要继续在聊天里说：

```text
早餐喝了无糖燕麦拿铁，吃了一个贝果
中午吃了这个
晚餐吃完了，鱼和鸡胸都吃了
今天走了 3 公里
```

Agent 应该先检测已有站点，然后直接把当天数据写进去。

---

## 常用命令

检测是否已经初始化过：

```bash
node <fitme-skill-folder>/scripts/fitme.js detect
```

一步初始化并安装稳定后台服务：

```bash
node <fitme-skill-folder>/scripts/fitme.js setup \
  --sex=male \
  --age=30 \
  --heightCm=175 \
  --weightKg=70 \
  --service
```

Windows PowerShell：

```powershell
node <fitme-skill-folder>\scripts\fitme.js setup --sex=male --age=30 --heightCm=175 --weightKg=70 --service
start http://127.0.0.1:8787/health_progress_dashboard.html
```

检查后台服务和 HTTP 页面是否正常：

```bash
node <fitme-skill-folder>/scripts/fitme.js status
```

临时启动本地服务（不注册开机自启）：

```bash
node <fitme-skill-folder>/scripts/fitme.js start --detach
```

写入一餐：

```bash
node <fitme-skill-folder>/scripts/fitme.js add-meal \
  --type=dinner \
  --title="香煎秋刀鱼能量碗" \
  --description="加鸡胸肉，混合沙拉菜" \
  --kcal=630 \
  --kcalMin=580 \
  --kcalMax=720 \
  --proteinG=54 \
  --proteinMinG=48 \
  --proteinMaxG=60 \
  --image=/absolute/path/to/photo.jpg \
  --source="订单截图 + 实拍 + 估算"
```

自动按系统安装稳定后台服务：

```bash
node <fitme-skill-folder>/scripts/fitme.js install-service
```

也可以使用系统专用命令。

macOS：

```bash
node <fitme-skill-folder>/scripts/fitme.js install-launchd
```

Linux：

```bash
node <fitme-skill-folder>/scripts/fitme.js install-systemd
```

Windows：

```powershell
node <fitme-skill-folder>\scripts\fitme.js install-startup
```

---

## 数据和隐私

默认数据目录：

```text
~/Documents/FitMe
```

Windows 下等价于：

```text
%USERPROFILE%\Documents\FitMe
```

主要文件：

```text
health_progress_dashboard.html
health_dashboard_server.js
health_dashboard_data.json
health_dashboard_data.js
fitness_daily_log.md
health_images/
```

其中：

- `health_dashboard_data.json` 是主数据源。
- `health_dashboard_data.js` 是静态兜底，每次写入时自动同步。
- `health_images/` 保存餐食图片副本，避免微信/聊天临时图片被清理后页面失效。
- 服务只监听 `127.0.0.1`。

这个仓库不应该提交你的个人饮食数据。  
真正的记录文件应该只留在你自己的 `~/Documents/FitMe` 里。

---

## Skill 规则

FitMe 的核心规则写在 [fitme/SKILL.md](./fitme/SKILL.md)。

几个关键点：

- “打算吃”“能不能吃”不计入摄入。
- “吃了”“喝了”“吃完了”才写入。
- 用户可以只发图片或一句很短的话，不需要称量，也不需要完整描述。
- 包装食品优先用包装营养表。
- 连锁品牌优先查公开/官方营养信息。
- 查不到再估算，并保留估算来源。
- 每餐都要有热量、蛋白范围、来源，能有图片就持久化图片。
- 普通记录短回复，用户问建议时再展开分析。

---

## 适合谁

适合：

- 想减脂，但不想天天手动记 App 的人
- 想随手记录，不想称重、不想算克数、不想写复杂描述的人
- 接受“够用的估算”，不追求每餐精确到个位数卡路里的人
- 经常点外卖，需要 Agent 帮忙判断和估算的人
- 希望把聊天里的饮食记录沉淀成本地页面的人
- 想长期看热量缺口，而不是纠结每一餐的人

不适合：

- 需要医疗级营养管理的人
- 需要多人云同步的人
- 需要对接智能秤、手环、商业数据库的人

---

## License

MIT
