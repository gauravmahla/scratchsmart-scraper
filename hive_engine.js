// ================== START OF FILE ==================
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { transport: WebSocket }
});

// ==========================================
// 1. STRATIFIED KDD DATA INGESTION
// ==========================================
async function fetchStratifiedEras() {
    console.log("📡 Fetching Stratified KDD Blocks (Recent, Mid, Deep)...");
    
    // 1. Recent Block (Latest 90)
    const { data: recent, error: err1 } = await supabase
        .from('f5_draws').select('*').order('id', { ascending: false }).limit(90);
    
    // 2. Mid-History Block (Random 90 from mid-database)
    const midOffset = Math.floor(Math.random() * 5000) + 1000;
    const { data: mid, error: err2 } = await supabase
        .from('f5_draws').select('*').order('id', { ascending: false }).range(midOffset, midOffset + 89);
        
    // 3. Deep-History Block (Random 90 from older database)
    const deepOffset = Math.floor(Math.random() * 3000) + 7000;
    const { data: deep, error: err3 } = await supabase
        .from('f5_draws').select('*').order('id', { ascending: false }).range(deepOffset, deepOffset + 89);

    if (err1 || err2 || err3) throw new Error("Database fetch failed during stratification.");
    
    return { recent, mid, deep };
}

function extractNumbers(row) {
    return [
        row["Winning Number 1"], row["Winning Number 2"], 
        row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
    ].sort((a,b) => a-b);
}

function isolateRegime(block, drawType) {
    return block.filter(row => row["Draw Time"] === drawType).map(extractNumbers);
}

// ==========================================
// 2. DUAL-STATE MEMORY (POST-DRAW REFLECTION)
// ==========================================
async function performPostDrawReflection(latestOfficialRow) {
    console.log("🪞 Initiating Post-Draw Reflection State...");
    
    // Fetch the Hive's LAST prediction
    const { data: lastState, error } = await supabase
        .from('daily_mesh_state').select('state_payload').order('id', { ascending: false }).limit(1);

    if (error || !lastState || lastState.length === 0) {
        return { status: "SKIPPED", reason: "No prior staging memory found to reflect upon." };
    }

    const previousPrediction = lastState[0].state_payload?.six_hat_council?.council_consensus_entry || [];
    if (previousPrediction.length !== 5) return { status: "SKIPPED", reason: "Previous prediction invalid." };

    const actualNumbers = extractNumbers(latestOfficialRow);
    
    let matched = [];
    let missed = [];
    previousPrediction.forEach(num => {
        if (actualNumbers.includes(num)) matched.push(num);
        else missed.push(num);
    });

    // Rulebook scoring baseline
    const matchTiers = {0: 0, 1: 0, 2: 10, 3: 40, 4: 80, 5: 100};
    const finalScore = matchTiers[matched.length] || 0;

    return {
        status: "COMPLETED",
        target_draw: latestOfficialRow["Draw Time"],
        target_date: latestOfficialRow["Date"],
        predicted: previousPrediction,
        actual: actualNumbers,
        matched: matched,
        missed: missed,
        match_count: matched.length,
        match_category: `${matched.length}-of-5`,
        confidence_delta_applied: finalScore >= 40 ? "+15%" : (finalScore === 0 ? "-10%" : "0% (Baseline Maintained)")
    };
}

// ==========================================
// 3. MINER ECOSYSTEM & LENSES
// ==========================================
const MinerEcosystem = {
    // Generates a valid 1-36 array guaranteeing exactly 5 unique numbers
    enforceRulebook: function(arr) {
        let clean = arr.map(n => {
            let num = parseInt(n);
            if (isNaN(num) || num < 1) return 1;
            if (num > 36) return num % 36 || 36;
            return num;
        });
        let unique = [...new Set(clean)];
        let fill = 1;
        while(unique.length < 5) {
            if(!unique.includes(fill)) unique.push(fill);
            fill++;
        }
        return unique.slice(0, 5).sort((a,b) => a-b);
    },

    agents: {
        Quant: function(regimeArray) {
            let f = {};
            regimeArray.flat().forEach(n => f[n] = (f[n]||0)+1);
            let sorted = Object.keys(f).sort((a,b) => f[b] - f[a]);
            return MinerEcosystem.enforceRulebook(sorted.slice(0, 5));
        },
        Geometer: function(regimeArray) {
            let totalGaps = 0, count = 0;
            regimeArray.forEach(row => {
                for(let i=0; i<4; i++) { totalGaps += (row[i+1] - row[i]); count++; }
            });
            let avg = Math.max(1, Math.round(totalGaps/count));
            let s = regimeArray[0]?.[0] || 2;
            return MinerEcosystem.enforceRulebook([s, s+avg, s+(avg*2), s+(avg*3), s+(avg*4)]);
        },
        Hacker: function(regimeArray) {
            let last = regimeArray[0] || [1,2,3,4,5];
            return MinerEcosystem.enforceRulebook(last.map(n => n + 1));
        },
        Contrarian: function(regimeArray) {
            let f = {};
            for(let i=1; i<=36; i++) f[i] = 0;
            regimeArray.flat().forEach(n => f[n]++);
            let sorted = Object.keys(f).sort((a,b) => f[a] - f[b]);
            return MinerEcosystem.enforceRulebook(sorted.slice(0, 5));
        },
        // The New Phase 3 Agent
        SameDayBridge: function(fullRecentBlock) {
            // Looks for numbers that fell in the last Midday to carry into Evening
            let lastMidday = fullRecentBlock.find(r => r["Draw Time"] === "Midday");
            if (!lastMidday) return MinerEcosystem.enforceRulebook([7,14,21,28,35]);
            let nums = extractNumbers(lastMidday);
            // Bridge hypothesis: 2 numbers repeat, 3 shift by +1
            let bridged = [nums[0], nums[1], nums[2]+1, nums[3]+1, nums[4]+1];
            return MinerEcosystem.enforceRulebook(bridged);
        }
    }
};

