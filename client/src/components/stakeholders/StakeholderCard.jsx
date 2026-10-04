import React from "react";
import StakeholderEditForm from "./StakeholderEditForm.jsx";

export default function StakeholderCard({
  stakeholder,
  isEditing,
  editForm,
  setEditForm,
  onSaveEdit,
  onCancelEditing,
  onToggleKeep,
  onStartEditing,
  onRemove
}) {
  const s = stakeholder;

  return (
    <div
      className={`stakeholder-card ${s.kept ? "card-kept" : "card-excluded"}`}
    >
      {isEditing ? (
        <StakeholderEditForm
          stakeholder={s}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={onSaveEdit}
          onCancel={onCancelEditing}
        />
      ) : (
        <>
          <div className="stakeholder-header">
            <h4 className="stakeholder-name">{s.name}</h4>
            <div className="badge-group">
              <span className={`badge relevance-${s.relevance}`}>
                {s.relevance}
              </span>
              <span className={`badge source-${s.source || "ai"}`}>
                {s.source === "user" ? "user-added" : "ai"}
              </span>
            </div>
          </div>

          <p className="stakeholder-reason">{s.reason}</p>

          <div className="card-actions">
            <button
              type="button"
              className={`action-btn ${s.kept ? "btn-keep-active" : "btn-keep"}`}
              onClick={() => onToggleKeep(s.id)}
              aria-label={`${s.kept ? "Exclude" : "Keep"} ${s.name}`}
            >
              {s.kept ? "✓ Kept" : "Keep"}
            </button>
            <button
              type="button"
              className="action-btn btn-edit"
              onClick={() => onStartEditing(s)}
              aria-label={`Edit ${s.name}`}
            >
              Edit
            </button>
            <button
              type="button"
              className="action-btn btn-remove"
              onClick={() => onRemove(s.id)}
              aria-label={`Remove ${s.name}`}
            >
              Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}
