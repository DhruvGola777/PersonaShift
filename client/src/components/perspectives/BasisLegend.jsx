import React from "react";

export default function BasisLegend() {
  return (
    <div className="basis-legend">
      <span className="legend-title">Basis Indicators:</span>
      <span className="basis-badge basis-fact">[Fact]</span>
      <span className="legend-desc">Explicitly stated in problem data</span>
      <span className="basis-badge basis-inference">[Inference]</span>
      <span className="legend-desc">Reasonable contextual possibility</span>
      <span className="basis-badge basis-unknown">[Unknown]</span>
      <span className="legend-desc">Genuinely unknown or unconfirmed</span>
    </div>
  );
}
