"use client";

import React, { useState, useEffect, useRef } from "react";

const getLocalDateStr = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface Meal {
  id: string;
  type: string;
  title: string;
  description: string;
  kcal: number;
  kcalRange?: [number, number];
  proteinRangeG?: [number, number] | null;
  imagePaths?: string[];
  source?: string;
  nutrition?: Record<string, number>;
}

interface BowelMovementLog {
  id: string;
  time: string;
  type: "normal" | "loose" | "constipated";
  note?: string;
}

interface PeriodLog {
  flow: "light" | "medium" | "heavy";
  note?: string;
}

interface DayLog {
  date: string;
  label: string;
  intakeKcal: number;
  intakeRangeKcal: [number, number];
  proteinRangeG: [number, number];
  exerciseLabel: string;
  exerciseKcal: number;
  deficitKcal: number;
  note: string;
  meals: Meal[];
  nutrition?: Record<string, number> | null;
  nutritionConfidence?: string;
  nutritionAdvice?: string[];
  fastingDurationHours?: number;
  period?: PeriodLog | null;
  bowelMovements?: BowelMovementLog[];
  weightKg?: number;
  hungerAttacks?: {
    succeeded: number;
    failed: number;
    events?: Array<{ timestamp: string; succeeded: boolean }>;
  };
}

interface Profile {
  sex: string;
  age: number;
  heightCm: number;
  latestWeightKg: number;
  targetWeightRangeKg?: [number, number];
  bmrKcal: number;
  sedentaryMaintenanceKcalRange: [number, number];
}

interface Targets {
  dailyKcalRange: [number, number];
  dailyProteinRangeG: [number, number];
  proteinCompletionTargetG: number;
  nutrition?: {
    fiberG?: [number, number];
    sodiumMgMax?: number;
    calciumMg?: [number, number];
    potassiumMg?: [number, number];
    ironMg?: [number, number];
    vitaminCMg?: [number, number];
    vitaminDMcg?: [number, number];
    vitaminB12Mcg?: [number, number];
  };
}

interface FitMeData {
  updatedAt: string;
  periodLabel: string;
  profile: Profile;
  targets: Targets;
  stats: {
    proteinQualifiedDays: number;
  };
  copy: {
    title: string;
    overview: string;
    footnote: string;
    summary: string[];
  };
  days: DayLog[];
  fastingState?: {
    startTime: string | null;
  };
}

const mealLabels: Record<string, string> = {
  all: "全部",
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐/饮品"
};

const nutritionFields = [
  "fiberG",
  "sodiumMg",
  "calciumMg",
  "potassiumMg",
  "ironMg",
  "vitaminCMg",
  "vitaminDMcg",
  "vitaminB12Mcg"
];

const translations = {
  en: {
    lockTitle: "Secure Access",
    lockPasscode: "Enter Passcode",
    lockPlaceholder: "e.g., 1234",
    lockError: "Incorrect passcode, please try again",
    lockButton: "Unlock Dashboard",
    onboardTitle: "Configure Profile",
    onboardAge: "Age",
    onboardHeight: "Height (cm)",
    onboardWeight: "Weight (kg)",
    onboardTarget: "Target Weight (kg, optional)",
    onboardTargetPlaceholder: "Leave blank for current - 5kg",
    onboardSex: "Sex",
    onboardMale: "Male",
    onboardFemale: "Female",
    onboardSubmit: "Save & Generate Plan",
    onboardSaving: "Initializing...",
    brandSub: "Body Log",
    topTitle: "FitMe Dashboard",
    topEyebrow: "Today: {date}",
    topSubcopy: "Track fasting, weight, period, and bowel movements in one clean view.",
    weightLabel: "WEIGHT",
    goalLabel: "GOAL",
    fastActive: "🔥 Fasting Active",
    fastIdle: "⏸️ Not Fasting",
    fastElapsed: "Elapsed Time",
    fastCalculating: "Calculating...",
    fastStart: "Start Fasting",
    fastEnd: "End Fasting",
    fastSaving: "Saving...",
    hungerAttackBtn: "⚠️ Hunger Attack",
    hungerTitle: "Hunger Attack!",
    hungerDesc: "How did you handle the hunger just now?",
    hungerResistSuccess: "✅ Resisted Successfully",
    hungerResistFail: "❌ Failed (Ate Something)",
    hungerStats: "Hunger Resistances",
    hungerStatFormat: "Success: {S} | Fail: {F}",
    sumTitle: "Today's Summary",
    sumFasting: "Fasting Today",
    sumFastingUnit: "hours",
    sumFastingNote: "Completed fasting duration today",
    sumWeight: "Weight Logged",
    sumWeightNoteActive: "Weight recorded today",
    sumWeightNoteInactive: "Using latest weight record",
    periodTitle: "🌸 Period Log",
    periodSwitchNone: "Non-Period Day ⏸️",
    periodSwitchLight: "Period: Light 🌸",
    periodSwitchMedium: "Period: Medium 🌸🌸",
    periodSwitchHeavy: "Period: Heavy 🌸🌸🌸",
    periodActive: "Period Day {X}",
    periodInactive: "Non-Period Status",
    periodFlowLight: "Light",
    periodFlowMedium: "Medium",
    periodFlowHeavy: "Heavy",
    periodNoteActive: "Current Flow: {F}",
    periodNoteInactive: "Select flow above to record period flow",
    bowelTitle: "💩 Bowel Movement Log",
    bowelButton: "💩 Log Bowel",
    bowelCount: "Bowel movements today: {X}",
    bowelEmpty: "No bowel movements logged today",
    weightTitle: "⚖️ Weight Log",
    weightPlaceholder: "e.g., 65.4",
    weightButton: "Save",
    weightNoteActive: "Weight recorded today",
    weightNoteInactive: "Latest weight: {X} kg",
    weightNotRecorded: "Not Recorded",
    chartTitle: "Data Analysis & Trends",
    chartFasting: "Fasting",
    chartPeriod: "Period",
    chartBowel: "Bowel",
    chartWeight: "Weight",
    chartWillpower: "Willpower",
    hungerLatest: "Latest",
    chartEmpty: "📊 No trend data available",
    chartEmptyNote: "Record your stats to generate trends.",
    chartFastingTarget: "16h Fasting Target",
    chartBowelUnit: "times",
    chartPeriodLabel0: "No Period",
    chartPeriodLabel1: "Light",
    chartPeriodLabel2: "Medium",
    chartPeriodLabel3: "Heavy",
    retroTitle: "Retroactive Log",
    retroFasting: "Fasting",
    retroBowel: "Bowel",
    retroDate: "Date",
    retroStart: "Start",
    retroEnd: "End",
    retroTime: "Time",
    retroSubmit: "Save Log",
    settingsButton: "⚙️ Settings",
    settingsTitle: "Settings",
    settingsLang: "Language",
    settingsClose: "Close",
    settingsSaveProfile: "Save Profile"
  },
  zh: {
    lockTitle: "安全访问",
    lockPasscode: "输入安全密码",
    lockPlaceholder: "例如 1234",
    lockError: "密码校验错误，请重新输入",
    lockButton: "进入健康看板",
    onboardTitle: "初始化个人健康档案",
    onboardAge: "年龄",
    onboardHeight: "身高 (cm)",
    onboardWeight: "当前体重 (kg)",
    onboardTarget: "目标体重 (kg, 可选)",
    onboardTargetPlaceholder: "留空则默认为当前体重减 5kg",
    onboardSex: "性别",
    onboardMale: "男",
    onboardFemale: "女",
    onboardSubmit: "生成我的健康计划",
    onboardSaving: "正在初始化...",
    brandSub: "身体记录",
    topTitle: "FitMe 健康看板",
    topEyebrow: "今日：{date}",
    topSubcopy: "专注断食时间、每日体重、经期生理和排便状况的健康追踪管理。",
    weightLabel: "当前体重",
    goalLabel: "目标体重",
    fastActive: "🔥 断食燃烧中",
    fastIdle: "⏸️ 尚未断食",
    fastElapsed: "已断食时长",
    fastCalculating: "计算中...",
    fastStart: "开始断食",
    fastEnd: "结束断食",
    fastSaving: "保存中...",
    hungerAttackBtn: "⚠️ 饥饿攻击",
    hungerTitle: "遭遇饥饿攻击！",
    hungerDesc: "你刚才成功抵御饥饿了吗？",
    hungerResistSuccess: "✅ 抵抗成功",
    hungerResistFail: "❌ 抵抗失败 (吃了东西)",
    hungerStats: "饥饿抵抗战况",
    hungerStatFormat: "成功: {S} | 失败: {F}",
    sumTitle: "今日记录总览",
    sumFasting: "今日累计断食",
    sumFastingUnit: "小时",
    sumFastingNote: "今日已完成断食计时时长",
    sumWeight: "今日体重记录",
    sumWeightNoteActive: "今日已称重记录",
    sumWeightNoteInactive: "使用最近一次体重数据",
    periodTitle: "生理期追踪",
    periodSwitchNone: "非经期 ⏸️",
    periodSwitchLight: "经期：流量偏少 🌸",
    periodSwitchMedium: "经期：流量中等 🌸🌸",
    periodSwitchHeavy: "经期：流量偏多 🌸🌸🌸",
    periodActive: "经期中 · 第 {X} 天",
    periodInactive: "非经期状态",
    periodFlowLight: "偏少",
    periodFlowMedium: "中等",
    periodFlowHeavy: "偏多",
    periodNoteActive: "当前流量：{F}",
    periodNoteInactive: "若经期来潮，请在上方选择流量进行记录",
    bowelTitle: "💩 每日排便记录",
    bowelButton: "💩 记一次排便",
    bowelCount: "今日已排便 {X} 次",
    bowelEmpty: "今日暂无排便记录",
    weightTitle: "⚖️ 今日体重记录",
    weightPlaceholder: "例如 65.4",
    weightButton: "保存",
    weightNoteActive: "今日已记录体重",
    weightNoteInactive: "最近体重: {X} kg",
    weightNotRecorded: "未记录",
    chartTitle: "数据分析统计",
    chartFasting: "断食",
    chartPeriod: "生理期",
    chartBowel: "排便",
    chartWeight: "体重",
    chartWillpower: "意志力",
    hungerLatest: "最近一次",
    chartEmpty: "📊 暂无历史趋势数据",
    chartEmptyNote: "开始记录断食与生理体征后，图表将自动生成。",
    chartFastingTarget: "16h 断食目标线",
    chartBowelUnit: "次",
    chartPeriodLabel0: "非经期",
    chartPeriodLabel1: "偏少",
    chartPeriodLabel2: "中等",
    chartPeriodLabel3: "偏多",
    retroTitle: "漏打卡补签",
    retroFasting: "断食记录",
    retroBowel: "排便记录",
    retroDate: "补签日期",
    retroStart: "开始时间",
    retroEnd: "结束时间",
    retroTime: "打卡时间",
    retroSubmit: "确认补签",
    settingsButton: "⚙️ 设置",
    settingsTitle: "设置",
    settingsLang: "语言",
    settingsClose: "关闭",
    settingsSaveProfile: "保存配置"
  },
  ja: {
    lockTitle: "安全なアクセス",
    lockPasscode: "パスコードを入力",
    lockPlaceholder: "例：1234",
    lockError: "パスコードが正しくありません",
    lockButton: "解除する",
    onboardTitle: "プロフィールの初期設定",
    onboardAge: "年齢",
    onboardHeight: "身長 (cm)",
    onboardWeight: "現在の体重 (kg)",
    onboardTarget: "目標体重 (kg, 任意)",
    onboardTargetPlaceholder: "空欄の場合は現在の体重 -5kg",
    onboardSex: "性別",
    onboardMale: "男性",
    onboardFemale: "女性",
    onboardSubmit: "プランを生成",
    onboardSaving: "初期化中...",
    brandSub: "身体記録",
    topTitle: "FitMe ダッシュボード",
    topEyebrow: "本日：{date}",
    topSubcopy: "断食时间、体重、生理周期、便通の健康管理ダッシュボード。",
    weightLabel: "現在",
    goalLabel: "目標",
    fastActive: "🔥 断食実行中",
    fastIdle: "⏸️ 断食していません",
    fastElapsed: "経過時間",
    fastCalculating: "計算中...",
    fastStart: "断食開始",
    fastEnd: "断食終了",
    fastSaving: "保存中...",
    hungerAttackBtn: "⚠️ 空腹感の襲来",
    hungerTitle: "空腹感の襲来！",
    hungerDesc: "空腹感を乗り越えられましたか？",
    hungerResistSuccess: "✅ 耐え抜いた",
    hungerResistFail: "❌ 負けた (食べてしまった)",
    hungerStats: "空腹感との戦い",
    hungerStatFormat: "成功: {S} | 失敗: {F}",
    sumTitle: "本日のサマリー",
    sumFasting: "本日の断食",
    sumFastingUnit: "時間",
    sumFastingNote: "本日終了した断食時間",
    sumWeight: "本日の体重",
    sumWeightNoteActive: "本日記録済み",
    sumWeightNoteInactive: "前回のデータを使用",
    periodTitle: "生理周期トラッカー",
    periodSwitchNone: "生理期間外 ⏸️",
    periodSwitchLight: "生理：経血量少なめ 🌸",
    periodSwitchMedium: "生理：経血量ふつう 🌸🌸",
    periodSwitchHeavy: "生理：経血量多め 🌸🌸🌸",
    periodActive: "生理 {X} 日目",
    periodInactive: "生理期間外",
    periodFlowLight: "少量",
    periodFlowMedium: "ふつう",
    periodFlowHeavy: "多量",
    periodNoteActive: "現在の経血量：{F}",
    periodNoteInactive: "生理が始まったら、上で経血量を選択してください",
    bowelTitle: "💩 便通記録",
    bowelButton: "💩 便通を記録",
    bowelCount: "本日 {X} 回便通あり",
    bowelEmpty: "本日の記録はありません",
    weightTitle: "⚖️ 体重記録",
    weightPlaceholder: "例：65.4",
    weightButton: "保存",
    weightNoteActive: "本日記録済み",
    weightNoteInactive: "前回の体重: {X} kg",
    weightNotRecorded: "未記録",
    chartTitle: "データ分析推移",
    chartFasting: "断食",
    chartPeriod: "生理",
    chartBowel: "排便",
    chartWeight: "体重",
    chartWillpower: "意志力",
    hungerLatest: "最新",
    chartEmpty: "📊 履歴データがありません",
    chartEmptyNote: "断食や体重の记录を開始すると、グラフが自動生成されます。",
    chartFastingTarget: "16h 断食目標線",
    chartBowelUnit: "回",
    chartPeriodLabel0: "生理日外",
    chartPeriodLabel1: "少量",
    chartPeriodLabel2: "ふつう",
    chartPeriodLabel3: "多量",
    retroTitle: "記録の追加",
    retroFasting: "断食記録",
    retroBowel: "便通記録",
    retroDate: "日付",
    retroStart: "開始時間",
    retroEnd: "終了時間",
    retroTime: "時間",
    retroSubmit: "保存する",
    settingsButton: "⚙️ 設定",
    settingsTitle: "設定",
    settingsLang: "言語",
    settingsClose: "閉じる",
    settingsSaveProfile: "プロフィール保存"
  }
};

