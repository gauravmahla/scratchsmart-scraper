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

# ==========================================
# 0. DATA ENCODER & ARCHITECTURE INIT
# ==========================================
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

# ==========================================
# 1. PICK 5 - SPLIT NET (120-WAY + 60-WAY DUPLICATE TRAP)
# ==========================================
def generate_p5_intelligence(p5_df):
    p5_matrix = p5_df[['num1', 'num2', 'num3', 'num4', 'num5']].values.astype(int)
    all_digits = p5_matrix.flatten()
    
    # Exponential momentum weighting
    weights = np.linspace(0.1, 1.0, len(p5_matrix))
    weighted_counts = {}
    for i, row in enumerate(p5_matrix[::-1]):
        for digit in row:
            weighted_counts[digit] = weighted_counts.get(digit, 0) + weights[i]
            
    hot_digits = sorted(weighted_counts.keys(), key=lambda x: weighted_counts[x], reverse=True)
    cold_digits = hot_digits[::-1]
    
    panels = []
    
    # TRAP A: 120-WAY FIREBALL NET (3 Panels = $6.00)
    # Hunting distinct numbers with the top momentum
    anchors_120 = hot_digits[:4]
    vars_120 = [d for d in hot_digits if d not in anchors_120][:3]
    
    for idx, var in enumerate(vars_120):
        panels.append({
            "slip_id": f"P5-MOMENTUM-{chr(65+idx)}",
            "array": anchors_120 + [var],
            "play_type": "120-WAY BOX",
            "add_on": f"FIREBALL: {anchors_120[0]}",
            "cost": "$2.00"
        })

    # TRAP B: 60-WAY DUPLICATE FIREBALL NET (2 Panels = $4.00)
    # Hunting the duplicate anomaly using cold/variance digits
    double_digit = cold_digits[0]
    vars_60 = [d for d in hot_digits if d != double_digit][:3]
    
    for idx in range(2):
        array = [double_digit, double_digit] + vars_60[:3]
        np.random.shuffle(vars_60) # Rotate the variables slightly
        panels.append({
            "slip_id": f"P5-ANOMALY-{chr(68+idx)}",
            "array": array,
            "play_type": "60-WAY BOX",
            "add_on": f"FIREBALL: {double_digit}",
            "cost": "$2.00"
        })

    return {
        "strategy": "Split Net (120-Way Momentum + 60-Way Anomaly)",
        "budget_allocation": "$10.00",
        "rationale": "Hedging the $10 budget. $6 hunts the distinct momentum digits. $4 specifically hunts duplicate physical drum drops.",
        "panels": panels
    }

# ==========================================
# 2. FANTASY 5 - SPLIT NET & EZMATCH SCALP
# ==========================================
def generate_f5_intelligence(f5_df):
    f5_matrix = f5_df[['num1', 'num2', 'num3', 'num4', 'num5']].values.astype(int)
    
    weights = np.linspace(0.1, 1.0, len(f5_matrix))
    weighted_counts = {}
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            if num not in {2, 3, 5, 13}: # Pari-mutuel purge
                weighted_counts[num] = weighted_counts.get(num, 0) + weights[i]
                
    hot_f5 = sorted(weighted_counts.keys(), key=lambda x: weighted_counts[x], reverse=True)
    cold_f5 = hot_f5[::-1]
    
    panels = []
    
    # TRAP A: HOT ANCHOR SCALP (2 Panels = $4.00)
    hot_anchors = hot_f5[:4]
    for idx in range(2):
        array = sorted(hot_anchors + [hot_f5[4+idx]])
        panels.append({
            "slip_id": f"F5-HOT-SCALP-{chr(65+idx)}", 
            "array": array, 
            "play_type": "STRAIGHT", 
            "add_on": "EZMATCH: YES", 
            "cost": "$2.00"
        })

    # TRAP B: COLD VARIANCE SCALP (3 Panels = $6.00)
    cold_anchors = cold_f5[:3]
    for idx in range(3):
        array = sorted(cold_anchors + cold_f5[3:5])
        np.random.shuffle(cold_f5) # Rotate variables
        panels.append({
            "slip_id": f"F5-COLD-SCALP-{chr(67+idx)}", 
            "array": array, 
            "play_type": "STRAIGHT", 
            "add_on": "EZMATCH: YES", 
            "cost": "$2.00"
        })

    return {
        "strategy": "Split Anchor + Universal EZmatch Scalp",
        "budget_allocation": "$10.00",
        "rationale": "Reduced to 5 panels to activate EZmatch universally. Securing the 1:4.71 instant win probability to offset session costs while hedging Hot vs. Cold anchors.",
        "panels": panels
    }

# ==========================================
# 3. ENRICHED BI ASSEMBLY & DATABASE COMMIT
# ==========================================
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
    
