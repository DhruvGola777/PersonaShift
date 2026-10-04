import React from "react";

export default function DifferentPrioritiesCard({ differentPriorities, getStakeholderName }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <h3>Different Priorities</h3>
        <span className="comparison-card-desc">
          Areas where stakeholder priorities may differ or emphasize distinct aspects
        </span>
      </div>
      {differentPriorities && differentPriorities.length > 0 ? (
        <div className="priorities-grid">
          {differentPriorities.map((dp, idx) => (
            <div key={idx} className="priority-card">
              <h4 className="priority-topic">{dp.topic}</h4>
              <div className="priority-columns">
                <div className="priority-column">
                  <div className="priority-party-label">
                    {dp.stakeholderAId ? getStakeholderName(dp.stakeholderAId) : "Perspective A"}
                  </div>
                  <p className="priority-perspective-text">{dp.perspectiveA}</p>
                </div>
                <div className="priority-divider" aria-hidden="true">vs</div>
                <div className="priority-column">
                  <div className="priority-party-label">
                    {dp.stakeholderBId ? getStakeholderName(dp.stakeholderBId) : "Perspective B"}
                  </div>
                  <p className="priority-perspective-text">{dp.perspectiveB}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-comparison-text">
          No clear different priorities were identified from the available information.
        </p>
      )}
    </div>
  );
}
