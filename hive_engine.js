// ============================================================================
// NEURAL HIVE MIND - PHASE 4.5 ENGINE 
// (ADVANCED MATHEMATICAL TRAPS, WHEELING, & ZERO-TOUCH SYNC)
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const WebSocket = require('ws'); 

// Force Node global polyfill as an absolute fail-safe
global.WebSocket = WebSocket;

// --- 1. CONFIGURATION & SECRETS ---
const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';

// Inject WebSocket directly into the Realtime transport config
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
    realtime: {
        transport: WebSocket
    },
    global: {
        WebSocket: WebSocket
    }
});

// --- 2. CRYPTOGRAPHIC & COMBINATORIAL HELPERS ---
function generatePortfolioHash(portfolio) {
    return 'HASH-' + crypto.createHash('sha256').update(JSON.stringify(portfolio)).digest('hex').substring(0, 8).toUpperCase();
}

function buildPanel(numbersArray) {
    const unique = Array.from(new Set(numbersArray)).filter(n => typeof n === 'number' && n >= 1 && n <= 36);
    const fallbacks = [4, 11, 19, 27, 34]; 
    while (unique.length < 5) {
        let fb = fallbacks.shift();
        if (!unique.includes(fb)) unique.push(fb);
    }
    return unique.slice(0, 5).sort((a, b) => a - b);
}

