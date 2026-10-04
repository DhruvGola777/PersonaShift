import React from "react";

export default function DependenciesCard({ dependencies, getStakeholderName }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <h3>Dependencies</h3>
        <span className="comparison-card-desc">
          Where one stakeholder's outcomes or concerns depend on another stakeholder or system
        </span>
      </div>
      {dependencies && dependencies.length > 0 ? (
        <div className="dependencies-list">
          {dependencies.map((dep, idx) => (
            <div key={idx} className="dependency-card">
              <p className="dependency-desc">{dep.description}</p>
              <div className="dependency-stakeholders">
                <span className="dependency-label">Involved Stakeholders:</span>
                <div className="dependency-badges">
                  {dep.stakeholders.map((sId, sIdx) => (
                    <span key={sIdx} className="dependency-stakeholder-badge">
                      {getStakeholderName(sId)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-comparison-text">
          No clear dependencies were identified from the available information.
        </p>
      )}
    </div>
  );
}