// ==========================================
// 4. PORTFOLIO MANAGER (10-Panel Rulebook Compliance)
// ==========================================
function build10PanelPortfolio(minerKpis) {
    let portfolio = {};
    let panelCount = 1;

    // Panel 1: Master Consensus (Most overlapped numbers across all agents)
    let heatMap = {};
    Object.values(minerKpis).forEach(agent => {
        agent.predicted.forEach(num => heatMap[num] = (heatMap[num] || 0) + 1);
    });
    let consensus = Object.keys(heatMap).sort((a,b) => heatMap[b] - heatMap[a]).slice(0, 5);
    portfolio[`Panel_A`] = { type: "Master Consensus", numbers: MinerEcosystem.enforceRulebook(consensus) };

    // Panels B-F: Individual Agent specialized vectors
    const labels = ["Frequency Lift", "Spatial Cluster", "Entropy Anomaly", "Mean Reversion", "Midday-Evening Bridge"];
    Object.keys(MinerEcosystem.agents).forEach((agentName, idx) => {
        portfolio[`Panel_${String.fromCharCode(66 + idx)}`] = { 
            type: `${agentName} (${labels[idx]})`, 
            numbers: minerKpis[agentName].predicted 
        };
    });

    // Panels G-J: Diversification (Ensuring we fill the 10-panel playslip rule)
    while(Object.keys(portfolio).length < 10) {
        let shift = Object.keys(portfolio).length;
        let altVector = consensus.map(n => parseInt(n) + shift);
        portfolio[`Panel_${String.fromCharCode(65 + Object.keys(portfolio).length)}`] = {
            type: "Risk-Adjusted Variant",
            numbers: MinerEcosystem.enforceRulebook(altVector)
        };
    }

    return portfolio;
}

// ==========================================
// 5. MAIN ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Phase 3: KDD Stratified & Dual-State)...");
    try {
        const eras = await fetchStratifiedEras();
        if (eras.recent.length === 0) throw new Error("Recent block empty.");

        const latestDraw = eras.recent[0];
        const nextTargetRegime = latestDraw["Draw Time"] === "Midday" ? "Evening" : "Midday";
        console.log(`🎯 Target Forward Regime: ${nextTargetRegime}`);

        // 1. Execute Dual-State Post-Draw Reflection
        const reflection = await performPostDrawReflection(latestDraw);

        // 2. KDD Data Mining (Forward Intel)
        let miner_kpis = {};
        let isolatedRegime = isolateRegime(eras.recent, nextTargetRegime);

        for (const [name, logic] of Object.entries(MinerEcosystem.agents)) {
            let prediction;
            if (name === "SameDayBridge") {
                prediction = logic(eras.recent); // Bridge needs full context
            } else {
                prediction = logic(isolatedRegime); // Others use isolated regime
            }
            
            miner_kpis[name] = {
                predicted: prediction,
                target_regime: nextTargetRegime,
                evidence_chain: {
                    historical_window_used: "RECENT_90_ISOLATED",
                    methodology_applied: name,
                    rulebook_compliant: true
                }
            };
        }

        // 3. Build 10-Panel Rulebook Playslip
        const portfolio = build10PanelPortfolio(miner_kpis);

        // 4. Assemble Phase 3 Payload
        const engineState = {
            schema_version: "PHASE_3_KDD_STRATIFIED",
            cycle_id: `CYC-${Date.now()}`,
            run_date: new Date().toISOString(),
            target_draw_type: nextTargetRegime,
            
            rule_compliance: {
                exactly_five_numbers: true,
                combination_only: true,
                ten_panel_limit_enforced: true
            },
            
            retro_ledger: reflection,
            miner_kpis: miner_kpis,
            playslip_portfolio: portfolio,
            
            daily_standup: {
                status: "KDD_COMPLETE",
                reflection_logged: reflection.status === "COMPLETED",
                top_learning: reflection.status === "COMPLETED" ? `Previous cycle matched ${reflection.match_count} numbers.` : "Initializing staging memory."
            }
        };

        engineState.developer_export = JSON.stringify(engineState);

        console.log("💾 Appending Phase 3 KDD Cycle to Permanent Memory...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .insert({ cycle_id: engineState.cycle_id, state_payload: engineState });

        if (stateError) throw stateError;
        console.log("🎉 PHASE 3 ENGINE LOCKED! Dual-State payload dispatched.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR: ", error.message);
        process.exit(1);
    }
}

runEngine();
// ================== END OF FILE ==================
