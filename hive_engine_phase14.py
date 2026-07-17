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

def extract_hybrid_intelligence():
    engine = initialize_engine()
    
    # 1. EXTRACT DEEP TIME DATA
    f5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.f5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    p5_df = pd.read_sql("SELECT num1, num2, num3, num4, num5 FROM public.p5_draws ORDER BY draw_date DESC LIMIT 5000", engine)
    
    # ==========================================
    # FANTASY 5: THE WIDE-APERTURE 5-MINER NET
    # ==========================================
    f5_matrix = f5_df.values.astype(int)
    
    # Miner 1: QUANT (Long-term Hot Frequency)
    quant_weights = np.linspace(0.5, 1.0, len(f5_matrix))
    quant_scores = {i: 0 for i in range(1, 37)}
    for i, row in enumerate(f5_matrix[::-1]):
        for num in row: quant_scores[num] += quant_weights[i]
    quant_vector = sorted(quant_scores.keys(), key=lambda x: quant_scores[x], reverse=True)[:5]

    # Miner 2: CONTRARIAN (Deep Cold / Mean Reversion)
    contrarian_vector = sorted(quant_scores.keys(), key=lambda x: quant_scores[x], reverse=False)[:5]

    # Miner 3: SURFER (Extreme Short-Term Momentum - Last 14 draws)
    surfer_scores = {i: 0 for i in range(1, 37)}
    for row in f5_matrix[:14]:
        for num in row: surfer_scores[num] += 1
    surfer_vector = sorted(surfer_scores.keys(), key=lambda x: surfer_scores[x], reverse=True)[:5]

    # Miner 4: HACKER (High Entropy / Mid-Tier Variance)
    hacker_vector = sorted(quant_scores.keys(), key=lambda x: quant_scores[x], reverse=True)[10:15]

    # ==========================================
    # PICK 5: DIVERSIFIED SIGNATURES
    # ==========================================
    p5_matrix = p5_df.values.astype(int)
    p5_weights = np.linspace(0.01, 1.0, len(p5_matrix))
    
    p5_scores = {}
    for i, row in enumerate(p5_matrix[::-1]):
        for digit in row: p5_scores[digit] = p5_scores.get(digit, 0) + p5_weights[i]
        
    sorted_p5 = sorted(p5_scores.keys(), key=lambda x: p5_scores[x], reverse=True)
    
    # We now output THREE signatures to widen the Pick 5 net
    primary_sig = sorted_p5[:5]
    secondary_sig = sorted_p5[2:7]
    tertiary_sig = sorted_p5[-5:]

    # ==========================================
    # ASSEMBLE SYNTHESIS PAYLOAD
    # ==========================================
    spotter_output = {
        "SESSION_METADATA": {
            "strategy_protocol": "SYNTHESIS: WIDE-APERTURE HYBRID NET",
            "f5_target_architecture": "10-Panel Multi-Miner Portfolio",
            "p5_target_architecture": "Multi-Signature Tri-Layer (15 Panels)"
        },
        "FANTASY_5_RAW": {
            "Quant_Vector": [int(x) for x in quant_vector],
            "Contrarian_Vector": [int(x) for x in contrarian_vector],
            "Surfer_Vector": [int(x) for x in surfer_vector],
            "Hacker_Vector": [int(x) for x in hacker_vector]
        },
        "PICK_5_RAW": {
            "Primary_Signature_Hot": [int(x) for x in primary_sig],
            "Secondary_Signature_Blend": [int(x) for x in secondary_sig],
            "Tertiary_Signature_Cold": [int(x) for x in tertiary_sig]
        }
    }
    
    print("=== BEGIN PAYLOAD ===")
    print(json.dumps(spotter_output, indent=4))
    print("=== END PAYLOAD ===")

if __name__ == "__main__":
    extract_hybrid_intelligence()
    
