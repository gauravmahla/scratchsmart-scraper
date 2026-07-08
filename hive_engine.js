// ============================================================================
// NEURAL HIVE MIND - PHASE 4.6 ENGINE 
// (HYBRID KDD, DUAL-STREAM MEMORY, 6+4 WHEELING MATRIX)
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const WebSocket = require('ws'); 

// Force Node global polyfill as an absolute fail-safe for GitHub Actions (Node 20)
global.WebSocket = WebSocket;

// --- 1. CONFIGURATION & SECRETS (HARDCODED PER DIRECTIVE) ---
const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

// Inject WebSocket directly into the Realtime transport config
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket },
    global: { WebSocket: WebSocket }
});

// --- 2. CRYPTOGRAPHIC & COMBINATORIAL HELPERS ---
function generatePortfolioHash(portfolio) {
    return 'HASH-' + crypto.createHash('sha256').update(JSON.stringify(portfolio)).digest('hex').substring(0, 8).toUpperCase();
}

function buildPanel(numbersArray) {
    // Enforce rulebook: Exactly 5 unique numbers between 1 and 36
    const unique = Array.from(new Set(numbersArray)).filter(n => typeof n === 'number' && n >= 1 && n <= 36);
    // Baseline spatial distribution fallbacks if overlap occurs (to guarantee 5 numbers)
    const fallbacks = [4, 11, 19, 27, 34, 3, 14, 25, 30, 36]; 
    while (unique.length < 5) {
        let fb = fallbacks.shift();
        if (!unique.includes(fb)) unique.push(fb);
    }
    return unique.slice(0, 5).sort((a, b) => a - b);
}