export default function FitMeDashboard() {
  // Authentication state
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [shake, setShake] = useState(false);

  // Core data states
  const [data, setData] = useState<FitMeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMealFilter, setActiveMealFilter] = useState("all");

  // Modal & Form States
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isHungerModalOpen, setIsHungerModalOpen] = useState(false);
  const [isHungerSaving, setIsHungerSaving] = useState(false);

  // Retroactive Logging State
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [retroType, setRetroType] = useState<"fasting" | "bowel">("fasting");
  const [retroDate, setRetroDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return getLocalDateStr(d);
  });
  const [retroStartTime, setRetroStartTime] = useState("20:00");
  const [retroEndTime, setRetroEndTime] = useState("12:00");
  const [retroBowelTime, setRetroBowelTime] = useState("08:00");
  const [isRetroSaving, setIsRetroSaving] = useState(false);

  // Onboarding setup state
  const [setupSex, setSetupSex] = useState("male");
  const [setupAge, setSetupAge] = useState("");
  const [setupHeight, setSetupHeight] = useState("");
  const [setupWeight, setSetupWeight] = useState("");
  const [setupTargetWeight, setSetupTargetWeight] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Fasting Tracking state
  const [fastingElapsed, setFastingElapsed] = useState("");
  const [isFastingSaving, setIsFastingSaving] = useState(false);

  // Active chart tab (fasting | period | bowel | weight)
  const [activeChartTab, setActiveChartTab] = useState<"fasting" | "period" | "bowel" | "weight" | "willpower">("fasting");
  const [isVitalsSaving, setIsVitalsSaving] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  // Multi-language & Settings state
  const [lang, setLang] = useState<"en" | "zh" | "ja">("en");
  const [showSettings, setShowSettings] = useState(false);

  const t = (key: string, variables?: Record<string, any>) => {
    const text = (translations[lang] as any)?.[key] || (translations["en"] as any)?.[key] || key;
    if (!variables) return text;
    let result = text;
    for (const [k, v] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return result;
  };

  // Form Fields
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("breakfast");
  const [formTitle, setFormTitle] = useState("");
  const [formKcal, setFormKcal] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Settings form fields
  const [settingsSex, setSettingsSex] = useState("male");
  const [settingsAge, setSettingsAge] = useState("");
  const [settingsHeight, setSettingsHeight] = useState("");
  const [settingsTargetWeight, setSettingsTargetWeight] = useState("");
  
  const handleDeleteMeal = (dateStr: string, mealId: string) => {
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      const dayLog = days.find(d => d.date === dateStr);
      if (!dayLog) return latest;
      
      dayLog.meals = dayLog.meals.filter(m => m.id !== mealId);
      
      const maintenanceAvg = Math.round(
        (latest.profile.sedentaryMaintenanceKcalRange[0] +
          latest.profile.sedentaryMaintenanceKcalRange[1]) /
          2
      );
      
      dayLog.intakeKcal = dayLog.meals.reduce((sum, m) => sum + Number(m.kcal || 0), 0);
      dayLog.intakeRangeKcal = [
        dayLog.meals.reduce((sum, m) => sum + Number(m.kcalRange?.[0] ?? m.kcal ?? 0), 0),
        dayLog.meals.reduce((sum, m) => sum + Number(m.kcalRange?.[1] ?? m.kcal ?? 0), 0)
      ];
      
      const proteinMeals = dayLog.meals.filter(m => m.proteinRangeG);
      dayLog.proteinRangeG = [
        proteinMeals.reduce((sum, m) => sum + Number(m.proteinRangeG![0]), 0),
        proteinMeals.reduce((sum, m) => sum + Number(m.proteinRangeG![1]), 0)
      ];
      
      dayLog.deficitKcal = maintenanceAvg + Number(dayLog.exerciseKcal || 0) - dayLog.intakeKcal;
      dayLog.note = dayLog.meals.map(m => `${mealLabels[m.type] || "餐食"}：${m.title}`).join("；");
      
      dayLog.nutrition = summarizeNutrition(dayLog.meals);
      dayLog.nutritionConfidence = dayLog.nutrition ? "estimated" : undefined;
      dayLog.nutritionAdvice = getNutritionAdvice(dayLog.nutrition, latest.targets.nutrition);
      
      return latest;
    });
  };

  // Image Upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Optional Nutrient Fields
  const [showNutritionFields, setShowNutritionFields] = useState(false);
  const [nutrients, setNutrients] = useState<Record<string, string>>({
    fiberG: "",
    sodiumMg: "",
    calciumMg: "",
    potassiumMg: "",
    ironMg: "",
    vitaminCMg: "",
    vitaminDMcg: "",
    vitaminB12Mcg: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initial authentication check
    const cached = localStorage.getItem("fitme_passcode");
    if (cached) {
      fetchData(cached);
    } else {
      setAuthenticated(false);
      setLoading(false);
    }
    
    // Set default form date to today
    setFormDate(getLocalDateStr());

    // Load cached language (default to en)
    const cachedLang = localStorage.getItem("fitme_lang") as "en" | "zh" | "ja" | null;
    if (cachedLang && ["en", "zh", "ja"].includes(cachedLang)) {
      setLang(cachedLang);
    } else {
      setLang("en");
    }
  }, []);

  // Fasting Timer Effect
  useEffect(() => {
    if (!data?.fastingState?.startTime) {
      setFastingElapsed("");
      return;
    }
    const updateTimer = () => {
      const start = new Date(data.fastingState!.startTime!).getTime();
      const now = new Date().getTime();
      const diffMs = Math.max(0, now - start);
      
      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      
      setFastingElapsed(`${hours}h ${mins}m ${secs}s`);
    };
    
    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.fastingState?.startTime]);

  const mutateData = async (
    mutationFn: (latestData: FitMeData) => FitMeData | Promise<FitMeData>,
    setLoadingState?: (state: boolean) => void,
    onSuccess?: () => void
  ) => {
    if (setLoadingState) setLoadingState(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const getRes = await fetch("/api/health-data", { headers: { "x-fitme-passcode": activeCode } });
      if (!getRes.ok) throw new Error("同步最新数据失败: " + await getRes.text());
      const latestData: FitMeData = await getRes.json();
      
      const updatedData = await mutationFn(latestData);
      
      const postRes = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!postRes.ok) throw new Error(await postRes.text());
      
      setData(updatedData);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      alert("保存失败: " + e.message);
    } finally {
      if (setLoadingState) setLoadingState(false);
    }
  };

  const applyFastingDuration = (startMs: number, endMs: number, latestData: FitMeData) => {
    const daysArr = latestData.days || [];
    latestData.days = daysArr;
    let currentMs = startMs;
    while (currentMs < endMs) {
      const dateObj = new Date(currentMs);
      const dateStr = getLocalDateStr(dateObj);
      
      const nextDayMs = new Date(dateStr + "T00:00:00.000Z").getTime() + 86400000;
      const chunkEndMs = Math.min(nextDayMs, endMs);
      const chunkHours = (chunkEndMs - currentMs) / (1000 * 3600);
      
      let dayLog = daysArr.find(d => d.date === dateStr);
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: Math.round(((latestData.profile.sedentaryMaintenanceKcalRange[0] + latestData.profile.sedentaryMaintenanceKcalRange[1]) / 2)),
          note: "", meals: [],
          fastingDurationHours: 0
        };
        daysArr.push(dayLog);
      }
      dayLog.fastingDurationHours = (dayLog.fastingDurationHours || 0) + chunkHours;
      dayLog.fastingDurationHours = Math.min(24, dayLog.fastingDurationHours);
      
      currentMs = chunkEndMs;
    }
  };

  const handleStartFast = () => {
    mutateData((latest) => ({
      ...latest,
      fastingState: { startTime: new Date().toISOString() }
    }), setIsFastingSaving);
  };

  const handleEndFast = () => {
    if (!data?.fastingState?.startTime) return;
    mutateData((latest) => {
      if (!latest.fastingState?.startTime) return latest;
      const start = new Date(latest.fastingState.startTime).getTime();
      const now = new Date().getTime();
      applyFastingDuration(start, now, latest);
      latest.fastingState = { startTime: null };
      return latest;
    }, setIsFastingSaving);
  };

  const handleHungerResult = (succeeded: boolean) => {
    mutateData((latest) => {
      const todayStr = getLocalDateStr();
      const days = latest.days || [];
      latest.days = days;
      let todayLog = days.find(d => d.date === todayStr);
      
      if (!todayLog) {
        todayLog = {
          date: todayStr,
          label: todayStr.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: Math.round(((latest.profile.sedentaryMaintenanceKcalRange[0] + latest.profile.sedentaryMaintenanceKcalRange[1]) / 2)),
          note: "", meals: [],
          fastingDurationHours: 0,
          hungerAttacks: { succeeded: 0, failed: 0 }
        };
        days.push(todayLog);
      }
      
      if (!todayLog.hungerAttacks) {
        todayLog.hungerAttacks = { succeeded: 0, failed: 0, events: [] };
      }
      if (!todayLog.hungerAttacks.events) {
        todayLog.hungerAttacks.events = [];
      }
      
      if (succeeded) {
        todayLog.hungerAttacks.succeeded += 1;
      } else {
        todayLog.hungerAttacks.failed += 1;
      }
      
      todayLog.hungerAttacks.events.push({
        timestamp: new Date().toISOString(),
        succeeded
      });
      
      if (!succeeded && latest.fastingState?.startTime) {
        const start = new Date(latest.fastingState.startTime).getTime();
        const now = new Date().getTime();
        applyFastingDuration(start, now, latest);
        latest.fastingState = { startTime: null };
      }
      return latest;
    }, setIsHungerSaving, () => setIsHungerModalOpen(false));
  };

  const handleRetroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!retroDate) return;
    
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      
      let targetDay = days.find(d => d.date === retroDate);
      if (!targetDay) {
        targetDay = {
          date: retroDate,
          label: retroDate.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: Math.round(((latest.profile.sedentaryMaintenanceKcalRange[0] + latest.profile.sedentaryMaintenanceKcalRange[1]) / 2)),
          note: "", meals: [],
          fastingDurationHours: 0
        };
        days.push(targetDay);
      }

      if (retroType === "bowel") {
        const newLog: BowelMovementLog = {
          id: Math.random().toString(36).substr(2, 9),
          time: retroBowelTime,
          type: "normal"
        };
        targetDay.bowelMovements = [...(targetDay.bowelMovements || []), newLog];
      } else if (retroType === "fasting") {
        const startMs = new Date(`${retroDate}T${retroStartTime}:00`).getTime();
        let endMs = new Date(`${retroDate}T${retroEndTime}:00`).getTime();
        if (endMs <= startMs) {
          endMs += 86400000;
        }
        applyFastingDuration(startMs, endMs, latest);
      }

      return latest;
    }, setIsRetroSaving, () => setIsRetroModalOpen(false));
  };

  const handleOpenSettings = () => {
    if (data) {
      setSettingsSex(data.profile.sex);
      setSettingsAge(data.profile.age.toString());
      setSettingsHeight(data.profile.heightCm.toString());
      setSettingsTargetWeight(data.profile.targetWeightRangeKg?.[0]?.toString() || "");
      setShowSettings(true);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const age = parseInt(settingsAge);
    const height = parseFloat(settingsHeight);
    const targetW = parseFloat(settingsTargetWeight);
    if (isNaN(age) || isNaN(height)) {
      alert("请输入有效的年龄和身高");
      return;
    }
    
    mutateData((latest) => {
      const newTarget: [number, number] = isNaN(targetW) ? [latest.profile.latestWeightKg - 5, latest.profile.latestWeightKg - 5] : [targetW, targetW];
      latest.profile = {
        ...latest.profile,
        sex: settingsSex,
        age,
        heightCm: height,
        targetWeightRangeKg: newTarget
      };
      return latest;
    }, setIsVitalsSaving, () => setShowSettings(false));
  };

  const calculatePeriodDay = (dateStr: string) => {
    if (!data) return 1;
    let count = 0;
    let current = new Date(dateStr);
    
    while (true) {
      const currentStr = getLocalDateStr(current);
      const log = data.days.find(d => d.date === currentStr);
      if (log && log.period) {
        count++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return count > 0 ? count : 1;
  };

  const handleTogglePeriod = (dateStr: string, flow: "light" | "medium" | "heavy" | null) => {
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      let dayLog = days.find(d => d.date === dateStr);
      
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: 0,
          note: "", meals: [],
          period: flow ? { flow } : null
        };
        days.push(dayLog);
      } else {
        dayLog.period = flow ? { flow } : null;
      }
      return latest;
    }, setIsVitalsSaving);
  };

  const handleQuickBowelMovement = (dateStr: string, type: "normal" | "loose" | "constipated" = "normal") => {
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      let dayLog = days.find(d => d.date === dateStr);
      
      const newLog: BowelMovementLog = {
        id: Math.random().toString(36).slice(2, 9),
        time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        type
      };
      
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: 0,
          note: "", meals: [],
          bowelMovements: [newLog]
        };
        days.push(dayLog);
      } else {
        dayLog.bowelMovements = [...(dayLog.bowelMovements || []), newLog];
      }
      return latest;
    }, setIsVitalsSaving);
  };

  const handleDeleteBowelMovement = (dateStr: string, itemId: string) => {
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      const dayLog = days.find(d => d.date === dateStr);
      if (dayLog) {
        dayLog.bowelMovements = (dayLog.bowelMovements || []).filter(item => item.id !== itemId);
      }
      return latest;
    }, setIsVitalsSaving);
  };

  const handleSaveWeight = (dateStr: string, weight: number) => {
    mutateData((latest) => {
      const days = latest.days || [];
      latest.days = days;
      let dayLog = days.find(d => d.date === dateStr);
      
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动", exerciseKcal: 0,
          deficitKcal: 0,
          note: "", meals: [],
          weightKg: weight
        };
        days.push(dayLog);
      } else {
        dayLog.weightKg = weight;
      }
      
      latest.profile.latestWeightKg = weight;
      return latest;
    }, setIsVitalsSaving);
  };

  const renderStatsChart = () => {
    const last10Days = [...(data?.days || [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    if (last10Days.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--sk-mech)" }}>
          <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-ui)" }}>{t("chartEmpty")}</p>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>{t("chartEmptyNote")}</p>
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const padLeft = 45;
    const padRight = 20;
    const padTop = 25;
    const padBot = 25;
    const cWidth = width - padLeft - padRight;
    const cHeight = height - padTop - padBot;
    const numDays = last10Days.length;
    
    const barWidth = Math.min(16, (cWidth / numDays) * 0.4);
    const getX = (index: number) => {
      const step = cWidth / (numDays || 1);
      return padLeft + index * step + step / 2;
    };

    // Render Grid Helper
    const renderGridPattern = () => (
      <defs>
        <pattern id="chartGrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(26, 26, 24, 0.05)" strokeWidth="1" />
        </pattern>
      </defs>
    );

    if (activeChartTab === "fasting") {
      const maxVal = Math.max(...last10Days.map(d => d.fastingDurationHours || 0), 24);
      const getY = (val: number) => cHeight + padTop - (val / maxVal) * cHeight;
      const targetY = getY(16);

      return (
        <div className="grid-paper" style={{ width: "100%" }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
            {renderGridPattern()}
            <rect x={padLeft} y={padTop} width={cWidth} height={cHeight} fill="url(#chartGrid)" stroke="rgba(26, 26, 24, 0.15)" strokeWidth={1} />

            {[0, 6, 12, 18, 24].map(h => {
              if (h > maxVal) return null;
              const y = getY(h);
              return (
                <g key={h}>
                  <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(26, 26, 24, 0.08)" strokeWidth={1} />
                  <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">{h}h</text>
                </g>
              );
            })}

            {maxVal >= 16 && (
              <g>
                <line x1={padLeft} y1={targetY} x2={width - padRight} y2={targetY} stroke="var(--sk-mech)" strokeWidth={1.5} strokeDasharray="4 4" opacity={0.6} />
                <text x={width - padRight - 5} y={targetY - 5} textAnchor="end" fill="var(--sk-mech)" fontSize={8} fontWeight="bold" fontFamily="var(--font-ui)">{t("chartFastingTarget")}</text>
              </g>
            )}

            {last10Days.map((d, idx) => {
              const val = d.fastingDurationHours || 0;
              const x = getX(idx);
              const y = getY(val);
              const barH = cHeight + padTop - y;

              return (
                <g key={d.date}>
                  {val > 0 && (
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      fill="var(--sk-ink)"
                    />
                  )}
                  {val > 0 && (
                    <text x={x} y={y - 6} textAnchor="middle" fill="var(--sk-ink)" fontSize={8} fontWeight="700" fontFamily="var(--font-mono)">
                      {val.toFixed(1)}h
                    </text>
                  )}
                  <text x={x} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    if (activeChartTab === "period") {
      const getFlowVal = (f?: "light" | "medium" | "heavy") => {
        if (f === "light") return 1;
        if (f === "medium") return 2;
        if (f === "heavy") return 3;
        return 0;
      };
      
      const getY = (val: number) => cHeight + padTop - (val / 3) * cHeight;

      return (
        <div className="grid-paper" style={{ width: "100%" }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
            {renderGridPattern()}
            <rect x={padLeft} y={padTop} width={cWidth} height={cHeight} fill="url(#chartGrid)" stroke="rgba(26, 26, 24, 0.15)" strokeWidth={1} />

            {[0, 1, 2, 3].map(flow => {
              const y = getY(flow);
              const label = flow === 0 ? t("chartPeriodLabel0") : flow === 1 ? t("chartPeriodLabel1") : flow === 2 ? t("chartPeriodLabel2") : t("chartPeriodLabel3");
              return (
                <g key={flow}>
                  <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(26, 26, 24, 0.08)" strokeWidth={1} />
                  <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">{label}</text>
                </g>
              );
            })}

            {last10Days.map((d, idx) => {
              const flow = d.period?.flow;
              const val = getFlowVal(flow);
              const x = getX(idx);
              const y = getY(val);
              const barH = cHeight + padTop - y;

              return (
                <g key={d.date}>
                  {val > 0 && (
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      fill="var(--sk-ink)"
                    />
                  )}
                  {val > 0 && (
                    <text x={x} y={y - 6} textAnchor="middle" fontSize={10}>
                      🌸
                    </text>
                  )}
                  <text x={x} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    if (activeChartTab === "bowel") {
      const maxBowel = Math.max(...last10Days.map(d => d.bowelMovements?.length || 0), 3);
      const getY = (val: number) => cHeight + padTop - (val / maxBowel) * cHeight;

      return (
        <div className="grid-paper" style={{ width: "100%" }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
            {renderGridPattern()}
            <rect x={padLeft} y={padTop} width={cWidth} height={cHeight} fill="url(#chartGrid)" stroke="rgba(26, 26, 24, 0.15)" strokeWidth={1} />

            {Array.from({ length: maxBowel + 1 }).map((_, b) => {
              const y = getY(b);
              return (
                <g key={b}>
                  <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(26, 26, 24, 0.08)" strokeWidth={1} />
                  <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">{b} {t("chartBowelUnit")}</text>
                </g>
              );
            })}

            {last10Days.map((d, idx) => {
              const val = d.bowelMovements?.length || 0;
              const x = getX(idx);
              const y = getY(val);
              const barH = cHeight + padTop - y;

              return (
                <g key={d.date}>
                  {val > 0 && (
                    <rect
                      x={x - barWidth / 2}
                      y={y}
                      width={barWidth}
                      height={barH}
                      fill="var(--sk-ink)"
                    />
                  )}
                  {val > 0 && (
                    <text x={x} y={y - 6} textAnchor="middle" fill="var(--sk-ink)" fontSize={8} fontWeight="bold" fontFamily="var(--font-mono)">
                      💩 {val}
                    </text>
                  )}
                  <text x={x} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    if (activeChartTab === "weight") {
      const weightDays = last10Days.filter(d => d.weightKg && d.weightKg > 0);
      
      if (weightDays.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--sk-mech)" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600", fontFamily: "var(--font-ui)" }}>{t("weightTitle")}</p>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>{t("chartEmptyNote")}</p>
          </div>
        );
      }
      
      const weights = weightDays.map(d => d.weightKg!);
      const minWeight = Math.min(...weights) - 1;
      const maxWeight = Math.max(...weights) + 1;
      const weightRange = maxWeight - minWeight || 2;
      
      const getY = (val: number) => cHeight + padTop - ((val - minWeight) / weightRange) * cHeight;
      
      const points = last10Days
        .map((d, idx) => ({ d, idx, val: d.weightKg }))
        .filter(p => p.val && p.val > 0)
        .map(p => ({ x: getX(p.idx), y: getY(p.val!) }));
        
      const pathD = points.length > 0
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
        : "";
        
      return (
        <div className="grid-paper" style={{ width: "100%" }}>
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
            {renderGridPattern()}
            <rect x={padLeft} y={padTop} width={cWidth} height={cHeight} fill="url(#chartGrid)" stroke="rgba(26, 26, 24, 0.15)" strokeWidth={1} />

            {Array.from({ length: 5 }).map((_, idx) => {
              const val = minWeight + (weightRange / 4) * idx;
              const y = getY(val);
              return (
                <g key={idx}>
                  <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(26, 26, 24, 0.08)" strokeWidth={1} />
                  <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">{val.toFixed(2)}kg</text>
                </g>
              );
            })}

            {pathD && <path d={pathD} fill="none" stroke="var(--sk-ink)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}

            {last10Days.map((d, idx) => {
              const val = d.weightKg;
              const x = getX(idx);
              const y = val ? getY(val) : 0;
              const isLastPoint = val && idx === last10Days.map(item => item.weightKg).findLastIndex(w => w !== undefined && w > 0);
              
              return (
                <g key={d.date}>
                  {val && val > 0 && (
                    <g>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isLastPoint ? 5 : 4} 
                        fill={isLastPoint ? "var(--sk-oil)" : "var(--sk-paper)"} 
                        stroke="var(--sk-ink)" 
                        strokeWidth={2} 
                        className={isLastPoint ? "oil-glow" : ""}
                      />
                      <text x={x} y={y - 8} textAnchor="middle" fill="var(--sk-ink)" fontSize={8} fontWeight="700" fontFamily="var(--font-mono)">
                        {val.toFixed(2)}kg
                      </text>
                    </g>
                  )}
                  <text x={x} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">
                    {d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      );
    }

    if (activeChartTab === "willpower") {
      const last30Days = data?.days?.slice(-30) || [];
      const hourCounts = new Array(24).fill(0);
      last30Days.forEach(d => {
        if (d.hungerAttacks?.events) {
          d.hungerAttacks.events.forEach(e => {
            const hour = new Date(e.timestamp).getHours();
            hourCounts[hour]++;
          });
        }
      });
      const maxHeat = Math.max(...hourCounts, 1);

      const last7Days = data?.days?.slice(-7) || [];
      while (last7Days.length < 7) {
        last7Days.unshift({ date: `empty-${last7Days.length}`, label: "", intakeKcal: 0, intakeRangeKcal: [0, 0], proteinRangeG: [0, 0], exerciseLabel: "", exerciseKcal: 0, deficitKcal: 0, note: "", meals: [] });
      }

      const width = 300;
      const height = 120;
      const padTop = 20;
      const padBottom = 20;
      const padLeft = 30;
      const padRight = 20;
      
      const xStep7 = last7Days.length > 1 ? (width - padLeft - padRight) / (last7Days.length - 1) : 0;
      const getX7 = (index: number) => padLeft + index * xStep7;
      
      const maxAttacks = Math.max(...last7Days.map(d => (d.hungerAttacks?.succeeded || 0) + (d.hungerAttacks?.failed || 0)), 4);
      const getY7 = (val: number) => {
        if (maxAttacks === 0) return height - padBottom;
        return height - padBottom - (val / maxAttacks) * (height - padTop - padBottom);
      };

      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--sk-mech)", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>24H Hunger Frequency</div>
            <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="rgba(26,26,24,0.08)" strokeWidth={1} />
                <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="rgba(26,26,24,0.08)" strokeWidth={1} />
                <text x={padLeft - 8} y={padTop + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">High</text>
                <text x={padLeft - 8} y={height - padBottom + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">Low</text>
                
                {[0, 6, 12, 18, 24].map(h => (
                  <text key={h} x={padLeft + (h/24) * (width - padLeft - padRight)} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">
                    {h.toString().padStart(2, '0')}
                  </text>
                ))}

                <defs>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {hourCounts.map((count, hr) => {
                  if (count === 0) return null;
                  const x = padLeft + (hr/24) * (width - padLeft - padRight);
                  const hBar = (count / maxHeat) * (height - padTop - padBottom);
                  const yBar = height - padBottom - hBar;
                  const isMax = count === maxHeat;
                  return (
                    <rect key={hr} x={x - 3} y={yBar} width={6} height={hBar} fill="var(--sk-oil)" rx={3} opacity={isMax ? 1 : 0.6} filter={isMax ? "url(#glow)" : ""} />
                  );
                })}
              </svg>
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--sk-mech)", letterSpacing: "1px", marginBottom: "8px", textTransform: "uppercase" }}>Willpower Win-Rate (7 Days)</div>
            <div style={{ position: "relative", width: "100%", height: `${height}px` }}>
              <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
                <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="rgba(26,26,24,0.08)" strokeWidth={1} />
                <line x1={padLeft} y1={(padTop + (height - padBottom)) / 2} x2={width - padRight} y2={(padTop + (height - padBottom)) / 2} stroke="rgba(26,26,24,0.08)" strokeWidth={1} />
                <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="rgba(26,26,24,0.08)" strokeWidth={1} />
                
                <text x={padLeft - 8} y={padTop + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">{maxAttacks}</text>
                <text x={padLeft - 8} y={height - padBottom + 3} textAnchor="end" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-mono)">0</text>
                
                {last7Days.map((d, idx) => {
                  const total = (d.hungerAttacks?.succeeded || 0) + (d.hungerAttacks?.failed || 0);
                  const success = d.hungerAttacks?.succeeded || 0;
                  const x = getX7(idx);
                  const yTotal = getY7(total);
                  const hTotal = (height - padBottom) - yTotal;
                  const ySuccess = getY7(success);
                  const hSuccess = (height - padBottom) - ySuccess;

                  return (
                    <g key={d.date || `empty-${idx}`}>
                      {total > 0 && (
                        <rect x={x - 8} y={yTotal} width={16} height={hTotal} fill="none" stroke="var(--sk-mech)" strokeWidth={1.5} />
                      )}
                      {success > 0 && (
                        <rect x={x - 6} y={ySuccess + (hTotal === hSuccess && hSuccess > 4 ? 2 : 0)} width={12} height={hTotal === hSuccess && hSuccess > 4 ? hSuccess - 4 : hSuccess} fill="var(--sk-oil)" />
                      )}
                      <text x={x} y={height - 8} textAnchor="middle" fill="var(--sk-mech)" fontSize={9} fontWeight="600" fontFamily="var(--font-ui)">
                        {d.label ? (d.label.split("/")[1] || d.label) : ""}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const fetchData = async (code: string, isManual = false) => {
    try {
      if (!isManual) setLoading(true);
      const res = await fetch("/api/health-data", {
        headers: { "x-fitme-passcode": code }
      });
      if (res.status === 401) {
        localStorage.removeItem("fitme_passcode");
        setAuthenticated(false);
        setPasscodeError("密码校验错误，请重新输入");
        if (isManual) {
          setShake(true);
          setTimeout(() => setShake(false), 450);
          setPasscode("");
        }
      } else if (!res.ok) {
        throw new Error(await res.text());
      } else {
        const result = await res.json();
        setData(result);
        localStorage.setItem("fitme_passcode", code);
        setAuthenticated(true);
        setPasscodeError("");
      }
    } catch (e: any) {
      console.error(e);
      setPasscodeError("获取数据失败：" + e.message);
      if (isManual) {
        setShake(true);
        setTimeout(() => setShake(false), 450);
        setPasscode("");
      }
    } finally {
      if (!isManual) setLoading(false);
    }
  };

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    mutateData((latest) => {
      const ageNum = Number(setupAge);
      const heightNum = Number(setupHeight);
      const weightNum = Number(setupWeight);
      const targetWeightNum = Number(setupTargetWeight) || weightNum - 5;

      // 1. Calculate BMR (Mifflin-St Jeor)
      const bmr = Math.round(10 * weightNum + 6.25 * heightNum - 5 * ageNum + (setupSex === "female" ? -161 : 5));
      const maintenanceRange: [number, number] = [Math.round(bmr * 1.15), Math.round(bmr * 1.2)];
      
      // 2. Generate target values
      const dailyKcalRange: [number, number] = [Math.round(bmr - 300), Math.round(bmr - 50)];
      const dailyProteinRangeG: [number, number] = [Math.round(weightNum * 1.5), Math.round(weightNum * 2.0)];
      const proteinCompletionTargetG = Math.round(weightNum * 1.6);

      latest.profile = {
        sex: setupSex,
        age: ageNum,
        heightCm: heightNum,
        latestWeightKg: weightNum,
        targetWeightRangeKg: [targetWeightNum, targetWeightNum],
        bmrKcal: bmr,
        sedentaryMaintenanceKcalRange: maintenanceRange
      };

      latest.targets = {
        dailyKcalRange,
        dailyProteinRangeG,
        proteinCompletionTargetG,
        nutrition: {
          fiberG: [25, 35],
          sodiumMgMax: 2000,
          calciumMg: [800, 1000],
          potassiumMg: [2000, 3500],
          ironMg: [10, 15],
          vitaminCMg: [100, 200],
          vitaminDMcg: [10, 20],
          vitaminB12Mcg: [2.4, 5]
        }
      };

      latest.updatedAt = getLocalDateStr();
      latest.periodLabel = getLocalDateStr();

      return latest;
    }, setSetupLoading);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) {
      setPasscodeError("请输入密码");
      return;
    }
    fetchData(passcode, true);
  };

  const handlePasscodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setPasscode(val);
    if (val.length === 4) {
      fetchData(val, true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert("照片大小不能超过 8MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Helper calculation logic (mirrors fitme.js engine)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;
    
    mutateData(async (latest) => {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      let finalImagePath: string | undefined = undefined;

      // 1. Upload image if selected
      if (imageFile && imagePreview) {
        const fileExt = imageFile.name.substring(imageFile.name.lastIndexOf("."));
        const uploadRes = await fetch("/api/upload-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-fitme-passcode": activeCode
          },
          body: JSON.stringify({
            image: imagePreview,
            ext: fileExt || ".jpg"
          })
        });
        if (!uploadRes.ok) {
          throw new Error("图片上传失败：" + (await uploadRes.text()));
        }
        const uploadData = await uploadRes.json();
        finalImagePath = uploadData.path;
      }

      // 2. Clone days array and perform calculations
      const updatedDays = latest.days || [];
      latest.days = updatedDays;
      const maintenanceAvg = Math.round(
        (latest.profile.sedentaryMaintenanceKcalRange[0] +
          latest.profile.sedentaryMaintenanceKcalRange[1]) /
          2
      );

      let day = updatedDays.find(item => item.date === formDate);
      if (!day) {
        day = {
          date: formDate,
          label: formDate.slice(5).replace("-", "/"),
          intakeKcal: 0,
          intakeRangeKcal: [0, 0],
          proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动",
          exerciseKcal: 0,
          deficitKcal: maintenanceAvg,
          note: "",
          meals: [],
          nutrition: null
        };
        updatedDays.push(day);
      }

      const parsedKcal = Number(formKcal) || 0;

      if (formType === "exercise") {
        // Record as daily exercise
        day.exerciseKcal = parsedKcal;
        day.exerciseLabel = formTitle || "运动";
      } else {
        // Record as meal
        const parsedProtein = formProtein === "" ? null : Number(formProtein);
        const meal: Meal = {
          id: `${formDate}-${formType}-${Date.now()}`,
          type: formType,
          title: formTitle || "未命名餐食",
          description: formDescription,
          kcal: parsedKcal,
          kcalRange: [parsedKcal, parsedKcal],
          proteinRangeG: parsedProtein === null ? null : [parsedProtein, parsedProtein],
          imagePaths: finalImagePath ? [finalImagePath] : [],
          source: "网页端录入"
        };

        // Add nutrition fields if toggled and filled
        if (showNutritionFields) {
          const mealNutrition: Record<string, number> = {};
          for (const key of nutritionFields) {
            if (nutrients[key]) mealNutrition[key] = Number(nutrients[key]);
          }
          if (Object.keys(mealNutrition).length) {
            meal.nutrition = mealNutrition;
          }
        }

        day.meals = day.meals || [];
        day.meals.push(meal);
      }

      // 3. Recalculate day totals
      day.intakeKcal = day.meals.reduce((sum, m) => sum + Number(m.kcal || 0), 0);
      day.intakeRangeKcal = [
        day.meals.reduce((sum, m) => sum + Number(m.kcalRange?.[0] ?? m.kcal ?? 0), 0),
        day.meals.reduce((sum, m) => sum + Number(m.kcalRange?.[1] ?? m.kcal ?? 0), 0)
      ];

      const proteinMeals = day.meals.filter(m => m.proteinRangeG);
      day.proteinRangeG = [
        proteinMeals.reduce((sum, m) => sum + Number(m.proteinRangeG![0]), 0),
        proteinMeals.reduce((sum, m) => sum + Number(m.proteinRangeG![1]), 0)
      ];

      day.deficitKcal = maintenanceAvg + Number(day.exerciseKcal || 0) - day.intakeKcal;
      day.note = day.meals.map(m => `${mealLabels[m.type] || "餐食"}：${m.title}`).join("；");
      
      // Summarize day nutrition
      day.nutrition = summarizeNutrition(day.meals);
      day.nutritionConfidence = day.nutrition ? "estimated" : undefined;
      day.nutritionAdvice = getNutritionAdvice(day.nutrition, latest.targets.nutrition);

      // Sort days chronologically
      updatedDays.sort((a, b) => a.date.localeCompare(b.date));

      // 4. Update core logs object
      latest.updatedAt = formDate;
      latest.periodLabel = `${updatedDays[0]?.date || formDate}-${updatedDays.at(-1)?.date || formDate}`;
      latest.stats = {
        proteinQualifiedDays: updatedDays.filter(
          item => item.proteinRangeG?.[1] >= latest.targets.dailyProteinRangeG[0]
        ).length
      };
      latest.copy = {
        ...latest.copy,
        overview: `今天已记录 ${day.intakeKcal} kcal，蛋白约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`,
        summary: [
          `今天目前已摄入约 ${day.intakeKcal} kcal。`,
          `蛋白质目前约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`,
          day.nutrition?.fiberG
            ? `膳食纤维约 ${day.nutrition.fiberG}g，钠约 ${day.nutrition.sodiumMg}mg。`
            : "营养维度还不完整，继续记录后会补齐。",
          "继续按当天目标调整下一餐。"
        ]
      };

      return latest;
    }, setSubmitting, () => {
      setShowModal(false);
      resetForm();
    });
  };

  const resetForm = () => {
    setFormType("breakfast");
    setFormTitle("");
    setFormKcal("");
    setFormProtein("");
    setFormDescription("");
    setImageFile(null);
    setImagePreview(null);
    setShowNutritionFields(false);
    setNutrients({
      fiberG: "",
      sodiumMg: "",
      calciumMg: "",
      potassiumMg: "",
      ironMg: "",
      vitaminCMg: "",
      vitaminDMcg: "",
      vitaminB12Mcg: ""
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Helper functions
  const fmt = (num: number) => Number(num).toLocaleString("zh-CN");
  const avg = (range?: [number, number]) => (range ? Math.round((range[0] + range[1]) / 2) : 0);

  const summarizeNutrition = (meals: Meal[]) => {
    const mealsWithNutrition = meals.filter(m => m.nutrition);
    if (!mealsWithNutrition.length) return null;
    const result: Record<string, number> = {};
    for (const key of nutritionFields) {
      const mealsWithField = mealsWithNutrition.filter(m => m.nutrition?.[key] != null);
      if (!mealsWithField.length) continue;
      const value = mealsWithField.reduce((sum, m) => sum + Number(m.nutrition![key]), 0);
      result[key] = Math.round(value * 10) / 10;
    }
    return result;
  };

  const getNutritionAdvice = (nutrition: Record<string, number> | null | undefined, targets: any) => {
    if (!nutrition) return [];
    const advice = [];
    if ((nutrition.fiberG || 0) < (targets?.fiberG?.[0] ?? 25)) {
      advice.push("膳食纤维偏低，下一餐优先加蔬菜、菌菇、豆制品或全谷物。");
    }
    if ((nutrition.sodiumMg || 0) > (targets?.sodiumMgMax ?? 2000) * 0.72) {
      advice.push("钠已经不低，后面少酱少汤，今天多喝水。");
    }
    if ((nutrition.calciumMg || 0) < (targets?.calciumMg?.[0] ?? 800)) {
      advice.push("钙偏低，可用无糖酸奶、牛奶、豆腐或小鱼虾补一点。");
    }
    if ((nutrition.vitaminDMcg || 0) < (targets?.vitaminDMcg?.[0] ?? 10)) {
      advice.push("维生素D偏低，鸡蛋、鱼类和日晒更有帮助。");
    }
    if ((nutrition.vitaminCMg || 0) < (targets?.vitaminCMg?.[0] ?? 100)) {
      advice.push("维生素C还可以补，优先真实水果或绿叶菜。");
    }
    return advice.slice(0, 4);
  };

  if (loading) {
    return (
      <div className="lock-screen-overlay" style={{ background: "radial-gradient(circle at 50% 0%, #222, #000)" }}>
        <div className="lock-card dark-glass-shell" style={{ border: "1px solid rgba(255,255,255,0.1)", textAlign: "center", padding: "40px 30px" }}>
          <div className="lock-title" style={{ color: "#fff", fontFamily: "var(--font-content)", fontSize: "24px", margin: 0 }}>载入中...</div>
          <div className="lock-subtitle" style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "8px" }}>正在获取您的健康看板数据</div>
        </div>
      </div>
    );
  }

  // 1. Render Lock Screen
  if (authenticated === false) {
    return (
      <div className="lock-screen-overlay" style={{ background: "radial-gradient(circle at 50% 0%, #222, #000)" }}>
        {/* Language select on top right */}
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
            value={lang}
            onChange={(e) => {
              const val = e.target.value as any;
              setLang(val);
              localStorage.setItem("fitme_lang", val);
            }}
          >
            <option value="en" style={{ background: "#222" }}>English 🇬🇧</option>
            <option value="zh" style={{ background: "#222" }}>简体中文 🇨🇳</option>
            <option value="ja" style={{ background: "#222" }}>日本語 🇯🇵</option>
          </select>
        </div>

        <form className={`lock-card dark-glass-shell ${shake ? "shake" : ""}`} style={{ border: "1px solid rgba(255,255,255,0.1)", padding: "40px 30px" }} onSubmit={handleUnlock}>
          <div className="lock-title" style={{ color: "#fff", fontFamily: "var(--font-content)", fontSize: "28px" }}>{t("lockTitle")}</div>
          <div className="lock-subtitle" style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", marginTop: "6px" }}>{t("lockPasscode")}</div>
          
          <div className="passcode-container" style={{ margin: "24px 0" }}>
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={4}
              className="hidden-input"
              value={passcode}
              onChange={handlePasscodeChange}
              autoFocus
            />
            <div className="passcode-slots" style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              {[0, 1, 2, 3].map((index) => {
                const isFilled = passcode.length > index;
                const isActive = passcode.length === index;
                return (
                  <div
                    key={index}
                    className={`passcode-slot ${isFilled ? "filled" : ""} ${isActive ? "active" : ""}`}
                    style={{
                      width: "48px",
                      height: "48px",
                      border: isFilled ? "2px solid var(--sk-oil)" : "2px solid rgba(255,255,255,0.2)",
                      borderRadius: "6px",
                      background: isFilled ? "rgba(217,138,44,0.1)" : "rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--sk-oil)",
                      fontSize: "20px",
                      boxShadow: isFilled ? "0 0 10px rgba(217,138,44,0.3)" : "none"
                    }}
                  >
                    {isFilled ? "●" : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {passcodeError && <div className="lock-error" style={{ color: "#ff8b77", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{t("lockError")}</div>}
          <button 
            type="submit" 
            style={{ width: "100%", padding: "12px", background: "var(--sk-oil)", border: "none", color: "#fff", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
          >
            {t("lockButton")}
          </button>
        </form>
      </div>
    );
  }

  if (!data) return null;

  const isProfileConfigured = data.profile && data.profile.bmrKcal && data.profile.sedentaryMaintenanceKcalRange;

  if (!isProfileConfigured) {
    return (
      <div className="lock-screen-overlay" style={{ background: "radial-gradient(circle at 50% 0%, #222, #000)" }}>
        {/* Language select on top right */}
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
            value={lang}
            onChange={(e) => {
              const val = e.target.value as any;
              setLang(val);
              localStorage.setItem("fitme_lang", val);
            }}
          >
            <option value="en" style={{ background: "#222" }}>English 🇬🇧</option>
            <option value="zh" style={{ background: "#222" }}>简体中文 🇨🇳</option>
            <option value="ja" style={{ background: "#222" }}>日本語 🇯🇵</option>
          </select>
        </div>

        <form className="lock-card dark-glass-shell" style={{ width: "min(440px, 94vw)", padding: "30px 24px", border: "1px solid rgba(255,255,255,0.1)" }} onSubmit={handleSetupSubmit}>
          <div className="lock-title" style={{ color: "#fff", fontFamily: "var(--font-content)", fontSize: "28px" }}>{t("onboardTitle")}</div>
          <div className="lock-subtitle" style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", marginTop: "6px" }}>Configuring bodily metrics generates BMR & caloric goals.</div>

          <div className="modal-body" style={{ padding: 0, display: "flex", flexDirection: "column", gap: "14px", textAlign: "left", margin: "20px 0", color: "#fff" }}>
            <div className="form-row" style={{ display: "flex", gap: "12px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardSex")}</label>
                <select 
                  className="form-select" 
                  value={setupSex} 
                  onChange={e => setSetupSex(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                >
                  <option value="male" style={{ background: "#222" }}>{t("onboardMale")} ♂</option>
                  <option value="female" style={{ background: "#222" }}>{t("onboardFemale")} ♀</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardAge")}</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  className="form-input"
                  value={setupAge}
                  onChange={e => setSetupAge(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: "flex", gap: "12px" }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardHeight")}</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="250"
                  className="form-input"
                  value={setupHeight}
                  onChange={e => setSetupHeight(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardWeight")}</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="300"
                  className="form-input"
                  value={setupWeight}
                  onChange={e => setSetupWeight(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardTarget")}</label>
              <input
                type="number"
                min="10"
                max="300"
                className="form-input"
                placeholder={t("onboardTargetPlaceholder")}
                value={setupTargetWeight}
                onChange={e => setSetupTargetWeight(e.target.value)}
                style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            style={{ width: "100%", padding: "12px", background: "var(--sk-oil)", border: "none", color: "#fff", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "15px" }}
            disabled={setupLoading}
          >
            {setupLoading ? t("onboardSaving") : t("onboardSubmit")}
          </button>
        </form>
      </div>
    );
  }

  // Process data variables for rendering
  const safeCopy = data.copy || {
    title: "FitMe 健康看板",
    overview: "欢迎使用 FitMe，您可以在这里记录您的每日饮食与运动。",
    footnote: "基于当前记录的饮食、运动和体重数据生成。所有热量和缺口均为记录估算，用来辅助决策，不当作医疗参考。",
    summary: []
  };

  const days = data.days || [];
  const latestDateStr = getLocalDateStr();
  const latest = days.find(d => d.date === latestDateStr) || {
    date: latestDateStr,
    label: latestDateStr.slice(5).replace("-", "/"),
    intakeKcal: 0,
    intakeRangeKcal: [0, 0] as [number, number],
    proteinRangeG: [0, 0] as [number, number],
    exerciseLabel: "未记录运动",
    exerciseKcal: 0,
    deficitKcal: Math.round(
      ((data.profile.sedentaryMaintenanceKcalRange[0] +
        data.profile.sedentaryMaintenanceKcalRange[1]) /
        2)
    ),
    note: "",
    meals: [] as Meal[]
  };

  const totalDeficit = days.reduce((sum, d) => sum + d.deficitKcal, 0);
  const todayProtein = avg(latest.proteinRangeG);
  const proteinCompletion = Math.min(
    100,
    Math.round((todayProtein / data.targets.proteinCompletionTargetG) * 100)
  );
  const maxDeficit = Math.max(...days.map(d => d.deficitKcal), 1);
  const proteinCloseDays = data.stats?.proteinQualifiedDays ?? days.filter(
    d => d.proteinRangeG[1] >= data.targets.dailyProteinRangeG[0]
  ).length;

  const targetWeightRange = data.profile.targetWeightRangeKg || [0, 0];
  const targetWeightLabel =
    targetWeightRange[0] === targetWeightRange[1]
      ? `${targetWeightRange[0]}`
      : `${targetWeightRange[0]}-${targetWeightRange[1]}`;

  // Heatmap rendering logic
  const groupDatesByMonth = (daysList: DayLog[]) => {
    const monthsGroup: Record<string, DayLog[]> = {};
    daysList.forEach(d => {
      const monthKeyStr = d.date.slice(0, 7); // e.g. "2026-07"
      if (!monthsGroup[monthKeyStr]) monthsGroup[monthKeyStr] = [];
      monthsGroup[monthKeyStr].push(d);
    });
    return monthsGroup;
  };

  const monthsGroup = groupDatesByMonth(days);

  const getDeficitLevel = (deficit: number) => {
    if (!deficit || deficit <= 0) return 0;
    const ratio = deficit / maxDeficit;
    if (ratio >= 0.82) return 4;
    if (ratio >= 0.58) return 3;
    if (ratio >= 0.34) return 2;
    return 1;
  };

  // Filter meal days for log list
  const getFilteredMealsList = () => {
    return [...days]
      .reverse()
      .map(d => ({
        ...d,
        filteredMeals: (d.meals || []).filter(
          m => activeMealFilter === "all" || m.type === activeMealFilter
        )
      }))
      .filter(d => d.filteredMeals.length > 0 || (activeMealFilter === "all" && d.exerciseKcal > 0));
  };

  const filteredDaysList = getFilteredMealsList();

  const getNutritionStatusLabel = (val: number, field: string) => {
    const targets = data.targets.nutrition || {};
    if (field === "sodiumMg") {
      return val > (targets.sodiumMgMax || 2000) ? { label: "偏高", c: "is-high" } : { label: "可控", c: "" };
    }
    const bounds = (targets as any)[field];
    if (!bounds) return { label: "合适", c: "" };
    if (val < bounds[0]) return { label: "偏低", c: "is-low" };
    if (bounds[1] && val > bounds[1]) return { label: "偏高", c: "is-high" };
    return { label: "合适", c: "" };
  };

  const todayNutrition = latest.nutrition || {};

  return (
    <div className="page dark-glass-shell" style={{ maxWidth: "480px", margin: "40px auto", padding: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
      <main className="canvas heavy-paper">
        {/* 2. Topbar Header */}
        <div className="header-plate" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
          <div style={{ paddingBottom: "12px" }}>
            <h1 style={{ fontFamily: "var(--font-content)", fontSize: "26px", margin: 0, fontWeight: 600, color: "var(--sk-ink)", lineHeight: 1.1 }}>
              <div>snono</div>
              <div>{t("brandSub")}</div>
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
            <p className="ui-text" style={{ margin: 0, fontSize: "11px", color: "#6e6b64", letterSpacing: "0.5px", fontWeight: 600 }}>
              {t("topEyebrow", { date: latest.date })}
            </p>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="dial-cutout ui-text" style={{ padding: "6px 10px", fontSize: "10px", background: "#eae7df", fontWeight: "bold", border: "1px solid rgba(26,26,24,0.15)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr", gap: "2px 4px", alignItems: "center" }}>
                  <div style={{ textAlign: "left", letterSpacing: "1px" }}>{t("weightLabel")}</div>
                  <div>:</div>
                  <div style={{ textAlign: "left" }}>{data.profile.latestWeightKg.toFixed(2)}KG</div>
                  
                  <div style={{ textAlign: "left", letterSpacing: "1px", color: "var(--sk-mech)" }}>{t("goalLabel")}</div>
                  <div style={{ color: "var(--sk-mech)" }}>:</div>
                  <div style={{ textAlign: "left", color: "var(--sk-mech)" }}>{targetWeightLabel}KG</div>
                </div>
              </div>
            <button
              type="button"
              className="mech-btn-small"
              style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setIsRetroModalOpen(true)}
            >
              📝
            </button>
            <button
              type="button"
              className="mech-btn-small"
              style={{ width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={handleOpenSettings}
            >
              ⚙️
            </button>
            </div>
          </div>
        </div>

        {/* Fasting Timer Status Card */}
        <section className="mechanical-timer">
          <div className="ui-text" style={{ marginBottom: "12px", color: "#888" }}>
            {data?.fastingState?.startTime ? t("fastActive") : t("fastIdle")}
          </div>
          <div className="display-screen data-text" style={{ fontSize: "32px", fontWeight: "bold" }}>
            {data?.fastingState?.startTime ? fastingElapsed || t("fastCalculating") : "--:--:--"}
          </div>
          <button 
            className={`heavy-switch ${data?.fastingState?.startTime ? "active-state" : ""}`}
            onClick={data?.fastingState?.startTime ? handleEndFast : handleStartFast}
            disabled={isFastingSaving}
          >
            {isFastingSaving ? t("fastSaving") : (data?.fastingState?.startTime ? t("fastEnd") : t("fastStart"))}
          </button>

          {data?.fastingState?.startTime && (
            <button
              onClick={() => setIsHungerModalOpen(true)}
              className="mech-btn"
              style={{
                marginTop: "16px",
                width: "100%",
                background: "linear-gradient(to bottom, #b53838, #8a1f1f)",
                color: "#f4f1eb",
                border: "1px solid #4a0d0d",
                boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2), 0 3px 0 #3b0909, 0 4px 6px rgba(0,0,0,0.3)",
                fontSize: "14px",
                fontWeight: "bold",
                letterSpacing: "1px"
              }}
            >
              {t("hungerAttackBtn")}
            </button>
          )}
        </section>

        {/* 3. Today's Summary Card */}
        <div className="ink-card" style={{ marginBottom: "24px" }}>
          <h2 className="card-title content-text">
            {t("sumTitle")}
            <span className="ui-text">STATISTICS</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div className="ui-text" style={{ fontSize: "10px" }}>{t("sumFasting")}</div>
              <div className="data-text" style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0", color: "var(--sk-ink)" }}>
                {fmt(latest.fastingDurationHours || 0)} <span style={{ fontSize: "12px", fontFamily: "var(--font-content)" }}>{t("sumFastingUnit")}</span>
              </div>
              <div style={{ fontSize: "12px", fontStyle: "italic", opacity: 0.7 }}>{t("sumFastingNote")}</div>
            </div>
            <div>
              <div className="ui-text" style={{ fontSize: "10px" }}>{t("sumWeight")}</div>
              <div className="data-text" style={{ fontSize: "20px", fontWeight: "bold", margin: "4px 0", color: "var(--sk-ink)" }}>
                {latest.weightKg ? `${latest.weightKg} kg` : `${data.profile.latestWeightKg} kg`}
              </div>
              <div style={{ fontSize: "12px", fontStyle: "italic", opacity: 0.7 }}>
                {latest.weightKg ? t("sumWeightNoteActive") : t("sumWeightNoteInactive")}
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", paddingTop: "12px", borderTop: "1px dashed rgba(26,26,24,0.15)", marginTop: "4px" }}>
              <div className="ui-text" style={{ fontSize: "10px" }}>{t("hungerStats")}</div>
              <div className="data-text" style={{ fontSize: "14px", fontWeight: "bold", margin: "4px 0", color: "var(--sk-mech)" }}>
                {t("hungerStatFormat", { S: latest.hungerAttacks?.succeeded || 0, F: latest.hungerAttacks?.failed || 0 })}
              </div>
              {latest.hungerAttacks?.events && latest.hungerAttacks.events.length > 0 && (
                <div style={{ fontSize: "11px", color: "#888", marginTop: "4px" }}>
                  {t("hungerLatest")}: {new Date(latest.hungerAttacks.events[latest.hungerAttacks.events.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({latest.hungerAttacks.events[latest.hungerAttacks.events.length - 1].succeeded ? "胜" : "负"})
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Vitals Tracker Cards (Period, Bowels, Weight) */}
        <section style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
          {/* Period Card */}
          <div className="ink-card">
            <h2 className="card-title content-text">
              {t("periodTitle")}
              <span className="ui-text">MENSTRUAL CYCLE</span>
            </h2>
            <div className="ink-segmented ui-text">
              <div 
                className={`ink-segment ${(latest.period?.flow || "none") === "none" ? "active" : ""}`}
                onClick={() => !isVitalsSaving && handleTogglePeriod(latest.date, null)}
              >
                {t("periodSwitchNone")}
              </div>
              <div 
                className={`ink-segment ${(latest.period?.flow) === "light" ? "active" : ""}`}
                onClick={() => !isVitalsSaving && handleTogglePeriod(latest.date, "light")}
              >
                {t("periodSwitchLight")}
              </div>
              <div 
                className={`ink-segment ${(latest.period?.flow) === "medium" ? "active" : ""}`}
                onClick={() => !isVitalsSaving && handleTogglePeriod(latest.date, "medium")}
              >
                {t("periodSwitchMedium")}
              </div>
              <div 
                className={`ink-segment ${(latest.period?.flow) === "heavy" ? "active" : ""}`}
                onClick={() => !isVitalsSaving && handleTogglePeriod(latest.date, "heavy")}
              >
                {t("periodSwitchHeavy")}
              </div>
            </div>
            
            <div style={{ marginTop: "14px", fontSize: "14px", fontStyle: "italic", opacity: 0.8 }}>
              {latest.period ? (
                <span>{t("periodActive", { X: calculatePeriodDay(latest.date) })}</span>
              ) : (
                <span>{t("periodInactive")}</span>
              )}
            </div>
          </div>

          {/* Bowel Movement Card */}
          <div className="ink-card">
            <h2 className="card-title content-text">
              {t("bowelTitle")}
              <span className="ui-text">BOWEL COUNT</span>
            </h2>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="dial-cutout data-text dial-value" style={{ fontSize: "22px" }}>
                {String((latest.bowelMovements || []).length).padStart(2, "0")}
              </div>
              <button
                className="mech-btn-small"
                onClick={() => handleQuickBowelMovement(latest.date)}
                disabled={isVitalsSaving}
              >
                +
              </button>
            </div>
            
            {/* Bowel list */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
              {(latest.bowelMovements || []).length === 0 ? (
                <span style={{ fontSize: "13px", fontStyle: "italic", opacity: 0.6 }}>{t("bowelEmpty")}</span>
              ) : (
                (latest.bowelMovements || []).map((item) => (
                  <span 
                    key={item.id} 
                    style={{ background: "#eae7df", border: "1px solid rgba(26,26,24,0.15)", borderRadius: "3px", padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    💩 {item.time}
                    <button 
                      type="button"
                      style={{ background: "none", border: "none", color: "#d93838", cursor: "pointer", padding: "0 2px", fontWeight: "bold" }}
                      onClick={() => handleDeleteBowelMovement(latest.date, item.id)}
                      disabled={isVitalsSaving}
                    >
                      &times;
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Weight Card */}
          <div className="ink-card">
            <h2 className="card-title content-text">
              {t("weightTitle")}
              <span className="ui-text">KILOGRAMS</span>
            </h2>
            <div className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div className="dial-cutout data-text dial-value" style={{ fontSize: "22px" }}>
                  {latest.weightKg ? latest.weightKg.toFixed(2) : (data?.profile?.latestWeightKg ? data.profile.latestWeightKg.toFixed(2) : "0.00")}
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  style={{ width: "65px", padding: "6px", fontSize: "12px", background: "#eae7df", color: "var(--sk-ink)", border: "1px solid rgba(26,26,24,0.15)", borderRadius: "4px", textAlign: "center" }}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  disabled={isVitalsSaving}
                />
              </div>
              <button
                type="button"
                className="mech-btn"
                onClick={() => {
                  const w = parseFloat(weightInput);
                  if (!isNaN(w) && w > 0) {
                    handleSaveWeight(latest.date, w);
                    setWeightInput("");
                  } else {
                    alert(lang === "zh" ? "请输入有效的体重数字（如 65.4）" : lang === "ja" ? "有効な体重を入力してください（例：65.4）" : "Please enter a valid weight (e.g. 65.4)");
                  }
                }}
                disabled={isVitalsSaving}
              >
                {t("weightButton")}
              </button>
            </div>
          </div>
        </section>

        {/* 5. 4-Tab Statistical Chart Section */}
        <div className="ink-card chart-section" style={{ marginBottom: 0 }}>
          <h2 className="card-title content-text">
            {t("chartTitle")}
            <span className="ui-text">TREND ANALYSIS</span>
          </h2>
          
          <div className="ink-segmented ui-text" style={{ marginBottom: "24px" }}>
            <div
              className={`ink-segment ${activeChartTab === "fasting" ? "active" : ""}`}
              onClick={() => setActiveChartTab("fasting")}
            >
              {t("chartFasting")}
            </div>
            <div
              className={`ink-segment ${activeChartTab === "period" ? "active" : ""}`}
              onClick={() => setActiveChartTab("period")}
            >
              {t("chartPeriod")}
            </div>
            <div
              className={`ink-segment ${activeChartTab === "bowel" ? "active" : ""}`}
              onClick={() => setActiveChartTab("bowel")}
            >
              {t("chartBowel")}
            </div>
            <div
              className={`ink-segment ${activeChartTab === "weight" ? "active" : ""}`}
              onClick={() => setActiveChartTab("weight")}
            >
              {t("chartWeight")}
            </div>
            <div
              className={`ink-segment ${activeChartTab === "willpower" ? "active" : ""}`}
              onClick={() => setActiveChartTab("willpower")}
            >
              {t("chartWillpower")}
            </div>
          </div>

          <div style={{ minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {renderStatsChart()}
          </div>
        </div>
      </main>

      {/* 8. Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-card dark-glass-shell" style={{ width: "min(440px, 94vw)", border: "1px solid rgba(255,255,255,0.1)", padding: "20px" }}>
            <div className="modal-header" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 className="modal-title" style={{ color: "#fff", fontFamily: "var(--font-content)", margin: 0, fontSize: "20px" }}>{t("settingsTitle")}</h2>
              <button className="modal-close" onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer" }}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div className="modal-body" style={{ color: "#fff", padding: "16px 0" }}>
                {/* Language selection */}
                <div className="form-group" style={{ marginBottom: "16px" }}>
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("settingsLang")}</label>
                  <select
                    className="form-select"
                    value={lang}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setLang(val);
                      localStorage.setItem("fitme_lang", val);
                    }}
                    style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                  >
                    <option value="en" style={{ background: "#222" }}>English 🇬🇧</option>
                    <option value="zh" style={{ background: "#222" }}>简体中文 🇨🇳</option>
                    <option value="ja" style={{ background: "#222" }}>日本語 🇯🇵</option>
                  </select>
                </div>

                {/* Profile Edit fields */}
                <div className="form-row" style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardSex")}</label>
                    <select
                      className="form-select"
                      value={settingsSex}
                      onChange={(e) => setSettingsSex(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                    >
                      <option value="male" style={{ background: "#222" }}>{t("onboardMale")} ♂</option>
                      <option value="female" style={{ background: "#222" }}>{t("onboardFemale")} ♀</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardAge")}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      className="form-input"
                      value={settingsAge}
                      onChange={(e) => setSettingsAge(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                    />
                  </div>
                </div>

                <div className="form-row" style={{ display: "flex", gap: "12px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardHeight")}</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="250"
                      className="form-input"
                      value={settingsAge === "" ? "" : settingsHeight}
                      onChange={(e) => setSettingsHeight(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>{t("onboardTarget")}</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      className="form-input"
                      placeholder={t("onboardTargetPlaceholder")}
                      value={settingsTargetWeight}
                      onChange={(e) => setSettingsTargetWeight(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px" }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "6px", cursor: "pointer" }}
                  onClick={() => setShowSettings(false)}
                  disabled={isVitalsSaving}
                >
                  {t("settingsClose")}
                </button>
                <button 
                  type="submit" 
                  style={{ padding: "8px 16px", background: "var(--sk-oil)", border: "none", color: "#fff", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
                  disabled={isVitalsSaving}
                >
                  {isVitalsSaving ? t("fastSaving") : t("settingsSaveProfile")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Hunger Attack Modal */}
      {isHungerModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-content heavy-paper dark-glass-shell" style={{ width: "100%", maxWidth: "360px", background: "#F4F1EB", padding: "24px", borderRadius: "8px", border: "2px solid var(--sk-ink)", boxShadow: "0 12px 24px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(26,26,24,0.15)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-content)", color: "var(--sk-ink)", fontSize: "20px", fontWeight: 600 }}>{t("hungerTitle")}</h3>
              <button 
                onClick={() => setIsHungerModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--sk-ink)", fontSize: "20px", cursor: "pointer", opacity: 0.5 }}
              >
                ✕
              </button>
            </div>
            
            <p className="ui-text" style={{ color: "var(--sk-mech)", marginBottom: "24px", fontSize: "14px" }}>
              {t("hungerDesc")}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                type="button"
                className="mech-btn"
                style={{ width: "100%", padding: "14px", fontSize: "16px", background: "linear-gradient(to bottom, #4CAF50, #2E7D32)", color: "#fff", border: "1px solid #1B5E20", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 3px 0 #1B5E20, 0 4px 6px rgba(0,0,0,0.3)" }}
                onClick={() => handleHungerResult(true)}
                disabled={isHungerSaving}
              >
                {isHungerSaving ? t("fastSaving") : t("hungerResistSuccess")}
              </button>
              
              <button
                type="button"
                className="mech-btn"
                style={{ width: "100%", padding: "14px", fontSize: "16px", background: "linear-gradient(to bottom, #f44336, #c62828)", color: "#fff", border: "1px solid #8e0000", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.3), 0 3px 0 #8e0000, 0 4px 6px rgba(0,0,0,0.3)" }}
                onClick={() => handleHungerResult(false)}
                disabled={isHungerSaving}
              >
                {isHungerSaving ? t("fastSaving") : t("hungerResistFail")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Retroactive Log Modal */}
      {isRetroModalOpen && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="modal-content heavy-paper dark-glass-shell" style={{ width: "100%", maxWidth: "360px", background: "#F4F1EB", padding: "24px", borderRadius: "8px", border: "2px solid var(--sk-ink)", boxShadow: "0 12px 24px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid rgba(26,26,24,0.15)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-content)", color: "var(--sk-ink)", fontSize: "20px", fontWeight: 600 }}>{t("retroTitle")}</h3>
              <button 
                onClick={() => setIsRetroModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--sk-ink)", fontSize: "20px", cursor: "pointer", opacity: 0.5 }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleRetroSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--sk-mech)", fontWeight: "bold" }}>Type</label>
                <select
                  className="form-select"
                  value={retroType}
                  onChange={e => setRetroType(e.target.value as "fasting" | "bowel")}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,26,24,0.2)", borderRadius: "6px", color: "var(--sk-ink)" }}
                >
                  <option value="fasting">{t("retroFasting")}</option>
                  <option value="bowel">{t("retroBowel")}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--sk-mech)", fontWeight: "bold" }}>{t("retroDate")}</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={retroDate}
                  onChange={e => setRetroDate(e.target.value)}
                  style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,26,24,0.2)", borderRadius: "6px", color: "var(--sk-ink)" }}
                />
              </div>

              {retroType === "fasting" ? (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--sk-mech)", fontWeight: "bold" }}>{t("retroStart")}</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={retroStartTime}
                      onChange={e => setRetroStartTime(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,26,24,0.2)", borderRadius: "6px", color: "var(--sk-ink)" }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--sk-mech)", fontWeight: "bold" }}>{t("retroEnd")}</label>
                    <input
                      type="time"
                      required
                      className="form-input"
                      value={retroEndTime}
                      onChange={e => setRetroEndTime(e.target.value)}
                      style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,26,24,0.2)", borderRadius: "6px", color: "var(--sk-ink)" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" style={{ display: "block", marginBottom: "6px", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", color: "var(--sk-mech)", fontWeight: "bold" }}>{t("retroTime")}</label>
                  <input
                    type="time"
                    required
                    className="form-input"
                    value={retroBowelTime}
                    onChange={e => setRetroBowelTime(e.target.value)}
                    style={{ width: "100%", padding: "10px", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(26,26,24,0.2)", borderRadius: "6px", color: "var(--sk-ink)" }}
                  />
                </div>
              )}

              <button 
                type="submit" 
                className="mech-btn"
                disabled={isRetroSaving}
                style={{ width: "100%", padding: "12px", marginTop: "8px", background: "var(--sk-ink)", color: "var(--sk-paper)", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
              >
                {isRetroSaving ? t("fastSaving") : t("retroSubmit")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
