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
    if (!history || history.length < 91) throw new Error("GATE FAILED: Need 91+ rows.");
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
        frequencies: freq,
        hot_numbers: freqArr.slice(0, 5).map(x => x.n),
        cold_numbers: freqArr.slice(-5).map(x => x.n)
    };
}

// ==========================================
// 2. MINERS & SCORING
// ==========================================
const MinerEcosystem = {
    stripData: function(historyBlock) {
        return historyBlock.map(row => [
            row["Winning Number 1"], row["Winning Number 2"], 
            row["Winning Number 3"], row["Winning Number 4"], row["Winning Number 5"]
        ].sort((a,b) => a-b));
    },
    score: function(prediction, actual) {
        let hits = 0;
        prediction.forEach(p => { if (actual.includes(p)) hits++; });
        const scoreMap = {0: 0, 1: 10, 2: 35, 3: 70, 4: 90, 5: 100};
        return scoreMap[hits] || 0;
    },
    agents: {
        Quant: function(stripped) {
            let f = {};
            stripped.flat().forEach(n => f[n] = (f[n]||0)+1);
            let sorted = Object.keys(f).map(k => parseInt(k)).sort((a,b) => f[b] - f[a]);
            return sorted.slice(0, 5).sort((a,b)=>a-b);
        },
        Geometer: function() { return [7, 14, 21, 28, 35]; },
        Hacker: function(stripped) {
            let last = stripped[0]; 
            return last.map(n => n === 36 ? 1 : n + 1).sort((a,b)=>a-b); 
        },
        Surfer: function(stripped) { return stripped[1] || [1,2,3,4,5]; },
        Contrarian: function(stripped) {
            let f = {};
            for(let i=1; i<=36; i++) f[i] = 0;
            stripped.flat().forEach(n => f[n]++);
            let sorted = Object.keys(f).map(k => parseInt(k)).sort((a,b) => f[a] - f[b]);
            return sorted.slice(0, 5).sort((a,b)=>a-b);
        }
    }
};

// ==========================================
// 3. SIX-HAT COUNCIL & AUDIT GOVERNOR
// ==========================================
function runCouncilDebate(minerResults) {
    let consensusMap = {};
    
    // Tally votes from all miners
    Object.values(minerResults).forEach(result => {
        result.prediction.forEach(num => {
            consensusMap[num] = (consensusMap[num] || 0) + 1;
        });
    });

    // Green Hat: Find numbers agreed upon by 2 or more distinct miners
    let agreedNumbers = Object.keys(consensusMap)
        .filter(num => consensusMap[num] >= 2)
        .map(num => parseInt(num))
        .sort((a,b) => a-b);

    return {
        council_consensus_entry: agreedNumbers.slice(0, 5), // Top 5 consensus numbers
        active_agreements: agreedNumbers.length,
        debate_status: agreedNumbers.length >= 3 ? "STRONG_CONSENSUS" : "WEAK_CONSENSUS"
    };
}

function runAuditGovernor(minerStates) {
    let activeMiners = Object.keys(minerStates).length;
    let flowCount = Object.values(minerStates).filter(m => m.status === "FLOW").length;
    let slumpCount = Object.values(minerStates).filter(m => m.status === "SLUMP").length;

    let baseScore = 50;
    baseScore += (flowCount * 10);
    baseScore -= (slumpCount * 10);

    return {
        overall_audit_score: Math.max(0, Math.min(100, baseScore)),
        work_completion: activeMiners === 5 ? "100%" : "FAIL",
        system_health: baseScore >= 60 ? "NOMINAL" : "VOLATILE"
    };
}

// ==========================================
// MAIN ENGINE EXECUTION
// ==========================================
async function runEngine() {
    console.log("🚀 Waking the Hive Mind (Final Increment: Council & Audit)...");
    try {
        const { data: history, error: fetchError } = await supabase
            .from('f5_draws')
            .select('*')
            .order('id', { ascending: true }) 
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

        let blind_homework_results = {};
        let miner_states = {};

        // Miners Process
        for (const [name, logic] of Object.entries(MinerEcosystem.agents)) {
            let prediction = logic(strippedHomework);
            let score = MinerEcosystem.score(prediction, blindTargetNumbers);
            
            blind_homework_results[name] = { prediction, actual: blindTargetNumbers, score };
            miner_states[name] = {
                status: score >= 35 ? "FLOW" : (score === 0 ? "SLUMP" : "NOMINAL"),
                recent_blind_score: score
            };
        }

        // Council & Audit Process
        const councilOutput = runCouncilDebate(blind_homework_results);
        const auditOutput = runAuditGovernor(miner_states);

        // Final Master Payload
        const engineState = {
            cycle_id: `CYC-${Date.now()}`,
            run_date: new Date().toISOString(),
            data_quality: "VALIDATED",
            hive_status: {
                system_state: auditOutput.system_health,
                overall_audit_score: auditOutput.overall_audit_score,
                learning_velocity: "ACTIVE"
            },
            feature_summary: buildFeatureBoard(homeworkHistory),
            blind_homework_results: blind_homework_results,
            miner_states: miner_states,
            six_hat_council: councilOutput,
            audit_governor: auditOutput,
            telemetry_events: ["HEARTBEAT_RUN_COMPLETED", "SIX_HAT_COUNCIL_COMPLETED", "AUDIT_GOVERNOR_COMPLETED"]
        };

        console.log("💾 Appending Final Unified Cycle to Permanent Memory...");
        const { error: stateError } = await supabase
            .from('daily_mesh_state')
            .insert({ cycle_id: engineState.cycle_id, state_payload: engineState });

        if (stateError) throw stateError;
        console.log("🎉 HIVE ENGINE FULLY LOCKED! Backend is complete.");
        process.exit(0);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

runEngine();
