#!/usr/bin/env python3
"""
Aave vs Morpho recommender (baseline, rule‑based)

Inputs: single snapshot from your API combining CoinGecko-derived metrics.
Output: JSON suggestion with interpretable scores.

Philosophy
- When the market regime is risk‑off (high BTC dominance, CEX‑heavy flows), favor Aave (battle‑tested, deeper pools).
- When on‑chain activity is strong (rising DeFi TVL, high DEX share) and pegs are stable, favor Morpho (capital efficiency, vaults).
- If pegs are shaky, add a strong penalty (or you could refuse to recommend).

You can tune thresholds/weights below without touching the rest.

NOTE: This is NOT financial advice. It is a simple scoring model that encodes the above heuristics.
"""
from __future__ import annotations
import json
import math
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Dict, Any

try:
    import requests  # type: ignore
except Exception as e:
    requests = None

# -----------------
# Config / Weights
# -----------------
CONFIG = {
    # Normalization ranges (roughly 2022‑2025 regime)
    "BTC_DOM_LOW": 40.0,     # % — below this considered very risk‑on
    "BTC_DOM_HIGH": 60.0,    # % — above this considered very risk‑off

    # TVL health bounds (USD)
    "TVL_MIN": 80e9,         # 80B ~ stressed
    "TVL_MAX": 250e9,        # 250B ~ very healthy

    # DEX share bounds (fraction of total spot vol)
    "DEX_SHARE_MIN": 0.02,   # 2% ~ CEX‑dominated
    "DEX_SHARE_MAX": 0.20,   # 20% ~ strong on‑chain activity

    # Stablecoin peg tolerance
    "MAX_PEG_DEV": 0.005,    # 50 bps — beyond this treated as unstable

    # Scoring weights (sum within each model not required)
    "W_ACTIVITY": 0.45,
    "W_PEG": 0.35,
    "W_RISKOFF": 0.45,
    "W_INVERSE": 0.20,       # encourages the opposite signal where relevant

    # Small baseline bias toward Aave for conservatism
    "AAVE_SAFETY_BIAS": 0.05,

    # Decision threshold for calling it a tie
    "MARGIN": 0.08,
}

# ---------------
# Utils
# ---------------

def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def norm_linear(x: float, lo: float, hi: float) -> float:
    if hi == lo:
        return 0.5
    return clamp((x - lo) / (hi - lo), 0.0, 1.0)


@dataclass
class Regime:
    risk_off: float
    onchain_activity: float
    peg_stability: float


@dataclass
class Scores:
    aave: float
    morpho: float


# ---------------
# Core model
# ---------------

def compute_regime(snapshot: Dict[str, Any]) -> Regime:
    # BTC dominance → risk_off (0..1)
    btc_dom = float(snapshot["btc_dominance"]["value"])  # %
    risk_off = norm_linear(btc_dom, CONFIG["BTC_DOM_LOW"], CONFIG["BTC_DOM_HIGH"])

    # On‑chain activity: TVL health + DEX share
    tvl = float(snapshot["defi_tvl"]["value"])  # USD
    tvl_health = norm_linear(tvl, CONFIG["TVL_MIN"], CONFIG["TVL_MAX"])  # 0..1

    vols = snapshot["volumes"]
    cex = float(vols["cex_24h_btc"]) or 0.0
    dex = float(vols["dex_24h_btc"]) or 0.0
    total = cex + dex
    dex_share = (dex / total) if total > 0 else 0.0
    dex_health = norm_linear(dex_share, CONFIG["DEX_SHARE_MIN"], CONFIG["DEX_SHARE_MAX"])  # 0..1

    # Blend — give TVL a bit more weight than DEX share
    onchain_activity = 0.6 * tvl_health + 0.4 * dex_health

    # Peg stability (1 is perfect); penalize using the max deviation among USDT/USDC
    usdt_dev = abs(float(snapshot["stablecoins"]["usdt"]["deviation"].strip("%"))) / 100.0
    usdc_dev = abs(float(snapshot["stablecoins"]["usdc"]["deviation"].strip("%"))) / 100.0
    worst_dev = max(usdt_dev, usdc_dev)
    peg_stability = 1.0 - clamp(worst_dev / CONFIG["MAX_PEG_DEV"], 0.0, 1.0)

    return Regime(risk_off=risk_off, onchain_activity=onchain_activity, peg_stability=peg_stability)


