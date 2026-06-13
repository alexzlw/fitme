#!/usr/bin/env node
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const os = require("os");
const http = require("http");
const { spawn } = require("child_process");

const skillRoot = path.resolve(__dirname, "..");
const assetsRoot = path.join(skillRoot, "assets");
const defaultRoot = path.join(os.homedir(), "Documents", "FitMe");
const defaultPort = 8787;
const isWindows = process.platform === "win32";
const isMac = process.platform === "darwin";
const isLinux = process.platform === "linux";
const serviceName = "fitme-dashboard";

function arg(name, fallback = undefined) {
  const prefix = `--${name}=`;
  const found = process.argv.find(item => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function boolArg(name) {
  return process.argv.includes(`--${name}`);
}

function fitmeRoot() {
  return path.resolve(arg("root", process.env.FITME_ROOT || defaultRoot));
}

function paths(root = fitmeRoot()) {
  return {
    root,
    data: path.join(root, "health_dashboard_data.json"),
    js: path.join(root, "health_dashboard_data.js"),
    html: path.join(root, "health_progress_dashboard.html"),
    server: path.join(root, "health_dashboard_server.js"),
    images: path.join(root, "health_images"),
    log: path.join(root, "fitness_daily_log.md"),
    launchAgent: path.join(os.homedir(), "Library", "LaunchAgents", "com.fitme.dashboard.plist"),
    windowsStarter: path.join(root, "start-fitme.cmd"),
    windowsTaskXml: path.join(root, "fitme-dashboard-task.xml"),
    systemdUserDir: path.join(os.homedir(), ".config", "systemd", "user"),
    systemdUnit: path.join(os.homedir(), ".config", "systemd", "user", "fitme-dashboard.service")
  };
}

function serviceUrl() {
  return `http://127.0.0.1:${arg("port", defaultPort)}/health_progress_dashboard.html`;
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: options.stdio || "pipe", shell: options.shell || false });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", chunk => { stdout += chunk; });
    child.stderr?.on("data", chunk => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", code => {
      if (code === 0 || options.allowFailure) resolve({ code, stdout, stderr });
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}: ${stderr || stdout}`));
    });
  });
}

function requestJson(pathname) {
  const port = Number(arg("port", defaultPort));
  return new Promise(resolve => {
    const req = http.get({
      host: "127.0.0.1",
      port,
      path: pathname,
      timeout: 1500
    }, res => {
      let body = "";
      res.on("data", chunk => { body += chunk; });
      res.on("end", () => {
        try {
          resolve({ ok: res.statusCode === 200, data: JSON.parse(body) });
        } catch {
          resolve({ ok: res.statusCode === 200, data: null });
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve({ ok: false, data: null });
    });
    req.on("error", () => resolve({ ok: false, data: null }));
  });
}

async function checkHttp(root) {
  const status = await requestJson("/api/status");
  if (status.ok && status.data?.root) {
    return {
      ok: true,
      matchesRoot: path.resolve(status.data.root) === path.resolve(root),
      root: status.data.root
    };
  }
  const healthData = await requestJson("/api/health-data");
  return {
    ok: healthData.ok,
    matchesRoot: null,
    root: null
  };
}

function mifflin({ sex, age, heightCm, weightKg }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === "female" ? -161 : 5));
}

function defaultData(profile) {
  const bmr = mifflin(profile);
  const maintenance = [Math.round(bmr * 1.15), Math.round(bmr * 1.2)];
  const today = new Date().toISOString().slice(0, 10);
  return {
    updatedAt: today,
    periodLabel: today,
    profile: {
      sex: profile.sex,
      age: profile.age,
      heightCm: profile.heightCm,
      latestWeightKg: profile.weightKg,
      targetWeightRangeKg: profile.targetWeightRangeKg || [Math.round((profile.weightKg - 2) * 10) / 10, Math.round((profile.weightKg - 1) * 10) / 10],
      bmrKcal: bmr,
      sedentaryMaintenanceKcalRange: maintenance
    },
    targets: {
      dailyKcalRange: profile.dailyKcalRange || [1600, 1900],
      dailyProteinRangeG: profile.dailyProteinRangeG || [90, 120],
      proteinCompletionTargetG: profile.proteinCompletionTargetG || 108
    },
    stats: { proteinQualifiedDays: 0 },
    copy: {
      title: "减脂进度面板",
      overview: "FitMe 已初始化。记录第一餐后，这里会显示当天进度。",
      footnote: "缺口按主估值计算：维持消耗 + 已记录运动 - 摄入。运动消耗不做过度放大，主要看趋势。",
      summary: [
        "先记录今天的第一餐。",
        "优先保证蛋白质，再控制总热量。",
        "所有数据保存在本机 JSON 文件中。"
      ]
    },
    days: []
  };
}

async function exists(file) {
  try {
    await fsp.access(file);
    return true;
  } catch {
    return false;
  }
}

async function readJson(file) {
  return JSON.parse(await fsp.readFile(file, "utf8"));
}

async function writeData(data, p = paths()) {
  data.updatedAt = new Date().toISOString().slice(0, 10);
  await fsp.writeFile(p.data, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fsp.writeFile(p.js, `window.HEALTH_DASHBOARD_DATA = ${JSON.stringify(data, null, 2)};\n`, "utf8");
}

async function init() {
  const p = paths();
  await fsp.mkdir(p.root, { recursive: true });
  await fsp.mkdir(p.images, { recursive: true });
  await fsp.copyFile(path.join(assetsRoot, "health_progress_dashboard.html"), p.html);
  await fsp.copyFile(path.join(assetsRoot, "health_dashboard_server.js"), p.server);
  if (!(await exists(p.log))) {
    await fsp.writeFile(p.log, "# FitMe Daily Log\n\n", "utf8");
  }
  if (!(await exists(p.data))) {
    const required = ["sex", "age", "heightCm", "weightKg"];
    const missing = required.filter(key => arg(key) == null);
    if (missing.length) {
      throw new Error(`Missing required profile args: ${missing.map(key => `--${key}`).join(", ")}`);
    }
    const profile = {
      sex: arg("sex"),
      age: Number(arg("age")),
      heightCm: Number(arg("heightCm")),
      weightKg: Number(arg("weightKg"))
    };
    await writeData(defaultData(profile), p);
  } else {
    const data = await readJson(p.data);
    await writeData(data, p);
  }
  console.log(JSON.stringify({ ok: true, root: p.root, url: serviceUrl() }, null, 2));
}

async function detect() {
  const p = paths();
  const found = await exists(p.data) && await exists(p.html) && await exists(p.server);
  const data = found ? await readJson(p.data) : null;
  console.log(JSON.stringify({
    found,
    root: p.root,
    url: serviceUrl(),
    latestDate: data?.days?.at(-1)?.date || data?.updatedAt || null,
    dayCount: data?.days?.length || 0
  }, null, 2));
}

function start() {
  const p = paths();
  const env = { ...process.env, PORT: String(arg("port", defaultPort)), HOST: "127.0.0.1" };
  const child = spawn(process.execPath, [p.server], {
    cwd: p.root,
    env,
    detached: boolArg("detach"),
    stdio: boolArg("detach") ? "ignore" : "inherit"
  });
  if (boolArg("detach")) child.unref();
  console.log(JSON.stringify({ ok: true, pid: child.pid, url: `http://127.0.0.1:${env.PORT}/health_progress_dashboard.html` }, null, 2));
}

