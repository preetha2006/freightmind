export default function KPICard({ title, value, subtitle, icon, trend, color = "blue" }) {
  const colors = {
    blue:    { bg: "rgba(37,99,235,0.1)",   border: "rgba(37,99,235,0.25)",   accent: "#3B82F6" },
    green:   { bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)",  accent: "#10B981" },
    amber:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  accent: "#F59E0B" },
    red:     { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   accent: "#EF4444" },
    cyan:    { bg: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.25)",   accent: "#06B6D4" },
    purple:  { bg: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.25)",  accent: "#8B5CF6" },
  };

  const c = colors[color] || colors.blue;

  return (
    <>
      <style>{`
        .kpi-card {
          background: #112236;
          border-radius: 14px;
          padding: 22px;
          border: 1px solid var(--border, rgba(37,99,235,0.18));
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }
        .kpi-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${c.accent}, transparent);
          opacity: 0.8;
        }
        .kpi-inner {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .kpi-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: ${c.bg};
          border: 1px solid ${c.border};
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .kpi-body { flex: 1; }
        .kpi-title {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: #64748B;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: white;
          line-height: 1;
          margin-bottom: 6px;
        }
        .kpi-subtitle {
          font-size: 12px;
          color: #64748B;
        }
        .kpi-trend {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
          margin-top: 8px;
        }
        .trend-up   { background: rgba(16,185,129,0.15); color: #10B981; }
        .trend-down { background: rgba(239,68,68,0.15);  color: #EF4444; }
        .trend-flat { background: rgba(100,116,139,0.15); color: #94A3B8; }
      `}</style>

      <div className="kpi-card">
        <div className="kpi-inner">
          <div className="kpi-body">
            <div className="kpi-title">{title}</div>
            <div className="kpi-value">{value}</div>
            {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
            {trend && (
              <div className={`kpi-trend ${trend.direction === "up" ? "trend-up" : trend.direction === "down" ? "trend-down" : "trend-flat"}`}>
                {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "—"} {trend.label}
              </div>
            )}
          </div>
          {icon && <div className="kpi-icon">{icon}</div>}
        </div>
      </div>
    </>
  );
}