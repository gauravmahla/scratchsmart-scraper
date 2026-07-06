const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws'); 

const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { transport: WebSocket }
});

// ==========================================
// 1. NATIVE MATH & UTILITY LIBRARY (Level 1)
// ==========================================
const MathLib = {
    // Custom Seeded Random to ensure reproducible blind homework blocks
    seededRandom: function(seed) {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    },
    // Standard Deviation for the Contrarian
    stdDev: function(arr) {
        let mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        let variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }
};

// ==========================================
// 2. DATA INTEGRITY GATE
// ==========================================
function runDataIntegrityGate(history) {
    console.log("🛡️ Running Data Integrity Gate...");
    
    if (!history || history.length < 91) {
        throw new Error("GATE FAILED: Insufficient historical data (Need 91+ rows for homework).");
    }

    history.forEach((row, index) => {
        const nums = [
            row["Winning Number 1"], row["Winning Number 2"], 
            row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
        ];

        // Validate exactly 5 numbers
        if (nums.some(n => n === null || n === undefined || isNaN(n))) {
            throw new Error(`GATE FAILED: Malformed numbers at row index ${index}`);
        }
        
        // Validate 1 through 36 bounds
        if (nums.some(n => n < 1 || n > 36)) {
            throw new Error(`GATE FAILED: Number out of bounds (1-36) at row index ${index}`);
        }

        // Validate duplicates
        if (new Set(nums).size !== 5) {
            throw new Error(`GATE FAILED: Duplicate numbers found in draw at row index ${index}`);
        }
    });

    console.log("✅ Data Integrity Gate Passed.");
    return true;
}

// ==========================================
// 3. FEATURE FACTORY
// ==========================================
function buildFeatureBoard(historyBlock) {
    console.log("🏭 Building Feature Factory Board...");
    
    let features = {
        frequencies: {},
        hot_numbers: [],
        cold_numbers: [],
        average_odd_even_ratio: 0,
        average_spatial_gap: 0
    };

    // Initialize frequencies
    for(let i=1; i<=36; i++) features.frequencies[i] = 0;

    let totalOdds = 0;
    let totalEvens = 0;
    let totalGaps = [];

    // Analyze the block
    historyBlock.forEach(row => {
        const nums = [
            row["Winning Number 1"], row["Winning Number 2"], 
            row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
        ];

        nums.forEach(n => {
            features.frequencies[n]++;
            (n % 2 === 0) ? totalEvens++ : totalOdds++;
        });

        // Spatial Gaps (e.g., between 5 and 10 is a gap of 5)
        for(let i=1; i<nums.length; i++) {
            totalGaps.push(nums[i] - nums[i-1]);
        }
    });

    // Determine Hot/Cold (Top 3 / Bottom 3)
    let freqArray = Object.keys(features.frequencies).map(key => ({
        num: parseInt(key), count: features.frequencies[key]
    }));
    
    freqArray.sort((a, b) => b.count - a.count);
    features.hot_numbers = freqArray.slice(0, 3).map(x => x.num);
    features.cold_numbers = freqArray.slice(-3).map(x => x.num);
    
    features.average_odd_even_ratio = (totalOdds / (totalOdds + totalEvens)).toFixed(2);
    features.average_spatial_gap = (totalGaps.reduce((a, b) => a + b, 0) / totalGaps.length).toFixed(2);

    return features;
}

// ==========================================
// MAIN ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Increment 1: Gate & Features)...");

    try {
        // Fetch 180 rows to ensure we have enough for 90+91 blind tests later
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('id', { ascending: true }) 
            .limit(180);

        if (fetchError) throw fetchError;

        // 1. Gate Check
        runDataIntegrityGate(history);

        // 2. Build Features on the most recent 90 days
        const recent90 = history.slice(0, 90);
        const sharedFeatureBoard = buildFeatureBoard(recent90);

        // 3. Draft the new JSON payload structure
        const engineState = {
            cycle_id: `CYC-${Date.now()}`,
            data_quality: "VALIDATED",
            feature_summary: sharedFeatureBoard,
            message: "Feature Factory and Data Gate operating perfectly. Standing by for Miner cognition."
        };

        console.log("💾 Writing Feature State to Supabase...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .upsert({ 
                id: 1, 
                state_payload: engineState,
                last_updated: new Date().toISOString()
            }, { onConflict: 'id' });

        if (stateError) throw stateError;

        console.log("🎉 Increment 1 Complete! Check Supabase for the Feature Board.");
        process.exit(0);

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

runEngine();
