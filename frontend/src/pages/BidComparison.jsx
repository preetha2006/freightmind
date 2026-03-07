import { useState, useEffect } from "react";
import axios from "axios";
import { TopBar } from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";
import { FactorChart } from "../components/ScoreChart";

const API = "http://127.0.0.1:8000/api";
const CITIES = ["Mumbai","Delhi","Bengaluru","Chennai","Hyderabad","Pune","Ahmedabad","Kolkata","Jaipur","Surat","Lucknow","Nagpur","Indore","Coimbatore","Kochi","Bhopal","Visakhapatnam","Vadodara","Ludhiana"];
const DISTANCES = {"Mumbai-Delhi":1415,"Mumbai-Bengaluru":984,"Mumbai-Chennai":1338,"Mumbai-Hyderabad":711,"Mumbai-Pune":149,"Mumbai-Ahmedabad":524,"Delhi-Bengaluru":2150,"Delhi-Chennai":2194,"Delhi-Hyderabad":1568,"Delhi-Kolkata":1472,"Delhi-Jaipur":282,"Bengaluru-Chennai":346,"Bengaluru-Hyderabad":569,"Chennai-Hyderabad":627};
function getDistance(o, d) { return DISTANCES[`${o}-${d}`] || DISTANCES[`${d}-${o}`] || 800; }

