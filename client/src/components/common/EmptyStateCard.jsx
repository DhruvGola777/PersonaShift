import React from "react";

export default function EmptyStateCard({ text, role = "region", ariaLabel }) {
  return (
    <div className="empty-state-card" role={role} aria-label={ariaLabel}>
      <p className="empty-state-text">{text}</p>
    </div>
  );
}
