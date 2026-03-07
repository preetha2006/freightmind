# FreightMind

AI-powered carrier selection and procurement intelligence platform for logistics teams. Built for the LogisticsNow LoRRI AI Hackathon Round 2.

---

## Overview

FreightMind is a full-stack web application that helps procurement and logistics teams make faster, data-driven carrier selection decisions. The platform uses a machine learning model trained on historical shipment data to score and rank carriers, detect overpriced bids, simulate award splits, and learn continuously from shipment outcomes.

---

## Features

- **AI Carrier Recommendations** - Submit a shipment request and receive ranked carrier suggestions with explainable scores based on 12 performance features
- **Bid Comparison Engine** - Enter multiple carrier bids and get normalized rankings with automatic negotiation signal detection
- **Award Split Simulator** - Slide between two carriers to see blended risk, cost, and on-time performance across different allocation ratios
- **Carrier Scorecard** - Full performance profile per carrier including radar chart, monthly trend, top lanes, and SHAP-based AI explanation
- **Lane Intelligence Map** - Interactive India map (Leaflet.js) showing freight route network colored by risk level with lane-level analytics
- **Feedback Loop** - Mark shipment outcomes to continuously improve model recommendations over time
- **Dashboard** - KPI overview, top carrier rankings, monthly shipment trend, and top lanes by volume

---

## Tech Stack

**Backend**
- Python 3.10
- FastAPI
- XGBoost (carrier scoring model)
- SHAP (model explainability)
- Pandas, Scikit-learn

**Frontend**
- React 18 + Vite
- React Router
- Recharts (data visualisation)
- Leaflet.js (interactive map)
- Axios
- Tailwind CSS utilities

---

## Project Structure

```
freightmind/
├── backend/
│   ├── main.py              # FastAPI app and all API endpoints
│   ├── model.py             # XGBoost model training and persistence
│   ├── scorer.py            # Carrier scoring and ranking logic
│   ├── explainer.py         # SHAP-based explanation generator
│   ├── data_generator.py    # Synthetic dataset generator
│   ├── requirements.txt
│   └── data/
│       ├── carriers.csv     # 15 Indian carrier profiles
│       ├── shipments.csv    # 5,000 historical shipments
│       ├── model.pkl        # Trained XGBoost model (auto-generated)
│       └── encoders.pkl     # Feature encoders (auto-generated)
├── frontend/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── KPICard.jsx
│       │   ├── CarrierCard.jsx
│       │   ├── RiskBadge.jsx
│       │   └── ScoreChart.jsx
│       └── pages/
│           ├── Dashboard.jsx
│           ├── NewShipment.jsx
│           ├── CarrierScorecard.jsx
│           ├── BidComparison.jsx
│           ├── AwardSimulation.jsx
│           ├── LaneMap.jsx
│           └── FeedbackLoop.jsx
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python model.py
uvicorn main:app --reload
```

The backend will be available at `http://127.0.0.1:8000`.  
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

> Both the backend and frontend must be running simultaneously for the application to function.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System and model status |
| GET | `/api/dashboard` | KPIs, top carriers, trends |
| POST | `/api/recommend` | Ranked carrier recommendations |
| GET | `/api/carriers` | All carrier profiles |
| GET | `/api/carrier/{id}` | Single carrier scorecard |
| POST | `/api/compare-bids` | Bid comparison and ranking |
| POST | `/api/simulate-award` | Award split simulation |
| GET | `/api/lanes` | Lane intelligence data |
| POST | `/api/feedback` | Submit shipment outcome |
| GET | `/api/model/importance` | Feature importance scores |

---

## ML Model

- **Algorithm** - XGBoost Regressor
- **Training data** - 5,000 synthetic shipments across 20 Indian cities and 380 lanes (January 2023 to December 2024)
- **Performance** - MAE: 0.92, R-squared: 0.954
- **Features** - On-time rate, damage rate, average delay, service score, fleet size, active lanes, distance, weight, price ratio, priority, vehicle type, carrier type
- **Explainability** - SHAP values used to generate per-carrier, per-prediction explanations shown in the UI

---

## Dataset

The synthetic dataset covers:
- 15 real Indian logistics carriers including BlueDart, GATI, Delhivery, TCI, Mahindra Logistics, Rivigo, DHL India, and FedEx India
- 20 major Indian cities
- Industries including FMCG, Pharma, Automotive, Electronics, Textile, and Retail
- Vehicle types: LCV, MCV, HCV, Trailer, Container

---

## Hackathon Context

- **Event** - LogisticsNow LoRRI AI Hackathon Round 2
- **Problem Statement** - Carrier Selection Agent in Procurement
- **Team** - Shortlisted from Round 1 for Round 2 final submission
- **Submission deadline** - 8 March 2026

---

## License

This project was built for hackathon purposes. All carrier names are used for demonstration only.
