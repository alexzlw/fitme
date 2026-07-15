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

async function fetchData() {
  const { data, error } = await supabase.from('fitme_health_data').select('json_data').eq('id', 1).single();
  if (error) {
    console.error(error);
    return;
  }
  fs.writeFileSync('db_dump.json', JSON.stringify(data.json_data, null, 2));
  console.log('Dumped to db_dump.json');
}

fetchData();
