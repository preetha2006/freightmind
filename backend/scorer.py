import pandas as pd
import numpy as np

# ─── Weights for scoring formula ──────────────────────────────────────────────
WEIGHTS = {
    "on_time_rate":   0.35,
    "damage_rate":    0.20,
    "service_score":  0.20,
    "price_score":    0.15,
    "delay_score":    0.10,
}

def compute_price_score(bid_price: float, market_rate: float) -> float:
    """Score based on how competitive the bid is vs market rate."""
    if market_rate <= 0:
        return 50.0
    ratio = bid_price / market_rate
    if ratio <= 0.85:   return 100.0
    elif ratio <= 0.95: return 90.0
    elif ratio <= 1.05: return 75.0
    elif ratio <= 1.15: return 60.0
    elif ratio <= 1.25: return 45.0
    else:               return 30.0

def compute_negotiation_signal(bid_price: float, market_rate: float) -> dict:
    """Return negotiation advice based on bid vs market."""
    if market_rate <= 0:
        return {"signal": False, "message": "Market rate unavailable", "savings_inr": 0}
    ratio = bid_price / market_rate
    overprice_pct = round((ratio - 1) * 100, 1)
    savings = round(bid_price - market_rate, 2)
    if ratio > 1.15:
        return {
            "signal": True,
            "message": f"Bid is {overprice_pct}% above market rate. Negotiate down.",
            "savings_inr": savings,
            "recommended_target_inr": round(market_rate * 1.05, 2),
        }
    elif ratio > 1.05:
        return {
            "signal": True,
            "message": f"Bid is slightly above market ({overprice_pct}%). Minor negotiation possible.",
            "savings_inr": savings,
            "recommended_target_inr": round(market_rate * 1.02, 2),
        }
    else:
        return {
            "signal": False,
            "message": "Bid is competitive. No negotiation needed.",
            "savings_inr": 0,
            "recommended_target_inr": bid_price,
        }

def score_carrier(carrier_row: dict, bid_price: float, market_rate: float) -> dict:
    """
    Score a single carrier using weighted multi-factor scoring.
    Returns score (0-100), risk level, and factor breakdown.
    """
    on_time   = float(carrier_row.get("on_time_rate_pct", 85))
    damage    = float(carrier_row.get("damage_rate_pct", 2.0))
    service   = float(carrier_row.get("service_score_10", 7.5))
    avg_delay = float(carrier_row.get("avg_delay_days", 5.0))

    # Normalize each factor to 0–100
    on_time_score  = on_time                             # already %
    damage_score   = max(0, 100 - (damage * 15))         # lower damage = higher score
    service_norm   = (service / 10) * 100                # 0-10 → 0-100
    delay_score    = max(0, 100 - (avg_delay * 8))       # lower delay = higher score
    price_score    = compute_price_score(bid_price, market_rate)

    # Weighted composite
    composite = round(
        on_time_score * WEIGHTS["on_time_rate"] +
        damage_score  * WEIGHTS["damage_rate"]  +
        service_norm  * WEIGHTS["service_score"] +
        price_score   * WEIGHTS["price_score"]  +
        delay_score   * WEIGHTS["delay_score"],
        1
    )
    composite = min(100.0, max(0.0, composite))

    risk = "Low" if composite >= 80 else ("Medium" if composite >= 60 else "High")

    return {
        "composite_score":   composite,
        "risk_level":        risk,
        "factor_breakdown": {
            "on_time_score":  round(on_time_score, 1),
            "damage_score":   round(damage_score, 1),
            "service_score":  round(service_norm, 1),
            "price_score":    round(price_score, 1),
            "delay_score":    round(delay_score, 1),
        }
    }

def rank_carriers(carriers_df: pd.DataFrame, bid_prices: dict, market_rate: float) -> list:
    """
    Rank all carriers for a given shipment request.
    bid_prices: {carrier_id: price}
    Returns sorted list of carrier dicts with scores.
    """
    results = []
    for _, row in carriers_df.iterrows():
        cid       = row["carrier_id"]
        bid_price = bid_prices.get(cid, row["avg_price_per_km_inr"] * market_rate / 1000)
        scored    = score_carrier(row.to_dict(), bid_price, market_rate)
        neg       = compute_negotiation_signal(bid_price, market_rate)

        results.append({
            "carrier_id":          cid,
            "carrier_name":        row["carrier_name"],
            "carrier_type":        row["type"],
            "hq":                  row["hq"],
            "bid_price_inr":       round(bid_price, 2),
            "market_rate_inr":     round(market_rate, 2),
            "composite_score":     scored["composite_score"],
            "risk_level":          scored["risk_level"],
            "on_time_rate_pct":    row["on_time_rate_pct"],
            "damage_rate_pct":     row["damage_rate_pct"],
            "service_score_10":    row["service_score_10"],
            "avg_delay_days":      row["avg_delay_days"],
            "fleet_size":          int(row["fleet_size"]),
            "active_lanes":        int(row["active_lanes"]),
            "iso_certified":       row["iso_certified"],
            "factor_breakdown":    scored["factor_breakdown"],
            "negotiation":         neg,
        })

    results.sort(key=lambda x: x["composite_score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results

def simulate_award_split(carrier_a: dict, carrier_b: dict, split_pct: float, total_volume_inr: float) -> dict:
    """
    Simulate splitting award between two carriers.
    split_pct: % going to carrier_a (0-100)
    Returns expected cost, blended risk, and reliability.
    """
    split_a = split_pct / 100
    split_b = 1 - split_a

    blended_score = round(
        carrier_a["composite_score"] * split_a +
        carrier_b["composite_score"] * split_b, 1
    )
    blended_ontime = round(
        carrier_a["on_time_rate_pct"] * split_a +
        carrier_b["on_time_rate_pct"] * split_b, 1
    )
    expected_cost = round(
        carrier_a["bid_price_inr"] * split_a +
        carrier_b["bid_price_inr"] * split_b, 2
    )
    risk = "Low" if blended_score >= 80 else ("Medium" if blended_score >= 60 else "High")

    return {
        "carrier_a_pct":      split_pct,
        "carrier_b_pct":      round(100 - split_pct, 1),
        "blended_score":      blended_score,
        "blended_ontime_pct": blended_ontime,
        "expected_cost_inr":  expected_cost,
        "blended_risk":       risk,
        "recommendation":     _award_recommendation(carrier_a, carrier_b, split_pct),
    }

def _award_recommendation(a: dict, b: dict, split: float) -> str:
    if a["composite_score"] - b["composite_score"] > 15:
        return f"Strong recommendation to award majority to {a['carrier_name']} — significantly higher score."
    elif abs(a["composite_score"] - b["composite_score"]) <= 5:
        return f"Both carriers are closely matched. A {split:.0f}/{100-split:.0f} split balances risk well."
    else:
        return f"Moderate preference for {a['carrier_name']}. Current split looks reasonable."