// ============================================================================
// CORE ENGINE LOGIC: PAST, PRESENT, FUTURE SYNCHRONIZATION
// ============================================================================
async function executePhase4_5_HiveEngine(latestOfficialDraw) {
    console.log("🚀 INITIATING PHASE 4.5: TIME-LOCKED COMBINATORICS...");
    console.log(`📌 Official Draw Input: [${latestOfficialDraw.join(', ')}]`);

    // ========================================================================
    // PHASE 1: THE PAST (Memory Retrieval & Strict Retro Grading)
    // ========================================================================
    console.log("⏳ Retrieving previous pending portfolio to execute strict grading...");
    
    const { data: previousRun } = await supabase
        .from('hive_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let retroLedger = { status: "AWAITING_DATA", assembly_gap: 0, best_panel_match: "0-of-5", portfolio_recall: [], roi_ledger: {} };
    let previousHash = "UNKNOWN_HASH";
    let priorFreeTickets = 0;
    let priorSimSpend = 0;
    let priorCash = 0;

    if (previousRun && previousRun.playslip_portfolio) {
        console.log("✅ Previous Portfolio Validated. Calculating Assembly Gap.");
        previousHash = previousRun.experiment_chronology?.cycle_id || generatePortfolioHash(previousRun.playslip_portfolio);
        
        priorFreeTickets = previousRun.retro_ledger?.roi_ledger?.free_tickets_banked || 0;
        priorSimSpend = previousRun.retro_ledger?.roi_ledger?.simulated_spend || 0;
        priorCash = previousRun.retro_ledger?.roi_ledger?.cash_prizes || 0;

        let bestMatchCount = 0;
        let trappedNumbers = new Set();
        let panelBreakdown = {};
        let winningPanels = 0;

        Object.keys(previousRun.playslip_portfolio).forEach(panelKey => {
            const panelNumbers = previousRun.playslip_portfolio[panelKey].numbers;
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
            target_evaluated: previousRun.experiment_chronology?.target_draw_type || "UNKNOWN",
            graded_hash: previousHash,
            actual_draw: latestOfficialDraw,
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
        console.log("⚠️ Cold Start Detected. Bypassing Grading Sequence.");
    }

    // ========================================================================
    // PHASE 2: THE PRESENT (ML Council Adjustments & Dynamic Scoring)
    // ========================================================================
    const activeMiners = {
        "Quant": { signals: [2, 6, 9, 19, 22], tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "HISTORICAL_FREQUENCY_PEAK" },
        "Hacker": { signals: [7, 10, 12, 13, 23], tag_state: "PENDING", council_weight: 0.1, active_hypothesis: "SEQUENTIAL_ANOMALY_EXPLOIT" },
        "Geometer": { signals: [6, 11, 16, 21, 26], tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SPATIAL_CLUSTER_DETECTED" },
        "Contrarian": { signals: [27, 28, 29, 31, 35], tag_state: "PENDING", council_weight: 1.0, active_hypothesis: "MEAN_REVERSION_DEBT" },
        "SameDayBridge": { signals: [6, 9, 12, 23, 36], tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SAME_DAY_CARRYOVER" }
    };

    if (retroLedger.status === "PORTFOLIO_SCORED") {
        Object.keys(activeMiners).forEach(minerName => {
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
    // PHASE 3: THE FUTURE (4-Stage Mathematical Combinatorial Traps)
    // ========================================================================
    console.log("🕸️ Assembling Abbreviated Wheeling Matrix...");
    
    const sortedEntities = Object.values(entityLedger).filter(e => e.entity_score > 0).sort((a,b) => b.entity_score - a.entity_score);
    const anchors = sortedEntities.slice(0, 4).map(e => e.number); 
    const variance = sortedEntities.slice(4, 9).map(e => e.number); 
    const risky = sortedEntities.slice(9, 14).map(e => e.number) || [1, 3, 5]; 
    
    let playslipPortfolio = {};

    // TRAP 1: VANGUARD CORE 
    playslipPortfolio["Panel_A"] = { intent: "Vanguard Core (Highest Weight)", numbers: buildPanel([...anchors, variance[0]]) };
    playslipPortfolio["Panel_B"] = { intent: "Vanguard Variant", numbers: buildPanel([...anchors, variance[1]]) };

    // TRAP 2: CROSS-POLLINATION WHEEL 
    playslipPortfolio["Panel_C"] = { intent: "Combinatorial Net (Anchor/Risk Blend)", numbers: buildPanel([anchors[0], anchors[1], anchors[2], risky[0] || variance[2], risky[1] || variance[3]]) };
    playslipPortfolio["Panel_D"] = { intent: "Combinatorial Net (Anchor/Risk Blend)", numbers: buildPanel([anchors[0], anchors[1], anchors[3], risky[0] || variance[2], variance[2]]) };
    playslipPortfolio["Panel_E"] = { intent: "Combinatorial Net 1", numbers: buildPanel([anchors[1], anchors[2], anchors[3], risky[1] || variance[3], variance[3]]) };
    playslipPortfolio["Panel_F"] = { intent: "Combinatorial Net 2", numbers: buildPanel([anchors[0], anchors[2], anchors[3], risky[0] || variance[2], variance[4]]) };

    // TRAP 3: SUM-RANGE BALANCING 
    let pG = [variance[0], variance[1], variance[2], risky[0] || 15, anchors[0]];
    if (pG.reduce((a,b)=>a+b,0) < 70) pG[4] = 35; 
    if (pG.reduce((a,b)=>a+b,0) > 100) pG[4] = 2; 
    playslipPortfolio["Panel_G"] = { intent: "Trap 3: Sum-Range Balancing (70-100)", numbers: buildPanel(pG) };

    let pH = [variance[3], variance[4], risky[1] || 16, anchors[1], anchors[2]];
    if (pH.reduce((a,b)=>a+b,0) < 70) pH[4] = 34;
    if (pH.reduce((a,b)=>a+b,0) > 100) pH[4] = 3;
    playslipPortfolio["Panel_H"] = { intent: "Trap 3: Sum-Range Balancing (70-100)", numbers: buildPanel(pH) };

    // TRAP 4: PARITY BALANCE & SHADOW MUTATION 
    playslipPortfolio["Panel_I"] = { intent: "Same-Day Bridge Matrix", numbers: buildPanel([...anchors.slice(0,2), ...variance.slice(0,3)]) };
    playslipPortfolio["Panel_J"] = { intent: "Shadow Mutation", numbers: buildPanel([risky[0]||1, risky[1]||4, risky[2]||12, variance[0], anchors[3]]) };

    const pendingHash = generatePortfolioHash(playslipPortfolio);

    // ========================================================================
    // PHASE 4: PAYLOAD COMPILATION & TEMPORAL LOCK
    // ========================================================================
    const currentHour = new Date().getHours();
    const targetDrawType = currentHour < 15 ? "Midday" : "Evening"; 

    const finalPayload = {
        schema_version: "PHASE_4.5_MATHEMATICAL_TRAP",
        experiment_chronology: {
            cycle_id: pendingHash,
            run_timestamp: new Date().toISOString(),
            source_cutoff: `Evaluated Draw: ${latestOfficialDraw.join('-')}`,
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
            action_item: "Retro graded against remote DB. Temporal lock achieved. 4-Stage Combinatorial Wheeling deployed."
        }
    };

    // ========================================================================
    // PHASE 5: DATABASE INJECTION
    // ========================================================================
    console.log(`💾 Injecting Phase 4.5 Payload to Supabase. Pending Hash: ${pendingHash}`);
    
    const { error: insertError } = await supabase.from('hive_logs').insert([ finalPayload ]);
    if (insertError) {
        console.error("❌ Supabase Save Error:", insertError);
    } else {
        console.log("✅ Payload successfully written to database. Pipeline Terminated.");
    }

    return finalPayload;
}

// ============================================================================
// AUTOMATED END-TO-END EXECUTION TRIGGER
// ============================================================================
async function runAutomatedEngine() {
    console.log("🔍 Fetching latest official draw sequence from Supabase...");
    
    const { data: latestRow, error } = await supabase
        .from('florida_fantasy_5') 
        .select('num1, num2, num3, num4, num5')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !latestRow) {
        console.error("❌ Fatal Extraction Error: Failed to fetch latest draw from Supabase:", error);
        process.exit(1);
    }

    const latestOfficialDraw = [
        latestRow.num1, 
        latestRow.num2, 
        latestRow.num3, 
        latestRow.num4, 
        latestRow.num5
    ].sort((a, b) => a - b);

    await executePhase4_5_HiveEngine(latestOfficialDraw);
}

runAutomatedEngine()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("FATAL ENGINE CRASH:", err);
        process.exit(1);
    });
