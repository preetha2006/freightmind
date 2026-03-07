import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor
from data_generator import generate_data

MODEL_PATH = "data/model.pkl"
ENCODERS_PATH = "data/encoders.pkl"

FEATURES = [
    "on_time_rate_pct",
    "damage_rate_pct",
    "avg_delay_days",
    "service_score_10",
    "fleet_size",
    "active_lanes",
    "distance_km",
    "weight_kg",
    "price_ratio",          # bid vs market
    "priority_encoded",
    "vehicle_encoded",
    "carrier_type_encoded",
]

TARGET = "carrier_score"

def train_model():
    """Train XGBoost model on shipment + carrier data and save to disk."""

    # Generate fresh data if not present
    if not os.path.exists("data/shipments.csv") or not os.path.exists("data/carriers.csv"):
        print("📦 Generating data first...")
        generate_data()

    shipments = pd.read_csv("data/shipments.csv")
    carriers  = pd.read_csv("data/carriers.csv")

    # Merge on carrier_id
    df = shipments.merge(
        carriers[["carrier_id", "on_time_rate_pct", "damage_rate_pct",
                  "avg_delay_days", "service_score_10", "fleet_size",
                  "active_lanes", "type"]],
        on="carrier_id", how="left"
    )

    # Feature engineering
    df["price_ratio"] = df["bid_price_inr"] / df["market_rate_inr"].replace(0, 1)

    # Encode categoricals
    encoders = {}
    for col, enc_key in [("priority", "priority_encoded"),
                          ("vehicle_type", "vehicle_encoded"),
                          ("type", "carrier_type_encoded")]:
        le = LabelEncoder()
        df[enc_key] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    df_clean = df[FEATURES + [TARGET]].dropna()

    X = df_clean[FEATURES]
    y = df_clean[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    print(f"✅ Model trained — MAE: {mae:.2f} | R²: {r2:.4f}")

    joblib.dump(model,    MODEL_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    print(f"✅ Model saved to {MODEL_PATH}")

    return model, encoders

def load_model():
    """Load trained model from disk. Train if not found."""
    if not os.path.exists(MODEL_PATH):
        print("⚙️  Model not found — training now...")
        return train_model()
    model    = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    return model, encoders

def predict_score(
    carrier_row: dict,
    distance_km: float,
    weight_kg: float,
    bid_price: float,
    market_rate: float,
    priority: str,
    vehicle_type: str,
    model=None,
    encoders=None,
) -> float:
    """Predict carrier score for a given shipment using the trained model."""

    if model is None or encoders is None:
        model, encoders = load_model()

    price_ratio = bid_price / max(market_rate, 1)

    def safe_encode(enc, val):
        classes = list(enc.classes_)
        if val not in classes:
            val = classes[0]
        return enc.transform([val])[0]

    features = pd.DataFrame([{
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

    score = float(model.predict(features)[0])
    return round(min(100, max(0, score)), 1)

def get_feature_importance(model=None) -> dict:
    """Return feature importance scores from the trained model."""
    if model is None:
        model, _ = load_model()
    importance = model.feature_importances_
    return {feat: round(float(imp), 4) for feat, imp in zip(FEATURES, importance)}

if __name__ == "__main__":
    train_model()