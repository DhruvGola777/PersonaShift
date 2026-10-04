import React from "react";
import SharedGoalsCard from "./SharedGoalsCard.jsx";
import DifferentPrioritiesCard from "./DifferentPrioritiesCard.jsx";
import PotentialTensionsCard from "./PotentialTensionsCard.jsx";
import DependenciesCard from "./DependenciesCard.jsx";
import EmptyStateCard from "../common/EmptyStateCard.jsx";

export default function ComparisonSection({
  comparison,
  loadingComparison,
  comparisonError,
  isComparisonStale,
  onCompare,
  getStakeholderName
}) {
  return (
    <div className="comparison-section" id="comparison-section">
      <div className="comparison-trigger-box">
        <div className="comparison-trigger-content">
          <div className="comparison-header-row">
            <span className="comparison-tag">COMPARISON</span>
            <h2 className="comparison-title">COMPARE PERSPECTIVES</h2>
          </div>
          <p className="comparison-subtitle">
            Analyze shared goals, different priorities, potential tensions, and dependencies across all confirmed stakeholder perspectives.
          </p>

          {isComparisonStale && (
            <div className="stale-warning-banner" role="alert">
              <span className="stale-icon">⚠️</span>
              <span className="stale-text">
                These results were generated from an earlier version of your stakeholders. Regenerate to continue.
              </span>
            </div>
          )}

          <div className="comparison-actions">
            <button
              type="button"
              className="btn btn-compare"
              onClick={onCompare}
              disabled={loadingComparison}
              aria-label="Compare confirmed perspectives"
            >
              {loadingComparison
                ? "Comparing perspectives..."
                : comparison
                ? isComparisonStale
                  ? "Regenerate Outdated Comparison"
                  : "Re-analyze Comparison"
                : "Compare Perspectives"}
            </button>
          </div>

          {comparisonError && (
            <div className="error-box comparison-error-box" role="alert">
              <span>{comparisonError}</span>
              <button
                type="button"
                className="btn-retry"
                onClick={onCompare}
                disabled={loadingComparison}
                aria-label="Retry comparison"
              >
                Retry Comparison
              </button>
            </div>
          )}
        </div>
      </div>

      {!comparison && !loadingComparison && (
        <EmptyStateCard
          text="Compare the confirmed perspectives to surface shared goals, differences, tensions, and dependencies."
          ariaLabel="Comparison status"
        />
      )}

      {comparison && (
        <div className="comparison-results">
          <SharedGoalsCard sharedGoals={comparison.sharedGoals} />

          <DifferentPrioritiesCard
            differentPriorities={comparison.differentPriorities}
            getStakeholderName={getStakeholderName}
          />

          <PotentialTensionsCard
            tensions={comparison.tensions}
            getStakeholderName={getStakeholderName}
          />

          <DependenciesCard
            dependencies={comparison.dependencies}
            getStakeholderName={getStakeholderName}
          />
        </div>
      )}
    </div>
  );
}
