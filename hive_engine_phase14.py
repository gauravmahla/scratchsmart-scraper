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
    
    f5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.f5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    p5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.p5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    
    # FANTASY 5: TOP-6 COMPRESSION
    f5_matrix = f5_df.values.astype(int)
    f5_weights = np.linspace(0.01, 1.0, len(f5_matrix))
    f5_counts = {}
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            f5_counts[num] = f5_counts.get(num, 0) + f5_weights[i]
                
    f5_top_6 = sorted(f5_counts.keys(), key=lambda x: f5_counts[x], reverse=True)[:6]
    f5_ranked_pool = {"A": int(f5_top_6[0]), "B": int(f5_top_6[1]), "C": int(f5_top_6[2]), "D": int(f5_top_6[3]), "E": int(f5_top_6[4]), "F": int(f5_top_6[5])}

    # PICK 5: CANONICAL SIGNATURE & EXACT SLOTS
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

    spotter_output = {
        "FANTASY_5_RAW": {"Ranked_Pool_Top_6": f5_ranked_pool},
        "PICK_5_RAW": {"Canonical_Signature": [int(x) for x in canonical_signature], "Exact_Order_Slot_Prediction": p5_positional_data}
    }
    
    # PRINT TO CONSOLE - NO SQL INSERT
    print("=== BEGIN PAYLOAD ===")
    print(json.dumps(spotter_output, indent=4))
    print("=== END PAYLOAD ===")

if __name__ == "__main__":
    extract_spotter_intelligence()
    
