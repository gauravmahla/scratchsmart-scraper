import os
import sys
import json
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool

def initialize_engine():
    db_url = os.getenv("DATABASE_URL")
    if "sslmode=" not in db_url: db_url += "&sslmode=require" if "?" in db_url else "?sslmode=require"
    return create_engine(db_url, poolclass=NullPool)

def extract_spotter_intelligence():
    engine = initialize_engine()
    
    # 1. Extract Deep Time Data
    f5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.f5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    p5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.p5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    
    # 2. FANTASY 5 MINING (Cluster & Parity Weighting)
    f5_matrix = f5_df.values.astype(int)
    f5_weights = np.linspace(0.01, 1.0, len(f5_matrix)) # Aggressive exponential decay
    f5_counts = {}
    
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            if num not in {2, 3, 5, 13}: # Rulebook KDD: Purge Pari-Mutuel Fibonacci Traps
                f5_counts[num] = f5_counts.get(num, 0) + f5_weights[i]
                
    # Top 15 Hottest Numbers for Gemini to construct the Anchor-Variable Locks
    f5_hot_cluster = sorted(f5_counts.keys(), key=lambda x: f5_counts[x], reverse=True)[:15]
    
    # 3. PICK 5 MINING (Strict Positional Sequence Tracking)
    p5_matrix = p5_df.values.astype(int)
    p5_weights = np.linspace(0.01, 1.0, len(p5_matrix))
    
    p5_positional_data = {}
    for col_idx in range(5):
        slot_counts = {}
        # Apply exponential momentum to each specific slot (1 through 5)
        for i, val in enumerate(p5_matrix[::-1, col_idx]):
            slot_counts[val] = slot_counts.get(val, 0) + p5_weights[i]
        
        # Get Top 3 highest probability digits for this specific slot
        top_3_for_slot = sorted(slot_counts.keys(), key=lambda x: slot_counts[x], reverse=True)[:3]
        p5_positional_data[f"Slot_{col_idx + 1}"] = [int(x) for x in top_3_for_slot]

    # Overall Top 10 for Fireball anchoring and Box coverage
    p5_overall_counts = {}
    for i, row in enumerate(p5_matrix[::-1]):
        for digit in row:
            p5_overall_counts[digit] = p5_overall_counts.get(digit, 0) + p5_weights[i]
    p5_overall_hot = sorted(p5_overall_counts.keys(), key=lambda x: p5_overall_counts[x], reverse=True)[:10]

    # 4. JSON EXPORT FOR SNIPER (Gemini)
    spotter_output = {
        "FANTASY_5_INTELLIGENCE": {
            "Hot_Cluster_Top_15": [int(x) for x in f5_hot_cluster]
        },
        "PICK_5_INTELLIGENCE": {
            "Positional_Matrix": p5_positional_data,
            "Overall_Momentum_Top_10": [int(x) for x in p5_overall_hot]
        }
    }
    
    print(json.dumps(spotter_output, indent=4))

if __name__ == "__main__":
    extract_spotter_intelligence()
    
