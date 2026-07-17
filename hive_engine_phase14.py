import os
import json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.pool import NullPool

def initialize_engine():
    db_url = os.getenv("DATABASE_URL")
    if "sslmode=" not in db_url: db_url += "&sslmode=require" if "?" in db_url else "?sslmode=require"
    return create_engine(db_url, poolclass=NullPool)

def extract_spotter_intelligence():
    engine = initialize_engine()
    
    # 1. EXTRACT DEEP TIME DATA
    f5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.f5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    p5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.p5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    
    # ==========================================
    # FANTASY 5: TOP-6 COMPRESSION GATE
    # ==========================================
    f5_matrix = f5_df.values.astype(int)
    f5_weights = np.linspace(0.01, 1.0, len(f5_matrix)) # Aggressive exponential decay
    f5_counts = {}
    
    # Zero hardcoded exclusions. Pure mathematical extraction.
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            f5_counts[num] = f5_counts.get(num, 0) + f5_weights[i]
                
    # Strict Top-6 ranking for the Double Wheel Cascade
    f5_top_6 = sorted(f5_counts.keys(), key=lambda x: f5_counts[x], reverse=True)[:6]
    
    f5_ranked_pool = {
        "A": int(f5_top_6[0]), "B": int(f5_top_6[1]), "C": int(f5_top_6[2]),
        "D": int(f5_top_6[3]), "E": int(f5_top_6[4]), "F": int(f5_top_6[5])
    }

    # ==========================================
    # PICK 5: CANONICAL SIGNATURE & EXACT SLOTS
    # ==========================================
    p5_matrix = p5_df.values.astype(int)
    p5_weights = np.linspace(0.01, 1.0, len(p5_matrix))
    
    # Slot-Specific Momentum (For Straight/Box Permutation Planner)
    p5_positional_data = {}
    for col_idx in range(5):
        slot_counts = {}
        for i, val in enumerate(p5_matrix[::-1, col_idx]):
            slot_counts[val] = slot_counts.get(val, 0) + p5_weights[i]
        top_3_for_slot = sorted(slot_counts.keys(), key=lambda x: slot_counts[x], reverse=True)[:3]
        p5_positional_data[f"Slot_{col_idx + 1}"] = [int(x) for x in top_3_for_slot]

    # Overall Canonical Signature (Top 5 Overall Momentum Digits)
    p5_overall_counts = {}
    for i, row in enumerate(p5_matrix[::-1]):
        for digit in row:
            p5_overall_counts[digit] = p5_overall_counts.get(digit, 0) + p5_weights[i]
    
    canonical_signature = sorted(p5_overall_counts.keys(), key=lambda x: p5_overall_counts[x], reverse=True)[:5]

    # ==========================================
    # BUILD AND PUSH JSON PAYLOAD TO SUPABASE
    # ==========================================
    spotter_output = {
        "SESSION_METADATA": {
            "strategy_protocol": "TWO-BODY PROBLEM DECOUPLED ENGINE",
            "f5_target_architecture": "Double Complete 5-of-6 Wheel (12 Panels)",
            "p5_target_architecture": "Double-Layer Stack (Straight/Box + Fireball) (10 Panels)"
        },
        "FANTASY_5_RAW": {
            "Ranked_Pool_Top_6": f5_ranked_pool
        },
        "PICK_5_RAW": {
            "Canonical_Signature": [int(x) for x in canonical_signature],
            "Exact_Order_Slot_Prediction": p5_positional_data
        }
    }
    
    json_payload = json.dumps(spotter_output)
    
    with engine.begin() as conn:
        insert_query = text("""
            INSERT INTO public.daily_mesh_state (apex_predator_blueprint)
            VALUES (:payload)
        """)
        conn.execute(insert_query, {"payload": json_payload})
        
    print("SPOTTER INTELLIGENCE SUCCESSFULLY MINED AND PUSHED TO SUPABASE.")
    print(json.dumps(spotter_output, indent=4))

if __name__ == "__main__":
    extract_spotter_intelligence()
    
