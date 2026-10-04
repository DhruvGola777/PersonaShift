import React from "react";
import ConfirmedStakeholderList from "./ConfirmedStakeholderList.jsx";
import StakeholderReview from "./StakeholderReview.jsx";

export default function StakeholdersSection({
  problemResult,
  stakeholders,
  loadingStakeholders,
  stakeholderError,
  confirmedStakeholders,
  onFetchStakeholders,
  onReEdit,
  perspectives,
  loadingPerspectives,
  perspectiveError,
  onGeneratePerspectives,
  editingId,
  editForm,
  setEditForm,
  onSaveEdit,
  onCancelEditing,
  onToggleKeep,
  onStartEditing,
  onRemove,
  newStakeholder,
  setNewStakeholder,
  addError,
  onAddStakeholder,
  onConfirm
}) {
  return (
    <div className="stakeholders-wrapper">
      <div className="section-header">
        <h2>Stakeholders</h2>
        {!loadingStakeholders && stakeholders.length === 0 && !stakeholderError && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => onFetchStakeholders(problemResult)}
            aria-label="Discover stakeholders"
          >
            Discover Stakeholders
          </button>
        )}
      </div>

      {loadingStakeholders && (
        <div className="loading-box" role="status" aria-live="polite">
          <p>Mapping stakeholders...</p>
        </div>
      )}

      {stakeholderError && (
        <div className="error-box" role="alert">
          <strong>Error: </strong> {stakeholderError}
          <div style={{ marginTop: "8px" }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => onFetchStakeholders(problemResult)}
              aria-label="Retry discovering stakeholders"
            >
              Retry Discovery
            </button>
          </div>
        </div>
      )}

      {confirmedStakeholders ? (
        <ConfirmedStakeholderList
          confirmedStakeholders={confirmedStakeholders}
          onReEdit={onReEdit}
          perspectives={perspectives}
          loadingPerspectives={loadingPerspectives}
          perspectiveError={perspectiveError}
          onGeneratePerspectives={onGeneratePerspectives}
        />
      ) : (
        !loadingStakeholders &&
        stakeholders.length > 0 && (
          <StakeholderReview
            stakeholders={stakeholders}
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onSaveEdit={onSaveEdit}
            onCancelEditing={onCancelEditing}
            onToggleKeep={onToggleKeep}
            onStartEditing={onStartEditing}
            onRemove={onRemove}
            newStakeholder={newStakeholder}
            setNewStakeholder={setNewStakeholder}
            addError={addError}
            onAddStakeholder={onAddStakeholder}
            onConfirm={onConfirm}
          />
        )
      )}
    </div>
  );
}
