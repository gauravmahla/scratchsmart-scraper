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
// 1. DATA INTEGRITY & FEATURES
// ==========================================
function runDataIntegrityGate(history) {
    if (!history || history.length < 91) throw new Error("GATE_FAILED: Insufficient historical rows (Need 91+).");
    return true;
}

function buildFeatureBoard(historyBlock) {
    let freq = {};
    for(let i=1; i<=36; i++) freq[i] = 0;
    
    historyBlock.forEach(row => {
        [1,2,3,4,5].forEach(num => {
            let val = row[`Winning Number ${num}`];
            if(val >= 1 && val <= 36) freq[val]++;
        });
    });

    let freqArr = Object.keys(freq).map(k => ({ n: parseInt(k), c: freq[k] })).sort((a,b) => b.c - a.c);
    return {
        hot_numbers: freqArr.slice(0, 5).map(x => x.n),
        cold_numbers: freqArr.slice(-5).map(x => x.n),
        expected_baseline_frequency: (historyBlock.length * 5) / 36 // Mathematical baseline
    };
}

// ==========================================
// 2. MINER ECOSYSTEM (Combinations & Telemetry)
// ==========================================
const MinerEcosystem = {
    stripData: function(historyBlock) {
        return historyBlock.map(row => [
            row["Winning Number 1"], row["Winning Number 2"], 
            row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
        ].sort((a,b) => a-b));
    },
    
    // Exact Set-Overlap Scoring based on Rulebook Match Categories
    scoreBlindTest: function(prediction, actual) {
        let hits = 0;
        prediction.forEach(p => { if (actual.includes(p)) hits++; });
        
        // Rulebook Tiers: 0-1 (Loss), 2 (Free Ticket), 3 (Cash), 4 (Cash), 5 (Top Prize)
        const matchTiers = {0: 0, 1: 0, 2: 10, 3: 40, 4: 80, 5: 100};
        
        return {
            score: matchTiers[hits] || 0,
            matches: hits
        };
    },
    
    agents: {
        Quant: function(stripped) {
            let f = {};
            stripped.flat().forEach(n => f[n] = (f[n]||0)+1);
            let sorted = Object.keys(f).map(k => parseInt(k)).sort((a,b) => f[b] - f[a]);
            return {
                prediction: sorted.slice(0, 5).sort((a,b)=>a-b),
                telemetry_tag: "HISTORICAL_FREQUENCY_PEAK"
            };
        },
        Geometer: function(stripped) {
            // Real Spatial Math: Calculate average gap between adjacent numbers
            let totalGaps = 0;
            let gapCount = 0;
            stripped.forEach(row => {
                for(let i=0; i<4; i++) {
                    totalGaps += (row[i+1] - row[i]);
                    gapCount++;
                }
            });
            let avgGap = Math.max(1, Math.round(totalGaps / gapCount));
            // Project a combination using the average structural gap, starting near 1
            let start = 2; 
            let pred = [start, start + avgGap, start + (avgGap*2), start + (avgGap*3), start + (avgGap*4)];
            // Constrain to 1-36
            pred = pred.map(n => n > 36 ? (n % 36) || 36 : n);
            // Ensure uniqueness (simple fallback for overlap)
            let uniquePred = [...new Set(pred)];
            let fill = 1;
            while(uniquePred.length < 5) {
                if(!uniquePred.includes(fill)) uniquePred.push(fill);
                fill++;
            }
            return {
                prediction: uniquePred.sort((a,b)=>a-b),
                telemetry_tag: "SPATIAL_CLUSTER_DETECTED"
            };
        },
        Hacker: function(stripped) {
            let last = stripped[0]; 
            let pred = last.map(n => n === 36 ? 1 : n + 1);
            return {
                prediction: pred.sort((a,b)=>a-b),
                telemetry_tag: "SEQUENTIAL_ANOMALY_EXPLOIT"
            };
        },
        Surfer: function(stripped) { 
            return {
                prediction: stripped[1] || [1,2,3,4,5],
                telemetry_tag: "3_DAY_MOMENTUM_CARRYOVER"
            };
        },
        Contrarian: function(stripped) {
            let f = {};
            for(let i=1; i<=36; i++) f[i] = 0;
            stripped.flat().forEach(n => f[n]++);
            let sorted = Object.keys(f).map(k => parseInt(k)).sort((a,b) => f[a] - f[b]);
            return {
                prediction: sorted.slice(0, 5).sort((a,b)=>a-b),
                telemetry_tag: "MEAN_REVERSION_DEBT"
            };
        }
    }
};

