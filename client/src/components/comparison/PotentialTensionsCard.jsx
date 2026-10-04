import React from "react";

export default function PotentialTensionsCard({ tensions, getStakeholderName }) {
  return (
    <div className="comparison-card">
      <div className="comparison-card-header">
        <h3>Potential Tensions</h3>
        <span className="comparison-card-desc">
          Situations where two or more priorities may create tension or pull the decision in different directions
        </span>
      </div>
      {tensions && tensions.length > 0 ? (
        <div className="tensions-list">
          {tensions.map((tension, idx) => (
            <div key={idx} className="tension-card">
              <div className="tension-card-header">
                <h4 className="tension-title">{tension.title}</h4>
                {tension.stakeholderIds && tension.stakeholderIds.length > 0 && (
                  <span className="tension-stakeholders-badge">
                    {tension.stakeholderIds.map((id) => getStakeholderName(id)).join(" ↔ ")}
                  </span>
                )}
              </div>
              <p className="tension-explanation">{tension.explanation}</p>
              {tension.affectedPriorities && tension.affectedPriorities.length > 0 && (
                <div className="tension-affected">
                  <span className="tension-affected-label">Affected Priorities:</span>
                  <ul className="affected-list">
                    {tension.affectedPriorities.map((ap, apIdx) => (
                      <li key={apIdx} className="affected-item">{ap}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-comparison-text">
          No clear potential tensions were identified from the available information.
        </p>
      )}
    </div>
  );
}
