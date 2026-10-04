import React from "react";

export default function ConfirmedStakeholderList({
  confirmedStakeholders,
  onReEdit,
  perspectives,
  loadingPerspectives,
  perspectiveError,
  onGeneratePerspectives
}) {
  return (
    <div className="confirmed-section">
      <div className="confirmed-header">
        <h3>Confirmed Stakeholder List ({confirmedStakeholders.length})</h3>
        <button
          type="button"
          className="secondary-btn"
          onClick={onReEdit}
          aria-label="Edit confirmed stakeholders"
        >
          Edit Stakeholders
        </button>
      </div>

      {confirmedStakeholders.length === 0 ? (
        <p className="empty-text">No stakeholders confirmed yet.</p>
      ) : (
        <div className="stakeholder-list">
          {confirmedStakeholders.map((s) => (
            <div key={s.id} className="stakeholder-card confirmed-card">
              <div className="stakeholder-header">
                <h4 className="stakeholder-name">{s.name}</h4>
                <div className="badge-group">
                  <span className={`badge relevance-${s.relevance}`}>
                    {s.relevance}
                  </span>
                  <span className={`badge source-${s.source || "ai"}`}>
                    {s.source === "user" ? "user-added" : "ai"}
                  </span>
                </div>
              </div>
              <p className="stakeholder-reason">{s.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Step 4: Perspective Generation Trigger */}
      {!perspectives && (
        <div className="generate-perspectives-box">
          <p className="generate-text">
            Generate structured, uncertainty-aware perspectives for each of your confirmed stakeholders.
          </p>
          <button
            type="button"
            className="confirm-btn"
            onClick={onGeneratePerspectives}
            disabled={loadingPerspectives || confirmedStakeholders.length === 0}
            aria-label="Generate perspectives for confirmed stakeholders"
          >
            {loadingPerspectives
              ? "Generating perspectives..."
              : `Generate Perspectives (${confirmedStakeholders.length})`}
          </button>
        </div>
      )}

      {loadingPerspectives && (
        <div className="loading-box" role="status" aria-live="polite">
          <p>Generating perspectives...</p>
        </div>
      )}

      {perspectiveError && (
        <div className="error-box" role="alert">
          <strong>Error: </strong> {perspectiveError}
          <div style={{ marginTop: "8px" }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onGeneratePerspectives}
              aria-label="Retry perspective generation"
            >
              Retry Perspective Generation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
