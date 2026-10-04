import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-masthead">
        <div className="brand-meta">
          <span className="brand-badge">DECISION ANALYSIS WORKSTATION</span>
          <span className="brand-version">LOVHACK S3</span>
        </div>
        <div className="brand-title-row">
          <h1 className="brand-title">PersonaShift</h1>
        </div>
        <p className="subtitle">
          See the decision from every side before choosing a path.
        </p>
        <p className="workflow-supporting-line">
          Map who is affected. Shift perspectives. Compare tensions. Explore trade-offs.
        </p>
      </div>

      <div className="workflow-pipeline" aria-label="PersonaShift 4-Stage Decision Workflow">
        <div className="workflow-step">
          <span className="step-num">01</span>
          <div className="step-text">
            <span className="step-title">MAP</span>
            <span className="step-desc">Affected parties</span>
          </div>
        </div>

        <span className="workflow-divider" aria-hidden="true">→</span>

        <div className="workflow-step workflow-step-shift">
          <span className="step-num">02</span>
          <div className="step-text">
            <div className="step-title-wrap">
              <span className="step-title">SHIFT</span>
              <span className="shift-indicator-tag">SIGNATURE</span>
            </div>
            <span className="step-desc">Zero-lag perspective lens</span>
          </div>
        </div>

        <span className="workflow-divider" aria-hidden="true">→</span>

        <div className="workflow-step">
          <span className="step-num">03</span>
          <div className="step-text">
            <span className="step-title">COMPARE</span>
            <span className="step-desc">Systemic tensions</span>
          </div>
        </div>

        <span className="workflow-divider" aria-hidden="true">→</span>

        <div className="workflow-step">
          <span className="step-num">04</span>
          <div className="step-text">
            <span className="step-title">EXPLORE</span>
            <span className="step-desc">Grounded trade-offs</span>
          </div>
        </div>
      </div>
    </header>
  );
}


