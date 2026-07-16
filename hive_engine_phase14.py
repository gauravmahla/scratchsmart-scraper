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
    
    # 1. Extract Deep Time Data
    f5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.f5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    p5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.p5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    
    # 2. FANTASY 5 MINING (Rulebook Parity & Clusters)
    f5_matrix = f5_df.values.astype(int)
    f5_weights = np.linspace(0.01, 1.0, len(f5_matrix))
    f5_counts = {}
    
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row:
            if num not in {2, 3, 5, 13}: # Purging dead zones
                f5_counts[num] = f5_counts.get(num, 0) + f5_weights[i]
                
    f5_hot_cluster = sorted(f5_counts.keys(), key=lambda x: f5_counts[x], reverse=True)[:15]
    
    # 3. PICK 5 MINING (Strict Positional Sequencing for Straight Plays)
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
    p5_overall_hot = sorted(p5_overall_counts.keys(), key=lambda x: p5_overall_counts[x], reverse=True)[:10]

    # 4. BUILD THE RAW JSON PAYLOAD
    spotter_output = {
        "FANTASY_5_RAW": {
            "Hot_Cluster_Top_15": [int(x) for x in f5_hot_cluster]
        },
        "PICK_5_RAW": {
            "Exact_Order_Slot_Prediction": p5_positional_data,
            "Overall_Momentum_Top_10": [int(x) for x in p5_overall_hot]
        }
    }
    
    json_payload = json.dumps(spotter_output)
    
    # 5. PUSH TO SUPABASE (The Missing Link)
    with engine.begin() as conn:
        insert_query = text("""
            INSERT INTO public.daily_mesh_state (apex_predator_blueprint)
            VALUES (:payload)
        """)
        conn.execute(insert_query, {"payload": json_payload})
        
    print("SPOTTER INTELLIGENCE SUCCESSFULLY MINED AND PUSHED TO SUPABASE.")

if __name__ == "__main__":
    extract_spotter_intelligence()
    