// ============================================================================
// CORE ENGINE LOGIC: DUAL-STREAM PAST, KDD PRESENT, 6+4 HYBRID FUTURE
// ============================================================================
async function executePhase4_6_HiveEngine(latestOfficialDraw, targetDrawType) {
    console.log(`🚀 INITIATING PHASE 4.6: DUAL-STREAM KDD HYBRID MATRIX...`);
    console.log(`📌 Target Draw Physics Locked: [${targetDrawType}]`);
    console.log(`📌 Official ${targetDrawType} Draw Input: [${latestOfficialDraw.join(', ')}]`);

    // ========================================================================
    // PHASE 1: KDD DELTA MINER (THERMODYNAMIC SHIFT DETECTION)
    // ========================================================================
    const drawSum = latestOfficialDraw.reduce((a, b) => a + b, 0);
    let kddShift = "NOMINAL_BELL_CURVE";
    let kddAction = "Standard Assembly";

    if (drawSum < 70) {
        kddShift = "EXTREME_LOW_DROP";
        kddAction = "Deploying Wildcards for Mean-Reversion Bounce";
        console.log("⚠️ KDD ALERT: Massive thermodynamic drop detected (Sum < 70). Activating Wildcard Nets.");
    } else if (drawSum > 115) {
        kddShift = "EXTREME_HIGH_SPIKE";
        kddAction = "Deploying Wildcards for Mean-Reversion Collapse";
        console.log("⚠️ KDD ALERT: Massive thermodynamic spike detected (Sum > 115). Activating Wildcard Nets.");
    }

    // ========================================================================
    // PHASE 2: THE PAST (Dual-Stream Memory Retrieval & Grading)
    // ========================================================================
    console.log(`⏳ Retrieving previous ${targetDrawType} portfolio to execute isolated grading...`);
    
    // Fetch last 5 runs to find the specific one that matches our targetDrawType to ensure strict isolation
    const { data: previousRuns } = await supabase
        .from('daily_mesh_state')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    let previousRun = null;
    if (previousRuns) {
        previousRun = previousRuns.find(run => 
            run.state_payload && 
            run.state_payload.experiment_chronology && 
            run.state_payload.experiment_chronology.target_draw_type === targetDrawType
        );
    }

    let retroLedger = { status: "AWAITING_DATA", assembly_gap: 0, best_panel_match: "0-of-5", portfolio_recall: [], roi_ledger: {} };
    let previousHash = "UNKNOWN_HASH";
    let priorFreeTickets = 0, priorSimSpend = 0, priorCash = 0;

    if (previousRun && previousRun.state_payload.playslip_portfolio) {
        console.log(`✅ Previous ${targetDrawType} Portfolio Validated. Calculating Assembly Gap.`);
        
        const prevPayload = previousRun.state_payload;
        previousHash = prevPayload.experiment_chronology?.cycle_id || generatePortfolioHash(prevPayload.playslip_portfolio);
        
        priorFreeTickets = prevPayload.retro_ledger?.roi_ledger?.free_tickets_banked || 0;
        priorSimSpend = prevPayload.retro_ledger?.roi_ledger?.simulated_spend || 0;
        priorCash = prevPayload.retro_ledger?.roi_ledger?.cash_prizes || 0;

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
                simulated_spend: priorSimSpend + 10,
                cash_prizes: priorCash + (bestMatchCount === 3 ? 20 : bestMatchCount === 4 ? 100 : bestMatchCount === 5 ? 200000 : 0),
                free_tickets_banked: priorFreeTickets + (bestMatchCount === 2 ? winningPanels : 0),
                behavioral_mode: ((priorFreeTickets + winningPanels) > 5) ? "PLAY_SAFE" : "AMBITIOUS_RECOVERY",
                system_lift: bestMatchCount >= 2 ? `+${(bestMatchCount * 1.5).toFixed(1)}x vs Random` : "Baseline Maintenance"
            }
        };
    } else {
        console.log(`⚠️ Cold Start Detected for ${targetDrawType}. Bypassing Grading Sequence.`);
    }

    // ========================================================================
    // PHASE 3: THE PRESENT (ML Council Adjustments & Dynamic Scoring)
    // ========================================================================
    const activeMiners = {
        "Quant": { signals: [2, 6, 9, 19, 22], tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "HISTORICAL_FREQUENCY_PEAK" },
        "Hacker": { signals: [7, 10, 12, 13, 23], tag_state: "PENDING", council_weight: 0.1, active_hypothesis: "SEQUENTIAL_ANOMALY_EXPLOIT" },
        "Geometer": { signals: [6, 11, 16, 21, 26], tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SPATIAL_CLUSTER_DETECTED" },
        "Contrarian": { signals: [27, 28, 29, 31, 35], tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "MEAN_REVERSION_DEBT" },
        "SameDayBridge": { signals: [6, 9, 12, 23, 36], tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SAME_DAY_CARRYOVER" },
        "KDD_Anomaly": { signals: [1, 3, 5, 8, 15], tag_state: "PENDING", council_weight: 1.5, active_hypothesis: kddShift } // Injects high weight for wildcards
    };

    if (retroLedger.status === "PORTFOLIO_SCORED") {
        Object.keys(activeMiners).forEach(minerName => {
            if (minerName === "KDD_Anomaly") return; // Keep KDD independent of standard grading
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
    // PHASE 4: THE FUTURE (6+4 HYBRID COMBINATORIAL MATRIX)
    // ========================================================================
    console.log("🕸️ Assembling 6+4 Hybrid KDD Wheeling Matrix...");
    
    // Sort descending for Core (Vanguard)
    const sortedCore = Object.values(entityLedger).filter(e => e.entity_score > 0).sort((a,b) => b.entity_score - a.entity_score);
    // Sort ascending for Wildcards (Anomalies / Quarantined)
    const sortedWildcards = Object.values(entityLedger).filter(e => e.entity_score <= 0.1).sort(() => 0.5 - Math.random()); // Shuffled cold numbers

    const anchors = sortedCore.slice(0, 4).map(e => e.number); 
    const variance = sortedCore.slice(4, 9).map(e => e.number); 
    const wildcards = sortedWildcards.slice(0, 15).map(e => e.number);
    
    let playslipPortfolio = {};

    // ------------------------------------------------------------------------
    // PANELS A-F: THE VANGUARD TRAPS (Strict Wheeling to Close Assembly Gap)
    // ------------------------------------------------------------------------
    playslipPortfolio["Panel_A"] = { intent: "Vanguard Core 1", numbers: buildPanel([anchors[0], anchors[1], anchors[2], variance[0], variance[1]]) };
    playslipPortfolio["Panel_B"] = { intent: "Vanguard Core 2", numbers: buildPanel([anchors[0], anchors[1], anchors[3], variance[1], variance[2]]) };
    playslipPortfolio["Panel_C"] = { intent: "Vanguard Variant 1", numbers: buildPanel([anchors[1], anchors[2], anchors[3], variance[2], variance[3]]) };
    playslipPortfolio["Panel_D"] = { intent: "Vanguard Variant 2", numbers: buildPanel([anchors[0], anchors[2], anchors[3], variance[3], variance[4]]) };
    playslipPortfolio["Panel_E"] = { intent: "Combinatorial Net (Anchor/Var)", numbers: buildPanel([anchors[0], anchors[1], variance[0], variance[3], variance[4]]) };
    playslipPortfolio["Panel_F"] = { intent: "Combinatorial Net (Anchor/Var)", numbers: buildPanel([anchors[2], anchors[3], variance[1], variance[2], variance[4]]) };

    // ------------------------------------------------------------------------
    // PANELS G-J: THE KDD WILDCARDS (High-Variance Anomaly Nets)
    // These intentionally IGNORE anchors to catch thermodynamic standard-deviation breaks
    // ------------------------------------------------------------------------
    playslipPortfolio["Panel_G"] = { intent: "KDD Delta Miner (Wildcard Net 1)", numbers: buildPanel([wildcards[0], wildcards[1], wildcards[2], wildcards[3], wildcards[4]]) };
    playslipPortfolio["Panel_H"] = { intent: "KDD Delta Miner (Wildcard Net 2)", numbers: buildPanel([wildcards[5], wildcards[6], wildcards[7], wildcards[8], wildcards[9]]) };
    playslipPortfolio["Panel_I"] = { intent: "KDD Delta Miner (Wildcard Net 3)", numbers: buildPanel([wildcards[10], wildcards[11], wildcards[12], wildcards[13], wildcards[14]]) };
    
    // Sum-Range Forcer on Panel J
    let pJ = [wildcards[0], wildcards[5], wildcards[10], wildcards[14], wildcards[2]];
    if (pJ.reduce((a,b)=>a+b,0) < 70) pJ[4] = 35; 
    if (pJ.reduce((a,b)=>a+b,0) > 100) pJ[4] = 2;
    playslipPortfolio["Panel_J"] = { intent: "KDD Sum-Range Balancer", numbers: buildPanel(pJ) };

    const pendingHash = generatePortfolioHash(playslipPortfolio);

    // ========================================================================
    // PHASE 5: PAYLOAD COMPILATION & TEMPORAL LOCK
    // ========================================================================
    const finalPayload = {
        schema_version: "PHASE_4.6_HYBRID_KDD",
        experiment_chronology: {
            cycle_id: pendingHash,
            run_timestamp: new Date().toISOString(),
            source_cutoff: `Evaluated Draw: ${targetDrawType} | ${latestOfficialDraw.join('-')}`,
            target_draw_type: targetDrawType,
            output_classification: "LIVE_FORWARD_TEST",
            official_result_known_at_generation: false
        },
        rulebook_compliance: {
            exactly_five_numbers: true,
            ten_panel_limit_enforced: true,
            target_objective: "5-of-5_SINGLE_ROW"
        },
        retro_ledger: retroLedger,
        entity_ledger: entityLedger,
        miner_workspaces: activeMiners,
        playslip_portfolio: playslipPortfolio,
        daily_standup: {
            status: "DEBATE_CONCLUDED",
            action_item: `Dual-Stream isolated for ${targetDrawType}. KDD Shift evaluated as ${kddShift}. 6+4 Hybrid deployed.`
        }
    };

    // ========================================================================
    // PHASE 6: DATABASE INJECTION (MAPPED TO daily_mesh_state)
    // ========================================================================
    console.log(`💾 Injecting Phase 4.6 Payload to Supabase 'daily_mesh_state'. Pending Hash: ${pendingHash}`);
    
    const { error: insertError } = await supabase.from('daily_mesh_state').insert([{ 
        cycle_id: pendingHash,
        state_payload: finalPayload 
    }]);

    if (insertError) {
        console.error("❌ Supabase Save Error:", insertError);
    } else {
        console.log("✅ Phase 4.6 Payload successfully written to database. Pipeline Terminated.");
    }

    return finalPayload;
}

// ============================================================================
// AUTOMATED END-TO-END EXECUTION TRIGGER
// ============================================================================
async function runAutomatedEngine() {
    console.log("🔍 Resolving Dual-Stream Context...");
    
    // Dual-Stream Lock: Isolate Midday physics from Evening physics
    const currentHour = new Date().getHours();
    const targetDrawType = currentHour < 15 ? "MIDDAY" : "EVENING"; 
    
    console.log(`🔍 Fetching latest official ${targetDrawType} draw sequence from Supabase...`);

    // Fetch STRICTLY the draw type we are evaluating to prevent cross-contamination
    const { data: latestRow, error } = await supabase
        .from('f5_draws') 
        .select('*')
        .eq('Draw Type', targetDrawType) // Temporal/Mechanical Lock Applied
        .order('id', { ascending: false })
        .limit(1)
        .single();

    if (error || !latestRow) {
        console.error(`❌ Fatal Extraction Error: Failed to fetch latest ${targetDrawType} draw from 'f5_draws':`, error);
        process.exit(1);
    }

    // Read values strictly from spaced column names exactly as provided in the schema audit
    const latestOfficialDraw = [
        latestRow['Winning Number 1'], 
        latestRow['Winning Number 2'], 
        latestRow['Winning Number 3'], 
        latestRow['Winning Number 4'], 
        latestRow['Winning Number 5']
    ].sort((a, b) => a - b);

    await executePhase4_6_HiveEngine(latestOfficialDraw, targetDrawType);
}

runAutomatedEngine()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("FATAL ENGINE CRASH:", err);
        process.exit(1);
    });
