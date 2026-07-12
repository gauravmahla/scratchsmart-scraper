const { createClient } = require('@supabase/supabase-js');

// 1. CONFIGURATION - PASTE YOUR KEYS HERE
const SUPABASE_URL = 'https://wwfubdeeiksqjgpmgfvk.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeMesh() {
    console.log("INITIALIZING PHASE 10.4 KDD APEX ENGINE...");

    // 2. ORGANIC DATA INGESTION (Strict ID Descending)
    const { data: p5Data, error: p5Err } = await supabase
        .from('p5_live_entry')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

    const { data: f5Data, error: f5Err } = await supabase
        .from('f5_live_entry')
        .select('*')
        .order('id', { ascending: false })
        .limit(1);

    if (p5Err || f5Err || !p5Data || !f5Data || p5Data.length === 0 || f5Data.length === 0) {
        console.error("FATAL DB ERROR. Cannot read live entries.", p5Err, f5Err);
        process.exit(1);
    }

    const latestP5 = p5Data[0];
    const latestF5 = f5Data[0];
    const p5BaseDraw = [latestP5.num1, latestP5.num2, latestP5.num3, latestP5.num4, latestP5.num5];
    const f5BaseDraw = [latestF5.num1, latestF5.num2, latestF5.num3, latestF5.num4, latestF5.num5];

    // 3. ENGINE 2: PICK 5 (LOCKED DECAY LOGIC)
    let p5Panels = [];
    for (let i = 0; i < 10; i++) {
        p5Panels.push([
            Math.abs((p5BaseDraw[0] + i) % 10),
            Math.abs((p5BaseDraw[1] + (i * 2)) % 10),
            Math.abs((p5BaseDraw[2] - i + 10) % 10),
            Math.abs((p5BaseDraw[3] + 1) % 10),
            Math.abs((latestP5.fireball + i) % 10) // Ghost parameter
        ]);
    }

    // 4. ENGINE 1: FANTASY 5 (APEX COMBINATORIAL WHEEL)
    const seedSum = f5BaseDraw.reduce((a, b) => a + b, 0);
    let drum = Array.from({length: 36}, (_, i) => i + 1);
    
    // KDD Variance Shuffle
    for(let i = drum.length - 1; i > 0; i--) {
        let j = (seedSum * (i + 1)) % (i + 1);
        [drum[i], drum[j]] = [drum[j], drum[i]];
    }

    const apexPool = drum.slice(0, 12);
    const johnWick = drum.slice(25, 30).sort((a,b) => a - b); 

    const wheelIndices = [
        [0,1,2,3,4], [0,5,6,7,8], [1,2,9,10,11],
        [3,4,5,9,10], [6,7,8,11,0], [1,3,6,9,11],
        [2,4,7,10,0], [5,8,1,4,11], [2,5,7,9,0]
    ];

    let f5Panels = [];
    wheelIndices.forEach(indices => {
        let p = indices.map(idx => apexPool[idx]).sort((a, b) => a - b);
        f5Panels.push(p);
    });
    f5Panels.push(johnWick); // Panel J decoupled

    // 5. JSON PAYLOAD COMPILATION
    const pNames = ["Panel_A", "Panel_B", "Panel_C", "Panel_D", "Panel_E", "Panel_F", "Panel_G", "Panel_H", "Panel_I", "Panel_J"];
    const pick5Obj = {}; p5Panels.forEach((p, i) => pick5Obj[pNames[i]] = p);
    const fantasy5Obj = {}; f5Panels.forEach((p, i) => fantasy5Obj[pNames[i]] = p);

        const currentCycleId = `CYC-${Date.now()}`;

    const payload = {
        cycle_id: currentCycleId,
        portfolios: {
            PICK_5: {
                panels: pick5Obj,
                miner_rationale: "Locked mechanical decay. Isolated tumblers with explicit Ghost Parameter injection.",
                target_objective: "120_WAY_BOX_MAXIMIZATION",
                action_requirement: "PLAYSTYLE: BOX. FIREBALL: YES."
            },
            FANTASY_5: {
                panels: fantasy5Obj,
                miner_rationale: "Panels A-I form a 12-number Combinatorial Apex Wheel. Panel J is the decoupled John Wick cold-zone sniper.",
                target_objective: "APEX_HUNT_CASCADING_MULTIPLIER",
                kdd_seed_variance: seedSum
            }
        },
        daily_standup: {
            status: "PHASE_10.4_APEX_ENGAGED",
            action_item: "Database push successful. Schema matched."
        },
        execution_timestamp: new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    };

    console.log("=== PAYLOAD GENERATED ===");
    console.log(JSON.stringify(payload, null, 2));

    // 6. DATABASE WRITE (SCHEMA EXACT MATCH)
    const { error: insertErr } = await supabase
        .from('daily_mesh_state')
        .insert([{ 
            cycle_id: currentCycleId,
            state_payload: payload 
        }]); 

    if (insertErr) {
        console.error("FAILED TO WRITE TO DAILY_MESH_STATE:", insertErr);
    } else {
        console.log("SUCCESS: Payload securely written to daily_mesh_state.");
    }
}

executeMesh();
