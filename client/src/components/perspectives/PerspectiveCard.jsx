import React from "react";
import PerspectiveAudio from "./PerspectiveAudio.jsx";
import PerspectiveCategory from "./PerspectiveCategory.jsx";
import BasisLegend from "./BasisLegend.jsx";

export default function PerspectiveCard({
  resolvedStakeholder,
  resolvedPerspective,
  audioCache,
  audioLoadingId,
  audioErrorMap,
  onGenerateAudio
}) {
  if (!resolvedStakeholder || !resolvedPerspective) return null;

  return (
    <div
      className="perspective-card"
      id={`shift-panel-${resolvedStakeholder.id}`}
      role="tabpanel"
      aria-labelledby={`shift-tab-${resolvedStakeholder.id}`}
    >
      {/* Header with Neutral Framing */}
      <div className="perspective-card-header">
        <div>
          <span className="perspective-eyebrow">CURRENT PERSPECTIVE</span>
          <h3 className="perspective-title">{resolvedStakeholder.name}</h3>
        </div>
        <div className="badge-group">
          <span className={`badge relevance-${resolvedStakeholder.relevance}`}>
            {resolvedStakeholder.relevance}
          </span>
          <span className={`badge source-${resolvedStakeholder.source || "ai"}`}>
            {resolvedStakeholder.source === "user" ? "user-added" : "ai"}
          </span>
        </div>
      </div>

      {/* Reused Milestone 2 Stakeholder Context */}
      <div className="perspective-inclusion-context">
        <span className="inclusion-label">Why this perspective is included:</span>
        <p className="inclusion-reason">{resolvedStakeholder.reason}</p>
      </div>

      <div className="perspective-framing-banner">
        <p className="framing-text">
          Possible factors shaping this perspective
        </p>
      </div>

      {/* Multimodal Perspective Audio Narration */}
      <PerspectiveAudio
        stakeholder={resolvedStakeholder}
        perspective={resolvedPerspective}
        audioCache={audioCache}
        audioLoadingId={audioLoadingId}
        audioErrorMap={audioErrorMap}
        onGenerateAudio={onGenerateAudio}
      />

      {/* 5 Categories Grid */}
      <div className="categories-grid">
        <PerspectiveCategory
          title="Goals"
          description="Potential outcomes that may matter to this stakeholder"
          items={resolvedPerspective.goals}
        />
        <PerspectiveCategory
          title="Concerns"
          description="Potential risks, downsides, or negative outcomes"
          items={resolvedPerspective.concerns}
        />
        <PerspectiveCategory
          title="Constraints"
          description="Conditions or limitations affecting this stakeholder"
          items={resolvedPerspective.constraints}
        />
        <PerspectiveCategory
          title="Incentives"
          description="Factors that could shape behavior or position"
          items={resolvedPerspective.incentives}
        />
        <PerspectiveCategory
          title="Priorities"
          description="Factors prioritized when evaluating the decision"
          items={resolvedPerspective.priorities}
        />
      </div>

      {/* Accessible Basis Legend */}
      <BasisLegend />
    </div>
  );
}
