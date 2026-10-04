import React from "react";

export default function ShiftSelector({
  confirmedStakeholders,
  activeStakeholderId,
  onShiftPerspective
}) {
  return (
    <div className="shift-container">
      <div className="shift-header">
        <span className="shift-tag">SHIFT</span>
        <h2 className="shift-title">SHIFT YOUR PERSPECTIVE</h2>
      </div>
      <p className="shift-microcopy">
        SHIFT between stakeholder perspectives to explore how the same decision may look different depending on who is affected.
      </p>

      <div
        className="shift-tabs"
        role="tablist"
        aria-label="Stakeholder Perspectives Selector"
      >
        {confirmedStakeholders.map((s) => {
          const isActive = s.id === activeStakeholderId;
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`shift-tab-${s.id}`}
              aria-selected={isActive}
              aria-controls={`shift-panel-${s.id}`}
              aria-label={`Switch to ${s.name} perspective`}
              tabIndex={0}
              className={`shift-tab-btn ${isActive ? "shift-tab-active" : ""}`}
              onClick={() => onShiftPerspective(s.id)}
            >
              <span className="tab-indicator" aria-hidden="true">
                {isActive ? "● " : "○ "}
              </span>
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
