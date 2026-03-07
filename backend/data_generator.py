import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

random.seed(42)
np.random.seed(42)

def generate_data():
    os.makedirs("data", exist_ok=True)

    # ─── CARRIERS ─────────────────────────────────────────────────────────────
    carrier_data = [
        {"carrier_id": "C001", "carrier_name": "BlueDart Express",       "type": "Express",  "fleet_size": 320, "hq": "Mumbai",    "coverage": "PAN India"},
        {"carrier_id": "C002", "carrier_name": "GATI Limited",           "type": "Standard", "fleet_size": 280, "hq": "Hyderabad", "coverage": "PAN India"},
        {"carrier_id": "C003", "carrier_name": "Delhivery Freight",      "type": "Express",  "fleet_size": 450, "hq": "Gurugram",  "coverage": "PAN India"},
        {"carrier_id": "C004", "carrier_name": "TCI Freight",            "type": "FTL",      "fleet_size": 510, "hq": "Gurugram",  "coverage": "PAN India"},
        {"carrier_id": "C005", "carrier_name": "Mahindra Logistics",     "type": "FTL",      "fleet_size": 390, "hq": "Mumbai",    "coverage": "PAN India"},
        {"carrier_id": "C006", "carrier_name": "Ecom Express",           "type": "Standard", "fleet_size": 260, "hq": "New Delhi", "coverage": "PAN India"},
        {"carrier_id": "C007", "carrier_name": "Safexpress",             "type": "Express",  "fleet_size": 175, "hq": "New Delhi", "coverage": "PAN India"},
        {"carrier_id": "C008", "carrier_name": "VRL Logistics",          "type": "LTL",      "fleet_size": 430, "hq": "Hubballi",  "coverage": "South & West India"},
        {"carrier_id": "C009", "carrier_name": "Rivigo",                 "type": "Tech-FTL", "fleet_size": 210, "hq": "Gurugram",  "coverage": "PAN India"},
        {"carrier_id": "C010", "carrier_name": "XpressBees Freight",     "type": "Standard", "fleet_size": 190, "hq": "Pune",      "coverage": "PAN India"},
        {"carrier_id": "C011", "carrier_name": "SpotOn Logistics",       "type": "LTL",      "fleet_size": 145, "hq": "New Delhi", "coverage": "North & Central India"},
        {"carrier_id": "C012", "carrier_name": "ShadowFax Freight",      "type": "Express",  "fleet_size": 130, "hq": "Bengaluru", "coverage": "Metro Cities"},
        {"carrier_id": "C013", "carrier_name": "Allcargo Logistics",     "type": "FTL",      "fleet_size": 360, "hq": "Mumbai",    "coverage": "PAN India"},
        {"carrier_id": "C014", "carrier_name": "DHL Supply Chain India", "type": "Express",  "fleet_size": 290, "hq": "Mumbai",    "coverage": "PAN India"},
        {"carrier_id": "C015", "carrier_name": "FedEx Freight India",    "type": "Express",  "fleet_size": 240, "hq": "Mumbai",    "coverage": "PAN India"},
    ]

    profiles = {
        "C001": (92, 1.2, 4.5, 8.8),
        "C002": (84, 2.1, 6.2, 7.6),
        "C003": (89, 1.5, 5.1, 8.3),
        "C004": (87, 1.8, 5.8, 8.0),
        "C005": (85, 2.0, 6.0, 7.8),
        "C006": (80, 2.8, 7.5, 7.1),
        "C007": (91, 1.3, 4.8, 8.6),
        "C008": (83, 2.3, 6.8, 7.4),
        "C009": (90, 1.4, 4.9, 8.5),
        "C010": (82, 2.5, 7.0, 7.3),
        "C011": (78, 3.1, 8.2, 6.8),
        "C012": (88, 1.6, 5.3, 8.2),
        "C013": (86, 1.9, 5.7, 7.9),
        "C014": (93, 1.1, 4.2, 9.0),
        "C015": (94, 1.0, 4.0, 9.2),
    }

    carriers = []
    for c in carrier_data:
        cid = c["carrier_id"]
        on_time, damage, delay, service = profiles[cid]
        carriers.append({
            **c,
            "on_time_rate_pct":     round(on_time + np.random.uniform(-1.5, 1.5), 1),
            "damage_rate_pct":      round(damage  + np.random.uniform(-0.2, 0.2), 2),
            "avg_delay_days":       round(delay   + np.random.uniform(-0.5, 0.5), 1),
            "service_score_10":     round(service + np.random.uniform(-0.2, 0.2), 1),
            "total_shipments_ytd":  random.randint(1200, 8500),
            "active_lanes":         random.randint(18, 95),
            "min_weight_kg":        random.choice([10, 25, 50, 100]),
            "max_weight_kg":        random.choice([5000, 10000, 20000, 30000]),
            "gst_registered":       "Yes",
            "iso_certified":        random.choice(["Yes", "Yes", "Yes", "No"]),
            "avg_price_per_km_inr": round(random.uniform(12, 28), 2),
        })

    carriers_df = pd.DataFrame(carriers)
    carriers_df.to_csv("data/carriers.csv", index=False)

    # ─── SHIPMENTS ────────────────────────────────────────────────────────────
    cities = [
        "Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad",
        "Pune", "Ahmedabad", "Kolkata", "Jaipur", "Surat",
        "Lucknow", "Kanpur", "Nagpur", "Indore", "Coimbatore",
        "Kochi", "Bhopal", "Visakhapatnam", "Vadodara", "Ludhiana"
    ]

    distance_map = {}
    base_distances = {
        ("Mumbai", "Delhi"): 1415,     ("Mumbai", "Bengaluru"): 984,
        ("Mumbai", "Chennai"): 1338,   ("Mumbai", "Hyderabad"): 711,
        ("Mumbai", "Pune"): 149,       ("Mumbai", "Ahmedabad"): 524,
        ("Mumbai", "Kolkata"): 1987,   ("Delhi", "Bengaluru"): 2150,
        ("Delhi", "Chennai"): 2194,    ("Delhi", "Hyderabad"): 1568,
        ("Delhi", "Kolkata"): 1472,    ("Delhi", "Jaipur"): 282,
        ("Delhi", "Lucknow"): 555,     ("Bengaluru", "Chennai"): 346,
        ("Bengaluru", "Hyderabad"): 569, ("Bengaluru", "Kochi"): 570,
        ("Chennai", "Hyderabad"): 627, ("Chennai", "Coimbatore"): 497,
        ("Hyderabad", "Nagpur"): 503,  ("Pune", "Nagpur"): 706,
        ("Ahmedabad", "Surat"): 264,   ("Ahmedabad", "Jaipur"): 664,
        ("Kolkata", "Bhopal"): 1400,   ("Lucknow", "Kanpur"): 80,
        ("Indore", "Bhopal"): 187,     ("Vadodara", "Ahmedabad"): 109,
    }
    for (a, b), d in base_distances.items():
        distance_map[(a, b)] = d
        distance_map[(b, a)] = d

    def get_distance(o, d):
        if o == d:
            return random.randint(50, 150)
        return distance_map.get((o, d), random.randint(300, 2200))

    carrier_ids   = [c["carrier_id"]   for c in carrier_data]
    carrier_names = [c["carrier_name"] for c in carrier_data]
    priority_levels = ["Standard", "Standard", "Standard", "Express", "Urgent"]
    vehicle_types   = ["LCV", "MCV", "HCV", "Trailer", "Container"]
    industry_types  = ["Automotive", "FMCG", "Pharma", "Electronics", "Textile",
                       "Industrial", "Retail", "Chemical", "Food & Beverage", "Machinery"]

    shipments = []
    start_date = datetime(2023, 1, 1)

    for i in range(1, 5001):
        origin = random.choice(cities)
        dest   = random.choice([c for c in cities if c != origin])
        lane   = f"{origin[:3].upper()}-{dest[:3].upper()}"

        cid_idx      = random.randint(0, 14)
        carrier_id   = carrier_ids[cid_idx]
        carrier_name = carrier_names[cid_idx]

        profile      = profiles[carrier_id]
        on_time_base = profile[0]
        damage_base  = profile[1]
        delay_base   = profile[2]

        distance_km  = get_distance(origin, dest)
        weight_kg    = round(random.uniform(50, 15000), 1)
        vehicle      = random.choice(vehicle_types)
        priority     = random.choice(priority_levels)
        industry     = random.choice(industry_types)

        base_price   = distance_km * random.uniform(11, 26) + weight_kg * random.uniform(0.5, 2.0)
        if priority == "Express": base_price *= 1.3
        if priority == "Urgent":  base_price *= 1.6
        bid_price    = round(base_price, 2)

        ship_date    = start_date + timedelta(days=random.randint(0, 700))
        transit_days = max(1, round(distance_km / random.uniform(350, 550)))

        on_time      = random.random() * 100 < on_time_base
        delayed_days = 0 if on_time else round(random.uniform(1, delay_base * 1.5), 1)
        damaged      = random.random() * 100 < damage_base
        delivered    = random.random() > 0.02

        score = round(
            (on_time_base * 0.40) +
            ((10 - damage_base) * 3.0) +
            ((10 - delay_base) * 2.5) +
            (profile[3] * 3.5) +
            random.uniform(-3, 3), 1
        )
        score = min(100, max(40, score))
        risk  = "Low" if score >= 80 else ("Medium" if score >= 65 else "High")

        shipments.append({
            "shipment_id":           f"SHP-{i:05d}",
            "shipment_date":         ship_date.strftime("%Y-%m-%d"),
            "origin":                origin,
            "destination":           dest,
            "lane":                  lane,
            "carrier_id":            carrier_id,
            "carrier_name":          carrier_name,
            "vehicle_type":          vehicle,
            "weight_kg":             weight_kg,
            "distance_km":           distance_km,
            "priority":              priority,
            "industry":              industry,
            "bid_price_inr":         bid_price,
            "transit_days_planned":  transit_days,
            "transit_days_actual":   transit_days + delayed_days,
            "on_time_delivery":      "Yes" if on_time else "No",
            "delayed_days":          delayed_days,
            "damage_reported":       "Yes" if damaged else "No",
            "delivered":             "Yes" if delivered else "No",
            "carrier_score":         score,
            "risk_level":            risk,
            "award_given":           "Yes" if score >= 70 and delivered else "No",
            "feedback_rating":       round(random.uniform(3.0, 5.0) if on_time else random.uniform(1.5, 3.5), 1),
            "negotiation_signal":    "Yes" if bid_price > (distance_km * 22) else "No",
            "market_rate_inr":       round(distance_km * 20, 2),
        })

    shipments_df = pd.DataFrame(shipments)
    shipments_df.to_csv("data/shipments.csv", index=False)

    print(f"✅ carriers.csv  — {len(carriers_df)} carriers generated")
    print(f"✅ shipments.csv — {len(shipments_df)} shipments generated")
    print(f"   Lanes    : {shipments_df['lane'].nunique()}")
    print(f"   Cities   : {shipments_df['origin'].nunique()}")
    print(f"   On-Time  : {(shipments_df['on_time_delivery']=='Yes').mean()*100:.1f}%")

if __name__ == "__main__":
    generate_data()