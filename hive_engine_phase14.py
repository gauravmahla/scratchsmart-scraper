import os
import sys
import json
import itertools
import numpy as np
import pandas as pd
from datetime import datetime
from zoneinfo import ZoneInfo
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

class DataMeshJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64, np.int32)): return int(obj)
        elif isinstance(obj, (np.floating, np.float64, np.float32)): return float(obj)
        elif isinstance(obj, (np.ndarray, list, tuple, set)): return [self.default(v) for v in obj]
        return super().default(obj)

def initialize_engine():
    print("[SYSTEM] Booting Phase 14 Call-of-Duty Apex Architecture...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("❌ [CRITICAL]: DATABASE_URL missing.", file=sys.stderr)
        sys.exit(1)
    if "sslmode=" not in db_url: db_url += "&sslmode=require" if "?" in db_url else "?sslmode=require"
    return create_engine(db_url, poolclass=NullPool, client_encoding='utf8')

def extract_deep_time_data(engine):
    est_tz = ZoneInfo('US/Eastern')
    current_hour = datetime.now(est_tz).hour
    target_phase = "EVENING" if current_hour >= 14 else "MIDDAY"
    
    query = f"""
        (SELECT 'F5' as matrix_source, draw_date, num1, num2, num3, num4, num5 
         FROM public.f5_draws WHERE draw_type = '{target_phase}' ORDER BY draw_date DESC LIMIT 5000)
        UNION ALL
        (SELECT 'P5' as matrix_source, draw_date, num1, num2, num3, num4, num5 
         FROM public.p5_draws WHERE draw_type = '{target_phase}' ORDER BY draw_date DESC LIMIT 5000);
    """
    df = pd.read_sql(query, engine)
    return df[df['matrix_source'] == 'F5'].drop(columns=['matrix_source']), df[df['matrix_source'] == 'P5'].drop(columns=['matrix_source'])
    def generate_p5_intelligence(p5_df):
    p5_matrix = p5_df[['num1', 'num2', 'num3', 'num4', 'num5']].values.astype(int)
    all_digits = p5_matrix.flatten()
    unique_d, counts_d = np.unique(all_digits, return_counts=True)
    hot_digits = unique_d[np.argsort(counts_d)][::-1]
    
    # Protein Folding: Slot 1 & 5 Gravitational Pull
    slot_1_history = p5_matrix[:, 0]
    slot_5_history = p5_matrix[:, 4]
    
    # Inclusive-AND Fireball Selection
    fireball_target = int(hot_digits[0])
    
    # Array A: High Probability Strike (120-Way)
    array_a = [fireball_target]
    while len(array_a) < 5:
        nxt = int(np.random.choice(hot_digits[:7]))
        if nxt not in array_a: array_a.append(nxt)
            
    # Array B: The Inverse Phalanx (Destructive Interference)
    available_for_b = [d for d in range(10) if d not in array_a]
    fireball_b = available_for_b[0] if available_for_b else int(np.random.choice(10))
    array_b = [fireball_b]
    while len(array_b) < 5:
        nxt = int(np.random.choice(available_for_b))
        if nxt not in array_b: array_b.append(nxt)
            
    # Array C: John Wick Wildcard (Hunting Triples/Chaos)
    array_c = [int(np.random.choice(hot_digits[-5:])) for _ in range(5)]

    return {
        "strategy": "Dual Inverse Phalanx + Protein Folding Wildcard",
        "budget_allocation": "$10.00",
        "rationale": "Forcing 120-way MECE distinct digits to maximize Fireball combination creation while locking out the $7M liability herd cap.",
        "panels": [
            {"slip_id": "P5-A (Phalanx 1)", "array": array_a, "play_type": "120-WAY BOX", "add_on": f"FIREBALL: {fireball_target} (INCLUSIVE-AND)", "cost": "$4.00"},
            {"slip_id": "P5-B (Phalanx 2)", "array": array_b, "play_type": "120-WAY BOX", "add_on": f"FIREBALL: {fireball_b} (INCLUSIVE-AND)", "cost": "$4.00"},
            {"slip_id": "P5-C (John Wick)", "array": array_c, "play_type": "STRAIGHT/BOX", "add_on": "FIREBALL: YES", "cost": "$2.00"}
        ]
    }
    def generate_f5_intelligence(f5_df):
    f5_matrix = f5_df[['num1', 'num2', 'num3', 'num4', 'num5']].values.astype(int)
    flat_f5 = f5_matrix.flatten()
    unique_f5, counts_f5 = np.unique(flat_f5, return_counts=True)
    sorted_f5 = unique_f5[np.argsort(counts_f5)][::-1]
    
    # Purge Pari-Mutuel Traps
    valid_f5 = [x for x in sorted_f5 if x not in {2, 3, 5, 13}]
    
    # CRISPR DNA Core (Top 6 absolute highest confidence for the RNA Wheel)
    dna_core = valid_f5[:6]
    lru_pool = valid_f5[-15:] # Cold stack for John Wick
    
    panels = []
    
    # The RNA Combinatorial Wheel (6 Panels = $6.00)
    wheel_combos = list(itertools.combinations(dna_core, 5))
    for idx, combo in enumerate(wheel_combos):
        panels.append({
            "slip_id": f"F5-WHEEL-{chr(65+idx)}", 
            "array": sorted(list(combo)), 
            "play_type": "STRAIGHT", 
            "add_on": "EZMATCH: NO", 
            "cost": "$1.00"
        })
        
    # John Wick Cold Anomaly Snipers (4 Panels = $4.00)
    for idx in range(4):
        jw_array = []
        while len(jw_array) < 5:
            nxt = int(np.random.choice(lru_pool))
            if nxt not in jw_array: jw_array.append(nxt)
        panels.append({
            "slip_id": f"F5-JUNK-DNA-{chr(71+idx)}", 
            "array": sorted(jw_array), 
            "play_type": "STRAIGHT", 
            "add_on": "EZMATCH: NO", 
            "cost": "$1.00"
        })

    return {
        "strategy": "RNA Cascading Wheel + CRISPR Splicing",
        "budget_allocation": "$10.00",
        "rationale": "Leveraging a 6-digit DNA core. If 5/6 hit, generates 1x Top Prize and 5x 4-of-5 ($555) Pari-Mutuel cascades.",
        "panels": panels
    }
    def seal_and_commit(engine, p5_intel, f5_intel):
    est_tz = ZoneInfo('US/Eastern')
    now = datetime.now(est_tz)
    cycle_id = f"CYC-PH14-{int(now.timestamp())}"
    
    master_ledger = {
        "mission_control": {
            "cycle_id": cycle_id,
            "execution_time_est": now.strftime("%Y-%m-%d %H:%M:%S"),
            "system_health": "APEX PREDATOR (PHASE 14)",
            "hyperplane_verdict": "ABOVE HYPERPLANE - CASCADING MULTIPLIER SECURED"
        },
        "business_intelligence": {
            "total_session_capital": "$20.00",
            "p5_assembly_metrics": p5_intel["rationale"],
            "f5_assembly_metrics": f5_intel["rationale"],
            "destructive_interference": "ACTIVE - INVERSE PHALANX ENGAGED"
        },
        "portfolios": {
            "PICK_5": p5_intel,
            "FANTASY_5": f5_intel
        }
    }
    
    json_payload = json.dumps(master_ledger, cls=DataMeshJSONEncoder)
    
    insert_query = text("""
        INSERT INTO public.daily_mesh_state (cycle_id, created_at, state_payload)
        VALUES (:cycle_id, NOW(), CAST(:payload AS jsonb))
    """)
    
    try:
        with engine.begin() as conn:
            conn.execute(insert_query, {"cycle_id": cycle_id, "payload": json_payload})
        print(f"[SUCCESS] Phase 14 Apex Payload {cycle_id} locked to disk.")
    except Exception as e:
        print(f"❌ [DB ERROR]: {str(e)}", file=sys.stderr)
        sys.exit(1)
    finally:
        engine.dispose()

if __name__ == "__main__":
    db_engine = initialize_engine()
    f5_history, p5_history = extract_deep_time_data(db_engine)
    
    p5_payload = generate_p5_intelligence(p5_history)
    f5_payload = generate_f5_intelligence(f5_history)
    
    seal_and_commit(db_engine, p5_payload, f5_payload)
    
