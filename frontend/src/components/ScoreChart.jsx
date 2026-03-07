import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell,
} from "recharts";

/* ── SHAP / Factor Bar Chart ─────────────────────────────────────────────── */
export function FactorChart({ factors }) {
  if (!factors) return null;

  const data = Object.entries(factors).map(([key, val]) => ({
    label: key.replace(/_score$/, "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    value: Math.round(val),
  })).sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "#0D1B2A", border: "1px solid rgba(37,99,235,0.3)", borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 4 }}>{payload[0].payload.label}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "white", fontFamily: "Syne, sans-serif" }}>{payload[0].value}</div>
          <div style={{ fontSize: 10, color: "#64748B" }}>out of 100</div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <style>{`
        .chart-wrap {
          background: #0D1B2A;
          border-radius: 12px;
          border: 1px solid rgba(37,99,235,0.15);
          padding: 20px;
        }
        .chart-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #94A3B8;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
      `}</style>
      <div className="chart-wrap">
        <div className="chart-title">Score Factor Breakdown</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={20}>
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.value >= 80 ? "#10B981" :
                    entry.value >= 60 ? "#3B82F6" :
                    entry.value >= 40 ? "#F59E0B" : "#EF4444"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

/* ── Radar Chart for carrier comparison ──────────────────────────────────── */
export function CarrierRadar({ carrier }) {
  if (!carrier) return null;

  const data = [
    { axis: "On-Time",   value: carrier.on_time_rate_pct ?? 0 },
    { axis: "Service",   value: (carrier.service_score_10 ?? 0) * 10 },
    { axis: "Safety",    value: Math.max(0, 100 - (carrier.damage_rate_pct ?? 2) * 15) },
    { axis: "Speed",     value: Math.max(0, 100 - (carrier.avg_delay_days ?? 5) * 8) },
    { axis: "Score",     value: carrier.composite_score ?? carrier.avg_score ?? 0 },
  ];

  return (
    <div className="chart-wrap" style={{ background: "#0D1B2A", borderRadius: 12, border: "1px solid rgba(37,99,235,0.15)", padding: 20 }}>
      <div className="chart-title" style={{ fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
        Performance Radar
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "#94A3B8", fontSize: 11 }} />
          <Radar
            name={carrier.carrier_name}
            dataKey="value"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Score Gauge ──────────────────────────────────────────────────────────── */
export function ScoreGauge({ score, label = "Overall Score" }) {
  const color =
    score >= 85 ? "#10B981" :
    score >= 70 ? "#3B82F6" :
    score >= 55 ? "#F59E0B" : "#EF4444";

  const circumference = 2 * Math.PI * 40;
  const filled = (score / 100) * circumference;

  return (
    <div style={{ textAlign: "center", padding: "10px" }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="55" cy="55" r="40"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        <text x="55" y="50" textAnchor="middle" fill="white" fontSize="20" fontWeight="800" fontFamily="Syne, sans-serif">{score}</text>
        <text x="55" y="65" textAnchor="middle" fill="#64748B" fontSize="9">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}

export default FactorChart;