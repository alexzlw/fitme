"use client";

import React, { useState, useEffect, useRef } from "react";

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
    topTitle: "FitMe Dashboard",
    topEyebrow: "Fasting & Vitals Log · {range}",
    topSubcopy: "Track fasting, weight, period, and bowel movements in one clean view.",
    topWeightStatus: "Weight: {W}kg · Goal: {G}kg",
    fastActive: "🔥 Fasting Active",
    fastIdle: "⏸️ Not Fasting",
    fastElapsed: "Elapsed Time",
    fastCalculating: "Calculating...",
    fastStart: "Start Fasting",
    fastEnd: "End Fasting",
    fastSaving: "Saving...",
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
    chartFasting: "⏳ Fasting",
    chartPeriod: "🌸 Period",
    chartBowel: "💩 Bowels",
    chartWeight: "⚖️ Weight",
    chartEmpty: "📊 No trend data available",
    chartEmptyNote: "Record your stats to generate trends.",
    chartFastingTarget: "16h Fasting Target",
    chartBowelUnit: "times",
    chartPeriodLabel0: "No Period",
    chartPeriodLabel1: "Light",
    chartPeriodLabel2: "Medium",
    chartPeriodLabel3: "Heavy",
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
    topTitle: "FitMe 健康看板",
    topEyebrow: "断食与健康指标记录 · {range}",
    topSubcopy: "专注断食时间、每日体重、经期生理和排便状况的健康追踪管理。",
    topWeightStatus: "当前体重 {W}kg · 目标 {G}kg",
    fastActive: "🔥 断食燃烧中",
    fastIdle: "⏸️ 尚未断食",
    fastElapsed: "已断食时长",
    fastCalculating: "计算中...",
    fastStart: "开始断食",
    fastEnd: "结束断食",
    fastSaving: "保存中...",
    sumTitle: "今日记录总览",
    sumFasting: "今日累计断食",
    sumFastingUnit: "小时",
    sumFastingNote: "今日已完成断食计时时长",
    sumWeight: "今日体重记录",
    sumWeightNoteActive: "今日已称重记录",
    sumWeightNoteInactive: "使用最近一次体重数据",
    periodTitle: "🌸 经期记录",
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
    chartFasting: "⏳ 断食趋势",
    chartPeriod: "🌸 经期趋势",
    chartBowel: "💩 排便趋势",
    chartWeight: "⚖️ 体重趋势",
    chartEmpty: "📊 暂无历史趋势数据",
    chartEmptyNote: "开始记录断食与生理体征后，图表将自动生成。",
    chartFastingTarget: "16h 断食目标线",
    chartBowelUnit: "次",
    chartPeriodLabel0: "非经期",
    chartPeriodLabel1: "偏少",
    chartPeriodLabel2: "中等",
    chartPeriodLabel3: "偏多",
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
    topTitle: "FitMe ダッシュボード",
    topEyebrow: "断食と健康記録 · {range}",
    topSubcopy: "断食时间、体重、生理周期、便通の健康管理ダッシュボード。",
    topWeightStatus: "現在: {W}kg · 目標: {G}kg",
    fastActive: "🔥 断食実行中",
    fastIdle: "⏸️ 断食していません",
    fastElapsed: "経過時間",
    fastCalculating: "計算中...",
    fastStart: "断食開始",
    fastEnd: "断食終了",
    fastSaving: "保存中...",
    sumTitle: "本日のサマリー",
    sumFasting: "本日の断食",
    sumFastingUnit: "時間",
    sumFastingNote: "本日終了した断食時間",
    sumWeight: "本日の体重",
    sumWeightNoteActive: "本日記録済み",
    sumWeightNoteInactive: "前回のデータを使用",
    periodTitle: "🌸 生理周期",
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
    chartFasting: "⏳ 断食推移",
    chartPeriod: "🌸 生理推移",
    chartBowel: "💩 便通推移",
    chartWeight: "⚖️ 体重推移",
    chartEmpty: "📊 履歴データがありません",
    chartEmptyNote: "断食や体重の记录を開始すると、グラフが自動生成されます。",
    chartFastingTarget: "16h 断食目標線",
    chartBowelUnit: "回",
    chartPeriodLabel0: "生理日外",
    chartPeriodLabel1: "少量",
    chartPeriodLabel2: "ふつう",
    chartPeriodLabel3: "多量",
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
  const [activeChartTab, setActiveChartTab] = useState<"fasting" | "period" | "bowel" | "weight">("fasting");
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
    setFormDate(new Date().toISOString().slice(0, 10));

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

  const handleStartFast = async () => {
    if (!data) return;
    setIsFastingSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const updatedData: FitMeData = {
        ...data,
        fastingState: { startTime: new Date().toISOString() }
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
    } catch (e: any) {
      alert("开始断食失败: " + e.message);
    } finally {
      setIsFastingSaving(false);
    }
  };

  const handleEndFast = async () => {
    if (!data || !data.fastingState?.startTime) return;
    setIsFastingSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const start = new Date(data.fastingState.startTime).getTime();
      const now = new Date().getTime();
      const durationHours = Math.max(0, (now - start) / (1000 * 3600)); // in hours
      
      const todayStr = new Date().toISOString().slice(0, 10);
      const days = [...(data.days || [])];
      let todayLog = days.find(d => d.date === todayStr);
      
      if (!todayLog) {
        todayLog = {
          date: todayStr,
          label: todayStr.slice(5).replace("-", "/"),
          intakeKcal: 0,
          intakeRangeKcal: [0, 0],
          proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动",
          exerciseKcal: 0,
          deficitKcal: Math.round(((data.profile.sedentaryMaintenanceKcalRange[0] + data.profile.sedentaryMaintenanceKcalRange[1]) / 2)),
          note: "",
          meals: [],
          fastingDurationHours: durationHours
        };
        days.push(todayLog);
      } else {
        todayLog.fastingDurationHours = (todayLog.fastingDurationHours || 0) + durationHours;
      }
      
      const updatedData: FitMeData = {
        ...data,
        days,
        fastingState: { startTime: null }
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      
      setData(updatedData);
    } catch (e: any) {
      alert("结束断食失败: " + e.message);
    } finally {
      setIsFastingSaving(false);
    }
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setIsVitalsSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const age = parseInt(settingsAge);
      const height = parseFloat(settingsHeight);
      const targetW = parseFloat(settingsTargetWeight);
      if (isNaN(age) || isNaN(height)) {
        alert("请输入有效的年龄和身高");
        return;
      }
      
      const newTarget: [number, number] = isNaN(targetW) ? [data.profile.latestWeightKg - 5, data.profile.latestWeightKg - 5] : [targetW, targetW];
      
      const updatedProfile = {
        ...data.profile,
        sex: settingsSex,
        age,
        heightCm: height,
        targetWeightRangeKg: newTarget
      };
      
      const updatedData: FitMeData = {
        ...data,
        profile: updatedProfile
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
      setShowSettings(false);
    } catch (e: any) {
      alert("保存设置失败: " + e.message);
    } finally {
      setIsVitalsSaving(false);
    }
  };

  const calculatePeriodDay = (dateStr: string) => {
    if (!data) return 1;
    let count = 0;
    let current = new Date(dateStr);
    
    while (true) {
      const currentStr = current.toISOString().slice(0, 10);
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

  const handleTogglePeriod = async (dateStr: string, flow: "light" | "medium" | "heavy" | null) => {
    if (!data) return;
    setIsVitalsSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const days = [...(data.days || [])];
      let dayLog = days.find(d => d.date === dateStr);
      
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0,
          intakeRangeKcal: [0, 0],
          proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动",
          exerciseKcal: 0,
          deficitKcal: 0,
          note: "",
          meals: [],
          period: flow ? { flow } : null
        };
        days.push(dayLog);
      } else {
        dayLog.period = flow ? { flow } : null;
      }
      
      const updatedData: FitMeData = {
        ...data,
        days
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
    } catch (e: any) {
      alert("更新经期记录失败: " + e.message);
    } finally {
      setIsVitalsSaving(false);
    }
  };

  const handleQuickBowelMovement = async (dateStr: string, type: "normal" | "loose" | "constipated" = "normal") => {
    if (!data) return;
    setIsVitalsSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const days = [...(data.days || [])];
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
          intakeKcal: 0,
          intakeRangeKcal: [0, 0],
          proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动",
          exerciseKcal: 0,
          deficitKcal: 0,
          note: "",
          meals: [],
          bowelMovements: [newLog]
        };
        days.push(dayLog);
      } else {
        dayLog.bowelMovements = [...(dayLog.bowelMovements || []), newLog];
      }
      
      const updatedData: FitMeData = {
        ...data,
        days
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
    } catch (e: any) {
      alert("记录排便失败: " + e.message);
    } finally {
      setIsVitalsSaving(false);
    }
  };

  const handleDeleteBowelMovement = async (dateStr: string, itemId: string) => {
    if (!data) return;
    setIsVitalsSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const days = [...(data.days || [])];
      const dayLog = days.find(d => d.date === dateStr);
      if (dayLog) {
        dayLog.bowelMovements = (dayLog.bowelMovements || []).filter(item => item.id !== itemId);
      }
      
      const updatedData: FitMeData = {
        ...data,
        days
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
    } catch (e: any) {
      alert("删除排便记录失败: " + e.message);
    } finally {
      setIsVitalsSaving(false);
    }
  };

  const handleSaveWeight = async (dateStr: string, weight: number) => {
    if (!data) return;
    setIsVitalsSaving(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
      const days = [...(data.days || [])];
      let dayLog = days.find(d => d.date === dateStr);
      
      if (!dayLog) {
        dayLog = {
          date: dateStr,
          label: dateStr.slice(5).replace("-", "/"),
          intakeKcal: 0,
          intakeRangeKcal: [0, 0],
          proteinRangeG: [0, 0],
          exerciseLabel: "未记录运动",
          exerciseKcal: 0,
          deficitKcal: 0,
          note: "",
          meals: [],
          weightKg: weight
        };
        days.push(dayLog);
      } else {
        dayLog.weightKg = weight;
      }
      
      const updatedProfile = {
        ...data.profile,
        latestWeightKg: weight
      };
      
      const updatedData: FitMeData = {
        ...data,
        profile: updatedProfile,
        days
      };
      
      const res = await fetch("/api/health-data", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-fitme-passcode": activeCode },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error(await res.text());
      setData(updatedData);
    } catch (e: any) {
      alert("保存体重失败: " + e.message);
    } finally {
      setIsVitalsSaving(false);
    }
  };

  const renderStatsChart = () => {
    const last10Days = [...(data?.days || [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    if (last10Days.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
          <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600" }}>{t("chartEmpty")}</p>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>{t("chartEmptyNote")}</p>
        </div>
      );
    }

    const width = 500;
    const height = 200;
    const padLeft = 40;
    const padRight = 20;
    const padTop = 25;
    const padBot = 25;
    const cWidth = width - padLeft - padRight;
    const cHeight = height - padTop - padBot;
    const numDays = last10Days.length;
    
    const barWidth = Math.min(20, (cWidth / numDays) * 0.4);
    const getX = (index: number) => {
      const step = cWidth / (numDays || 1);
      return padLeft + index * step + step / 2;
    };

    if (activeChartTab === "fasting") {
      const maxVal = Math.max(...last10Days.map(d => d.fastingDurationHours || 0), 24);
      const getY = (val: number) => cHeight + padTop - (val / maxVal) * cHeight;
      const targetY = getY(16);

      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="fastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d8f63" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#2d8f63" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          {[0, 6, 12, 18, 24].map(h => {
            if (h > maxVal) return null;
            const y = getY(h);
            return (
              <g key={h}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(21, 36, 29, 0.08)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--muted)" fontSize={9} fontWeight="600">{h}h</text>
              </g>
            );
          })}

          {maxVal >= 16 && (
            <g>
              <line x1={padLeft} y1={targetY} x2={width - padRight} y2={targetY} stroke="rgba(217, 83, 79, 0.4)" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={width - padRight - 5} y={targetY - 5} textAnchor="end" fill="rgba(217, 83, 79, 0.9)" fontSize={8} fontWeight="bold">{t("chartFastingTarget")}</text>
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
                    rx={3}
                    fill="url(#fastGrad)"
                  />
                )}
                {val > 0 && (
                  <text x={x} y={y - 6} textAnchor="middle" fill="var(--ink)" fontSize={8} fontWeight="700">
                    {val.toFixed(1)}h
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="var(--muted)" fontSize={9} fontWeight="600">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
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
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="periodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8b77" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#ff8b77" stopOpacity={0.2} />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map(flow => {
            const y = getY(flow);
            const label = flow === 0 ? t("chartPeriodLabel0") : flow === 1 ? t("chartPeriodLabel1") : flow === 2 ? t("chartPeriodLabel2") : t("chartPeriodLabel3");
            return (
              <g key={flow}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255, 139, 119, 0.08)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--muted)" fontSize={9} fontWeight="600">{label}</text>
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
                    rx={3}
                    fill="url(#periodGrad)"
                  />
                )}
                {val > 0 && (
                  <text x={x} y={y - 6} textAnchor="middle" fontSize={10}>
                    🌸
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="var(--muted)" fontSize={9} fontWeight="600">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    if (activeChartTab === "bowel") {
      const maxBowel = Math.max(...last10Days.map(d => d.bowelMovements?.length || 0), 3);
      const getY = (val: number) => cHeight + padTop - (val / maxBowel) * cHeight;

      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="bowelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cfa17b" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#8d5b4c" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          {Array.from({ length: maxBowel + 1 }).map((_, b) => {
            const y = getY(b);
            return (
              <g key={b}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(21, 36, 29, 0.08)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--muted)" fontSize={9} fontWeight="600">{b} {t("chartBowelUnit")}</text>
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
                    rx={3}
                    fill="url(#bowelGrad)"
                  />
                )}
                {val > 0 && (
                  <text x={x} y={y - 6} textAnchor="middle" fill="#8d5b4c" fontSize={8} fontWeight="bold">
                    💩 {val}
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="var(--muted)" fontSize={9} fontWeight="600">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    if (activeChartTab === "weight") {
      const weightDays = last10Days.filter(d => d.weightKg && d.weightKg > 0);
      
      if (weightDays.length === 0) {
        return (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600" }}>{t("weightTitle")}</p>
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
      const areaD = pathD 
        ? `${pathD} L ${points[points.length - 1].x} ${cHeight + padTop} L ${points[0].x} ${cHeight + padTop} Z`
        : "";
        
      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#41aa74" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#41aa74" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {Array.from({ length: 5 }).map((_, idx) => {
            const val = minWeight + (weightRange / 4) * idx;
            const y = getY(val);
            return (
              <g key={idx}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(21, 36, 29, 0.08)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="var(--muted)" fontSize={9} fontWeight="600">{val.toFixed(1)}kg</text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#weightGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="#41aa74" strokeWidth={2} />}

          {last10Days.map((d, idx) => {
            const val = d.weightKg;
            const x = getX(idx);
            const y = val ? getY(val) : 0;
            
            return (
              <g key={d.date}>
                {val && val > 0 && (
                  <g>
                    <circle cx={x} cy={y} r={3.5} fill="#ffffff" stroke="#41aa74" strokeWidth={2} />
                    <text x={x} y={y - 8} textAnchor="middle" fill="var(--ink)" fontSize={8} fontWeight="700">
                      {val.toFixed(1)}kg
                    </text>
                  </g>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="var(--muted)" fontSize={9} fontWeight="600">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    setSetupLoading(true);
    try {
      const activeCode = localStorage.getItem("fitme_passcode") || "";
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

      const profile: Profile = {
        sex: setupSex,
        age: ageNum,
        heightCm: heightNum,
        latestWeightKg: weightNum,
        targetWeightRangeKg: [targetWeightNum, targetWeightNum],
        bmrKcal: bmr,
        sedentaryMaintenanceKcalRange: maintenanceRange
      };

      const targets: Targets = {
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

      const updatedData: FitMeData = {
        ...data,
        profile,
        targets,
        updatedAt: new Date().toISOString().slice(0, 10),
        periodLabel: new Date().toISOString().slice(0, 10),
      };

      // 3. Save to Supabase
      const saveRes = await fetch("/api/health-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fitme-passcode": activeCode
        },
        body: JSON.stringify(updatedData)
      });

      if (!saveRes.ok) {
        throw new Error(await saveRes.text());
      }

      setData(updatedData);
    } catch (e: any) {
      alert("初始化档案失败：" + e.message);
    } finally {
      setSetupLoading(false);
    }
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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    setSubmitting(true);
    try {
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
      const updatedDays = [...data.days];
      const maintenanceAvg = Math.round(
        (data.profile.sedentaryMaintenanceKcalRange[0] +
          data.profile.sedentaryMaintenanceKcalRange[1]) /
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
      day.nutritionAdvice = getNutritionAdvice(day.nutrition, data.targets.nutrition);

      // Sort days chronologically
      updatedDays.sort((a, b) => a.date.localeCompare(b.date));

      // 4. Update core logs object
      const updatedData: FitMeData = {
        ...data,
        updatedAt: formDate,
        periodLabel: `${updatedDays[0]?.date || formDate}-${updatedDays.at(-1)?.date || formDate}`,
        days: updatedDays,
        stats: {
          proteinQualifiedDays: updatedDays.filter(
            item => item.proteinRangeG?.[1] >= data.targets.dailyProteinRangeG[0]
          ).length
        },
        copy: {
          ...data.copy,
          overview: `今天已记录 ${day.intakeKcal} kcal，蛋白约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`,
          summary: [
            `今天目前已摄入约 ${day.intakeKcal} kcal。`,
            `蛋白质目前约 ${day.proteinRangeG[0]}-${day.proteinRangeG[1]}g。`,
            day.nutrition?.fiberG
              ? `膳食纤维约 ${day.nutrition.fiberG}g，钠约 ${day.nutrition.sodiumMg}mg。`
              : "营养维度还不完整，继续记录后会补齐。",
            "继续按当天目标调整下一餐。"
          ]
        }
      };

      // 5. Send payload to save
      const saveRes = await fetch("/api/health-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fitme-passcode": activeCode
        },
        body: JSON.stringify(updatedData)
      });

      if (!saveRes.ok) {
        throw new Error(await saveRes.text());
      }

      // Success reload
      setData(updatedData);
      setShowModal(false);
      resetForm();
    } catch (e: any) {
      alert("保存失败：" + e.message);
    } finally {
      setSubmitting(false);
    }
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
      <div className="lock-screen-overlay">
        <div className="lock-card">
          <div className="lock-title">载入中...</div>
          <div className="lock-subtitle">正在获取您的健康看板数据</div>
        </div>
      </div>
    );
  }

  // 1. Render Lock Screen
  if (authenticated === false) {
    return (
      <div className="lock-screen-overlay">
        {/* Language select on top right */}
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
            value={lang}
            onChange={(e) => {
              const val = e.target.value as any;
              setLang(val);
              localStorage.setItem("fitme_lang", val);
            }}
          >
            <option value="en">English 🇬🇧</option>
            <option value="zh">简体中文 🇨🇳</option>
            <option value="ja">日本語 🇯🇵</option>
          </select>
        </div>

        {/* Glowing background orbs */}
        <div className="lock-bg-orb lock-bg-orb-1" />
        <div className="lock-bg-orb lock-bg-orb-2" />

        <form className={`lock-card ${shake ? "shake" : ""}`} onSubmit={handleUnlock}>
          <div className="lock-title">{t("lockTitle")}</div>
          <div className="lock-subtitle">{t("lockPasscode")}</div>
          
          <div className="passcode-container">
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
            <div className="passcode-slots">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = passcode.length > index;
                const isActive = passcode.length === index;
                return (
                  <div
                    key={index}
                    className={`passcode-slot ${isFilled ? "filled" : ""} ${isActive ? "active" : ""}`}
                  >
                    {isFilled ? "●" : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {passcodeError && <div className="lock-error">{t("lockError")}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }}>
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
      <div className="lock-screen-overlay">
        {/* Language select on top right */}
        <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10 }}>
          <select
            className="form-select"
            style={{ width: "auto", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}
            value={lang}
            onChange={(e) => {
              const val = e.target.value as any;
              setLang(val);
              localStorage.setItem("fitme_lang", val);
            }}
          >
            <option value="en">English 🇬🇧</option>
            <option value="zh">简体中文 🇨🇳</option>
            <option value="ja">日本語 🇯🇵</option>
          </select>
        </div>

        {/* Glowing background orbs */}
        <div className="lock-bg-orb lock-bg-orb-1" />
        <div className="lock-bg-orb lock-bg-orb-2" />

        <form className="lock-card" style={{ width: "min(440px, 94vw)", padding: "30px 24px" }} onSubmit={handleSetupSubmit}>
          <div className="lock-title">{t("onboardTitle")}</div>
          <div className="lock-subtitle">Configuring bodily metrics generates BMR & caloric goals.</div>

          <div className="modal-body" style={{ padding: 0, gap: "14px", textAlign: "left", margin: "20px 0" }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t("onboardSex")}</label>
                <select className="form-select" value={setupSex} onChange={e => setSetupSex(e.target.value)}>
                  <option value="male">{t("onboardMale")} ♂</option>
                  <option value="female">{t("onboardFemale")} ♀</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t("onboardAge")}</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  className="form-input"
                  value={setupAge}
                  onChange={e => setSetupAge(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{t("onboardHeight")}</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="250"
                  className="form-input"
                  value={setupHeight}
                  onChange={e => setSetupHeight(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t("onboardWeight")}</label>
                <input
                  type="number"
                  required
                  min="10"
                  max="300"
                  className="form-input"
                  value={setupWeight}
                  onChange={e => setSetupWeight(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("onboardTarget")}</label>
              <input
                type="number"
                min="10"
                max="300"
                className="form-input"
                placeholder={t("onboardTargetPlaceholder")}
                value={setupTargetWeight}
                onChange={e => setSetupTargetWeight(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={setupLoading}>
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
  const latestDateStr = new Date().toISOString().slice(0, 10);
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
    <main className="page">
      {/* 2. Topbar Header */}
      <div className="topbar">
        <div>
          <p className="eyebrow" id="periodLabel">
            {t("topEyebrow", { range: data.periodLabel })}
          </p>
          <h1 id="pageTitle">{t("topTitle")}</h1>
          <p className="subcopy">
            {t("topSubcopy")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div className="status-pill" id="statusPill" style={{ margin: 0 }}>
            {t("topWeightStatus", { W: data.profile.latestWeightKg, G: targetWeightLabel })}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: "8px 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", border: "1px solid var(--glass-edge)" }}
            onClick={handleOpenSettings}
          >
            {t("settingsButton")}
          </button>
        </div>
      </div>

      {/* Fasting Timer Status Card */}
      <section className="fasting-banner" style={{ margin: "24px", background: "rgba(255,255,255,0.7)", padding: "18px 20px", borderRadius: "16px", border: "1px solid var(--glass-edge)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(21, 36, 29, 0.05)", backdropFilter: "blur(20px)" }}>
        <div>
          <p className="section-title" style={{ margin: "0 0 6px" }}>
            {data?.fastingState?.startTime ? t("fastActive") : t("fastIdle")}
          </p>
          <p className="metric-value" style={{ fontSize: "22px", margin: 0, color: data?.fastingState?.startTime ? "var(--green)" : "var(--muted)", letterSpacing: "1px" }}>
            {data?.fastingState?.startTime ? fastingElapsed || t("fastCalculating") : "--"}
          </p>
        </div>
        <button 
          className="btn" 
          style={{ background: data?.fastingState?.startTime ? "#ffebec" : "var(--green)", color: data?.fastingState?.startTime ? "#d93838" : "#fff", border: "none", padding: "10px 18px", fontSize: "14px", fontWeight: "700" }}
          onClick={data?.fastingState?.startTime ? handleEndFast : handleStartFast}
          disabled={isFastingSaving}
        >
          {isFastingSaving ? t("fastSaving") : (data?.fastingState?.startTime ? t("fastEnd") : t("fastStart"))}
        </button>
      </section>

      {/* 3. Simplified Today's Summary Card */}
      <section className="hero" style={{ gridTemplateColumns: "1fr", margin: "0 24px 24px" }}>
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-inner" style={{ marginBottom: "14px" }}>
            <p className="section-title">{t("sumTitle")}</p>
          </div>
          <div className="hero-grid" id="metricGrid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div className="metric">
              <span className="metric-label">{t("sumFasting")}</span>
              <span className="metric-value">{fmt(latest.fastingDurationHours || 0)} {t("sumFastingUnit")}</span>
              <span className="metric-note">
                {t("sumFastingNote")}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">{t("sumWeight")}</span>
              <span className="metric-value">{latest.weightKg ? `${latest.weightKg} kg` : `${data.profile.latestWeightKg} kg`}</span>
              <span className="metric-note">
                {latest.weightKg ? t("sumWeightNoteActive") : t("sumWeightNoteInactive")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Vitals Tracker Cards (Period & Bowels) */}
      <section className="section" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", margin: "0 24px 24px" }}>
        {/* Period Card */}
        <div className={`panel vitals-card period-card ${latest.period ? "active-period" : ""}`} style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0, color: latest.period ? "#ff7c7c" : "inherit" }}>
                {t("periodTitle")}
              </p>
              <div className="period-switch-wrap">
                <select
                  className="form-select"
                  style={{ width: "auto", padding: "4px 8px", fontSize: "12px", background: "rgba(255,255,255,0.15)", color: latest.period ? "#ffffff" : "inherit", border: "none" }}
                  value={latest.period?.flow || "none"}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleTogglePeriod(latest.date, val === "none" ? null : val as any);
                  }}
                  disabled={isVitalsSaving}
                >
                  <option value="none">{t("periodSwitchNone")}</option>
                  <option value="light">{t("periodSwitchLight")}</option>
                  <option value="medium">{t("periodSwitchMedium")}</option>
                  <option value="heavy">{t("periodSwitchHeavy")}</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {latest.period ? (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
                    {t("periodActive", { X: calculatePeriodDay(latest.date) })}
                  </h3>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>
                    {t("periodNoteActive", { F: latest.period.flow === "light" ? t("periodFlowLight") : latest.period.flow === "heavy" ? t("periodFlowHeavy") : t("periodFlowMedium") })}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", opacity: 0.7 }}>{t("periodInactive")}</h3>
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>{t("periodNoteInactive")}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bowel Movement Card */}
        <div className="panel vitals-card bowel-card" style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0 }}>{t("bowelTitle")}</p>
              <button
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => handleQuickBowelMovement(latest.date)}
                disabled={isVitalsSaving}
              >
                {t("bowelButton")}
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
                {t("bowelCount", { X: (latest.bowelMovements || []).length })}
              </h3>
              
              {/* Bowel list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px", maxHeight: "80px", overflowY: "auto" }}>
                {(latest.bowelMovements || []).length === 0 ? (
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>{t("bowelEmpty")}</span>
                ) : (
                  (latest.bowelMovements || []).map((item) => (
                    <span 
                      key={item.id} 
                      style={{ background: "rgba(141, 91, 76, 0.25)", border: "1px solid rgba(141, 91, 76, 0.4)", borderRadius: "20px", padding: "3px 8px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      💩 {item.time}
                      <button 
                        type="button"
                        style={{ background: "none", border: "none", color: "#ff8b77", cursor: "pointer", padding: "0 2px", fontWeight: "bold" }}
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
          </div>
        </div>

        {/* Weight Card */}
        <div className="panel vitals-card weight-card" style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0 }}>{t("weightTitle")}</p>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder={latest.weightKg ? latest.weightKg.toString() : (data?.profile?.latestWeightKg ? data.profile.latestWeightKg.toString() : "0.0")}
                  style={{ width: "65px", padding: "4px 8px", fontSize: "12px", background: "rgba(255,255,255,0.15)", color: "#ffffff", border: "none", borderRadius: "6px", textAlign: "center" }}
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  disabled={isVitalsSaving}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ padding: "4px 10px", fontSize: "12px" }}
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

            <div style={{ marginTop: "16px" }}>
              {latest.weightKg ? (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
                    {t("weightActive", { X: latest.weightKg })}
                  </h3>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>
                    {t("weightNoteActive")}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", opacity: 0.7 }}>{t("weightNotRecorded")}</h3>
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>
                    {t("weightNoteInactive", { X: data?.profile?.latestWeightKg ? data.profile.latestWeightKg : "0.0" })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 5. 4-Tab Statistical Chart Section */}
      <section className="section" style={{ gridTemplateColumns: "1fr", margin: "0 24px 24px" }}>
        <div className="panel wide" style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <p className="section-title" style={{ margin: 0 }}>{t("chartTitle")}</p>
              <div className="meal-toolbar" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "fasting" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("fasting")}
                >
                  {t("chartFasting")}
                </button>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "period" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("period")}
                >
                  {t("chartPeriod")}
                </button>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "bowel" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("bowel")}
                >
                  {t("chartBowel")}
                </button>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "weight" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("weight")}
                >
                  {t("chartWeight")}
                </button>
              </div>
            </div>
            <div style={{ minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {renderStatsChart()}
            </div>
          </div>
        </div>
      </section>

      {/* 8. Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-card" style={{ width: "min(440px, 94vw)" }}>
            <div className="modal-header">
              <h2 className="modal-title">{t("settingsTitle")}</h2>
              <button className="modal-close" onClick={() => setShowSettings(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveSettings}>
              <div className="modal-body">
                {/* Language selection */}
                <div className="form-group">
                  <label className="form-label">{t("settingsLang")}</label>
                  <select
                    className="form-select"
                    value={lang}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setLang(val);
                      localStorage.setItem("fitme_lang", val);
                    }}
                  >
                    <option value="en">English 🇬🇧</option>
                    <option value="zh">简体中文 🇨🇳</option>
                    <option value="ja">日本語 🇯🇵</option>
                  </select>
                </div>

                {/* Profile Edit fields */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("onboardSex")}</label>
                    <select
                      className="form-select"
                      value={settingsSex}
                      onChange={(e) => setSettingsSex(e.target.value)}
                    >
                      <option value="male">{t("onboardMale")} ♂</option>
                      <option value="female">{t("onboardFemale")} ♀</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("onboardAge")}</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      className="form-input"
                      value={settingsAge}
                      onChange={(e) => setSettingsAge(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t("onboardHeight")}</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="250"
                      className="form-input"
                      value={settingsAge === "" ? "" : settingsHeight}
                      onChange={(e) => setSettingsHeight(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("onboardTarget")}</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      className="form-input"
                      placeholder={t("onboardTargetPlaceholder")}
                      value={settingsTargetWeight}
                      onChange={(e) => setSettingsTargetWeight(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettings(false)}
                  disabled={isVitalsSaving}
                >
                  {t("settingsClose")}
                </button>
                <button type="submit" className="btn btn-primary" disabled={isVitalsSaving}>
                  {isVitalsSaving ? t("fastSaving") : t("settingsSaveProfile")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
