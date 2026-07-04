import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_PROFILE = {
  sex: "male",
  age: 30,
  heightCm: 175,
  latestWeightKg: 70,
  bmrKcal: 1649,
  sedentaryMaintenanceKcalRange: [1896, 1979]
};

const DEFAULT_DATA = {
  updatedAt: new Date().toISOString().slice(0, 10),
  periodLabel: new Date().toISOString().slice(0, 10),
  profile: DEFAULT_PROFILE,
  targets: {
    dailyKcalRange: [1600, 1900],
    dailyProteinRangeG: [90, 120],
    proteinCompletionTargetG: 108,
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
  },
  stats: { proteinQualifiedDays: 0 },
  copy: {
    title: "减脂进度面板",
    overview: "FitMe 已初始化。记录第一餐后，这里会显示当天进度。",
    footnote: "缺口按主估值计算：维持消耗 + 已记录运动 - 摄入。运动消耗不做过度放大，主要看趋势。",
    summary: [
      "先记录今天的第一餐。",
      "优先保证蛋白质，再控制总热量。",
      "所有数据保存在 Supabase 中。"
    ]
  },
  days: []
};

// Helper to verify passcode
function verifyAuth(req: NextRequest) {
  const passcode = process.env.FITME_PASSCODE;
  if (!passcode) return true; // If passcode is not set, allow access
  const clientPasscode = req.headers.get("x-fitme-passcode");
  return clientPasscode === passcode;
}

export async function GET(req: NextRequest) {
  if (!verifyAuth(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json(
      { ok: false, error: "Missing Supabase configuration env variables" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("fitme_health_data")
      .select("json_data")
      .eq("id", 1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Record does not exist, insert initial default record
        const { error: insertError } = await supabase
          .from("fitme_health_data")
          .insert([{ id: 1, json_data: DEFAULT_DATA }]);

        if (insertError) {
          throw new Error("Failed to insert default health data: " + insertError.message);
        }
        return Response.json(DEFAULT_DATA);
      }
      throw error;
    }

    return Response.json(data.json_data);
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAuth(req)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return Response.json(
      { ok: false, error: "Missing Supabase configuration env variables" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const { error } = await supabase
      .from("fitme_health_data")
      .update({ json_data: body, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}
