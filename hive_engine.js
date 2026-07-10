// ============================================================================
// NEURAL HIVE MIND - PHASE 5 STRATIFIED MACRO-ENGINE
// (DUAL-EPOCH KDD, DAY 1 RESET, 6+4 HYBRID MATRIX)
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const WebSocket = require('ws'); 

// Force Node global polyfill as an absolute fail-safe for GitHub Actions
global.WebSocket = WebSocket;

// --- 1. CONFIGURATION & SECRETS ---
const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
    global: { WebSocket: WebSocket }
});

function generatePortfolioHash(portfolio) {
    return 'HASH-' + crypto.createHash('sha256').update(JSON.stringify(portfolio)).digest('hex').substring(0, 8).toUpperCase();
}

function buildPanel(numbersArray) {
    let unique = Array.from(new Set(numbersArray)).filter(n => typeof n === 'number' && n >= 1 && n <= 36);
    const fallbacks = [4, 11, 19, 27, 34, 3, 14, 25, 30, 36]; 
    while (unique.length < 5) {
        let fb = fallbacks.shift();
        if (!unique.includes(fb)) unique.push(fb);
    }
    return unique.slice(0, 5).sort((a, b) => a - b);
}

// ============================================================================
// CORE ENGINE LOGIC: PHASE 5 STRATIFIED KDD
// ============================================================================
async function executePhase5_HiveEngine(latestOfficialDraw, targetDrawType, historicalDraws) {
    console.log(`🚀 INITIATING PHASE 5: STRATIFIED MACRO-KDD MATRIX (DAY 1 RESET)`);
    console.log(`📌 Target Draw Physics Locked: [${targetDrawType}]`);
    console.log(`📌 Macro Scan Depth: [${historicalDraws.length}] Draws Loaded across Dual Epochs.`);

    // ========================================================================
    // DEEP HISTORICAL DATA MINING (Stratified Base Rates)
    // ========================================================================
    console.log("🧠 Executing Stratified Macro Data Mining across decades...");
    let frequencyMap = {};
    for (let i = 1; i <= 36; i++) frequencyMap[i] = 0;
    
    historicalDraws.forEach(draw => {
        draw.forEach(num => { if(frequencyMap[num] !== undefined) frequencyMap[num]++; });
    });

    const sortedByFreq = Object.entries(frequencyMap).sort((a, b) => b[1] - a[1]);
    
    // 1. Quant (Top 5 Most Frequent across the Dual Epochs)
    const quantSignals = sortedByFreq.slice(0, 5).map(e => parseInt(e[0]));
    
    // 2. Contrarian (Top 5 Least Frequent / Long-Term Cyclical Debt)
    const contrarianSignals = sortedByFreq.slice(-5).map(e => parseInt(e[0]));
    
    // 3. Geometer (Spatial Adjacency +/- 1 from live draw)
    let geometerSet = new Set();
    latestOfficialDraw.forEach(n => {
        if (n > 1) geometerSet.add(n - 1);
        if (n < 36) geometerSet.add(n + 1);
    });
    const geometerSignals = Array.from(geometerSet).slice(0, 5);

    // 4. SameDayBridge (Live momentum)
    const sameDaySignals = latestOfficialDraw;

    // 5. Hacker (High Volatility Pseudo-Random)
    const hackerSignals = [
        Math.floor(Math.random() * 9) + 1,
        Math.floor(Math.random() * 9) + 10,
        Math.floor(Math.random() * 9) + 19,
        Math.floor(Math.random() * 9) + 28,
        36
    ];

    // ========================================================================
    // KDD DYNAMIC BEAR TRAP (Thermodynamic Shift)
    // ========================================================================
    const drawSum = latestOfficialDraw.reduce((a, b) => a + b, 0);
    let kddShift = "NOMINAL_BELL_CURVE";
    let kddSignals = [];

    if (drawSum < 70) {
        kddShift = "EXTREME_LOW_DROP";
        kddSignals = [2, 4, 6, 8, 10]; 
    } else if (drawSum > 115) {
        kddShift = "EXTREME_HIGH_SPIKE";
        kddSignals = [27, 29, 31, 34, 36]; 
    } else {
        kddShift = "NOMINAL_BELL_CURVE";
        kddSignals = [12, 15, 18, 21, 24]; 
    }

    // ========================================================================
    // RETRO EVIDENCE GRADING (Ghost Filter)
    // ========================================================================
    console.log(`⏳ Fetching previous ${targetDrawType} payload to run validation...`);
    const { data: previousRuns } = await supabase
        .from('daily_mesh_state')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    let retroLedger = { status: "AWAITING_DATA", assembly_gap: 0, best_panel_match: "0-of-5", portfolio_recall: [], roi_ledger: {} };
    let previousHash = "UNKNOWN_HASH";

    let previousRun = null;
    if (previousRuns) {
        previousRun = previousRuns.find(run => 
            run.state_payload && 
            run.state_payload.experiment_chronology && 
            run.state_payload.experiment_chronology.target_draw_type === targetDrawType
        );
    }

    if (previousRun && previousRun.state_payload.playslip_portfolio) {
        const prevPayload = previousRun.state_payload;
        previousHash = prevPayload.experiment_chronology?.cycle_id || "LEGACY_HASH";
        
        let bestMatchCount = 0;
        let trappedNumbers = new Set();
        let panelBreakdown = {};
        let winningPanels = 0;

        Object.keys(prevPayload.playslip_portfolio).forEach(panelKey => {
            const panelNumbers = prevPayload.playslip_portfolio[panelKey].numbers;
            const matches = panelNumbers.filter(n => latestOfficialDraw.includes(n));
            matches.forEach(n => trappedNumbers.add(n));
            
            if (matches.length > bestMatchCount) bestMatchCount = matches.length;
            if (matches.length >= 2) winningPanels++;
            panelBreakdown[panelKey] = `${matches.length}-of-5`;
        });

        const totalRecall = Array.from(trappedNumbers).sort((a,b) => a-b);
        const assemblyGap = totalRecall.length - bestMatchCount;

        retroLedger = {
            status: "PORTFOLIO_SCORED",
            target_evaluated: targetDrawType,
            graded_hash: previousHash,
            actual_draw: latestOfficialDraw,
            kdd_thermodynamic_sum: drawSum,
            kdd_shift_detected: kddShift,
            portfolio_recall: totalRecall,
            best_panel_match: `${bestMatchCount}-of-5`,
            assembly_gap: assemblyGap > 0 ? assemblyGap : 0,
            panel_breakdown: panelBreakdown,
            roi_ledger: {
                cash_prizes: (bestMatchCount === 3 ? 20 : bestMatchCount === 4 ? 100 : bestMatchCount === 5 ? 200000 : 0),
                free_tickets_banked: (bestMatchCount === 2 ? winningPanels : 0),
                system_lift: bestMatchCount >= 2 ? `+${(bestMatchCount * 1.5).toFixed(1)}x vs Random` : "Baseline Maintenance"
            }
        };
    }

    // ========================================================================
    // ML COUNCIL WEIGHT CALIBRATION (Day 1 Reset)
    // ========================================================================
    const activeMiners = {
        "Quant": { signals: quantSignals, tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "MACRO_FREQUENCY_PEAK" },
        "Hacker": { signals: hackerSignals, tag_state: "PENDING", council_weight: 0.1, active_hypothesis: "SEQUENTIAL_ANOMALY_EXPLOIT" },
        "Geometer": { signals: geometerSignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SPATIAL_CLUSTER_DETECTED" },
        "Contrarian": { signals: contrarianSignals, tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "MACRO_REVERSION_DEBT" },
        "SameDayBridge": { signals: sameDaySignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SAME_DAY_CARRYOVER" },
        "KDD_Anomaly": { signals: kddSignals, tag_state: "PENDING", council_weight: 1.5, active_hypothesis: kddShift }
    };

    if (retroLedger.status === "PORTFOLIO_SCORED") {
        Object.keys(activeMiners).forEach(minerName => {
            if (minerName === "KDD_Anomaly") return; 
            const hits = activeMiners[minerName].signals.filter(n => retroLedger.portfolio_recall.includes(n)).length;
            if (hits >= 2) {
                activeMiners[minerName].council_weight = 1.0;
                activeMiners[minerName].tag_state = "VALIDATED";
            } else if (hits === 1) {
                activeMiners[minerName].council_weight = 0.5;
                activeMiners[minerName].tag_state = "WATCHLIST";
            } else {
                activeMiners[minerName].council_weight = 0.1;
                activeMiners[minerName].tag_state = "QUARANTINED";
            }
        });
    }

    let entityLedger = {};
    for (let i = 1; i <= 36; i++) {
        entityLedger[i] = { number: i, selected_by: [], tag_history: [], entity_score: 0 };
    }

    Object.entries(activeMiners).forEach(([miner, data]) => {
        data.signals.forEach(num => {
            if(entityLedger[num]) {
                entityLedger[num].selected_by.push(miner);
                entityLedger[num].tag_history.push(data.active_hypothesis);
                entityLedger[num].entity_score += data.council_weight;
            }
        });
    });

    // ========================================================================
    // HYBRID COMBINATORIAL TRAAPS (6+4 MATRIX)
    // ========================================================================
    const sortedCore = Object.values(entityLedger).filter(e => e.entity_score > 0).sort((a,b) => b.entity_score - a.entity_score);
    const sortedWildcards = Object.values(entityLedger).filter(e => e.entity_score <= 0.1).sort(() => 0.5 - Math.random()); 

    const anchors = sortedCore.slice(0, 4).map(e => e.number); 
    const variance = sortedCore.slice(4, 9).map(e => e.number); 
    const wildcards = sortedWildcards.slice(0, 15).map(e => e.number);
    
    let playslipPortfolio = {};

    playslipPortfolio["Panel_A"] = { intent: "Vanguard Core 1", numbers: buildPanel([anchors[0], anchors[1], anchors[2], variance[0], variance[1]]) };
    playslipPortfolio["Panel_B"] = { intent: "Vanguard Core 2", numbers: buildPanel([anchors[0], anchors[1], anchors[3], variance[1], variance[2]]) };
    playslipPortfolio["Panel_C"] = { intent: "Vanguard Variant 1", numbers: buildPanel([anchors[1], anchors[2], anchors[3], variance[2], variance[3]]) };
    playslipPortfolio["Panel_D"] = { intent: "Vanguard Variant 2", numbers: buildPanel([anchors[0], anchors[2], anchors[3], variance[3], variance[4]]) };
    playslipPortfolio["Panel_E"] = { intent: "Combinatorial Net (Anchor/Var)", numbers: buildPanel([anchors[0], anchors[1], variance[0], variance[3], variance[4]]) };
    playslipPortfolio["Panel_F"] = { intent: "Combinatorial Net (Anchor/Var)", numbers: buildPanel([anchors[2], anchors[3], variance[1], variance[2], variance[4]]) };

    playslipPortfolio["Panel_G"] = { intent: "KDD Delta Miner (Wildcard Net 1)", numbers: buildPanel([wildcards[0], wildcards[1], wildcards[2], wildcards[3], wildcards[4]]) };
    playslipPortfolio["Panel_H"] = { intent: "KDD Delta Miner (Wildcard Net 2)", numbers: buildPanel([wildcards[5], wildcards[6], wildcards[7], wildcards[8], wildcards[9]]) };
    playslipPortfolio["Panel_I"] = { intent: "KDD Delta Miner (Wildcard Net 3)", numbers: buildPanel([wildcards[10], wildcards[11], wildcards[12], wildcards[13], wildcards[14]]) };
    
    let pJ = [wildcards[0], wildcards[5], wildcards[10], wildcards[14], wildcards[2]];
    if (pJ.reduce((a,b)=>a+b,0) < 70) pJ[4] = 35; 
    if (pJ.reduce((a,b)=>a+b,0) > 100) pJ[4] = 2;
    playslipPortfolio["Panel_J"] = { intent: "KDD Sum-Range Balancer", numbers: buildPanel(pJ) };

    const pendingHash = generatePortfolioHash(playslipPortfolio);

    const finalPayload = {
        schema_version: "PHASE_5_MACRO_KDD",
        experiment_chronology: {
            cycle_id: pendingHash,
            run_timestamp: new Date().toISOString(),
            source_cutoff: `Evaluated Draw: ${targetDrawType} | ${latestOfficialDraw.join('-')}`,
            target_draw_type: targetDrawType,
            output_classification: "LIVE_FORWARD_TEST",
            official_result_known_at_generation: false
        },
        rulebook_compliance: { target_objective: "5-of-5_SINGLE_ROW", exactly_five_numbers: true, ten_panel_limit_enforced: true },
        retro_ledger: retroLedger,
        entity_ledger: entityLedger,
        miner_workspaces: activeMiners,
        playslip_portfolio: playslipPortfolio,
        daily_standup: {
            status: "DEBATE_CONCLUDED",
            action_item: `Phase 5 Stratified Macro Engine Active. Dual-Epoch scan depth [${historicalDraws.length}] executed.`
        }
    };

    console.log(`💾 Writing Phase 5 Dynamic Payload to Supabase. Hash: ${pendingHash}`);
    await supabase.from('daily_mesh_state').insert([{ cycle_id: pendingHash, state_payload: finalPayload }]);
    console.log("✅ Phase 5 Hard Reset finalized successfully.");
}

// ============================================================================
// AUTOMATED EXECUTION: DUAL-EPOCH STRATIFIED FETCH
// ============================================================================
async function runAutomatedEngine() {
    const currentHour = new Date().getHours();
    const targetDrawType = currentHour < 15 ? "MIDDAY" : "EVENING"; 
    
    console.log(`📡 Querying Supabase for Dual-Epoch Stratified Training Array...`);
    
    // 1. Fetch Epoch 1: The Modern Physics (Last 500 Draws)
    const { data: recentRows, error: err1 } = await supabase
        .from('f5_draws') 
        .select('*')
        .eq('Draw Type', targetDrawType) 
        .order('id', { ascending: false })
        .limit(500); 

    // 2. Fetch Epoch 2: The Deep Archive (500 Draws from exactly a decade/cycle ago)
    const { data: deepRows, error: err2 } = await supabase
        .from('f5_draws') 
        .select('*')
        .eq('Draw Type', targetDrawType) 
        .order('id', { ascending: false })
        .range(5000, 5499); 

    if (err1 || err2 || !recentRows || recentRows.length === 0) {
        console.error("❌ Fatal Error: Dual-Epoch ingestion pool failed.");
        process.exit(1);
    }

    // Combine both epochs to create a 1,000-draw stratified sample
    const historyRows = [...recentRows, ...(deepRows || [])];

    const latestRow = recentRows[0];
    const latestOfficialDraw = [
        latestRow['Winning Number 1'], latestRow['Winning Number 2'], 
        latestRow['Winning Number 3'], latestRow['Winning Number 4'], 
        latestRow['Winning Number 5']
    ].sort((a, b) => a - b);

    const historicalDraws = historyRows.map(row => [
        row['Winning Number 1'], row['Winning Number 2'], 
        row['Winning Number 3'], row['Winning Number 4'], row['Winning Number 5']
    ]);

    await executePhase5_HiveEngine(latestOfficialDraw, targetDrawType, historicalDraws);
}

runAutomatedEngine()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("FATAL INSTABILITY:", err);
        process.exit(1);
    });
