const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

async function runColdStart() {
    console.log("🚀 Waking the Hive Mind (Pure Math Engine)...");

    try {
        console.log("📊 Fetching historical data for Cold Start...");
        
        // SAFEGUARD: Ordering by 'id' to avoid URL-encoding bugs with spaces in "Draw Date"
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('id', { ascending: true }) 
            .limit(90);

        if (fetchError) throw fetchError;

        if (!history || history.length === 0) {
            console.log("⚠️ No data found. Check Supabase RLS policies.");
            return;
        }

        console.log(`✅ Successfully loaded ${history.length} recent draws.`);
        
        const latestDraw = history[0];
        console.log(`Latest Draw Date: ${latestDraw["Draw Date"]} (${latestDraw["Draw Type"]})`);

        const initialState = {
            system_status: "🟢 ONLINE: Cold Start Baseline Established",
            cli_score: 50.0,
            latest_analyzed_draw: {
                date: latestDraw["Draw Date"],
                type: latestDraw["Draw Type"],
                numbers: [
                    latestDraw["Winning Number 1"],
                    latestDraw["Winning Number 2"],
                    latestDraw["Winning Number 3"],
                    latestDraw["Winning Number 4"],
                    latestDraw["Winning Number 5"]
                ]
            },
            agent_nodes: {
                quant: { status: "Math Initialized", confidence: 50, deep_dive_progress: "0%" },
                geometer: { status: "Math Initialized", confidence: 50, deep_dive_progress: "0%" },
                hacker: { status: "Math Initialized", confidence: 50, deep_dive_progress: "0%" },
                surfer: { status: "Math Initialized", confidence: 50, deep_dive_progress: "0%" },
                contrarian: { status: "Math Initialized", confidence: 50, deep_dive_progress: "0%" }
            },
            sniper_entries: [], 
            message: "Hive Mind has successfully connected. Pure Math Engine active."
        };

        console.log("💾 Writing Initial State to Supabase...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .upsert({ 
                id: 1, 
                state_payload: initialState,
                last_updated: new Date().toISOString()
            }, { onConflict: 'id' });

        // SAFEGUARD: Identify RLS blockades automatically
        if (stateError) {
             console.error("🚨 Database Write Error. (If RLS violation, run 'ALTER TABLE daily_mesh_state DISABLE ROW LEVEL SECURITY;' in Supabase SQL).");
             throw stateError;
        }

        console.log("🎉 Cold Start Complete! Hive is ready.");

    } catch (error) {
        console.error("🚨 Critical Hive Error:", error);
        process.exit(1);
    }
}

runColdStart();
