---
name: fitme
description: Use when any Agent needs a local persistent diet, calorie, protein, exercise, or health dashboard; asks to initialize FitMe from height/weight/sex/age; asks to record today's meals into an existing FitMe site; or wants a local web page with images, daily meal details, long-term deficit calendar, stable listening, and macOS/Windows/Linux boot auto-start.
---

# FitMe

FitMe is a reusable local health tracker: a persistent web dashboard plus JSON-backed food/exercise logging. It is Agent-agnostic: Codex, Claude Code, OpenCode, OpenClaw, Cursor-style agents, or any agent that can read `SKILL.md` and run shell commands can use it.

## Core Rules

- Only record confirmed intake: “吃了/喝了/吃完了” counts; “打算/能不能/选哪个” does not.
- Branded/package items: use visible label or reliable/official nutrition data first; estimate only when unavailable.
- Store source and uncertainty: every meal should have `kcal`, optional `kcalRange`, optional `proteinRangeG`, optional nutrition estimates, and `source`.
- Persist images: copy local image files into `health_images/` before writing `imagePaths`; never depend on chat/temp paths.
- Keep replies short for routine updates: “已记录：今日约 X kcal，蛋白约 Y-Zg。”
- For today's panel, estimate practical nutrition dimensions when possible: 膳食纤维、钠、钙、钾、铁、维生素C、维生素D、维生素B12. These are lifestyle estimates, not medical nutrition facts.

## Dashboard Design

The dashboard is a local HTML/CSS/JS app with:

- iOS Liquid Glass inspired transparent panels.
- Top metrics: daily intake, protein, exercise, cumulative deficit.
- Long-term deficit calendar: one square per day; darker color means larger deficit.
- Deficit trend timeline.
- Daily meal detail panel: expandable days, filters by breakfast/lunch/dinner/snack, each meal shows image, text, kcal, protein, and source.
- Today's nutrition panel only: show fiber/sodium/minerals/vitamins and short next-meal advice. Do not turn the long-term calendar into micronutrient history.

## Storage Layout

Default runtime root:

```text
~/Documents/FitMe
```

Files:

```text
health_progress_dashboard.html
health_dashboard_server.js
health_dashboard_data.json   # source of truth
health_dashboard_data.js     # static fallback generated from JSON
fitness_daily_log.md         # prose log
health_images/               # copied durable meal images
```

Stable background service:

- macOS: LaunchAgent with `KeepAlive` and `RunAtLoad`.
- Linux: user systemd service with `Restart=always`.
- Windows: Task Scheduler task at logon with restart-on-failure settings and a generated `start-fitme.cmd`.

Data model:

```json
{
  "profile": {
    "sex": "male",
    "age": 30,
    "heightCm": 175,
    "latestWeightKg": 70,
    "bmrKcal": 1649,
    "sedentaryMaintenanceKcalRange": [1896, 1979]
  },
  "targets": {
    "dailyKcalRange": [1600, 1900],
    "dailyProteinRangeG": [90, 120],
    "proteinCompletionTargetG": 108,
    "nutrition": {
      "fiberG": [25, 35],
      "sodiumMgMax": 2000,
      "calciumMg": [800, 1000],
      "potassiumMg": [2000, 3500],
      "ironMg": [10, 15],
      "vitaminCMg": [100, 200],
      "vitaminDMcg": [10, 20],
      "vitaminB12Mcg": [2.4, 5]
    }
  },
  "days": [
    {
      "date": "YYYY-MM-DD",
      "intakeKcal": 1594,
      "proteinRangeG": [89, 111],
      "deficitKcal": 474,
      "meals": [
        {
          "type": "dinner",
          "title": "FC 香煎秋刀鱼能量碗",
          "description": "加鸡胸肉，混合沙拉菜。",
          "kcal": 630,
          "kcalRange": [580, 720],
          "proteinRangeG": [48, 60],
          "nutrition": {
            "fiberG": 5,
            "sodiumMg": 820,
            "calciumMg": 120,
            "potassiumMg": 780,
            "ironMg": 2.8,
            "vitaminCMg": 30,
            "vitaminDMcg": 1.2,
            "vitaminB12Mcg": 1.6
          },
          "imagePaths": ["health_images/example.jpg"],
          "source": "订单截图 + 实拍 + 估算"
        }
      ],
      "nutrition": {
        "fiberG": 5,
        "sodiumMg": 820,
        "calciumMg": 120,
        "potassiumMg": 780,
        "ironMg": 2.8,
        "vitaminCMg": 30,
        "vitaminDMcg": 1.2,
        "vitaminB12Mcg": 1.6
      },
      "nutritionAdvice": [
        "膳食纤维偏低，下一餐优先加蔬菜、菌菇、豆制品或全谷物。"
      ]
    }
  ]
}
```