export default function BidComparison() {
  const [carriers, setCarriers] = useState([]);
  const [form, setForm] = useState({ origin: "Mumbai", destination: "Delhi", weight_kg: "2000", priority: "Standard", vehicle_type: "HCV" });
  const [bids, setBids] = useState([{ carrier_id: "", bid_price: "" }, { carrier_id: "", bid_price: "" }]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { axios.get(`${API}/carriers`).then(r => setCarriers(r.data.carriers)); }, []);

  const addBid   = () => setBids([...bids, { carrier_id: "", bid_price: "" }]);
  const removeBid = (i) => setBids(bids.filter((_, idx) => idx !== i));
  const updateBid = (i, field, val) => { const b = [...bids]; b[i][field] = val; setBids(b); };

  const handleCompare = async () => {
    const validBids = bids.filter(b => b.carrier_id && b.bid_price);
    if (validBids.length < 2) return;
    setLoading(true); setResults(null); setSelected(null);
    const distance_km = getDistance(form.origin, form.destination);
    const res = await axios.post(`${API}/compare-bids`, {
      ...form, distance_km, weight_kg: parseFloat(form.weight_kg),
      bids: validBids.map(b => ({ carrier_id: b.carrier_id, bid_price: parseFloat(b.bid_price) }))
    });
    setResults(res.data);
    setLoading(false);
  };

  const formatINR = v => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .card { background: #112236; border-radius: 14px; border: 1px solid rgba(37,99,235,0.18); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: white; margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: #64748B; margin-bottom: 20px; }
        .form-row { display: grid; grid-template-columns: repeat(5,1fr); gap: 14px; margin-bottom: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.8px; text-transform: uppercase; }
        select, input { background: #0D1B2A; border: 1px solid rgba(37,99,235,0.25); border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; appearance: none; }
        select:focus, input:focus { border-color: #3B82F6; }
        .bid-row { display: grid; grid-template-columns: 1fr 1fr 36px; gap: 12px; align-items: end; margin-bottom: 12px; }
        .remove-btn { width: 36px; height: 40px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: #EF4444; cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .add-btn { background: rgba(37,99,235,0.1); border: 1px solid rgba(37,99,235,0.3); color: #3B82F6; border-radius: 8px; padding: 8px 16px; cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
        .compare-btn { background: linear-gradient(135deg, #2563EB, #06B6D4); border: none; border-radius: 12px; padding: 13px 32px; color: white; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 20px rgba(37,99,235,0.35); transition: all 0.2s; }
        .compare-btn:hover { transform: translateY(-1px); }
        .result-table { width: 100%; border-collapse: collapse; }
        .result-table th { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .result-table td { padding: 14px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 13px; color: #CBD5E1; }
        .result-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .rank-badge { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 800; }
        .rank-1 { background: rgba(245,158,11,0.2); color: #F59E0B; }
        .rank-2 { background: rgba(100,116,139,0.15); color: #94A3B8; }
        .rank-n { background: rgba(37,99,235,0.12); color: #3B82F6; }
        .score-val { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; }
        .neg-flag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
        .neg-yes { background: rgba(245,158,11,0.12); color: #F59E0B; }
        .neg-no  { background: rgba(16,185,129,0.1);  color: #10B981; }
        .market-info { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748B; margin-top: 12px; }
        .market-val { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #10B981; }
        .detail-panel { background: #0D1B2A; border-radius: 12px; border: 1px solid rgba(37,99,235,0.15); padding: 20px; margin-top: 16px; }
      `}</style>

      <div className="page">
        <TopBar title="Bid Comparison — AI Analyzer" />
        <div className="page-wrapper">

          <div className="card">
            <div className="card-title">⊞ Intelligent Bid Comparison</div>
            <div className="card-sub">Enter carrier bids — FreightMind will normalize, score, and rank them with negotiation signals.</div>

            <div className="form-row">
              <div className="form-group"><label className="form-label">Origin</label><select value={form.origin} onChange={e => setForm({...form, origin: e.target.value})}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Destination</label><select value={form.destination} onChange={e => setForm({...form, destination: e.target.value})}>{CITIES.map(c=><option key={c}>{c}</option>)}</select></div>
              <div className="form-group"><label className="form-label">Weight (kg)</label><input type="number" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Priority</label><select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}><option>Standard</option><option>Express</option><option>Urgent</option></select></div>
              <div className="form-group"><label className="form-label">Vehicle</label><select value={form.vehicle_type} onChange={e => setForm({...form, vehicle_type: e.target.value})}><option>LCV</option><option>MCV</option><option>HCV</option><option>Trailer</option><option>Container</option></select></div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Carrier Bids</div>
            {bids.map((bid, i) => (
              <div className="bid-row" key={i}>
                <div className="form-group">
                  <label className="form-label">Carrier {i + 1}</label>
                  <select value={bid.carrier_id} onChange={e => updateBid(i, "carrier_id", e.target.value)}>
                    <option value="">Select carrier</option>
                    {carriers.map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Bid Price (₹)</label>
                  <input type="number" placeholder="e.g. 25000" value={bid.bid_price} onChange={e => updateBid(i, "bid_price", e.target.value)} />
                </div>
                {bids.length > 2 && <button className="remove-btn" onClick={() => removeBid(i)}>×</button>}
              </div>
            ))}

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="add-btn" onClick={addBid}>+ Add Carrier</button>
              <button className="compare-btn" onClick={handleCompare} disabled={loading}>
                {loading ? "Analyzing..." : "⊞ Compare Bids"}
              </button>
            </div>
          </div>

          {results && (
            <div className="card">
              <div className="card-title">📊 Comparison Results</div>
              <div className="market-info">
                Market Rate for this lane: <span className="market-val">₹{Number(results.market_rate).toLocaleString("en-IN")}</span>
              </div>
              <table className="result-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr><th>Rank</th><th>Carrier</th><th>Bid Price</th><th>vs Market</th><th>Score</th><th>Risk</th><th>On-Time</th><th>Negotiation</th></tr>
                </thead>
                <tbody>
                  {results.carriers.map((c, i) => {
                    const diff = ((c.bid_price_inr - c.market_rate_inr) / c.market_rate_inr * 100).toFixed(1);
                    const diffColor = diff > 10 ? "#EF4444" : diff > 0 ? "#F59E0B" : "#10B981";
                    return (
                      <tr key={i} onClick={() => setSelected(selected?.carrier_id === c.carrier_id ? null : c)}>
                        <td><span className={`rank-badge ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : "rank-n"}`}>#{i+1}</span></td>
                        <td><div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white", fontSize: 13 }}>{c.carrier_name}</div><div style={{ fontSize: 11, color: "#64748B" }}>{c.carrier_type}</div></td>
                        <td><span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>₹{Number(c.bid_price_inr).toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span></td>
                        <td><span style={{ color: diffColor, fontWeight: 600, fontSize: 13 }}>{diff > 0 ? "+" : ""}{diff}%</span></td>
                        <td><span className="score-val" style={{ color: c.composite_score >= 80 ? "#10B981" : c.composite_score >= 65 ? "#3B82F6" : "#F59E0B" }}>{c.composite_score}</span></td>
                        <td><RiskBadge risk={c.risk_level} size="sm" /></td>
                        <td>{c.on_time_rate_pct}%</td>
                        <td><span className={`neg-flag ${c.negotiation?.signal ? "neg-yes" : "neg-no"}`}>{c.negotiation?.signal ? "⚡ Negotiate" : "✓ Fair"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {selected && (
                <div className="detail-panel">
                  <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: "white", marginBottom: 14 }}>{selected.carrier_name} — Factor Breakdown</div>
                  <FactorChart factors={selected.factor_breakdown} />
                  {selected.negotiation?.signal && (
                    <div style={{ marginTop: 14, background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B", marginBottom: 6 }}>⚡ Negotiation Advice</div>
                      <div style={{ fontSize: 13, color: "#CBD5E1" }}>{selected.negotiation.message}</div>
                      <div style={{ fontSize: 13, color: "#CBD5E1", marginTop: 6 }}>
                        Potential savings: <strong style={{ color: "#10B981" }}>₹{Number(selected.negotiation.savings_inr).toLocaleString("en-IN")}</strong>
                        &nbsp;· Recommend targeting: <strong style={{ color: "#3B82F6" }}>₹{Number(selected.negotiation.recommended_target_inr).toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}