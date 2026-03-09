import { API_BASE } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import { TopBar } from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";
import { CarrierRadar, ScoreGauge } from "../components/ScoreChart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const API = "http://127.0.0.1:8000/api";

export default function CarrierScorecard() {
  const [carriers, setCarriers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    axios.get(`${API}/carriers`).then(r => setCarriers(r.data.carriers));
  }, []);

  const loadDetail = async (carrier) => {
    setSelected(carrier);
    setLoading(true);
    setDetail(null);
    const r = await axios.get(`${API}/carrier/${carrier.carrier_id}`);
    setDetail(r.data);
    setLoading(false);
  };

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .layout { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
        .carrier-list { display: flex; flex-direction: column; gap: 8px; }
        .carrier-list-item {
          background: #112236; border: 1px solid rgba(37,99,235,0.15);
          border-radius: 12px; padding: 14px 16px;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: space-between;
        }
        .carrier-list-item:hover { border-color: rgba(37,99,235,0.4); background: #162840; }
        .carrier-list-item.active { border-color: #3B82F6; background: rgba(37,99,235,0.1); }
        .cli-name { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: white; margin-bottom: 3px; }
        .cli-type { font-size: 11px; color: #64748B; }
        .cli-score { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; }
        .detail-card {
          background: #112236; border-radius: 16px;
          border: 1px solid rgba(37,99,235,0.18); padding: 28px;
        }
        .detail-header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .detail-name { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: white; }
        .detail-meta { font-size: 13px; color: #64748B; margin-top: 4px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 24px; }
        .stat-card { background: #0D1B2A; border-radius: 10px; padding: 16px; border: 1px solid rgba(255,255,255,0.06); }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: white; margin-bottom: 4px; }
        .stat-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.6px; }
        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .card { background: #0D1B2A; border-radius: 12px; border: 1px solid rgba(37,99,235,0.12); padding: 18px; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #94A3B8; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 14px; }
        .explain-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .explain-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .explain-label { font-size: 13px; color: #CBD5E1; flex: 1; }
        .explain-note { font-size: 12px; color: #64748B; }
        .placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #64748B; gap: 12px; }
        .placeholder-icon { font-size: 48px; opacity: 0.3; }
        .placeholder-text { font-size: 15px; }
        .lane-tag { display: inline-block; background: rgba(37,99,235,0.1); color: #3B82F6; border-radius: 6px; padding: 3px 10px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; margin: 3px; border: 1px solid rgba(37,99,235,0.2); }
      `}</style>

      <div className="page">
        <TopBar title="Carrier Scorecard" />
        <div className="page-wrapper">
          <div className="layout">

            {/* Carrier List */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                {carriers.length} Carriers
              </div>
              <div className="carrier-list">
                {carriers.map(c => {
                  const color = c.avg_score >= 85 ? "#10B981" : c.avg_score >= 70 ? "#3B82F6" : "#F59E0B";
                  return (
                    <div key={c.carrier_id} className={`carrier-list-item ${selected?.carrier_id === c.carrier_id ? "active" : ""}`} onClick={() => loadDetail(c)}>
                      <div>
                        <div className="cli-name">{c.carrier_name.split(" ")[0]}{c.carrier_name.split(" ")[1] ? " " + c.carrier_name.split(" ")[1] : ""}</div>
                        <div className="cli-type">{c.type} · {c.hq}</div>
                      </div>
                      <div className="cli-score" style={{ color }}>{c.avg_score}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="detail-card">
              {!selected && (
                <div className="placeholder">
                  <div className="placeholder-icon">◎</div>
                  <div className="placeholder-text">Select a carrier to view scorecard</div>
                </div>
              )}

              {loading && (
                <div className="placeholder">
                  <div className="placeholder-icon" style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⬡</div>
                  <div className="placeholder-text">Loading carrier intelligence...</div>
                </div>
              )}

              {detail && !loading && (() => {
                const { carrier, stats, top_lanes, monthly_perf, explanation } = detail;
                const score = stats.avg_score;
                const scoreColor = score >= 85 ? "#10B981" : score >= 70 ? "#3B82F6" : "#F59E0B";
                return (
                  <>
                    <div className="detail-header">
                      <ScoreGauge score={score} label="Avg Score" />
                      <div>
                        <div className="detail-name">{carrier.carrier_name}</div>
                        <div className="detail-meta">{carrier.type} · {carrier.hq} · {carrier.coverage}</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                          <RiskBadge risk={carrier.risk_level || (score >= 80 ? "Low" : score >= 60 ? "Medium" : "High")} />
                          {carrier.iso_certified === "Yes" && <span style={{ fontSize: 11, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(16,185,129,0.2)" }}>✓ ISO Certified</span>}
                        </div>
                      </div>
                    </div>

                    <div className="stats-grid">
                      {[
                        { val: `${stats.on_time_pct}%`,   lbl: "On-Time Rate"     },
                        { val: `${stats.damage_pct}%`,    lbl: "Damage Rate"      },
                        { val: stats.total_shipments,      lbl: "Total Shipments"  },
                        { val: `${carrier.service_score_10}/10`, lbl: "Service Score" },
                        { val: `₹${Math.round(stats.avg_bid_inr).toLocaleString("en-IN")}`, lbl: "Avg Bid Price" },
                        { val: stats.unique_lanes,         lbl: "Active Lanes"     },
                      ].map((s, i) => (
                        <div className="stat-card" key={i}>
                          <div className="stat-val" style={{ color: i === 0 ? "#10B981" : i === 1 ? "#EF4444" : "white" }}>{s.val}</div>
                          <div className="stat-lbl">{s.lbl}</div>
                        </div>
                      ))}
                    </div>

                    <div className="charts-grid">
                      <div className="card">
                        <div className="card-title">Performance Trend</div>
                        <ResponsiveContainer width="100%" height={160}>
                          <LineChart data={monthly_perf.slice(-12)}>
                            <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748B", fontSize: 9 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, fontSize: 11 }} />
                            <Line type="monotone" dataKey="on_time_pct" stroke="#10B981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="avg_score"   stroke="#3B82F6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <CarrierRadar carrier={{ ...carrier, composite_score: score, avg_score: score }} />
                    </div>

                    <div className="charts-grid">
                      <div className="card">
                        <div className="card-title">Top Lanes</div>
                        {top_lanes.slice(0, 8).map((l, i) => (
                          <span key={i} className="lane-tag">{l.lane} <span style={{ color: "#64748B" }}>·{l.count}</span></span>
                        ))}
                      </div>
                      <div className="card">
                        <div className="card-title">AI Explanation</div>
                        {explanation.map((e, i) => (
                          <div className="explain-item" key={i}>
                            <div className="explain-dot" style={{ background: e.impact === "positive" ? "#10B981" : e.impact === "negative" ? "#EF4444" : "#F59E0B" }} />
                            <div>
                              <div className="explain-label">{e.label}: <strong style={{ color: "white" }}>{e.value}</strong></div>
                              <div className="explain-note">{e.note}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
