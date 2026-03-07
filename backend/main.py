from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import os

from data_generator import generate_data
from model import load_model, predict_score, get_feature_importance, train_model
from scorer import rank_carriers, simulate_award_split, compute_negotiation_signal
from explainer import get_shap_explanation, get_simple_explanation

# ─── App Setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="FreightMind API",
    description="AI-Powered Carrier Selection Agent — LogisticsNow LoRRI Hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load data & model on startup ─────────────────────────────────────────────
if not os.path.exists("data/shipments.csv"):
    generate_data()

carriers_df  = pd.read_csv("data/carriers.csv")
shipments_df = pd.read_csv("data/shipments.csv")

try:
    model, encoders = load_model()
    print("✅ Model loaded successfully")
except Exception as e:
    print(f"⚠️  Model load failed: {e} — training now...")
    model, encoders = train_model()


# ─── Request Models ───────────────────────────────────────────────────────────
class ShipmentRequest(BaseModel):
    origin:       str
    destination:  str
    weight_kg:    float
    distance_km:  float
    priority:     str = "Standard"
    vehicle_type: str = "HCV"
    industry:     str = "General"

class BidEntry(BaseModel):
    carrier_id:  str
    bid_price:   float

class BidCompareRequest(BaseModel):
    origin:      str
    destination: str
    weight_kg:   float
    distance_km: float
    priority:    str = "Standard"
    vehicle_type:str = "HCV"
    bids:        list[BidEntry]

class AwardSplitRequest(BaseModel):
    carrier_a_id: str
    carrier_b_id: str
    split_pct:    float       # % going to carrier_a
    distance_km:  float
    weight_kg:    float
    priority:     str = "Standard"
    vehicle_type: str = "HCV"

class FeedbackRequest(BaseModel):
    shipment_id:     str
    carrier_id:      str
    outcome:         str      # "on_time" | "delayed" | "damaged" | "lost"
    feedback_rating: float
    comments:        Optional[str] = ""


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "app":     "FreightMind",
        "tagline": "Smarter Carriers. Faster Decisions.",
        "status":  "running",
        "version": "1.0.0",
    }

# ── Dashboard KPIs ────────────────────────────────────────────────────────────
@app.get("/api/dashboard")
def get_dashboard():
    total_shipments  = len(shipments_df)
    total_carriers   = len(carriers_df)
    avg_score        = round(float(shipments_df["carrier_score"].mean()), 1)
    on_time_pct      = round((shipments_df["on_time_delivery"] == "Yes").mean() * 100, 1)
    high_risk_count  = int((shipments_df["risk_level"] == "High").sum())
    neg_signals      = int((shipments_df["negotiation_signal"] == "Yes").sum())
    total_lanes      = int(shipments_df["lane"].nunique())
    avg_savings_pct  = round(
        ((shipments_df["market_rate_inr"] - shipments_df["bid_price_inr"]) /
          shipments_df["market_rate_inr"].replace(0, 1) * 100).mean(), 1
    )

    # Top 5 carriers by score
    top_carriers = (
        shipments_df.groupby("carrier_name")["carrier_score"]
        .mean().reset_index()
        .sort_values("carrier_score", ascending=False)
        .head(5)
        .rename(columns={"carrier_score": "avg_score"})
    )
    top_carriers["avg_score"] = top_carriers["avg_score"].round(1)

    # Recent 10 shipments
    recent = shipments_df.sort_values("shipment_date", ascending=False).head(10)[[
        "shipment_id", "shipment_date", "origin", "destination",
        "carrier_name", "carrier_score", "risk_level", "on_time_delivery"
    ]].to_dict(orient="records")

    # Lane distribution (top 10)
    top_lanes = (
        shipments_df.groupby("lane").size().reset_index(name="count")
        .sort_values("count", ascending=False).head(10)
        .to_dict(orient="records")
    )

    # Monthly trend
    shipments_df["month"] = pd.to_datetime(shipments_df["shipment_date"]).dt.to_period("M").astype(str)
    monthly = (
        shipments_df.groupby("month")
        .agg(shipments=("shipment_id", "count"), avg_score=("carrier_score", "mean"))
        .reset_index()
    )
    monthly["avg_score"] = monthly["avg_score"].round(1)

    return {
        "kpis": {
            "total_shipments":  total_shipments,
            "total_carriers":   total_carriers,
            "total_lanes":      total_lanes,
            "avg_carrier_score": avg_score,
            "on_time_rate_pct": on_time_pct,
            "high_risk_alerts": high_risk_count,
            "negotiation_opportunities": neg_signals,
            "avg_savings_pct":  avg_savings_pct,
        },
        "top_carriers":  top_carriers.to_dict(orient="records"),
        "recent_shipments": recent,
        "top_lanes":     top_lanes,
        "monthly_trend": monthly.to_dict(orient="records"),
    }

