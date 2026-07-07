// ================== START OF FILE ==================
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');

const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }, realtime: { transport: WebSocket }
});

// ==========================================
// 1. DATA INGESTION & MASKING
// ==========================================
async function fetchStratifiedEras() {
    console.log("📡 Fetching Stratified KDD Blocks...");
    const { data: recent, error: err1 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).limit(100);
    const midOffset = Math.floor(Math.random() * 4000) + 1000;
    const { data: mid, error: err2 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).range(midOffset, midOffset + 89);
    const deepOffset = Math.floor(Math.random() * 3000) + 6000;
    const { data: deep, error: err3 } = await supabase.from('f5_draws').select('*').order('id', { ascending: false }).range(deepOffset, deepOffset + 89);

    if (err1 || err2 || err3) throw new Error("Database fetch failed.");
    return { recent, mid, deep };
}

function extractNumbers(row) {
    if (!row) return [1,2,3,4,5];
    return [ row["Winning Number 1"], row["Winning Number 2"], row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"] ]
        .map(n => parseInt(n)).sort((a,b) => a-b);
}

function isolateRegime(block, drawType) {
    let target = drawType.toLowerCase().trim();
    let isolated = block.filter(row => {
        let dbTime = (row["Draw Time"] || row["Draw"] || "").toLowerCase().trim();
        return dbTime.includes(target);
    }).map(extractNumbers);
    return isolated.length > 0 ? isolated : block.map(extractNumbers);
}

// ==========================================
// 2. RETRO-LEDGER & ROI SCORING
// ==========================================
async function performColdStartAndReflection(latestDrawRow) {
    const { data: lastState, error } = await supabase.from('daily_mesh_state').select('state_payload').order('id', { ascending: false }).limit(1);

    const actualNumbers = extractNumbers(latestDrawRow);
    let defaultROI = { simulated_spend: 0, free_tickets_banked: 0, cash_prizes: 0, behavioral_mode: "AMBITIOUS_RECOVERY" };

    if (error || !lastState || lastState.length === 0) {
        return { status: "COLD_START_NO_HISTORY", actual: actualNumbers, roi_ledger: defaultROI };
    }

    const payload = lastState[0].state_payload;
    const prevPortfolio = payload?.playslip_portfolio || {};
    const prevROI = payload?.retro_ledger?.roi_ledger || defaultROI;
    
    let panelScores = {};
    let bestMatchCount = 0;
    let portfolioRecallSet = new Set();
    let ticketsWonToday = 0;

    Object.entries(prevPortfolio).forEach(([panelId, data]) => {
        let matchCount = 0;
        if(data.numbers && Array.isArray(data.numbers)) {
            data.numbers.forEach(n => {
                if (actualNumbers.includes(n)) { matchCount++; portfolioRecallSet.add(n); }
            });
        }
        panelScores[panelId] = `${matchCount}-of-5`;
        if (matchCount > bestMatchCount) bestMatchCount = matchCount;
        if (matchCount === 2) ticketsWonToday++; 
    });

    const assemblyGap = portfolioRecallSet.size - bestMatchCount;
    const updatedROI = {
        simulated_spend: prevROI.simulated_spend + 10,
        free_tickets_banked: prevROI.free_tickets_banked + ticketsWonToday,
        cash_prizes: prevROI.cash_prizes + (bestMatchCount >= 3 ? 10 : 0),
        behavioral_mode: (prevROI.free_tickets_banked + ticketsWonToday) > 1 ? "PLAY_SAFE" : "AMBITIOUS_RECOVERY"
    };

    return {
        status: "PORTFOLIO_SCORED",
        target_evaluated: latestDrawRow["Draw Time"] || latestDrawRow["Draw"] || "UNKNOWN",
        actual_draw: actualNumbers,
        portfolio_recall: Array.from(portfolioRecallSet),
        best_panel_match: `${bestMatchCount}-of-5`,
        assembly_gap: assemblyGap,
        panel_breakdown: panelScores,
        roi_ledger: updatedROI
    };
}

// ==========================================
// 3. MINERS & NUMBER IDENTITY MATRIX
// ==========================================
const MinerEcosystem = {
    validateRulebook: function(arr) {
        let unique = [...new Set(arr.map(n => parseInt(n) > 36 ? 36 : (parseInt(n) < 1 ? 1 : parseInt(n))))];
        let fill = 1;
        while(unique.length < 5) { if(!unique.includes(fill)) unique.push(fill); fill++; }
        return unique.slice(0, 5).sort((a,b) => a-b);
    },

    agents: {
        Quant: { logic: (r) => { let f={}; r.flat().forEach(n => f[n]=(f[n]||0)+1); return MinerEcosystem.validateRulebook(Object.keys(f).sort((a,b)=>f[b]-f[a]).slice(0,5)); }, tag: "HISTORICAL_FREQUENCY_PEAK", state: "VALIDATED", rotation: 2 },
        Geometer: { logic: (r) => { let g=0,c=0; r.forEach(row=>{for(let i=0;i<4;i++){g+=(row[i+1]-row[i]);c++;}}); let avg=Math.max(1,Math.round(g/Math.max(1,c))); let s=r[0]?.[0]||2; return MinerEcosystem.validateRulebook([s,s+avg,s+(avg*2),s+(avg*3),s+(avg*4)]); }, tag: "SPATIAL_CLUSTER_DETECTED", state: "PROBATIONARY_SANDBOX", rotation: 1 },
        Hacker: { logic: (r) => MinerEcosystem.validateRulebook((r[0]||[1,2,3,4,5]).map(n=>n+1)), tag: "SEQUENTIAL_ANOMALY_EXPLOIT", state: "QUARANTINED", rotation: 2 },
        Contrarian: { logic: (r) => { let f={}; for(let i=1;i<=36;i++) f[i]=0; r.flat().forEach(n=>f[n]++); return MinerEcosystem.validateRulebook(Object.keys(f).sort((a,b)=>f[a]-f[b]).slice(0,5)); }, tag: "MEAN_REVERSION_DEBT", state: "VALIDATED", rotation: 3 },
        SameDayBridge: { logic: (r) => { let l=r[0]||[1,2,3,4,5]; return MinerEcosystem.validateRulebook([l[0],l[1],l[2]+1,l[3]+1,l[4]+1]); }, tag: "SAME_DAY_CARRYOVER", state: "WATCHLIST", rotation: 1 }
    }
};

const CouncilWeights = { "VALIDATED": 1.0, "PROMOTED": 1.0, "WATCHLIST": 0.5, "QUARANTINED": 0.1, "PROBATIONARY_SANDBOX": 0.1 };

// ==========================================
// 4. SIGNAL-TO-PANEL TRANSLATOR
// ==========================================
function executeCombinatorialTranslation(entityLedger, behavioralMode) {
    // Sort all 36 numbers by their cumulative Entity Score (weighted by Council)
    let sortedNumbers = Object.values(entityLedger)
        .filter(e => e.entity_score > 0)
        .sort((a,b) => b.entity_score - a.entity_score)
        .map(e => e.number);

    let core = sortedNumbers.slice(0, 4); 
    if (core.length < 4) core = [2, 9, 15, 22];

    let portfolio = {};
    const netShift = behavioralMode === "AMBITIOUS_RECOVERY" ? 2 : 1;
    
    portfolio["Panel_A"] = { intent: "Vanguard Core (Highest Weight)", numbers: MinerEcosystem.validateRulebook([...core, sortedNumbers[4] || 30]) };
    portfolio["Panel_B"] = { intent: "Vanguard Variant", numbers: MinerEcosystem.validateRulebook([...core, sortedNumbers[5] || 31]) };
    portfolio["Panel_C"] = { intent: "Combinatorial Net 1", numbers: MinerEcosystem.validateRulebook(core.map(n => n + netShift)) };
    portfolio["Panel_D"] = { intent: "Combinatorial Net 2", numbers: MinerEcosystem.validateRulebook(core.map(n => n + (netShift*2))) };
    portfolio["Panel_E"] = { intent: "Combinatorial Net 3", numbers: MinerEcosystem.validateRulebook(core.map(n => n - netShift)) };
    portfolio["Panel_F"] = { intent: "Combinatorial Net 4", numbers: MinerEcosystem.validateRulebook(sortedNumbers.slice(2, 7)) };
    portfolio["Panel_G"] = { intent: "Combinatorial Net 5", numbers: MinerEcosystem.validateRulebook(sortedNumbers.slice(4, 9)) };
    portfolio["Panel_H"] = { intent: "Same-Day Bridge Matrix", numbers: MinerEcosystem.validateRulebook(sortedNumbers.slice(1, 6)) };
    portfolio["Panel_I"] = { intent: "Probationary Sandbox", numbers: MinerEcosystem.validateRulebook(core.map(n => n + 7)) };
    portfolio["Panel_J"] = { intent: "Shadow Mutation", numbers: MinerEcosystem.validateRulebook(core.map(n => n * 2)) };

    return portfolio;
}

// ==========================================
// 5. MASTER ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking Phase 4 Hive Engine...");
    try {
        const eras = await fetchStratifiedEras();
        if (eras.recent.length === 0) throw new Error("Recent block empty.");

        const latestDrawRow = eras.recent[0];
        const nextTargetRegime = (latestDrawRow["Draw Time"] || latestDrawRow["Draw"] || "").toLowerCase().includes("midday") ? "Evening" : "Midday";
        
        // BUG FIX 1: Exact Date and Time Mapping
        const extractedDate = latestDrawRow["Draw Date"] || latestDrawRow["Date"] || "UNKNOWN";
        const sourceCutoff = `ROW_ID_${latestDrawRow.id}_${extractedDate}`;

        const retroLedger = await performColdStartAndReflection(latestDrawRow);

        // BUG FIX 2 & 3: Entity Ledger & Council Weights
        let entityLedger = {};
        for(let i=1; i<=36; i++) { entityLedger[i] = { number: i, entity_score: 0, tag_history: [], selected_by: [] }; }

        let minerPool = {};
        let isolatedRegime = isolateRegime(eras.recent, nextTargetRegime);

        for (const [name, config] of Object.entries(MinerEcosystem.agents)) {
            let signals = config.logic(isolatedRegime);
            let weight = CouncilWeights[config.state] || 0.1;
            
            minerPool[name] = {
                signals: signals,
                tag_state: config.state,
                council_weight: weight,
                active_hypothesis: config.tag,
                historical_saturation: `Rotation ${config.rotation}`
            };

            signals.forEach(num => {
                if(entityLedger[num]) {
                    entityLedger[num].entity_score += weight;
                    entityLedger[num].selected_by.push(name);
                    if(!entityLedger[num].tag_history.includes(config.tag)) {
                        entityLedger[num].tag_history.push(config.tag);
                    }
                }
            });
        }

        // BUG FIX 4: Signal-to-Panel uses the actual weighted Entity Ledger
        const portfolio = executeCombinatorialTranslation(entityLedger, retroLedger.roi_ledger.behavioral_mode);

        const engineState = {
            schema_version: "PHASE_4_SENTIENT_COMBINATORIAL",
            experiment_chronology: {
                cycle_id: `CYC-${Date.now()}`,
                run_timestamp: new Date().toISOString(),
                source_cutoff: sourceCutoff,
                target_draw_type: nextTargetRegime,
                output_classification: "LIVE_FORWARD_TEST"
            },
            rulebook_compliance: { exactly_five_numbers: true, ten_panel_limit_enforced: true, target_objective: "5-of-5_SINGLE_ROW" },
            retro_ledger: retroLedger,
            entity_ledger: entityLedger,
            miner_workspaces: minerPool,
            playslip_portfolio: portfolio,
            daily_standup: {
                status: "DEBATE_CONCLUDED",
                action_item: "Entity scores calculated via Weighted Matrix. Combinatorial net deployed."
            }
        };

        engineState.developer_export = JSON.stringify(engineState);

        console.log(`💾 Appending Phase 4 Cycle [Target: ${nextTargetRegime}]...`);
        const { error: stateError } = await supabase.from('daily_mesh_state').insert({ cycle_id: engineState.experiment_chronology.cycle_id, state_payload: engineState });
        if (stateError) throw stateError;
        
        console.log("🎉 PHASE 4 LOCKED! Backend Execution Complete.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR: ", error.message);
        process.exit(1);
    }
}

runEngine();
// ================== END OF FILE ==================
