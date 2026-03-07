import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/",           label: "Dashboard",     icon: "⬡" },
  { path: "/shipment",   label: "New Shipment",  icon: "◈" },
  { path: "/carriers",   label: "Carriers",      icon: "◎" },
  { path: "/bids",       label: "Bid Compare",   icon: "⊞" },
  { path: "/simulate",   label: "Award Sim",     icon: "⟁" },
  { path: "/lanes",      label: "Lane Map",      icon: "⊕" },
  { path: "/feedback",   label: "Feedback",      icon: "◇" },
];

export default function Navbar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --navy:    #0D1B2A;
          --navy2:   #112236;
          --blue:    #2563EB;
          --blue2:   #3B82F6;
          --cyan:    #06B6D4;
          --surface: #162032;
          --border:  rgba(37,99,235,0.18);
          --text:    #E2E8F0;
          --muted:   #64748B;
          --success: #10B981;
          --warning: #F59E0B;
          --danger:  #EF4444;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--navy);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
        }

        .layout {
          display: flex;
          min-height: 100vh;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: ${collapsed ? "72px" : "280px"};
          min-height: 100vh;
          background: var(--navy2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 100;
          overflow: hidden;
        }

        .sidebar-logo {
          padding: 24px 18px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
          white-space: nowrap;
        }

        .logo-mark {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--blue), var(--cyan));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 800;
          color: white;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(37,99,235,0.4);
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: white;
          letter-spacing: -0.3px;
        }

        .logo-sub {
          font-size: 10px;
          color: var(--muted);
          font-weight: 400;
          letter-spacing: 0.5px;
          margin-top: 1px;
        }

        .nav-section {
          padding: 16px 10px;
          flex: 1;
        }

        .nav-label {
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 1.5px;
          color: var(--muted);
          text-transform: uppercase;
          padding: 0 8px;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          color: var(--muted);
          margin-bottom: 2px;
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .nav-item:hover {
          background: rgba(37,99,235,0.1);
          color: var(--text);
        }

        .nav-item.active {
          background: rgba(37,99,235,0.15);
          color: white;
        }

        .nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; bottom: 20%;
          width: 3px;
          background: linear-gradient(180deg, var(--blue), var(--cyan));
          border-radius: 0 3px 3px 0;
        }

        .nav-icon {
          font-size: 16px;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-text {
          font-size: 13.5px;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .sidebar-footer {
          padding: 16px 10px;
          border-top: 1px solid var(--border);
        }

        .collapse-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 10px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          white-space: nowrap;
        }

        .collapse-btn:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text);
        }

        /* ── Main content ── */
        .main-content {
          margin-left: ${collapsed ? "72px" : "240px"};
          flex: 1;
          transition: margin-left 0.25s cubic-bezier(.4,0,.2,1);
          min-height: 100vh;
        }

        /* ── Top bar ── */
        .topbar {
          height: 60px;
          background: var(--navy2);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          position: sticky;
          top: 0;
          z-index: 50;
          backdrop-filter: blur(10px);
        }

        .topbar-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: white;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--success);
          background: rgba(16,185,129,0.1);
          padding: 5px 12px;
          border-radius: 20px;
          border: 1px solid rgba(16,185,129,0.2);
        }

        .dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--success);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .page-wrapper {
          padding: 28px;
        }
      `}</style>

      <div className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">F</div>
          {!collapsed && (
            <div>
              <div className="logo-text">FreightMind</div>
              <div className="logo-sub">CARRIER INTELLIGENCE</div>
            </div>
          )}
        </div>

        <div className="nav-section">
          {!collapsed && <div className="nav-label">Navigation</div>}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-text">{item.label}</span>}
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            <span className="nav-icon">{collapsed ? "»" : "«"}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </>
  );
}

export function TopBar({ title }) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="status-dot">
          <div className="dot" />
          AI Model Active
        </div>
      </div>
    </div>
  );
}