# ── Carrier Recommendations ───────────────────────────────────────────────────
@app.post("/api/recommend")
def recommend_carriers(req: ShipmentRequest):
    market_rate = req.distance_km * 20  # ₹20/km baseline

    bid_prices = {}
    for _, row in carriers_df.iterrows():
        base = req.distance_km * float(row["avg_price_per_km_inr"])
        if req.priority == "Express": base *= 1.3
        if req.priority == "Urgent":  base *= 1.6
        bid_prices[row["carrier_id"]] = round(base, 2)

    ranked = rank_carriers(carriers_df, bid_prices, market_rate)

    # Enrich with ML predicted score
    for r in ranked:
        cid  = r["carrier_id"]
        crow = carriers_df[carriers_df["carrier_id"] == cid].iloc[0].to_dict()
        ml_score = predict_score(
            crow, req.distance_km, req.weight_kg,
            r["bid_price_inr"], market_rate,
            req.priority, req.vehicle_type, model, encoders
        )
        r["ml_predicted_score"] = ml_score
        r["final_score"] = round((r["composite_score"] * 0.5 + ml_score * 0.5), 1)

    ranked.sort(key=lambda x: x["final_score"], reverse=True)
    for i, r in enumerate(ranked):
        r["rank"] = i + 1

    return {
        "request":      req.dict(),
        "market_rate":  market_rate,
        "total":        len(ranked),
        "carriers":     ranked,
    }

# ── Carrier Scorecard ─────────────────────────────────────────────────────────
@app.get("/api/carrier/{carrier_id}")
def get_carrier_scorecard(carrier_id: str):
    row = carriers_df[carriers_df["carrier_id"] == carrier_id]
    if row.empty:
        raise HTTPException(status_code=404, detail="Carrier not found")

    carrier  = row.iloc[0].to_dict()
    c_ships  = shipments_df[shipments_df["carrier_id"] == carrier_id]

    lanes    = c_ships["lane"].value_counts().head(10).reset_index()
    lanes.columns = ["lane", "count"]

    monthly_perf = (
        c_ships.assign(month=pd.to_datetime(c_ships["shipment_date"]).dt.to_period("M").astype(str))
        .groupby("month")
        .agg(
            shipments=("shipment_id", "count"),
            avg_score=("carrier_score", "mean"),
            on_time_pct=("on_time_delivery", lambda x: (x == "Yes").mean() * 100),
        )
        .reset_index()
    )
    monthly_perf["avg_score"]    = monthly_perf["avg_score"].round(1)
    monthly_perf["on_time_pct"]  = monthly_perf["on_time_pct"].round(1)

    explanation = get_simple_explanation(carrier, float(carrier.get("service_score_10", 7.5)) * 10)

    return {
        "carrier":      carrier,
        "stats": {
            "total_shipments": len(c_ships),
            "on_time_pct":     round((c_ships["on_time_delivery"] == "Yes").mean() * 100, 1),
            "avg_score":       round(float(c_ships["carrier_score"].mean()), 1),
            "damage_pct":      round((c_ships["damage_reported"] == "Yes").mean() * 100, 1),
            "avg_bid_inr":     round(float(c_ships["bid_price_inr"].mean()), 2),
            "unique_lanes":    int(c_ships["lane"].nunique()),
        },
        "top_lanes":    lanes.to_dict(orient="records"),
        "monthly_perf": monthly_perf.to_dict(orient="records"),
        "explanation":  explanation,
    }

# ── All Carriers List ─────────────────────────────────────────────────────────
@app.get("/api/carriers")
def get_all_carriers():
    result = []
    for _, row in carriers_df.iterrows():
        c_ships = shipments_df[shipments_df["carrier_id"] == row["carrier_id"]]
        avg_score = round(float(c_ships["carrier_score"].mean()), 1) if len(c_ships) > 0 else 0
        risk = "Low" if avg_score >= 80 else ("Medium" if avg_score >= 60 else "High")
        result.append({
            **row.to_dict(),
            "avg_score":     avg_score,
            "risk_level":    risk,
            "total_shipments": len(c_ships),
        })
    result.sort(key=lambda x: x["avg_score"], reverse=True)
    return {"carriers": result, "total": len(result)}

