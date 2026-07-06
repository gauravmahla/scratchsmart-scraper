require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Initialize Clients securely from GitHub Secrets
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runColdStart() {
    console.log("🚀 Waking the Hive Mind...");

    try {
        // 2. Fetch the 90-Day Baseline using the exact UI column names
        console.log("📊 Fetching historical data for Cold Start...");
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('Draw Date', { ascending: false })
            .limit(90); // 90-day cold start limit

        if (fetchError) throw fetchError;

        if (!history || history.length === 0) {
            console.log("⚠️ No data found. Is the table empty?");
            return;
        }

        console.log(`✅ Successfully loaded ${history.length} recent draws.`);
        
        // Example of accessing your flexible naming convention
        const latestDraw = history[0];
        console.log(`Latest Draw Date: ${latestDraw["Draw Date"]} (${latestDraw["Draw Type"]})`);

        // 3. Compile the Initial State JSON (The Baseline)
        const initialState = {
            system_status: "🟢 ONLINE: Cold Start Baseline Established",
            cli_score: 50.0, // Neutral starting Compound Learning Index
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
                quant: { status: "Initialized", confidence: 50, deep_dive_progress: "0%" },
                geometer: { status: "Initialized", confidence: 50, deep_dive_progress: "0%" },
                hacker: { status: "Initialized", confidence: 50, deep_dive_progress: "0%" },
                surfer: { status: "Initialized", confidence: 50, deep_dive_progress: "0%" },
                contrarian: { status: "Initialized", confidence: 50, deep_dive_progress: "0%" }
            },
            sniper_entries: [], // Empty until the first actual forward-test run
            message: "Hive Mind has successfully connected to the database and established 90-day baselines."
        };

        // 4. Inject the State into the empty daily_mesh_state table
        console.log("💾 Writing Initial State to Supabase...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .upsert({ 
                id: 1, 
                state_payload: initialState,
                last_updated: new Date().toISOString()
            }, { onConflict: 'id' });

        if (stateError) throw stateError;

        console.log("🎉 Cold Start Complete! Hive is ready.");

    } catch (error) {
        console.error("🚨 Critical Hive Error:", error);
        process.exit(1);
    }
}

runColdStart();
