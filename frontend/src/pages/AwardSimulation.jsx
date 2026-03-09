import { API_BASE } from "../config";
import { useState, useEffect } from "react";
import axios from "axios";
import { TopBar } from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";


const API = "http://127.0.0.1:8000/api";

export default function AwardSimulation() {
  const [carriers, setCarriers] = useState([]);
  const [form, setForm]         = useState({ carrier_a_id: "", carrier_b_id: "", distance_km: "1415", weight_kg: "5000", priority: "Standard", vehicle_type: "HCV" });
  const [split, setSplit]       = useState(60);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => { axios.get(`${API}/carriers`).then(r => setCarriers(r.data.carriers)); }, []);

  const simulate = async () => {
    if (!form.carrier_a_id || !form.carrier_b_id) return;
    setLoading(true);
    const res = await axios.post(`${API}/simulate-award`, { ...form, split_pct: split, distance_km: parseFloat(form.distance_km), weight_kg: parseFloat(form.weight_kg) });
    setResult(res.data);
    setLoading(false);
  };

  useEffect(() => { if (form.carrier_a_id && form.carrier_b_id) simulate(); }, [split]);

  const formatINR = v => `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .card { background: #112236; border-radius: 14px; border: 1px solid rgba(37,99,235,0.18); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: white; margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: #64748B; margin-bottom: 20px; }
        .form-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-bottom: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.8px; text-transform: uppercase; }
        select, input { background: #0D1B2A; border: 1px solid rgba(37,99,235,0.25); border-radius: 10px; padding: 10px 14px; color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; appearance: none; }
        select:focus, input:focus { border-color: #3B82F6; }
        .sim-btn { background: linear-gradient(135deg, #2563EB, #06B6D4); border: none; border-radius: 12px; padding: 12px 28px; color: white; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .split-section { margin: 24px 0; }
        .split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .split-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: white; }
        .split-labels { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .split-label-a { font-size: 12px; font-weight: 600; color: #3B82F6; }
        .split-label-b { font-size: 12px; font-weight: 600; color: #06B6D4; }
        input[type=range] {
          width: 100%; height: 6px; appearance: none; background: none; outline: none; padding: 0; border: none;
          background: linear-gradient(to right, #3B82F6 0%, #3B82F6 ${split}%, #06B6D4 ${split}%, #06B6D4 100%);
          border-radius: 4px;
        }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); cursor: pointer; border: 2px solid #3B82F6; }
        .results-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .result-box { background: #0D1B2A; border-radius: 12px; padding: 18px; border: 1px solid rgba(255,255,255,0.06); text-align: center; }
        .result-val { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: white; margin-bottom: 4px; }
        .result-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.6px; }
        .carriers-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .carrier-panel { background: #0D1B2A; border-radius: 12px; border: 2px solid; padding: 20px; }
        .cp-name { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: white; margin-bottom: 4px; }
        .cp-type { font-size: 12px; color: #64748B; margin-bottom: 14px; }
        .cp-split { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; margin-bottom: 4px; }
        .cp-stat { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 13px; color: #94A3B8; }
        .cp-stat:last-child { border-bottom: none; }
        .cp-stat strong { color: white; }
        .recommendation-box { background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.25); border-radius: 12px; padding: 18px; }
        .rec-title { font-size: 12px; font-weight: 600; color: #3B82F6; margin-bottom: 8px; }
        .rec-text { font-size: 14px; color: #CBD5E1; line-height: 1.6; }
      `}</style>

      <div className="page">
        <TopBar title="Award Simulation — Split Optimizer" />
        <div className="page-wrapper">

          <div className="card">
            <div className="card-title">⟁ Award Split Simulator</div>
            <div className="card-sub">Select two carriers and simulate different award splits. FreightMind shows blended risk, cost, and reliability in real time.</div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Carrier A</label>
                <select value={form.carrier_a_id} onChange={e => setForm({...form, carrier_a_id: e.target.value})}>
                  <option value="">Select carrier A</option>
                  {carriers.map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Carrier B</label>
                <select value={form.carrier_b_id} onChange={e => setForm({...form, carrier_b_id: e.target.value})}>
                  <option value="">Select carrier B</option>
                  {carriers.filter(c => c.carrier_id !== form.carrier_a_id).map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Distance (km)</label>
                <input type="number" value={form.distance_km} onChange={e => setForm({...form, distance_km: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input type="number" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} />
              </div>
            </div>
            <button className="sim-btn" onClick={simulate}>⟁ Run Simulation</button>
          </div>

          {result && (
            <>
              {/* Split Slider */}
              <div className="card">
                <div className="split-section">
                  <div className="split-header">
                    <div className="split-title">Adjust Award Split</div>
                    <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 16, color: "white" }}>{split}% / {100 - split}%</div>
                  </div>
                  <div className="split-labels">
                    <span className="split-label-a">{result.carrier_a.carrier_name?.split(" ")[0]} — {split}%</span>
                    <span className="split-label-b">{result.carrier_b.carrier_name?.split(" ")[0]} — {100 - split}%</span>
                  </div>
                  <input type="range" min="10" max="90" step="10" value={split} onChange={e => setSplit(parseInt(e.target.value))} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                    {[10,20,30,40,50,60,70,80,90].map(v => <span key={v} style={{ fontSize: 10, color: "#64748B" }}>{v}</span>)}
                  </div>
                </div>

                <div className="results-grid">
                  <div className="result-box">
                    <div className="result-val">{result.simulation.blended_score}</div>
                    <div className="result-lbl">Blended Score</div>
                    <div style={{ marginTop: 8 }}><RiskBadge risk={result.simulation.blended_risk} /></div>
                  </div>
                  <div className="result-box">
                    <div className="result-val" style={{ color: "#10B981" }}>{result.simulation.blended_ontime_pct}%</div>
                    <div className="result-lbl">Expected On-Time</div>
                  </div>
                  <div className="result-box">
                    <div className="result-val" style={{ color: "#3B82F6", fontSize: 20 }}>{formatINR(result.simulation.expected_cost_inr)}</div>
                    <div className="result-lbl">Expected Cost</div>
                  </div>
                </div>

                <div className="recommendation-box">
                  <div className="rec-title">⬡ AI Recommendation</div>
                  <div className="rec-text">{result.simulation.recommendation}</div>
                </div>
              </div>

              {/* Carrier Panels */}
              <div className="carriers-compare">
                <div className="carrier-panel" style={{ borderColor: "rgba(59,130,246,0.4)" }}>
                  <div className="cp-name">{result.carrier_a.carrier_name}</div>
                  <div className="cp-type">Carrier A</div>
                  <div className="cp-split" style={{ color: "#3B82F6" }}>{split}%</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>award allocation</div>
                  {[["Bid Price", formatINR(result.carrier_a.bid_price_inr)],["On-Time Rate", `${result.carrier_a.on_time_rate_pct}%`],["Score", result.carrier_a.composite_score]].map(([l,v],i)=><div className="cp-stat" key={i}><span>{l}</span><strong>{v}</strong></div>)}
                  {result.carrier_a.negotiation?.signal && <div style={{ marginTop: 12, fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "8px 12px", borderRadius: 8 }}>⚡ {result.carrier_a.negotiation.message}</div>}
                </div>

                <div className="carrier-panel" style={{ borderColor: "rgba(6,182,212,0.4)" }}>
                  <div className="cp-name">{result.carrier_b.carrier_name}</div>
                  <div className="cp-type">Carrier B</div>
                  <div className="cp-split" style={{ color: "#06B6D4" }}>{100 - split}%</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>award allocation</div>
                  {[["Bid Price", formatINR(result.carrier_b.bid_price_inr)],["On-Time Rate", `${result.carrier_b.on_time_rate_pct}%`],["Score", result.carrier_b.composite_score]].map(([l,v],i)=><div className="cp-stat" key={i}><span>{l}</span><strong>{v}</strong></div>)}
                  {result.carrier_b.negotiation?.signal && <div style={{ marginTop: 12, fontSize: 12, color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "8px 12px", borderRadius: 8 }}>⚡ {result.carrier_b.negotiation.message}</div>}
                </div>
              </div>

              {/* Score across splits chart */}
              <div className="card">
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, color: "#94A3B8", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 14 }}>Score & Cost Across Split Ratios</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={result.split_range}>
                    <XAxis dataKey="split_a" tickFormatter={v => `${v}/${100-v}`} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [typeof v === "number" ? v.toFixed(1) : v, n === "blended_score" ? "Score" : "On-Time %"]} />
                    <ReferenceLine x={split} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="blended_score"      stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="blended_ontime_pct" stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