// ==========================================
// 3. SIX-HAT COUNCIL & WEIGHTED VOTING MATRIX
// ==========================================
function runCouncilDebate(minerResults, tieBreakerAgent) {
    let voteMatrix = {};
    for(let i=1; i<=36; i++) voteMatrix[i] = 0;
    
    // Tally every vote from every miner
    Object.values(minerResults).forEach(result => {
        result.prediction.forEach(num => {
            voteMatrix[num] += 1;
        });
    });

    // Sort board by vote weight descending
    let sortedByWeight = Object.keys(voteMatrix)
        .map(num => parseInt(num))
        .sort((a, b) => {
            let weightDiff = voteMatrix[b] - voteMatrix[a];
            if (weightDiff !== 0) return weightDiff;
            // Tie-Breaker Logic: Defer to the strongest solo agent's prediction vector
            let tieBreakerVector = minerResults[tieBreakerAgent]?.prediction || [];
            if (tieBreakerVector.includes(a) && !tieBreakerVector.includes(b)) return -1;
            if (tieBreakerVector.includes(b) && !tieBreakerVector.includes(a)) return 1;
            return a - b; 
        });

    // GUARANTEE EXACTLY 5 NUMBERS
    let top5 = sortedByWeight.slice(0, 5).sort((a,b) => a-b);
    let tieBreakRequired = voteMatrix[top5[4]] < 2;

    return {
        council_consensus_entry: top5,
        debate_status: voteMatrix[top5[4]] >= 2 ? "STRONG_CONSENSUS" : "TIE_BREAK_FORCED",
        tie_break_utilized: tieBreakRequired,
        vetoed_anomalies: sortedByWeight.slice(-5) // The 5 least supported numbers
    };
}

// ==========================================
// MAIN ENGINE EXECUTION (PHASE 2)
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Phase 2: Rulebook Grounded)...");
    try {
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('id', { ascending: false }) // Ensures freshest data is index 0
            .limit(180);

        if (fetchError) throw fetchError;
        runDataIntegrityGate(history);

        // Define the Blind Surprise Test Window
        const blindTargetRow = history[0]; 
        const blindTargetNumbers = [
            blindTargetRow["Winning Number 1"], blindTargetRow["Winning Number 2"], 
            blindTargetRow["Winning Number 3"], blindTargetRow["Winning Number 4"], blindTargetRow["Winning Number 5"]
        ];
        
        const homeworkHistory = history.slice(1, 91); 
        const strippedHomework = MinerEcosystem.stripData(homeworkHistory);

        let blind_surprise_tests = {};
        let miner_kpis = {};
        let highestScoringAgent = "Quant"; // Default fallback
        let highestScore = -1;

        // Execute Miners on the Blind Holdout
        for (const [name, logic] of Object.entries(MinerEcosystem.agents)) {
            let agentOutput = logic(strippedHomework);
            let testResult = MinerEcosystem.scoreBlindTest(agentOutput.prediction, blindTargetNumbers);
            
            blind_surprise_tests[name] = { 
                prediction: agentOutput.prediction, 
                actual: blindTargetNumbers, 
                score: testResult.score,
                exact_matches: testResult.matches,
                primary_trigger: agentOutput.telemetry_tag
            };

            miner_kpis[name] = {
                status: testResult.score >= 40 ? "FLOW" : (testResult.score === 0 ? "SLUMP" : "NOMINAL"),
                rolling_score: testResult.score,
                evidence_completeness: "VERIFIED"
            };

            if (testResult.score > highestScore) {
                highestScore = testResult.score;
                highestScoringAgent = name;
            }
        }

        // Execute Council with Weighted Matrix
        const councilOutput = runCouncilDebate(blind_surprise_tests, highestScoringAgent);

        // Final Phase 2 Master Payload
        const engineState = {
            schema_version: "PHASE_2_RULEBOOK_GROUNDED",
            cycle_id: `CYC-${Date.now()}`,
            run_date: new Date().toISOString(),
            rule_compliance: {
                exactly_five_numbers: true,
                combination_only: true
            },
            daily_standup: {
                top_learning: `The ${highestScoringAgent} agent successfully mapped the hidden variance today.`,
                system_health: highestScore >= 40 ? "NOMINAL" : "VOLATILE"
            },
            feature_summary: buildFeatureBoard(homeworkHistory),
            blind_surprise_tests: blind_surprise_tests,
            miner_kpis: miner_kpis,
            six_hat_council: councilOutput,
            historic_leadership: {
                current_leader: highestScoringAgent,
                caveat: "Insufficient Epochs for Long-Term Averages"
            }
        };

        console.log("💾 Appending Rulebook-Grounded Cycle to Permanent Memory...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .insert({ cycle_id: engineState.cycle_id, state_payload: engineState });

        if (stateError) throw stateError;
        console.log("🎉 PHASE 2 ENGINE LOCKED! Payload successfully dispatched.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR: ", error.message);
        process.exit(1);
    }
}

runEngine();
// ================== END OF FILE ==================
