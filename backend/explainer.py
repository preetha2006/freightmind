import shap
import pandas as pd
import numpy as np
import joblib
import os
from model import load_model, FEATURES

def get_shap_explanation(
    carrier_row: dict,
    distance_km: float,
    weight_kg: float,
    bid_price: float,
    market_rate: float,
    priority: str,
    vehicle_type: str,
) -> list:
    """
    Returns SHAP-based explanation for a carrier's predicted score.
    Output: list of {feature, value, impact, direction} dicts sorted by |impact|.
    """
    model, encoders = load_model()

    price_ratio = bid_price / max(market_rate, 1)

    def safe_encode(enc, val):
        classes = list(enc.classes_)
        if val not in classes:
            val = classes[0]
        return enc.transform([val])[0]

    input_df = pd.DataFrame([{
        "on_time_rate_pct":     carrier_row.get("on_time_rate_pct", 85),
        "damage_rate_pct":      carrier_row.get("damage_rate_pct", 2.0),
        "avg_delay_days":       carrier_row.get("avg_delay_days", 5.0),
        "service_score_10":     carrier_row.get("service_score_10", 7.5),
        "fleet_size":           carrier_row.get("fleet_size", 200),
        "active_lanes":         carrier_row.get("active_lanes", 30),
        "distance_km":          distance_km,
        "weight_kg":            weight_kg,
        "price_ratio":          price_ratio,
        "priority_encoded":     safe_encode(encoders["priority"], priority),
        "vehicle_encoded":      safe_encode(encoders["vehicle_type"], vehicle_type),
        "carrier_type_encoded": safe_encode(encoders["type"], carrier_row.get("type", "Standard")),
    }])

    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(input_df)

    # Human-readable feature labels
    labels = {
        "on_time_rate_pct":     "On-Time Delivery Rate",
        "damage_rate_pct":      "Damage Rate",
        "avg_delay_days":       "Average Delay (Days)",
        "service_score_10":     "Service Quality Score",
        "fleet_size":           "Fleet Size",
        "active_lanes":         "Active Lanes Coverage",
        "distance_km":          "Shipment Distance",
        "weight_kg":            "Shipment Weight",
        "price_ratio":          "Price vs Market Rate",
        "priority_encoded":     "Shipment Priority",
        "vehicle_encoded":      "Vehicle Type",
        "carrier_type_encoded": "Carrier Type",
    }

    result = []
    for feat, val, shap_val in zip(FEATURES, input_df.iloc[0], shap_values[0]):
        result.append({
            "feature":    feat,
            "label":      labels.get(feat, feat),
            "value":      round(float(val), 3),
            "impact":     round(float(shap_val), 3),
            "direction":  "positive" if shap_val > 0 else "negative",
        })

    result.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return result

def get_simple_explanation(carrier_row: dict, score: float) -> list:
    """
    Fallback rule-based explanation when SHAP is unavailable.
    Returns plain-English factor breakdown.
    """
    explanations = []

    on_time = carrier_row.get("on_time_rate_pct", 85)
    if on_time >= 90:
        explanations.append({"label": "On-Time Delivery Rate", "value": f"{on_time}%", "impact": "positive", "note": "Excellent reliability"})
    elif on_time >= 80:
        explanations.append({"label": "On-Time Delivery Rate", "value": f"{on_time}%", "impact": "neutral",  "note": "Good reliability"})
    else:
        explanations.append({"label": "On-Time Delivery Rate", "value": f"{on_time}%", "impact": "negative", "note": "Below average reliability"})

    damage = carrier_row.get("damage_rate_pct", 2.0)
    if damage <= 1.5:
        explanations.append({"label": "Damage Rate",           "value": f"{damage}%",  "impact": "positive", "note": "Very low cargo damage"})
    elif damage <= 2.5:
        explanations.append({"label": "Damage Rate",           "value": f"{damage}%",  "impact": "neutral",  "note": "Average damage rate"})
    else:
        explanations.append({"label": "Damage Rate",           "value": f"{damage}%",  "impact": "negative", "note": "High damage risk"})

    service = carrier_row.get("service_score_10", 7.5)
    if service >= 8.5:
        explanations.append({"label": "Service Quality",       "value": f"{service}/10", "impact": "positive", "note": "Top-tier service"})
    elif service >= 7.0:
        explanations.append({"label": "Service Quality",       "value": f"{service}/10", "impact": "neutral",  "note": "Satisfactory service"})
    else:
        explanations.append({"label": "Service Quality",       "value": f"{service}/10", "impact": "negative", "note": "Below standard service"})

    delay = carrier_row.get("avg_delay_days", 5.0)
    if delay <= 4:
        explanations.append({"label": "Average Delay",         "value": f"{delay} days", "impact": "positive", "note": "Minimal delays"})
    elif delay <= 6:
        explanations.append({"label": "Average Delay",         "value": f"{delay} days", "impact": "neutral",  "note": "Moderate delays"})
    else:
        explanations.append({"label": "Average Delay",         "value": f"{delay} days", "impact": "negative", "note": "Frequent delays"})

    return explanations