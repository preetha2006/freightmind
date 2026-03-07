import { useEffect, useState } from "react";
import axios from "axios";
import KPICard from "../components/KPICard";
import { TopBar } from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

const API = "http://127.0.0.1:8000/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/dashboard`).then(r => {
      setData(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingScreen />;

  const { kpis, top_carriers, recent_shipments, monthly_trend, top_lanes } = data;

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700;
          color: #64748B; letter-spacing: 1px;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
        .grid-3 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 28px; }
        .card {
          background: #112236; border-radius: 14px;
          border: 1px solid rgba(37,99,235,0.18); padding: 22px;
        }
        .card-title {
          font-family: 'Syne', sans-serif; font-size: 14px;
          font-weight: 700; color: white; margin-bottom: 18px;
          display: flex; align-items: center; gap: 8px;
        }
        table { width: 100%; border-collapse: collapse; }
        th {
          font-size: 11px; font-weight: 600; color: #64748B;
          text-transform: uppercase; letter-spacing: 0.8px;
          padding: 8px 12px; text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        td {
          padding: 12px 12px; font-size: 13px; color: #CBD5E1;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        tr:last-child td { border-bottom: none; }
        tr:hover td { background: rgba(255,255,255,0.02); }
        .carrier-bar-row {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 14px;
        }
        .carrier-bar-name { font-size: 13px; color: #CBD5E1; width: 160px; flex-shrink: 0; }
        .bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.07); border-radius: 4px; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 4px; }
        .bar-score { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: white; width: 36px; text-align: right; }
        .chip {
          display: inline-block; padding: 3px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 600;
        }
        .chip-yes { background: rgba(16,185,129,0.12); color: #10B981; }
        .chip-no  { background: rgba(239,68,68,0.12);  color: #EF4444; }
        .lane-chip {
          font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
          background: rgba(37,99,235,0.12); color: #3B82F6;
          padding: 4px 10px; border-radius: 6px;
          border: 1px solid rgba(37,99,235,0.2);
        }
        .ctt { color: #94A3B8; font-size: 13px; }
        @media (max-width: 900px) { .grid-4 { grid-template-columns: 1fr 1fr; } .grid-3 { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page">
        <TopBar title="Dashboard — Overview" />
        <div className="page-wrapper">

          {/* KPIs */}
          <div className="grid-4">
            <KPICard title="Total Shipments"    value={kpis.total_shipments.toLocaleString()} icon="📦" color="blue"   trend={{ direction: "up", label: "2 year data" }} />
            <KPICard title="On-Time Rate"        value={`${kpis.on_time_rate_pct}%`}           icon="⚡" color="green"  trend={{ direction: "up", label: "Above avg" }} />
            <KPICard title="High Risk Alerts"    value={kpis.high_risk_alerts.toLocaleString()} icon="⚠️" color="red"   trend={{ direction: "down", label: "Need attention" }} />
            <KPICard title="Avg Carrier Score"   value={kpis.avg_carrier_score}                 icon="⬡" color="cyan"   trend={{ direction: "up", label: "Strong" }} />
          </div>
          <div className="grid-4">
            <KPICard title="Active Carriers"     value={kpis.total_carriers}                    icon="🚛" color="purple" />
            <KPICard title="Total Lanes"          value={kpis.total_lanes}                       icon="🗺️" color="blue" />
            <KPICard title="Negotiation Opps"     value={kpis.negotiation_opportunities}         icon="💡" color="amber" />
            <KPICard title="Avg Savings"          value={`${kpis.avg_savings_pct}%`}             icon="💰" color="green" />
          </div>

          {/* Trend + Top Carriers */}
          <div className="grid-3">
            <div className="card">
              <div className="card-title">📈 Monthly Shipment Trend</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly_trend.slice(-12)}>
                  <XAxis dataKey="month" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="shipments" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="avg_score"  stroke="#10B981" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
                <span style={{ fontSize: 11, color: "#3B82F6" }}>— Shipments</span>
                <span style={{ fontSize: 11, color: "#10B981" }}>- - Avg Score</span>
              </div>
            </div>

            <div className="card">
              <div className="card-title">🏆 Top Carriers</div>
              {top_carriers.map((c, i) => {
                const color = c.avg_score >= 85 ? "#10B981" : c.avg_score >= 70 ? "#3B82F6" : "#F59E0B";
                return (
                  <div className="carrier-bar-row" key={i}>
                    <div className="carrier-bar-name">{c.carrier_name.split(" ")[0]}</div>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${c.avg_score}%`, background: color }} />
                    </div>
                    <div className="bar-score">{c.avg_score}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Shipments + Top Lanes */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">🕐 Recent Shipments</div>
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Lane</th><th>Carrier</th><th>Score</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_shipments.map((s, i) => (
                    <tr key={i}>
                      <td><span style={{ fontFamily: "Syne, sans-serif", fontSize: 12, color: "#3B82F6" }}>{s.shipment_id}</span></td>
                      <td><span className="lane-chip">{s.origin?.slice(0,3).toUpperCase()}→{s.destination?.slice(0,3).toUpperCase()}</span></td>
                      <td className="ctt">{s.carrier_name?.split(" ")[0]}</td>
                      <td><span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, color: s.carrier_score >= 80 ? "#10B981" : "#F59E0B" }}>{s.carrier_score}</span></td>
                      <td><RiskBadge risk={s.risk_level} size="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card">
              <div className="card-title">🗺️ Top Lanes by Volume</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={top_lanes} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="lane" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: "#0D1B2A", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={16}>
                    {top_lanes.map((_, i) => <Cell key={i} fill={i < 3 ? "#3B82F6" : "#1E3A5F"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

function LoadingScreen() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0D1B2A" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⬡</div>
        <div style={{ fontFamily: "Syne, sans-serif", fontSize: 18, fontWeight: 700, color: "white" }}>Loading FreightMind...</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 8 }}>Fetching intelligence data</div>
      </div>
    </div>
  );
}