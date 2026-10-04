import React from "react";

export default function ShiftDecisionBanner({ decision, domain }) {
  return (
    <div className="shift-decision-banner">
      <div className="shift-decision-meta">
        <span className="shift-decision-tag">DECISION UNDER CONSIDERATION</span>
        <span className="badge domain-badge">{domain}</span>
      </div>
      <h3 className="shift-decision-text">{decision}</h3>
    </div>
  );
}
