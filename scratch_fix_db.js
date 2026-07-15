const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env['SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function fixData() {
  const data = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));
  const days = data.days;

  // Fix 07-14 -> 07-15
  const day14 = days.find(d => d.date === '2026-07-14');
  let bmToMove1 = null;
  if (day14 && day14.bowelMovements) {
    const idx = day14.bowelMovements.findIndex(b => b.id === 'tcgcr0x');
    if (idx !== -1) {
      bmToMove1 = day14.bowelMovements.splice(idx, 1)[0];
      console.log('Found BM on 07-14:', bmToMove1);
    }
  }
  
  if (bmToMove1) {
    let day15 = days.find(d => d.date === '2026-07-15');
    if (!day15) {
      day15 = {
        date: "2026-07-15",
        label: "07/15",
        intakeKcal: 0, intakeRangeKcal: [0,0], proteinRangeG: [0,0],
        exerciseLabel: "未记录运动", exerciseKcal: 0,
        deficitKcal: 1399,
        note: "", meals: [], bowelMovements: [], fastingDurationHours: 0
      };
      days.push(day15);
    }
    if (!day15.bowelMovements) day15.bowelMovements = [];
    day15.bowelMovements.push(bmToMove1);
    console.log('Moved BM to 07-15');
  }

  // Fix 07-12 -> 07-13
  const day12 = days.find(d => d.date === '2026-07-12');
  let bmToMove2 = null;
  if (day12 && day12.bowelMovements) {
    const idx = day12.bowelMovements.findIndex(b => b.id === 'y0eym62');
    if (idx !== -1) {
      bmToMove2 = day12.bowelMovements.splice(idx, 1)[0];
      console.log('Found BM on 07-12:', bmToMove2);
    }
  }

  if (bmToMove2) {
    let day13 = days.find(d => d.date === '2026-07-13');
    if (!day13.bowelMovements) day13.bowelMovements = [];
    day13.bowelMovements.push(bmToMove2);
    console.log('Moved BM to 07-13');
  }

  // Save back
  const { error } = await supabase.from('fitme_health_data').update({ json_data: data }).eq('id', 1);
  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update successful!');
  }
}

fixData();
