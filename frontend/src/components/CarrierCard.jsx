import RiskBadge from "./RiskBadge";

export default function CarrierCard({ carrier, rank, showDetails = true, onClick }) {
  const score = carrier.final_score ?? carrier.composite_score ?? carrier.avg_score ?? 0;

  const scoreColor =
    score >= 85 ? "#10B981" :
    score >= 70 ? "#F59E0B" : "#EF4444";

  const scoreGlow =
    score >= 85 ? "rgba(16,185,129,0.3)" :
    score >= 70 ? "rgba(245,158,11,0.3)" : "rgba(239,68,68,0.3)";

  const formatINR = (val) =>
    val ? `₹${Number(val).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";

  return (
    <>
      <style>{`
        .carrier-card {
          background: #112236;
          border: 1px solid rgba(37,99,235,0.18);
          border-radius: 14px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .carrier-card:hover {
          border-color: rgba(37,99,235,0.45);
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.35);
        }
        .carrier-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .carrier-rank {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: rgba(37,99,235,0.15);
          border: 1px solid rgba(37,99,235,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #3B82F6;
          flex-shrink: 0;
        }
        .rank-1 { background: rgba(245,158,11,0.15); border-color: rgba(245,158,11,0.4); color: #F59E0B; }
        .rank-2 { background: rgba(100,116,139,0.15); border-color: rgba(100,116,139,0.4); color: #94A3B8; }
        .rank-3 { background: rgba(180,83,9,0.15); border-color: rgba(180,83,9,0.4); color: #D97706; }

        .carrier-header { flex: 1; margin: 0 12px; }
        .carrier-name {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        .carrier-meta {
          font-size: 12px;
          color: #64748B;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .carrier-meta span {
          background: rgba(255,255,255,0.04);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .score-circle {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 2.5px solid ${scoreColor};
          display: flex; align-items: center; justify-content: center;
          flex-direction: column;
          box-shadow: 0 0 16px ${scoreGlow};
          flex-shrink: 0;
        }
        .score-num {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: ${scoreColor};
          line-height: 1;
        }
        .score-label {
          font-size: 8px;
          color: #64748B;
          letter-spacing: 0.5px;
        }

        .carrier-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 14px;
        }
        .stat-box {
          background: rgba(255,255,255,0.03);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .stat-val {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: white;
          margin-bottom: 3px;
        }
        .stat-lbl {
          font-size: 10px;
          color: #64748B;
          letter-spacing: 0.3px;
        }

        .carrier-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .bid-price {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }
        .bid-label { font-size: 11px; color: #64748B; }

        .neg-signal {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          background: rgba(245,158,11,0.12);
          color: #F59E0B;
          border: 1px solid rgba(245,158,11,0.25);
        }
        .neg-ok {
          background: rgba(16,185,129,0.1);
          color: #10B981;
          border-color: rgba(16,185,129,0.2);
        }

        .score-bar-wrap {
          margin: 12px 0;
        }
        .score-bar-bg {
          height: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 4px;
          overflow: hidden;
        }
        .score-bar-fill {
          height: 100%;
          border-radius: 4px;
          background: linear-gradient(90deg, ${scoreColor}88, ${scoreColor});
          width: ${score}%;
          transition: width 0.6s ease;
        }
      `}</style>

      <div className="carrier-card" onClick={onClick}>
        <div className="carrier-card-top">
          {rank && (
            <div className={`carrier-rank ${rank <= 3 ? `rank-${rank}` : ""}`}>
              #{rank}
            </div>
          )}
          <div className="carrier-header">
            <div className="carrier-name">{carrier.carrier_name}</div>
            <div className="carrier-meta">
              <span>{carrier.carrier_type ?? carrier.type}</span>
              <span>{carrier.hq}</span>
              {carrier.iso_certified === "Yes" && <span>✓ ISO</span>}
            </div>
          </div>
          <div className="score-circle">
            <div className="score-num">{score}</div>
            <div className="score-label">SCORE</div>
          </div>
        </div>

        <div className="score-bar-wrap">
          <div className="score-bar-bg">
            <div className="score-bar-fill" />
          </div>
        </div>

        {showDetails && (
          <>
            <div className="carrier-stats">
              <div className="stat-box">
                <div className="stat-val">{carrier.on_time_rate_pct}%</div>
                <div className="stat-lbl">On Time</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{carrier.damage_rate_pct}%</div>
                <div className="stat-lbl">Damage</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{carrier.service_score_10}/10</div>
                <div className="stat-lbl">Service</div>
              </div>
              <div className="stat-box">
                <div className="stat-val">{carrier.avg_delay_days}d</div>
                <div className="stat-lbl">Avg Delay</div>
              </div>
            </div>

            <div className="carrier-footer">
              <div>
                <div className="bid-price">{formatINR(carrier.bid_price_inr)}</div>
                <div className="bid-label">Bid Price</div>
              </div>
              <RiskBadge risk={carrier.risk_level} />
              {carrier.negotiation && (
                <div className={`neg-signal ${carrier.negotiation.signal ? "" : "neg-ok"}`}>
                  {carrier.negotiation.signal ? "⚡ Negotiate" : "✓ Fair Bid"}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}