# ── Bid Comparison ────────────────────────────────────────────────────────────
@app.post("/api/compare-bids")
def compare_bids(req: BidCompareRequest):
    market_rate = req.distance_km * 20
    bid_map     = {b.carrier_id: b.bid_price for b in req.bids}
    ranked      = rank_carriers(carriers_df, bid_map, market_rate)

    # Filter only submitted carriers
    filtered = [r for r in ranked if r["carrier_id"] in bid_map]
    for i, r in enumerate(filtered):
        r["rank"] = i + 1

    return {
        "market_rate": market_rate,
        "total":       len(filtered),
        "carriers":    filtered,
    }

# ── Award Simulation ──────────────────────────────────────────────────────────
@app.post("/api/simulate-award")
def simulate_award(req: AwardSplitRequest):
    def get_carrier(cid):
        row = carriers_df[carriers_df["carrier_id"] == cid]
        if row.empty:
            raise HTTPException(status_code=404, detail=f"Carrier {cid} not found")
        return row.iloc[0].to_dict()

    market_rate = req.distance_km * 20
    ca = get_carrier(req.carrier_a_id)
    cb = get_carrier(req.carrier_b_id)

    def enrich(carrier, split_pct):
        bid = req.distance_km * float(carrier["avg_price_per_km_inr"])
        neg = compute_negotiation_signal(bid, market_rate)
        return {
            "carrier_id":      carrier["carrier_id"],
            "carrier_name":    carrier["carrier_name"],
            "bid_price_inr":   round(bid, 2),
            "market_rate_inr": round(market_rate, 2),
            "on_time_rate_pct":carrier["on_time_rate_pct"],
            "composite_score": round(float(carrier["service_score_10"]) * 10, 1),
            "negotiation":     neg,
            "split_pct":       split_pct,
        }

    a_enriched = enrich(ca, req.split_pct)
    b_enriched = enrich(cb, 100 - req.split_pct)

    simulation = simulate_award_split(a_enriched, b_enriched, req.split_pct, market_rate * req.distance_km)

    # Generate split range for chart
    splits = []
    for pct in range(0, 101, 10):
        s = simulate_award_split(a_enriched, b_enriched, pct, market_rate)
        splits.append({"split_a": pct, "split_b": 100 - pct, **s})

    return {
        "carrier_a":    a_enriched,
        "carrier_b":    b_enriched,
        "simulation":   simulation,
        "split_range":  splits,
    }

# ── Lane Intelligence ─────────────────────────────────────────────────────────
@app.get("/api/lanes")
def get_lane_intelligence():
    lane_stats = (
        shipments_df.groupby(["lane", "origin", "destination"])
        .agg(
            total_shipments=("shipment_id", "count"),
            avg_score=("carrier_score", "mean"),
            avg_price=("bid_price_inr", "mean"),
            on_time_pct=("on_time_delivery", lambda x: (x == "Yes").mean() * 100),
        )
        .reset_index()
        .sort_values("total_shipments", ascending=False)
    )
    lane_stats["avg_score"]   = lane_stats["avg_score"].round(1)
    lane_stats["avg_price"]   = lane_stats["avg_price"].round(2)
    lane_stats["on_time_pct"] = lane_stats["on_time_pct"].round(1)
    lane_stats["risk_level"]  = lane_stats["avg_score"].apply(
        lambda s: "Low" if s >= 80 else ("Medium" if s >= 60 else "High")
    )

    # Top carrier per lane
    top_per_lane = (
        shipments_df.groupby(["lane", "carrier_name"])["carrier_score"]
        .mean().reset_index()
        .sort_values("carrier_score", ascending=False)
        .drop_duplicates("lane")
        .rename(columns={"carrier_name": "top_carrier", "carrier_score": "top_carrier_score"})
    )
    top_per_lane["top_carrier_score"] = top_per_lane["top_carrier_score"].round(1)

    merged = lane_stats.merge(top_per_lane[["lane", "top_carrier", "top_carrier_score"]], on="lane", how="left")

    return {
        "total_lanes": len(merged),
        "lanes": merged.head(50).to_dict(orient="records"),
    }

# ── Feedback ──────────────────────────────────────────────────────────────────
feedbacks = []

@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    feedbacks.append(req.dict())
    return {
        "status":  "received",
        "message": "Thank you! Feedback recorded. Model will improve with next retraining cycle.",
        "total_feedback_collected": len(feedbacks),
    }

@app.get("/api/feedback")
def get_feedbacks():
    return {"total": len(feedbacks), "feedbacks": feedbacks}

# ── Feature Importance ────────────────────────────────────────────────────────
@app.get("/api/model/importance")
def feature_importance():
    importance = get_feature_importance(model)
    return {"feature_importance": importance}

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {
        "status":   "healthy",
        "carriers": len(carriers_df),
        "shipments":len(shipments_df),
        "model":    "loaded",
    }