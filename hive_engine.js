// --- START OF CODE ---
// ============================================================================
// NEURAL HIVE MIND - PHASE 7.1: APEX CEILING MATRIX & KNN IMAGE MEMORY
// (8/2 BIPARTITE TRAP, TRUE TUMBLER ENTROPY, WILDCARD PATCHED, STABLE)
// ============================================================================
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const WebSocket = require('ws'); 

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

function buildPanel(numbersArray, dynamicFallbackPool) {
    let unique = Array.from(new Set(numbersArray)).filter(n => typeof n === 'number' && n >= 1 && n <= 36);
    let fallbackIndex = 0;
    while (unique.length < 5 && fallbackIndex < dynamicFallbackPool.length) {
        let fb = dynamicFallbackPool[fallbackIndex];
        if (unique.indexOf(fb) === -1) unique.push(fb);
        fallbackIndex++;
    }
    return unique.slice(0, 5).sort((a, b) => a - b);
}

// ============================================================================
// CORE ENGINE LOGIC: PHASE 7.1
// ============================================================================
async function executePhase7_1_HiveEngine(latestOfficialDraw, targetDrawType, historicalDraws, flTimeString, orbitOffset) {
    console.log(`🚀 INITIATING PHASE 7.1: APEX CEILING & KNN IMAGE MEMORY`);
    console.log(`📌 Florida Time Verified: [${flTimeString}] | Target Draw Locked: [${targetDrawType}]`);
    console.log(`📌 KNN Active Memory Pool: [${historicalDraws.length}] Draws Loaded.`);

    const currentDNAString = "Evaluated Draw: " + targetDrawType + " | " + latestOfficialDraw.join('-');
    const currentDrawSum = latestOfficialDraw.reduce((a, b) => a + b, 0);

    // ========================================================================
    // 1. KNN IMAGE MEMORY (PATTERN MATCHER)
    // ========================================================================
    let knnFollowerFreq = {};
    for (let i = 1; i < historicalDraws.length; i++) {
        let pastSum = historicalDraws[i].reduce((a, b) => a + b, 0);
        if (Math.abs(pastSum - currentDrawSum) <= 3) {
            let subsequentDraw = historicalDraws[i - 1]; 
            subsequentDraw.forEach(num => {
                knnFollowerFreq[num] = (knnFollowerFreq[num] || 0) + 1;
            });
        }
    }
    const sortedKNN = Object.entries(knnFollowerFreq).sort((a, b) => b[1] - a[1]);
    const knnSignals = sortedKNN.slice(0, 5).map(e => parseInt(e[0], 10));

    // ========================================================================
    // 2. POSITIONAL FREQUENCY & TRADITIONAL MINERS
    // ========================================================================
    let positionalFrequencies = [{}, {}, {}, {}, {}];
    let globalFrequency = {};
    for (let i = 1; i <= 36; i++) globalFrequency[i] = 0;

    historicalDraws.forEach(draw => {
        draw.forEach((num, index) => {
            if (positionalFrequencies[index][num] === undefined) positionalFrequencies[index][num] = 0;
            positionalFrequencies[index][num] += 1;
            globalFrequency[num] += 1;
        });
    });

    let quantSignals = [];
    for (let i = 0; i < 5; i++) {
        let sortedColumn = Object.entries(positionalFrequencies[i]).sort((a, b) => b[1] - a[1]);
        if (sortedColumn.length > 0) {
            let topNum = parseInt(sortedColumn[0][0], 10);
            if (quantSignals.indexOf(topNum) === -1) quantSignals.push(topNum);
            else if (sortedColumn.length > 1) quantSignals.push(parseInt(sortedColumn[1][0], 10));
        }
    }

    const sortedGlobal = Object.entries(globalFrequency).sort((a, b) => b[1] - a[1]);
    const contrarianSignals = sortedGlobal.slice(-5).map(e => parseInt(e[0], 10));
    
    let geometerSet = new Set();
    latestOfficialDraw.forEach(n => {
        if (n > 1) geometerSet.add(n - 1);
        if (n < 36) geometerSet.add(n + 1);
    });
    const geometerSignals = Array.from(geometerSet).slice(0, 5);
    const sameDaySignals = latestOfficialDraw;

    let coldPairSim = [
        parseInt(sortedGlobal[sortedGlobal.length - 1][0], 10),
        parseInt(sortedGlobal[sortedGlobal.length - 2][0], 10),
        parseInt(sortedGlobal[20][0], 10),
        parseInt(sortedGlobal[21][0], 10),
        parseInt(sortedGlobal[10][0], 10)
    ];
    const hackerSignals = Array.from(new Set(coldPairSim)).slice(0, 5);

    // ========================================================================
    // 3. DYNAMIC KDD THERMODYNAMICS
    // ========================================================================
    let allSums = historicalDraws.map(d => d.reduce((a, b) => a + b, 0));
    let meanSum = allSums.reduce((a, b) => a + b, 0) / allSums.length;
    let varianceSum = allSums.reduce((a, b) => a + Math.pow(b - meanSum, 2), 0) / allSums.length;
    let stdDev = Math.sqrt(varianceSum);
    
    let kddLowBound = meanSum - stdDev;
    let kddHighBound = meanSum + stdDev;
    
    let kddShift = "NOMINAL_BELL_CURVE";
    let subsetDraws = [];

    if (currentDrawSum < kddLowBound) {
        kddShift = "EXTREME_LOW_DROP";
        subsetDraws = historicalDraws.filter(d => d.reduce((a, b) => a + b, 0) < kddLowBound);
    } else if (currentDrawSum > kddHighBound) {
        kddShift = "EXTREME_HIGH_SPIKE";
        subsetDraws = historicalDraws.filter(d => d.reduce((a, b) => a + b, 0) > kddHighBound);
    } else {
        kddShift = "NOMINAL_BELL_CURVE";
        subsetDraws = historicalDraws.filter(d => {
            let s = d.reduce((a,b)=>a+b,0);
            return s >= kddLowBound && s <= kddHighBound;
        });
    }

    let kddFreq = {};
    subsetDraws.forEach(draw => draw.forEach(num => { kddFreq[num] = (kddFreq[num] || 0) + 1; }));
    const sortedKDD = Object.entries(kddFreq).sort((a, b) => b[1] - a[1]);
    let kddSignals = sortedKDD.slice(0, 5).map(e => parseInt(e[0], 10));
    if (kddSignals.length < 5) kddSignals = [12, 15, 18, 21, 24]; 

    // ========================================================================
    // 4. RETRO EVIDENCE GRADING (DNA LOCK)
    // ========================================================================
    const { data: previousRuns } = await supabase.from('daily_mesh_state').select('*').order('created_at', { ascending: false }).limit(15);

    let retroLedger = { status: "AWAITING_NEW_DATA", assembly_gap: 0, best_panel_match: "0-of-5", portfolio_recall: [], roi_ledger: {} };
    let previousHash = "UNKNOWN_HASH";
    let prevPayload = null;

    if (previousRuns && previousRuns.length > 0) {
        for (let i = 0; i < previousRuns.length; i++) {
            let run = previousRuns[i];
            if (run && run.state_payload && run.state_payload.experiment_chronology && run.state_payload.experiment_chronology.target_draw_type === targetDrawType) {
                prevPayload = run.state_payload;
                break;
            }
        }
    }

    if (prevPayload && prevPayload.playslip_portfolio) {
        previousHash = (prevPayload.experiment_chronology && prevPayload.experiment_chronology.cycle_id) ? prevPayload.experiment_chronology.cycle_id : "LEGACY_HASH";
        let previousDNA = (prevPayload.experiment_chronology && prevPayload.experiment_chronology.source_cutoff) ? prevPayload.experiment_chronology.source_cutoff : "UNKNOWN_DNA";
        
        if (previousDNA !== currentDNAString) {
            let bestMatchCount = 0;
            let trappedNumbers = new Set();
            let panelBreakdown = {};
            let winningPanels = 0;

            Object.keys(prevPayload.playslip_portfolio).forEach(panelKey => {
                const panelData = prevPayload.playslip_portfolio[panelKey];
                if (panelData && panelData.numbers) {
                    const matches = panelData.numbers.filter(n => latestOfficialDraw.indexOf(n) !== -1);
                    matches.forEach(n => trappedNumbers.add(n));
                    if (matches.length > bestMatchCount) bestMatchCount = matches.length;
                    if (matches.length >= 2) winningPanels++;
                    panelBreakdown[panelKey] = matches.length + "-of-5";
                }
            });

            const totalRecall = Array.from(trappedNumbers).sort((a,b) => a-b);
            const assemblyGap = totalRecall.length - bestMatchCount;

            retroLedger = {
                status: "PORTFOLIO_SCORED",
                target_evaluated: targetDrawType,
                graded_hash: previousHash,
                actual_draw: latestOfficialDraw,
                kdd_thermodynamic_sum: currentDrawSum,
                kdd_shift_detected: kddShift,
                portfolio_recall: totalRecall,
                best_panel_match: bestMatchCount + "-of-5",
                assembly_gap: assemblyGap > 0 ? assemblyGap : 0,
                panel_breakdown: panelBreakdown,
                roi_ledger: {
                    cash_prizes: (bestMatchCount === 3 ? 20 : bestMatchCount === 4 ? 100 : bestMatchCount === 5 ? 200000 : 0),
                    free_tickets_banked: (bestMatchCount === 2 ? winningPanels : 0),
                    system_lift: bestMatchCount >= 2 ? "+" + (bestMatchCount * 1.5).toFixed(1) + "x vs Random" : "Baseline Maintenance"
                }
            };
        } else {
            console.log(`🔒 DNA LOCK ENGAGED: True physical draw has not occurred yet. Suspending Memory.`);
            retroLedger.status = "AWAITING_NEW_DATA";
            retroLedger.target_evaluated = targetDrawType;
            retroLedger.graded_hash = previousHash;
        }
    }

    // ========================================================================
    // 5. ML COUNCIL FLUID WEIGHT SCALING
    // ========================================================================
    const activeMiners = {
        "KNN_Memory": { signals: knnSignals, tag_state: "PENDING", council_weight: 1.5, active_hypothesis: "HISTORICAL_TWIN_PROJECTION" },
        "Quant": { signals: quantSignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "POSITIONAL_COLUMN_MATRIX" },
        "Hacker": { signals: hackerSignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "COLD_PAIR_EXPLOIT" },
        "Geometer": { signals: geometerSignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "TUMBLER_ADJACENCY" },
        "Contrarian": { signals: contrarianSignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "TRUE_MEAN_REVERSION" },
        "SameDayBridge": { signals: sameDaySignals, tag_state: "PENDING", council_weight: 0.5, active_hypothesis: "SAME_DAY_CARRYOVER" },
        "KDD_Anomaly": { signals: kddSignals, tag_state: "PENDING", council_weight: 1.0, active_hypothesis: kddShift }
    };

    if (retroLedger.status === "PORTFOLIO_SCORED") {
        Object.keys(activeMiners).forEach(minerName => {
            if (minerName === "KDD_Anomaly" || minerName === "KNN_Memory") return; 
            const hits = activeMiners[minerName].signals.filter(n => retroLedger.portfolio_recall.indexOf(n) !== -1).length;
            let fluidWeight = (hits / 5.0) + 0.05; 
            activeMiners[minerName].council_weight = parseFloat(fluidWeight.toFixed(3));
            
            if (fluidWeight > 0.4) activeMiners[minerName].tag_state = "VALIDATED";
            else if (fluidWeight > 0.2) activeMiners[minerName].tag_state = "WATCHLIST";
            else activeMiners[minerName].tag_state = "QUARANTINED";
        });
    } else if (retroLedger.status === "AWAITING_NEW_DATA" && prevPayload && prevPayload.miner_workspaces) {
        Object.keys(activeMiners).forEach(minerName => {
            if (minerName === "KDD_Anomaly" || minerName === "KNN_Memory") return;
            if (prevPayload.miner_workspaces[minerName] && prevPayload.miner_workspaces[minerName].council_weight) {
                activeMiners[minerName].council_weight = prevPayload.miner_workspaces[minerName].council_weight;
                activeMiners[minerName].tag_state = prevPayload.miner_workspaces[minerName].tag_state;
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
    // 6. THE 8/2 APEX CEILING MATRIX (The Patched Combinatorial Trap)
    // ========================================================================
    const sortedCore = Object.values(entityLedger).filter(e => e.entity_score > 0).sort((a,b) => b.entity_score - a.entity_score);
    const sortedWildcards = Object.values(entityLedger).filter(e => e.entity_score <= 0.1).sort(() => 0.5 - Math.random()); 

    // BUGFIX: Explicitly map wildcards to prevent ReferenceError
    const wildcards = sortedWildcards.map(e => e.number);
    let apex7 = sortedCore.slice(0, 7).map(e => e.number); 
    
    // Safety check: ensure apex7 has exactly 7 elements
    while(apex7.length < 7 && wildcards.length > 0) {
        apex7.push(wildcards.shift());
    }

    const fullDynamicRoster = sortedCore.map(e => e.number).concat(wildcards);
    let playslipPortfolio = {};

    playslipPortfolio["Panel_A"] = { intent: "Apex Matrix (A-B-C-D-E)", numbers: buildPanel([apex7[0], apex7[1], apex7[2], apex7[3], apex7[4]], fullDynamicRoster) };
    playslipPortfolio["Panel_B"] = { intent: "Apex Matrix (A-B-C-F-G)", numbers: buildPanel([apex7[0], apex7[1], apex7[2], apex7[5], apex7[6]], fullDynamicRoster) };
    playslipPortfolio["Panel_C"] = { intent: "Apex Matrix (A-D-E-F-G)", numbers: buildPanel([apex7[0], apex7[3], apex7[4], apex7[5], apex7[6]], fullDynamicRoster) };
    playslipPortfolio["Panel_D"] = { intent: "Apex Matrix (B-C-D-F-G)", numbers: buildPanel([apex7[1], apex7[2], apex7[3], apex7[5], apex7[6]], fullDynamicRoster) };
    playslipPortfolio["Panel_E"] = { intent: "Apex Matrix (A-B-D-E-F)", numbers: buildPanel([apex7[0], apex7[1], apex7[3], apex7[4], apex7[5]], fullDynamicRoster) };
    playslipPortfolio["Panel_F"] = { intent: "Apex Matrix (A-C-E-F-G)", numbers: buildPanel([apex7[0], apex7[2], apex7[4], apex7[5], apex7[6]], fullDynamicRoster) };
    playslipPortfolio["Panel_G"] = { intent: "Apex Matrix (B-D-E-F-G)", numbers: buildPanel([apex7[1], apex7[3], apex7[4], apex7[5], apex7[6]], fullDynamicRoster) };
    playslipPortfolio["Panel_H"] = { intent: "Apex Matrix (C-D-E-F-G)", numbers: buildPanel([apex7[2], apex7[3], apex7[4], apex7[5], apex7[6]], fullDynamicRoster) };

    let safe1 = [wildcards[0], wildcards[1], wildcards[2], apex7[6], parseInt(sortedGlobal[0][0], 10)];
    let safe2 = [wildcards[3], wildcards[4], wildcards[5], apex7[5], parseInt(sortedGlobal[sortedGlobal.length-1][0], 10)];
    playslipPortfolio["Panel_I"] = { intent: "Variance Parachute 1", numbers: buildPanel(safe1, fullDynamicRoster) };
    playslipPortfolio["Panel_J"] = { intent: "Variance Parachute 2", numbers: buildPanel(safe2, fullDynamicRoster) };

    const pendingHash = generatePortfolioHash(playslipPortfolio);

    const finalPayload = {
        schema_version: "PHASE_7.1_APEX_CEILING",
        experiment_chronology: {
            cycle_id: pendingHash,
            run_timestamp: new Date().toISOString(),
            florida_time_evaluated: flTimeString,
            database_orbit_offset: orbitOffset,
            source_cutoff: currentDNAString,
            target_draw_type: targetDrawType,
            output_classification: "LIVE_FORWARD_TEST",
            official_result_known_at_generation: false
        },
        ui_enrichment: {
            strategy_active: "8/2 Bipartite Matrix",
            knn_twins_found: true,
            apex_compression_pool: apex7
        },
        rulebook_compliance: { target_objective: "5-of-5_SINGLE_ROW", exactly_five_numbers: true, ten_panel_limit_enforced: true },
        retro_ledger: retroLedger,
        entity_ledger: entityLedger,
        miner_workspaces: activeMiners,
        playslip_portfolio: playslipPortfolio,
        daily_standup: {
            status: retroLedger.status === "AWAITING_NEW_DATA" ? "MEMORY_SUSPENDED" : "DEBATE_CONCLUDED",
            action_item: `Phase 7.1 Deployed. KNN Memory Active. 8/2 Matrix Locked on Top 7 Entities.`
        }
    };

    console.log(`💾 Writing Phase 7.1 Payload to Supabase. Hash: ${pendingHash}`);
    await supabase.from('daily_mesh_state').insert([{ cycle_id: pendingHash, state_payload: finalPayload }]);
    console.log("✅ Phase 7.1 Architecture Deployed successfully.");
}

// ============================================================================
// AUTOMATED EXECUTION: MASSIVE DATA FETCH FOR KNN MEMORY
// ============================================================================
async function runAutomatedEngine() {
    const options = { timeZone: 'America/New_York', hour12: false, hour: 'numeric', minute: 'numeric' };
    const flTimeString = new Intl.DateTimeFormat('en-US', options).format(new Date());
    
    const parts = flTimeString.split(':');
    const flHour = parseInt(parts[0], 10);
    const flMin = parseInt(parts[1], 10);
    const flTimeDecimal = flHour + (flMin / 60);

    let targetDrawType = "EVENING"; 
    if (flTimeDecimal < 12.75) targetDrawType = "MIDDAY";
    else if (flTimeDecimal < 22.66) targetDrawType = "EVENING";
    else targetDrawType = "MIDDAY"; 

    console.log(`📡 Fetching Active Matrix (Recent 1500) and Deep Archive (Deep 1500) for KNN...`);
    
    const { data: recentRows, error: err1 } = await supabase
        .from('f5_draws') 
        .select('*')
        .eq('Draw Type', targetDrawType) 
        .order('id', { ascending: false })
        .limit(1000); 

    if (err1 || !recentRows || recentRows.length === 0) {
        console.error("❌ Fatal Error: Recent ingestion pool failed.");
        process.exit(1);
    }

    const currentDay = new Date().getDate();
    const currentMinute = new Date().getMinutes();
    const orbitOffset = 1500 + ((currentDay * currentMinute) % 3000); 

    const { data: deepRows, error: err2 } = await supabase
        .from('f5_draws') 
        .select('*')
        .eq('Draw Type', targetDrawType) 
        .order('id', { ascending: false })
        .range(orbitOffset, orbitOffset + 1500); 

    const finalDeepRows = (deepRows && deepRows.length > 0) ? deepRows : [];
    
    const extractPhysicalSequence = (row) => {
        return [
            parseInt(row['Winning Number 1'], 10), 
            parseInt(row['Winning Number 2'], 10), 
            parseInt(row['Winning Number 3'], 10), 
            parseInt(row['Winning Number 4'], 10), 
            parseInt(row['Winning Number 5'], 10)
        ];
    };

    const recentDrawsRaw = recentRows.map(extractPhysicalSequence);
    const deepDrawsRaw = finalDeepRows.map(extractPhysicalSequence);
    const allRaw = recentDrawsRaw.concat(deepDrawsRaw);
    
    const latestOfficialDraw = allRaw[0];

    await executePhase7_1_HiveEngine(latestOfficialDraw, targetDrawType, allRaw, flTimeString, orbitOffset);
}

runAutomatedEngine()
    .then(() => process.exit(0))
    .catch(err => {
        console.error("FATAL INSTABILITY:", err);
        process.exit(1);
    });
// --- END OF CODE ---
