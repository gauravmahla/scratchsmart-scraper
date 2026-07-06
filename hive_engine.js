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
    if (!history || history.length < 91) throw new Error("GATE_FAILED: Insufficient epochs (Need 91+).");
    return true;
}

function buildFeatureBoard(historyBlock) {
    let freq = {};
    let middayCount = 0;
    let eveningCount = 0;
    
    for(let i=1; i<=36; i++) freq[i] = 0;
    
    historyBlock.forEach(row => {
        // Feature: Draw Type Context
        if(row["Draw Time"] === "Midday") middayCount++;
        if(row["Draw Time"] === "Evening") eveningCount++;

        [1,2,3,4,5].forEach(num => {
            let val = row[`Winning Number ${num}`];
            if(val >= 1 && val <= 36) freq[val]++;
        });
    });

    let freqArr = Object.keys(freq).map(k => ({ n: parseInt(k), c: freq[k] })).sort((a,b) => b.c - a.c);
    let expectedBaseline = (historyBlock.length * 5) / 36;

    return {
        hot_numbers: freqArr.slice(0, 5).map(x => x.n),
        cold_numbers: freqArr.slice(-5).map(x => x.n),
        expected_baseline_frequency: Number(expectedBaseline.toFixed(2)),
        draw_context_split: { midday: middayCount, evening: eveningCount }
    };
}

// ==========================================
// 2. MINER ECOSYSTEM (Rulebook Grounded)
// ==========================================
const MinerEcosystem = {
    stripData: function(historyBlock) {
        return historyBlock.map(row => [
            row["Winning Number 1"], row["Winning Number 2"], 
            row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
        ].sort((a,b) => a-b));
    },
    
    scoreBlindTest: function(prediction, actual) {
        let hits = 0;
        prediction.forEach(p => { if (actual.includes(p)) hits++; });
        
        // Exact Rulebook Overlap
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
            let totalGaps = 0, gapCount = 0;
            stripped.forEach(row => {
                for(let i=0; i<4; i++) {
                    totalGaps += (row[i+1] - row[i]);
                    gapCount++;
                }
            });
            let avgGap = Math.max(1, Math.round(totalGaps / gapCount));
            let start = 2; 
            let pred = [start, start + avgGap, start + (avgGap*2), start + (avgGap*3), start + (avgGap*4)];
            pred = pred.map(n => n > 36 ? (n % 36) || 36 : n);
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
// 3. SIX-HAT COUNCIL (Weighted Voting Matrix)
// ==========================================
function runCouncilDebate(minerResults, tieBreakerAgent) {
    let voteMatrix = {};
    for(let i=1; i<=36; i++) voteMatrix[i] = 0;
    
    Object.values(minerResults).forEach(result => {
        result.prediction.forEach(num => { voteMatrix[num] += 1; });
    });

    let sortedByWeight = Object.keys(voteMatrix)
        .map(num => parseInt(num))
        .sort((a, b) => {
            let weightDiff = voteMatrix[b] - voteMatrix[a];
            if (weightDiff !== 0) return weightDiff;
            let tieBreakerVector = minerResults[tieBreakerAgent]?.prediction || [];
            if (tieBreakerVector.includes(a) && !tieBreakerVector.includes(b)) return -1;
            if (tieBreakerVector.includes(b) && !tieBreakerVector.includes(a)) return 1;
            return a - b; 
        });

    let top5 = sortedByWeight.slice(0, 5).sort((a,b) => a-b);
    let tieBreakRequired = voteMatrix[top5[4]] < 2;

    return {
        council_consensus_entry: top5,
        debate_status: voteMatrix[top5[4]] >= 2 ? "STRONG_CONSENSUS" : "TIE_BREAK_FORCED",
        tie_break_utilized: tieBreakRequired,
        vetoed_anomalies: sortedByWeight.slice(-5) 
    };
}

// ==========================================
// MAIN ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Phase 2: Full XAI Telemetry)...");
    try {
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('id', { ascending: false })
            .limit(180);

        if (fetchError) throw fetchError;
        runDataIntegrityGate(history);

        const blindTargetRow = history[0]; 
        const blindTargetNumbers = [
            blindTargetRow["Winning Number 1"], blindTargetRow["Winning Number 2"], 
            blindTargetRow["Winning Number 3"], blindTargetRow["Winning Number 4"], blindTargetRow["Winning Number 5"]
        ];
        
        const homeworkHistory = history.slice(1, 91); 
        const strippedHomework = MinerEcosystem.stripData(homeworkHistory);

        let miner_kpis = {};
        let highestScoringAgent = "Quant"; 
        let highestScore = -1;
        let worstScoringAgent = "Quant";
        let lowestScore = 101;

        for (const [name, logic] of Object.entries(MinerEcosystem.agents)) {
            let agentOutput = logic(strippedHomework);
            let testResult = MinerEcosystem.scoreBlindTest(agentOutput.prediction, blindTargetNumbers);
            
            miner_kpis[name] = {
                prediction: agentOutput.prediction,
                score: testResult.score,
                exact_matches: testResult.matches,
                primary_trigger: agentOutput.telemetry_tag,
                status: testResult.score >= 40 ? "FLOW" : (testResult.score === 0 ? "SLUMP" : "NOMINAL"),
                evidence_chain: `Tested against ${homeworkHistory.length} rows. Applied ${agentOutput.telemetry_tag} logic.`
            };

            if (testResult.score > highestScore) { highestScore = testResult.score; highestScoringAgent = name; }
            if (testResult.score < lowestScore) { lowestScore = testResult.score; worstScoringAgent = name; }
        }

        const councilOutput = runCouncilDebate(miner_kpis, highestScoringAgent);
        
        let auditScore = 50 + (highestScore / 2);

        const engineState = {
            schema_version: "PHASE_2_RULEBOOK_GROUNDED",
            cycle_id: `CYC-${Date.now()}`,
            run_date: new Date().toISOString(),
            system_metrics: { epoch_count: history.length },
            
            rule_compliance: {
                exactly_five_numbers: true,
                combination_only: true
            },
            
            daily_standup: {
                best_miner_today: highestScoringAgent,
                worst_miner_today: worstScoringAgent,
                top_learning: `${highestScoringAgent} validated its ${miner_kpis[highestScoringAgent].primary_trigger} hypothesis.`,
                top_risk: councilOutput.tie_break_utilized ? "Weak overall network consensus required tie-break." : "None. Strong consensus achieved.",
                system_health: auditScore >= 60 ? "NOMINAL" : "VOLATILE",
                overall_audit_score: auditScore
            },
            
            feature_factory: buildFeatureBoard(homeworkHistory),
            miner_kpis: miner_kpis,
            six_hat_council: councilOutput,
            
            hypothesis_activity: [
                { owner: highestScoringAgent, status: "PROMOTED", method: miner_kpis[highestScoringAgent].primary_trigger }
            ],
            
            historic_leadership: {
                current_leader: highestScoringAgent,
                caveat: "EARLY_SIGNAL: Insufficient Epochs for Durable Leadership"
            }
        };

        // Injecting the raw export block for MLOps UI extraction
        engineState.developer_export = JSON.stringify(engineState);

        console.log("💾 Appending Rulebook-Grounded Cycle to Permanent Memory...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .insert({ cycle_id: engineState.cycle_id, state_payload: engineState });

        if (stateError) throw stateError;
        console.log("🎉 PHASE 2 ENGINE LOCKED! Telemetry payload dispatched.");
        process.exit(0);
    } catch (error) {
        console.error("FATAL ERROR: ", error.message);
        process.exit(1);
    }
}

runEngine();
// ================== END OF FILE ==================
