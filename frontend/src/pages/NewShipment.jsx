import { API_BASE } from "../config";
import { useState } from "react";
import axios from "axios";
import CarrierCard from "../components/CarrierCard";
import { TopBar } from "../components/Navbar";
import { FactorChart } from "../components/ScoreChart";

const API = "http://127.0.0.1:8000/api";

const CITIES = [
  "Mumbai","Delhi","Bengaluru","Chennai","Hyderabad","Pune","Ahmedabad",
  "Kolkata","Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore",
  "Coimbatore","Kochi","Bhopal","Visakhapatnam","Vadodara","Ludhiana",
];

const DISTANCES = {
  "Mumbai-Delhi":1415,"Mumbai-Bengaluru":984,"Mumbai-Chennai":1338,
  "Mumbai-Hyderabad":711,"Mumbai-Pune":149,"Mumbai-Ahmedabad":524,
  "Mumbai-Kolkata":1987,"Delhi-Bengaluru":2150,"Delhi-Chennai":2194,
  "Delhi-Hyderabad":1568,"Delhi-Kolkata":1472,"Delhi-Jaipur":282,
  "Delhi-Lucknow":555,"Bengaluru-Chennai":346,"Bengaluru-Hyderabad":569,
  "Bengaluru-Kochi":570,"Chennai-Hyderabad":627,"Chennai-Coimbatore":497,
};

function getDistance(o, d) {
  return DISTANCES[`${o}-${d}`] || DISTANCES[`${d}-${o}`] || Math.floor(Math.random() * 1200 + 300);
}

export default function NewShipment() {
  const [form, setForm]       = useState({ origin: "", destination: "", weight_kg: "", priority: "Standard", vehicle_type: "HCV", industry: "FMCG" });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError]     = useState("");

  const handleSubmit = async () => {
    if (!form.origin || !form.destination || !form.weight_kg) { setError("Please fill all required fields."); return; }
    if (form.origin === form.destination) { setError("Origin and destination cannot be the same."); return; }
    setError(""); setLoading(true); setResults(null); setSelected(null);
    try {
      const distance_km = getDistance(form.origin, form.destination);
      const res = await axios.post(`${API}/recommend`, { ...form, distance_km, weight_kg: parseFloat(form.weight_kg) });
      setResults(res.data);
    } catch (e) { setError("Failed to fetch recommendations. Is the backend running?"); }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .form-card {
          background: #112236; border-radius: 16px;
          border: 1px solid rgba(37,99,235,0.18); padding: 28px;
          margin-bottom: 28px;
        }
        .form-title {
          font-family: 'Syne', sans-serif; font-size: 18px;
          font-weight: 800; color: white; margin-bottom: 6px;
        }
        .form-sub { font-size: 13px; color: #64748B; margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.8px; text-transform: uppercase; }
        select, input {
          background: #0D1B2A; border: 1px solid rgba(37,99,235,0.25);
          border-radius: 10px; padding: 11px 14px;
          color: white; font-size: 14px; font-family: 'DM Sans', sans-serif;
          outline: none; transition: border-color 0.15s;
          appearance: none; -webkit-appearance: none;
        }
        select:focus, input:focus { border-color: #3B82F6; }
        select option { background: #112236; }
        .submit-btn {
          margin-top: 20px; padding: 13px 32px;
          background: linear-gradient(135deg, #2563EB, #06B6D4);
          border: none; border-radius: 12px; color: white;
          font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(37,99,235,0.35);
        }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(37,99,235,0.5); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .error-msg { color: #EF4444; font-size: 13px; margin-top: 10px; }
        .results-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px;
        }
        .results-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: white; }
        .results-meta { font-size: 12px; color: #64748B; }
        .carriers-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        .detail-panel {
          background: #112236; border-radius: 16px;
          border: 1px solid rgba(37,99,235,0.25);
          padding: 24px; margin-top: 24px;
        }
        .detail-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: white; margin-bottom: 18px; }
        .neg-box {
          background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25);
          border-radius: 10px; padding: 16px; margin-top: 16px;
        }
        .neg-title { font-size: 12px; font-weight: 600; color: #F59E0B; margin-bottom: 6px; }
        .neg-text { font-size: 13px; color: #CBD5E1; }
        .market-badge {
          display: inline-block; background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.2); color: #10B981;
          font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-top: 8px;
        }
        .loading-spin {
          display: inline-block; width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.2); border-top-color: white;
          border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr 1fr; } .carriers-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page">
        <TopBar title="New Shipment — Get AI Recommendations" />
        <div className="page-wrapper">

          <div className="form-card">
            <div className="form-title">🚛 Request Carrier Recommendations</div>
            <div className="form-sub">Enter shipment details and FreightMind AI will rank the best carriers for your lane.</div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Origin *</label>
                <select value={form.origin} onChange={e => setForm({...form, origin: e.target.value})}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <select value={form.destination} onChange={e => setForm({...form, destination: e.target.value})}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg) *</label>
                <input type="number" placeholder="e.g. 1500" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                  <option>Standard</option><option>Express</option><option>Urgent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select value={form.vehicle_type} onChange={e => setForm({...form, vehicle_type: e.target.value})}>
                  <option>LCV</option><option>MCV</option><option>HCV</option><option>Trailer</option><option>Container</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select value={form.industry} onChange={e => setForm({...form, industry: e.target.value})}>
                  {["FMCG","Pharma","Automotive","Electronics","Textile","Industrial","Retail","Chemical","Food & Beverage","Machinery"].map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>

            {error && <div className="error-msg">⚠ {error}</div>}
            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="loading-spin" />Analyzing carriers...</> : "⬡ Get AI Recommendations"}
            </button>
          </div>

          {results && (
            <>
              <div className="results-header">
                <div className="results-title">
                  Recommendations — {results.request.origin} → {results.request.destination}
                </div>
                <div className="results-meta">
                  {results.total} carriers ranked · Market rate: ₹{results.market_rate?.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="carriers-grid">
                {results.carriers.map((c) => (
                  <CarrierCard
                    key={c.carrier_id}
                    carrier={c}
                    rank={c.rank}
                    onClick={() => setSelected(selected?.carrier_id === c.carrier_id ? null : c)}
                  />
                ))}
              </div>

              {selected && (
                <div className="detail-panel">
                  <div className="detail-title">⬡ {selected.carrier_name} — Detail View</div>
                  <FactorChart factors={selected.factor_breakdown} />
                  {selected.negotiation?.signal && (
                    <div className="neg-box">
                      <div className="neg-title">⚡ Negotiation Signal</div>
                      <div className="neg-text">{selected.negotiation.message}</div>
                      <div className="neg-text" style={{ marginTop: 6 }}>
                        Potential savings: <strong style={{ color: "#10B981" }}>₹{selected.negotiation.savings_inr?.toLocaleString("en-IN")}</strong>
                        &nbsp;· Target price: <strong style={{ color: "#3B82F6" }}>₹{selected.negotiation.recommended_target_inr?.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  )}
                  {!selected.negotiation?.signal && (
                    <div className="market-badge">✓ Bid is market-competitive — no negotiation needed</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
