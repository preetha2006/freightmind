import { API_BASE } from "../config";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { TopBar } from "../components/Navbar";
import RiskBadge from "../components/RiskBadge";

const API = "http://127.0.0.1:8000/api";

const CITY_COORDS = {
  Mumbai:        [19.0760,  72.8777],
  Delhi:         [28.6139,  77.2090],
  Bengaluru:     [12.9716,  77.5946],
  Chennai:       [13.0827,  80.2707],
  Hyderabad:     [17.3850,  78.4867],
  Pune:          [18.5204,  73.8567],
  Ahmedabad:     [23.0225,  72.5714],
  Kolkata:       [22.5726,  88.3639],
  Jaipur:        [26.9124,  75.7873],
  Surat:         [21.1702,  72.8311],
  Lucknow:       [26.8467,  80.9462],
  Kanpur:        [26.4499,  80.3319],
  Nagpur:        [21.1458,  79.0882],
  Indore:        [22.7196,  75.8577],
  Coimbatore:    [11.0168,  76.9558],
  Kochi:         [9.9312,   76.2673],
  Bhopal:        [23.2599,  77.4126],
  Visakhapatnam: [17.6868,  83.2185],
  Vadodara:      [22.3072,  73.1812],
  Ludhiana:      [30.9010,  75.8573],
};

const getLaneColor = (risk) =>
  risk === "Low" ? "#10B981" : risk === "High" ? "#EF4444" : "#F59E0B";

