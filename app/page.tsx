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
  snack: "加餐/饮品",
  exercise: "运动/消耗"
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

  // Active chart tab (fasting | food | vitals)
  const [activeChartTab, setActiveChartTab] = useState<"fasting" | "food" | "vitals">("fasting");
  const [isVitalsSaving, setIsVitalsSaving] = useState(false);

  // Form Fields
  const [formDate, setFormDate] = useState("");
  const [formType, setFormType] = useState("breakfast");
  const [formTitle, setFormTitle] = useState("");
  const [formKcal, setFormKcal] = useState("");
  const [formProtein, setFormProtein] = useState("");
  const [formDescription, setFormDescription] = useState("");
  
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
      
      // 极度连贯的 UX: 自动呼出记录破酮餐界面
      setFormType("breakfast"); 
      setFormTitle("");
      setFormKcal("");
      setFormProtein("");
      setShowModal(true);
    } catch (e: any) {
      alert("结束断食失败: " + e.message);
    } finally {
      setIsFastingSaving(false);
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

  const renderStatsChart = () => {
    const last10Days = [...(data?.days || [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-10);

    if (last10Days.length === 0) {
      return (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#8fae9f" }}>
          <p style={{ margin: "0 0 10px", fontSize: "14px", fontWeight: "600" }}>📊 暂无历史趋势数据</p>
          <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>开始记录断食与餐食后，图表将自动生成。</p>
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
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9}>{h}h</text>
              </g>
            );
          })}

          {maxVal >= 16 && (
            <g>
              <line x1={padLeft} y1={targetY} x2={width - padRight} y2={targetY} stroke="rgba(255, 139, 119, 0.4)" strokeWidth={1.5} strokeDasharray="3 3" />
              <text x={width - padRight - 5} y={targetY - 5} textAnchor="end" fill="rgba(255, 139, 119, 0.8)" fontSize={8} fontWeight="bold">16h 断食目标线</text>
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
                  <text x={x} y={y - 6} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="600">
                    {val.toFixed(1)}h
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    if (activeChartTab === "food") {
      const maxCal = Math.max(...last10Days.map(d => d.intakeKcal || 0), 1200);
      const getY = (val: number) => cHeight + padTop - (val / maxCal) * cHeight;

      const points = last10Days.map((d, idx) => ({ x: getX(idx), y: getY(d.intakeKcal) }));
      const pathD = points.length > 0 
        ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")
        : "";
      const areaD = pathD 
        ? `${pathD} L ${points[points.length - 1].x} ${cHeight + padTop} L ${points[0].x} ${cHeight + padTop} Z`
        : "";

      return (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
          <defs>
            <linearGradient id="foodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d8f63" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#2d8f63" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          {[0, 500, 1000, 1500, 2000, 2500].map(c => {
            if (c > maxCal * 1.1) return null;
            const y = getY(c);
            return (
              <g key={c}>
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9}>{c}</text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#foodGrad)" />}
          {pathD && <path d={pathD} fill="none" stroke="#2d8f63" strokeWidth={2} />}

          {last10Days.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.intakeKcal);
            const prot = d.proteinRangeG ? (d.proteinRangeG[0] + d.proteinRangeG[1]) / 2 : 0;

            return (
              <g key={d.date}>
                <circle cx={x} cy={y} r={3.5} fill="#ffffff" stroke="#2d8f63" strokeWidth={2} />
                <text x={x} y={y - 8} textAnchor="middle" fill="#ffffff" fontSize={8} fontWeight="600">
                  {d.intakeKcal}
                </text>
                {prot > 0 && (
                  <text x={x} y={cHeight + padTop - 6} textAnchor="middle" fill="#8fae9f" fontSize={8} fontWeight="bold">
                    {Math.round(prot)}g
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    if (activeChartTab === "vitals") {
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
                <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                <text x={padLeft - 8} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize={9}>{b}次</text>
              </g>
            );
          })}

          {last10Days.map((d, idx) => {
            if (!d.period) return null;
            const x = getX(idx);
            const step = cWidth / (numDays || 1);
            return (
              <rect
                key={`period-${d.date}`}
                x={x - step / 2 + 1}
                y={padTop}
                width={step - 2}
                height={cHeight}
                fill="rgba(255, 139, 119, 0.09)"
                stroke="rgba(255, 139, 119, 0.25)"
                strokeWidth={1}
                strokeDasharray="2 2"
                rx={4}
              />
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
                  <text x={x} y={y - 6} textAnchor="middle" fill="#cfa17b" fontSize={8} fontWeight="bold">
                    💩 {val}
                  </text>
                )}
                {d.period && (
                  <text x={x} y={padTop + 14} textAnchor="middle" fontSize={10}>
                    🌸
                  </text>
                )}
                <text x={x} y={height - 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={9}>
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
        {/* Glowing background orbs */}
        <div className="lock-bg-orb lock-bg-orb-1" />
        <div className="lock-bg-orb lock-bg-orb-2" />

        <form className={`lock-card ${shake ? "shake" : ""}`} onSubmit={handleUnlock}>
          <div className="lock-title">FitMe 锁定</div>
          <div className="lock-subtitle">请输入您的安全密码以访问健康看板</div>
          
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

          {passcodeError && <div className="lock-error">{passcodeError}</div>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "20px" }}>
            验证并解锁
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
        {/* Glowing background orbs */}
        <div className="lock-bg-orb lock-bg-orb-1" />
        <div className="lock-bg-orb lock-bg-orb-2" />

        <form className="lock-card" style={{ width: "min(440px, 94vw)", padding: "30px 24px" }} onSubmit={handleSetupSubmit}>
          <div className="lock-title">创建健康档案</div>
          <div className="lock-subtitle">配置您的身体数据，系统将自动生成 BMR 和减脂热量目标</div>

          <div className="modal-body" style={{ padding: 0, gap: "14px", textAlign: "left", margin: "20px 0" }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">性别</label>
                <select className="form-select" value={setupSex} onChange={e => setSetupSex(e.target.value)}>
                  <option value="male">男 ♂</option>
                  <option value="female">女 ♀</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">年龄 (岁)</label>
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
                <label className="form-label">身高 (cm)</label>
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
                <label className="form-label">当前体重 (kg)</label>
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
              <label className="form-label">目标体重 (kg, 可选)</label>
              <input
                type="number"
                min="10"
                max="300"
                className="form-input"
                placeholder="留空则默认为当前体重减 5kg"
                value={setupTargetWeight}
                onChange={e => setSetupTargetWeight(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={setupLoading}>
            {setupLoading ? "正在初始化..." : "生成我的减脂计划"}
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
      ? `${targetWeightRange[0]}kg`
      : `${targetWeightRange[0]}-${targetWeightRange[1]}kg`;

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
            Nutrition Log · {data.periodLabel}
          </p>
          <h1 id="pageTitle">{safeCopy.title}</h1>
          <p className="subcopy">
            专注断食与饮食的健康追踪管理，支持经期与每日排便状况记录。
          </p>
        </div>
        <div className="status-pill" id="statusPill">
          当前体重 {data.profile.latestWeightKg}kg · 目标 {targetWeightLabel}
        </div>
      </div>

      {/* Fasting Timer Status Card */}
      <section className="fasting-banner" style={{ margin: "24px", background: "rgba(255,255,255,0.7)", padding: "18px 20px", borderRadius: "16px", border: "1px solid var(--glass-edge)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(21, 36, 29, 0.05)", backdropFilter: "blur(20px)" }}>
        <div>
          <p className="section-title" style={{ margin: "0 0 6px" }}>
            {data?.fastingState?.startTime ? "🔥 断食燃烧中" : "⏸️ 尚未断食"}
          </p>
          <p className="metric-value" style={{ fontSize: "22px", margin: 0, color: data?.fastingState?.startTime ? "var(--green)" : "var(--muted)", letterSpacing: "1px" }}>
            {data?.fastingState?.startTime ? fastingElapsed || "计算中..." : "--"}
          </p>
        </div>
        <button 
          className="btn" 
          style={{ background: data?.fastingState?.startTime ? "#ffebec" : "var(--green)", color: data?.fastingState?.startTime ? "#d93838" : "#fff", border: "none", padding: "10px 18px", fontSize: "14px", fontWeight: "700" }}
          onClick={data?.fastingState?.startTime ? handleEndFast : handleStartFast}
          disabled={isFastingSaving}
        >
          {isFastingSaving ? "保存中..." : (data?.fastingState?.startTime ? "结束并进食" : "开始断食")}
        </button>
      </section>

      {/* 3. Simplified Today's Summary Card */}
      <section className="hero" style={{ gridTemplateColumns: "1fr", margin: "0 24px 24px" }}>
        <div className="panel" style={{ margin: 0 }}>
          <div className="panel-inner" style={{ marginBottom: "14px" }}>
            <p className="section-title">今日记录总览</p>
          </div>
          <div className="hero-grid" id="metricGrid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            <div className="metric">
              <span className="metric-label">今日摄入</span>
              <span className="metric-value">{fmt(latest.intakeKcal)} kcal</span>
              <span className="metric-note">
                今日推荐 {data.targets.dailyKcalRange[0]}-{data.targets.dailyKcalRange[1]} kcal
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">蛋白质补充</span>
              <span className="metric-value">{fmt(todayProtein)} g</span>
              <span className="metric-note">
                每日目标 {data.targets.proteinCompletionTargetG} g
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">今日累计断食</span>
              <span className="metric-value">{fmt(latest.fastingDurationHours || 0)} 小时</span>
              <span className="metric-note">
                今日已完成断食计时时长
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Vitals Tracker Cards (Period & Bowels) */}
      <section className="section" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px", margin: "0 24px 24px" }}>
        {/* Period Card */}
        <div className={`panel vitals-card period-card ${latest.period ? "active-period" : ""}`} style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0, color: latest.period ? "#ff7c7c" : "inherit" }}>
                🌸 经期记录
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
                  <option value="none">非经期 ⏸️</option>
                  <option value="light">经期：流量偏少 🌸</option>
                  <option value="medium">经期：流量中等 🌸🌸</option>
                  <option value="heavy">经期：流量偏多 🌸🌸🌸</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              {latest.period ? (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
                    经期中 · 第 {calculatePeriodDay(latest.date)} 天
                  </h3>
                  <span style={{ fontSize: "12px", opacity: 0.8 }}>
                    当前流量：{latest.period.flow === "light" ? "偏少" : latest.period.flow === "heavy" ? "偏多" : "中等"}
                  </span>
                </div>
              ) : (
                <div>
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", opacity: 0.7 }}>非经期状态</h3>
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>若经期来潮，请在上方选择流量进行记录</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bowel Movement Card */}
        <div className="panel vitals-card bowel-card" style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="section-title" style={{ margin: 0 }}>💩 每日排便记录</p>
              <button
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => handleQuickBowelMovement(latest.date)}
                disabled={isVitalsSaving}
              >
                💩 记一次排便
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <h3 style={{ margin: "0 0 6px", fontSize: "20px", color: "#ffffff" }}>
                今日已排便 {(latest.bowelMovements || []).length} 次
              </h3>
              
              {/* Bowel list */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px", maxHeight: "80px", overflowY: "auto" }}>
                {(latest.bowelMovements || []).length === 0 ? (
                  <span style={{ fontSize: "12px", opacity: 0.6 }}>今日暂无排便记录</span>
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
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 3-Tab Statistical Chart Section */}
      <section className="section" style={{ gridTemplateColumns: "1fr", margin: "0 24px 24px" }}>
        <div className="panel wide" style={{ margin: 0 }}>
          <div className="panel-inner">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
              <p className="section-title" style={{ margin: 0 }}>数据分析统计</p>
              <div className="meal-toolbar" style={{ margin: 0 }}>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "fasting" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("fasting")}
                >
                  ⏳ 断食趋势
                </button>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "food" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("food")}
                >
                  🥗 饮食摄入
                </button>
                <button
                  type="button"
                  className={`meal-filter ${activeChartTab === "vitals" ? "is-active" : ""}`}
                  onClick={() => setActiveChartTab("vitals")}
                >
                  🌸💩 生理排便
                </button>
              </div>
            </div>
            <div style={{ minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {renderStatsChart()}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Daily Meals Details */}
      <section className="section" style={{ gridTemplateColumns: "1fr", margin: "0 24px 24px" }}>
        <div className="panel wide" style={{ margin: 0 }}>
          <div className="panel-inner">
            <p className="section-title">每日餐食日记</p>
            <div className="meal-toolbar">
              {Object.entries(mealLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`meal-filter ${activeMealFilter === key ? "is-active" : ""}`}
                  onClick={() => setActiveMealFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="meal-days" style={{ marginTop: "16px" }}>
              {filteredDaysList.length === 0 ? (
                <p className="footer-note">当前筛选下暂无饮食记录。</p>
              ) : (
                filteredDaysList.map((d, index) => (
                  <details className="meal-day" key={d.date} open={index === 0}>
                    <summary>
                      <span className="meal-day-label">{d.label}</span>
                      <span className="meal-day-note">{d.note || "已记录餐食"}</span>
                      <span className="meal-day-total">
                        {d.intakeKcal > 0 ? `${fmt(d.intakeKcal)} kcal` : ""}
                      </span>
                    </summary>
                    <div className="meal-list">
                      {d.filteredMeals.map(m => (
                        <article className="meal-card" key={m.id}>
                          {m.imagePaths?.[0] ? (
                            <img className="meal-photo" src={m.imagePaths[0]} alt={m.title} />
                          ) : (
                            <div className="meal-photo meal-photo-placeholder">
                              {mealLabels[m.type] || "餐食"}
                            </div>
                          )}
                          <div className="meal-card-main">
                            <div className="meal-card-head">
                              <div>
                                <span className="meal-kind">{mealLabels[m.type] || m.type}</span>
                                <h3 className="meal-title">{m.title}</h3>
                              </div>
                            </div>
                            {m.description && <div className="meal-desc">{m.description}</div>}
                            <div className="meal-numbers">
                              <span className="meal-number">{fmt(m.kcal)} kcal</span>
                              {m.proteinRangeG && (
                                <span className="meal-number">
                                  蛋白 {fmt(m.proteinRangeG[0])}-{fmt(m.proteinRangeG[1])}g
                                </span>
                              )}
                            </div>
                            {m.source && <div className="meal-source">来源：{m.source}</div>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </details>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Floating Add Button */}
      <button className="floating-add-btn" onClick={() => setShowModal(true)}>
        +
      </button>

      {/* 8. Add Record Dialog/Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">记录一笔饮食</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Date */}
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                  />
                </div>

                {/* Type & Title */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">记录类型</label>
                    <select
                      className="form-select"
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                    >
                      <option value="breakfast">早餐 🍳</option>
                      <option value="lunch">午餐 🍱</option>
                      <option value="dinner">晚餐 🥩</option>
                      <option value="snack">加餐/饮品 ☕</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">餐食名称</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., 煎鸡胸肉沙拉"
                      className="form-input"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                    />
                  </div>
                </div>

                {/* kcal & protein */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">热量 (kcal)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="e.g., 350"
                      className="form-input"
                      value={formKcal}
                      onChange={e => setFormKcal(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">蛋白质 (g, 可选)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g., 28"
                      className="form-input"
                      value={formProtein}
                      onChange={e => setFormProtein(e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">简要备注</label>
                  <textarea
                    rows={2}
                    placeholder="e.g., 加了半个牛油果，无糖酱汁"
                    className="form-textarea"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                  />
                </div>

                {/* Image upload */}
                <div className="form-group">
                  <label className="form-label">上传餐食实拍</label>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  {!imagePreview ? (
                    <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                      <span>📷 点击拍照或上传照片</span>
                      <span className="upload-zone-text">大小支持 8MB 以内</span>
                    </div>
                  ) : (
                    <div className="upload-zone" style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <div className="upload-preview-container">
                        <img className="upload-preview" src={imagePreview} alt="Preview" />
                        <div className="upload-remove" onClick={removeSelectedImage}>
                          &times;
                        </div>
                      </div>
                      <span className="upload-zone-text" style={{ alignSelf: "center" }}>
                        照片选择成功
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "正在保存..." : "完成记录"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