async function installLaunchd() {
  if (!isMac) {
    throw new Error("install-launchd is macOS only. Use install-service for current OS auto-detection.");
  }
  const p = paths();
  await fsp.mkdir(path.dirname(p.launchAgent), { recursive: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.fitme.dashboard</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
    <string>${p.server}</string>
  </array>
  <key>WorkingDirectory</key><string>${p.root}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PORT</key><string>${arg("port", defaultPort)}</string>
    <key>HOST</key><string>127.0.0.1</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>${path.join(p.root, "fitme.log")}</string>
  <key>StandardErrorPath</key><string>${path.join(p.root, "fitme.err.log")}</string>
</dict>
</plist>
`;
  await fsp.writeFile(p.launchAgent, plist, "utf8");
  await run("launchctl", ["bootout", `gui/${process.getuid()}`, p.launchAgent], { allowFailure: true });
  await run("launchctl", ["bootstrap", `gui/${process.getuid()}`, p.launchAgent]);
  await run("launchctl", ["kickstart", "-k", `gui/${process.getuid()}/com.fitme.dashboard`], { allowFailure: true });
  console.log(JSON.stringify({ ok: true, service: "launchd", plist: p.launchAgent, url: serviceUrl() }, null, 2));
}

async function writeWindowsStarter(p = paths()) {
  const port = String(arg("port", defaultPort));
  const script = `@echo off\r\nset PORT=${port}\r\nset HOST=127.0.0.1\r\ncd /d "${p.root}"\r\n"${process.execPath}" "${p.server}"\r\n`;
  await fsp.writeFile(p.windowsStarter, script, "utf8");
  return p.windowsStarter;
}

async function installWindowsStartup() {
  if (!isWindows) {
    throw new Error("install-startup is Windows only. Use install-service for current OS auto-detection.");
  }
  const p = paths();
  await writeWindowsStarter(p);
  const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Description>FitMe local health dashboard</Description>
  </RegistrationInfo>
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <IdleSettings>
      <StopOnIdleEnd>false</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <Enabled>true</Enabled>
    <Hidden>false</Hidden>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
    <RestartOnFailure>
      <Interval>PT1M</Interval>
      <Count>999</Count>
    </RestartOnFailure>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>${escapeXml(p.windowsStarter)}</Command>
      <WorkingDirectory>${escapeXml(p.root)}</WorkingDirectory>
    </Exec>
  </Actions>
</Task>
`;
  await fsp.writeFile(p.windowsTaskXml, `\ufeff${xml}`, "utf16le");
  await run("schtasks.exe", ["/Delete", "/TN", "FitMeDashboard", "/F"], { allowFailure: true });
  await run("schtasks.exe", ["/Create", "/TN", "FitMeDashboard", "/XML", p.windowsTaskXml, "/F"]);
  await run("schtasks.exe", ["/Run", "/TN", "FitMeDashboard"], { allowFailure: true });
  console.log(JSON.stringify({ ok: true, service: "windows-task-scheduler", task: "FitMeDashboard", starter: p.windowsStarter, url: serviceUrl() }, null, 2));
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function installSystemdUser() {
  if (!isLinux) {
    throw new Error("install-systemd is Linux only. Use install-service for current OS auto-detection.");
  }
  const p = paths();
  await fsp.mkdir(p.systemdUserDir, { recursive: true });
  const unit = `[Unit]
Description=FitMe local health dashboard
After=network.target

[Service]
Type=simple
WorkingDirectory=${p.root}
Environment=PORT=${arg("port", defaultPort)}
Environment=HOST=127.0.0.1
ExecStart=${process.execPath} ${p.server}
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
`;
  await fsp.writeFile(p.systemdUnit, unit, "utf8");
  await run("systemctl", ["--user", "daemon-reload"]);
  await run("systemctl", ["--user", "enable", "--now", "fitme-dashboard.service"]);
  await run("loginctl", ["enable-linger", os.userInfo().username], { allowFailure: true });
  console.log(JSON.stringify({ ok: true, service: "systemd-user", unit: p.systemdUnit, url: serviceUrl() }, null, 2));
}

async function installService() {
  await init();
  if (isMac) return installLaunchd();
  if (isWindows) return installWindowsStartup();
  if (isLinux) return installSystemdUser();
  throw new Error(`Unsupported platform for install-service: ${process.platform}`);
}

async function status() {
  const p = paths();
  let service = "manual";
  let serviceState = "unknown";
  if (isMac) {
    const result = await run("launchctl", ["print", `gui/${process.getuid()}/com.fitme.dashboard`], { allowFailure: true });
    service = "launchd";
    serviceState = result.code === 0 && result.stdout.includes("state = running") ? "running" : "not-running";
  } else if (isWindows) {
    const result = await run("schtasks.exe", ["/Query", "/TN", "FitMeDashboard"], { allowFailure: true });
    service = "windows-task-scheduler";
    serviceState = result.code === 0 ? "registered" : "not-registered";
  } else if (isLinux) {
    const result = await run("systemctl", ["--user", "is-active", "fitme-dashboard.service"], { allowFailure: true });
    service = "systemd-user";
    serviceState = result.stdout.trim() || "not-running";
  }
  const httpStatus = await checkHttp(p.root);
  console.log(JSON.stringify({
    ok: true,
    platform: process.platform,
    service,
    serviceState,
    httpOk: httpStatus.ok,
    httpMatchesRoot: httpStatus.matchesRoot,
    httpRoot: httpStatus.root,
    root: p.root,
    url: serviceUrl()
  }, null, 2));
}

async function setup() {
  const p = paths();
  const alreadyFound = await exists(p.data) && await exists(p.html) && await exists(p.server);
  if (boolArg("service")) {
    await installService();
    console.log(JSON.stringify({
      ok: true,
      foundExisting: alreadyFound,
      root: p.root,
      service: true,
      url: serviceUrl()
    }, null, 2));
    return;
  }
  if (!alreadyFound) await init();
  if (isWindows) await writeWindowsStarter(p);
  const service = spawn(process.execPath, [p.server], {
    cwd: p.root,
    env: { ...process.env, PORT: String(arg("port", defaultPort)), HOST: "127.0.0.1" },
    detached: true,
    stdio: "ignore"
  });
  service.unref();
  if (boolArg("launchd")) await installLaunchd();
  else if (boolArg("startup")) await installWindowsStartup();
  console.log(JSON.stringify({
    ok: true,
    foundExisting: alreadyFound,
    root: p.root,
    pid: service.pid,
    url: `http://127.0.0.1:${arg("port", defaultPort)}/health_progress_dashboard.html`
  }, null, 2));
}

async function persistImages(imageArgs, p) {
  const result = [];
  await fsp.mkdir(p.images, { recursive: true });
  for (const source of imageArgs) {
    if (!source) continue;
    if (/^(https?:|data:|blob:)/.test(source)) {
      result.push(source);
      continue;
    }
    const ext = path.extname(source) || ".jpg";
    const name = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(16).slice(2)}${ext}`;
    const dest = path.join(p.images, name);
    await fsp.copyFile(source, dest);
    result.push(`health_images/${name}`);
  }
  return result;
}

async function addMeal() {
  const p = paths();
  const data = await readJson(p.data);
  const date = arg("date", new Date().toISOString().slice(0, 10));
  const type = arg("type", "snack");
  const kcal = Number(arg("kcal", 0));
  const protein = arg("proteinG") == null ? null : Number(arg("proteinG"));
  const title = arg("title", "未命名餐食");
  const description = arg("description", "");
  const source = arg("source", "用户记录");
  const imageArgs = process.argv.filter(item => item.startsWith("--image=")).map(item => item.slice("--image=".length));
  const imagePaths = await persistImages(imageArgs, p);
  const maintenanceAvg = Math.round((data.profile.sedentaryMaintenanceKcalRange[0] + data.profile.sedentaryMaintenanceKcalRange[1]) / 2);

  let day = data.days.find(item => item.date === date);
  if (!day) {
    day = {
      date,
      label: date.slice(5).replace("-", "/"),
      intakeKcal: 0,
      intakeRangeKcal: [0, 0],
      proteinRangeG: [0, 0],
      exerciseLabel: "未记录运动",
      exerciseKcal: 0,
      deficitKcal: maintenanceAvg,
      note: "",
      meals: []
    };
    data.days.push(day);
    data.days.sort((a, b) => a.date.localeCompare(b.date));
  }

  day.meals ||= [];
  day.meals.push({
    id: `${date}-${type}-${Date.now()}`,
    type,
    title,
    description,
    kcal,
    kcalRange: [Number(arg("kcalMin", kcal)), Number(arg("kcalMax", kcal))],
    proteinRangeG: protein == null ? null : [Number(arg("proteinMinG", protein)), Number(arg("proteinMaxG", protein))],
    imagePaths,
    source
  });

  day.intakeKcal = day.meals.reduce((sum, meal) => sum + Number(meal.kcal || 0), 0);
  day.intakeRangeKcal = [
    day.meals.reduce((sum, meal) => sum + Number(meal.kcalRange?.[0] ?? meal.kcal ?? 0), 0),
    day.meals.reduce((sum, meal) => sum + Number(meal.kcalRange?.[1] ?? meal.kcal ?? 0), 0)
  ];
  const proteinMeals = day.meals.filter(meal => meal.proteinRangeG);
  day.proteinRangeG = [
    proteinMeals.reduce((sum, meal) => sum + Number(meal.proteinRangeG[0]), 0),
    proteinMeals.reduce((sum, meal) => sum + Number(meal.proteinRangeG[1]), 0)
  ];
  day.deficitKcal = maintenanceAvg + Number(day.exerciseKcal || 0) - day.intakeKcal;
  day.note = day.meals.map(meal => `${mealLabels(meal.type)}：${meal.title}`).join("；");

  data.periodLabel = `${data.days[0]?.date || date}-${data.days.at(-1)?.date || date}`;
  data.stats.proteinQualifiedDays = data.days.filter(item => item.proteinRangeG?.[1] >= data.targets.dailyProteinRangeG[0]).length;
  data.copy.overview = `今天已记录 ${day.intakeKcal} kcal，蛋白约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`;
  data.copy.summary = [
    `今天目前摄入约 ${day.intakeKcal} kcal。`,
    `蛋白质目前约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`,
    "继续按当天目标调整下一餐。"
  ];
  await writeData(data, p);
  await fsp.appendFile(p.log, `\n## ${date}\n- ${mealLabels(type)}：${title}，约 ${kcal} kcal${protein == null ? "" : `，蛋白约 ${protein}g`}。\n`, "utf8");
  console.log(JSON.stringify({ ok: true, date, intakeKcal: day.intakeKcal, proteinRangeG: day.proteinRangeG }, null, 2));
}

function mealLabels(type) {
  return ({ breakfast: "早餐", lunch: "午餐", dinner: "晚餐", snack: "加餐/饮品", summary: "汇总" })[type] || "餐食";
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === "detect") return detect();
  if (cmd === "init") return init();
  if (cmd === "setup") return setup();
  if (cmd === "status") return status();
  if (cmd === "start") return start();
  if (cmd === "install-service") return installService();
  if (cmd === "install-launchd") return installLaunchd();
  if (cmd === "install-startup") return installWindowsStartup();
  if (cmd === "install-systemd") return installSystemdUser();
  if (cmd === "add-meal") return addMeal();
  throw new Error("Usage: fitme.js detect|init|setup|status|start|install-service|install-launchd|install-startup|install-systemd|add-meal [--root=...]");
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
});
