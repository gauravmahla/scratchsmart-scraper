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
    console.log("📡 Fetching Stratified KDD Blocks...");
    const { data: recent, error: err1 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).limit(90);
    
    const midOffset = Math.floor(Math.random() * 5000) + 1000;
    const { data: mid, error: err2 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).range(midOffset, midOffset + 89);
        
    const deepOffset = Math.floor(Math.random() * 3000) + 7000;
    const { data: deep, error: err3 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).range(deepOffset, deepOffset + 89);

    if (err1 || err2 || err3) throw new Error("Database fetch failed.");
    return { recent, mid, deep };
}

function extractNumbers(row) {
    if (!row) return [1,2,3,4,5];
    return [
        row["Winning Number 1"], row["Winning Number 2"], 
        row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
    ].map(n => parseInt(n)).sort((a,b) => a-b);
}

// SAFE EXTRACTION: Normalizes strings to prevent the empty array collapse
function isolateRegime(block, drawType) {
    let target = drawType.toLowerCase().trim();
    let isolated = block.filter(row => {
        let dbTime = (row["Draw Time"] || row["Draw"] || "").toLowerCase().trim();
        return dbTime.includes(target);
    }).map(extractNumbers);
    
    // Safety Fallback: If filter fails, return entire block stripped to prevent 1-2-3-4-5 collapse
    return isolated.length > 0 ? isolated : block.map(extractNumbers);
}

// ==========================================
// 2. DUAL-STATE MEMORY (POST-DRAW REFLECTION)
// ==========================================
async function performPostDrawReflection(latestOfficialRow) {
    const { data: lastState, error } = await supabase
        .from('daily_mesh_state').select('state_payload').order('id', { ascending: false }).limit(1);

    if (error || !lastState || lastState.length === 0) {
        return { status: "SKIPPED", reason: "No prior memory." };
    }

    // Safely extract the previous best prediction (Panel A or Legacy Council)
    let previousPrediction = [];
    if (lastState[0].state_payload?.playslip_portfolio?.Panel_A?.numbers) {
        previousPrediction = lastState[0].state_payload.playslip_portfolio.Panel_A.numbers;
    } else if (lastState[0].state_payload?.six_hat_council?.council_consensus_entry) {
         previousPrediction = lastState[0].state_payload.six_hat_council.council_consensus_entry;
    }
    
    if (previousPrediction.length !== 5) return { status: "SKIPPED", reason: "Previous prediction invalid." };

    const actualNumbers = extractNumbers(latestOfficialRow);
    let matched = [], missed = [];
    previousPrediction.forEach(num => actualNumbers.includes(num) ? matched.push(num) : missed.push(num));

    const matchTiers = {0: 0, 1: 0, 2: 10, 3: 40, 4: 80, 5: 100};
    const finalScore = matchTiers[matched.length] || 0;

    return {
        status: "COMPLETED",
        target_draw: latestOfficialRow["Draw Time"] || "UNKNOWN",
        target_date: latestOfficialRow["Date"] || "UNKNOWN",
        predicted: previousPrediction,
        actual: actualNumbers,
        matched: matched,
        missed: missed,
        match_count: matched.length,
        match_category: `${matched.length}-of-5`,
        confidence_delta_applied: finalScore >= 40 ? "+15% (FLOW)" : (finalScore === 0 ? "-10% (PENALTY)" : "0% (Baseline)")
    };
}

// ==========================================
// 3. MINER ECOSYSTEM & LENSES
// ==========================================
const MinerEcosystem = {
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
    
    scoreBlindTest: function(prediction, actual) {
        let hits = 0;
        prediction.forEach(p => { if (actual.includes(p)) hits++; });
        const matchTiers = {0: 0, 1: 0, 2: 10, 3: 40, 4: 80, 5: 100};
        return { score: matchTiers[hits] || 0, matches: hits };
    },

    agents: {
        Quant: {
            trigger: "HISTORICAL_FREQUENCY_PEAK",
            logic: function(regime) {
                let f = {}; regime.flat().forEach(n => f[n] = (f[n]||0)+1);
                let sorted = Object.keys(f).sort((a,b) => f[b] - f[a]);
                return MinerEcosystem.enforceRulebook(sorted.slice(0, 5));
            }
        },
        Geometer: {
            trigger: "SPATIAL_CLUSTER_DETECTED",
            logic: function(regime) {
                let totalGaps = 0, count = 0;
                regime.forEach(row => { for(let i=0; i<4; i++) { totalGaps += (row[i+1] - row[i]); count++; }});
                let avg = Math.max(1, Math.round(totalGaps/Math.max(1,count)));
                let s = regime[0]?.[0] || 2;
                return MinerEcosystem.enforceRulebook([s, s+avg, s+(avg*2), s+(avg*3), s+(avg*4)]);
            }
        },
        Hacker: {
            trigger: "SEQUENTIAL_ANOMALY_EXPLOIT",
            logic: function(regime) {
                let last = regime[0] || [1,2,3,4,5];
                return MinerEcosystem.enforceRulebook(last.map(n => n + 1));
            }
        },
        Contrarian: {
            trigger: "MEAN_REVERSION_DEBT",
            logic: function(regime) {
                let f = {}; for(let i=1; i<=36; i++) f[i] = 0;
                regime.flat().forEach(n => f[n]++);
                let sorted = Object.keys(f).sort((a,b) => f[a] - f[b]);
                return MinerEcosystem.enforceRulebook(sorted.slice(0, 5));
            }
        },
        SameDayBridge: {
            trigger: "3_DAY_MOMENTUM_CARRYOVER",
            logic: function(regime) {
                let last = regime[0] || [1,2,3,4,5];
                return MinerEcosystem.enforceRulebook([last[0], last[1], last[2]+1, last[3]+1, last[4]+1]);
            }
        }
    }
};

