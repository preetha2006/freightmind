export default function RiskBadge({ risk, size = "md" }) {
  const config = {
    Low:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  color: "#10B981", dot: "#10B981", label: "Low Risk"    },
    Medium: { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  color: "#F59E0B", dot: "#F59E0B", label: "Med Risk"    },
    High:   { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   color: "#EF4444", dot: "#EF4444", label: "High Risk"   },
  };

  const c = config[risk] || config["Medium"];

  const sizes = {
    sm: { padding: "3px 8px",  fontSize: "10px", dotSize: "5px"  },
    md: { padding: "5px 10px", fontSize: "11px", dotSize: "6px"  },
    lg: { padding: "7px 14px", fontSize: "13px", dotSize: "7px"  },
  };

  const s = sizes[size] || sizes.md;

  return (
    <span style={{
      display:        "inline-flex",
      alignItems:     "center",
      gap:            "5px",
      padding:        s.padding,
      borderRadius:   "20px",
      background:     c.bg,
      border:         `1px solid ${c.border}`,
      color:          c.color,
      fontSize:       s.fontSize,
      fontWeight:     "600",
      letterSpacing:  "0.3px",
      whiteSpace:     "nowrap",
    }}>
      <span style={{
        width:        s.dotSize,
        height:       s.dotSize,
        borderRadius: "50%",
        background:   c.dot,
        display:      "inline-block",
        animation:    risk === "High" ? "pulse 1.5s infinite" : "none",
      }} />
      {c.label}
    </span>
  );
}