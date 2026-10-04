import React from "react";
import ApproachCard from "./ApproachCard.jsx";
import EmptyStateCard from "../common/EmptyStateCard.jsx";

export default function ExplorationSection({
  exploration,
  explorationLoading,
  explorationError,
  explorationStale,
  onExplore,
  getStakeholderName
}) {
  return (
    <div className="exploration-section" id="exploration-section">
      <div className="exploration-trigger-box">
        <div className="exploration-trigger-content">
          <div className="exploration-header-row">
            <span className="exploration-tag">EXPLORATION</span>
            <h2 className="exploration-title">EXPLORE ALTERNATIVE APPROACHES</h2>
          </div>
          <p className="exploration-subtitle">
            These are alternative approaches generated from the perspectives, priorities, tensions, and dependencies above. They are not ranked or recommended.
          </p>

          {explorationStale && (
            <div className="stale-warning-banner" role="alert">
              <span className="stale-icon">⚠️</span>
              <span className="stale-text">
                These results were generated from an earlier version of your stakeholders or comparison. Regenerate to continue.
              </span>
            </div>
          )}

          <div className="exploration-actions">
            <button
              type="button"
              className="btn btn-explore"
              onClick={onExplore}
              disabled={explorationLoading}
              aria-label="Explore alternative approaches"
            >
              {explorationLoading
                ? "Exploring approaches..."
                : exploration
                ? explorationStale
                  ? "Regenerate Outdated Approaches"
                  : "Re-explore Approaches"
                : "Explore Approaches"}
            </button>
          </div>

          {explorationError && (
            <div className="error-box exploration-error-box" role="alert">
              <span>{explorationError}</span>
              <button
                type="button"
                className="btn-retry"
                onClick={onExplore}
                disabled={explorationLoading}
                aria-label="Retry exploration"
              >
                Retry Exploration
              </button>
            </div>
          )}
        </div>
      </div>

      {!exploration && !explorationLoading && (
        <EmptyStateCard
          text="Explore possible approaches after comparing the perspectives."
          ariaLabel="Exploration status"
        />
      )}

      {exploration && (
        <div className="exploration-results">
          <div className="approaches-list">
            {exploration.approaches.map((approach, idx) => (
              <ApproachCard
                key={approach.id || idx}
                approach={approach}
                index={idx}
                getStakeholderName={getStakeholderName}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