export default function LaneMap() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef  = useRef(null);
  const layersRef       = useRef([]);

  const [lanes, setLanes]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [status, setStatus]     = useState("loading"); // loading | ready | error

  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);

  // ── Step 1: load Leaflet CSS + JS then init map ──────────────────
  useEffect(() => {
    let cancelled = false;

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload  = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    function loadCss(href) {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement("link");
      l.rel  = "stylesheet";
      l.href = href;
      document.head.appendChild(l);
    }

    async function init() {
      try {
        loadCss("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        await loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js");

        if (cancelled || !mapContainerRef.current) return;
        if (mapInstanceRef.current) return; // already inited

        const L = window.L;

        const map = L.map(mapContainerRef.current, {
          center:          [20.5937, 78.9629],
          zoom:            5,
          zoomControl:     true,
          scrollWheelZoom: true,
          attributionControl: false,
        });

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19 }
        ).addTo(map);

        mapInstanceRef.current = map;
        if (!cancelled) setStatus("ready");
      } catch (e) {
        console.error("Leaflet load error:", e);
        if (!cancelled) setStatus("error");
      }
    }

    init();

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Step 2: fetch lanes ───────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/lanes`)
      .then(r => setLanes(r.data.lanes || []))
      .catch(e => console.error("Lane fetch error:", e));
  }, []);

  // ── Step 3: draw lanes whenever map/data/filter/selected changes ──
  useEffect(() => {
    if (status !== "ready" || !mapInstanceRef.current || !window.L) return;
    const L   = window.L;
    const map = mapInstanceRef.current;

    // Clear previous layers
    layersRef.current.forEach(l => { try { map.removeLayer(l); } catch(_){} });
    layersRef.current = [];

    const visible = lanes.filter(l => {
      const matchRisk   = filter === "all" || l.risk_level === filter;
      const matchSearch = !search ||
        l.lane?.toLowerCase().includes(search.toLowerCase()) ||
        l.origin?.toLowerCase().includes(search.toLowerCase()) ||
        l.destination?.toLowerCase().includes(search.toLowerCase());
      return matchRisk && matchSearch;
    }).slice(0, 60);

    // Draw routes
    visible.forEach(lane => {
      const o = CITY_COORDS[lane.origin];
      const d = CITY_COORDS[lane.destination];
      if (!o || !d) return;

      const isSel  = selected?.lane === lane.lane;
      const color  = isSel ? "#60A5FA" : getLaneColor(lane.risk_level);

      const line = L.polyline([o, d], {
        color,
        weight:    isSel ? 4 : 2,
        opacity:   isSel ? 1 : 0.6,
        dashArray: lane.risk_level === "High" && !isSel ? "6 5" : null,
      }).addTo(map);

      line.bindPopup(`
        <div style="font-family:sans-serif;min-width:190px;padding:4px">
          <div style="font-weight:800;font-size:15px;color:#1e3a5f;margin-bottom:4px">${lane.lane}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:10px">${lane.origin} → ${lane.destination}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:#f8fafc;border-radius:6px;padding:7px 10px">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">SCORE</div>
              <div style="font-weight:700;color:#1e3a5f">${lane.avg_score}</div>
            </div>
            <div style="background:#f8fafc;border-radius:6px;padding:7px 10px">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">ON-TIME</div>
              <div style="font-weight:700;color:#1e3a5f">${lane.on_time_pct}%</div>
            </div>
            <div style="background:#f8fafc;border-radius:6px;padding:7px 10px">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">TRIPS</div>
              <div style="font-weight:700;color:#1e3a5f">${lane.total_shipments}</div>
            </div>
            <div style="background:#f8fafc;border-radius:6px;padding:7px 10px">
              <div style="font-size:10px;color:#94a3b8;margin-bottom:2px">RISK</div>
              <div style="font-weight:700;color:${getLaneColor(lane.risk_level)}">${lane.risk_level}</div>
            </div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#64748b">
            Top carrier: <strong>${lane.top_carrier || "—"}</strong>
          </div>
        </div>
      `, { maxWidth: 240 });

      line.on("click", () => setSelected(prev =>
        prev?.lane === lane.lane ? null : lane
      ));
      layersRef.current.push(line);
    });

    // Draw city dots
    const citySet = new Set();
    visible.forEach(l => { if (l.origin) citySet.add(l.origin); if (l.destination) citySet.add(l.destination); });

    citySet.forEach(city => {
      const coords = CITY_COORDS[city];
      if (!coords) return;
      const isActive = selected?.origin === city || selected?.destination === city;

      const dot = L.circleMarker(coords, {
        radius:      isActive ? 8 : 5,
        fillColor:   isActive ? "#60A5FA" : "#2563EB",
        color:       isActive ? "#93C5FD" : "#1E40AF",
        weight:      isActive ? 2 : 1,
        opacity:     1,
        fillOpacity: isActive ? 1 : 0.85,
      }).addTo(map);

      dot.bindTooltip(city, {
        permanent:  false,
        direction:  "top",
        className:  "fm-tooltip",
        offset:     [0, -6],
      });

      layersRef.current.push(dot);
    });

  }, [status, lanes, filter, search, selected]);

  // ── Fly to selected lane ──────────────────────────────────────────
  useEffect(() => {
    if (!selected || !mapInstanceRef.current) return;
    const o = CITY_COORDS[selected.origin];
    const d = CITY_COORDS[selected.destination];
    if (!o || !d) return;
    const center = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
    mapInstanceRef.current.flyTo(center, 6, { duration: 1 });
  }, [selected]);

  const filtered = lanes.filter(l => {
    const matchRisk   = filter === "all" || l.risk_level === filter;
    const matchSearch = !search ||
      l.lane?.toLowerCase().includes(search.toLowerCase()) ||
      l.origin?.toLowerCase().includes(search.toLowerCase()) ||
      l.destination?.toLowerCase().includes(search.toLowerCase());
    return matchRisk && matchSearch;
  });

  return (
    <>
      <style>{`
        .page { min-height: 100vh; background: #0D1B2A; }
        .pw   { padding: 24px; }
        .layout { display: grid; grid-template-columns: 1fr 360px; gap: 18px; align-items: start; }

        .map-card { background: #112236; border-radius: 16px; border: 1px solid rgba(37,99,235,0.18); padding: 20px; }
        .map-title { font-family: 'Syne',sans-serif; font-size: 16px; font-weight: 800; color: white; margin-bottom: 3px; }
        .map-sub { font-size: 12px; color: #64748B; margin-bottom: 14px; }

        .legend { display: flex; gap: 18px; margin-bottom: 14px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #94A3B8; }
        .ldot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        .map-wrap { width: 100%; height: 520px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(37,99,235,0.2); position: relative; }
        .map-div  { width: 100%; height: 100%; }

        .map-overlay {
          position: absolute; inset: 0; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: rgba(13,27,42,0.85); border-radius: 12px;
          font-family: 'DM Sans', sans-serif; gap: 10px; z-index: 999;
        }
        .overlay-icon { font-size: 36px; animation: spin 1.2s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .overlay-text { font-size: 14px; color: #CBD5E1; }
        .overlay-sub  { font-size: 12px; color: #64748B; }

        .map-footer { font-size: 11px; color: #64748B; margin-top: 10px; text-align: center; }

        /* Leaflet popup */
        .leaflet-popup-content-wrapper { border-radius: 12px !important; box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important; }
        .leaflet-popup-tip-container   { display: none !important; }

        /* City tooltip */
        .fm-tooltip {
          background: #112236 !important; border: 1px solid rgba(37,99,235,0.35) !important;
          color: #CBD5E1 !important; font-family: 'DM Sans',sans-serif !important;
          font-size: 12px !important; font-weight: 600 !important;
          border-radius: 6px !important; padding: 3px 8px !important;
          box-shadow: none !important;
        }
        .fm-tooltip::before { display: none !important; }

        /* List card */
        .list-card { background: #112236; border-radius: 16px; border: 1px solid rgba(37,99,235,0.18); padding: 18px; display: flex; flex-direction: column; max-height: calc(100vh - 120px); }
        .list-title { font-family: 'Syne',sans-serif; font-size: 14px; font-weight: 800; color: white; margin-bottom: 12px; }
        .filter-row { display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
        .fb { padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1); background: transparent; color: #64748B; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'DM Sans',sans-serif; transition: all 0.15s; }
        .fa { background: rgba(37,99,235,0.15)!important;  color: #3B82F6!important; border-color: rgba(37,99,235,0.4)!important; }
        .fL { background: rgba(16,185,129,0.12)!important; color: #10B981!important; border-color: rgba(16,185,129,0.3)!important; }
        .fM { background: rgba(245,158,11,0.12)!important; color: #F59E0B!important; border-color: rgba(245,158,11,0.3)!important; }
        .fH { background: rgba(239,68,68,0.12)!important;  color: #EF4444!important; border-color: rgba(239,68,68,0.3)!important; }

        .srch { width: 100%; background: #0D1B2A; border: 1px solid rgba(37,99,235,0.2); border-radius: 8px; padding: 8px 12px; color: white; font-size: 13px; outline: none; margin-bottom: 8px; font-family: 'DM Sans',sans-serif; box-sizing: border-box; }
        .cnt  { font-size: 11px; color: #64748B; margin-bottom: 8px; }

        .lane-list { flex: 1; overflow-y: auto; }
        .lane-list::-webkit-scrollbar { width: 3px; }
        .lane-list::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.3); border-radius: 4px; }

        .li { padding: 11px 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; margin-bottom: 5px; border: 1px solid transparent; }
        .li:hover { background: rgba(255,255,255,0.03); border-color: rgba(37,99,235,0.2); }
        .li.sel   { background: rgba(37,99,235,0.1); border-color: rgba(37,99,235,0.35); }
        .lcode  { font-family: 'Syne',sans-serif; font-size: 13px; font-weight: 800; color: white; margin-bottom: 3px; }
        .lroute { font-size: 11px; color: #64748B; margin-bottom: 6px; }
        .lmeta  { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .lstat  { font-size: 11px; color: #94A3B8; }
        .lstat strong { color: #CBD5E1; }

        .dbox { margin-top: 12px; background: #0D1B2A; border-radius: 10px; padding: 14px; border: 1px solid rgba(37,99,235,0.15); flex-shrink: 0; }
        .dtitle { font-family: 'Syne',sans-serif; font-size: 11px; font-weight: 700; color: #3B82F6; margin-bottom: 10px; letter-spacing: 0.8px; text-transform: uppercase; }
        .drow { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; }
        .drow:last-child { border-bottom: none; }
      `}</style>

      <div className="page">
        <TopBar title="Lane Intelligence Map" />
        <div className="pw">
          <div className="layout">

            {/* ── MAP ── */}
            <div className="map-card">
              <div className="map-title">⊕ India Lane Intelligence Grid</div>
              <div className="map-sub">Real freight route network on live map — scroll to zoom, click any route for details</div>

              <div className="legend">
                {[["#10B981","Low Risk"],["#F59E0B","Medium Risk"],["#EF4444","High Risk"],["#60A5FA","Selected"]].map(([c,l])=>(
                  <div className="legend-item" key={l}><div className="ldot" style={{ background: c }}/>{l}</div>
                ))}
              </div>

              <div className="map-wrap">
                {/* Always render the div so Leaflet can attach */}
                <div className="map-div" ref={mapContainerRef} />

                {/* Overlay while loading */}
                {status === "loading" && (
                  <div className="map-overlay">
                    <span className="overlay-icon">⬡</span>
                    <div className="overlay-text">Loading map tiles...</div>
                    <div className="overlay-sub">Requires internet connection</div>
                  </div>
                )}
                {status === "error" && (
                  <div className="map-overlay">
                    <span style={{ fontSize: 32 }}>⚠</span>
                    <div className="overlay-text" style={{ color: "#EF4444" }}>Map failed to load</div>
                    <div className="overlay-sub">Check internet connection and refresh</div>
                  </div>
                )}
              </div>

              <div className="map-footer">
                {status === "ready"
                  ? `Showing ${Math.min(filtered.length, 60)} of ${filtered.length} lanes · Click any route for details · Hover city for name`
                  : "Initialising map..."
                }
              </div>
            </div>

            {/* ── LANE LIST ── */}
            <div className="list-card">
              <div className="list-title">Lane Directory</div>

              <div className="filter-row">
                {[["all","All","fa"],["Low","Low","fL"],["Medium","Medium","fM"],["High","High","fH"]].map(([val,lbl,cls])=>(
                  <button key={val} className={`fb ${filter===val ? cls : ""}`} onClick={()=>setFilter(val)}>{lbl}</button>
                ))}
              </div>

              <input className="srch" placeholder="Search lane or city..." value={search} onChange={e=>setSearch(e.target.value)} />
              <div className="cnt">{filtered.length} lanes found</div>

              <div className="lane-list">
                {filtered.map((lane, i) => (
                  <div key={i}
                    className={`li ${selected?.lane === lane.lane ? "sel" : ""}`}
                    onClick={() => setSelected(prev => prev?.lane === lane.lane ? null : lane)}
                  >
                    <div className="lcode">{lane.lane}</div>
                    <div className="lroute">{lane.origin} → {lane.destination}</div>
                    <div className="lmeta">
                      <RiskBadge risk={lane.risk_level} size="sm" />
                      <span className="lstat">Score: <strong>{lane.avg_score}</strong></span>
                      <span className="lstat"><strong>{lane.total_shipments}</strong> trips</span>
                    </div>
                  </div>
                ))}
              </div>

              {selected && (
                <div className="dbox">
                  <div className="dtitle">⊕ {selected.lane}</div>
                  {[
                    ["Route",       `${selected.origin} → ${selected.destination}`],
                    ["Shipments",   selected.total_shipments],
                    ["Avg Score",   selected.avg_score],
                    ["On-Time",     `${selected.on_time_pct}%`],
                    ["Avg Price",   `₹${Number(selected.avg_price).toLocaleString("en-IN",{maximumFractionDigits:0})}`],
                    ["Top Carrier", selected.top_carrier || "—"],
                    ["Risk",        selected.risk_level],
                  ].map(([k,v]) => (
                    <div className="drow" key={k}>
                      <span style={{ color:"#64748B" }}>{k}</span>
                      <strong style={{ color:"white" }}>{v}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