def score_protocols(regime: Regime) -> Scores:
    W = CONFIG
    # Morpho prefers activity + stability + risk‑on
    morpho = (
        W["W_ACTIVITY"] * regime.onchain_activity
        + W["W_PEG"] * regime.peg_stability
        + W["W_INVERSE"] * (1.0 - regime.risk_off)
    )

    # Aave prefers risk‑off + stability + quieter chains, plus safety bias
    aave = (
        W["W_RISKOFF"] * regime.risk_off
        + W["W_PEG"] * regime.peg_stability
        + W["W_INVERSE"] * (1.0 - regime.onchain_activity)
        + W["AAVE_SAFETY_BIAS"]
    )

    return Scores(aave=aave, morpho=morpho)


def recommend(scores: Scores) -> Dict[str, Any]:
    diff = scores.aave - scores.morpho
    margin = CONFIG["MARGIN"]
    if abs(diff) < margin:
        suggestion = "TIE"
    elif diff > 0:
        suggestion = "AAVE"
    else:
        suggestion = "MORPHO"

    # Confidence heuristic: scaled absolute margin clipped to 1
    confidence = clamp(abs(diff) / (margin * 2.0), 0.0, 1.0)

    return {
        "suggestion": suggestion,
        "confidence": round(confidence, 3),
        "scores": {"aave": round(scores.aave, 3), "morpho": round(scores.morpho, 3)},
    }


# ---------------
# I/O layer
# ---------------

def explain(regime: Regime, snapshot: Dict[str, Any]) -> Dict[str, Any]:
    vols = snapshot["volumes"]
    cex = float(vols["cex_24h_btc"]) or 0.0
    dex = float(vols["dex_24h_btc"]) or 0.0
    total = cex + dex
    dex_share = (dex / total) if total > 0 else 0.0
    tvl = float(snapshot["defi_tvl"]["value"])  # USD

    return {
        "btc_dominance_pct": round(float(snapshot["btc_dominance"]["value"]), 3),
        "defi_tvl_usd": round(tvl, 2),
        "dex_share": round(dex_share, 4),
        "peg_worst_dev_bps": round((1 - regime.peg_stability) * CONFIG["MAX_PEG_DEV"] * 10000, 2),
        "regime": {
            "risk_off": round(regime.risk_off, 3),
            "onchain_activity": round(regime.onchain_activity, 3),
            "peg_stability": round(regime.peg_stability, 3),
        },
    }


def fetch_snapshot(url: str) -> Dict[str, Any]:
    if requests is None:
        raise RuntimeError("The 'requests' package is required to fetch the API. Install it with: pip install requests")
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    payload = r.json()
    if not payload.get("success"):
        raise RuntimeError("API returned success=false")
    return payload["data"]


def run(url: str) -> Dict[str, Any]:
    data = fetch_snapshot(url)
    regime = compute_regime(data)
    scores = score_protocols(regime)
    reco = recommend(scores)

    out = {
        **reco,
        **explain(regime, data),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source_api": url,
        "input_timestamp": data.get("timestamp"),
    }
    return out


if __name__ == "__main__":
    url = os.environ.get("METRICS_API", None)
    if len(sys.argv) > 1:
        url = sys.argv[1]
    if not url:
        print("Usage: python aave_morpho_recommender.py <your_api_url>\n or METRICS_API=https://... python aave_morpho_recommender.py", file=sys.stderr)
        sys.exit(2)

    try:
        result = run(url)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
