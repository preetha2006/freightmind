import { useState, useEffect } from "react";
import axios from "axios";
import { TopBar } from "../components/Navbar";

const API = "http://127.0.0.1:8000/api";

const OUTCOMES = [
  { value: "on_time",  label: "✅ On Time",      color: "#10B981", bg: "rgba(16,185,129,0.1)"  },
  { value: "delayed",  label: "⏱ Delayed",       color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  { value: "damaged",  label: "⚠️ Damaged",       color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
  { value: "lost",     label: "❌ Lost",           color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
];

export default function FeedbackLoop() {
  const [carriers, setCarriers]   = useState([]);
  const [submitted, setSubmitted] = useState([]);
  const [form, setForm]           = useState({ shipment_id: "", carrier_id: "", outcome: "on_time", feedback_rating: 4, comments: "" });
  const [success, setSuccess]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [stats, setStats]         = useState({ total: 0, on_time: 0, delayed: 0, damaged: 0, lost: 0 });

  useEffect(() => {
    axios.get(`${API}/carriers`).then(r => setCarriers(r.data.carriers));
    axios.get(`${API}/feedback`).then(r => {
      setSubmitted(r.data.feedbacks || []);
      computeStats(r.data.feedbacks || []);
    });
  }, []);

  const computeStats = (data) => {
    const s = { total: data.length, on_time: 0, delayed: 0, damaged: 0, lost: 0 };
    data.forEach(f => { if (s[f.outcome] !== undefined) s[f.outcome]++; });
    setStats(s);
  };

  const handleSubmit = async () => {
    if (!form.shipment_id || !form.carrier_id) return;
    setLoading(true);
    await axios.post(`${API}/feedback`, form);
    const updated = [...submitted, { ...form }];
    setSubmitted(updated);
    computeStats(updated);
    setForm({ shipment_id: "", carrier_id: "", outcome: "on_time", feedback_rating: 4, comments: "" });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  };

  const STARS = [1,2,3,4,5];

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .page-wrapper { padding: 28px; }
        .layout { display: grid; grid-template-columns: 420px 1fr; gap: 20px; align-items: start; }
        .card { background: #112236; border-radius: 14px; border: 1px solid rgba(37,99,235,0.18); padding: 24px; margin-bottom: 20px; }
        .card-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: white; margin-bottom: 6px; }
        .card-sub { font-size: 13px; color: #64748B; margin-bottom: 20px; }
        .form-group { margin-bottom: 16px; }
        .form-label { font-size: 11px; font-weight: 600; color: #64748B; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 6px; display: block; }
        input, select, textarea { width: 100%; background: #0D1B2A; border: 1px solid rgba(37,99,235,0.25); border-radius: 10px; padding: 11px 14px; color: white; font-size: 14px; font-family: 'DM Sans', sans-serif; outline: none; appearance: none; box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #3B82F6; }
        textarea { resize: vertical; min-height: 80px; }
        .outcome-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .outcome-btn {
          padding: 10px 14px; border-radius: 10px; cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08); background: transparent;
          font-size: 13px; font-weight: 600; color: #64748B;
          transition: all 0.15s; text-align: center; font-family: 'DM Sans', sans-serif;
        }
        .outcome-btn.selected { transform: scale(1.02); }
        .rating-stars { display: flex; gap: 8px; margin-top: 6px; }
        .star { font-size: 24px; cursor: pointer; transition: transform 0.15s; filter: grayscale(1); opacity: 0.4; }
        .star.active { filter: none; opacity: 1; transform: scale(1.1); }
        .star:hover { transform: scale(1.2); }
        .submit-btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #2563EB, #06B6D4); border: none; border-radius: 12px; color: white; font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; transition: all 0.2s; }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.4); }
        .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .success-banner { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 10px; padding: 12px 16px; color: #10B981; font-size: 14px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
        .stat-pill { background: #0D1B2A; border-radius: 10px; padding: 14px; text-align: center; border: 1px solid rgba(255,255,255,0.06); }
        .stat-val { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: white; }
        .stat-lbl { font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 4px; }
        .fb-list { max-height: 500px; overflow-y: auto; }
        .fb-item { padding: 14px; border-radius: 10px; background: #0D1B2A; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px; }
        .fb-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .fb-id { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #3B82F6; }
        .fb-carrier { font-size: 12px; color: #64748B; }
        .fb-comment { font-size: 13px; color: #94A3B8; margin-top: 6px; font-style: italic; }
        .empty-state { text-align: center; padding: 60px 20px; color: #64748B; }
        .empty-icon { font-size: 40px; opacity: 0.3; margin-bottom: 12px; }
        .model-badge { display: flex; align-items: center; gap: 8px; background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.2); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
        .model-text { font-size: 13px; color: #CBD5E1; }
        .model-accent { color: #3B82F6; font-weight: 600; }
      `}</style>

      <div className="page">
        <TopBar title="Feedback Loop — Model Training" />
        <div className="page-wrapper">

          <div className="model-badge">
            <span style={{ fontSize: 20 }}>🧠</span>
            <div className="model-text">
              Every feedback you submit helps FreightMind learn. The AI model <span className="model-accent">retrains on your corrections</span>, improving carrier recommendations over time.
            </div>
          </div>

          <div className="layout">

            {/* Form */}
            <div className="card">
              <div className="card-title">◇ Submit Shipment Feedback</div>
              <div className="card-sub">Mark outcomes for completed shipments to improve future AI recommendations.</div>

              {success && <div className="success-banner">✓ Feedback recorded! Model will improve on next cycle.</div>}

              <div className="form-group">
                <label className="form-label">Shipment ID</label>
                <input placeholder="e.g. SHP-00123" value={form.shipment_id} onChange={e => setForm({...form, shipment_id: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Carrier</label>
                <select value={form.carrier_id} onChange={e => setForm({...form, carrier_id: e.target.value})}>
                  <option value="">Select carrier</option>
                  {carriers.map(c => <option key={c.carrier_id} value={c.carrier_id}>{c.carrier_name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Outcome</label>
                <div className="outcome-grid">
                  {OUTCOMES.map(o => (
                    <button
                      key={o.value}
                      className={`outcome-btn ${form.outcome === o.value ? "selected" : ""}`}
                      style={form.outcome === o.value ? { background: o.bg, borderColor: o.color, color: o.color } : {}}
                      onClick={() => setForm({...form, outcome: o.value})}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rating</label>
                <div className="rating-stars">
                  {STARS.map(s => (
                    <span key={s} className={`star ${s <= form.feedback_rating ? "active" : ""}`} onClick={() => setForm({...form, feedback_rating: s})}>⭐</span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Comments (optional)</label>
                <textarea placeholder="Describe the shipment experience..." value={form.comments} onChange={e => setForm({...form, comments: e.target.value})} />
              </div>

              <button className="submit-btn" onClick={handleSubmit} disabled={loading || !form.shipment_id || !form.carrier_id}>
                {loading ? "Submitting..." : "◇ Submit Feedback"}
              </button>
            </div>

            {/* Feedback History */}
            <div>
              <div className="stats-row">
                <div className="stat-pill"><div className="stat-val">{stats.total}</div><div className="stat-lbl">Total</div></div>
                <div className="stat-pill"><div className="stat-val" style={{ color: "#10B981" }}>{stats.on_time}</div><div className="stat-lbl">On Time</div></div>
                <div className="stat-pill"><div className="stat-val" style={{ color: "#F59E0B" }}>{stats.delayed}</div><div className="stat-lbl">Delayed</div></div>
                <div className="stat-pill"><div className="stat-val" style={{ color: "#EF4444" }}>{stats.damaged + stats.lost}</div><div className="stat-lbl">Issues</div></div>
              </div>

              <div className="card">
                <div className="card-title">Feedback History</div>
                {submitted.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">◇</div>
                    <div>No feedback submitted yet.</div>
                    <div style={{ fontSize: 12, marginTop: 6 }}>Submit your first shipment outcome to start training the model.</div>
                  </div>
                ) : (
                  <div className="fb-list">
                    {[...submitted].reverse().map((f, i) => {
                      const o = OUTCOMES.find(x => x.value === f.outcome) || OUTCOMES[0];
                      const carrierName = carriers.find(c => c.carrier_id === f.carrier_id)?.carrier_name || f.carrier_id;
                      return (
                        <div className="fb-item" key={i}>
                          <div className="fb-header">
                            <div>
                              <div className="fb-id">{f.shipment_id}</div>
                              <div className="fb-carrier">{carrierName}</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 12, background: o.bg, color: o.color, padding: "3px 10px", borderRadius: 20, fontWeight: 600, border: `1px solid ${o.color}40` }}>{o.label}</span>
                              <span style={{ fontSize: 13, color: "#F59E0B" }}>{"⭐".repeat(f.feedback_rating)}</span>
                            </div>
                          </div>
                          {f.comments && <div className="fb-comment">"{f.comments}"</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}