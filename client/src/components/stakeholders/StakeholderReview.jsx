import React from "react";
import StakeholderCard from "./StakeholderCard.jsx";
import AddStakeholderForm from "./AddStakeholderForm.jsx";

export default function StakeholderReview({
  stakeholders,
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
  const keptCount = stakeholders.filter((s) => s.kept).length;

  return (
    <div className="stakeholder-review">
      <p className="review-intro">
        Review, edit, add, or remove stakeholders. You have final authority over this list.
      </p>

      <div className="stakeholder-list">
        {stakeholders.map((s) => (
          <StakeholderCard
            key={s.id}
            stakeholder={s}
            isEditing={editingId === s.id}
            editForm={editForm}
            setEditForm={setEditForm}
            onSaveEdit={onSaveEdit}
            onCancelEditing={onCancelEditing}
            onToggleKeep={onToggleKeep}
            onStartEditing={onStartEditing}
            onRemove={onRemove}
          />
        ))}
      </div>

      <AddStakeholderForm
        newStakeholder={newStakeholder}
        setNewStakeholder={setNewStakeholder}
        addError={addError}
        onAddStakeholder={onAddStakeholder}
      />

      <div className="confirm-row">
        <button
          type="button"
          className="confirm-btn"
          onClick={onConfirm}
          disabled={keptCount === 0}
          aria-label="Confirm stakeholder list"
        >
          Confirm Stakeholder List ({keptCount})
        </button>
      </div>
    </div>
  );
}
