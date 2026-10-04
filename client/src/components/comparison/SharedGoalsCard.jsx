import React from "react";

export default function SharedGoalsCard({ sharedGoals }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <h3>Shared Goals</h3>
        <span className="comparison-card-desc">
          Goals that appear meaningfully shared across two or more stakeholder perspectives
        </span>
      </div>
      {sharedGoals && sharedGoals.length > 0 ? (
        <ul className="comparison-list">
          {sharedGoals.map((goal, idx) => (
            <li key={idx} className="comparison-list-item shared-goal-item">
              <span className="goal-bullet">•</span>
              <span className="item-text">{goal}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-comparison-text">
          No clear shared goals were identified from the available information.
        </p>
      )}
    </div>
  );
}