// ==========================================
// 4. PORTFOLIO MANAGER
// ==========================================
function build10PanelPortfolio(minerKpis) {
    let portfolio = {};
    let heatMap = {};
    Object.values(minerKpis).forEach(agent => {
        agent.predicted.forEach(num => heatMap[num] = (heatMap[num] || 0) + 1);
    });
    let consensus = Object.keys(heatMap).sort((a,b) => heatMap[b] - heatMap[a]).slice(0, 5);
    
    portfolio[`Panel_A`] = { type: "Master Consensus", numbers: MinerEcosystem.enforceRulebook(consensus) };

    const agentKeys = Object.keys(minerKpis);
    agentKeys.forEach((agentName, idx) => {
        portfolio[`Panel_${String.fromCharCode(66 + idx)}`] = { 
            type: `${agentName} Vector`, 
            numbers: minerKpis[agentName].predicted 
        };
    });

    while(Object.keys(portfolio).length < 10) {
        let shift = Object.keys(portfolio).length;
        portfolio[`Panel_${String.fromCharCode(65 + Object.keys(portfolio).length)}`] = {
            type: "Risk-Adjusted Variant",
            numbers: MinerEcosystem.enforceRulebook(consensus.map(n => parseInt(n) + shift))
        };
    }
    return portfolio;
}

// ==========================================
// 5. MAIN ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Phase 3.1: Hotfix & KDD Telemetry)...");
    try {
        const eras = await fetchStratifiedEras();
        if (eras.recent.length === 0) throw new Error("Recent block empty.");

        const latestDraw = eras.recent[0];
        const nextTargetRegime = (latestDraw["Draw Time"] || "").toLowerCase().includes("midday") ? "Evening" : "Midday";
        
        const reflection = await performPostDrawReflection(latestDraw);

        let miner_kpis = {};
        let isolatedRegime = isolateRegime(eras.recent, nextTargetRegime);
        
        // KDD Holdout Target (The 91st row equivalent for cross-validation)
        const blindTarget = eras.mid.length > 0 ? extractNumbers(eras.mid[0]) : [1,2,3,4,5];

        for (const [name, agent] of Object.entries(MinerEcosystem.agents)) {
            let prediction = agent.logic(isolatedRegime);
            let testResult = MinerEcosystem.scoreBlindTest(prediction, blindTarget);
            
            miner_kpis[name] = {
                predicted: prediction,
                target_regime: nextTargetRegime,
                primary_trigger: agent.trigger,
                status: testResult.score >= 40 ? "FLOW" : (testResult.score === 0 ? "SLUMP" : "NOMINAL"),
                holdout_score: testResult.score,
                evidence_chain: {
                    historical_window_used: "KDD_STRATIFIED_CROSS_VALIDATION",
                    rulebook_compliant: true,
                    match_category: `${testResult.matches}-of-5`
                }
            };
        }

        const portfolio = build10PanelPortfolio(miner_kpis);

        const engineState = {
            schema_version: "PHASE_3_KDD_STRATIFIED",
            cycle_id: `CYC-${Date.now()}`,
            run_date: new Date().toISOString(),
            target_draw_type: nextTargetRegime,
            rule_compliance: { exactly_five_numbers: true, combination_only: true, ten_panel_limit_enforced: true },
            retro_ledger: reflection,
            miner_kpis: miner_kpis,
            playslip_portfolio: portfolio,
            daily_standup: {
                status: "KDD_COMPLETE",
                reflection_logged: reflection.status === "COMPLETED",
                top_learning: reflection.status === "COMPLETED" ? `Previous cycle matched ${reflection.match_count} numbers.` : "Initializing memory."
            }
        };

        engineState.developer_export = JSON.stringify(engineState);

        console.log("💾 Appending Phase 3.1 Hotfix Cycle...");
        const { error: stateError } = await supabase.from('daily_mesh_state').insert({ cycle_id: engineState.cycle_id, state_payload: engineState });
        if (stateError) throw stateError;
        
        console.log("🎉 PHASE 3.1 ENGINE LOCKED! Payload restored.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR: ", error.message);
        process.exit(1);
    }
}

runEngine();
// ================== END OF FILE ==================
