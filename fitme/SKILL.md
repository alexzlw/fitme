---
name: fitme
description: Use when a user wants a local persistent diet, calorie, protein, exercise, or health dashboard; asks to initialize FitMe from height/weight/sex/age; asks to record today's meals into an existing FitMe site; or wants a local web page with images, daily meal details, long-term deficit calendar, and boot auto-start.
---

# FitMe

FitMe is a reusable local health tracker: a persistent web dashboard plus JSON-backed food/exercise logging. Use it to initialize a user's local dashboard, detect an existing dashboard, and append confirmed meals to today's record.

## Core Rules

- Only record confirmed intake: “吃了/喝了/吃完了” counts; “打算/能不能/选哪个” does not.
- Branded/package items: use visible label or reliable/official nutrition data first; estimate only when unavailable.
- Store source and uncertainty: every meal should have `kcal`, optional `kcalRange`, optional `proteinRangeG`, and `source`.
- Persist images: copy local image files into `health_images/` before writing `imagePaths`; never depend on chat/temp paths.
- Keep replies short for routine updates: “已记录：今日约 X kcal，蛋白约 Y-Zg。”

## Dashboard Design

The dashboard is a local HTML/CSS/JS app with:

- iOS Liquid Glass inspired transparent panels.
- Top metrics: daily intake, protein, exercise, cumulative deficit.
- Long-term deficit calendar: one square per day; darker color means larger deficit.
- Deficit trend timeline.
- Daily meal detail panel: expandable days, filters by breakfast/lunch/dinner/snack, each meal shows image, text, kcal, protein, and source.

## Storage Layout

Default root:

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
    "proteinCompletionTargetG": 108
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
          "imagePaths": ["health_images/example.jpg"],
          "source": "订单截图 + 实拍 + 估算"
        }
      ]
    }
  ]
}
```

## Workflow

1. Detect existing dashboard first:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js detect
```

2. If not found, ask only for required baseline:

```text
性别、年龄、身高cm、体重kg
```

Then initialize and start in one step:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js setup --sex=male --age=30 --heightCm=175 --weightKg=70
open http://127.0.0.1:8787/health_progress_dashboard.html
```

For setup with boot auto-start:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js setup --sex=male --age=30 --heightCm=175 --weightKg=70 --launchd
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.codex.fitme.plist
open http://127.0.0.1:8787/health_progress_dashboard.html
```

If you need separate steps:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js init --sex=male --age=30 --heightCm=175 --weightKg=70
```

3. Start local server and open:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js start --detach
open http://127.0.0.1:8787/health_progress_dashboard.html
```

4. Install macOS boot background service when requested:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js install-launchd
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.codex.fitme.plist
```

5. Add a confirmed meal:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js add-meal \
  --type=dinner \
  --title="香煎秋刀鱼能量碗" \
  --description="加鸡胸肉，混合沙拉菜" \
  --kcal=630 --kcalMin=580 --kcalMax=720 \
  --proteinG=54 --proteinMinG=48 --proteinMaxG=60 \
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

## Existing Site Behavior

If `detect` returns `found: true`, do not reinitialize. Use `add-meal` for confirmed food, update dashboard data, and keep the reply concise.

If the server is not reachable, run:

```bash
node ~/.codex/skills/fitme/scripts/fitme.js start --detach
```

If static `health_dashboard_data.js` is stale, any `add-meal` or `init` command regenerates it from JSON.
