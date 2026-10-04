import React from "react";

export default function PerspectiveCategory({ title, description, items }) {
  return (
    <div className="category-card">
      <div className="category-header">
        <h4>{title}</h4>
        <span className="category-desc">{description}</span>
      </div>
      <ul className="items-list">
        {items.map((item, idx) => (
          <li key={idx} className="perspective-item">
            <span
              className={`basis-badge basis-${item.basis}`}
              title={`Basis: ${item.basis}`}
            >
              [{item.basis}]
            </span>
            <span className="item-text">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
