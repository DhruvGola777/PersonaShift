import React from "react";
import ShiftDecisionBanner from "./ShiftDecisionBanner.jsx";
import ShiftSelector from "./ShiftSelector.jsx";
import PerspectiveCard from "./PerspectiveCard.jsx";

export default function ShiftExperience({
  problemResult,
  confirmedStakeholders,
  resolvedStakeholder,
  resolvedPerspective,
  onShiftPerspective,
  audioCache,
  audioLoadingId,
  audioErrorMap,
  onGenerateAudio
}) {
  if (!problemResult || !confirmedStakeholders) return null;

  return (
    <>
      {/* Context Preservation: Decision Banner */}
      <ShiftDecisionBanner
        decision={problemResult.decision}
        domain={problemResult.domain}
      />

      {/* Central SHIFT Control */}
      <ShiftSelector
        confirmedStakeholders={confirmedStakeholders}
        activeStakeholderId={resolvedStakeholder?.id}
        onShiftPerspective={onShiftPerspective}
      />

      {/* Active Perspective Display */}
      {resolvedStakeholder && resolvedPerspective && (
        <PerspectiveCard
          resolvedStakeholder={resolvedStakeholder}
          resolvedPerspective={resolvedPerspective}
          audioCache={audioCache}
          audioLoadingId={audioLoadingId}
          audioErrorMap={audioErrorMap}
          onGenerateAudio={onGenerateAudio}
        />
      )}
    </>
  );
}
