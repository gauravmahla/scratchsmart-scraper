import json
import numpy as np
import pandas as pd
import os
from sqlalchemy import create_engine
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
    # FANTASY 5: BALANCED 6-NUMBER COMPRESSION
    # ==========================================
    f5_matrix = f5_df.values.astype(int)
    weights = np.linspace(0.01, 1.0, len(f5_matrix)) 
    f5_scores = {i: 0 for i in range(1, 37)}
    
    # Calculate Momentum (All 36 Numbers)
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            f5_scores[num] += weights[i]
                
    # Sort by momentum
    sorted_f5 = sorted(f5_scores.keys(), key=lambda x: f5_scores[x], reverse=True)
    
    # The Hedge: 4 Hot (Quant Miner) + 2 Deep Cold (Contrarian Miner)
    hot_4 = sorted_f5[:4]
    cold_2 = sorted_f5[-2:]
    f5_pool = hot_4 + cold_2
    
    # Confidence Gate Logic: If variance between top and bottom is low, flag as NO_PLAY
    spread = f5_scores[sorted_f5[0]] - f5_scores[sorted_f5[-1]]
    confidence_decision = "PLAY_EXPERIMENTAL" if spread > 10 else "NO_PLAY_HIGH_ENTROPY"

    f5_ranked_pool = {
        "A": int(f5_pool[0]), "B": int(f5_pool[1]), "C": int(f5_pool[2]),
        "D": int(f5_pool[3]), "E": int(f5_pool[4]), "F": int(f5_pool[5])
    }

    # ==========================================
    # PICK 5: CANONICAL SIGNATURE & EXACT SLOTS
    # ==========================================
    p5_matrix = p5_df.values.astype(int)
    p5_weights = np.linspace(0.01, 1.0, len(p5_matrix))
    
    p5_positional_data = {}
    for col_idx in range(5):
        slot_counts = {}
        for i, val in enumerate(p5_matrix[::-1, col_idx]):
            slot_counts[val] = slot_counts.get(val, 0) + p5_weights[i]
        top_3_for_slot = sorted(slot_counts.keys(), key=lambda x: slot_counts[x], reverse=True)[:3]
        p5_positional_data[f"Slot_{col_idx + 1}"] = [int(x) for x in top_3_for_slot]

    p5_overall_counts = {}
    for i, row in enumerate(p5_matrix[::-1]):
        for digit in row:
            p5_overall_counts[digit] = p5_overall_counts.get(digit, 0) + p5_weights[i]
    
    canonical_signature = sorted(p5_overall_counts.keys(), key=lambda x: p5_overall_counts[x], reverse=True)[:5]

    # ==========================================
    # BUILD AND PRINT JSON PAYLOAD
    # ==========================================
    spotter_output = {
        "SESSION_METADATA": {
            "strategy_protocol": "MULTI-MINER HEDGED ECOSYSTEM",
            "decision_gate": confidence_decision,
            "target_draw": "July 17 EVENING",
            "f5_target_architecture": "Double Complete 5-of-6 Wheel (12 Panels)",
            "p5_target_architecture": "Double-Layer Stack (Straight/Box + Fireball) (10 Panels)"
        },
        "FANTASY_5_RAW": {
            "Ranked_Pool_Top_6": f5_ranked_pool,
            "Pool_Logic": "4 Quant (Hot) + 2 Contrarian (Deep Cold)"
        },
        "PICK_5_RAW": {
            "Canonical_Signature": [int(x) for x in canonical_signature],
            "Exact_Order_Slot_Prediction": p5_positional_data
        }
    }
    
    print("=== BEGIN PAYLOAD ===")
    print(json.dumps(spotter_output, indent=4))
    print("=== END PAYLOAD ===")

if __name__ == "__main__":
    extract_spotter_intelligence()
    
