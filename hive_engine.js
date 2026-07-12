const { createClient } = require('@supabase/supabase-js');

// 1. CONFIGURATION
// CRITICAL: You must paste your actual Supabase URL and Anon Key inside these quotes.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wwfubdeeiksqjgpmgfvk.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZnViZGVlaWtzcWpncG1nZnZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwOTgwOTQsImV4cCI6MjA5ODY3NDA5NH0.JoDaG5AgmbilsXQDNCFapogYeTOUwGPiN19C66vyoK0';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeMesh() {
    console.log("INITIALIZING PHASE 10.4 KDD APEX ENGINE...");

    // 2. ORGANIC DATA INGESTION
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

    // TELEMETRY: Print exact errors if Supabase rejects us
    if (p5Err) console.error("SUPABASE P5 REJECTION:", JSON.stringify(p5Err));
    if (f5Err) console.error("SUPABASE F5 REJECTION:", JSON.stringify(f5Err));

    if (p5Err || f5Err || !p5Data || !f5Data || p5Data.length === 0 || f5Data.length === 0) {
        console.error("FATAL: Cannot fetch latest draw. Did you paste your URL and KEY?");
        process.exit(1);
    }

    const latestP5 = p5Data[0];
    const latestF5 = f5Data[0];
    const p5BaseDraw = [latestP5.num1, latestP5.num2, latestP5.num3, latestP5.num4, latestP5.num5];
    const f5BaseDraw = [latestF5.num1, latestF5.num2, latestF5.num3, latestF5.num4, latestF5.num5];

        // 3. ENGINE 2: PICK 5 (LOCKED DECAY LOGIC)
    function generateP5Locked(baseDraw, fireball) {
        let panels = [];
        for (let i = 0; i < 10; i++) {
            let panel = [
                Math.abs((baseDraw[0] + i) % 10),
                Math.abs((baseDraw[1] + (i * 2)) % 10),
                Math.abs((baseDraw[2] - i + 10) % 10),
                Math.abs((baseDraw[3] + 1) % 10),
                Math.abs((fireball + i) % 10) // Ghost parameter injection
            ];
            panels.push(panel);
        }
        return panels;
    }
    
    const pick5PanelsArray = generateP5Locked(p5BaseDraw, latestP5.fireball);
        // 4. ENGINE 1: FANTASY 5 (APEX COMBINATORIAL WHEEL & JOHN WICK)
    function generateF5Apex(baseDraw) {
        const seedSum = baseDraw.reduce((a, b) => a + b, 0);
        let drum = Array.from({length: 36}, (_, i) => i + 1);
        
        // KDD Seed Variance Shuffle
        for(let i = drum.length - 1; i > 0; i--) {
            let j = (seedSum * (i + 1)) % (i + 1);
            [drum[i], drum[j]] = [drum[j], drum[i]];
        }

        // Apex Pool: 12 optimized target numbers
        const apexPool = drum.slice(0, 12);
        // John Wick: 5 completely decoupled cold-zone numbers
        const johnWick = drum.slice(25, 30).sort((a,b) => a - b); 

        // Mathematical Covering Design (Ensures cascading overlaps if 3+ hit the pool)
        const wheelIndices = [
            [0,1,2,3,4], [0,5,6,7,8], [1,2,9,10,11],
            [3,4,5,9,10], [6,7,8,11,0], [1,3,6,9,11],
            [2,4,7,10,0], [5,8,1,4,11], [2,5,7,9,0]
        ];

        let panels = [];
        wheelIndices.forEach(indices => {
            let p = indices.map(idx => apexPool[idx]).sort((a, b) => a - b);
            panels.push(p);
        });
        
        panels.push(johnWick); // Panel J is strictly John Wick
        return { panels, seedSum };
    }

    const f5EngineData = generateF5Apex(f5BaseDraw);
        // 5. JSON PAYLOAD COMPILATION
    const panelNames = ["Panel_A", "Panel_B", "Panel_C", "Panel_D", "Panel_E", "Panel_F", "Panel_G", "Panel_H", "Panel_I", "Panel_J"];
    
    const pick5Panels = {};
    pick5PanelsArray.forEach((p, index) => pick5Panels[panelNames[index]] = p);
    
    const fantasy5Panels = {};
    f5EngineData.panels.forEach((p, index) => fantasy5Panels[panelNames[index]] = p);

    const payload = {
        cycle_id: `HASH-${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
        portfolios: {
            PICK_5: {
                panels: pick5Panels,
                miner_rationale: "Locked mechanical decay. Isolated tumblers with explicit Ghost Parameter injection.",
                target_objective: "120_WAY_BOX_MAXIMIZATION",
                action_requirement: "PLAYSTYLE: BOX. FIREBALL: YES."
            },
            FANTASY_5: {
                panels: fantasy5Panels,
                miner_rationale: "Panels A-I form a 12-number Combinatorial Apex Wheel. Panel J is the decoupled John Wick cold-zone sniper.",
                target_objective: "APEX_HUNT_CASCADING_MULTIPLIER",
                kdd_seed_variance: f5EngineData.seedSum
            }
        },
        daily_standup: {
            status: "PHASE_10.4_APEX_ENGAGED",
            action_item: "Database explicitly constrained to ID DESC LIMIT 1. Organic session data secured."
        },
        execution_timestamp: new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    };

    console.log(JSON.stringify(payload, null, 2));
}

executeMesh();