## Workflow

Use the actual installed skill path for the current Agent. Common examples:

```text
Codex:       ~/.codex/skills/fitme
Claude Code: ~/.claude/skills/fitme
OpenCode:    ~/.config/opencode/skills/fitme
OpenClaw:    ~/.openclaw/skills/fitme
```

If unsure, locate the current `SKILL.md` and run `node <that-folder>/scripts/fitme.js ...`.

1. Detect existing dashboard first:

```bash
node <fitme-skill-folder>/scripts/fitme.js detect
```

2. If not found, ask only for required baseline:

```text
性别、年龄、身高cm、体重kg
```

Then initialize and install the stable background service in one step:

```bash
node <fitme-skill-folder>/scripts/fitme.js setup --sex=male --age=30 --heightCm=175 --weightKg=70 --service
open http://127.0.0.1:8787/health_progress_dashboard.html
```

This auto-selects the OS service manager. Use this by default.

Check service registration and HTTP availability:

```bash
node <fitme-skill-folder>/scripts/fitme.js status
```

OS-specific alternatives:

```bash
node <fitme-skill-folder>/scripts/fitme.js install-launchd   # macOS
node <fitme-skill-folder>/scripts/fitme.js install-systemd   # Linux
```

Windows:

```powershell
node <fitme-skill-folder>\scripts\fitme.js install-startup
start http://127.0.0.1:8787/health_progress_dashboard.html
```

If you need separate steps:

```bash
node <fitme-skill-folder>/scripts/fitme.js init --sex=male --age=30 --heightCm=175 --weightKg=70
```

3. Start local server and open:

```bash
node <fitme-skill-folder>/scripts/fitme.js start --detach
open http://127.0.0.1:8787/health_progress_dashboard.html
```

4. Install stable boot background service when requested:

```bash
node <fitme-skill-folder>/scripts/fitme.js install-service
```

Then check:

```bash
node <fitme-skill-folder>/scripts/fitme.js status
```

5. Add a confirmed meal:

```bash
node <fitme-skill-folder>/scripts/fitme.js add-meal \
  --type=dinner \
  --title="香煎秋刀鱼能量碗" \
  --description="加鸡胸肉，混合沙拉菜" \
  --kcal=630 --kcalMin=580 --kcalMax=720 \
  --proteinG=54 --proteinMinG=48 --proteinMaxG=60 \
  --fiberG=5 --sodiumMg=820 --calciumMg=120 --potassiumMg=780 \
  --ironMg=2.8 --vitaminCMg=30 --vitaminDMcg=1.2 --vitaminB12Mcg=1.6 \
  --image=/absolute/path/to/photo.jpg \
  --source="订单截图 + 实拍 + 估算"
```

## Estimation Guidance

- Use Mifflin-St Jeor for BMR:
  - Male: `10*kg + 6.25*cm - 5*age + 5`
  - Female: `10*kg + 6.25*cm - 5*age - 161`
- Sedentary maintenance: `BMR * 1.15` to `BMR * 1.2`.
- For fat loss, default daily targets are `1600-1900 kcal` and `90-120g protein`, then adjust to the user's size and goal.
- Use narrow ranges when possible. If uncertain, explain the reason briefly.
- Nutrition dimensions are estimated only for today's decision-making. Prioritize branded labels and reliable nutrition facts; otherwise infer from common food composition and mark the source as estimated.
- For routine advice, focus on the biggest actionable gaps: fiber low -> vegetables/beans/whole grains; sodium high -> less sauce/soup and more water; calcium or vitamin D low -> dairy/soy/tofu/eggs/fish/sunlight; vitamin C low -> fruit/greens.

## Existing Site Behavior

If `detect` returns `found: true`, do not reinitialize. Use `add-meal` for confirmed food, update dashboard data, and keep the reply concise.

If the server is not reachable, run:

```bash
node <fitme-skill-folder>/scripts/fitme.js install-service
```

If static `health_dashboard_data.js` is stale, any `add-meal` or `init` command regenerates it from JSON.
